import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Leaf,
  Camera,
  Bell,
  Shield,
  Map,
  Activity,
  FlaskConical,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  LogOut,
  Lock,
  LayoutDashboard,
  Microscope,
  Sliders
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [unreadCount, setUnreadCount] = useState(2);

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
        if (res.status === 200) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const isLoginPage = location.pathname === '/' && !user;

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#05130b]/92 border-b border-emerald-500/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ── Brand Logo ── */}
          <div className="flex items-center gap-4">
            <Link
              to={user ? (user.role === 'officer' ? '/officer' : (user.role === 'lab' ? '/lab' : (user.role === 'admin' ? '/admin' : '/farmer'))) : '/'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <div className="w-full h-full bg-[#0b1329] rounded-[11px] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    AgriNova<span className="text-emerald-400">.AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    V1.0
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
                  National Crop Disease Surveillance
                </p>
              </div>
            </Link>
          </div>

          {/* ── Center Navigation (Dynamic by Role) ── */}
          {!user ? (
            /* Unauthenticated / Login page state */
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-medium">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>National Agriculture Portal Gateway</span>
            </div>
          ) : user.role === 'farmer' ? (
            /* 🌾 Farmer Navigation Links */
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/farmer"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                Farmer Hub
              </NavLink>

              <NavLink
                to="/reports/new"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                AI Leaf Scan
              </NavLink>

              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all relative ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Bell className="w-3.5 h-3.5" />
                Alerts
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </NavLink>
            </nav>
          ) : user.role === 'officer' ? (
            /* 🛡️ Officer Navigation Links */
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/officer"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Overview
              </NavLink>

              <NavLink
                to="/officer/tickets"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                Triage Tickets
              </NavLink>

              <NavLink
                to="/officer/map"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Map className="w-3.5 h-3.5" />
                Outbreak Map
              </NavLink>

              <NavLink
                to="/officer/outbreaks"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Radar
              </NavLink>

              <NavLink
                to="/officer/feedback"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                AI Feedback
              </NavLink>
            </nav>
          ) : user.role === 'lab' ? (
            /* 🔬 Research Lab Navigation */
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/lab"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Microscope className="w-3.5 h-3.5 text-purple-400" />
                Pathology Diagnostic Lab
              </NavLink>
            </nav>
          ) : (
            /* ⚙️ System Admin Navigation */
            <nav className="hidden md:flex items-center gap-1">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                System Administration
              </NavLink>
              <NavLink
                to="/officer/map"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Map className="w-3.5 h-3.5 text-amber-400" />
                Surveillance Map
              </NavLink>
            </nav>
          )}

          {/* ── Right Actions & Profile ── */}
          <div className="flex items-center gap-3">
            
            {/* Backend status pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-white/10 text-[10px] font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' :
                backendStatus === 'offline' ? 'bg-red-400' : 'bg-amber-400'
              }`} />
              <span className="text-slate-300">
                {backendStatus === 'online' ? 'API Online' :
                 backendStatus === 'offline' ? 'Offline' : 'Connecting...'}
              </span>
            </div>

            {/* Quick Upload CTA (Only visible for Farmer) */}
            {user?.role === 'farmer' && (
              <button
                onClick={() => navigate('/reports/new')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-500/20 active:scale-95 transition-all duration-200"
              >
                <Sparkles className="w-3 h-3 text-emerald-200" />
                <span>Scan Leaf</span>
              </button>
            )}

            {/* User Profile / Logout Button */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    user.role === 'officer'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : user.role === 'lab'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {user.role === 'officer' ? 'AO' : (user.role === 'lab' ? '🔬' : (user.role === 'admin' ? '⚙️' : '🌾'))}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[11px] font-bold text-white leading-none truncate max-w-[120px]">
                      {user.name.split(' ')[0]}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-emerald-500/20 bg-[#05130b]/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in">
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {user.role === 'officer' ? 'AO' : '🌾'}
              </div>
              <div>
                <p className="text-xs font-bold text-white">{user.name}</p>
                <p className="text-[10px] text-slate-400">{user.email} • {user.role.toUpperCase()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-red-400 hover:text-red-300"
            >
              Sign Out
            </button>
          </div>

          {user.role === 'farmer' ? (
            <>
              <NavLink
                to="/farmer"
                end
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span>Farmer Hub</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
              <NavLink
                to="/reports/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10"
              >
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  New Leaf Scan
                </span>
                <ChevronRight className="w-4 h-4 text-emerald-400/60" />
              </NavLink>
              <NavLink
                to="/alerts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Disease Alerts
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/officer"
                end
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-blue-400 hover:bg-blue-500/10"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Officer Dashboard
                </span>
                <ChevronRight className="w-4 h-4 text-blue-400/60" />
              </NavLink>
              <NavLink
                to="/officer/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span>Triage Tickets</span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
              <NavLink
                to="/officer/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Regional Disease Map
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
              <NavLink
                to="/officer/outbreaks"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Outbreak Radar
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
              <NavLink
                to="/officer/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  AI Feedback Loop
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
