import { ZoomIn, Calendar, MapPin, Droplets, AlertTriangle } from 'lucide-react';
import AIConfidenceCard from './AIConfidenceCard';

export default function CaseEvidencePanel({ report = {}, analysis = {} }) {
  const farm = report.farms || {};

  return (
    <div className="space-y-4">
      {/* Farmer image */}
      {report.image_url && (
        <div className="relative group rounded-xl overflow-hidden border border-white/10">
          <img
            src={report.image_url}
            alt="Crop disease sample"
            className="w-full h-52 object-cover"
          />
          <a
            href={report.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all
                       flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="w-8 h-8 text-white" />
          </a>
        </div>
      )}

      {/* AI prediction */}
      <AIConfidenceCard
        disease={report.disease}
        confidence={report.confidence}
        severity={analysis.severity || report.severity}
        crop={report.crop}
      />

      {/* Spread risk */}
      {(report.spread_risk || analysis.spread_risk) && (
        <div className="glass-elevated rounded-xl p-3 flex items-center gap-3">
          <Droplets className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Spread Risk</p>
            <p className={`text-sm font-semibold ${
              (report.spread_risk || analysis.spread_risk) === 'HIGH'
                ? 'text-red-400' : 'text-amber-400'
            }`}>
              {report.spread_risk || analysis.spread_risk}
            </p>
          </div>
        </div>
      )}

      {/* Farmer description */}
      {report.description && (
        <div className="glass-elevated rounded-xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Farmer's Description</p>
          <p className="text-sm text-slate-200 leading-relaxed italic">"{report.description}"</p>
        </div>
      )}

      {/* Location & Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-elevated rounded-xl p-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-green flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">District</p>
            <p className="text-xs font-medium text-slate-200">{farm.district || '—'}</p>
          </div>
        </div>
        <div className="glass-elevated rounded-xl p-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reported</p>
            <p className="text-xs font-medium text-slate-200">
              {report.created_at
                ? new Date(report.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Weather risk */}
      {analysis.weather_risk && (
        <div className="glass-elevated rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Weather Risk</p>
            <p className="text-xs text-slate-200">{analysis.weather_risk}</p>
          </div>
        </div>
      )}
    </div>
  );
}
