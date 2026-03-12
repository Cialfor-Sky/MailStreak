import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Icon from '../../../components/AppIcon';

const ThreatDistributionChart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const COLORS = {
    malware: '#EF4444',
    phishing: '#F59E0B',
    spam: '#06B6D4',
    suspicious: '#6366F1',
    clean: '#10B981'
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload?.length) {
      const data = payload?.[0];
      return (
        <div className="card p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{data?.name}</p>
          <p className="text-lg font-bold text-primary font-data mt-1">{data?.value?.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground font-caption mt-1">
            {((data?.value / data?.payload?.total) * 100)?.toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const total = data?.reduce((sum, item) => sum + item?.value, 0);
  const dataWithTotal = data?.map(item => ({ ...item, total }));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Threat Type Distribution</h3>
          <p className="text-sm text-muted-foreground font-caption mt-1">Classification breakdown by threat category</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
          <Icon name="Download" size={16} />
          <span className="text-sm">Export</span>
        </button>
      </div>
      <div className="h-80 md:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={window.innerWidth < 768 ? 80 : 120}
              innerRadius={window.innerWidth < 768 ? 50 : 70}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {dataWithTotal?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS?.[entry?.type]}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry) => (
                <span className="text-sm text-foreground">
                  {value} ({entry?.payload?.value?.toLocaleString()})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-border">
        {data?.map((item, index) => (
          <div key={index} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS?.[item?.type] }}
              />
              <span className="text-xs text-muted-foreground font-caption">{item?.name}</span>
            </div>
            <span className="text-lg font-bold text-foreground font-data">{item?.value?.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">
              {((item?.value / total) * 100)?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatDistributionChart;