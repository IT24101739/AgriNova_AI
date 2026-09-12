/**
 * SeverityBadge.jsx – Dev 2
 *
 * Color-coded pill badge for disease severity level.
 */

import React from "react";

const SEVERITY_MAP = {
  LOW:      { label: "Low Severity",      bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-400", icon: "🟢" },
  MODERATE: { label: "Moderate Severity", bg: "bg-amber-500/15",   border: "border-amber-500/30",   text: "text-amber-400",   icon: "🟡" },
  HIGH:     { label: "High Severity",     bg: "bg-orange-500/15",  border: "border-orange-500/30",  text: "text-orange-400",  icon: "🟠" },
  CRITICAL: { label: "Critical",          bg: "bg-red-500/15",     border: "border-red-500/30",     text: "text-red-400",     icon: "🔴" },
};

const SeverityBadge = ({ severity = "MODERATE", size = "md" }) => {
  const key = (severity || "").toUpperCase();
  const config = SEVERITY_MAP[key] || SEVERITY_MAP.MODERATE;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }[size] || "px-3.5 py-1.5 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default SeverityBadge;
