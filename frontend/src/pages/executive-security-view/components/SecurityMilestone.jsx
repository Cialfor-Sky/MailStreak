import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityMilestone = ({ title, date, status, priority, owner, description }) => {
  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        icon: 'CheckCircle2'
      },
      'in-progress': {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        icon: 'Clock'
      },
      pending: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        icon: 'AlertCircle'
      },
      overdue: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        icon: 'AlertTriangle'
      }
    };
    return configs?.[status] || configs?.pending;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { color: 'text-error', label: 'HIGH' },
      medium: { color: 'text-warning', label: 'MEDIUM' },
      low: { color: 'text-accent', label: 'LOW' }
    };
    return configs?.[priority] || configs?.medium;
  };

  const statusConfig = getStatusConfig(status);
  const priorityConfig = getPriorityConfig(priority);

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth border border-border">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${statusConfig?.bgColor} flex-shrink-0`}>
        <Icon name={statusConfig?.icon} size={20} className={statusConfig?.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <span className={`text-xs font-semibold ${priorityConfig?.color} whitespace-nowrap`}>
            {priorityConfig?.label}
          </span>
        </div>
        
        {description && (
          <p className="text-xs text-muted-foreground mb-2 font-caption line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Icon name="Calendar" size={12} />
            <span className="font-data">{date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Icon name="User" size={12} />
            <span className="font-caption">{owner}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityMilestone;