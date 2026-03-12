import React, { useState, useEffect } from 'react';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
import MetricCard from './components/MetricCard';
import ThreatTrendChart from './components/ThreatTrendChart';
import LiveAlertFeed from './components/LiveAlertFeed';
import ThreatHeatMap from './components/ThreatHeatMap';
import TimeRangeSelector from './components/TimeRangeSelector';
import AutoRefreshToggle from './components/AutoRefreshToggle';
import ThreatSeverityFilter from './components/ThreatSeverityFilter';
import { getAnalyticsData } from '../../services/analyticsService';
import { getAlerts } from '../../services/alertsService';

const RealTimeThreatMonitor = () => {
  const [timeRange, setTimeRange] = useState('15min');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('15'); // Seconds
  const [selectedSeverities, setSelectedSeverities] = useState(['critical', 'high', 'medium', 'low']);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalScanned: 0,
    malwareDetected: 0,
    phishingAttempts: 0,
    cleanEmails: 0
  });

  const [trendData, setTrendData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [heatMapData, setHeatMapData] = useState([]);

  const fetchData = async () => {
    try {
      // Use individual try-catches to prevent one failure from blocking everything
      let analytics = null;
      let alertsData = { alerts: [] };

      try {
        analytics = await getAnalyticsData();
      } catch (err) {
        console.error('Analytics fetch error:', err);
      }

      try {
        alertsData = await getAlerts({ limit: 10 });
      } catch (err) {
        console.error('Alerts fetch error:', err);
      }

      if (analytics) {
        const dist = analytics.threatDistribution || [];
        const getVal = (type) => dist.find(d => d.type === type)?.value || 0;
        
        setMetrics({
          totalScanned: (getVal('clean') + getVal('malware') + getVal('phishing') + getVal('spam') + getVal('suspicious')),
          malwareDetected: getVal('malware'),
          phishingAttempts: getVal('phishing'),
          cleanEmails: getVal('clean')
        });

        setTrendData(analytics.severityTrends || []);
        
        setHeatMapData((analytics.topDomains || []).map((d, idx) => ({
          id: idx,
          domain: d.domain,
          riskLevel: d.riskScore || 0,
          threatCount: Math.floor((d.emails || 0) * ((d.riskScore || 0) / 100)),
          emailCount: d.emails || 0
        })));
      }

      if (alertsData) {
        setAlerts(alertsData.alerts || []);
      }

      // We are "connected" if we at least tried and got something or the server responded
      setIsConnected(true);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Real-time monitor systemic error:', err);
      setIsConnected(false);
      setError('System sync failure: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchData();
    }, parseInt(refreshInterval) * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshInterval]);

  const handleInvestigate = (alertId) => {
    console.log('Investigating alert:', alertId);
  };

  const handleExport = () => {
    console.log('Exporting data to incident response tools');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-[60px] lg:pt-[60px] px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-[1920px] mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">Real-Time Threat Monitor</h1>
              <p className="text-sm md:text-base text-muted-foreground font-caption">Live threat detection and incident prioritization dashboard</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <ConnectionStatusIndicator isConnected={isConnected} lastUpdate={lastUpdate} />
              <Button variant="outline" iconName="Download" iconPosition="left" onClick={handleExport}>
                Export Data
              </Button>
            </div>
          </div>

          <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <TimeRangeSelector value={timeRange} onChange={setTimeRange} className="w-full lg:w-48" />
              <AutoRefreshToggle
                enabled={autoRefreshEnabled}
                interval={refreshInterval}
                onToggle={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                onIntervalChange={setRefreshInterval}
              />
              <div className="flex-1" />
              <ThreatSeverityFilter
                selectedSeverities={selectedSeverities}
                onChange={setSelectedSeverities}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <MetricCard
              title="Total Emails Scanned"
              value={metrics?.totalScanned}
              icon="Mail"
              trend="up"
              trendValue="+12.5%"
              severity="low"
              isActive={autoRefreshEnabled}
            />
            <MetricCard
              title="Malware Detected"
              value={metrics?.malwareDetected}
              icon="Bug"
              trend="up"
              trendValue="+8.3%"
              severity="critical"
              isActive={autoRefreshEnabled}
            />
            <MetricCard
              title="Phishing Attempts"
              value={metrics?.phishingAttempts}
              icon="AlertTriangle"
              trend="down"
              trendValue="-3.2%"
              severity="high"
              isActive={autoRefreshEnabled}
            />
            <MetricCard
              title="Clean Emails"
              value={metrics?.cleanEmails}
              icon="CheckCircle"
              trend="up"
              trendValue="+15.7%"
              severity="low"
              isActive={false}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2">
              <ThreatTrendChart data={trendData} />
            </div>
            <div className="lg:col-span-1">
              <LiveAlertFeed alerts={alerts} onInvestigate={handleInvestigate} />
            </div>
          </div>

          <ThreatHeatMap data={heatMapData} />
        </div>
      </main>
    </div>
  );
};

export default RealTimeThreatMonitor;