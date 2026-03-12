import React from 'react';
import Icon from '../../../components/AppIcon';

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  severity = 'low',
  isActive = false 
}) => {
  const getSeverityConfig = (level) => {
    const configs = {
      critical: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        borderColor: 'border-error/40',
        iconColor: 'var(--color-error)'
      },
      high: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/40',
        iconColor: 'var(--color-warning)'
      },
      medium: {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/40',
        iconColor: 'var(--color-accent)'
      },
      low: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/40',
        iconColor: 'var(--color-success)'
      }
    };
    return configs?.[level] || configs?.low;
  };

  const config = getSeverityConfig(severity);

  return (
    <div className={`card ${isActive ? 'animate-pulse-glow' : ''} transition-smooth`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-md ${config?.bgColor} border ${config?.borderColor}`}>
          <Icon name={icon} size={24} color={config?.iconColor} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${trend === 'up' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
            <Icon name={trend === 'up' ? 'TrendingUp' : 'TrendingDown'} size={14} />
            <span className="font-data">{trendValue}</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-xs md:text-sm text-muted-foreground font-caption">{title}</p>
        <p className={`text-2xl md:text-3xl lg:text-4xl font-bold ${config?.color} font-data`}>
          {value?.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default MetricCard;