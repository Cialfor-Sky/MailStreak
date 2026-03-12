import React from 'react';
import Icon from '../../../components/AppIcon';

const MLModelPerformance = ({ models }) => {
  const getPerformanceColor = (accuracy) => {
    if (accuracy >= 95) return 'text-success';
    if (accuracy >= 90) return 'text-accent';
    if (accuracy >= 85) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">ML Model Performance</h3>
          <p className="text-sm text-muted-foreground font-caption mt-1">Detection accuracy metrics</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth">
          <Icon name="Settings" size={16} />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Accuracy</th>
              <th>False Positive</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {models?.map((model, index) => (
              <tr key={index}>
                <td>
                  <div className="flex items-center gap-2">
                    <Icon name="Brain" size={16} className="text-primary" />
                    <span className="font-medium">{model?.name}</span>
                  </div>
                </td>
                <td>
                  <span className={`font-bold font-data ${getPerformanceColor(model?.accuracy)}`}>
                    {model?.accuracy}%
                  </span>
                </td>
                <td>
                  <span className="font-data">{model?.falsePositive}%</span>
                </td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    model?.status === 'Active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {model?.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Avg Accuracy</span>
          <span className="text-2xl font-bold text-success font-data">96.8%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground font-caption">Avg False Positive</span>
          <span className="text-2xl font-bold text-accent font-data">1.2%</span>
        </div>
      </div>
    </div>
  );
};

export default MLModelPerformance;