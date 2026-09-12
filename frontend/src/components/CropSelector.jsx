/**
 * CropSelector — grid of selectable crop cards.
 * Crops are defined in a config array so new crops can be added
 * without changing this component.
 */

import React from 'react';

// Crop configuration — extend this array to add new crops
const CROPS = [
  {
    id: 'Tomato',
    label: 'Tomato',
    emoji: '🍅',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.2)',
  },
  {
    id: 'Potato',
    label: 'Potato',
    emoji: '🥔',
    color: '#d97706',
    glow: 'rgba(217,119,6,0.2)',
  },
  {
    id: 'Pepper',
    label: 'Pepper',
    emoji: '🫑',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.2)',
  },
];

export default function CropSelector({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label className="form-label">Select Crop *</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        {CROPS.map((crop) => {
          const selected = value === crop.id;
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => onChange(crop.id)}
              style={{
                background: selected
                  ? `linear-gradient(135deg, ${crop.color}22, ${crop.color}11)`
                  : 'var(--color-surface-2)',
                border: `2px solid ${selected ? crop.color : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '1rem 0.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selected ? `0 0 16px ${crop.glow}` : 'none',
                transform: selected ? 'scale(1.03)' : 'scale(1)',
              }}
              aria-pressed={selected}
              aria-label={`Select ${crop.label}`}
            >
              <span style={{ fontSize: '2rem', lineHeight: 1 }}>{crop.emoji}</span>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: selected ? crop.color : 'var(--color-muted)',
                  letterSpacing: '0.03em',
                }}
              >
                {crop.label}
              </span>
              {selected && (
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: crop.color,
                    boxShadow: `0 0 6px ${crop.color}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
    </div>
  );
}

// Export crop list so other components can use it
export { CROPS };
