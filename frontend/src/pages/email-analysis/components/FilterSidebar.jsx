import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

const FilterSidebar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const dateRangeOptions = [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const threatTypeOptions = [
    { value: 'malware', label: 'Malware' },
    { value: 'phishing', label: 'Phishing' },
    { value: 'spam', label: 'Spam' },
    { value: 'suspicious', label: 'Suspicious' },
    { value: 'clean', label: 'Clean' }
  ];

  const handleDateRangeChange = (value) => {
    const newFilters = { ...localFilters, dateRange: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSenderDomainChange = (e) => {
    const newFilters = { ...localFilters, senderDomain: e?.target?.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleThreatTypeToggle = (type) => {
    const currentTypes = localFilters?.threatTypes || [];
    const newTypes = currentTypes?.includes(type)
      ? currentTypes?.filter(t => t !== type)
      : [...currentTypes, type];
    const newFilters = { ...localFilters, threatTypes: newTypes };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRiskScoreChange = (type, value) => {
    const newFilters = {
      ...localFilters,
      [type === 'min' ? 'riskScoreMin' : 'riskScoreMax']: parseInt(value)
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: '7d',
      senderDomain: '',
      threatTypes: [],
      riskScoreMin: 0,
      riskScoreMax: 100
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getThreatTypeConfig = (type) => {
    const configs = {
      malware: { bg: 'bg-error/10', text: 'text-error', border: 'border-error/40' },
      phishing: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/40' },
      spam: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/40' },
      suspicious: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/40' },
      clean: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/40' }
    };
    return configs?.[type] || configs?.clean;
  };

  return (
    <div className="card sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="SlidersHorizontal" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <Icon name="RotateCcw" size={16} />
        </button>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date Range
          </label>
          <Select
            options={dateRangeOptions}
            value={localFilters?.dateRange}
            onChange={handleDateRangeChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sender Domain
          </label>
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={localFilters?.senderDomain}
              onChange={handleSenderDomainChange}
              placeholder="Search domain..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Threat Types
          </label>
          <div className="space-y-2">
            {threatTypeOptions?.map((option) => {
              const isSelected = localFilters?.threatTypes?.includes(option?.value);
              const config = getThreatTypeConfig(option?.value);
              return (
                <button
                  key={option?.value}
                  onClick={() => handleThreatTypeToggle(option?.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md border transition-smooth',
                    isSelected
                      ? cn(config?.bg, config?.border, config?.text)
                      : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <span className="text-sm font-medium capitalize">{option?.label}</span>
                  {isSelected && <Icon name="Check" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Risk Score Range
          </label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-caption">Minimum</span>
                <span className="text-sm font-bold text-foreground font-data">
                  {localFilters?.riskScoreMin}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters?.riskScoreMin}
                onChange={(e) => handleRiskScoreChange('min', e?.target?.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${localFilters?.riskScoreMin}%, var(--color-muted) ${localFilters?.riskScoreMin}%, var(--color-muted) 100%)`
                }}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-caption">Maximum</span>
                <span className="text-sm font-bold text-foreground font-data">
                  {localFilters?.riskScoreMax}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localFilters?.riskScoreMax}
                onChange={(e) => handleRiskScoreChange('max', e?.target?.value)}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted"
                style={{
                  background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${localFilters?.riskScoreMax}%, var(--color-muted) ${localFilters?.riskScoreMax}%, var(--color-muted) 100%)`
                }}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-start gap-2">
            <Icon name="Info" size={16} className="text-accent mt-0.5" />
            <p className="text-xs text-muted-foreground font-caption">
              Filters are applied in real-time. Use the reset button to clear all filters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;