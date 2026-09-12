/**
 * FarmerHome — landing page for the farmer interface.
 * Shows welcome hero, quick "New Report" CTA, and recent reports list.
 *
 * For the prototype, farmer_id and farm_id are stored in localStorage
 * (Supabase Auth integration is a future step).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFarmReports } from '../services/api';
import ReportCard from '../components/ReportCard';

// Demo IDs for prototype — replace with Supabase Auth user ID
const DEMO_FARM_ID = localStorage.getItem('agrishield_farm_id') || null;

export default function FarmerHome() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (DEMO_FARM_ID) {
      setLoading(true);
      getFarmReports(DEMO_FARM_ID)
        .then((res) => setReports(res.data?.reports || []))
        .catch(() => setError('Could not load reports.'))
        .finally(() => setLoading(false));
    }
  }, []);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Hero ── */}
      <section
        className="hero-gradient"
        style={{ padding: '2.5rem 1rem 3rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Decorative background circles */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.08)',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -40,
            left: -40,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.06)',
          }}
        />

        <div className="agri-container" style={{ position: 'relative' }}>
          {/* App brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🌿</span>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1.15rem',
                background: 'linear-gradient(90deg, #4ade80, #86efac)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              AgriShield
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.6rem, 5vw, 2rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '0.6rem',
              letterSpacing: '-0.02em',
            }}
          >
            Protect Your{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #4ade80, #86efac)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Harvest
            </span>
          </h1>
          <p style={{ color: 'rgba(241,245,249,0.7)', fontSize: '0.95rem', marginBottom: '1.75rem', maxWidth: 340 }}>
            AI-powered crop disease detection. Upload a leaf photo and get instant diagnosis.
          </p>

          {/* CTA */}
          <button
            id="btn-new-report"
            className="btn btn-primary btn-lg"
            onClick={() => navigate('/reports/new')}
            style={{ width: '100%', maxWidth: 340 }}
          >
            <span style={{ fontSize: '1.1rem' }}>📷</span>
            New Disease Report
          </button>
        </div>
      </section>

      {/* ── Recent Reports ── */}
      <main
        className="agri-container"
        style={{ flex: 1, padding: '1.5rem 1rem 2rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Reports</h2>
          {reports.length > 0 && (
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(34,197,94,0.15)',
                color: '#4ade80',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                fontWeight: 700,
              }}
            >
              {reports.length}
            </span>
          )}
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner spinner-green" style={{ width: 28, height: 28 }} />
          </div>
        )}

        {error && (
          <div
            className="agri-card"
            style={{ textAlign: 'center', color: '#f87171', padding: '1.5rem' }}
          >
            ⚠ {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div
            className="agri-card"
            style={{ textAlign: 'center', padding: '2.5rem 1rem' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌱</div>
            <p style={{ fontWeight: 600, marginBottom: '0.35rem' }}>No reports yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '1.25rem' }}>
              Submit your first crop disease report to get started.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/reports/new')}
            >
              Create First Report
            </button>
          </div>
        )}

        {!loading && reports.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reports.map((report, idx) => (
              <div key={report.id} className={`delay-${Math.min(idx + 1, 4)}`}>
                <ReportCard report={report} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Bottom nav bar ── */}
      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--color-border)',
          padding: '0.75rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
        }}
      >
        <button
          className="btn btn-ghost"
          style={{ flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem', color: '#4ade80' }}
          onClick={() => navigate('/')}
        >
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          Home
        </button>
        <button
          className="btn btn-ghost"
          style={{ flexDirection: 'column', gap: '0.2rem', fontSize: '0.7rem' }}
          onClick={() => navigate('/reports/new')}
        >
          <span style={{ fontSize: '1.25rem' }}>➕</span>
          New Report
        </button>
      </nav>
    </div>
  );
}
