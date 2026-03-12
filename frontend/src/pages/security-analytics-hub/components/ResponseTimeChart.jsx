import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';

const ResponseTimeChart = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="card p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mt-1">
              <span className="text-xs text-muted-foreground font-caption">{entry?.name}:</span>
              <span className="text-sm font-bold font-data" style={{ color: entry?.color }}>
                {entry?.value}ms
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Detection Response Time Trends</h3>
          <p className="text-sm text-muted-foreground font-caption mt-1">Average response times by threat type over time</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
            <Icon name="Settings" size={16} />
            <span className="text-sm hidden md:inline">Configure</span>
          </button>
        </div>
      </div>

      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="line"
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
            <Line
              type="monotone"
              dataKey="malware"
              stroke="#EF4444"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Malware"
            />
            <Line
              type="monotone"
              dataKey="phishing"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Phishing"
            />
            <Line
              type="monotone"
              dataKey="spam"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Spam"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-md bg-error/10">
          <Icon name="Clock" size={20} className="text-error" />
          <div>
            <p className="text-xs text-muted-foreground font-caption">Avg Malware Response</p>
            <p className="text-lg font-bold text-error font-data">245ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-md bg-warning/10">
          <Icon name="Clock" size={20} className="text-warning" />
          <div>
            <p className="text-xs text-muted-foreground font-caption">Avg Phishing Response</p>
            <p className="text-lg font-bold text-warning font-data">189ms</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-md bg-accent/10">
          <Icon name="Clock" size={20} className="text-accent" />
          <div>
            <p className="text-xs text-muted-foreground font-caption">Avg Spam Response</p>
            <p className="text-lg font-bold text-accent font-data">156ms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseTimeChart;