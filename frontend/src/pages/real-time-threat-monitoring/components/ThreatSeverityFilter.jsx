import React from 'react';
import Icon from '../../../components/AppIcon';

const ThreatSeverityFilter = ({ selectedSeverities, onChange, className = '' }) => {
  const severityLevels = [
    { value: 'critical', label: 'Critical', icon: 'AlertOctagon', color: 'text-error', bgColor: 'bg-error/10', borderColor: 'border-error/40' },
    { value: 'high', label: 'High', icon: 'AlertTriangle', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/40' },
    { value: 'medium', label: 'Medium', icon: 'Info', color: 'text-accent', bgColor: 'bg-accent/10', borderColor: 'border-accent/40' },
    { value: 'low', label: 'Low', icon: 'CheckCircle', color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/40' }
  ];

  const toggleSeverity = (severity) => {
    if (selectedSeverities?.includes(severity)) {
      onChange(selectedSeverities?.filter(s => s !== severity));
    } else {
      onChange([...selectedSeverities, severity]);
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-xs md:text-sm text-muted-foreground font-caption mr-2">Filter by severity:</span>
      {severityLevels?.map((level) => (
        <button
          key={level?.value}
          onClick={() => toggleSeverity(level?.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-smooth border ${
            selectedSeverities?.includes(level?.value)
              ? `${level?.bgColor} ${level?.color} ${level?.borderColor}`
              : 'bg-muted text-muted-foreground border-border'
          }`}
        >
          <Icon name={level?.icon} size={14} />
          <span>{level?.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThreatSeverityFilter;