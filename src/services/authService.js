/**
 * Auth Service Layer
 * 
 * Provides API integrations for Google OAuth, Email/Password Login, Registration, and Password Reset.
 */

import apiClient from './api';

export async function loginWithGoogle() {
  window.location.href = 'http://localhost:5000/auth/google';
}

export async function registerUser({ fullName, email, password, confirmPassword }) {
  const res = await apiClient.post('/auth/register', {
    fullName,
    email,
    password,
    confirmPassword,
  });
  if (res.data && res.data.accessToken) {
    localStorage.setItem('placemints_auth_token', res.data.accessToken);
  }
  return res.data;
}

export async function loginWithEmail(email, password) {
  const res = await apiClient.post('/auth/login', { email, password });
  if (res.data && res.data.accessToken) {
    localStorage.setItem('placemints_auth_token', res.data.accessToken);
  }
  return res.data;
}

export async function forgotPassword(email) {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
}

export async function logout() {
  try {
    await apiClient.post('/auth/logout');
  } catch (e) {
    // Ignore error
  }
  localStorage.removeItem('placemints_auth_token');
  return { success: true };
}

export async function getCurrentUser() {
  const res = await apiClient.get('/auth/me');
  return res.data;
}
