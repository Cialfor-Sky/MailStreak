import React from 'react';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';
import Button from '../../../components/ui/Button';

const RulesTable = ({
  rules,
  selectedRules,
  expandedRuleId,
  sortConfig,
  onSort,
  onRuleSelect,
  onSelectAll,
  onExpandRule,
  onToggleRule,
  onEditRule,
  onViewVersionHistory,
  currentPage,
  totalPages,
  onPageChange,
  totalRules
}) => {
  const getSeverityConfig = (severity) => {
    const configs = {
      critical: { bg: 'bg-error/10', text: 'text-error', label: 'Critical' },
      high: { bg: 'bg-warning/10', text: 'text-warning', label: 'High' },
      medium: { bg: 'bg-accent/10', text: 'text-accent', label: 'Medium' },
      low: { bg: 'bg-success/10', text: 'text-success', label: 'Low' }
    };
    return configs?.[severity] || configs?.low;
  };

  const getCategoryConfig = (category) => {
    const configs = {
      malware: { bg: 'bg-error/10', text: 'text-error', icon: 'Bug' },
      phishing: { bg: 'bg-warning/10', text: 'text-warning', icon: 'Fish' },
      spam: { bg: 'bg-accent/10', text: 'text-accent', icon: 'Mail' }
    };
    return configs?.[category] || configs?.spam;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const SortIcon = ({ field }) => {
    if (sortConfig?.field !== field) {
      return <Icon name="ChevronsUpDown" size={14} className="text-muted-foreground" />;
    }
    return sortConfig?.direction === 'asc'
      ? <Icon name="ChevronUp" size={14} className="text-primary" />
      : <Icon name="ChevronDown" size={14} className="text-primary" />;
  };

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedRules?.length === rules?.length && rules?.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-primary"
                />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rule Name</span>
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('category')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Category</span>
                  <SortIcon field="category" />
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('severity')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Severity</span>
                  <SortIcon field="severity" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('lastUpdated')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Updated</span>
                  <SortIcon field="lastUpdated" />
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rules?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="FileText" size={48} color="var(--color-muted-foreground)" />
                    <p className="text-sm text-muted-foreground font-caption">No rules found</p>
                  </div>
                </td>
              </tr>
            ) : (
              rules?.map((rule) => {
                const severityConfig = getSeverityConfig(rule?.severity);
                const categoryConfig = getCategoryConfig(rule?.category);
                const isExpanded = expandedRuleId === rule?.id;
                const isSelected = selectedRules?.includes(rule?.id);

                return (
                  <React.Fragment key={rule?.id}>
                    <tr
                      className={cn(
                        'border-b border-border transition-smooth hover:bg-muted/50',
                        isSelected && 'bg-primary/5'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onRuleSelect(rule?.id)}
                          className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onExpandRule(rule?.id)}
                            className="text-foreground hover:text-primary transition-smooth"
                          >
                            <Icon
                              name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                              size={16}
                            />
                          </button>
                          <span className="text-sm font-medium text-foreground">{rule?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full', categoryConfig?.bg, categoryConfig?.text)}>
                          <Icon name={categoryConfig?.icon} size={14} />
                          <span className="text-xs font-semibold capitalize">{rule?.category}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onToggleRule(rule?.id)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-smooth',
                            rule?.status === 'enabled' ? 'bg-success' : 'bg-muted'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-4 w-4 transform rounded-full bg-white transition-smooth',
                              rule?.status === 'enabled' ? 'translate-x-6' : 'translate-x-1'
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-3 py-1 rounded-full text-xs font-semibold', severityConfig?.bg, severityConfig?.text)}>
                          {severityConfig?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-foreground font-data">{formatTimestamp(rule?.lastUpdated)}</span>
                          <span className="text-xs text-muted-foreground">{rule?.updatedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditRule(rule)}
                            title="Edit Rule"
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewVersionHistory(rule)}
                            title="Version History"
                          >
                            <Icon name="History" size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-border bg-muted/30">
                        <td colSpan="7" className="px-4 py-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Icon name="Code" size={16} className="text-primary" />
                                Rule Logic
                              </h4>
                              <div className="bg-card rounded-md p-4 border border-border">
                                <code className="text-xs text-accent font-mono">{rule?.ruleLogic}</code>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Icon name="Zap" size={16} className="text-primary" />
                                Trigger Conditions
                              </h4>
                              <ul className="space-y-2">
                                {rule?.triggerConditions?.map((condition, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <Icon name="CheckCircle" size={14} className="text-success mt-0.5" />
                                    <span className="text-xs text-foreground">{condition}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Icon name="BarChart3" size={16} className="text-primary" />
                                Performance Metrics
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="bg-card rounded-md p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Detection Rate</p>
                                  <p className="text-lg font-bold text-success font-data">{rule?.detectionRate}%</p>
                                </div>
                                <div className="bg-card rounded-md p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">False Positives</p>
                                  <p className="text-lg font-bold text-warning font-data">{rule?.falsePositiveRate}%</p>
                                </div>
                                <div className="bg-card rounded-md p-3 border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Affected Emails</p>
                                  <p className="text-lg font-bold text-foreground font-data">{rule?.affectedEmails?.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Icon name="Info" size={16} className="text-primary" />
                                Rule Information
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">Version</span>
                                  <span className="text-xs text-foreground font-data">{rule?.version}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">Status</span>
                                  <span className={cn('text-xs font-semibold', rule?.status === 'enabled' ? 'text-success' : 'text-muted-foreground')}>
                                    {rule?.status?.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalRules)} of {totalRules} rules
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <span className="text-sm text-foreground font-data">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RulesTable;