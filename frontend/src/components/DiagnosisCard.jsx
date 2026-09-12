/**
 * DiagnosisCard.jsx – Dev 2
 *
 * Displays the primary diagnosis: disease name, decision badge, and reasons.
 */

import React from "react";

const DECISION_CONFIG = {
  AUTO_ADVICE: {
    label: "Diagnosis Ready",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/40",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    icon: "✓",
  },
  NEED_MORE_INFO: {
    label: "More Info Needed",
    bg: "bg-amber-500/20",
    border: "border-amber-500/40",
    text: "text-amber-400",
    dot: "bg-amber-400",
    icon: "?",
  },
  OFFICER_REVIEW: {
    label: "Officer Review",
    bg: "bg-blue-500/20",
    border: "border-blue-500/40",
    text: "text-blue-400",
    dot: "bg-blue-400",
    icon: "⚐",
  },
  OUTBREAK_WARNING: {
    label: "Outbreak Warning",
    bg: "bg-red-500/20",
    border: "border-red-500/40",
    text: "text-red-400",
    dot: "bg-red-400",
    icon: "⚠",
  },
};

const DiagnosisCard = ({ disease, confidence, decision = "AUTO_ADVICE", reasons = [] }) => {
  const config = DECISION_CONFIG[decision] || DECISION_CONFIG.AUTO_ADVICE;
  const confidencePct = Math.round((confidence || 0) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-6 shadow-xl">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full -translate-y-20 translate-x-20 blur-2xl" />

      {/* Decision badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${config.bg} ${config.border} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
        <span>{config.icon} {config.label}</span>
      </div>

      {/* Disease name */}
      <h2 className="text-2xl font-bold text-white leading-tight mb-1">
        {disease || "Unknown Disease"}
      </h2>
      <p className="text-slate-400 text-sm mb-4">Predicted crop disease</p>

      {/* Confidence inline display */}
      <div className="flex items-center gap-3">
        <span className="text-slate-400 text-sm">Confidence</span>
        <span className={`text-lg font-bold ${confidencePct >= 80 ? "text-emerald-400" : confidencePct >= 50 ? "text-amber-400" : "text-red-400"}`}>
          {confidencePct}%
        </span>
      </div>

      {/* Reasons list */}
      {reasons.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">Evidence</p>
          <ul className="space-y-1.5">
            {reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">›</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DiagnosisCard;
