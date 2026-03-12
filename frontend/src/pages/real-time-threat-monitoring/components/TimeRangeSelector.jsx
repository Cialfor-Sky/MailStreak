import React from 'react';
import Select from '../../../components/ui/Select';

const TimeRangeSelector = ({ value, onChange, className = '' }) => {
  const timeRangeOptions = [
    { value: '15min', label: 'Last 15 minutes' },
    { value: '30min', label: 'Last 30 minutes' },
    { value: '1hr', label: 'Last 1 hour' },
    { value: '6hrs', label: 'Last 6 hours' },
    { value: '12hrs', label: 'Last 12 hours' },
    { value: '24hrs', label: 'Last 24 hours' }
  ];

  return (
    <Select
      options={timeRangeOptions}
      value={value}
      onChange={onChange}
      placeholder="Select time range"
      className={className}
    />
  );
};

export default TimeRangeSelector;