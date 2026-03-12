import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import EmailListTable from './components/EmailListTable';
import FilterSidebar from './components/FilterSidebar';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { startEmailScan, createScanEventSource, getEmailScanStatus, parseEmailHeaders } from '../../services/emailScanService';
import { startTraining, getTrainingStatus, getTrainingHistory, seedData } from '../../services/mlService';
import { getEmails, getEmailCount } from '../../services/emailsService';
import {
  getTrainingReviewQueue,
  reviewTrainingSubmission,
  createWhitelistRequest,
  listWhitelistRequests,
  reviewWhitelistRequest,
  directWhitelist,
  listSafeEmails,
  analyzeSafeEmail,
} from '../../services/governanceService';
import { getCurrentUser } from '../../utils/auth';

const EmailAnalysis = () => {
  const currentUser = getCurrentUser();
  const [emails, setEmails] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [emailCount, setEmailCount] = useState(0);
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: '7d',
    senderDomain: '',
    threatTypes: [],
    riskScoreMin: 0,
    riskScoreMax: 100
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ field: 'timestamp', direction: 'desc' });
  const itemsPerPage = 10;
  const [scanSubject, setScanSubject] = useState('');
  const [scanSender, setScanSender] = useState('');
  const [scanContent, setScanContent] = useState('');
  const [headerAnalysis, setHeaderAnalysis] = useState(null);
  const [isParsingHeaders, setIsParsingHeaders] = useState(false);
  const [headerParseError, setHeaderParseError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStage, setTrainingStage] = useState('');
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingReviewQueue, setTrainingReviewQueue] = useState([]);
  const [whitelistRequests, setWhitelistRequests] = useState([]);
  const [safeEmails, setSafeEmails] = useState([]);
  const [governanceMessage, setGovernanceMessage] = useState('');
  const [scanWhitelistRequested, setScanWhitelistRequested] = useState(false);
  const [datasetSize, setDatasetSize] = useState(2000);
  const scanSourceRef = useRef(null);
  const scanPollRef = useRef(null);

  const loadEmails = async () => {
    try {
      const res = await getEmails({ limit: 200, offset: 0 });
      const list = res?.emails || [];
      setEmails(list);
    } catch {
      setEmails([]);
    }
  };

  const loadEmailCount = async () => {
    try {
      const res = await getEmailCount();
      setEmailCount(res?.count ?? 0);
    } catch {
      setEmailCount(0);
    }
  };

  const loadTrainingHistory = async () => {
    try {
      const res = await getTrainingHistory();
      setTrainingHistory(res?.history || []);
    } catch {
      setTrainingHistory([]);
    }
  };

  const loadGovernanceData = async () => {
    try {
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
        const queueRes = await getTrainingReviewQueue();
        setTrainingReviewQueue(queueRes?.reviews || []);
        const wlRes = await listWhitelistRequests();
        setWhitelistRequests(wlRes?.requests || []);
        const safeRes = await listSafeEmails();
        setSafeEmails(safeRes?.safeEmails || []);
      } else if (currentUser?.role === 'USER') {
        const wlRes = await listWhitelistRequests();
        setWhitelistRequests(wlRes?.requests || []);
      }
    } catch (_) {
      // ignore governance refresh failures to keep page usable
    }
  };

  useEffect(() => {
    loadEmails();
    loadEmailCount();
    loadTrainingHistory();
    loadGovernanceData();

    const interval = setInterval(() => {
      loadEmails();
      loadEmailCount();
    }, 180000); // 3-minute forensic refresh

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (scanSourceRef.current) {
        scanSourceRef.current.close();
      }
      if (scanPollRef.current) {
        clearTimeout(scanPollRef.current);
      }
    };
  }, []);

  
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev?.field === field && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEmailSelect = (emailId) => {
    setSelectedEmails(prev =>
      prev?.includes(emailId)
        ? prev?.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmails?.length === filteredAndSortedEmails?.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredAndSortedEmails?.map(email => email?.id));
    }
  };

  const handleExpandEmail = (emailId) => {
    setExpandedEmailId(prev => prev === emailId ? null : emailId);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} on ${selectedEmails?.length} emails`);
    setSelectedEmails([]);
  };

  const handleHeaderParse = async (content) => {
    const nextContent = content || '';
    if (!nextContent.trim()) {
      setHeaderAnalysis(null);
      setHeaderParseError('');
      return;
    }

    setIsParsingHeaders(true);
    setHeaderParseError('');
    try {
      const res = await parseEmailHeaders(nextContent);
      const parsed = res?.headerAnalysis || null;
      setHeaderAnalysis(parsed);
      if (parsed?.hasHeaders) {
        const nextSender = parsed?.fields?.fromEmail || '';
        const nextSubject = parsed?.fields?.subject || '';
        if (nextSender) setScanSender(nextSender);
        if (nextSubject) setScanSubject(nextSubject);
      }
    } catch (_) {
      setHeaderParseError('Header parsing failed. You can still scan manually.');
    } finally {
      setIsParsingHeaders(false);
    }
  };

  const handleScanContentPaste = async (event) => {
    const pasted = event?.clipboardData?.getData('text') || '';
    if (!pasted) return;
    event.preventDefault();
    setScanContent(pasted);
    await handleHeaderParse(pasted);
  };

  const handleStartScan = async () => {
    setScanError('');
    setScanResult(null);
    setScanWhitelistRequested(false);
    if (!scanContent?.trim()) {
      setScanError('Email content is required to start a scan.');
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanStage('queued');

    try {
      const response = await startEmailScan({
        emailContent: scanContent,
        subject: scanSubject,
        metadata: {
          sender: scanSender,
          header_analysis: headerAnalysis,
        },
      });
      const { scan_id: scanId } = response;

      if (scanSourceRef.current) {
        scanSourceRef.current.close();
      }

      const eventSource = createScanEventSource(scanId);
      scanSourceRef.current = eventSource;

      const pollStatus = async () => {
        try {
          const status = await getEmailScanStatus(scanId);
          if (status?.progress !== undefined) {
            setScanProgress(status.progress ?? 0);
          }
          if (status?.stage) {
            setScanStage(status.stage || '');
          }
          if (status?.status === 'completed') {
            setScanResult(status?.result || null);
            setIsScanning(false);
            if (scanPollRef.current) {
              clearTimeout(scanPollRef.current);
              scanPollRef.current = null;
            }
            return;
          }
          if (status?.status === 'failed') {
            setScanError(status?.error || 'Scan failed.');
            setIsScanning(false);
            if (scanPollRef.current) {
              clearTimeout(scanPollRef.current);
              scanPollRef.current = null;
            }
            return;
          }
        } catch (_) {
          // ignore and retry
        }
        scanPollRef.current = setTimeout(pollStatus, 800);
      };

      pollStatus();

      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        setScanProgress(data?.progress ?? 0);
        setScanStage(data?.stage || '');
      });

      eventSource.addEventListener('completed', (event) => {
        const data = JSON.parse(event.data);
        setScanProgress(100);
        setScanStage('completed');
        setScanResult(data?.result || null);
        setIsScanning(false);
        if (scanPollRef.current) {
          clearTimeout(scanPollRef.current);
          scanPollRef.current = null;
        }
        loadEmails();
        loadEmailCount();
        eventSource.close();
      });

      eventSource.onerror = () => {
        setScanError('Realtime connection interrupted. Falling back to polling.');
        eventSource.close();
      };
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to start scan. Please try again.';
      setScanError(message);
      setIsScanning(false);
    }
  };

  const handleClearScan = () => {
    setScanSubject('');
    setScanSender('');
    setScanContent('');
    setHeaderAnalysis(null);
    setHeaderParseError('');
    setScanError('');
    setScanResult(null);
    setScanWhitelistRequested(false);
    setScanProgress(0);
    setScanStage('');
  };

  const handleStartTraining = async () => {
    setTrainingMessage('');
    setTrainingProgress(0);
    setTrainingStage('starting');
    setIsTraining(true);
    try {
      const startRes = await startTraining(datasetSize);
      if (startRes?.status === 'running' && startRes?.message) {
        setTrainingMessage(startRes.message);
      }

      let attempts = 0;
      const poll = async () => {
        attempts += 1;
        try {
          const status = await getTrainingStatus();
          setTrainingProgress(status?.progress ?? 0);
          setTrainingStage(status?.stage || '');

          if (status?.status === 'completed') {
            setTrainingMessage(status?.message || 'Training completed.');
            setIsTraining(false);
            loadTrainingHistory();
            loadEmails();
            loadEmailCount();
            return;
          }

          if (status?.status === 'failed') {
            setTrainingMessage(status?.message || 'Training failed.');
            setIsTraining(false);
            loadTrainingHistory();
            return;
          }
        } catch (_) {
          // keep polling transient errors
        }

        if (attempts < 600) {
          setTimeout(poll, 1000);
        } else {
          setTrainingMessage('Training status timeout. Please refresh history.');
          setIsTraining(false);
        }
      };
      setTimeout(poll, 300);
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Training failed.';
      setTrainingMessage(message);
      setIsTraining(false);
    }
  };

  const handleSeedData = async () => {
    setTrainingMessage('');
    try {
      const res = await seedData();
      setTrainingMessage(res?.status === 'seeded' ? `Seeded ${res?.inserted} records.` : 'Seed skipped: DB not empty.');
      loadEmails();
      loadEmailCount();
    } catch (err) {
      const message = err?.response?.data?.detail || err?.message || 'Seed failed.';
      setTrainingMessage(message);
    }
  };

  const handleTrainingReviewAction = async (reviewId, decision) => {
    setGovernanceMessage('');
    try {
      await reviewTrainingSubmission(reviewId, decision, '');
      setGovernanceMessage(`Review ${decision} saved.`);
      await loadGovernanceData();
      await loadEmails();
    } catch (err) {
      setGovernanceMessage(err?.response?.data?.detail || 'Failed to update training review.');
    }
  };

  const handleWhitelistRequest = async (email) => {
    setGovernanceMessage('');
    try {
      await createWhitelistRequest({
        emailId: email?.id,
        sender: email?.sender,
        subject: email?.subject,
        content: email?.content,
      });
      setGovernanceMessage('Whitelist request submitted.');
      setScanWhitelistRequested(true);
      await loadGovernanceData();
    } catch (err) {
      setGovernanceMessage(err?.response?.data?.detail || 'Failed to submit whitelist request.');
    }
  };

  const handleWhitelistReview = async (requestId, decision) => {
    setGovernanceMessage('');
    try {
      await reviewWhitelistRequest(requestId, decision);
      setGovernanceMessage(`Whitelist request ${decision}.`);
      await loadGovernanceData();
    } catch (err) {
      setGovernanceMessage(err?.response?.data?.detail || 'Failed to process whitelist request.');
    }
  };

  const handleDirectWhitelist = async (email) => {
    setGovernanceMessage('');
    try {
      await directWhitelist({
        sender: email?.sender,
        subject: email?.subject,
        content: email?.content,
      });
      setGovernanceMessage('Email directly added to whitelist.');
      await loadGovernanceData();
      await loadEmails();
    } catch (err) {
      setGovernanceMessage(err?.response?.data?.detail || 'Failed to whitelist email.');
    }
  };

  const handleAnalyzeSafeEmail = async (safeEmailId) => {
    setGovernanceMessage('');
    try {
      const res = await analyzeSafeEmail(safeEmailId);
      setGovernanceMessage(
        res?.safe
          ? `Safe email verified (risk ${res?.riskScore}).`
          : `Safe email re-check warning: ${res?.classification} (risk ${res?.riskScore}).`
      );
      if (res?.updated) {
        await loadEmails();
        await loadEmailCount();
      }
    } catch (err) {
      setGovernanceMessage(err?.response?.data?.detail || 'Failed to analyze safe email.');
    }
  };

  const filteredEmails = emails?.filter(email => {
    const matchesSenderDomain = !filters?.senderDomain ||
      email?.sender?.toLowerCase()?.includes(filters?.senderDomain?.toLowerCase());

    const matchesThreatType = filters?.threatTypes?.length === 0 ||
      filters?.threatTypes?.includes(email?.classification);

    const matchesRiskScore = email?.riskScore >= filters?.riskScoreMin &&
      email?.riskScore <= filters?.riskScoreMax;

    return matchesSenderDomain && matchesThreatType && matchesRiskScore;
  });

  const sortedEmails = [...filteredEmails]?.sort((a, b) => {
    const aValue = a?.[sortConfig?.field];
    const bValue = b?.[sortConfig?.field];

    if (sortConfig?.field === 'timestamp') {
      return sortConfig?.direction === 'asc'
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    }

    if (typeof aValue === 'string') {
      return sortConfig?.direction === 'asc'
        ? aValue?.localeCompare(bValue)
        : bValue?.localeCompare(aValue);
    }

    return sortConfig?.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const paginatedEmails = sortedEmails?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedEmails?.length / itemsPerPage);

  const filteredAndSortedEmails = filteredEmails;

  return (
    <>
      <Helmet>
        <title>Email Analysis | MailStreak</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[60px] lg:pt-[60px]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground font-mono">Email Analysis</h1>
                  <p className="text-sm text-muted-foreground font-caption mt-1">
                    Forensic investigation and ML-driven classification insights
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                  <Icon name="Mail" size={16} className="text-primary" />
                  <span className="text-sm font-medium text-foreground font-data">
                    {emailCount} emails
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Email Scanner</h2>
                    <p className="text-sm text-muted-foreground font-caption">
                      Paste an email body to run a real-time threat scan.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-4">
                      <Input
                        label="Email ID (From)"
                        value={scanSender}
                        onChange={(e) => setScanSender(e.target.value)}
                        placeholder="sender@example.com"
                      />
                      <div className="h-3" />
                      <Input
                        label="Subject (optional)"
                        value={scanSubject}
                        onChange={(e) => setScanSubject(e.target.value)}
                        placeholder="Subject line"
                      />
                    </div>
                    <div className="lg:col-span-8">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Content
                      </label>
                      <textarea
                        value={scanContent}
                        onChange={(e) => {
                          setScanContent(e.target.value);
                          if (!e.target.value.trim()) {
                            setHeaderAnalysis(null);
                            setHeaderParseError('');
                          }
                        }}
                        onPaste={handleScanContentPaste}
                        placeholder="Paste the email content here..."
                        rows={5}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {isParsingHeaders && (
                          <>
                            <Icon name="Loader2" size={12} className="animate-spin" />
                            <span>Analyzing headers...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {headerParseError && (
                    <div className="text-sm text-warning">{headerParseError}</div>
                  )}
                  {headerAnalysis && (
                    <div className="rounded-md border border-border bg-background/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon name="FileSearch" size={16} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">Header Analysis</span>
                        {headerAnalysis?.headerRiskDetected ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-warning/10 text-warning">Header Risk Detected</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-success/10 text-success">No Header Risk</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Message ID:</span> <span className="text-foreground">{headerAnalysis?.fields?.messageId || '-'}</span></div>
                        <div><span className="text-muted-foreground">Created At:</span> <span className="text-foreground">{headerAnalysis?.fields?.date || '-'}</span></div>
                        <div><span className="text-muted-foreground">From:</span> <span className="text-foreground">{headerAnalysis?.fields?.from || '-'}</span></div>
                        <div><span className="text-muted-foreground">To:</span> <span className="text-foreground">{headerAnalysis?.fields?.to || '-'}</span></div>
                        <div><span className="text-muted-foreground">Subject:</span> <span className="text-foreground">{headerAnalysis?.fields?.subject || '-'}</span></div>
                        <div><span className="text-muted-foreground">Relays:</span> <span className="text-foreground">{headerAnalysis?.fields?.receivedCount ?? 0}</span></div>
                        <div><span className="text-muted-foreground">SPF:</span> <span className="text-foreground">{headerAnalysis?.authentication?.spf?.status || 'NONE'}{headerAnalysis?.authentication?.spf?.ip ? ` (${headerAnalysis?.authentication?.spf?.ip})` : ''}</span></div>
                        <div><span className="text-muted-foreground">DKIM:</span> <span className="text-foreground">{headerAnalysis?.authentication?.dkim?.status || 'NONE'}{headerAnalysis?.authentication?.dkim?.domain ? ` (${headerAnalysis?.authentication?.dkim?.domain})` : ''}</span></div>
                        <div><span className="text-muted-foreground">DMARC:</span> <span className="text-foreground">{headerAnalysis?.authentication?.dmarc?.status || 'NONE'}</span></div>
                        <div><span className="text-muted-foreground">Message-ID Domain Match:</span> <span className="text-foreground">{headerAnalysis?.fields?.messageIdMatchesFromDomain ? 'Yes' : 'No / Unknown'}</span></div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Detected Anomalies</p>
                        {headerAnalysis?.anomalies?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {headerAnalysis?.anomalies?.map((item, idx) => (
                              <span key={`${item}-${idx}`} className="px-2 py-1 rounded bg-warning/10 text-warning text-[10px]">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-success">No anomalies detected.</p>
                        )}
                      </div>
                    </div>
                  )}
                  {scanError && (
                    <div className="text-sm text-destructive">{scanError}</div>
                  )}
                  {trainingMessage && (
                    <div className="text-sm text-muted-foreground">{trainingMessage}</div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Button
                      variant="default"
                      iconName="Play"
                      onClick={handleStartScan}
                      loading={isScanning}
                    >
                      Start Scan
                    </Button>
                    <Button
                      variant="ghost"
                      iconName="X"
                      onClick={handleClearScan}
                      disabled={isScanning}
                    >
                      Clear
                    </Button>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted-foreground">Dataset Size</label>
                      <input
                        type="number"
                        min="500"
                        max="10000"
                        value={datasetSize}
                        onChange={(e) => setDatasetSize(parseInt(e.target.value || '0'))}
                        className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm text-foreground"
                      />
                    </div>
                    <Button
                      variant="outline"
                      iconName="Brain"
                      onClick={handleStartTraining}
                      loading={isTraining}
                    >
                      Train Models
                    </Button>
                    <Button
                      variant="outline"
                      iconName="Database"
                      onClick={handleSeedData}
                    >
                      Seed Data
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${scanProgress}%` }}
                        />
                      </div>
                      {scanStage && (
                        <div className="mt-2 text-xs text-muted-foreground font-caption capitalize">
                          Stage: {scanStage?.replace('_', ' ')}
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                          <span>Training Progress</span>
                          <span>{trainingProgress}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${trainingProgress}%` }} />
                        </div>
                        {trainingStage && (
                          <div className="mt-2 text-xs text-muted-foreground font-caption capitalize">
                            Training Stage: {trainingStage?.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {scanResult && (
                    <div className="rounded-md border border-border bg-muted/40 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="ShieldCheck" size={18} className="text-primary" />
                        <span className="text-sm font-semibold text-foreground">Scan Result</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-caption">Classification</p>
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {scanResult?.classification}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-caption">Risk Score</p>
                          <p className="text-sm font-semibold text-foreground">
                            {scanResult?.riskScore}/100
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-caption">Model Confidence</p>
                          <p className="text-sm font-semibold text-foreground">
                            {scanResult?.mlConfidence}%
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        {scanResult?.summary}
                      </p>
                      {(scanResult?.classification === 'spam' || scanResult?.classification === 'suspicious') && (
                        <div className="mt-3 flex gap-2">
                          {currentUser?.role === 'USER' && (
                            <button
                              className="px-3 py-1.5 rounded-md bg-warning/10 text-warning text-xs disabled:opacity-60"
                              onClick={() => handleWhitelistRequest({
                                sender: 'manual@scan.local',
                                subject: scanSubject,
                                content: scanContent,
                              })}
                              disabled={scanWhitelistRequested}
                            >
                              {scanWhitelistRequested ? 'Request Send' : 'Request Whitelist'}
                            </button>
                          )}
                          {currentUser?.role === 'ADMIN' && (
                            <button
                              className="px-3 py-1.5 rounded-md bg-success/10 text-success text-xs"
                              onClick={() => handleDirectWhitelist({
                                sender: 'manual@scan.local',
                                subject: scanSubject,
                                content: scanContent,
                              })}
                            >
                              Direct Whitelist
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Training History</h3>
                  <button
                    className="px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 text-sm"
                    onClick={loadTrainingHistory}
                  >
                    Refresh
                  </button>
                </div>
                {trainingHistory?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No training runs yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Started</th>
                          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                            <th className="text-left py-2">Trained By</th>
                          )}
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Dataset Source</th>
                          <th className="text-left py-2">Dataset Size</th>
                          <th className="text-left py-2">Duration</th>
                          <th className="text-left py-2">Result</th>
                          <th className="text-left py-2">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trainingHistory?.map((run) => (
                          <tr key={run?.id} className="border-b border-border/50">
                            <td className="py-2">{new Date(run?.startedAt).toLocaleString()}</td>
                            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                              <td className="py-2">{run?.triggeredBy?.email || '-'}</td>
                            )}
                            <td className="py-2 capitalize">{run?.status}</td>
                            <td className="py-2">{run?.datasetSource || '-'}</td>
                            <td className="py-2">{run?.datasetSize}</td>
                            <td className="py-2">{run?.durationMs ? `${Math.round(run.durationMs / 1000)}s` : '-'}</td>
                            <td className="py-2">
                              {run?.result?.model ? `${run.result.model} (${run.result.datasetSize || run.datasetSize})` : '-'}
                            </td>
                            <td className="py-2">{run?.message || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {governanceMessage && (
                <div className="text-sm text-muted-foreground">{governanceMessage}</div>
              )}

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Training Review Queue</h3>
                  {trainingReviewQueue?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending review items.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2">Submitted By</th>
                            <th className="text-left py-2">Subject</th>
                            <th className="text-left py-2">Classification</th>
                            <th className="text-left py-2">Status</th>
                            {currentUser?.role === 'ADMIN' && <th className="text-left py-2">Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {trainingReviewQueue?.map((item) => (
                            <tr key={item?.id} className="border-b border-border/50">
                              <td className="py-2">{item?.submittedBy?.email}</td>
                              <td className="py-2">{item?.subject || '-'}</td>
                              <td className="py-2 capitalize">{item?.scanResult?.classification || '-'}</td>
                              <td className="py-2">{item?.status}</td>
                              {currentUser?.role === 'ADMIN' && (
                                <td className="py-2">
                                  <div className="flex gap-2">
                                    <button className="px-2 py-1 rounded bg-success/10 text-success text-xs" onClick={() => handleTrainingReviewAction(item.id, 'APPROVE_FOR_TRAINING')}>Approve</button>
                                    <button className="px-2 py-1 rounded bg-warning/10 text-warning text-xs" onClick={() => handleTrainingReviewAction(item.id, 'FALSE_POSITIVE')}>False Positive</button>
                                    <button className="px-2 py-1 rounded bg-error/10 text-error text-xs" onClick={() => handleTrainingReviewAction(item.id, 'REJECT')}>Reject</button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="card">
                <h3 className="text-lg font-semibold text-foreground mb-4">Whitelist Requests</h3>
                {whitelistRequests?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No whitelist requests.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Requester</th>
                          <th className="text-left py-2">Subject</th>
                          <th className="text-left py-2">Status</th>
                          {(currentUser?.role === 'ADMIN') && <th className="text-left py-2">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {whitelistRequests?.map((item) => (
                          <tr key={item?.id} className="border-b border-border/50">
                            <td className="py-2">{item?.requestedBy?.email}</td>
                            <td className="py-2">{item?.subject || '-'}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                item?.status === 'APPROVED' ? 'bg-success/10 text-success' :
                                item?.status === 'REJECTED' ? 'bg-error/10 text-error' :
                                'bg-warning/10 text-warning'
                              }`}>
                                {item?.status}
                              </span>
                            </td>
                            {currentUser?.role === 'ADMIN' && (
                              <td className="py-2">
                                <div className="flex gap-2">
                                  <button className="px-2 py-1 rounded bg-success/10 text-success text-xs" onClick={() => handleWhitelistReview(item.id, 'APPROVED')}>Approve</button>
                                  <button className="px-2 py-1 rounded bg-error/10 text-error text-xs" onClick={() => handleWhitelistReview(item.id, 'REJECTED')}>Reject</button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Safe Emails List</h3>
                  {safeEmails?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No whitelisted safe emails yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2">Sender</th>
                            <th className="text-left py-2">Subject</th>
                            <th className="text-left py-2">Source</th>
                            <th className="text-left py-2">Whitelisted By</th>
                            <th className="text-left py-2">Verify</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeEmails?.map((item) => (
                            <tr key={item?.id} className="border-b border-border/50">
                              <td className="py-2">{item?.sender || '-'}</td>
                              <td className="py-2">{item?.subject || '-'}</td>
                              <td className="py-2">{item?.source}</td>
                              <td className="py-2">{item?.whitelistedBy?.email}</td>
                              <td className="py-2">
                                <button
                                  className="px-2 py-1 rounded bg-primary/10 text-primary text-xs"
                                  onClick={() => handleAnalyzeSafeEmail(item.id)}
                                >
                                  Analyze Safety
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-24 gap-6">
                <div className="lg:col-span-18">
                  <EmailListTable
                    emails={paginatedEmails}
                    selectedEmails={selectedEmails}
                    expandedEmailId={expandedEmailId}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    onEmailSelect={handleEmailSelect}
                    onSelectAll={handleSelectAll}
                    onExpandEmail={handleExpandEmail}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalEmails={filteredEmails?.length}
                  />
                </div>

                <div className="lg:col-span-6">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default EmailAnalysis;
