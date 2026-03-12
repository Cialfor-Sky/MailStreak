import React from 'react';
import Icon from '../../../components/AppIcon';

const TeamPerformanceCard = ({ 
  department, 
  responseTime, 
  resolutionRate, 
  trainingCompletion, 
  activeIncidents,
  teamSize 
}) => {
  const getPerformanceColor = (value, thresholds) => {
    if (value >= thresholds?.excellent) return 'text-success';
    if (value >= thresholds?.good) return 'text-accent';
    if (value >= thresholds?.warning) return 'text-warning';
    return 'text-error';
  };

  const responseTimeColor = getPerformanceColor(
    100 - parseFloat(responseTime),
    { excellent: 85, good: 70, warning: 50 }
  );

  const resolutionRateColor = getPerformanceColor(
    resolutionRate,
    { excellent: 90, good: 75, warning: 60 }
  );

  const trainingColor = getPerformanceColor(
    trainingCompletion,
    { excellent: 95, good: 80, warning: 65 }
  );

  return (
    <div className="card border border-border hover:border-primary/40 transition-smooth">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-foreground">{department}</h4>
          <p className="text-xs text-muted-foreground mt-1 font-caption">
            {teamSize} team members
          </p>
        </div>
        {activeIncidents > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-warning/10 text-warning">
            <Icon name="AlertCircle" size={14} />
            <span className="text-xs font-semibold font-data">{activeIncidents}</span>
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-caption">Avg Response Time</span>
            <span className={`text-sm font-semibold ${responseTimeColor} font-data`}>
              {responseTime}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${responseTimeColor?.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${Math.min(100 - parseFloat(responseTime), 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-caption">Resolution Rate</span>
            <span className={`text-sm font-semibold ${resolutionRateColor} font-data`}>
              {resolutionRate}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${resolutionRateColor?.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${resolutionRate}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-caption">Training Completion</span>
            <span className={`text-sm font-semibold ${trainingColor} font-data`}>
              {trainingCompletion}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${trainingColor?.replace('text-', 'bg-')} transition-all duration-500`}
              style={{ width: `${trainingCompletion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformanceCard;