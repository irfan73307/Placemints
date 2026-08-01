/**
 * User Service Layer
 * 
 * Interacts with user profile, saved companies, and profile onboarding setup backend endpoints.
 */

import apiClient from './api';
import { mockUser, mockCompanies } from '../constants/mockData';

export async function getUserProfile() {
  try {
    const res = await apiClient.get('/auth/me');
    return res.data;
  } catch (err) {
    return { user: mockUser };
  }
}

export async function getSavedCompanies() {
  const res = await apiClient.get('/users/me/saved');
  return res.data;
}

export async function toggleSaveCompany(companyId) {
  const res = await apiClient.post(`/users/me/saved/${companyId}`);
  return res.data;
}

export async function updateProfile(updatedData) {
  const res = await apiClient.patch('/users/me', updatedData);
  return res.data;
}
