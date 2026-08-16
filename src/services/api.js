/**
 * Axios API Instance Configuration
 * 
 * Centralized HTTP client configured with base URL, credentials for HTTP-only cookies,
 * and interceptors for automatic session refresh and token propagation.
 */

import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${hostname}:5000/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for HTTP-only cookie session handling
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor (attaches JWT Bearer token if present in memory/storage)
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

// Response Interceptor (Handles 401 Token Expiration with Automatic Refresh & Account Revocation)
let isRefreshing = false;
let failedQueue = [];

export function handleRevocation(message) {
  const revocationMessage =
    message ||
    'Your account is no longer available. Please contact the administrator if you believe this was a mistake.';
  localStorage.removeItem('placemints_auth_token');
  sessionStorage.setItem('placemints_revoked_notice', revocationMessage);

  // Broadcast to other tabs
  try {
    localStorage.setItem(
      'placemints_auth_sync',
      JSON.stringify({
        action: 'account_revoked',
        message: revocationMessage,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    // Ignore storage quota errors
  }

  // Dispatch event for in-memory context in current tab
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('placemints:account_revoked', {
        detail: { message: revocationMessage },
      })
    );
  }
}

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    const responseCode = error.response?.data?.code;
    const responseStatus = error.response?.status;
    const responseMessage = error.response?.data?.message;

    // 1. Direct account deletion / revocation detection
    if (responseCode === 'ACCOUNT_REVOKED') {
      handleRevocation(responseMessage);
      return Promise.reject(error);
    }

    // Avoid infinite loop on auth endpoints
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/logout');

    if (responseStatus === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('placemints_auth_token', newAccessToken);
          apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return apiClient(originalRequest);
        } else {
          processQueue(new Error('No token returned from refresh'));
          handleRevocation(responseMessage);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        const refreshCode = refreshErr.response?.data?.code;
        const refreshMsg = refreshErr.response?.data?.message;
        if (refreshCode === 'ACCOUNT_REVOKED' || refreshErr.response?.status === 401) {
          handleRevocation(refreshMsg);
        } else {
          localStorage.removeItem('placemints_auth_token');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
