/**
 * LanguageSelector – toggle between English, Sinhala, Tamil.
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
    <div className="w-full min-w-0 flex flex-col">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
        Preferred Language <span className="text-emerald-400">*</span>
      </label>
      <div className="grid grid-cols-3 gap-2 bg-[#0b1329] border border-white/10 rounded-xl p-1.5 w-full min-w-0">
        {LANGUAGES.map((lang) => {
          const selected = value === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange(lang.code)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg text-xs transition-all cursor-pointer ${
                selected
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-medium'
              }`}
              aria-pressed={selected}
              aria-label={`Select ${lang.label}`}
            >
              <span className="text-xs font-bold leading-tight">{lang.native}</span>
              <span className="text-[10px] opacity-75 leading-tight mt-0.5">{lang.label}</span>
            </button>
          );
        })}
      </div>
      {error && <p className="text-red-400 text-xs mt-1.5">⚠ {error}</p>}
    </div>
  );
}
