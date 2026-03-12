import React from 'react';
import Icon from '../../../components/AppIcon';
import EmailDetailsExpanded from './EmailDetailsExpanded';
import { cn } from '../../../utils/cn';

const EmailListTable = ({
  emails,
  selectedEmails,
  expandedEmailId,
  sortConfig,
  onSort,
  onEmailSelect,
  onSelectAll,
  onExpandEmail,
  currentPage,
  totalPages,
  onPageChange,
  totalEmails
}) => {
  const getSeverityConfig = (riskScore) => {
    if (riskScore >= 80) return { bg: 'bg-error/10', text: 'text-error', label: 'Critical', color: 'error' };
    if (riskScore >= 50) return { bg: 'bg-warning/10', text: 'text-warning', label: 'High', color: 'warning' };
    if (riskScore >= 20) return { bg: 'bg-accent/10', text: 'text-accent', label: 'Medium', color: 'accent' };
    return { bg: 'bg-success/10', text: 'text-success', label: 'Low', color: 'success' };
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
                  checked={selectedEmails?.length === emails?.length && emails?.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-primary"
                />
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('sender')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sender</span>
                  <SortIcon field="sender" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('subject')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subject</span>
                  <SortIcon field="subject" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('timestamp')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</span>
                  <SortIcon field="timestamp" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('classification')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classification</span>
                  <SortIcon field="classification" />
                </div>
              </th>
              <th
                className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50 transition-smooth"
                onClick={() => onSort('riskScore')}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Risk Score</span>
                  <SortIcon field="riskScore" />
                </div>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {emails?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Icon name="Inbox" size={48} color="var(--color-muted-foreground)" />
                    <p className="text-sm text-muted-foreground font-caption">No emails found</p>
                  </div>
                </td>
              </tr>
            ) : (
              emails?.map((email) => {
                const severityConfig = getSeverityConfig(email?.riskScore);
                const isExpanded = expandedEmailId === email?.id;
                const isSelected = selectedEmails?.includes(email?.id);

                return (
                  <React.Fragment key={email?.id}>
                    <tr
                      className={cn(
                        'border-b border-border transition-smooth hover:bg-muted/50 cursor-pointer',
                        isSelected && 'bg-primary/5',
                        email?.isNew && 'bg-accent/5'
                      )}
                      onClick={() => onExpandEmail(email?.id)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onEmailSelect(email?.id)}
                          className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-2 focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {email?.isNew && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
                          )}
                          <span className="text-sm text-foreground font-medium truncate max-w-[200px]">
                            {email?.sender}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground truncate max-w-[300px]">{email?.subject}</span>
                          {email?.attachments > 0 && (
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-muted-foreground">
                              <Icon name="Paperclip" size={12} />
                              <span className="text-xs font-data">{email?.attachments}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground font-data">
                          {formatTimestamp(email?.timestamp)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium capitalize',
                          severityConfig?.bg,
                          severityConfig?.text
                        )}>
                          {email?.classification}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'flex-1 h-2 rounded-full bg-muted overflow-hidden',
                            'relative'
                          )}>
                            <div
                              className={cn(
                                'h-full transition-all duration-500',
                                `bg-${severityConfig?.color}`
                              )}
                              style={{ width: `${email?.riskScore}%` }}
                            />
                          </div>
                          <span className={cn(
                            'text-sm font-semibold font-data min-w-[3rem] text-right',
                            severityConfig?.text
                          )}>
                            {email?.riskScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                        <button
                          onClick={() => onExpandEmail(email?.id)}
                          className="p-2 rounded-md hover:bg-muted transition-smooth"
                        >
                          <Icon
                            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                            size={16}
                            className="text-muted-foreground"
                          />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan="7" className="px-4 py-0 bg-muted/30">
                          <EmailDetailsExpanded email={email} />
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
          <div className="text-sm text-muted-foreground font-caption">
            Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalEmails)} of {totalEmails} emails
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm font-medium transition-smooth',
                      currentPage === pageNum
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-foreground'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailListTable;