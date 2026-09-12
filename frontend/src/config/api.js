/**
 * Centralized API Base URL Configuration.
 * 
 * Supports both VITE_API_URL and VITE_API_BASE_URL.
 * Strips any trailing slashes to prevent double-slash path errors.
 * Defaults to http://localhost:8000 for local development.
 */
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/+$/, '');

export const API_BASE = API_BASE_URL;
export default API_BASE_URL;
