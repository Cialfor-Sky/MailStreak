import React from 'react';
import Icon from '../../../components/AppIcon';

const KPICard = ({ title, value, unit, trend, trendValue, icon, iconColor, sparklineData }) => {
  const isPositiveTrend = trend === 'up';
  const trendColor = isPositiveTrend ? 'text-success' : 'text-error';
  const trendIcon = isPositiveTrend ? 'TrendingUp' : 'TrendingDown';

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-12 h-12 rounded-md ${iconColor}`}>
            <Icon name={icon} size={24} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-caption">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-foreground font-mono">{value}</span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isPositiveTrend ? 'bg-success/10' : 'bg-error/10'}`}>
          <Icon name={trendIcon} size={14} className={trendColor} />
          <span className={`text-xs font-medium ${trendColor} font-data`}>{trendValue}</span>
        </div>
      </div>
      {sparklineData && sparklineData?.length > 0 && (
        <div className="h-12 flex items-end gap-1">
          {sparklineData?.map((value, index) => {
            const maxValue = Math.max(...sparklineData);
            const height = (value / maxValue) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-primary/20 rounded-t transition-all duration-250 hover:bg-primary/40"
                style={{ height: `${height}%` }}
                title={`Value: ${value}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KPICard;