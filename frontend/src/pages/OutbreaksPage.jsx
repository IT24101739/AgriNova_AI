import { useOutbreaks } from '../hooks/useOutbreaks';
import OutbreakPanel from '../components/OutbreakPanel';
import RegionalDiseaseMap from '../components/RegionalDiseaseMap';
import { useMapReports } from '../hooks/useMapReports';
import { RefreshCw, Activity } from 'lucide-react';

export default function OutbreaksPage() {
  const { candidates, confirmed, loading, refetch, handleConfirm, handleReject } = useOutbreaks();
  const { reports, outbreaks: mapOutbreaks } = useMapReports();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" />
            Outbreak Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Detect, confirm, and manage regional disease outbreaks
          </p>
        </div>
        <button onClick={refetch} className="btn-secondary text-xs py-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left — outbreak panel */}
        <div className="xl:col-span-1">
          <div className="glass rounded-2xl p-5">
            <OutbreakPanel
              candidates={candidates}
              confirmed={confirmed}
              loading={loading}
              onConfirm={handleConfirm}
              onReject={handleReject}
            />
          </div>
        </div>

        {/* Right — map */}
        <div className="xl:col-span-2">
          <div className="glass rounded-2xl overflow-hidden" style={{ height: '600px' }}>
            <div className="px-5 py-3 border-b border-white/8">
              <h2 className="text-sm font-semibold text-white">Regional Map</h2>
              <p className="text-xs text-slate-400 mt-0.5">Purple circles = confirmed outbreaks</p>
            </div>
            <RegionalDiseaseMap
              reports={reports}
              outbreaks={mapOutbreaks}
              height="calc(100% - 56px)"
              autoFit={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
