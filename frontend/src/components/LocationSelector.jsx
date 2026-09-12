/**
 * LocationSelector – Geolocation API + manual lat/lng fallback.
 * Emits { latitude, longitude } to parent form.
 * Clean, responsive dark-mode UI with no overflows.
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RotateCw, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';

const REGION_PRESETS = [
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Nuwara Eliya', lat: 6.9497, lng: 80.7891 },
  { name: 'Anuradhapura', lat: 8.3114, lng: 80.4037 },
  { name: 'Jaffna', lat: 9.6615, lng: 80.0255 },
];

export default function LocationSelector({ latitude, longitude, onChange, error }) {
  const [loading, setLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [mode, setMode] = useState('auto'); // 'auto' | 'manual'

  // Local string state to allow smooth decimal typing without parseFloat swallowing dots
  const [latStr, setLatStr] = useState(latitude != null ? String(latitude) : '');
  const [lngStr, setLngStr] = useState(longitude != null ? String(longitude) : '');

  useEffect(() => {
    if (latitude != null) setLatStr(String(latitude));
    else if (mode === 'auto') setLatStr('');
    
    if (longitude != null) setLngStr(String(longitude));
    else if (mode === 'auto') setLngStr('');
  }, [latitude, longitude, mode]);

  const handleDetect = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setMode('manual');
      return;
    }
    setLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange({ latitude: lat, longitude: lng });
        setLatStr(String(lat));
        setLngStr(String(lng));
        setLoading(false);
        setMode('auto');
      },
      (err) => {
        setGeoError('Location permission denied or unavailable. Enter manually below.');
        setLoading(false);
        setMode('manual');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualChange = (newLatStr, newLngStr) => {
    setLatStr(newLatStr);
    setLngStr(newLngStr);

    const parsedLat = parseFloat(newLatStr);
    const parsedLng = parseFloat(newLngStr);

    onChange({
      latitude: !isNaN(parsedLat) ? parsedLat : null,
      longitude: !isNaN(parsedLng) ? parsedLng : null,
    });
  };

  const applyPreset = (preset) => {
    onChange({ latitude: preset.lat, longitude: preset.lng });
    setLatStr(String(preset.lat));
    setLngStr(String(preset.lng));
    setGeoError('');
  };

  const hasLocation = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

  return (
    <div className="w-full min-w-0 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Farm Location <span className="text-emerald-400">*</span>
        </label>
        {hasLocation && (
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Set
          </span>
        )}
      </div>

      {/* Auto-detect button */}
      <button
        type="button"
        onClick={handleDetect}
        disabled={loading}
        className={`w-full min-w-0 flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
          hasLocation
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
            : 'bg-[#0b1329] border-white/10 text-slate-300 hover:border-emerald-500/30 hover:bg-slate-800/40'
        } ${loading ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          {loading ? (
            <RotateCw className="w-4 h-4 text-emerald-400 animate-spin flex-shrink-0" />
          ) : (
            <MapPin className={`w-4 h-4 flex-shrink-0 ${hasLocation ? 'text-emerald-400' : 'text-slate-400'}`} />
          )}
          <span className="truncate">
            {loading ? (
              'Detecting coordinates...'
            ) : hasLocation ? (
              <span className="font-mono tracking-tight font-medium">
                {Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}
              </span>
            ) : (
              'Auto-Detect My Location'
            )}
          </span>
        </div>

        <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0 ml-2">
          {hasLocation ? (
            <>
              <RotateCw className="w-3 h-3 text-slate-400" /> Refresh
            </>
          ) : (
            <>
              <Navigation className="w-3 h-3 text-emerald-400" /> GPS
            </>
          )}
        </span>
      </button>

      {/* Toggle button between auto & manual */}
      <div className="flex items-center justify-between mt-2 px-0.5">
        <button
          type="button"
          onClick={() => setMode(mode === 'manual' ? 'auto' : 'manual')}
          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          {mode === 'manual' ? 'Hide manual coordinates' : 'Enter coordinates manually'}
        </button>
      </div>

      {/* Manual coordinate entry box */}
      {mode === 'manual' && (
        <div className="mt-2.5 p-3 rounded-xl bg-[#080f22] border border-white/10 w-full min-w-0 space-y-2.5 animate-fade-up">
          <div className="grid grid-cols-2 gap-2.5 w-full min-w-0">
            <div className="min-w-0 flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
                Latitude
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 6.8588"
                className="w-full min-w-0 bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all box-border"
                value={latStr}
                onChange={(e) => handleManualChange(e.target.value, lngStr)}
                aria-label="Latitude"
              />
            </div>
            <div className="min-w-0 flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 truncate">
                Longitude
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 80.0704"
                className="w-full min-w-0 bg-[#0b1329] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 transition-all box-border"
                value={lngStr}
                onChange={(e) => handleManualChange(latStr, e.target.value)}
                aria-label="Longitude"
              />
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="pt-1">
            <p className="text-[10px] text-slate-500 mb-1.5 font-medium">Quick presets (Sri Lanka):</p>
            <div className="flex flex-wrap gap-1.5">
              {REGION_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-emerald-500/20 text-[10px] text-slate-300 hover:text-emerald-300 border border-white/5 transition-all cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {(geoError || error) && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-red-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-red-400" />
          <span>{geoError || error}</span>
        </div>
      )}
    </div>
  );
}
