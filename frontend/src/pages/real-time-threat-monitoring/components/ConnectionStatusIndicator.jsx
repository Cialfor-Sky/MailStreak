import React from 'react';
import Icon from '../../../components/AppIcon';

const ConnectionStatusIndicator = ({ isConnected, lastUpdate, className = '' }) => {
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMs = now - updateTime;
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    return updateTime?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md border text-xs ${
        isConnected 
          ? 'bg-success/10 text-success border-success/40' :'bg-error/10 text-error border-error/40'
      }`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-pulse-glow' : 'bg-error'}`} />
        <Icon name={isConnected ? 'Wifi' : 'WifiOff'} size={14} />
        <span className="font-caption">{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon name="Clock" size={14} />
        <span className="font-caption">Last update: {formatLastUpdate(lastUpdate)}</span>
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator;