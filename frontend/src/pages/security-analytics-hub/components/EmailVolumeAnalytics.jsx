import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '../../../components/AppIcon';

const EmailVolumeAnalytics = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      const total = payload?.reduce((sum, entry) => sum + entry?.value, 0);
      return (
        <div className="card p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload?.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mt-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry?.color }} />
                <span className="text-xs text-muted-foreground font-caption">{entry?.name}:</span>
              </div>
              <span className="text-sm font-bold font-data" style={{ color: entry?.color }}>
                {entry?.value?.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-border">
            <span className="text-xs font-medium text-muted-foreground">Total:</span>
            <span className="text-sm font-bold text-foreground font-data">{total?.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const peakHour = data?.reduce((max, item) => 
    (item?.total > max?.total ? item : max), data?.[0]
  );

  return (
    <div className="card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Email Volume Analytics</h3>
          <p className="text-sm text-muted-foreground font-caption mt-1">Hourly email processing with capacity utilization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10">
            <Icon name="TrendingUp" size={16} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-caption">Peak Hour</span>
              <span className="text-sm font-bold text-primary font-data">{peakHour?.time}</span>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
            <Icon name="Download" size={16} />
            <span className="text-sm hidden md:inline">Export</span>
          </button>
        </div>
      </div>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorScanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorClean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              label={{ value: 'Email Count', angle: -90, position: 'insideLeft', fill: 'var(--color-muted-foreground)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="scanned"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScanned)"
              name="Total Scanned"
            />
            <Area
              type="monotone"
              dataKey="threats"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorThreat)"
              name="Threats Detected"
            />
            <Area
              type="monotone"
              dataKey="clean"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClean)"
              name="Clean Emails"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Total Processed</span>
          <span className="text-2xl font-bold text-primary font-data">
            {data?.reduce((sum, item) => sum + item?.scanned, 0)?.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Threats Found</span>
          <span className="text-2xl font-bold text-error font-data">
            {data?.reduce((sum, item) => sum + item?.threats, 0)?.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Clean Emails</span>
          <span className="text-2xl font-bold text-success font-data">
            {data?.reduce((sum, item) => sum + item?.clean, 0)?.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Capacity Used</span>
          <span className="text-2xl font-bold text-accent font-data">78%</span>
        </div>
      </div>
    </div>
  );
};

export default EmailVolumeAnalytics;