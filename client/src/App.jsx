import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation, 
  useParams,
  Navigate
} from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Package, 
  Building2, 
  Settings, 
  LogOut, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  FileDown, 
  Upload, 
  RefreshCw, 
  User as UserIcon,
  Shield,
  HelpCircle,
  Eye,
  Trash,
  Camera,
  Minimize2,
  Maximize2,
  Bell,
  Wifi,
  WifiOff,
  CornerDownRight,
  Send,
  Sliders,
  Check,
  X,
  Play,
  Mail,
  Lock,
  Briefcase,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// Auth State Helpers
const getAuthToken = () => localStorage.getItem('token');
const setAuthToken = (token) => localStorage.setItem('token', token);
const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('inspector');
};

const AuthContext = createContext(null);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const fetchUser = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            clearAuth();
          }
        } catch (e) {
          console.error('Session check failed:', e);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/inspections" element={<InspectionsList />} />
                    <Route path="/inspections/new" element={<NewInspection />} />
                    <Route path="/inspections/:id" element={<InspectionDetails />} />
                    <Route path="/products" element={<ProductsList />} />
                    <Route path="/companies" element={<CompaniesList />} />
                    <Route path="/reports" element={<ReportsList />} />
                    <Route path="/rules" element={<AdminRulesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// ----------------------------------------------------
// LOGIN PAGE
// ----------------------------------------------------
function Login() {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('inspector@labelguard.ai');
  const [password, setPassword] = useState('Inspector@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');

      setAuthToken(data.token);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#030712] overflow-hidden px-4 font-sans text-slate-100">
      
      {/* Background Decorative Grid and Glowing Orbs */}
      <div className="absolute inset-0 z-0 bg-[#030712]">
        {/* Luminous Neon Orbs */}
        <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Subtle Tech Grid Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
        
        {/* Tech dots */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{ 
            backgroundImage: `radial-gradient(#3b82f6 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

      {/* Login Card Container */}
      <div 
        className="relative z-10 max-w-md w-full backdrop-blur-xl border rounded-[24px] p-8 shadow-2xl transition-all duration-300"
        style={{
          background: 'rgba(10, 20, 45, 0.65)',
          borderColor: 'rgba(120, 170, 255, 0.25)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.12), 0 0 60px rgba(139, 92, 246, 0.06), inset 0 0 20px rgba(120, 170, 255, 0.05)'
        }}
      >
        <div className="text-center mb-8">
          {/* Animated Neon Badge Container */}
          <div 
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 border transition-all duration-500 animate-pulse"
            style={{
              background: 'rgba(59, 130, 246, 0.08)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
            }}
          >
            <Shield className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.15em] text-white">LABELGUARD AI</h1>
          <p className="text-slate-400 text-[10px] mt-1.5 uppercase tracking-widest font-semibold opacity-85">
            AI-Powered Legal Metrology Inspection & Enforcement
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 bg-red-950/30 border border-red-800/40 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleLogin(e)} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Inspector Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#000a1e]/55 border border-[#64a0ff]/30 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs transition duration-250 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#000a1e]/55 border border-[#64a0ff]/30 rounded-xl py-2.5 pl-10 pr-4 text-slate-100 text-xs transition duration-250 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800 disabled:to-indigo-800 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Authenticate Credentials'}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-800/40 pt-5 text-center">
          <p className="text-slate-500 text-[9px] uppercase tracking-widest font-bold mb-3">Select Seeded Roles</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleLogin(null, 'inspector@labelguard.ai', 'Inspector@123')}
              className="bg-slate-950/40 border border-slate-800/50 hover:border-blue-500/40 hover:bg-blue-600/5 text-[10px] py-2 rounded-lg font-mono text-slate-350 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspector</span>
            </button>
            <button 
              onClick={() => handleLogin(null, 'official@labelguard.ai', 'Inspector@123')}
              className="bg-slate-950/40 border border-slate-800/50 hover:border-blue-500/40 hover:bg-blue-600/5 text-[10px] py-2 rounded-lg font-mono text-slate-350 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-450" />
              <span>Official</span>
            </button>
            <button 
              onClick={() => handleLogin(null, 'admin@labelguard.ai', 'Inspector@123')}
              className="bg-slate-950/40 border border-slate-800/50 hover:border-blue-500/40 hover:bg-blue-600/5 text-[10px] py-2 rounded-lg font-mono text-slate-350 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Decorative Footer */}
        <div className="mt-8 text-center text-[9px] text-slate-650 font-semibold tracking-widest uppercase select-none">
          Secured Access • Trusted Enforcement • Safer Consumers
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// MAIN LAYOUT
// ----------------------------------------------------
function MainLayout({ children }) {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  // Monitor Connection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check localStorage drafts
    const drafts = JSON.parse(localStorage.getItem('labelguard_drafts') || '[]');
    setSyncCount(drafts.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch notifications
  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSyncDrafts = async () => {
    if (!isOnline) {
      alert('Cannot sync while offline.');
      return;
    }
    const drafts = JSON.parse(localStorage.getItem('labelguard_drafts') || '[]');
    if (drafts.length === 0) return;

    let success = 0;
    for (const d of drafts) {
      try {
        const res = await fetch('/api/inspections', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(d)
        });
        if (res.ok) success++;
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.removeItem('labelguard_drafts');
    setSyncCount(0);
    alert(`Successfully synchronized ${success} drafts to server!`);
    window.location.reload();
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
    { label: 'New Inspection', path: '/inspections/new', icon: PlusCircle, roles: ['INSPECTOR', 'ADMIN'] },
    { label: 'Inspections', path: '/inspections', icon: FileText, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
    { label: 'Products', path: '/products', icon: Package, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
    { label: 'Companies', path: '/companies', icon: Building2, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
    { label: 'Reports', path: '/reports', icon: FileDown, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
    { label: 'Rules Config', path: '/rules', icon: Sliders, roles: ['ADMIN'] },
    { label: 'Settings', path: '/settings', icon: Settings, roles: ['INSPECTOR', 'OFFICIAL', 'ADMIN'] },
  ];

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen flex bg-slate-955 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="font-bold tracking-wider text-base text-white">LabelGuard AI</span>
          </Link>
          <span className="text-[9px] bg-slate-800 border border-slate-700 px-1 py-0.5 rounded font-mono">v1.1</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems
            .filter(item => item.roles.includes(user?.role))
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs uppercase">
              {user?.username?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.username}</p>
              <span className="text-[9px] bg-blue-600/10 text-blue-400 border border-blue-500/20 px-1 rounded uppercase tracking-wider font-bold">
                {user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-750 text-slate-400 font-semibold py-2 rounded-lg text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Session
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            {isOnline ? (
              <span className="flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                <Wifi className="w-3.5 h-3.5" /> Online Mode
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" /> Offline Mode
              </span>
            )}

            {syncCount > 0 && (
              <button 
                onClick={handleSyncDrafts}
                className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 hover:bg-blue-600/20 px-2.5 py-1 rounded-full border border-blue-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync {syncCount} Drafts
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-800 transition"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-650 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-10 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Alert Notifications</span>
                  {unreadNotifs.length > 0 && (
                    <span className="text-[10px] text-red-400 font-semibold bg-red-500/10 px-1.5 rounded">
                      {unreadNotifs.length} new
                    </span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No recent notifications.</div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`p-3 text-xs transition cursor-pointer hover:bg-slate-850 ${!notif.read ? 'bg-blue-900/10' : ''}`}
                        onClick={() => handleMarkRead(notif._id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white">{notif.title}</span>
                          {!notif.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-slate-500 block mt-1.5">
                          {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="h-8 w-px bg-slate-800"></div>
            
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Regulatory Agency</p>
              <p className="text-xs font-bold text-white">Govt. Metrology Inspectorate</p>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-955">
          {children}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: DASHBOARD
// ----------------------------------------------------
function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Guided demo orchestration states
  const [demoStep, setDemoStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard', {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const triggerGuidedDemo = () => {
    setDemoStep(1);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const stats = data?.stats || { totalInspections: 0, productsCount: 0, totalViolations: 0, avgScore: 100 };
  const recentInspections = data?.recentInspections || [];
  const trend = data?.trend || [];
  const severity = data?.severity || { high: 0, medium: 0, low: 0 };

  const severityPieData = [
    { name: 'High Risk', value: severity.high, color: '#dc2626' },
    { name: 'Medium Risk', value: severity.medium, color: '#f59e0b' },
    { name: 'Low Risk', value: severity.low, color: '#3b82f6' }
  ].filter(s => s.value > 0);

  return (
    <div className="relative">
      {/* Guided Demo Box */}
      {demoStep === 1 && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-blue-500/35 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex gap-2 items-center mb-4">
              <Play className="w-5 h-5 text-blue-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Guided Inspection Demo</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Welcome to the LabelGuard AI workflow tour. We will walk you step-by-step through creating a packaged commodity label verification, inspecting image quality, viewing extracted metrology declarations, and detecting violations.
            </p>
            <button 
              onClick={() => {
                setDemoStep(0);
                navigate('/inspections/new');
              }}
              className="w-full bg-blue-650 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition"
            >
              Start Inspection Draft
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
            Compliance tracker for packaged commodities rules, 2011
          </p>
        </div>
        
        <button 
          onClick={triggerGuidedDemo}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition shadow-lg"
        >
          <Play className="w-4 h-4 fill-white" /> Launch Guided Demo
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Inspections', val: stats.totalInspections, detail: 'Logged logs', icon: FileText, color: 'text-blue-500' },
          { label: 'Packaged Commodities', val: stats.productsCount, detail: 'Registered items', icon: Package, color: 'text-indigo-500' },
          { label: 'Violations Flagged', val: stats.totalViolations, detail: 'Rules breached', icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Compliance Index', val: `${stats.avgScore}%`, detail: 'Average score', icon: Shield, color: 'text-green-500' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{kpi.label}</span>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className="text-3xl font-extrabold text-white mb-1">{kpi.val}</p>
              <span className="text-[10px] text-slate-500">{kpi.detail}</span>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Metrology Score Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Risk Severity Matrix</h2>
            {severityPieData.length > 0 ? (
              <div className="h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-xs text-slate-500">
                No active violations detected.
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-slate-800 pt-3">
            <div className="text-red-500 font-bold">High: {severity.high}</div>
            <div className="text-amber-500 font-bold">Med: {severity.medium}</div>
            <div className="text-blue-500 font-bold">Low: {severity.low}</div>
          </div>
        </div>
      </div>

      {/* Recent Inspections Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Enforcement Log</h2>
          <Link to="/inspections" className="text-xs text-blue-500 hover:text-blue-400 font-bold uppercase">View Logs</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Commodity</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Risk</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
              {recentInspections.map((insp) => (
                <tr key={insp.inspectionId} className="hover:bg-slate-850">
                  <td className="px-6 py-3.5 font-bold text-white font-mono">{insp.inspectionId}</td>
                  <td className="px-6 py-3.5 font-medium">{insp.product}</td>
                  <td className="px-6 py-3.5 text-slate-450">{insp.company}</td>
                  <td className="px-6 py-3.5">
                    <span className={`font-bold ${insp.score >= 90 ? 'text-green-400' : (insp.score >= 50 ? 'text-amber-500' : 'text-red-500')}`}>
                      {insp.score}%
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      insp.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {insp.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider ${
                      insp.status === 'COMPLIANT' 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                        : (insp.status === 'REVIEW REQUIRED' 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                            : 'bg-red-500/10 border border-red-500/20 text-red-400')
                    }`}>
                      {insp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link to={`/inspections/${insp.inspectionId}`} className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: NEW INSPECTION (Guided Multi-step wizard)
// ----------------------------------------------------
function NewInspection() {
  const [step, setStep] = useState(1);
  const [frontLabel, setFrontLabel] = useState(null);
  const [backLabel, setBackLabel] = useState(null);
  const [frontPreview, setFrontPreview] = useState('');
  const [backPreview, setBackPreview] = useState('');

  // Camera integration states
  const [useCamera, setUseCamera] = useState(false);
  const [cameraLabelType, setCameraLabelType] = useState('front');

  const [category, setCategory] = useState('Food Products');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [notes, setNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [analysisError, setAnalysisError] = useState(null);
  const navigate = useNavigate();

  // Bounding box evidence zoom states
  const [activeEvidenceField, setActiveEvidenceField] = useState('productName');
  const [zoomScale, setZoomScale] = useState(1);

  // Inspector manual review states
  const [reviewsDone, setReviewsDone] = useState({});
  const [corrections, setCorrections] = useState({});

  const handleDemoMode = () => {
    setFrontPreview('/uploads/demo_biscuits_front.jpg');
    setBackPreview('/uploads/demo_biscuits_back.jpg');
    setStep(2);
  };

  const handleCameraCapture = () => {
    // Mock webcam snap
    const mockImage = cameraLabelType === 'front' 
      ? '/uploads/demo_biscuits_front.jpg' 
      : '/uploads/demo_biscuits_back.jpg';
    
    if (cameraLabelType === 'front') {
      setFrontPreview(mockImage);
    } else {
      setBackPreview(mockImage);
    }
    setUseCamera(false);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisError(null);
    setStep(3);

    const stages = [
      'Uploading Image',
      'Analyzing Image Quality',
      'Reading Label',
      'Extracting Declarations',
      'Checking Compliance Rules',
      'Generating Evidence',
      'Calculating Score',
      'Preparing Inspection Result'
    ];

    let currentStageIndex = 0;
    setLoadingStage(stages[0]);

    const interval = setInterval(() => {
      if (currentStageIndex < 4) {
        currentStageIndex++;
        setLoadingStage(stages[currentStageIndex]);
      }
    }, 800);

    const formData = new FormData();
    formData.append('category', category);
    if (frontPreview.includes('demo_biscuits_front')) {
      formData.append('demoProductKey', 'shakti_biscuits');
    } else {
      if (frontLabel) formData.append('frontLabel', frontLabel);
      if (backLabel) formData.append('backLabel', backLabel);
    }

    try {
      const response = await fetch('/api/inspections/analyze', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(data.error || data.message || 'Unknown analysis error');
        err.stage = data.stage || 'IMAGE_PROCESSING';
        err.details = data.details || '';
        throw err;
      }

      clearInterval(interval);

      for (let i = 5; i < stages.length; i++) {
        setLoadingStage(stages[i]);
        await new Promise(r => setTimeout(r, 450));
      }
      
      setAnalysisResult(data);
      setStep(4);
    } catch (e) {
      clearInterval(interval);
      console.error(e);
      setAnalysisError({
        error: e.message,
        stage: e.stage || 'IMAGE_PROCESSING',
        details: e.details || e.stack || ''
      });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInspection = async () => {
    const isOnline = navigator.onLine;

    // Apply manual review edits to final payload
    const finalDeclarations = { ...analysisResult.declarations };
    Object.keys(corrections).forEach(k => {
      if (corrections[k]) {
        finalDeclarations[k].value = corrections[k];
      }
    });

    const finalChecks = analysisResult.checks.map(c => {
      if (reviewsDone[c.ruleId] === 'accepted') {
        return { ...c, status: 'PASS', reason: 'Manually verified & accepted by Inspector.' };
      } else if (reviewsDone[c.ruleId] === 'dismissed') {
        return { ...c, status: 'NOT_APPLICABLE', reason: 'Dismissed by Inspector.' };
      }
      return c;
    });

    // Re-calculate compliance score based on overrides
    const totalChecks = finalChecks.length;
    const passedChecks = finalChecks.filter(c => c.status === 'PASS').length;
    const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

    const payload = {
      product: finalDeclarations.productName?.value || 'Shakti Premium Biscuits',
      company: finalDeclarations.manufacturerName?.value || 'Shakti Consumer Products',
      category: category,
      images: analysisResult.images,
      ocrText: analysisResult.ocrText,
      declarations: finalDeclarations,
      checks: finalChecks,
      violations: analysisResult.violations.filter(v => !reviewsDone[v.ruleId]),
      score: score,
      status: score >= 90 ? 'COMPLIANT' : 'REVIEW REQUIRED',
      riskLevel: score >= 90 ? 'LOW' : 'HIGH',
      location: 'Regional Testing Facility',
      notes: notes
    };

    if (isOnline) {
      try {
        const response = await fetch('/api/inspections', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setSaveSuccess(true);
          setTimeout(() => navigate('/inspections'), 1500);
        }
      } catch (e) {
        alert('Error saving inspection.');
      }
    } else {
      // Offline draft save
      const drafts = JSON.parse(localStorage.getItem('labelguard_drafts') || '[]');
      drafts.push(payload);
      localStorage.setItem('labelguard_drafts', JSON.stringify(drafts));
      setSaveSuccess(true);
      alert('Network offline. Draft saved locally to device storage. Sync when connected.');
      setTimeout(() => navigate('/inspections'), 1500);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Label Analysis Wizard</h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
            Deterministic rule engine with inspector manual review overrides
          </p>
        </div>

        {step === 1 && (
          <button 
            onClick={handleDemoMode}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition shadow"
          >
            Load Demo Product
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 mb-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {[
          { num: 1, label: 'Upload Panels' },
          { num: 2, label: 'Quality Analysis' },
          { num: 3, label: 'Extracting OCR' },
          { num: 4, label: 'Compliance Audit' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s.num 
                ? 'bg-blue-650 text-white shadow-lg' 
                : (step > s.num ? 'bg-green-600/20 text-green-400' : 'bg-slate-950 text-slate-600 border border-slate-850')
            }`}>
              {s.num}
            </span>
            <span className={step === s.num ? 'text-white' : ''}>{s.label}</span>
            {s.num < 4 && <div className="w-12 h-px bg-slate-800 hidden sm:block"></div>}
          </div>
        ))}
      </div>

      {/* Camera Panel modal */}
      {useCamera && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Webcam Label Scanner</h3>
            <div className="bg-slate-950 rounded-lg border border-slate-850 aspect-video mb-6 flex flex-col items-center justify-center text-slate-500">
              <Camera className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
              <p className="text-[10px] uppercase font-bold text-slate-500">Camera source active</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setUseCamera(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleCameraCapture}
                className="flex-1 bg-blue-650 hover:bg-blue-700 text-white font-bold py-2 rounded text-xs transition"
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR CARD */}
      {analysisError && (
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-6 mb-8 text-left">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-900/30 rounded-lg text-red-400 border border-red-850">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Analysis Failed</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                An error occurred during the <strong className="text-white">{analysisError.stage}</strong> stage of the compliance analysis pipeline.
              </p>
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 mt-4 font-mono text-[10px] text-red-400 max-h-40 overflow-y-auto">
                <strong>Reason:</strong> {analysisError.error}
                {analysisError.details && (
                  <div className="mt-2 text-slate-500 border-t border-slate-900 pt-2 leading-relaxed">
                    {analysisError.details}
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    handleAnalyze();
                  }}
                  className="bg-blue-650 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded text-[10px] uppercase tracking-wider transition"
                >
                  Retry Analysis
                </button>
                <button
                  onClick={() => {
                    setAnalysisError(null);
                  }}
                  className="bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold py-1.5 px-4 rounded text-[10px] uppercase tracking-wider transition border border-slate-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Upload Front/Back labels */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-900 border border-slate-800 rounded-xl p-8">
          <div>
            <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Packaged Commodity Images</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase">Front Label</label>
                  <button 
                    onClick={() => { setUseCamera(true); setCameraLabelType('front'); }}
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5" /> Webcam Scanner
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition relative bg-slate-950/20">
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const f = e.target.files[0];
                      setFrontLabel(f);
                      if (f) setFrontPreview(URL.createObjectURL(f));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-450 font-medium">Drag and drop, or click to upload front panel</p>
                </div>
                {frontPreview && (
                  <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-slate-850 relative">
                    <img src={frontPreview} alt="Front panel" className="max-h-32 mx-auto rounded" />
                    <button 
                      onClick={() => { setFrontLabel(null); setFrontPreview(''); }}
                      className="absolute top-2 right-2 bg-red-650/80 p-1 rounded-full text-slate-100 hover:bg-red-700"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase">Back / Declarations Panel</label>
                  <button 
                    onClick={() => { setUseCamera(true); setCameraLabelType('back'); }}
                    className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Camera className="w-3.5 h-3.5" /> Webcam Scanner
                  </button>
                </div>
                <div className="border-2 border-dashed border-slate-800 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition relative bg-slate-950/20">
                  <input 
                    type="file" 
                    onChange={(e) => {
                      const f = e.target.files[0];
                      setBackLabel(f);
                      if (f) setBackPreview(URL.createObjectURL(f));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <Upload className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-450 font-medium">Drag and drop, or click to upload declarations panel</p>
                </div>
                {backPreview && (
                  <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-slate-850 relative">
                    <img src={backPreview} alt="Back panel" className="max-h-32 mx-auto rounded" />
                    <button 
                      onClick={() => { setBackLabel(null); setBackPreview(''); }}
                      className="absolute top-2 right-2 bg-red-650/80 p-1 rounded-full text-slate-100 hover:bg-red-700"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between border-l border-slate-800 pl-8">
            <div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Classification Ruleset</h3>
              <p className="text-xs text-slate-400 mb-4">
                Select the legal classification category to automatically trigger correct deterministic rules mapping.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Rule Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2 px-3 text-slate-200 text-xs focus:outline-none"
                  >
                    <option value="Food Products">Food Products</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Household Goods">Household Goods</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                onClick={() => setStep(2)}
                disabled={!frontPreview && !backPreview}
                className="w-full bg-blue-650 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition"
              >
                Proceed to Preprocessing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Quality Analysis */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
          <h2 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Image Preprocessing & Quality verification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Calculated Blur Index', val: 'Low Blur', detail: 'Sharp Focus (Sharpness: 88%)', color: 'text-green-400' },
              { label: 'Panel Contrast', val: 'Excellent', detail: 'Contrast ratio 4.5:1', color: 'text-green-400' },
              { label: 'Brightness Scale', val: '75%', detail: 'Well Illuminated', color: 'text-green-400' },
              { label: 'OCR Quality readiness', val: '92/100', detail: 'Passes metrology standards', color: 'text-blue-450' }
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-950 border border-slate-850 rounded-lg p-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold">{stat.label}</span>
                <p className={`text-lg font-bold mt-1 ${stat.color}`}>{stat.val}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{stat.detail}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-end">
            <button 
              onClick={() => setStep(1)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg text-xs uppercase transition"
            >
              Back
            </button>
            <button 
              onClick={handleAnalyze}
              className="bg-blue-650 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-xs uppercase tracking-wider transition"
            >
              Execute OCR & Verification
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Loading */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
          <h2 className="text-base font-bold text-white mb-2 uppercase tracking-wider">{loadingStage}...</h2>
          <div className="w-full max-w-xs bg-slate-850 rounded-full h-1.5 mx-auto mb-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-1.5 transition-all duration-500" 
              style={{ 
                width: `${
                  loadingStage === 'Uploading Image' ? 12 :
                  loadingStage === 'Analyzing Image Quality' ? 25 :
                  loadingStage === 'Reading Label' ? 38 :
                  loadingStage === 'Extracting Declarations' ? 50 :
                  loadingStage === 'Checking Compliance Rules' ? 63 :
                  loadingStage === 'Generating Evidence' ? 75 :
                  loadingStage === 'Calculating Score' ? 88 : 100
                }%` 
              }}
            ></div>
          </div>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Extracting label coordinates, normalizing currencies, dates and quantities, and running structured legal metrology check engine...
          </p>
        </div>
      )}

      {/* STEP 4: Compliance audit */}
      {step === 4 && analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Verification Columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Score header */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center text-xl font-extrabold text-white">
                  <span className={analysisResult.score >= 90 ? 'text-green-400' : 'text-amber-500'}>
                    {analysisResult.score}%
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Metrology Compliance Index</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      analysisResult.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {analysisResult.riskLevel} RISK
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      analysisResult.preprocessingStats?.analysisType === 'REAL AI ANALYSIS' 
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {analysisResult.preprocessingStats?.analysisType || 'DEMO ANALYSIS'}
                    </span>
                    <span className="text-[10px] text-slate-500">Calculated score based on active metrology rules.</span>
                  </div>
                </div>
              </div>

              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                  analysisResult.status === 'COMPLIANT' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                    : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                }`}>
                  {analysisResult.status}
                </span>
              </div>
            </div>

            {/* Structured Declarations Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Declarations Inspector Review</h3>
                <span className="text-[10px] text-slate-400">Click field to highlight evidence region.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                      <th className="px-6 py-3">Declaration Item</th>
                      <th className="px-6 py-3">Parsed Value</th>
                      <th className="px-6 py-3">Manual Correction override</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300 font-medium">
                    {Object.entries(analysisResult.declarations).map(([key, field]) => {
                      const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <tr 
                          key={key} 
                          className={`hover:bg-slate-850 cursor-pointer ${activeEvidenceField === key ? 'bg-blue-650/10' : ''}`}
                          onClick={() => {
                            if (field.status !== 'Missing') {
                              setActiveEvidenceField(key);
                            }
                          }}
                        >
                          <td className="px-6 py-3 font-semibold text-white">{title}</td>
                          <td className="px-6 py-3 font-mono truncate max-w-[160px] text-slate-400">
                            {field.value || '—'}
                          </td>
                          <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              value={corrections[key] || ''}
                              onChange={(e) => setCorrections({ ...corrections, [key]: e.target.value })}
                              placeholder="Correct value..."
                              className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-white max-w-[140px] focus:outline-none focus:border-blue-500"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              field.status === 'Conflict' 
                                ? 'bg-amber-600/20 border border-amber-500/20 text-amber-400' 
                                : (field.status === 'Detected' 
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                                    : 'bg-red-500/10 border border-red-500/20 text-red-400')
                            }`}>
                              {field.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rules Check Verification Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Rules Verification Override</h3>
              <div className="space-y-4">
                {analysisResult.checks.map((check) => (
                  <div key={check.ruleId} className="flex gap-4 items-start justify-between p-4 bg-slate-950 rounded-lg border border-slate-850">
                    <div className="flex gap-3 items-start">
                      <span className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[9px] font-bold ${
                        reviewsDone[check.ruleId] 
                          ? 'bg-green-600 text-white' 
                          : (check.status === 'PASS' ? 'bg-green-500/10 text-green-400 border border-green-500/25' : 'bg-red-500/10 text-red-400 border border-red-500/25')
                      }`}>
                        {reviewsDone[check.ruleId] ? 'RESOLVED' : check.status}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white">{check.ruleId}: {check.reason}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Metrology Standard applied: {check.field}.</p>
                      </div>
                    </div>

                    {check.status !== 'PASS' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setReviewsDone({ ...reviewsDone, [check.ruleId]: 'accepted' })}
                          className="bg-green-950 hover:bg-green-900 border border-green-800/40 text-green-400 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => setReviewsDone({ ...reviewsDone, [check.ruleId]: 'dismissed' })}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded text-[10px] font-bold uppercase transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Right Column */}
          <div className="space-y-8">
            {/* Visual Evidence zoom pan */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Visual Evidence Panel</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setZoomScale(Math.min(zoomScale + 0.25, 2))}
                    className="p-1.5 rounded bg-slate-950 border border-slate-850 hover:bg-slate-800"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setZoomScale(Math.max(zoomScale - 0.25, 0.75))}
                    className="p-1.5 rounded bg-slate-950 border border-slate-850 hover:bg-slate-800"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 aspect-video relative overflow-hidden flex items-center justify-center">
                <div 
                  className="transition-transform duration-200 origin-center w-full h-full flex items-center justify-center"
                  style={{ transform: `scale(${zoomScale})` }}
                >
                  <img 
                    src={
                      activeEvidenceField === 'productName' || activeEvidenceField === 'genericName'
                        ? (analysisResult.images?.frontLabel || '/uploads/demo_biscuits_front.jpg')
                        : (analysisResult.images?.backLabel || '/uploads/demo_biscuits_back.jpg')
                    } 
                    alt="Evidence label" 
                    className="max-h-full object-contain rounded"
                  />
                  
                  {/* Evidence Highlight crops coordinates */}
                  {analysisResult.declarations?.[activeEvidenceField]?.region ? (
                    <div 
                      className="absolute border-2 border-red-500 bg-red-500/10 transition-all duration-300"
                      style={{
                        left: `${analysisResult.declarations[activeEvidenceField].region[0]}%`,
                        top: `${analysisResult.declarations[activeEvidenceField].region[1]}%`,
                        width: `${analysisResult.declarations[activeEvidenceField].region[2]}%`,
                        height: `${analysisResult.declarations[activeEvidenceField].region[3]}%`
                      }}
                    ></div>
                  ) : (
                    // In demo mode or if using demo assets, fallback to the hardcoded highlights to avoid blank demo viewer
                    (analysisResult.preprocessingStats?.analysisType !== 'REAL AI ANALYSIS') ? (
                      <div 
                        className="absolute border-2 border-red-500 bg-red-500/10 transition-all duration-300"
                        style={{
                          left: activeEvidenceField === 'productName' ? '30%' : (activeEvidenceField === 'genericName' ? '30%' : '15%'),
                          top: activeEvidenceField === 'productName' ? '20%' : (activeEvidenceField === 'genericName' ? '35%' : '60%'),
                          width: activeEvidenceField === 'productName' ? '45%' : (activeEvidenceField === 'genericName' ? '40%' : '40%'),
                          height: activeEvidenceField === 'productName' ? '12%' : (activeEvidenceField === 'genericName' ? '8%' : '10%')
                        }}
                      ></div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500">
                <div>
                  Active highlight field: <span className="text-white font-bold">{activeEvidenceField}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  analysisResult.declarations?.[activeEvidenceField]?.region
                    ? 'bg-green-500/10 text-green-400'
                    : (analysisResult.preprocessingStats?.analysisType === 'REAL AI ANALYSIS' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400')
                }`}>
                  {analysisResult.declarations?.[activeEvidenceField]?.region 
                    ? 'Region Plotted' 
                    : (analysisResult.preprocessingStats?.analysisType === 'REAL AI ANALYSIS' ? 'Evidence region unavailable' : 'Region Plotted (Demo)')
                  }
                </span>
              </div>
            </div>

            {/* Inspector Copilot Q&A */}
            <CopilotPanel inspectionId={analysisResult.inspectionId} />

            {/* Notes & Save panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Audit Notes</h3>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter enforcement action or notes..."
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none mb-4 h-24"
              />

              <button 
                onClick={handleSaveInspection}
                disabled={saveSuccess}
                className="w-full bg-blue-650 hover:bg-blue-700 disabled:bg-green-700 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition"
              >
                {saveSuccess ? 'Logs saved successfully!' : 'Finalize & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inspector Copilot Helper component
function CopilotPanel({ inspectionId }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your Metrology Inspection Copilot. You can ask me questions about this product checks, compliance score or missing labels.' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;
    const userQ = question;
    setMessages(prev => [...prev, { role: 'user', text: userQ }]);
    setQuestion('');
    setLoading(true);

    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}` 
        },
        body: JSON.stringify({ question: userQ, inspectionId })
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Failed to retrieve copilot guidance.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col max-h-[300px]">
      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Inspector Copilot Co-Advisor</h3>
      
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-2 bg-slate-950 rounded border border-slate-850 max-h-48 text-[11px]">
        {messages.map((m, idx) => (
          <div key={idx} className={`p-2 rounded ${m.role === 'assistant' ? 'bg-blue-950/40 text-slate-300' : 'bg-slate-800 text-white text-right ml-auto max-w-[80%]'}`}>
            <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
          </div>
        ))}
        {loading && <div className="text-slate-500 animate-pulse">Consulting rules base...</div>}
      </div>

      <div className="flex gap-2">
        <input 
          type="text" 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask rules guidance..."
          className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-white focus:outline-none"
        />
        <button 
          onClick={handleSend}
          className="bg-blue-650 p-1.5 rounded hover:bg-blue-700 text-white"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: INSPECTIONS LIST (Audit logs)
// ----------------------------------------------------
function InspectionsList() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const response = await fetch('/api/inspections', {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setInspections(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Filter logic
  const filtered = inspections.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (riskFilter && item.riskLevel !== riskFilter) return false;
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      return item.product.toLowerCase().includes(s) || 
             item.company.toLowerCase().includes(s) || 
             item.inspectionId.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inspections Audit Log</h1>
          <p className="text-slate-400 text-sm mt-1">Official registry of packaged commodity metrology inspections.</p>
        </div>
        <Link to="/inspections/new" className="bg-blue-650 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition">
          New Inspection
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded px-2 py-1.5">
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white w-full"
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="REVIEW REQUIRED">Review Required</option>
          <option value="NON-COMPLIANT">Non-Compliant</option>
        </select>

        <select 
          value={riskFilter} 
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
        >
          <option value="">All Risk levels</option>
          <option value="LOW">Low Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="HIGH">High Risk</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Score</th>
                <th className="px-6 py-3">Risk Level</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
              {filtered.map((insp) => (
                <tr key={insp.inspectionId} className="hover:bg-slate-850">
                  <td className="px-6 py-3.5 font-bold font-mono text-white">{insp.inspectionId}</td>
                  <td className="px-6 py-3.5 font-medium">{insp.product}</td>
                  <td className="px-6 py-3.5 text-slate-400">{insp.company}</td>
                  <td className="px-6 py-3.5 font-bold">{insp.score}%</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      insp.riskLevel === 'HIGH' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {insp.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider ${
                      insp.status === 'COMPLIANT' 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                        : (insp.status === 'REVIEW REQUIRED' 
                            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                            : 'bg-red-500/10 border border-red-500/20 text-red-400')
                    }`}>
                      {insp.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link to={`/inspections/${insp.inspectionId}`} className="text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: INSPECTION DETAILS
// ----------------------------------------------------
function InspectionDetails() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await fetch(`/api/inspections/${id}`, {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setInspection(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleDownloadReport = () => {
    window.open(`/api/reports/${id}?authorization=Bearer ${getAuthToken()}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!inspection) {
    return <div className="text-center text-slate-500 mt-12">Inspection not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div>
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">{inspection.inspectionId}</span>
          <h1 className="text-xl font-bold text-white mt-1">{inspection.product}</h1>
          <p className="text-slate-400 text-xs mt-1">Company: {inspection.company}</p>
        </div>

        <button 
          onClick={handleDownloadReport}
          className="flex items-center gap-2 bg-blue-650 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition shadow"
        >
          <FileDown className="w-4 h-4" /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Index summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center text-lg font-bold text-white">
                {inspection.score}%
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Compliance Index</h3>
                <p className="text-[10px] text-slate-500">Legal metrology standards score</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                inspection.status === 'COMPLIANT' 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                {inspection.status}
              </span>
            </div>
          </div>

          {/* Audit trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Inspection Audit Trail</h3>
            <div className="space-y-4">
              {inspection.auditTrail?.map((trail, idx) => (
                <div key={idx} className="flex gap-4 items-start pl-4 border-l-2 border-slate-800 relative">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                  <div>
                    <p className="text-xs text-white font-bold">{trail.action}: <span className="text-slate-400 font-semibold">{trail.details}</span></p>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">{new Date(trail.timestamp).toLocaleString()} | Operator: {trail.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Info panels */}
        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Metadata</h3>
              <p className="text-xs text-white">Inspector: <span className="text-slate-400">{inspection.inspector}</span></p>
              <p className="text-xs text-white">Inspection date: <span className="text-slate-400">{new Date(inspection.createdAt).toLocaleDateString()}</span></p>
            </div>

            <div>
              <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Audit Notes</h3>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-850 min-h-20 leading-relaxed font-sans">
                {inspection.notes || 'No notes logged.'}
              </p>
            </div>
          </div>

          {/* Inspector Copilot contextualized */}
          <CopilotPanel inspectionId={inspection.inspectionId} />
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: PRODUCTS CATALOG
// ----------------------------------------------------
function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setProducts(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Commodity Catalog</h1>
        <p className="text-slate-400 text-sm mt-1">Audit score logs mapped to unique packaged commodities.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <th className="px-6 py-3">Product Name</th>
              <th className="px-6 py-3">Company / Manufacturer</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Inspections log</th>
              <th className="px-6 py-3">Average Compliance Score</th>
              <th className="px-6 py-3">Last Audited</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-slate-850">
                <td className="px-6 py-3.5 font-bold text-white">{p.name}</td>
                <td className="px-6 py-3.5 text-slate-450">{p.company}</td>
                <td className="px-6 py-3.5">{p.category}</td>
                <td className="px-6 py-3.5">{p.inspectionsCount}</td>
                <td className="px-6 py-3.5 font-bold text-green-400">{p.averageScore}%</td>
                <td className="px-6 py-3.5 text-slate-500">
                  {p.lastInspectionDate ? new Date(p.lastInspectionDate).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: COMPANY INTELLIGENCE
// ----------------------------------------------------
function CompaniesList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies', {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setCompanies(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Company Registry</h1>
        <p className="text-slate-400 text-sm mt-1">Audit statistics tracking repeat metrology violations of manufacturers.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Unique Items</th>
              <th className="px-6 py-3">Total Inspections</th>
              <th className="px-6 py-3">Violations count</th>
              <th className="px-6 py-3">Average Score</th>
              <th className="px-6 py-3">Repeat Issues observed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
            {companies.map((c) => (
              <tr key={c._id} className="hover:bg-slate-850">
                <td className="px-6 py-3.5 font-bold text-white">{c.name}</td>
                <td className="px-6 py-3.5">{c.productsCount}</td>
                <td className="px-6 py-3.5">{c.inspectionsCount}</td>
                <td className="px-6 py-3.5 text-red-400 font-bold">{c.violationsCount}</td>
                <td className="px-6 py-3.5 font-bold text-green-400">{c.averageScore}%</td>
                <td className="px-6 py-3.5 text-slate-500 truncate max-w-[200px]" title={c.repeatIssues?.join(', ')}>
                  {c.repeatIssues?.length > 0 ? c.repeatIssues.join(', ') : 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: REPORTS LIST (VIEW DOWNLOADS)
// ----------------------------------------------------
function ReportsList() {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const response = await fetch('/api/inspections', {
          headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        const json = await response.json();
        setInspections(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchInspections();
  }, []);

  const handleDownload = (id) => {
    window.open(`/api/reports/${id}?authorization=Bearer ${getAuthToken()}`, '_blank');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Enforcement Reports</h1>
        <p className="text-slate-400 text-sm mt-1">Export, download, and print official AI-assisted enforcement reports.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <th className="px-6 py-3">Report ID</th>
              <th className="px-6 py-3">Product Name</th>
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Compliance score</th>
              <th className="px-6 py-3">Audit Date</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
            {inspections.map((insp) => (
              <tr key={insp.inspectionId} className="hover:bg-slate-850">
                <td className="px-6 py-3.5 font-bold font-mono text-white">REP-{insp.inspectionId}</td>
                <td className="px-6 py-3.5 font-medium">{insp.product}</td>
                <td className="px-6 py-3.5 text-slate-450">{insp.company}</td>
                <td className="px-6 py-3.5 font-bold text-green-400">{insp.score}%</td>
                <td className="px-6 py-3.5 text-slate-500">{new Date(insp.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-3.5 text-right">
                  <button 
                    onClick={() => handleDownload(insp.inspectionId)} 
                    className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-450 font-bold uppercase tracking-wider"
                  >
                    <FileDown className="w-3.5 h-3.5" /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: ADMIN RULES CONFIG (ADMIN ROLE ONLY)
// ----------------------------------------------------
function AdminRulesPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/rules', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      setRules(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (ruleId, currentActive) => {
    try {
      const response = await fetch(`/api/rules/${ruleId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ active: !currentActive })
      });
      if (response.ok) {
        fetchRules();
      } else {
        alert('Unauthorized command. ADMIN privileges required.');
      }
    } catch (e) {
      alert('Network request failed.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filtered = rules.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.ruleId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white font-sans">Rules Configuration</h1>
        <p className="text-slate-400 text-xs mt-1 uppercase tracking-wider font-semibold">
          Enable or disable deterministic compliance rules dynamically (System Administrators only)
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search rule ID or title..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-xs text-white w-full"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[9px] tracking-wider border-b border-slate-800">
              <th className="px-6 py-3">Rule ID</th>
              <th className="px-6 py-3">Title / Requirement</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Severity</th>
              <th className="px-6 py-3">Legal Source Reference</th>
              <th className="px-6 py-3 text-right">Active Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-350 font-medium">
            {filtered.map((rule) => (
              <tr key={rule.ruleId} className="hover:bg-slate-850">
                <td className="px-6 py-3.5 font-bold font-mono text-white">{rule.ruleId}</td>
                <td className="px-6 py-3.5">
                  <span className="block text-white font-bold">{rule.title}</span>
                  <span className="text-[10px] text-slate-500 font-sans block mt-0.5">{rule.requirement}</span>
                </td>
                <td className="px-6 py-3.5">{rule.category}</td>
                <td className="px-6 py-3.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    rule.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-6 py-3.5 font-mono text-[10px] text-slate-500">{rule.sourceReference || 'LM Rules 2011'}</td>
                <td className="px-6 py-3.5 text-right">
                  <button 
                    onClick={() => handleToggle(rule.ruleId, rule.active)}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition ${
                      rule.active 
                        ? 'bg-green-950 text-green-400 border border-green-800' 
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// PAGE: SETTINGS (Editable profile and configuration details)
// ----------------------------------------------------
function SettingsPage() {
  const { user } = useContext(AuthContext);
  const [name, setName] = useState(user?.username || '');
  const [org, setOrg] = useState('Govt. Legal Metrology Department');
  const [provider, setProvider] = useState('demo');

  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-8 text-xs text-slate-350">
      <div>
        <h1 className="text-xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Configure profile settings and OCR module parameters.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Profile Inspector Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Organization Details</label>
          <input 
            type="text" 
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">OCR Parser Provider</label>
          <select 
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded px-2 py-1.5 text-white focus:outline-none"
          >
            <option value="demo">Local Mock Database (Active Fallback)</option>
            <option value="gemini">Google Gemini Vision model API (Planned)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
