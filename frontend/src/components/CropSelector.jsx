/**
 * CropSelector — grid of selectable crop cards.
 * Crops are defined in a config array so new crops can be added
 * without changing this component.
 */

import React from 'react';

// Crop configuration — agricultural crops supported by AgriNova AI
const CROPS = [
  {
    id: 'Tomato',
    label: 'Tomato',
    emoji: '🍅',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'Potato',
    label: 'Potato',
    emoji: '🥔',
    color: '#d97706',
    glow: 'rgba(217,119,6,0.25)',
  },
  {
    id: 'Pepper',
    label: 'Pepper / Chilli',
    emoji: '🌶️',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    id: 'Rice',
    label: 'Rice / Paddy',
    emoji: '🌾',
    color: '#eab308',
    glow: 'rgba(234,179,8,0.25)',
  },
  {
    id: 'Corn',
    label: 'Corn / Maize',
    emoji: '🌽',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'Tea',
    label: 'Tea Flush',
    emoji: '🍃',
    color: '#14b8a6',
    glow: 'rgba(20,184,166,0.25)',
  },
  {
    id: 'Banana',
    label: 'Banana',
    emoji: '🍌',
    color: '#facc15',
    glow: 'rgba(250,204,21,0.25)',
  },
  {
    id: 'Eggplant',
    label: 'Brinjal',
    emoji: '🍆',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.25)',
  },
];

export default function CropSelector({ value, onChange, error }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Select Crop Foliage Type <span className="text-emerald-400">*</span>
        </label>
        <span className="text-[11px] text-slate-400">
          {CROPS.length} Crops Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CROPS.map((crop) => {
          const selected = value === crop.id;
          return (
            <button
              key={crop.id}
              type="button"
              onClick={() => onChange(crop.id)}
              className={`p-3 rounded-xl flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 border ${
                selected
                  ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/70 scale-[1.02]'
                  : 'bg-[#08180e]/90 border-white/10 hover:border-emerald-500/40 hover:bg-[#0c2415]/90 hover:scale-[1.01]'
              }`}
              aria-pressed={selected}
              aria-label={`Select ${crop.label}`}
            >
              <span className="text-3xl leading-none transition-transform group-hover:scale-110">{crop.emoji}</span>
              <span
                className={`text-xs font-bold tracking-wide transition-colors ${
                  selected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {crop.label}
              </span>
              {selected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  ✓ Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-red-400 font-medium mt-1">⚠ {error}</p>}
    </div>
  );
}

// Export crop list so other components can use it
export { CROPS };
