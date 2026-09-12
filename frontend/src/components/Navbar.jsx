import React, { useState } from 'react';
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
  Sliders,
  Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = 2;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const getRoleHome = () => {
    if (!user) return '/';
    if (user.role === 'officer') return '/officer';
    if (user.role === 'lab') return '/lab';
    if (user.role === 'admin') return '/admin';
    return '/farmer';
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#05130b]/85 border-b border-emerald-500/20 shadow-xl shadow-black/30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* ── Brand Logo ── */}
          <div className="flex items-center gap-4">
            <Link
              to={getRoleHome()}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-green-400 to-teal-300 p-[1.5px] shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/50 group-hover:scale-105 transition-all duration-300">
                <div className="w-full h-full bg-[#07190f] rounded-[10px] flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    AgriNova
                    <span className="bg-gradient-to-r from-emerald-400 to-lime-300 bg-clip-text text-transparent">
                      .AI
                    </span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    SL-AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
                  Crop Pathology & Surveillance Network
                </p>
              </div>
            </Link>
          </div>

          {/* ── Center Navigation (Role-Aware) ── */}
          {!user ? (
            /* Gateway State */
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-xs text-slate-300 font-medium shadow-inner">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sri Lanka Department of Agriculture • Portal Gateway</span>
            </div>
          ) : user.role === 'farmer' ? (
            /* 🌾 Farmer Navigation Links */
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <NavLink
                to="/farmer"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-green-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                <span>Farmer Hub</span>
              </NavLink>

              <NavLink
                to="/reports/new"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-green-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Leaf Scan</span>
              </NavLink>

              <NavLink
                to="/alerts"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all relative ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600/30 to-green-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Alerts</span>
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </NavLink>
            </nav>
          ) : user.role === 'officer' ? (
            /* 🛡️ Officer Navigation Links */
            <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <NavLink
                to="/officer"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Command</span>
              </NavLink>

              <NavLink
                to="/officer/tickets"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Ticket className="w-3.5 h-3.5 text-blue-400" />
                <span>Triage Tickets</span>
              </NavLink>

              <NavLink
                to="/officer/map"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Map className="w-3.5 h-3.5 text-teal-400" />
                <span>Outbreak Map</span>
              </NavLink>

              <NavLink
                to="/officer/outbreaks"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Radar</span>
              </NavLink>

              <NavLink
                to="/officer/feedback"
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
                <span>Feedback</span>
              </NavLink>
            </nav>
          ) : user.role === 'lab' ? (
            /* 🔬 Research Lab Navigation */
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <NavLink
                to="/lab"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Microscope className="w-3.5 h-3.5 text-purple-400" />
                <span>Pathology Diagnostic Lab</span>
              </NavLink>

              <NavLink
                to="/officer/map"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Map className="w-3.5 h-3.5 text-teal-400" />
                <span>Regional Surveillance</span>
              </NavLink>
            </nav>
          ) : (
            /* ⚙️ System Admin Navigation */
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 shadow-inner">
              <NavLink
                to="/admin"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>System Administration</span>
              </NavLink>
              <NavLink
                to="/officer/map"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <Map className="w-3.5 h-3.5 text-teal-400" />
                <span>Surveillance Map</span>
              </NavLink>
            </nav>
          )}

          {/* ── Right Actions & Profile ── */}
          <div className="flex items-center gap-3">
            
            {/* Quick Upload CTA (Only visible for Farmer) */}
            {user?.role === 'farmer' && (
              <button
                onClick={() => navigate('/reports/new')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-green-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-md shadow-emerald-500/25 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Scan Leaf</span>
              </button>
            )}

            {/* User Profile / Logout Button */}
            {user && (
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/10">
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.04] border border-white/10 shadow-sm">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner ${
                    user.role === 'officer'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : user.role === 'lab'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {user.role === 'officer' ? 'AO' : (user.role === 'lab' ? '🔬' : (user.role === 'admin' ? '⚙️' : '🌾'))}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">
                      {user.name.split(' ')[0]}
                    </p>
                    <p className={`text-[9px] uppercase tracking-wider font-extrabold ${
                      user.role === 'officer'
                        ? 'text-blue-400'
                        : user.role === 'lab'
                        ? 'text-purple-400'
                        : user.role === 'admin'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {user.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px] font-semibold">Logout</span>
                </button>
              </div>
            )}

            {/* Mobile menu trigger */}
            {user && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Navigation Drawer ── */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-emerald-500/20 bg-[#05130b]/98 backdrop-blur-2xl px-4 py-4 space-y-2 animate-fade-in shadow-2xl">
          
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {user.role === 'officer' ? 'AO' : (user.role === 'lab' ? '🔬' : (user.role === 'admin' ? '⚙️' : '🌾'))}
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
          ) : user.role === 'officer' ? (
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
          ) : user.role === 'lab' ? (
            <>
              <NavLink
                to="/lab"
                end
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-500/10"
              >
                <span className="flex items-center gap-2">
                  <Microscope className="w-4 h-4" />
                  Diagnostic Lab
                </span>
                <ChevronRight className="w-4 h-4 text-purple-400/60" />
              </NavLink>
              <NavLink
                to="/officer/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Regional Map
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/admin"
                end
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  System Administration
                </span>
                <ChevronRight className="w-4 h-4 text-amber-400/60" />
              </NavLink>
              <NavLink
                to="/officer/map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Surveillance Map
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
