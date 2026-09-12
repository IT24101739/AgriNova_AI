/**
 * LocationSelector — Geolocation API + manual lat/lng fallback.
 * Emits { latitude, longitude } to parent form.
 */

import React, { useState } from 'react';

export default function LocationSelector({ latitude, longitude, onChange, error }) {
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'

  const handleDetect = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        });
        setLoading(false);
        setMode('auto');
      },
      (err) => {
        setGeoError('Could not detect location. Please enter manually.');
        setLoading(false);
        setMode('manual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const hasLocation = latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined;

  return (
    <div className="form-group">
      <label className="form-label">Farm Location *</label>

      {/* Auto-detect button */}
      <button
        type="button"
        onClick={handleDetect}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.75rem 1rem',
          background: hasLocation
            ? 'rgba(34,197,94,0.1)'
            : 'var(--color-surface-2)',
          border: `1.5px solid ${hasLocation ? 'var(--color-leaf-600)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-sm)',
          color: hasLocation ? '#4ade80' : 'var(--color-muted)',
          fontWeight: 600,
          fontSize: '0.9rem',
          cursor: loading ? 'wait' : 'pointer',
          width: '100%',
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <>
            <div className="spinner spinner-green" />
            Detecting location…
          </>
        ) : hasLocation ? (
          <>
            <span>📍</span>
            {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>
              Tap to refresh
            </span>
          </>
        ) : (
          <>
            <span>🗺️</span>
            Use My Location
          </>
        )}
      </button>

      {/* Manual entry toggle */}
      <button
        type="button"
        onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-muted)',
          fontSize: '0.78rem',
          cursor: 'pointer',
          textDecoration: 'underline',
          alignSelf: 'flex-start',
          padding: '0.2rem 0',
        }}
      >
        {mode === 'manual' ? '▲ Hide manual entry' : '▼ Enter coordinates manually'}
      </button>

      {/* Manual lat/lng inputs */}
      {mode === 'manual' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.72rem' }}>Latitude</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 7.2906"
              className="form-input"
              value={latitude ?? ''}
              onChange={(e) =>
                onChange({ latitude: parseFloat(e.target.value), longitude })
              }
              aria-label="Latitude"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.72rem' }}>Longitude</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 80.6337"
              className="form-input"
              value={longitude ?? ''}
              onChange={(e) =>
                onChange({ latitude, longitude: parseFloat(e.target.value) })
              }
              aria-label="Longitude"
            />
          </div>
        </div>
      )}

      {(geoError || error) && (
        <p className="form-error">⚠ {geoError || error}</p>
      )}
    </div>
  );
}
