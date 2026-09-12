/**
 * analysisService.js – Dev 2
 *
 * All API calls for the diagnosis / weather / outbreak / treatment slice.
 * Uses axios with a shared base URL from the Vite env.
 *
 * Never calls an AI model directly — all requests go through FastAPI.
 */

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ── Attach Supabase auth token if present ─────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb-access-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Unwrap the standard { success, data, message } envelope. */
const unwrap = (response) => {
  const { success, data, message } = response.data;
  if (!success) throw new Error(message || "Request failed.");
  return data;
};

// ── Analysis ──────────────────────────────────────────────────────────────────

/**
 * Run (or return cached) complete analysis for a report.
 *
 * @param {string} reportId
 * @param {string} language  – "en" | "si" | "ta"
 * @returns {Promise<object>} Full analysis response object
 */
export const triggerCompleteAnalysis = async (reportId, language = null) => {
  const payload = {};
  if (language) {
    payload.preferred_language = language;
  }
  const response = await api.post(`/api/reports/${reportId}/complete-analysis`, payload);
  return unwrap(response);
};

/**
 * Re-generate farmer advice in a different language without re-running the
 * full analysis pipeline.
 *
 * @param {string} reportId
 * @param {string} language  – "en" | "si" | "ta"
 * @returns {Promise<object>} FarmerAdvice object
 */
export const getAdviceInLanguage = async (reportId, language = "en") => {
  const response = await api.get(`/api/reports/${reportId}/advice`, {
    params: { language },
  });
  return unwrap(response);
};

// ── Weather ───────────────────────────────────────────────────────────────────

/**
 * Fetch weather risk for a report (resolved via report_id → farm coords).
 *
 * @param {string} reportId
 * @returns {Promise<object>} Weather risk object
 */
export const getWeatherRisk = async (reportId) => {
  const response = await api.get("/api/weather/risk", {
    params: { report_id: reportId },
  });
  return unwrap(response);
};

/**
 * Fetch weather risk directly by coordinates.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {string} disease  – optional disease name for tailored risk rules
 * @returns {Promise<object>}
 */
export const getWeatherRiskByCoords = async (lat, lon, disease = "") => {
  const response = await api.get("/api/weather/risk", {
    params: { lat, lon, disease },
  });
  return unwrap(response);
};

// ── Additional image ──────────────────────────────────────────────────────────

/**
 * Submit an additional photo for a NEED_MORE_INFO report.
 * Re-runs the full analysis pipeline after classification.
 *
 * @param {string}   reportId
 * @param {File}     imageFile  – browser File object
 * @param {Function} onProgress – optional upload progress callback (0-100)
 * @returns {Promise<object>}   Updated complete analysis result
 */
export const submitAdditionalImage = async (reportId, imageFile, onProgress) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.post(
    `/api/reports/${reportId}/additional-image`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    }
  );
  return unwrap(response);
};

// ── Farmer alerts / notifications ─────────────────────────────────────────────

/**
 * Fetch unread notifications for the current farmer.
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getFarmerAlerts = async (userId) => {
  const response = await api.get("/api/notifications", {
    params: { user_id: userId },
  });
  return unwrap(response);
};

/**
 * Mark a notification as read.
 *
 * @param {string} notificationId
 */
export const markAlertRead = async (notificationId) => {
  const response = await api.patch(`/api/notifications/${notificationId}/read`);
  return unwrap(response);
};
