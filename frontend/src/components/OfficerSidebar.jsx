import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Map, Ticket, Activity,
  FlaskConical, Bell, LogOut, Leaf, ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/officer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/officer/tickets', label: 'Tickets', icon: Ticket },
  { to: '/officer/map', label: 'Regional Map', icon: Map },
  { to: '/officer/outbreaks', label: 'Outbreaks', icon: Activity },
  { to: '/officer/feedback', label: 'AI Feedback', icon: FlaskConical },
];

export default function OfficerSidebar({ onLogout }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40
                      bg-bg-secondary border-r border-white/8">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="w-9 h-9 rounded-xl bg-brand-green/20 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-brand-green" />
        </div>
        <div>
          <p className="font-bold text-sm text-white tracking-wide">AgriShield</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Officer Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-200 ${
                isActive
                  ? 'bg-brand-green/15 text-brand-green border border-brand-green/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500
                          flex items-center justify-center text-xs font-bold text-white">
            AO
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Agriculture Officer</p>
            <p className="text-[10px] text-slate-500 truncate">Western Province</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
