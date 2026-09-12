import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Map, Ticket, Activity,
  FlaskConical, LogOut, ChevronRight,
  Camera, ArrowLeft, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/officer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/officer/tickets', label: 'Triage Tickets', icon: Ticket },
  { to: '/officer/map', label: 'Regional Map', icon: Map },
  { to: '/officer/outbreaks', label: 'Outbreak Radar', icon: Activity },
  { to: '/officer/feedback', label: 'AI Feedback Loop', icon: FlaskConical },
];

export default function OfficerSidebar({ onLogout }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSignOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      logout();
      navigate('/login?role=officer');
    }
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-60 flex flex-col z-40
                      bg-[#080d1a]/95 backdrop-blur-xl border-r border-white/10">
      {/* Officer Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <p className="font-bold text-xs text-white tracking-wide">Officer Console</p>
          <p className="text-[10px] text-blue-400 font-medium">
            {user?.province || 'Western Province'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
          Surveillance & Triage
        </div>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold
               transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}

        <div className="pt-4 mt-3 border-t border-white/5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
            Quick Actions
          </div>
          <NavLink
            to="/reports/new"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>Upload Leaf Scan</span>
          </NavLink>
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Switch to Farmer Hub</span>
          </NavLink>
        </div>
      </nav>

      {/* Officer Profile & Sign Out */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                          flex items-center justify-center text-xs font-bold text-white shadow-sm">
            AO
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.name || 'Dr. Bandara (AO)'}
            </p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user?.badge || 'Officer Active'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
                     text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
