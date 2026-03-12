import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import KPICard from './components/KPICard';
import DateRangePicker from './components/DateRangePicker';
import ThreatDistributionChart from './components/ThreatDistributionChart';
import MalwareFamilyChart from './components/MalwareFamilyChart';
import ResponseTimeChart from './components/ResponseTimeChart';
import TopSenderDomains from './components/TopSenderDomains';
import MLModelPerformance from './components/MLModelPerformance';
import EmailVolumeAnalytics from './components/EmailVolumeAnalytics';
import FilterPanel from './components/FilterPanel';
import Icon from '../../components/AppIcon';

import { getAnalyticsData } from '../../services/analyticsService';

const SecurityAnalyticsHub = () => {
  const [selectedRange, setSelectedRange] = useState('30d');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filters, setFilters] = useState({ department: 'all', team: 'all', threatType: 'all' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [kpiData, setKpiData] = useState([]);
  const [threatDistributionData, setThreatDistributionData] = useState([]);
  const [emailVolumeData, setEmailVolumeData] = useState([]);
  const [topSenderDomains, setTopSenderDomains] = useState([]);
  const [malwareFamilyData, setMalwareFamilyData] = useState([]);
  const [responseTimeData, setResponseTimeData] = useState([]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsData();
      setKpiData(data.kpis);
      setThreatDistributionData(data.threatDistribution);
      setEmailVolumeData(data.emailVolume);
      setTopSenderDomains(data.topDomains);
      setMalwareFamilyData(data.malwareFamilyData);
      setResponseTimeData(data.responseTimeData);
      setLastUpdate(new Date());
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to load dashboard data.';
      setError(`Error: ${message}`);
      console.error('Analytics load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(() => {
      loadAnalytics();
    }, 900000); // 15 mins

    return () => clearInterval(interval);
  }, []);

  const mlModelPerformance = [
    { name: 'Deep Learning Classifier', accuracy: 97.8, falsePositive: 0.9, status: 'Active' },
    { name: 'Random Forest Detector', accuracy: 96.5, falsePositive: 1.2, status: 'Active' },
    { name: 'Neural Network Analyzer', accuracy: 95.9, falsePositive: 1.5, status: 'Active' },
    { name: 'Ensemble Model', accuracy: 98.2, falsePositive: 0.7, status: 'Active' },
    { name: 'Legacy Heuristic Engine', accuracy: 89.4, falsePositive: 3.2, status: 'Deprecated' }
  ];

  const handleRangeChange = (range) => {
    setSelectedRange(range);
  };

  const handleComparisonToggle = () => {
    setComparisonMode(!comparisonMode);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 60000);
    if (diff <= 0) return 'Just now';
    if (diff === 1) return '1 minute ago';
    return `${diff} minutes ago`;
  };

  return (
    <>
      <Helmet>
        <title>Security Analytics Hub - MailStreak</title>
        <meta name="description" content="Comprehensive threat landscape analysis and historical trend insights for strategic security decision-making" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-[60px] lg:pt-[60px]">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Security Analytics Hub</h1>
                <p className="text-sm md:text-base text-muted-foreground font-caption mt-2">
                  Comprehensive threat landscape analysis and historical trends
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <DateRangePicker
                  selectedRange={selectedRange}
                  onRangeChange={handleRangeChange}
                  comparisonMode={comparisonMode}
                  onComparisonToggle={handleComparisonToggle}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-6 p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-warning animate-pulse' : 'bg-success animate-pulse-glow'}`} />
                <span className="text-sm text-muted-foreground font-caption">
                  {isLoading ? 'Fetching real-time data...' : `Last updated: ${formatLastUpdate()}`}
                </span>
                {error && <span className="text-sm text-destructive ml-4">{error}</span>}
              </div>
              <button 
                onClick={loadAnalytics}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-md bg-background hover:bg-muted transition-smooth disabled:opacity-50"
              >
                <Icon name="RefreshCw" size={16} className={`text-primary ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm text-foreground hidden sm:inline">Refresh Data</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {kpiData?.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>

            <div className="mb-6 md:mb-8">
              <FilterPanel onFilterChange={handleFilterChange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-8 space-y-4 md:space-y-6">
                <ThreatDistributionChart data={threatDistributionData} />
                <MalwareFamilyChart data={malwareFamilyData} />
                <ResponseTimeChart data={responseTimeData} />
              </div>

              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                <TopSenderDomains domains={topSenderDomains} />
                <MLModelPerformance models={mlModelPerformance} />
              </div>
            </div>

            <div className="mb-6 md:mb-8">
              <EmailVolumeAnalytics data={emailVolumeData} />
            </div>

            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Icon name="Info" size={20} className="text-accent" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Data Refresh Interval</p>
                    <p className="text-xs text-muted-foreground font-caption mt-1">
                      Analytics data refreshes automatically every 15 minutes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
                    <Icon name="Download" size={16} />
                    <span className="text-sm">Export Report</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-smooth">
                    <Icon name="Share2" size={16} />
                    <span className="text-sm">Share Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default SecurityAnalyticsHub;