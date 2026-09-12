/**
 * LanguageSelector — toggle between English, Sinhala, Tamil.
 * Emits 'en' | 'si' | 'ta' values.
 */

import React from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'si', label: 'Sinhala', native: 'සිංහල' },
  { code: 'ta', label: 'Tamil',   native: 'தமிழ்' },
];

export default function LanguageSelector({ value, onChange, error }) {
  return (
    <div className="form-group">
      <label className="form-label">Preferred Language *</label>
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
          border: '1.5px solid var(--color-border)',
        }}
      >
        {LANGUAGES.map((lang) => {
          const selected = value === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange(lang.code)}
              style={{
                flex: 1,
                padding: '0.6rem 0.25rem',
                borderRadius: '8px',
                border: 'none',
                background: selected
                  ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                  : 'transparent',
                color: selected ? '#fff' : 'var(--color-muted)',
                fontWeight: selected ? 700 : 500,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.1rem',
                boxShadow: selected ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
              }}
              aria-pressed={selected}
              aria-label={`Select ${lang.label}`}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{lang.native}</span>
              {value !== lang.code && (
                <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{lang.label}</span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="form-error">⚠ {error}</p>}
    </div>
  );
}
