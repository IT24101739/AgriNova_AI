/**
 * TreatmentSteps.jsx – Dev 2
 *
 * Renders the localized, LLM-generated treatment steps and optional warning.
 */

import React, { useState } from "react";

const TreatmentSteps = ({ advice = {}, isLoading = false }) => {
  const { diagnosis_text, treatment_steps = [], warning, language } = advice;
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-5 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 bg-slate-700/60 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!treatment_steps.length) return null;

  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 overflow-hidden">
      {/* Warning banner */}
      {warning && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border-b border-red-500/20">
          <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
          <p className="text-red-300 text-sm leading-relaxed">{warning}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <h3 className="text-white font-semibold text-sm">Treatment Steps</h3>
          {language && language !== "en" && (
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              {language === "si" ? "සිංහල" : language === "ta" ? "தமிழ்" : language}
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-slate-400 hover:text-white transition-colors text-xs"
        >
          {expanded ? "Collapse ▲" : "Expand ▼"}
        </button>
      </div>

      {/* Diagnosis summary text */}
      {diagnosis_text && (
        <p className="text-slate-300 text-sm px-5 pt-3 pb-1 leading-relaxed">
          {diagnosis_text}
        </p>
      )}

      {/* Steps */}
      {expanded && (
        <div className="p-5 pt-3 space-y-3">
          {treatment_steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-emerald-500/30 transition-colors group"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-emerald-400 text-xs font-bold">{idx + 1}</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed group-hover:text-white transition-colors">
                {step}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentSteps;
