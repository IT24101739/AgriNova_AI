/**
 * ReportStatus — shows full analysis results for a single report.
 *
 * Behaviour:
 * - Loads report on mount
 * - Auto-polls every 5s while status is PENDING or ANALYZING
 * - Shows AnalysisProgress spinner while processing
 * - Shows full disease + severity results when IMAGE_ANALYZED
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReport } from '../services/api';
import AnalysisProgress from '../components/AnalysisProgress';

const POLL_INTERVAL_MS = 5000;
const FINAL_STATUSES = ['IMAGE_ANALYZED', 'DIAGNOSED', 'COMPLETED', 'FAILED'];

const SEVERITY_LABELS = {
  LOW:      { label: 'Low Severity',      color: '#4ade80', bg: 'rgba(34,197,94,0.1)',  icon: '🟢', desc: 'Minor issue, monitor the plant.' },
  MODERATE: { label: 'Moderate Severity', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', icon: '🟡', desc: 'Act soon — apply treatment.' },
  HIGH:     { label: 'High Severity',     color: '#f87171', bg: 'rgba(239,68,68,0.1)',  icon: '🔴', desc: 'Urgent — significant crop damage.' },
};

const LANG_LABELS = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' };

export default function ReportStatus() {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const pollRef = useRef(null);

  const fetchReport = async () => {
    try {
      const res = await getReport(reportId);
      const data = res.data;
      setReport(data);
      setFetchError('');

      // Stop polling if final status
      if (FINAL_STATUSES.includes(data.status)) {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      setFetchError(err.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // Start polling — cleared when final status reached or unmounted
    pollRef.current = setInterval(fetchReport, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [reportId]);

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="spinner spinner-green" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="agri-container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>⚠ {fetchError}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>← Back Home</button>
      </div>
    );
  }

  const analysis = report?.image_analysis;
  const isAnalyzing = !FINAL_STATUSES.includes(report?.status);
  const severity = analysis?.severity ? SEVERITY_LABELS[analysis.severity] : null;
  const date = report?.created_at
    ? new Date(report.created_at).toLocaleString('en-GB')
    : '';

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/farmer')}
          aria-label="Go back"
        >
          ‹
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: '1rem' }}>Report Results</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {report?.crop} · {date}
          </p>
        </div>
        {isAnalyzing && (
          <div className="spinner spinner-green" style={{ width: 20, height: 20 }} />
        )}
      </header>

      <main className="agri-container" style={{ flex: 1, padding: '1.25rem 1rem 2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Leaf image */}
        {report?.image_url && (
          <div
            className="animate-fade-up"
            style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              maxHeight: 240,
            }}
          >
            <img
              src={report.image_url}
              alt="Submitted leaf"
              style={{ width: '100%', height: 240, objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Analysis progress (shown while processing) */}
        {isAnalyzing && (
          <div className="animate-fade-up delay-1">
            <AnalysisProgress status={report?.status} />
          </div>
        )}

        {/* Results (shown when IMAGE_ANALYZED or beyond) */}
        {!isAnalyzing && report?.status !== 'FAILED' && analysis && (
          <>
            {/* Disease / Health status card */}
            <div className="agri-card animate-fade-up delay-1">
              <p className="form-label" style={{ marginBottom: '0.5rem' }}>
                {analysis.is_healthy || (analysis.disease && analysis.disease.toLowerCase().includes('healthy'))
                  ? '🌿 Plant Health Status'
                  : '🦠 Detected Disease'}
              </p>
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: '#4ade80',
                  marginBottom: '0.5rem',
                  lineHeight: 1.2,
                }}
              >
                {analysis.disease || 'Unknown'}
              </h2>
              {(analysis.is_healthy || (analysis.disease && analysis.disease.toLowerCase().includes('healthy'))) && (
                <div style={{
                  padding: '0.6rem 0.85rem',
                  background: 'rgba(16, 185, 129, 0.12)',
                  borderRadius: '10px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  marginBottom: '0.75rem',
                }}>
                  <p style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600 }}>
                    ✓ No active fungal or bacterial pathogens detected. Leaf tissue is healthy and thriving.
                  </p>
                </div>
              )}

              {/* Confidence bar */}
              {analysis.confidence !== null && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      color: 'var(--color-muted)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <span>AI Confidence</span>
                    <span style={{ fontWeight: 700, color: '#4ade80' }}>
                      {(analysis.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: 'var(--color-surface-2)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(analysis.confidence * 100).toFixed(1)}%`,
                        background: 'linear-gradient(90deg, #16a34a, #4ade80)',
                        borderRadius: 999,
                        transition: 'width 1s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Severity card */}
            {severity && (
              <div
                className="agri-card animate-fade-up delay-2"
                style={{
                  background: severity.bg,
                  border: `1px solid ${severity.color}33`,
                }}
              >
                <p className="form-label" style={{ marginBottom: '0.5rem' }}>📊 Severity Assessment</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '2rem' }}>{severity.icon}</span>
                  <div>
                    <p style={{ fontWeight: 700, color: severity.color }}>{severity.label}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{severity.desc}</p>
                  </div>
                </div>
                {analysis.affected_percentage !== null && (
                  <div
                    style={{
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.875rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                      Estimated affected area
                    </span>
                    <span style={{ fontWeight: 800, color: severity.color, fontSize: '1rem' }}>
                      {analysis.affected_percentage.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Report metadata */}
            <div className="agri-card animate-fade-up delay-3">
              <p className="form-label" style={{ marginBottom: '0.75rem' }}>📋 Report Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  ['Crop', `${report.crop}`],
                  ['Language', LANG_LABELS[report.preferred_language]],
                  ['Location', report.latitude ? `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}` : '—'],
                  ['Description', report.description || '—'],
                  ['Report ID', `#${report.id?.slice(0, 8)}…`],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      paddingBottom: '0.5rem',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Advisory & Weather Action */}
            <div
              className="agri-card animate-fade-up delay-4"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
                border: '1px solid rgba(16,185,129,0.3)',
                textAlign: 'center',
                padding: '1.5rem',
                borderRadius: '1rem',
              }}
            >
              <span style={{ fontSize: '2rem' }}>🌦️</span>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.4rem', color: '#fff' }}>
                Full Advisory & Weather Risk Ready
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                Open-Meteo climate conditions, treatment steps (Sinhala/Tamil/English), and officer triage status.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate(`/results/${report.id}`)}
                style={{
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  borderRadius: '0.75rem',
                }}
              >
                View Full Advisory & Diagnosis →
              </button>
            </div>
          </>
        )}

        {/* Failed state */}
        {report?.status === 'FAILED' && (
          <div className="agri-card animate-fade-up" style={{ textAlign: 'center', padding: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>❌</span>
            <h2 style={{ fontWeight: 700, marginTop: '0.75rem' }}>Analysis Failed</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', margin: '0.5rem 0 1.25rem' }}>
              Something went wrong during AI analysis. Please try submitting a new report.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/reports/new')}>
              Submit New Report
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
