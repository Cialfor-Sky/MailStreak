import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ThreatStatusIndicator = ({ className = '' }) => {
  const [threatLevel, setThreatLevel] = useState('low');
  const [activeThreats, setActiveThreats] = useState(0);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const threatLevels = ['low', 'medium', 'high', 'critical'];
    
    const updateThreatData = () => {
      const randomLevel = threatLevels?.[Math.floor(Math.random() * threatLevels?.length)];
      const randomThreats = Math.floor(Math.random() * 50);
      setThreatLevel(randomLevel);
      setActiveThreats(randomThreats);
    };

    updateThreatData();

    const interval = setInterval(updateThreatData, 15000);

    const connectionInterval = setInterval(() => {
      setIsConnected(prev => !prev);
      setTimeout(() => setIsConnected(true), 2000);
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(connectionInterval);
    };
  }, []);

  const getThreatConfig = (level) => {
    const configs = {
      critical: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        borderColor: 'border-error/40',
        label: 'CRITICAL',
        icon: 'AlertOctagon',
        pulse: true
      },
      high: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/40',
        label: 'HIGH',
        icon: 'AlertTriangle',
        pulse: true
      },
      medium: {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        borderColor: 'border-accent/40',
        label: 'MEDIUM',
        icon: 'Info',
        pulse: false
      },
      low: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/40',
        label: 'LOW',
        icon: 'CheckCircle',
        pulse: false
      }
    };
    return configs?.[level] || configs?.low;
  };

  const config = getThreatConfig(threatLevel);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${config?.bgColor} ${config?.borderColor} ${config?.color} ${config?.pulse ? 'animate-pulse-glow' : ''} transition-smooth`}>
        <Icon name={config?.icon} size={16} />
        <div className="flex flex-col">
          <span className="text-xs font-medium font-data">{config?.label}</span>
          <span className="text-xs opacity-80 font-caption">{activeThreats} Active</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${isConnected ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'} transition-smooth`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'} ${isConnected ? 'animate-pulse-glow' : ''}`} />
        <span className="font-caption">{isConnected ? 'Live' : 'Reconnecting'}</span>
      </div>
    </div>
  );
};

export default ThreatStatusIndicator;