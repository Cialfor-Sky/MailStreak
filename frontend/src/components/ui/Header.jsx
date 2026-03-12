import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import { getCurrentUser, formatRole } from '../../utils/auth';
import { changePassword } from '../../services/authService';
import { requestGdprAction, exportGdprData } from '../../services/gdprService';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [currentThreatLevel, setCurrentThreatLevel] = useState('low');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [gdprPassword, setGdprPassword] = useState('');
  const [gdprMessage, setGdprMessage] = useState('');
  const [gdprError, setGdprError] = useState('');
  const [isGdprLoading, setIsGdprLoading] = useState(false);
  const profileRef = useRef(null);

  const navigationItems = [
    {
      label: 'Home',
      path: '/',
      icon: 'Home',
      tooltip: 'Command center overview',
      roles: ['SUPER_ADMIN', 'ADMIN', 'USER']
    },
    {
      label: 'Threat Monitor',
      path: '/real-time-threat-monitor',
      icon: 'Shield',
      tooltip: 'Real-time threat detection and incident response',
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      label: 'Analytics Hub',
      path: '/security-analytics-hub',
      icon: 'BarChart3',
      tooltip: 'Comprehensive threat analysis and historical trends',
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      label: 'Executive View',
      path: '/executive-security-view',
      icon: 'TrendingUp',
      tooltip: 'Strategic security posture and compliance reporting',
      roles: ['SUPER_ADMIN']
    },
    {
      label: 'Email Analysis',
      path: '/email-analysis',
      icon: 'Mail',
      tooltip: 'Forensic email investigation and ML classification insights',
      roles: ['SUPER_ADMIN', 'ADMIN', 'USER']
    },
    {
      label: 'Rule Management',
      path: '/heuristic-rule-management',
      icon: 'Settings',
      tooltip: 'Customize and maintain threat detection heuristic rules',
      roles: ['SUPER_ADMIN']
    }
  ].filter(item => !user || item.roles.includes(user.role));

  useEffect(() => {
    const threatLevels = ['low', 'medium', 'high', 'critical'];
    const randomLevel = threatLevels?.[Math.floor(Math.random() * threatLevels?.length)];
    setCurrentThreatLevel(randomLevel);

    const interval = setInterval(() => {
      const newLevel = threatLevels?.[Math.floor(Math.random() * threatLevels?.length)];
      setCurrentThreatLevel(newLevel);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const getThreatLevelConfig = (level) => {
    const configs = {
      critical: {
        color: 'text-error',
        bgColor: 'bg-error/10',
        label: 'CRITICAL',
        pulse: true
      },
      high: {
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        label: 'HIGH',
        pulse: true
      },
      medium: {
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        label: 'MEDIUM',
        pulse: false
      },
      low: {
        color: 'text-success',
        bgColor: 'bg-success/10',
        label: 'LOW',
        pulse: false
      }
    };
    return configs?.[level] || configs?.low;
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const isActivePath = (path) => {
    return location?.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ oldPassword, newPassword, confirmPassword });
      setPasswordMessage('Password updated successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err?.response?.data?.detail || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleGdprAction = async (action) => {
    setGdprError('');
    setGdprMessage('');
    if (!gdprPassword) {
      setGdprError('Password is required for GDPR request.');
      return;
    }
    setIsGdprLoading(true);
    try {
      const res = await requestGdprAction({ action, password: gdprPassword, confirmAction: action });
      setGdprMessage(res?.status === 'scheduled' ? `Request scheduled (${res?.scheduledFor}).` : 'Request completed.');
      setGdprPassword('');
    } catch (err) {
      setGdprError(err?.response?.data?.detail || 'Failed to submit GDPR request.');
    } finally {
      setIsGdprLoading(false);
    }
  };

  const handleExportData = async () => {
    setGdprError('');
    setGdprMessage('');
    try {
      const res = await exportGdprData();
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gdpr-export-${user?.id || 'user'}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setGdprMessage('Data export downloaded.');
    } catch (err) {
      setGdprError(err?.response?.data?.detail || 'Failed to export data.');
    }
  };

  const threatConfig = getThreatLevelConfig(currentThreatLevel);

  return (
    <header className="fixed top-0 left-0 right-0 z-100 bg-card shadow-md border-b border-border">
      <div className="flex items-center justify-between h-[60px] px-6">
        <div className="flex items-center gap-8">
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-smooth"
            onClick={() => navigate('/')}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
              <Icon name="Shield" size={24} color="var(--color-primary)" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground font-mono">MailStreak</span>
              <span className="text-xs text-muted-foreground font-caption">Threat Intelligence Platform</span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {navigationItems?.map((item) => (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`nav-tab ${isActivePath(item?.path) ? 'active' : ''}`}
                title={item?.tooltip}
              >
                <Icon name={item?.icon} size={18} />
                <span>{item?.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4" ref={profileRef}>
          <div className={`threat-indicator ${threatConfig?.bgColor} ${threatConfig?.color} ${threatConfig?.pulse ? 'pulse' : ''}`}>
            <Icon name="AlertTriangle" size={16} />
            <span className="font-data">{threatConfig?.label}</span>
          </div>

          <button
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="user-role-badge"
            title="Open profile"
          >
            <Icon name="User" size={16} />
            <span>{formatRole(user?.role)}</span>
            <Icon name="ChevronDown" size={14} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-6 top-[56px] w-[340px] bg-card border border-border rounded-lg shadow-lg p-4 z-120">
              <div className="mb-3 border-b border-border pb-3">
                <div className="text-sm font-semibold text-foreground">{user?.name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <div className="text-xs text-primary mt-1">Role: {formatRole(user?.role)}</div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-2">
                <div className="text-xs font-semibold text-foreground">Change Password</div>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Old password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />

                {passwordError && <div className="text-xs text-destructive">{passwordError}</div>}
                {passwordMessage && <div className="text-xs text-success">{passwordMessage}</div>}

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-3 py-1.5 text-xs rounded-md bg-primary text-primary-foreground disabled:opacity-60"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-xs rounded-md bg-error/10 text-error border border-error/20"
                  >
                    Logout
                  </button>
                </div>
              </form>
              <div className="mt-3 pt-3 border-t border-border space-y-2">
                <div className="text-xs font-semibold text-foreground">Privacy Controls</div>
                <input
                  type="password"
                  value={gdprPassword}
                  onChange={(e) => setGdprPassword(e.target.value)}
                  placeholder="Confirm password for GDPR actions"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isGdprLoading}
                    onClick={handleExportData}
                    className="px-3 py-1.5 text-xs rounded-md bg-muted text-foreground"
                  >
                    Export My Data
                  </button>
                  <button
                    type="button"
                    disabled={isGdprLoading}
                    onClick={() => handleGdprAction('ANONYMIZE_DATA')}
                    className="px-3 py-1.5 text-xs rounded-md bg-warning/10 text-warning"
                  >
                    Anonymize Data
                  </button>
                  <button
                    type="button"
                    disabled={isGdprLoading}
                    onClick={() => handleGdprAction('DELETE_ACCOUNT')}
                    className="px-3 py-1.5 text-xs rounded-md bg-error/10 text-error"
                  >
                    Delete Account
                  </button>
                </div>
                {gdprError && <div className="text-xs text-destructive">{gdprError}</div>}
                {gdprMessage && <div className="text-xs text-success">{gdprMessage}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden border-t border-border">
        <nav className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
          {navigationItems?.map((item) => (
            <button
              key={item?.path}
              onClick={() => handleNavigation(item?.path)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-250 whitespace-nowrap ${
                isActivePath(item?.path)
                  ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon name={item?.icon} size={16} />
              <span>{item?.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;
