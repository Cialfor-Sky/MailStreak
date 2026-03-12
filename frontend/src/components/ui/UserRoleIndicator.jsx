import React, { useState, useRef, useEffect } from 'react';
import Icon from '../AppIcon';

const UserRoleIndicator = ({ className = '' }) => {
  const [currentRole, setCurrentRole] = useState('SOC Analyst');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roles = [
    {
      name: 'SOC Analyst',
      icon: 'Shield',
      permissions: ['Monitor threats', 'Respond to incidents', 'View analytics'],
      color: 'text-primary'
    },
    {
      name: 'Security Admin',
      icon: 'Settings',
      permissions: ['Full system access', 'User management', 'Configuration'],
      color: 'text-secondary'
    },
    {
      name: 'CISO',
      icon: 'Crown',
      permissions: ['Executive reports', 'Strategic oversight', 'Compliance'],
      color: 'text-accent'
    }
  ];

  const currentRoleData = roles?.find(role => role?.name === currentRole) || roles?.[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef?.current && !dropdownRef?.current?.contains(event?.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event?.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  const handleRoleChange = (roleName) => {
    setCurrentRole(roleName);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-smooth focus-visible"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <Icon name={currentRoleData?.icon} size={16} className={currentRoleData?.color} />
        <span className="text-sm font-medium">{currentRole}</span>
        <Icon 
          name={isDropdownOpen ? 'ChevronUp' : 'ChevronDown'} 
          size={14} 
          className="transition-transform duration-250"
        />
      </button>
      {isDropdownOpen && (
        <div className="dropdown absolute right-0 top-full mt-2 w-72">
          <div className="p-2">
            <div className="px-3 py-2 mb-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground font-caption">CURRENT ROLE</p>
              <p className="text-sm font-semibold text-foreground mt-1">{currentRole}</p>
            </div>

            <div className="space-y-1">
              {roles?.map((role) => (
                <button
                  key={role?.name}
                  onClick={() => handleRoleChange(role?.name)}
                  className={`dropdown-item w-full ${currentRole === role?.name ? 'bg-muted' : ''}`}
                >
                  <Icon name={role?.icon} size={16} className={role?.color} />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{role?.name}</p>
                    <p className="text-xs text-muted-foreground font-caption mt-0.5">
                      {role?.permissions?.length} permissions
                    </p>
                  </div>
                  {currentRole === role?.name && (
                    <Icon name="Check" size={16} className="text-primary" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="px-3 py-2 bg-muted/50 rounded-md">
                <p className="text-xs font-medium text-muted-foreground font-caption mb-2">PERMISSIONS</p>
                <ul className="space-y-1">
                  {currentRoleData?.permissions?.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-foreground">
                      <Icon name="CheckCircle" size={12} className="text-success" />
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRoleIndicator;