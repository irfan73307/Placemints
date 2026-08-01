/**
 * Axios API Instance Configuration
 * 
 * Centralized HTTP client configured with base URL, default headers, and interceptors for authorization tokens.
 */

import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Request Interceptor (attaches JWT Bearer token if available)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('placemints_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
