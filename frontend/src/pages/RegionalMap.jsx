import { useState } from 'react';
import { useMapReports } from '../hooks/useMapReports';
import RegionalDiseaseMap from '../components/RegionalDiseaseMap';
import { Filter, RefreshCw, Loader2 } from 'lucide-react';

const LEGEND = [
  { color: '#22c55e', label: 'Resolved / Low Risk' },
  { color: '#f59e0b', label: 'Under Investigation' },
  { color: '#ef4444', label: 'Confirmed / High Risk' },
  { color: '#8b5cf6', label: 'Outbreak Zone' },
];

const CROPS = ['Tomato','Rice','Paddy','Chili','Banana','Coconut','Rubber','Tea'];
const DISEASES = [
  'Tomato Early Blight','Tomato Late Blight','Rice Blast','Rice Brown Spot',
  'Chili Anthracnose','Banana Fusarium Wilt','Healthy',
];
const SEVERITIES = ['LOW','MEDIUM','HIGH'];
const STATUSES = ['OPEN','UNDER_REVIEW','CONFIRMED','RESOLVED'];

export default function RegionalMap() {
  const [filters, setFilters] = useState({});
  const { reports, outbreaks, loading, refetch } = useMapReports(filters);
  const [showFilters, setShowFilters] = useState(false);

  const set = field => e => setFilters(f => ({ ...f, [field]: e.target.value || undefined }));

  const statsBar = [
    { label: 'Total', value: reports.length },
    { label: 'High Risk', value: reports.filter(r => r.severity === 'HIGH').length, color: 'text-red-400' },
    { label: 'Outbreaks', value: outbreaks.length, color: 'text-violet-400' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Regional Disease Map</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time geo-view of all crop disease reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn-secondary text-xs py-2 ${showFilters ? 'border-brand-green text-brand-green' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
          </button>
          <button onClick={refetch} className="btn-secondary text-xs py-2">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 flex-shrink-0">
        {statsBar.map(s => (
          <div key={s.label} className="text-sm">
            <span className={`font-bold text-xl ${s.color || 'text-white'}`}>{s.value}</span>
            <span className="text-slate-400 ml-1.5 text-xs uppercase tracking-wider">{s.label}</span>
          </div>
        ))}
        {loading && <Loader2 className="w-4 h-4 text-brand-green animate-spin ml-auto" />}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="glass rounded-xl px-5 py-4 flex-shrink-0 animate-slide-up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="ag-label">Crop</label>
              <select className="ag-select text-xs" value={filters.crop || ''} onChange={set('crop')}>
                <option value="">All crops</option>
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="ag-label">Disease</label>
              <select className="ag-select text-xs" value={filters.disease || ''} onChange={set('disease')}>
                <option value="">All diseases</option>
                {DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="ag-label">Severity</label>
              <select className="ag-select text-xs" value={filters.severity || ''} onChange={set('severity')}>
                <option value="">All severities</option>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="ag-label">Status</label>
              <select className="ag-select text-xs" value={filters.status || ''} onChange={set('status')}>
                <option value="">All statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => setFilters({})}
            className="text-xs text-slate-400 hover:text-brand-green transition-colors mt-3"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 glass rounded-2xl overflow-hidden min-h-0">
        <RegionalDiseaseMap reports={reports} outbreaks={outbreaks} height="100%" autoFit />
      </div>

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-5 flex-shrink-0 px-1 pb-1">
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className="w-3 h-3 rounded-full border border-black/30"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
