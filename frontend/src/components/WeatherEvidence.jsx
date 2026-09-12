/**
 * WeatherEvidence.jsx – Dev 2
 *
 * Displays weather conditions relevant to the disease prediction.
 */

import React from "react";

const RISK_COLORS = {
  LOW:    { label: "Low Weather Risk",      text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  MEDIUM: { label: "Moderate Weather Risk", text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20" },
  HIGH:   { label: "High Weather Risk",     text: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20" },
};

const StatTile = ({ icon, label, value, unit }) => (
  <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30 min-w-[80px]">
    <span className="text-2xl">{icon}</span>
    <span className="text-white font-bold text-lg leading-none">{value}<span className="text-xs text-slate-400 ml-0.5">{unit}</span></span>
    <span className="text-slate-400 text-xs text-center">{label}</span>
  </div>
);

const WeatherEvidence = ({ weather = {}, supportsDisease = false }) => {
  const riskKey = (weather.risk || "LOW").toUpperCase();
  const riskConfig = RISK_COLORS[riskKey] || RISK_COLORS.LOW;

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌤</span>
          <h3 className="text-white font-semibold text-sm">Weather Conditions</h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${riskConfig.bg} ${riskConfig.border} ${riskConfig.text}`}>
          {riskConfig.label}
        </span>
      </div>

      {/* Weather stats */}
      <div className="flex gap-3 flex-wrap justify-center sm:justify-start">
        <StatTile icon="🌡️" label="Temperature" value={weather.temperature ?? "--"} unit="°C" />
        <StatTile icon="💧" label="Humidity"    value={weather.humidity    ?? "--"} unit="%" />
        <StatTile icon="🌧️" label="Rainfall"    value={weather.rainfall    ?? "--"} unit="mm" />
      </div>

      {/* Disease correlation note */}
      {supportsDisease && (
        <div className={`mt-4 flex items-start gap-2 p-3 rounded-xl border text-sm ${riskConfig.bg} ${riskConfig.border}`}>
          <span className="flex-shrink-0 mt-0.5">⚡</span>
          <span className={riskConfig.text}>
            Current weather conditions are favorable for the spread of this disease.
          </span>
        </div>
      )}
    </div>
  );
};

export default WeatherEvidence;
