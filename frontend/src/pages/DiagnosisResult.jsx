/**
 * DiagnosisResult.jsx – Dev 2
 *
 * Main farmer-facing result page.
 * Route: /results/:reportId
 *
 * Calls POST /api/reports/{reportId}/complete-analysis on mount.
 * Re-calls GET /api/reports/{reportId}/advice when language changes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdditionalPhotoRequest from "../components/AdditionalPhotoRequest";
import ConfidenceIndicator from "../components/ConfidenceIndicator";
import DiagnosisCard from "../components/DiagnosisCard";
import NearbyOutbreakAlert from "../components/NearbyOutbreakAlert";
import SeverityBadge from "../components/SeverityBadge";
import SpreadRiskBadge from "../components/SpreadRiskBadge";
import TreatmentSteps from "../components/TreatmentSteps";
import WeatherEvidence from "../components/WeatherEvidence";
import {
  UserCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Send,
  AlertCircle,
} from "lucide-react";
import {
  getAdviceInLanguage,
  triggerCompleteAnalysis,
  getWeatherRisk,
} from "../services/analysisService";
import { createTicket, getTickets } from "../services/officerApi";

// ── Language config ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "si", label: "සිංහල" },
  { code: "ta", label: "தமிழ்" },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-48 bg-slate-800 rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-slate-800 rounded-2xl" />
      <div className="h-32 bg-slate-800 rounded-2xl" />
    </div>
    <div className="h-40 bg-slate-800 rounded-2xl" />
    <div className="h-64 bg-slate-800 rounded-2xl" />
  </div>
);

// ── Decision-specific banners ─────────────────────────────────────────────────
const OfficerReviewBanner = () => (
  <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30">
    <span className="text-3xl flex-shrink-0">👨‍🌾</span>
    <div>
      <h3 className="text-blue-300 font-bold mb-1">Agriculture Officer Assigned</h3>
      <p className="text-blue-200/80 text-sm leading-relaxed">
        Your case has been forwarded to a local agriculture officer for expert review.
        You will receive a notification once they have assessed your crop.
      </p>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const DiagnosisResult = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [langLoading, setLangLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState(
    () => localStorage.getItem("preferred_language") || "en"
  );

  // ── Officer Ticket Request State ──
  const [ticketState, setTicketState] = useState({
    requested: false,
    ticketId: null,
    loading: false,
    error: null,
    successMsg: null,
  });
  const [officerNote, setOfficerNote] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Check if an officer ticket is already active for this report
  useEffect(() => {
    if (!reportId) return;
    const checkExistingTicket = async () => {
      try {
        const res = await getTickets({ limit: 100 });
        const list = res?.data || [];
        const found = list.find((t) => t.report_id === reportId);
        if (found) {
          setTicketState({
            requested: true,
            ticketId: found.id,
            loading: false,
            error: null,
            successMsg: null,
          });
        } else if (data?.decision === "OFFICER_REVIEW" || data?.decision === "OUTBREAK_WARNING") {
          setTicketState((prev) => ({ ...prev, requested: true }));
        }
      } catch {
        if (data?.decision === "OFFICER_REVIEW" || data?.decision === "OUTBREAK_WARNING") {
          setTicketState((prev) => ({ ...prev, requested: true }));
        }
      }
    };
    checkExistingTicket();
  }, [reportId, data?.decision]);

  // Request Officer Ticket Action
  const handleRequestOfficerTicket = async () => {
    if (!reportId || ticketState.loading || ticketState.requested) return;
    setTicketState((prev) => ({ ...prev, loading: true, error: null, successMsg: null }));
    try {
      const priority =
        data?.severity === "HIGH" || data?.severity === "CRITICAL" ? "HIGH" : "MEDIUM";
      const cropName = data?.crop || data?.diagnosis?.crop || "crop";
      const diseaseName = data?.diagnosis?.disease || "diagnosed pathogen";

      const defaultReason = `Farmer requested in-person agriculture officer consultation for ${cropName} (${diseaseName}).`;
      const finalReason = officerNote.trim()
        ? `${defaultReason} Farmer Note: "${officerNote.trim()}"`
        : defaultReason;

      const res = await createTicket({
        report_id: reportId,
        reason: finalReason,
        priority: priority,
      });

      const ticketId = res?.data?.id || res?.id;
      setTicketState({
        requested: true,
        ticketId: ticketId,
        loading: false,
        error: null,
        successMsg: "Officer review ticket created! A local extension officer has been notified.",
      });
      setShowNoteInput(false);
    } catch (err) {
      console.error("Failed to request officer review:", err);
      setTicketState((prev) => ({
        ...prev,
        loading: false,
        error: err?.message || "Failed to create officer ticket. Please try again.",
      }));
    }
  };

  // ── Fetch full analysis ─────────────────────────────────────────────────────
  const fetchAnalysis = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError(null);
    try {
      const activeStored = localStorage.getItem("preferred_language");
      const targetLang = activeStored || language || null;
      const result = await triggerCompleteAnalysis(reportId, targetLang);

      // Fallback: If weather details are missing, fetch directly from weather API
      if (!result.weather || result.weather.temperature === undefined || result.weather.temperature === null) {
        try {
          const wRisk = await getWeatherRisk(reportId);
          if (wRisk) {
            result.weather = {
              ...result.weather,
              temperature: wRisk.temperature,
              humidity: wRisk.humidity,
              rainfall: wRisk.rainfall,
              risk: wRisk.weather_risk || wRisk.risk || "LOW",
              weather_risk: wRisk.weather_risk || wRisk.risk || "LOW",
              supports_prediction: wRisk.supports_prediction,
            };
          }
        } catch (wErr) {
          console.warn("Weather fallback fetch error:", wErr);
        }
      }

      setData(result);

      // Sync active UI language with the report's preferred language
      const resolvedLang = result.preferred_language || result.farmer_advice?.language;
      if (resolvedLang && resolvedLang !== language) {
        setLanguage(resolvedLang);
        localStorage.setItem("preferred_language", resolvedLang);
      }
      setAdvice(result.farmer_advice);
    } catch (err) {
      setError(err.message || "Failed to load diagnosis. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [reportId, language]);

  useEffect(() => {
    fetchAnalysis();
  }, [reportId]); // only on mount / reportId change

  // ── Language switch ─────────────────────────────────────────────────────────
  const handleLanguageChange = async (lang) => {
    if (lang === language) return;
    setLanguage(lang);
    localStorage.setItem("preferred_language", lang);

    if (!data) return;
    setLangLoading(true);
    try {
      const newAdvice = await getAdviceInLanguage(reportId, lang);
      setAdvice(newAdvice);
    } catch {
      // Silently fall back to existing advice
    } finally {
      setLangLoading(false);
    }
  };

  // ── Additional photo success ────────────────────────────────────────────────
  const handlePhotoSuccess = (updatedResult) => {
    const result = updatedResult?.data || updatedResult;
    setData(result);
    setAdvice(result?.farmer_advice);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#05130b] py-6 px-4 sm:px-6 animate-fade-in">

      {/* ── AI Crop Scan Hero Banner ── */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 shadow-2xl mb-4">
          <img
            src="/images/crop_scan.jpg"
            alt="AI crop pathology scanning — leaf disease detection"
            className="w-full object-cover"
            style={{ height: '130px', objectPosition: 'center 25%', opacity: 0.45, filter: 'saturate(1.2)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#05130b]/98 via-[#05130b]/70 to-transparent" />
          <div className="absolute inset-0 flex items-center px-5 justify-between">
            <div>
              <button
                onClick={() => navigate('/farmer')}
                className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-semibold mb-1"
              >
                <span>←</span> Back to Overview
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-white">Crop Diagnosis & Advisory</h1>
              <p className="text-xs text-slate-300 mt-0.5">AI-powered pathogen analysis · Field evidence review</p>
            </div>

            {/* Language selector pills */}
            <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm p-1 rounded-xl border border-white/10 flex-shrink-0">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code)}
                  disabled={langLoading}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    language === l.code
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-12">
        {/* Error state */}
        {error && (
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-5 text-center">
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <button
              onClick={fetchAnalysis}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 text-sm transition-all"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && !error && <LoadingSkeleton />}

        {/* Results */}
        {!loading && !error && data && (
          <>
            {/* 1. Diagnosis card */}
            <DiagnosisCard
              disease={data.diagnosis?.disease}
              confidence={data.diagnosis?.confidence}
              decision={data.decision}
              reasons={data.reasons}
            />

            {/* 2. Badges row */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <SeverityBadge severity={data.severity} />
              </div>
              <SpreadRiskBadge spreadRisk={data.spread_risk} />

              {/* Top Quick Officer Request Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-950/50 border border-blue-500/30 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {ticketState.requested ? "Officer Review Dispatched" : "Need An Agriculture Officer?"}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      {ticketState.requested
                        ? "Extension officer has been notified for your farm."
                        : "Request in-person inspection or sample testing."}
                    </p>
                  </div>
                </div>

                {ticketState.requested ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ticket Active</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestOfficerTicket}
                    disabled={ticketState.loading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    {ticketState.loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending…</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                        <span>Request Officer</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 3. Confidence gauge */}
            <div className="flex justify-center">
              <ConfidenceIndicator confidence={data.diagnosis?.confidence} />
            </div>

            {/* 4. Outbreak alert (only when risk > LOW) */}
            <NearbyOutbreakAlert outbreak={data.outbreak} />

            {/* 5. Weather evidence */}
            <WeatherEvidence
              weather={data.weather}
              supportsDisease={data.weather?.supports_prediction}
            />

            {/* 6. Decision-specific content */}
            {data.decision === "OFFICER_REVIEW" && <OfficerReviewBanner />}

            {data.needs_additional_photo && (
              <AdditionalPhotoRequest
                reportId={reportId}
                onSuccess={handlePhotoSuccess}
                onError={(msg) => setError(msg)}
              />
            )}

            {/* 7. Treatment steps (always displayed when advice is available) */}
            {advice && (
              <TreatmentSteps advice={advice} isLoading={langLoading} />
            )}

            {/* 8. Officer Review Request Action Card */}
            <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-blue-950/30 border border-blue-500/25 shadow-xl transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Request Agriculture Officer Review</span>
                      {ticketState.requested && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Active Ticket
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                      {ticketState.requested
                        ? "An Officer Ticket is active for this scan. The regional extension officer will review your case, schedule an inspection, or send samples for lab PCR verification."
                        : "Need an in-person farm inspection, chemical guidance, or official disease certification? Request an agriculture officer ticket directly."}
                    </p>
                    {ticketState.error && (
                      <p className="text-xs text-red-400 mt-2 font-medium">{ticketState.error}</p>
                    )}
                    {ticketState.successMsg && (
                      <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{ticketState.successMsg}</span>
                      </p>
                    )}
                  </div>
                </div>

                {ticketState.requested ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold whitespace-nowrap shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Officer Ticket Active</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {!showNoteInput && (
                      <button
                        type="button"
                        onClick={() => setShowNoteInput(true)}
                        className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                      >
                        + Add Note
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRequestOfficerTicket}
                      disabled={ticketState.loading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                    >
                      {ticketState.loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Creating Ticket…</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-blue-200" />
                          <span>Request Officer Ticket</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Optional note input */}
              {showNoteInput && !ticketState.requested && (
                <div className="mt-3 pt-3 border-t border-white/10 animate-fade-in">
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Note for the Agriculture Officer (optional):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={officerNote}
                      onChange={(e) => setOfficerNote(e.target.value)}
                      placeholder="e.g. Field located near irrigation canal, rapid leaf curling noticed yesterday..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleRequestOfficerTicket}
                      disabled={ticketState.loading}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Submit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 9. Language switcher reminder */}
            {data.farmer_advice && (
              <p className="text-center text-slate-500 text-xs">
                Treatment advice available in{" "}
                {LANGUAGES.map((l) => l.label).join(", ")}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DiagnosisResult;
