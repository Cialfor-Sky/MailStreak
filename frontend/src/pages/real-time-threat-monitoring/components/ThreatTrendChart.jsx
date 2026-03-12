import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ThreatTrendChart = ({ data, className = '' }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-md p-3 shadow-lg">
          <p className="text-xs text-muted-foreground font-caption mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry?.color }} />
              <span className="text-foreground font-data">{entry?.name}: {entry?.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`card ${className}`}>
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-semibold text-foreground">Real-Time Threat Detection Trends</h3>
        <p className="text-xs md:text-sm text-muted-foreground font-caption mt-1">Live monitoring of threat patterns across severity levels</p>
      </div>
      <div className="w-full h-64 md:h-80 lg:h-96" aria-label="Real-time threat detection trends line chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis 
              dataKey="time" 
              stroke="var(--color-muted-foreground)" 
              style={{ fontSize: '12px', fontFamily: 'Fira Code, monospace' }}
            />
            <YAxis 
              stroke="var(--color-muted-foreground)" 
              style={{ fontSize: '12px', fontFamily: 'Fira Code, monospace' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter, sans-serif' }}
            />
            <Line 
              type="monotone" 
              dataKey="critical" 
              stroke="var(--color-error)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-error)', r: 3 }}
              activeDot={{ r: 5 }}
              name="Critical"
            />
            <Line 
              type="monotone" 
              dataKey="high" 
              stroke="var(--color-warning)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-warning)', r: 3 }}
              activeDot={{ r: 5 }}
              name="High"
            />
            <Line 
              type="monotone" 
              dataKey="medium" 
              stroke="var(--color-accent)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-accent)', r: 3 }}
              activeDot={{ r: 5 }}
              name="Medium"
            />
            <Line 
              type="monotone" 
              dataKey="low" 
              stroke="var(--color-success)" 
              strokeWidth={2}
              dot={{ fill: 'var(--color-success)', r: 3 }}
              activeDot={{ r: 5 }}
              name="Low"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ThreatTrendChart;