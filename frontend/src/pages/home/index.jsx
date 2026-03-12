import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { getCurrentUser, formatRole } from '../../utils/auth';
import { getAnalyticsData } from '../../services/analyticsService';
import { listUsers, createUser, deleteUser } from '../../services/usersService';

const Home = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userOpError, setUserOpError] = useState('');
  const [userOpMessage, setUserOpMessage] = useState('');
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: user?.role === 'SUPER_ADMIN' ? 'USER' : 'USER',
    password: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAnalyticsData();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load dashboard metrics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
        try {
          const res = await listUsers(userSearch);
          setUsersList(res?.users || []);
        } catch (err) {
          setUserOpError(err?.response?.data?.detail || 'Failed to load users.');
        }
      }
    };
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [user?.role, userSearch]);

  const refreshUsers = async () => {
    const res = await listUsers(userSearch);
    setUsersList(res?.users || []);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserOpError('');
    setUserOpMessage('');
    try {
      await createUser(newUserForm);
      setUserOpMessage('User created successfully.');
      setNewUserForm({
        name: '',
        email: '',
        role: user?.role === 'SUPER_ADMIN' ? 'USER' : 'USER',
        password: '',
      });
      await refreshUsers();
    } catch (err) {
      setUserOpError(err?.response?.data?.detail || 'Failed to create user.');
    }
  };

  const handleDeleteUser = async (targetUserId) => {
    setUserOpError('');
    setUserOpMessage('');
    try {
      await deleteUser(targetUserId);
      setUserOpMessage('User removed.');
      await refreshUsers();
    } catch (err) {
      setUserOpError(err?.response?.data?.detail || 'Failed to remove user.');
    }
  };

  const getRoleContent = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card bg-primary/5 border-primary/20">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="ShieldCheck" className="text-primary" />
                  Compliance Status
                </h2>
                <div className="space-y-4">
                  {[
                    { name: 'SOC 2 Type II', status: 'Compliant', color: 'text-success' },
                    { name: 'ISO 27001', status: 'Compliant', color: 'text-success' },
                    { name: 'GDPR', status: 'Verified', color: 'text-success' },
                    { name: 'HIPAA', status: 'In Audit', color: 'text-warning' }
                  ].map(c => (
                    <div key={c.name} className="flex justify-between items-center p-3 bg-background rounded-md border border-border">
                      <span className="font-medium text-foreground">{c.name}</span>
                      <span className={`text-sm font-bold ${c.color}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="TrendingUp" className="text-primary" />
                  ROI & Cost Savings
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Estimated Monthly Savings</span>
                      <span className="text-sm font-bold text-success">$12,450.00</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full">
                      <div className="bg-success h-full rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Threats Prevented</p>
                      <p className="text-2xl font-bold text-foreground">1,204</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Hours Saved</p>
                      <p className="text-2xl font-bold text-foreground">342h</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ADMIN':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Activity" className="text-primary" />
                  Live Threat Feed
                </h2>
                <div className="space-y-3">
                  {(metrics?.alerts || [
                    { severity: 'critical', threat_type: 'Phishing Attempt', timestamp: '2 mins ago' },
                    { severity: 'high', threat_type: 'Malicious Attachment', timestamp: '15 mins ago' },
                    { severity: 'medium', threat_type: 'Suspicious Link', timestamp: '1 hour ago' }
                  ]).slice(0, 4).map((a, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md border-l-4 border-l-error">
                      <div className={`w-2 h-2 rounded-full ${a.severity === 'critical' ? 'bg-error' : 'bg-warning'}`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{a.threat_type}</p>
                        <p className="text-xs text-muted-foreground">{a.timestamp}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/real-time-threat-monitor')}>Monitor</Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Timer" className="text-primary" />
                  Incident Response SLAs
                </h2>
                <div className="space-y-4">
                  {[
                    { label: 'Avg Triage Time', value: '4.2m', status: 'Within SLA' },
                    { label: 'Avg Remediation', value: '18.5m', status: 'Within SLA' },
                    { label: 'SLA Compliance', value: '99.8%', status: 'Target: 99.5%' }
                  ].map(s => (
                    <div key={s.label} className="flex justify-between items-center p-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground font-medium">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.status}</p>
                      </div>
                      <p className="text-lg font-bold text-primary">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 'USER':
        return (
          <div className="space-y-8">
            <div className="card bg-accent/5 border-accent/20">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="Inbox" className="text-accent" />
                Your Inbox Risk Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-background rounded-xl border border-border flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
                    <Icon name="ShieldCheck" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Low Risk</h3>
                  <p className="text-sm text-muted-foreground">Your recent email activity is within safe limits.</p>
                </div>
                <div className="p-6 bg-background rounded-xl border border-border flex flex-col items-center text-center">
                  <p className="text-3xl font-bold text-primary mb-2">12</p>
                  <h3 className="text-sm font-bold text-foreground mb-1">Filtered Threats</h3>
                  <p className="text-xs text-muted-foreground">Malicious emails blocked from your inbox this week.</p>
                </div>
                <div className="p-6 bg-background rounded-xl border border-border flex flex-col items-center text-center">
                  <p className="text-3xl font-bold text-accent mb-2">99%</p>
                  <h3 className="text-sm font-bold text-foreground mb-1">Security Score</h3>
                  <p className="text-xs text-muted-foreground">Based on your interaction with flagged content.</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const navigationCards = [
    {
      title: "Real-Time Monitoring",
      description: "Live threat detection feed and incident prioritization.",
      icon: "Shield",
      path: "/real-time-threat-monitor",
      roles: ["SUPER_ADMIN", "ADMIN"]
    },
    {
      title: "Email Investigation",
      description: "Forensic analysis and ML-driven classification tool.",
      icon: "Mail",
      path: "/email-analysis",
      roles: ["SUPER_ADMIN", "ADMIN", "USER"]
    },
    {
      title: "Security Analytics",
      description: "Aggregated threat patterns and historical trends.",
      icon: "BarChart3",
      path: "/security-analytics-hub",
      roles: ["SUPER_ADMIN", "ADMIN"]
    },
    {
      title: "Rule Management",
      description: "Configure and update heuristic detection logic.",
      icon: "Settings",
      path: "/heuristic-rule-management",
      roles: ["SUPER_ADMIN"]
    },
    {
      title: "Executive Overview",
      description: "Strategic posture and compliance reporting.",
      icon: "TrendingUp",
      path: "/executive-security-view",
      roles: ["SUPER_ADMIN"]
    }
  ].filter(card => !user || card.roles.includes(user.role));

  return (
    <>
      <Helmet>
        <title>Home | MailStreak</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-[100px] lg:pt-[80px] px-4 md:px-8 py-8 container mx-auto">
          {/* Welcome Section */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome, {user?.email || 'Administrator'}
            </h1>
            <p className="text-muted-foreground font-caption text-lg">
              Logged in as <span className="text-primary font-semibold">{formatRole(user?.role)}</span>. 
              {user?.role === 'SUPER_ADMIN' ? ' Strategic posture and executive insights.' : 
               user?.role === 'ADMIN' ? ' Operational threat feed and SOC management.' : 
               ' Your personal security awareness summary.'}
            </p>
          </div>

          {/* Role-Specific Content */}
          <div className="mb-12">
            {getRoleContent()}
          </div>

          {/* Quick Navigation - Filtered by Role */}
          {user?.role !== 'USER' && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Icon name="LayoutGrid" size={20} className="text-primary" />
                Administrative Tools
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {navigationCards.map((card, idx) => (
                  <div 
                    key={idx} 
                    className="card hover:border-primary/50 transition-smooth cursor-pointer group"
                    onClick={() => navigate(card.path)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 rounded-md bg-primary/10 text-primary">
                        <Icon name={card.icon} size={24} />
                      </div>
                      <Icon name="ArrowRight" size={18} className="text-muted-foreground group-hover:text-primary transition-smooth" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-smooth">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-caption">
                      {card.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Icon name="Users" size={20} className="text-primary" />
                User & Role Management
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold mb-3">Create User</h3>
                  <form onSubmit={handleCreateUser} className="space-y-3">
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    />
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, role: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {user?.role === 'SUPER_ADMIN' && <option value="ADMIN">ADMIN</option>}
                      <option value="USER">USER</option>
                    </select>
                    <input
                      type="password"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="Temporary password"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      minLength={8}
                      required
                    />
                    <Button type="submit" variant="default">Create</Button>
                  </form>
                  {userOpError && <div className="text-sm text-destructive mt-2">{userOpError}</div>}
                  {userOpMessage && <div className="text-sm text-success mt-2">{userOpMessage}</div>}
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold mb-3">Accounts</h3>
                  <div className="mb-3">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={user?.role === 'SUPER_ADMIN' ? 'Search admin or user by name/email' : 'Search user by name/email'}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="max-h-[320px] overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2">Name</th>
                          <th className="text-left py-2">Email</th>
                          <th className="text-left py-2">Role</th>
                          <th className="text-left py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList?.map((u) => (
                          <tr key={u.id} className="border-b border-border/40">
                            <td className="py-2">{u.name}</td>
                            <td className="py-2">{u.email}</td>
                            <td className="py-2"><span>{u.role}</span></td>
                            <td className="py-2">
                              {((user?.role === 'SUPER_ADMIN' && (u.role === 'ADMIN' || u.role === 'USER') && u.id !== (user?.id || user?.sub)) ||
                                (user?.role === 'ADMIN' && u.role === 'USER' && u.id !== (user?.id || user?.sub))) ? (
                                <button
                                  className="px-2 py-1 rounded bg-error/10 text-error text-xs"
                                  onClick={() => handleDeleteUser(u.id)}
                                >
                                  Remove
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Status Notification */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Icon name="Shield" size={24} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-foreground font-bold font-mono">MailStreak Engine Online</h4>
              <p className="text-sm text-muted-foreground font-caption">
                Continuous threat scanning is active. Security intelligence is {isLoading ? 'syncing...' : 'up to date'}.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;
