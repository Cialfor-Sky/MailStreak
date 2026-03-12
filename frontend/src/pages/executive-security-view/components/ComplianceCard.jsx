import React from 'react';
import Icon from '../../../components/AppIcon';

const ComplianceCard = ({ framework, status, score, lastAudit, nextAudit, findings }) => {
  const getStatusConfig = (status) => {
    const configs = {
      compliant: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        icon: 'CheckCircle',
        label: 'COMPLIANT'
      },
      partial: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        icon: 'AlertTriangle',
        label: 'PARTIAL'
      },
      'non-compliant': {
        color: 'text-error',
        bgColor: 'bg-error/10',
        icon: 'XCircle',
        label: 'NON-COMPLIANT'
      }
    };
    return configs?.[status] || configs?.partial;
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className="card border border-border hover:border-primary/40 transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">{framework}</h4>
          <div className={`flex items-center gap-2 mt-2 px-2 py-1 rounded-md ${statusConfig?.bgColor} ${statusConfig?.color} w-fit`}>
            <Icon name={statusConfig?.icon} size={14} />
            <span className="text-xs font-semibold">{statusConfig?.label}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground font-mono">{score}%</p>
          <p className="text-xs text-muted-foreground font-caption">Compliance Score</p>
        </div>
      </div>
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-caption">Last Audit:</span>
          <span className="text-foreground font-data">{lastAudit}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-caption">Next Audit:</span>
          <span className="text-foreground font-data">{nextAudit}</span>
        </div>
        {findings > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-caption">Open Findings:</span>
            <span className={`font-semibold font-data ${findings > 5 ? 'text-error' : 'text-warning'}`}>
              {findings}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplianceCard;