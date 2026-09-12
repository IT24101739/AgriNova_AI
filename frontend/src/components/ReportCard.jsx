/**
 * ReportCard — Compact card for FarmerHome crop reports list.
 * Features:
 * - Multi-select checkbox for bulk actions
 * - Single-click deletion with trash icon
 * - Status & severity badges
 * - Click to navigate to diagnosis report
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ChevronRight, Check } from 'lucide-react';

const STATUS_CONFIG = {
  PENDING:        { label: 'Pending',        className: 'badge-pending',   icon: '⏳' },
  ANALYZING:      { label: 'Analyzing…',     className: 'badge-analyzing', icon: '🔬' },
  IMAGE_ANALYZED: { label: 'Analyzed',       className: 'badge-complete',  icon: '✅' },
  DIAGNOSED:      { label: 'Diagnosed',      className: 'badge-complete',  icon: '✅' },
  COMPLETED:      { label: 'Completed',      className: 'badge-complete',  icon: '✅' },
  FAILED:         { label: 'Failed',         className: 'badge-failed',    icon: '❌' },
};

const SEVERITY_CONFIG = {
  LOW:      { className: 'badge-severity-low',      label: 'Low' },
  MODERATE: { className: 'badge-severity-moderate', label: 'Moderate' },
  HIGH:     { className: 'badge-severity-high',     label: 'High' },
};

const CROP_EMOJI = {
  Tomato: '🍅',
  Potato: '🥔',
  Pepper: '🫑',
};

export default function ReportCard({
  report,
  isSelected = false,
  onToggleSelect,
  onDelete,
}) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;
  const severity = report.severity ? SEVERITY_CONFIG[report.severity] : null;

  const date = report.created_at
    ? new Date(report.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recent';

  return (
    <article
      className={`relative rounded-2xl p-3.5 border transition-all duration-200 group cursor-pointer ${
        isSelected
          ? 'bg-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
          : 'bg-[#0b1e13]/80 hover:bg-[#0e2718]/90 border-emerald-500/20 hover:border-emerald-500/40 shadow-md'
      }`}
      onClick={() => navigate(`/reports/${report.id}`)}
      role="button"
      tabIndex={0}
      aria-label={`Report: ${report.crop} - ${status.label}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/reports/${report.id}`)}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(report.id);
            }}
            className="pt-1 flex-shrink-0 cursor-pointer"
            title={isSelected ? 'Deselect report' : 'Select report'}
          >
            <div
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/50'
                  : 'bg-black/40 border-white/20 hover:border-emerald-400/60 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Thumbnail Image */}
        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-emerald-500/20 flex items-center justify-center text-2xl">
          {report.image_url ? (
            <img
              src={report.image_url}
              alt={report.crop}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            CROP_EMOJI[report.crop] || '🌿'
          )}
        </div>

        {/* Card Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-white">{report.crop}</span>
            <span className={`badge ${status.className} text-[10px] py-0.5 px-2`}>
              {status.icon} {status.label}
            </span>
          </div>

          {report.disease && (
            <p className="text-xs text-emerald-300/90 font-medium mt-1 truncate">
              🦠 {report.disease}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-slate-400">
            <span>📅 {date}</span>
            {severity && (
              <span className={`badge ${severity.className} text-[10px] py-0 px-1.5`}>
                {severity.label}
              </span>
            )}
          </div>
        </div>

        {/* Card Actions: Delete Button & View Arrow */}
        <div className="flex items-center gap-1 self-center flex-shrink-0 ml-1">
          {onDelete && (
            <button
              type="button"
              title="Delete this report"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(report.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
        </div>
      </div>
    </article>
  );
}
