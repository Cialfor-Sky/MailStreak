import React from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const AutoRefreshToggle = ({ enabled, interval, onToggle, onIntervalChange, className = '' }) => {
  const intervalOptions = [
    { value: '5', label: '5 seconds' },
    { value: '10', label: '10 seconds' },
    { value: '15', label: '15 seconds' }
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-smooth ${
          enabled 
            ? 'bg-success/10 text-success border border-success/40' :'bg-muted text-muted-foreground border border-border'
        }`}
      >
        <Icon name={enabled ? 'RefreshCw' : 'Pause'} size={16} className={enabled ? 'animate-spin' : ''} />
        <span className="hidden md:inline">Auto-refresh</span>
      </button>
      {enabled && (
        <Select
          options={intervalOptions}
          value={interval}
          onChange={onIntervalChange}
          className="w-32"
        />
      )}
    </div>
  );
};

export default AutoRefreshToggle;