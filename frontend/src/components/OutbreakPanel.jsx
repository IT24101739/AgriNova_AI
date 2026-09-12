import { useState } from 'react';
import { confirmOutbreak, rejectOutbreak } from '../services/officerApi';
import { AlertTriangle, CheckCircle, XCircle, MapPin, Activity, Leaf, Clock } from 'lucide-react';

function CandidateRow({ candidate, onConfirm, onReject }) {
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try { await onConfirm(candidate.id, { radius_km: candidate.radius_km }); }
    finally { setConfirming(false); }
  };

  const handleReject = async () => {
    setRejecting(true);
    try { await onReject(candidate.id); }
    finally { setRejecting(false); }
  };

  return (
    <div className="glass-elevated rounded-xl p-4 space-y-3 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" /> CANDIDATE
            </span>
          </div>
          <h3 className="font-bold text-white">{candidate.disease}</h3>
          <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
            <Leaf className="w-3 h-3" /> {candidate.crop}
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p className="flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" />
            {candidate.created_at
              ? new Date(candidate.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
              : ''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/5 rounded-lg py-2">
          <p className="text-lg font-bold text-white">{candidate.report_count}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Reports</p>
        </div>
        <div className="bg-white/5 rounded-lg py-2">
          <p className="text-lg font-bold text-amber-400">
            {candidate.avg_confidence ? `${Math.round(candidate.avg_confidence * 100)}%` : '—'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Conf.</p>
        </div>
        <div className="bg-white/5 rounded-lg py-2">
          <p className="text-lg font-bold text-blue-400">{candidate.radius_km}km</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Radius</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleConfirm}
          disabled={confirming}
          className="btn-primary flex-1 justify-center text-xs py-2"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {confirming ? 'Confirming…' : 'Confirm Outbreak'}
        </button>
        <button
          onClick={handleReject}
          disabled={rejecting}
          className="btn-danger flex-1 justify-center text-xs py-2"
        >
          <XCircle className="w-3.5 h-3.5" />
          {rejecting ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </div>
  );
}

function ConfirmedBadge({ outbreak }) {
  return (
    <div className="glass rounded-xl p-4 border border-violet-500/20 glow-purple">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Activity className="w-3 h-3" /> CONFIRMED
            </span>
          </div>
          <h3 className="font-bold text-white">{outbreak.disease}</h3>
          <p className="text-sm text-slate-400 flex items-center gap-1 mt-0.5">
            <Leaf className="w-3 h-3" /> {outbreak.crop}
          </p>
        </div>
        <div className="text-xs text-slate-500 text-right">
          <p className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {outbreak.radius_km}km radius
          </p>
          <p className="mt-1">
            {outbreak.confirmed_at
              ? new Date(outbreak.confirmed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
              : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OutbreakPanel({ candidates = [], confirmed = [], onConfirm, onReject, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidates */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          Outbreak Candidates ({candidates.length})
        </h3>
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No active candidates</p>
        ) : (
          <div className="space-y-3">
            {candidates.map(c => (
              <CandidateRow
                key={c.id}
                candidate={c}
                onConfirm={onConfirm}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmed */}
      {confirmed.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Confirmed Outbreaks ({confirmed.length})
          </h3>
          <div className="space-y-2">
            {confirmed.map(ob => <ConfirmedBadge key={ob.id} outbreak={ob} />)}
          </div>
        </div>
      )}
    </div>
  );
}
