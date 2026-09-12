import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriorityBadge from './PriorityBadge';
import { ArrowUpDown, ChevronRight, Trash2, Loader2 } from 'lucide-react';
import { API_BASE } from '../config/api';

const STATUS_PILL = {
  OPEN:                 'bg-slate-700/60 text-slate-300',
  ASSIGNED:             'bg-blue-500/20 text-blue-300',
  FIELD_VISIT_REQUIRED: 'bg-amber-500/20 text-amber-300',
  UNDER_REVIEW:         'bg-violet-500/20 text-violet-300',
  LAB_REVIEW:           'bg-pink-500/20 text-pink-300',
  CONFIRMED:            'bg-green-500/20 text-green-300',
  RESOLVED:             'bg-slate-600/40 text-slate-400',
};

export default function TicketTable({ tickets = [], loading, onDeleted, onStatusUpdated }) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const sorted = [...tickets].sort((a, b) => {
    const va = sortKey === 'confidence'
      ? (a.reports?.confidence || 0)
      : (a[sortKey] || '');
    const vb = sortKey === 'confidence'
      ? (b.reports?.confidence || 0)
      : (b[sortKey] || '');
    return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
  });

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const handleStatusChange = async (e, ticketId, newStatus) => {
    e.stopPropagation();
    setUpdatingId(ticketId);
    try {
      await fetch(`${API_BASE}/api/officer/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusUpdated?.(ticketId, newStatus);
    } catch (err) {
      console.error('Update status error:', err);
      alert('Failed to update ticket status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (e, ticketId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setDeletingId(ticketId);
    try {
      const res = await fetch(`${API_BASE}/api/officer/tickets/${ticketId}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted?.(ticketId);
      } else {
        alert('Failed to delete ticket from server');
      }
    } catch (err) {
      console.error('Delete ticket error:', err);
      alert('Failed to delete ticket. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const Th = ({ col, label }) => (
    <th
      className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-widest
                 text-slate-400 cursor-pointer hover:text-slate-200 select-none"
      onClick={() => toggleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium mb-1">No tickets found</p>
        <p className="text-sm">Adjust filters or check back later</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="ag-table">
        <thead>
          <tr>
            <Th col="priority" label="Priority" />
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Disease / Crop</th>
            <Th col="reason" label="Reason" />
            <Th col="status" label="Status" />
            <Th col="confidence" label="AI Conf." />
            <Th col="created_at" label="Date" />
            <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(ticket => {
            const report = ticket.reports || {};
            const pct = report.confidence ? `${Math.round(report.confidence * 100)}%` : '—';
            const statusCls = STATUS_PILL[ticket.status] || STATUS_PILL.OPEN;
            return (
              <tr
                key={ticket.id}
                onClick={() => navigate(`/officer/tickets/${ticket.id}`)}
                className="cursor-pointer hover:bg-white/5 transition-colors"
              >
                <td><PriorityBadge priority={ticket.priority} /></td>
                <td>
                  <p className="font-medium text-white">{report.disease || 'Undiagnosed'}</p>
                  <p className="text-xs text-slate-500">{report.crop || '—'}</p>
                </td>
                <td>
                  <span className="text-xs text-slate-300">{ticket.reason?.replace(/_/g, ' ')}</span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="relative inline-flex items-center">
                    {updatingId === ticket.id ? (
                      <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-400 bg-emerald-950/60 rounded-lg">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <select
                        value={ticket.status || 'OPEN'}
                        onChange={(e) => handleStatusChange(e, ticket.id, e.target.value)}
                        className={`text-[11px] font-semibold py-1 px-2 rounded-lg border border-white/10 outline-none cursor-pointer transition-colors bg-[#07160d] hover:border-emerald-500/50 ${statusCls}`}
                        title="Click to update status"
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
                </td>
                <td>
                  <span className={`font-mono text-sm font-semibold ${
                    report.confidence < 0.5 ? 'text-red-400' :
                    report.confidence < 0.75 ? 'text-amber-400' : 'text-green-400'
                  }`}>{pct}</span>
                </td>
                <td className="text-xs text-slate-400">
                  {new Date(ticket.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/officer/tickets/${ticket.id}`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      title="View ticket"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, ticket.id)}
                      disabled={deletingId === ticket.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/15 transition-colors"
                      title="Delete ticket"
                    >
                      {deletingId === ticket.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
