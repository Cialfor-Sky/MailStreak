import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const DateRangePicker = ({ selectedRange, onRangeChange, comparisonMode, onComparisonToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const presetRanges = [
    { label: 'Last 7 days', value: '7d', days: 7 },
    { label: 'Last 30 days', value: '30d', days: 30 },
    { label: 'Last 90 days', value: '90d', days: 90 },
    { label: 'Last 6 months', value: '6m', days: 180 },
    { label: 'Last year', value: '1y', days: 365 }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRangeSelect = (range) => {
    onRangeChange(range);
    setIsOpen(false);
  };

  const currentRange = presetRanges?.find(r => r?.value === selectedRange) || presetRanges?.[1];

  return (
    <div className="flex items-center gap-3">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-smooth focus-visible"
        >
          <Icon name="Calendar" size={16} />
          <span className="text-sm font-medium">{currentRange?.label}</span>
          <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
        </button>

        {isOpen && (
          <div className="dropdown absolute left-0 top-full mt-2 w-48">
            <div className="p-2">
              {presetRanges?.map((range) => (
                <button
                  key={range?.value}
                  onClick={() => handleRangeSelect(range?.value)}
                  className={`dropdown-item w-full ${selectedRange === range?.value ? 'bg-muted' : ''}`}
                >
                  <Icon name="Calendar" size={14} />
                  <span className="text-sm">{range?.label}</span>
                  {selectedRange === range?.value && (
                    <Icon name="Check" size={14} className="text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={onComparisonToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-smooth focus-visible ${
          comparisonMode
            ? 'bg-primary/10 text-primary border border-primary/40' :'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="GitCompare" size={16} />
        <span className="text-sm font-medium">Period Comparison</span>
      </button>
    </div>
  );
};

export default DateRangePicker;