import { useTickets } from '../hooks/useTickets';
import TicketTable from '../components/TicketTable';
import TicketCard from '../components/TicketCard';
import RegionalDiseaseMap from '../components/RegionalDiseaseMap';
import { useMapReports } from '../hooks/useMapReports';
import {
  Ticket, AlertTriangle, Activity, CheckCircle,
  CalendarDays, RefreshCw, Filter, X,
} from 'lucide-react';
import { useState } from 'react';

function StatCard({ icon: Icon, label, value, accent, glow }) {
  return (
    <div className={`stat-card ${glow}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
    </div>
  );
}

export default function OfficerDashboard() {
  const [view, setView] = useState('table');
  const [filters, setFilters] = useState({});
  const { tickets, stats, loading, refetch } = useTickets(filters);
  const { reports, outbreaks } = useMapReports();

  const statusOptions = ['OPEN','ASSIGNED','FIELD_VISIT_REQUIRED','UNDER_REVIEW','LAB_REVIEW','CONFIRMED','RESOLVED'];
  const priorityOptions = ['HIGH','MEDIUM','LOW'];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Agricultural Hero Banner ── */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20">
        <img
          src="/images/hero_officer.jpg"
          alt="Aerial view of Sri Lankan farmland — disease surveillance region"
          className="w-full object-cover"
          style={{ height: '160px', objectPosition: 'center 40%', opacity: 0.55, filter: 'saturate(1.2)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05130b]/95 via-[#05130b]/70 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/70 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                🛡️ Agriculture Officer Command
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Officer Dashboard</h1>
            <p className="text-sm text-slate-300 mt-0.5">
              Crop Disease Case Management — Field Surveillance & Outbreak Monitoring
            </p>
          </div>
          <div className="ml-auto">
            <button onClick={refetch} className="btn-secondary text-xs py-2">
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </div>


      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          icon={Ticket}
          label="Open Cases"
          value={stats?.open_cases}
          accent="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Priority"
          value={stats?.high_priority_cases}
          accent="bg-red-500/20 text-red-400"
          glow="glow-red"
        />
        <StatCard
          icon={Activity}
          label="Possible Outbreaks"
          value={stats?.possible_outbreaks}
          accent="bg-amber-500/20 text-amber-400"
          glow="glow-amber"
        />
        <StatCard
          icon={CheckCircle}
          label="Confirmed Outbreaks"
          value={stats?.confirmed_outbreaks}
          accent="bg-violet-500/20 text-violet-400"
          glow="glow-purple"
        />
        <StatCard
          icon={CalendarDays}
          label="Today's Visits"
          value={stats?.todays_field_visits}
          accent="bg-green-500/20 text-green-400"
        />
      </div>

      {/* Mini map preview */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Regional Overview</h2>
          <a href="/officer/map" className="text-xs text-brand-green hover:underline">
            Open full map →
          </a>
        </div>
        <div style={{ height: 260 }}>
          <RegionalDiseaseMap reports={reports} outbreaks={outbreaks} height={260} autoFit />
        </div>
      </div>

      {/* Ticket list */}
      <div className="glass rounded-2xl">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-white/8 flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-white flex-1">Officer Tickets</h2>

          {/* Filters */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Filter:
            </span>

            {/* Priority Filter */}
            <div className="relative">
              <select
                className={`ag-select min-w-[145px] text-xs py-2 transition-all ${
                  filters.priority
                    ? 'border-emerald-400/80 bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500/40 font-semibold shadow-sm'
                    : 'text-slate-300'
                }`}
                value={filters.priority || ''}
                onChange={e => setFilters(f => ({ ...f, priority: e.target.value || undefined }))}
              >
                <option value="">All priorities</option>
                {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className={`ag-select min-w-[210px] text-xs py-2 transition-all ${
                  filters.status
                    ? 'border-emerald-400/80 bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500/40 font-semibold shadow-sm'
                    : 'text-slate-300'
                }`}
                value={filters.status || ''}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
              >
                <option value="">All statuses</option>
                {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>

            {/* Reset Filters button */}
            {Boolean(filters.priority || filters.status) && (
              <button
                onClick={() => setFilters({})}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-900/40 border border-emerald-500/30 hover:bg-emerald-900/60 hover:text-white transition-all duration-200 animate-fade-in"
                title="Clear all filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {['table','cards'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v
                    ? 'bg-brand-green text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {view === 'table' ? (
            <TicketTable
              tickets={tickets}
              loading={loading}
              onDeleted={id => setTickets(prev => prev.filter(t => t.id !== id))}
              onStatusUpdated={(id, status) => setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {loading
                ? [...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />)
                : tickets.map(t => (
                    <TicketCard
                      key={t.id}
                      ticket={t}
                      onDeleted={id => setTickets(prev => prev.filter(x => x.id !== id))}
                      onStatusUpdated={(id, status) => setTickets(prev => prev.map(x => x.id === id ? { ...x, status } : x))}
                    />
                  ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
