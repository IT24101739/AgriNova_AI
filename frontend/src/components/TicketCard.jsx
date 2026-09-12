import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';
import { Clock, ChevronRight, MapPin, Trash2, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export default function TicketCard({ ticket, onDeleted }) {
  const navigate = useNavigate();
  const report = ticket.reports || {};
  const farm = report.farms || {};
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/api/officer/tickets/${ticket.id}`, { method: 'DELETE' });
      onDeleted?.(ticket.id);
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
          <div className="flex items-center gap-2 mb-1.5">
            <PriorityBadge priority={ticket.priority} />
            <span className={`text-xs font-medium ${STATUS_COLORS[ticket.status] || 'text-slate-400'}`}>
              {ticket.status?.replace(/_/g, ' ')}
            </span>
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
