import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';
import { Clock, ChevronRight, MapPin } from 'lucide-react';

const STATUS_COLORS = {
  OPEN:                 'bg-slate-700/50 text-slate-300 border-slate-600/40',
  ASSIGNED:             'bg-blue-500/20 text-blue-300 border-blue-500/30',
  FIELD_VISIT_REQUIRED: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  UNDER_REVIEW:         'bg-violet-500/20 text-violet-300 border-violet-500/30',
  LAB_REVIEW:           'bg-pink-500/20 text-pink-300 border-pink-500/30',
  CONFIRMED:            'bg-green-500/20 text-green-300 border-green-500/30',
  RESOLVED:             'bg-slate-600/30 text-slate-400 border-slate-600/40',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function TicketCard({ ticket }) {
  const navigate = useNavigate();
  const report = ticket.reports || {};
  const farm = report.farms || {};

  return (
    <div
      onClick={() => navigate(`/officer/tickets/${ticket.id}`)}
      className="glass rounded-xl p-4 cursor-pointer
                 hover:border-white/20 hover:bg-white/5 transition-all duration-200
                 animate-fade-in group relative"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <PriorityBadge priority={ticket.priority} />
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN}`}>
              {(ticket.status || 'OPEN').replace(/_/g, ' ')}
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
