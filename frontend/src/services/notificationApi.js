import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const api = axios.create({ baseURL: API_BASE_URL });

export const getNotifications = (userId, params = {}) =>
  api.get(`/api/users/${userId}/notifications`, { params }).then(r => r.data);

export const getUnreadCount = (userId) =>
  api.get(`/api/users/${userId}/notifications/unread-count`).then(r => r.data);

export const markRead = (notificationId) =>
  api.patch(`/api/notifications/${notificationId}/read`).then(r => r.data);

export const getAIFeedback = (params = {}) =>
  api.get('/api/admin/ai-feedback', { params }).then(r => r.data);

export const getAIFeedbackSummary = () =>
  api.get('/api/admin/ai-feedback/summary').then(r => r.data);
