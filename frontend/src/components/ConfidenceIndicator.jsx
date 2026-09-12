/**
 * ConfidenceIndicator.jsx – Dev 2
 *
 * Animated arc gauge displaying the confidence percentage.
 */

import React from "react";

const ConfidenceIndicator = ({ confidence = 0 }) => {
  const pct = Math.round(Math.min(1, Math.max(0, confidence)) * 100);

  // SVG arc math
  const radius = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270° arc
  const fillLength = arcLength * (pct / 100);
  const dashOffset = arcLength - fillLength;

  const color =
    pct >= 80 ? "#10b981" :  // emerald-500
    pct >= 50 ? "#f59e0b" :  // amber-500
                "#ef4444";   // red-500

  const label =
    pct >= 80 ? "High Confidence" :
    pct >= 50 ? "Moderate Confidence" :
                "Low Confidence";

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/40">
      <svg width={128} height={100} viewBox="0 0 128 100">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Fill */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
        />
        {/* Percentage text */}
        <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
          fill="white" fontSize={22} fontWeight="bold" fontFamily="Inter, sans-serif">
          {pct}%
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
          fill="#94a3b8" fontSize={10} fontFamily="Inter, sans-serif">
          CONFIDENCE
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  );
};

export default ConfidenceIndicator;
