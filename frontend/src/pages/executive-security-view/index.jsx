import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import KPICard from './components/KPICard';
import ThreatTrendChart from './components/ThreatTrendChart';
import ComplianceCard from './components/ComplianceCard';
import SecurityMilestone from './components/SecurityMilestone';
import TeamPerformanceCard from './components/TeamPerformanceCard';
import ROIMetricsChart from './components/ROIMetricsChart';
import IndustryBenchmark from './components/IndustryBenchmark';

import { getExecutiveAnalyticsData } from '../../services/analyticsService';

const ExecutiveSecurityView = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [kpiData, setKpiData] = useState([]);
  const [threatTrendData, setThreatTrendData] = useState([]);

  const loadExecutiveData = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await getExecutiveAnalyticsData();
      setKpiData(data.kpiData);
      setThreatTrendData(data.threatTrendData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load executive data.');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadExecutiveData();
    const interval = setInterval(() => {
      loadExecutiveData();
    }, 120000); // 2 minutes auto-refresh for real-time feel

    return () => clearInterval(interval);
  }, []);

  const roiData = [
    { category: "Prevention", investment: 450000, savings: 2100000 },
    { category: "Detection", investment: 320000, savings: 1450000 },
    { category: "Response", investment: 280000, savings: 890000 },
    { category: "Training", investment: 150000, savings: 620000 },
    { category: "Tools", investment: 380000, savings: 1280000 }
  ];

  const complianceFrameworks = [
    {
      framework: "SOC 2 Type II",
      status: "compliant",
      score: 98,
      lastAudit: "12/15/2025",
      nextAudit: "06/15/2026",
      findings: 2
    },
    {
      framework: "ISO 27001:2022",
      status: "compliant",
      score: 96,
      lastAudit: "11/20/2025",
      nextAudit: "05/20/2026",
      findings: 3
    },
    {
      framework: "GDPR Compliance",
      status: "compliant",
      score: 99,
      lastAudit: "01/10/2026",
      nextAudit: "07/10/2026",
      findings: 1
    },
    {
      framework: "HIPAA Security Rule",
      status: "partial",
      score: 87,
      lastAudit: "10/05/2025",
      nextAudit: "04/05/2026",
      findings: 8
    }
  ];

  const securityMilestones = [
    {
      title: "Zero Trust Architecture Implementation",
      date: "03/15/2026",
      status: "in-progress",
      priority: "high",
      owner: "Sarah Chen",
      description: "Deploy zero trust network access controls across all enterprise systems and applications"
    },
    {
      title: "Annual Security Awareness Training",
      date: "02/28/2026",
      status: "in-progress",
      priority: "high",
      owner: "Michael Rodriguez",
      description: "Complete mandatory security training for all employees with phishing simulation exercises"
    },
    {
      title: "SOC 2 Recertification Audit",
      date: "06/15/2026",
      status: "pending",
      priority: "high",
      owner: "Jennifer Park",
      description: "Prepare documentation and evidence for SOC 2 Type II recertification audit"
    },
    {
      title: "Incident Response Plan Update",
      date: "01/30/2026",
      status: "completed",
      priority: "medium",
      owner: "David Thompson",
      description: "Quarterly review and update of incident response procedures and playbooks"
    },
    {
      title: "Vulnerability Assessment Q1 2026",
      date: "03/31/2026",
      status: "pending",
      priority: "medium",
      owner: "Lisa Anderson",
      description: "Comprehensive vulnerability scanning and penetration testing across infrastructure"
    }
  ];

  const teamPerformance = [
    {
      department: "Security Operations Center",
      responseTime: "11.5min",
      resolutionRate: 94,
      trainingCompletion: 98,
      activeIncidents: 3,
      teamSize: 12
    },
    {
      department: "Incident Response Team",
      responseTime: "8.2min",
      resolutionRate: 97,
      trainingCompletion: 100,
      activeIncidents: 1,
      teamSize: 8
    },
    {
      department: "Threat Intelligence",
      responseTime: "15.3min",
      resolutionRate: 91,
      trainingCompletion: 95,
      activeIncidents: 0,
      teamSize: 6
    },
    {
      department: "Security Engineering",
      responseTime: "22.7min",
      resolutionRate: 88,
      trainingCompletion: 92,
      activeIncidents: 5,
      teamSize: 10
    }
  ];

  const industryBenchmarks = [
    {
      metric: "Threat Detection Rate",
      ourScore: 99.7,
      industryAvg: 96.2,
      topPerformer: 99.9
    },
    {
      metric: "Mean Time to Detect (MTTD)",
      ourScore: 8.5,
      industryAvg: 12.3,
      topPerformer: 6.2,
      unit: "min"
    },
    {
      metric: "Security Training Completion",
      ourScore: 96,
      industryAvg: 78,
      topPerformer: 99
    },
    {
      metric: "Incident Response SLA",
      ourScore: 94,
      industryAvg: 82,
      topPerformer: 98
    }
  ];

  const handleRefresh = () => {
    loadExecutiveData();
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 86400000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Helmet>
        <title>Executive Security View - MailStreak</title>
        <meta name="description" content="Strategic security posture overview and compliance reporting for executive leadership and board presentations" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-[60px] lg:pt-[60px]">
          <div className="max-w-[1920px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 md:mb-8">
              <div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  Executive Security View
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-caption">
                  Strategic security posture and compliance overview for leadership
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Icon name="Clock" size={16} />
                  <span className="font-caption">
                    Last updated: {lastUpdated?.toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="RefreshCw"
                    iconPosition="left"
                    onClick={handleRefresh}
                    loading={isRefreshing}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    iconName="Download"
                    iconPosition="left"
                    onClick={handleExportPDF}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              {kpiData?.map((kpi, index) => (
                <KPICard key={index} {...kpi} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-8 space-y-4 md:space-y-6">
                <ThreatTrendChart 
                  data={threatTrendData} 
                  title="6-Month Threat Trend Analysis"
                />

                <ROIMetricsChart 
                  data={roiData} 
                  title="Security Investment ROI by Category"
                />
              </div>

              <div className="lg:col-span-4 space-y-4 md:space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Compliance Status
                  </h3>
                  <div className="space-y-4">
                    {complianceFrameworks?.map((framework, index) => (
                      <ComplianceCard key={index} {...framework} />
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Upcoming Security Milestones
                  </h3>
                  <div className="space-y-3">
                    {securityMilestones?.slice(0, 4)?.map((milestone, index) => (
                      <SecurityMilestone key={index} {...milestone} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                Security Team Performance Scorecard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {teamPerformance?.map((team, index) => (
                  <TeamPerformanceCard key={index} {...team} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                Industry Benchmark Comparison
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {industryBenchmarks?.map((benchmark, index) => (
                  <IndustryBenchmark key={index} {...benchmark} />
                ))}
              </div>
            </div>

            <div className="mt-8 p-6 rounded-lg bg-muted/30 border border-border">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon name="Info" size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">
                    Executive Summary Notes
                  </h3>
                  <p className="text-sm text-muted-foreground font-caption">
                    This dashboard provides strategic security metrics optimized for board presentations and executive decision-making. Data is aggregated daily with manual refresh available for real-time briefings. All metrics align with industry standards and regulatory compliance requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ExecutiveSecurityView;