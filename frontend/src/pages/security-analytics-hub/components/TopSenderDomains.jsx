import React from 'react';
import Icon from '../../../components/AppIcon';

const TopSenderDomains = ({ domains }) => {
  const getRiskColor = (score) => {
    if (score >= 80) return { bg: 'bg-error/10', text: 'text-error', label: 'Critical' };
    if (score >= 60) return { bg: 'bg-warning/10', text: 'text-warning', label: 'High' };
    if (score >= 40) return { bg: 'bg-accent/10', text: 'text-accent', label: 'Medium' };
    return { bg: 'bg-success/10', text: 'text-success', label: 'Low' };
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Top Sender Domains</h3>
          <p className="text-sm text-muted-foreground font-caption mt-1">Ranked by risk score</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>
      <div className="space-y-3">
        {domains?.map((domain, index) => {
          const riskConfig = getRiskColor(domain?.riskScore);
          return (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-smooth"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                <Icon name="Globe" size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{domain?.domain}</p>
                <p className="text-xs text-muted-foreground font-caption">{domain?.emails?.toLocaleString()} emails</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-1 rounded text-xs font-medium ${riskConfig?.bg} ${riskConfig?.text}`}>
                  {riskConfig?.label}
                </span>
                <span className="text-xs text-muted-foreground font-data">{domain?.riskScore}/100</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
        <span className="text-sm font-medium">View All Domains</span>
        <Icon name="ArrowRight" size={16} />
      </button>
    </div>
  );
};

export default TopSenderDomains;