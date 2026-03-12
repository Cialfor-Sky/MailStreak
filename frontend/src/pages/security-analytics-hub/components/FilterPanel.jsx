import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';

const FilterPanel = ({ onFilterChange }) => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedThreatType, setSelectedThreatType] = useState('all');

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'sales', label: 'Sales' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' }
  ];

  const teamOptions = [
    { value: 'all', label: 'All Teams' },
    { value: 'soc', label: 'SOC Team' },
    { value: 'incident', label: 'Incident Response' },
    { value: 'threat-intel', label: 'Threat Intelligence' },
    { value: 'compliance', label: 'Compliance' }
  ];

  const threatTypeOptions = [
    { value: 'all', label: 'All Threat Types' },
    { value: 'malware', label: 'Malware' },
    { value: 'phishing', label: 'Phishing' },
    { value: 'spam', label: 'Spam' },
    { value: 'suspicious', label: 'Suspicious' }
  ];

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    onFilterChange({ department: value, team: selectedTeam, threatType: selectedThreatType });
  };

  const handleTeamChange = (value) => {
    setSelectedTeam(value);
    onFilterChange({ department: selectedDepartment, team: value, threatType: selectedThreatType });
  };

  const handleThreatTypeChange = (value) => {
    setSelectedThreatType(value);
    onFilterChange({ department: selectedDepartment, team: selectedTeam, threatType: value });
  };

  const handleReset = () => {
    setSelectedDepartment('all');
    setSelectedTeam('all');
    setSelectedThreatType('all');
    onFilterChange({ department: 'all', team: 'all', threatType: 'all' });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Filter" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Advanced Filters</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <Icon name="RotateCcw" size={16} />
          <span className="text-sm">Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Department"
          options={departmentOptions}
          value={selectedDepartment}
          onChange={handleDepartmentChange}
        />

        <Select
          label="Team"
          options={teamOptions}
          value={selectedTeam}
          onChange={handleTeamChange}
        />

        <Select
          label="Threat Type"
          options={threatTypeOptions}
          value={selectedThreatType}
          onChange={handleThreatTypeChange}
        />
      </div>

      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
        <Icon name="Info" size={16} className="text-accent" />
        <p className="text-xs text-muted-foreground font-caption">
          Filters apply to all analytics widgets and charts on this page
        </p>
      </div>
    </div>
  );
};

export default FilterPanel;