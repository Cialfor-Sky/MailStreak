import React from 'react';
import Icon from '../../../components/AppIcon';

const LiveAlertFeed = ({ alerts, onInvestigate, className = '' }) => {
  const getSeverityConfig = (severity) => {
    const configs = {
      critical: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        borderColor: 'border-error/40',
        icon: 'AlertOctagon'
      },
      high: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/40',
        icon: 'AlertTriangle'
      },
      medium: {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/40',
        icon: 'Info'
      },
      low: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/40',
        icon: 'CheckCircle'
      }
    };
    return configs?.[severity] || configs?.low;
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return alertTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground">Live Alert Feed</h3>
          <p className="text-xs md:text-sm text-muted-foreground font-caption mt-1">Real-time threat notifications</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs bg-success/10 text-success">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="font-caption">Live</span>
        </div>
      </div>
      <div className="space-y-2 max-h-96 md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
        {alerts?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon name="Shield" size={48} color="var(--color-muted-foreground)" className="mb-3" />
            <p className="text-sm text-muted-foreground font-caption">No active alerts</p>
          </div>
        ) : (
          alerts?.map((alert) => {
            const config = getSeverityConfig(alert?.severity);
            return (
              <div
                key={alert?.id}
                className={`p-3 rounded-md border ${config?.borderColor} ${config?.bgColor} transition-smooth hover:scale-[1.01] cursor-pointer ${alert?.isPinned ? 'ring-2 ring-primary' : ''}`}
                onClick={() => onInvestigate(alert?.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Icon name={config?.icon} size={16} className={config?.color} />
                    <span className={`text-xs md:text-sm font-semibold ${config?.color}`}>
                      {alert?.severity?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert?.isPinned && (
                      <Icon name="Pin" size={14} className="text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground font-data">
                      {formatTimestamp(alert?.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-foreground font-medium mb-1">{alert?.threatType}</p>
                <p className="text-xs text-muted-foreground font-caption line-clamp-2">{alert?.description}</p>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <Icon name="Mail" size={12} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-data">{alert?.emailId}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveAlertFeed;