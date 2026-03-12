import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  status, 
  icon, 
  description 
}) => {
  const getStatusConfig = (status) => {
    const configs = {
      excellent: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/40',
        label: 'EXCELLENT'
      },
      good: {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/40',
        label: 'GOOD'
      },
      warning: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/40',
        label: 'NEEDS ATTENTION'
      },
      critical: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        borderColor: 'border-error/40',
        label: 'CRITICAL'
      }
    };
    return configs?.[status] || configs?.good;
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div className={`card border ${statusConfig?.borderColor} transition-smooth hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${statusConfig?.bgColor}`}>
            <Icon name={icon} size={24} className={statusConfig?.color} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground font-caption">{title}</h3>
            <p className={`text-3xl md:text-4xl font-bold ${statusConfig?.color} font-mono mt-1`}>
              {value}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-md text-xs font-semibold ${statusConfig?.bgColor} ${statusConfig?.color}`}>
          {statusConfig?.label}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-caption">{subtitle}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-success' : 'text-error'}`}>
            <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={16} />
            <span className="font-data">{trendValue}</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border font-caption">
          {description}
        </p>
      )}
    </div>
  );
};

export default KPICard;