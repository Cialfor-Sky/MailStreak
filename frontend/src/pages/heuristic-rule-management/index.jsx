import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../../components/ui/Header';
import RulesTable from './components/RulesTable';
import FilterSidebar from './components/FilterSidebar';
import RuleEditorModal from './components/RuleEditorModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import BulkActionsToolbar from './components/BulkActionsToolbar';

import Button from '../../components/ui/Button';

const HeuristicRuleManagement = () => {
  const [rules, setRules] = useState([]);
  const [selectedRules, setSelectedRules] = useState([]);
  const [expandedRuleId, setExpandedRuleId] = useState(null);
  const [filters, setFilters] = useState({
    category: [],
    status: [],
    severity: [],
    searchQuery: ''
  });
  const [sortConfig, setSortConfig] = useState({ field: 'lastUpdated', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRule, setEditingRule] = useState(null);
  const [viewingVersionHistory, setViewingVersionHistory] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    generateMockRules();
  }, []);

  const generateMockRules = () => {
    const ruleNames = [
      'Suspicious URL Pattern Detector',
      'Known Malicious Domain Blocker',
      'Attachment Signature Validator',
      'Spoofed Sender Address Checker',
      'Urgency Language Analyzer',
      'Credential Harvesting Pattern Detector',
      'Blacklisted IP Address Filter',
      'Executable Attachment Blocker',
      'Suspicious Link Redirect Detector',
      'Phishing Keyword Scanner',
      'Malware Hash Signature Matcher',
      'Spam Score Threshold Enforcer',
      'Domain Age Verification',
      'SSL Certificate Validator',
      'Email Header Anomaly Detector'
    ];

    const categories = ['malware', 'phishing', 'spam'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const users = ['admin@company.com', 'security@company.com', 'analyst@company.com'];

    const mockRules = Array.from({ length: 15 }, (_, i) => {
      const category = categories?.[Math.floor(Math.random() * categories?.length)];
      const severity = severities?.[Math.floor(Math.random() * severities?.length)];
      const isEnabled = Math.random() > 0.3;
      const detectionRate = Math.floor(Math.random() * 40) + 60;
      const falsePositiveRate = Math.floor(Math.random() * 10) + 1;

      return {
        id: `rule-${i + 1}`,
        name: ruleNames?.[i],
        category,
        status: isEnabled ? 'enabled' : 'disabled',
        severity,
        lastUpdated: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)?.toISOString(),
        updatedBy: users?.[Math.floor(Math.random() * users?.length)],
        version: `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
        detectionRate,
        falsePositiveRate,
        affectedEmails: Math.floor(Math.random() * 5000) + 500,
        ruleLogic: `if (email.contains("${category}_pattern")) { flag_as_${severity}; }`,
        triggerConditions: [
          `${category} pattern detected`,
          `Confidence score > ${Math.floor(Math.random() * 30) + 70}%`,
          `Domain reputation < ${Math.floor(Math.random() * 30) + 20}`
        ],
        versionHistory: Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, v) => ({
          version: `${Math.floor(Math.random() * 5) + 1}.${v}`,
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)?.toISOString(),
          author: users?.[Math.floor(Math.random() * users?.length)],
          changes: `Updated ${category} detection logic`,
          detectionRate: Math.floor(Math.random() * 40) + 60
        }))
      };
    });

    setRules(mockRules);
  };

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

  const filteredRules = rules?.filter(rule => {
    const matchesCategory = filters?.category?.length === 0 || filters?.category?.includes(rule?.category);
    const matchesStatus = filters?.status?.length === 0 || filters?.status?.includes(rule?.status);
    const matchesSeverity = filters?.severity?.length === 0 || filters?.severity?.includes(rule?.severity);
    const matchesSearch = !filters?.searchQuery ||
      rule?.name?.toLowerCase()?.includes(filters?.searchQuery?.toLowerCase()) ||
      rule?.category?.toLowerCase()?.includes(filters?.searchQuery?.toLowerCase());

    return matchesCategory && matchesStatus && matchesSeverity && matchesSearch;
  });

  const handleRuleSelect = (ruleId) => {
    setSelectedRules(prev =>
      prev?.includes(ruleId) ? prev?.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRules?.length === filteredRules?.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(filteredRules?.map(rule => rule?.id));
    }
  };

  const handleExpandRule = (ruleId) => {
    setExpandedRuleId(prev => prev === ruleId ? null : ruleId);
  };

  const handleToggleRule = (ruleId) => {
    setRules(prev => prev?.map(rule =>
      rule?.id === ruleId
        ? { ...rule, status: rule?.status === 'enabled' ? 'disabled' : 'enabled' }
        : rule
    ));
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsEditorOpen(true);
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setIsEditorOpen(true);
  };

  const handleSaveRule = (ruleData) => {
    if (editingRule) {
      setRules(prev => prev?.map(rule =>
        rule?.id === editingRule?.id
          ? { ...rule, ...ruleData, lastUpdated: new Date()?.toISOString() }
          : rule
      ));
    } else {
      const newRule = {
        id: `rule-${rules?.length + 1}`,
        ...ruleData,
        lastUpdated: new Date()?.toISOString(),
        version: '1.0',
        detectionRate: 0,
        falsePositiveRate: 0,
        affectedEmails: 0,
        versionHistory: []
      };
      setRules(prev => [...prev, newRule]);
    }
    setIsEditorOpen(false);
  };

  const handleViewVersionHistory = (rule) => {
    setViewingVersionHistory(rule);
    setIsVersionHistoryOpen(true);
  };

  const handleRestoreVersion = (version) => {
    setRules(prev => prev?.map(rule =>
      rule?.id === viewingVersionHistory?.id
        ? { ...rule, version: version?.version, lastUpdated: new Date()?.toISOString() }
        : rule
    ));
    setIsVersionHistoryOpen(false);
  };

  const handleBulkEnable = () => {
    setRules(prev => prev?.map(rule =>
      selectedRules?.includes(rule?.id) ? { ...rule, status: 'enabled' } : rule
    ));
    setSelectedRules([]);
  };

  const handleBulkDisable = () => {
    setRules(prev => prev?.map(rule =>
      selectedRules?.includes(rule?.id) ? { ...rule, status: 'disabled' } : rule
    ));
    setSelectedRules([]);
  };

  const handleExport = () => {
    const exportData = rules?.filter(rule => selectedRules?.includes(rule?.id));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heuristic-rules-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
    link?.click();
  };

  const sortedRules = [...filteredRules]?.sort((a, b) => {
    const aValue = a?.[sortConfig?.field];
    const bValue = b?.[sortConfig?.field];

    if (sortConfig?.field === 'lastUpdated') {
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

  const paginatedRules = sortedRules?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedRules?.length / itemsPerPage);

  return (
    <>
      <Helmet>
        <title>Heuristic Rule Management | Email Security Dashboard</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[60px] lg:pt-[60px]">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Heuristic Rule Management</h1>
                <p className="text-sm text-muted-foreground">
                  Customize and maintain threat detection rules for enhanced email security analysis
                </p>
              </div>
              <Button
                onClick={handleCreateRule}
                iconName="Plus"
                size="lg"
              >
                Create Rule
              </Button>
            </div>

            {selectedRules?.length > 0 && (
              <BulkActionsToolbar
                selectedCount={selectedRules?.length}
                onEnableSelected={handleBulkEnable}
                onDisableSelected={handleBulkDisable}
                onExport={handleExport}
                onClearSelection={() => setSelectedRules([])}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-24 gap-6">
              <div className="lg:col-span-16">
                <RulesTable
                  rules={paginatedRules}
                  selectedRules={selectedRules}
                  expandedRuleId={expandedRuleId}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRuleSelect={handleRuleSelect}
                  onSelectAll={handleSelectAll}
                  onExpandRule={handleExpandRule}
                  onToggleRule={handleToggleRule}
                  onEditRule={handleEditRule}
                  onViewVersionHistory={handleViewVersionHistory}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalRules={sortedRules?.length}
                />
              </div>

              <div className="lg:col-span-8">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <RuleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        rule={editingRule}
        onSave={handleSaveRule}
      />

      <VersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        rule={viewingVersionHistory}
        onRestore={handleRestoreVersion}
      />
    </>
  );
};

export default HeuristicRuleManagement;