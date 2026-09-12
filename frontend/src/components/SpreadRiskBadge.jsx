/**
 * SpreadRiskBadge.jsx – Dev 2
 *
 * Displays the computed spread risk (LOW / MEDIUM / HIGH) with icon and color.
 */

import React from "react";

const SPREAD_MAP = {
  LOW:    { label: "Low Spread Risk",    bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", barWidth: "33%",  barColor: "bg-emerald-500" },
  MEDIUM: { label: "Medium Spread Risk", bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-400",   barWidth: "66%",  barColor: "bg-amber-500" },
  HIGH:   { label: "High Spread Risk",   bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-400",     barWidth: "100%", barColor: "bg-red-500" },
};

const SpreadRiskBadge = ({ spreadRisk = "LOW" }) => {
  const key = (spreadRisk || "").toUpperCase();
  const config = SPREAD_MAP[key] || SPREAD_MAP.LOW;

  return (
    <div className={`rounded-xl border p-3 ${config.bg} ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${config.text}`}>
          🌱 {config.label}
        </span>
      </div>
      {/* Visual risk bar */}
      <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${config.barColor} transition-all duration-700`}
          style={{ width: config.barWidth }}
        />
      </div>
      <p className="text-slate-400 text-xs mt-1.5">
        Risk of spreading to nearby farms
      </p>
    </div>
  );
};

export default SpreadRiskBadge;
