/**
 * NearbyOutbreakAlert.jsx – Dev 2
 *
 * Alert card shown when nearby cases are detected (risk MEDIUM or HIGH).
 * Hidden when outbreak risk is LOW.
 */

import React from "react";

const NearbyOutbreakAlert = ({ outbreak = {} }) => {
  const { nearby_cases = 0, radius_km = 5, risk = "LOW" } = outbreak;

  if (risk === "LOW" || nearby_cases === 0) return null;

  const isHigh = risk === "HIGH";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        isHigh
          ? "bg-red-500/10 border-red-500/30"
          : "bg-amber-500/10 border-amber-500/30"
      }`}
    >
      {/* Animated pulse ring for HIGH risk */}
      {isHigh && (
        <div className="absolute top-4 right-4 w-10 h-10">
          <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-30 animate-ping" />
          <span className="relative inline-flex w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 items-center justify-center text-lg">
            🚨
          </span>
        </div>
      )}

      {/* Icon + title */}
      <div className="flex items-center gap-2 mb-3 pr-12">
        <span className="text-2xl">{isHigh ? "🔴" : "🟡"}</span>
        <h3 className={`font-bold text-sm ${isHigh ? "text-red-300" : "text-amber-300"}`}>
          {isHigh ? "Potential Outbreak Detected" : "Nearby Similar Cases"}
        </h3>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-3">
        <div className="text-center">
          <div className={`text-3xl font-black ${isHigh ? "text-red-400" : "text-amber-400"}`}>
            {nearby_cases}
          </div>
          <div className="text-slate-400 text-xs">similar cases</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${isHigh ? "text-red-300" : "text-amber-300"}`}>
            {radius_km} km
          </div>
          <div className="text-slate-400 text-xs">radius</div>
        </div>
        <div className="text-center">
          <div className={`text-sm font-bold px-2 py-0.5 rounded-full ${isHigh ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
            {risk}
          </div>
          <div className="text-slate-400 text-xs">risk level</div>
        </div>
      </div>

      {/* Advisory text */}
      <p className={`text-sm leading-relaxed ${isHigh ? "text-red-200" : "text-amber-200"}`}>
        {isHigh
          ? "Multiple farms in your area have reported the same disease in the past 7 days. Please follow all treatment steps and alert nearby farmers immediately."
          : "A few nearby farms have reported similar symptoms recently. Monitor your crop closely and follow the treatment steps below."}
      </p>
    </div>
  );
};

export default NearbyOutbreakAlert;
