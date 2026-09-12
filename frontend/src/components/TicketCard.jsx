import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';
import { Clock, ChevronRight, MapPin, Trash2, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';

const STATUS_COLORS = {
  OPEN: 'text-slate-400',
  ASSIGNED: 'text-blue-400',
  FIELD_VISIT_REQUIRED: 'text-amber-400',
  UNDER_REVIEW: 'text-violet-400',
  LAB_REVIEW: 'text-pink-400',
  CONFIRMED: 'text-green-400',
  RESOLVED: 'text-slate-500',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketCard({ ticket, onDeleted, onStatusUpdated }) {
  const navigate = useNavigate();
  const report = ticket.reports || {};
  const farm = report.farms || {};
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (e, newStatus) => {
    e.stopPropagation();
    setUpdating(true);
    try {
      await fetch(`${API_BASE}/api/officer/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusUpdated?.(ticket.id, newStatus);
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/officer/tickets/${ticket.id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted?.(ticket.id);
      } else {
        alert('Failed to delete ticket from server');
      }
    } catch (err) {
      console.error('Delete ticket error:', err);
      alert('Failed to delete ticket. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/officer/tickets/${ticket.id}`)}
      className="glass rounded-xl p-4 cursor-pointer
                 hover:border-white/20 hover:bg-white/5 transition-all duration-200
                 animate-fade-in group relative"
    >
      {/* Delete button — top-right corner */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Delete ticket"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/15 transition-colors opacity-0 group-hover:opacity-100 z-10"
      >
        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>

      <div className="flex items-start justify-between gap-3 pr-6">
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap" onClick={e => e.stopPropagation()}>
            <PriorityBadge priority={ticket.priority} />
            {updating ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Updating...
              </span>
            ) : (
              <select
                value={ticket.status || 'OPEN'}
                onChange={(e) => handleStatusChange(e, e.target.value)}
                className="text-[11px] font-semibold py-0.5 px-2 rounded-lg border border-white/10 bg-[#07160d] text-slate-200 hover:border-emerald-500/50 cursor-pointer outline-none transition-colors"
                title="Change ticket status"
              >
                <option value="OPEN" className="bg-[#07160d] text-slate-300">OPEN</option>
                <option value="ASSIGNED" className="bg-[#07160d] text-blue-300">ASSIGNED</option>
                <option value="FIELD_VISIT_REQUIRED" className="bg-[#07160d] text-amber-300">FIELD VISIT REQUIRED</option>
                <option value="UNDER_REVIEW" className="bg-[#07160d] text-violet-300">UNDER REVIEW</option>
                <option value="LAB_REVIEW" className="bg-[#07160d] text-pink-300">LAB REVIEW</option>
                <option value="CONFIRMED" className="bg-[#07160d] text-green-300">CONFIRMED</option>
                <option value="RESOLVED" className="bg-[#07160d] text-slate-400">RESOLVED</option>
              </select>
            )}
          </div>

          {/* Disease */}
          <h3 className="font-semibold text-white text-sm truncate">
            {report.disease || 'Undiagnosed'} — {report.crop || 'Unknown crop'}
          </h3>

          {/* Reason */}
          <p className="text-xs text-slate-400 mt-0.5">
            Reason: <span className="text-slate-300">{ticket.reason?.replace(/_/g, ' ')}</span>
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {farm.district && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {farm.district}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(ticket.created_at)}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-white">
            {report.confidence ? `${Math.round(report.confidence * 100)}%` : '—'}
          </p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">AI conf.</p>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400
                                   transition-colors mt-2 ml-auto" />
        </div>
      </div>
    </div>
  );
}
