/**
 * ReportCard — compact list item for FarmerHome reports list.
 * Navigates to ReportStatus on click.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function ReportCard({ report }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;
  const severity = report.severity ? SEVERITY_CONFIG[report.severity] : null;

  const date = new Date(report.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <article
      className="agri-card animate-fade-up"
      style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onClick={() => navigate(`/reports/${report.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
      role="button"
      tabIndex={0}
      aria-label={`Report: ${report.crop} - ${status.label}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/reports/${report.id}`)}
    >
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {/* Crop image / thumbnail */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            flexShrink: 0,
            background: 'var(--color-surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.75rem',
          }}
        >
          {report.image_url ? (
            <img
              src={report.image_url}
              alt={report.crop}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            CROP_EMOJI[report.crop] || '🌿'
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{report.crop}</span>
            <span className={`badge ${status.className}`}>
              {status.icon} {status.label}
            </span>
          </div>

          {report.disease && (
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-muted)',
                marginTop: '0.2rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              🦠 {report.disease}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.4rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>📅 {date}</span>
            {severity && (
              <span className={`badge ${severity.className}`} style={{ fontSize: '0.68rem' }}>
                Severity: {severity.label}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <span style={{ color: 'var(--color-muted)', alignSelf: 'center' }}>›</span>
      </div>
    </article>
  );
}
