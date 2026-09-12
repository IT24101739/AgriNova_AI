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
  getAdviceInLanguage,
  triggerCompleteAnalysis,
  getWeatherRisk,
} from "../services/analysisService";

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

            {/* 7. Treatment steps (shown for AUTO_ADVICE and OUTBREAK_WARNING) */}
            {(data.decision === "AUTO_ADVICE" || data.decision === "OUTBREAK_WARNING") && (
              <TreatmentSteps advice={advice} isLoading={langLoading} />
            )}

            {/* 8. Language switcher reminder */}
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
