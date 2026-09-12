import { useTickets } from '../hooks/useTickets';
import TicketTable from '../components/TicketTable';
import TicketCard from '../components/TicketCard';
import RegionalDiseaseMap from '../components/RegionalDiseaseMap';
import { useMapReports } from '../hooks/useMapReports';
import {
  Ticket, AlertTriangle, Activity, CheckCircle,
  CalendarDays, RefreshCw, Filter,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Officer Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Agriculture Disease Case Management — Western Province
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs py-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
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
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              className="ag-select w-36 text-xs py-1.5"
              value={filters.priority || ''}
              onChange={e => setFilters(f => ({ ...f, priority: e.target.value || undefined }))}
            >
              <option value="">All priorities</option>
              {priorityOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="ag-select w-44 text-xs py-1.5"
              value={filters.status || ''}
              onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
            >
              <option value="">All statuses</option>
              {statusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
            </select>
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
            <TicketTable tickets={tickets} loading={loading} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {loading
                ? [...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />)
                : tickets.map(t => <TicketCard key={t.id} ticket={t} />)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
