/**
 * API service layer — all FastAPI calls live here.
 * React components NEVER call the AI directly.
 * Axios instance proxied through Vite to http://localhost:8000
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 60s — AI inference can be slow
});

// Response interceptor — normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
    return Promise.reject(new Error(detail));
  }
);


// ------------------------------------------------------------------
// Reports
// ------------------------------------------------------------------

/**
 * Submit a new crop disease report.
 * @param {FormData} formData  - Multipart form with image + fields
 * @returns {Promise<{id, status, image_analysis, ...}>}
 */
export async function createReport(formData) {
  const res = await api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

/**
 * Get a single report by ID (polls for status).
 * @param {string} reportId
 * @returns {Promise<{id, status, image_analysis, ...}>}
 */
export async function getReport(reportId) {
  const res = await api.get(`/reports/${reportId}`);
  return res.data;
}

/**
 * List all reports for a farm.
 * @param {string} farmId
 * @returns {Promise<{reports: [], count: number}>}
 */
export async function getFarmReports(farmId) {
  const res = await api.get(`/farms/${farmId}/reports`);
  return res.data;
}

export default api;
