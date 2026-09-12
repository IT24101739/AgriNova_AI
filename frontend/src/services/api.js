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

// Request interceptor — attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sb-access-token') || localStorage.getItem('agrinova_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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
// Authentication
// ------------------------------------------------------------------

/**
 * Register a new user in Supabase Auth & AgriNova Database.
 * @param {Object} userData - { name, email, password, role, district, phone, badge, preferred_language }
 */
export async function signupUser(userData) {
  const res = await api.post('/auth/signup', userData);
  return res.data;
}

/**
 * Sign in user.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
}

/**
 * Fetch current authenticated user.
 */
export async function getCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data;
}


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

/**
 * List crop diagnosis reports directly from Supabase database.
 * @param {Object} [params] - Optional filters: { farmer_id, farm_id, limit }
 * @returns {Promise<{success: boolean, data: {reports: [], count: number}}>}
 */
export async function getReports(params = {}) {
  const res = await api.get('/reports', { params });
  return res.data;
}

/**
 * Delete a single crop report by ID.
 * @param {string} reportId
 */
export async function deleteReport(reportId) {
  const res = await api.delete(`/reports/${reportId}`);
  return res.data;
}

/**
 * Delete multiple selected crop reports.
 * @param {string[]} reportIds
 */
export async function deleteReports(reportIds) {
  const res = await api.delete('/reports', { data: { report_ids: reportIds } });
  return res.data;
}

export default api;
