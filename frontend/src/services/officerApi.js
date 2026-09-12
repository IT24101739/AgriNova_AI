// API base URL — edit in .env as VITE_API_URL
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

import axios from 'axios';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Tickets ──────────────────────────────────────────────────────────────────

export const getTickets = (params = {}) =>
  api.get('/api/officer/tickets', { params }).then(r => r.data);

export const getTicket = (id) =>
  api.get(`/api/officer/tickets/${id}`).then(r => r.data);

export const createTicket = (body) =>
  api.post('/api/officer/tickets', body).then(r => r.data);

export const patchTicket = (id, body) =>
  api.patch(`/api/officer/tickets/${id}`, body).then(r => r.data);

export const recordFieldVisit = (ticketId, body) =>
  api.post(`/api/officer/tickets/${ticketId}/field-visit`, body).then(r => r.data);

export const sendToLab = (ticketId, body) =>
  api.post(`/api/officer/tickets/${ticketId}/send-to-lab`, body).then(r => r.data);

export const confirmDiagnosis = (ticketId, body) =>
  api.post(`/api/officer/tickets/${ticketId}/confirm-diagnosis`, body).then(r => r.data);

// ── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboardStats = () =>
  api.get('/api/officer/dashboard/stats').then(r => r.data);

// ── Map ──────────────────────────────────────────────────────────────────────

export const getMapReports = (params = {}) =>
  api.get('/api/officer/map/reports', { params }).then(r => r.data);

export const getMapOutbreaks = () =>
  api.get('/api/officer/map/outbreaks').then(r => r.data);

// ── Outbreaks ────────────────────────────────────────────────────────────────

export const getOutbreakCandidates = () =>
  api.get('/api/officer/outbreaks/candidates').then(r => r.data);

export const getConfirmedOutbreaks = () =>
  api.get('/api/officer/outbreaks/confirmed').then(r => r.data);

export const confirmOutbreak = (id, body) =>
  api.post(`/api/officer/outbreaks/${id}/confirm`, body).then(r => r.data);

export const rejectOutbreak = (id, body) =>
  api.post(`/api/officer/outbreaks/${id}/reject`, body).then(r => r.data);

export const recordLabResult = (labId, body) =>
  api.patch(`/api/lab-requests/${labId}/result`, body).then(r => r.data);
