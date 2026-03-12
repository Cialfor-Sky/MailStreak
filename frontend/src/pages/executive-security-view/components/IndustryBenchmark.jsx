import React from 'react';
import Icon from '../../../components/AppIcon';

const IndustryBenchmark = ({ metric, ourScore, industryAvg, topPerformer, unit = '%' }) => {
  const getPerformanceStatus = () => {
    const diff = ourScore - industryAvg;
    if (diff >= 10) return { status: 'excellent', icon: 'TrendingUp', color: 'text-success' };
    if (diff >= 0) return { status: 'good', icon: 'Minus', color: 'text-accent' };
    if (diff >= -10) return { status: 'warning', icon: 'TrendingDown', color: 'text-warning' };
    return { status: 'poor', icon: 'TrendingDown', color: 'text-error' };
  };

  const performance = getPerformanceStatus();
  const ourPercentage = (ourScore / topPerformer) * 100;
  const industryPercentage = (industryAvg / topPerformer) * 100;

  return (
    <div className="card border border-border">
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">{metric}</h4>
        <Icon name={performance?.icon} size={18} className={performance?.color} />
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-caption">Our Organization</span>
            <span className={`text-lg font-bold ${performance?.color} font-mono`}>
              {ourScore}{unit}
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${performance?.color?.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${ourPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-caption">Industry Average</span>
            <span className="text-sm font-semibold text-foreground font-mono">
              {industryAvg}{unit}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-muted-foreground/50 transition-all duration-500"
              style={{ width: `${industryPercentage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-caption">Top Performer</span>
            <span className="text-sm font-semibold text-foreground font-mono">
              {topPerformer}{unit}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground font-caption">
          {ourScore > industryAvg 
            ? `Performing ${((ourScore - industryAvg) / industryAvg * 100)?.toFixed(1)}% above industry average`
            : `${((industryAvg - ourScore) / industryAvg * 100)?.toFixed(1)}% below industry average`
          }
        </p>
      </div>
    </div>
  );
};

export default IndustryBenchmark;