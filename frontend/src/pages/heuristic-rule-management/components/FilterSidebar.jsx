import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { cn } from '../../../utils/cn';

const FilterSidebar = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const categoryOptions = [
    { value: 'malware', label: 'Malware', icon: 'Bug', color: 'error' },
    { value: 'phishing', label: 'Phishing', icon: 'Fish', color: 'warning' },
    { value: 'spam', label: 'Spam', icon: 'Mail', color: 'accent' }
  ];

  const statusOptions = [
    { value: 'enabled', label: 'Enabled', color: 'success' },
    { value: 'disabled', label: 'Disabled', color: 'muted' }
  ];

  const severityOptions = [
    { value: 'critical', label: 'Critical', color: 'error' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'medium', label: 'Medium', color: 'accent' },
    { value: 'low', label: 'Low', color: 'success' }
  ];

  const handleCategoryToggle = (category) => {
    const currentCategories = localFilters?.category || [];
    const newCategories = currentCategories?.includes(category)
      ? currentCategories?.filter(c => c !== category)
      : [...currentCategories, category];
    const newFilters = { ...localFilters, category: newCategories };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleStatusToggle = (status) => {
    const currentStatuses = localFilters?.status || [];
    const newStatuses = currentStatuses?.includes(status)
      ? currentStatuses?.filter(s => s !== status)
      : [...currentStatuses, status];
    const newFilters = { ...localFilters, status: newStatuses };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSeverityToggle = (severity) => {
    const currentSeverities = localFilters?.severity || [];
    const newSeverities = currentSeverities?.includes(severity)
      ? currentSeverities?.filter(s => s !== severity)
      : [...currentSeverities, severity];
    const newFilters = { ...localFilters, severity: newSeverities };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (e) => {
    const newFilters = { ...localFilters, searchQuery: e?.target?.value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: [],
      status: [],
      severity: [],
      searchQuery: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const getColorClasses = (color, isSelected) => {
    const colorMap = {
      error: isSelected ? 'bg-error/10 border-error/40 text-error' : '',
      warning: isSelected ? 'bg-warning/10 border-warning/40 text-warning' : '',
      accent: isSelected ? 'bg-accent/10 border-accent/40 text-accent' : '',
      success: isSelected ? 'bg-success/10 border-success/40 text-success' : '',
      muted: isSelected ? 'bg-muted border-border text-foreground' : ''
    };
    return colorMap?.[color] || '';
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
            Search Rules
          </label>
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={localFilters?.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name or category..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Category
          </label>
          <div className="space-y-2">
            {categoryOptions?.map((option) => {
              const isSelected = localFilters?.category?.includes(option?.value);
              return (
                <button
                  key={option?.value}
                  onClick={() => handleCategoryToggle(option?.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md border transition-smooth',
                    isSelected
                      ? getColorClasses(option?.color, true)
                      : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon name={option?.icon} size={16} />
                    <span className="text-sm font-medium">{option?.label}</span>
                  </div>
                  {isSelected && <Icon name="Check" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions?.map((option) => {
              const isSelected = localFilters?.status?.includes(option?.value);
              return (
                <button
                  key={option?.value}
                  onClick={() => handleStatusToggle(option?.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md border transition-smooth',
                    isSelected
                      ? getColorClasses(option?.color, true)
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
            Severity Level
          </label>
          <div className="space-y-2">
            {severityOptions?.map((option) => {
              const isSelected = localFilters?.severity?.includes(option?.value);
              return (
                <button
                  key={option?.value}
                  onClick={() => handleSeverityToggle(option?.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md border transition-smooth',
                    isSelected
                      ? getColorClasses(option?.color, true)
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