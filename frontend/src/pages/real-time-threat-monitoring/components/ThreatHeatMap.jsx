import React from 'react';
import Icon from '../../../components/AppIcon';

const ThreatHeatMap = ({ data, className = '' }) => {
  const getRiskColor = (riskLevel) => {
    if (riskLevel >= 80) return { bg: 'bg-error/20', border: 'border-error/40', text: 'text-error' };
    if (riskLevel >= 60) return { bg: 'bg-warning/20', border: 'border-warning/40', text: 'text-warning' };
    if (riskLevel >= 40) return { bg: 'bg-accent/20', border: 'border-accent/40', text: 'text-accent' };
    return { bg: 'bg-success/20', border: 'border-success/40', text: 'text-success' };
  };

  return (
    <div className={`card ${className}`}>
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground">Threat Severity Heat Map</h3>
        <p className="text-xs md:text-sm text-muted-foreground font-caption mt-1">Risk distribution across email domains</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data?.map((domain) => {
          const colors = getRiskColor(domain?.riskLevel);
          return (
            <div
              key={domain?.id}
              className={`p-3 rounded-md border ${colors?.border} ${colors?.bg} transition-smooth hover:scale-[1.02] cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon name="Globe" size={16} className={colors?.text} />
                <span className={`text-xs font-bold font-data ${colors?.text}`}>
                  {domain?.riskLevel}%
                </span>
              </div>
              <p className="text-xs md:text-sm font-medium text-foreground mb-1 truncate" title={domain?.domain}>
                {domain?.domain}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground font-caption">
                <span>{domain?.threatCount} threats</span>
                <span>{domain?.emailCount} emails</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error" />
          <span className="text-xs text-muted-foreground font-caption">Critical (80-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground font-caption">High (60-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span className="text-xs text-muted-foreground font-caption">Medium (40-59%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground font-caption">Low (0-39%)</span>
        </div>
      </div>
    </div>
  );
};

export default ThreatHeatMap;