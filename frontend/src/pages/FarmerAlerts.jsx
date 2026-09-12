/**
 * FarmerAlerts.jsx – Dev 2
 *
 * Shows all notifications for the current farmer.
 * Route: /alerts
 *
 * Reads from the shared `notifications` table via backend.
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmerAlerts, markAlertRead } from "../services/analysisService";

// ── Notification config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  AUTO_ADVICE: {
    icon: "✅",
    label: "Diagnosis Ready",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  NEED_MORE_INFO: {
    icon: "📸",
    label: "Photo Needed",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-400",
  },
  OFFICER_REVIEW: {
    icon: "👨‍🌾",
    label: "Officer Assigned",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-400",
  },
  OUTBREAK_WARNING: {
    icon: "🚨",
    label: "Outbreak Warning",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
  },
};

const DEFAULT_CONFIG = {
  icon: "🔔",
  label: "Notification",
  bg: "bg-slate-800/60",
  border: "border-slate-700/40",
  dot: "bg-slate-400",
};

// ── Time formatter ────────────────────────────────────────────────────────────
const timeAgo = (isoString) => {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Alert card ────────────────────────────────────────────────────────────────
const AlertCard = ({ alert, onMarkRead, onNavigate }) => {
  const config = TYPE_CONFIG[alert.type] || DEFAULT_CONFIG;
  const isUnread = !alert.read;

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all cursor-pointer hover:scale-[1.01] ${config.bg} ${config.border} ${isUnread ? "shadow-lg" : "opacity-70"}`}
      onClick={() => {
        if (alert.report_id) onNavigate(`/results/${alert.report_id}`);
        if (isUnread) onMarkRead(alert.id);
      }}
    >
      {/* Unread dot */}
      {isUnread && (
        <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${config.dot}`} />
      )}

      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-white text-sm font-semibold">{config.label}</span>
            <span className="text-slate-500 text-xs">{timeAgo(alert.created_at)}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{alert.message}</p>
          {alert.report_id && (
            <span className="text-slate-500 text-xs mt-1 block">Tap to view diagnosis →</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const FarmerAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get userId from localStorage (set during auth by Member 1)
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        setError("Please log in to view your alerts.");
        setLoading(false);
        return;
      }
      try {
        const data = await getFarmerAlerts(userId);
        setAlerts(Array.isArray(data) ? data : data?.notifications || []);
      } catch (err) {
        setError(err.message || "Failed to load alerts.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleMarkRead = async (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
    );
    try {
      await markAlertRead(alertId);
    } catch {
      // Silently ignore — optimistic update already applied
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-10 backdrop-blur-md bg-slate-900/80 border-b border-slate-700/40 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Back
        </button>
        <h1 className="text-white font-semibold text-sm">Alerts</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </nav>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3 pb-12">
        {/* Loading */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-20 bg-slate-800 rounded-2xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && alerts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-white font-semibold mb-2">No alerts yet</h3>
            <p className="text-slate-400 text-sm">
              Diagnosis results and outbreak warnings will appear here.
            </p>
          </div>
        )}

        {/* Alert list */}
        {!loading && !error && alerts.length > 0 && (
          <>
            {unreadCount > 0 && (
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">
                {unreadCount} new alert{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
            {/* Sort unread first */}
            {[...alerts]
              .sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1))
              .map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkRead={handleMarkRead}
                  onNavigate={navigate}
                />
              ))}
          </>
        )}
      </main>
    </div>
  );
};

export default FarmerAlerts;
