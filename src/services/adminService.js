/**
 * adminService.js
 *
 * API service functions for admin-only operations.
 * Uses the shared apiClient (auto-attaches Bearer token from localStorage).
 */

import apiClient from './api';

/**
 * GET /api/admin/companies
 * Fetch list of companies with question counts, verification status, and metrics for admin management.
 */
export async function getAdminCompanies(params = {}) {
  const response = await apiClient.get('/admin/companies', { params });
  return response.data;
}

/**
 * GET /api/admin/companies/:id
 * Fetch complete single company profile with questions, rounds, and source metadata.
 */
export async function getAdminCompanyDetails(id) {
  const response = await apiClient.get(`/admin/companies/${id}`);
  return response.data;
}

/**
 * POST /api/admin/companies
 * Create a new company record.
 */
export async function createAdminCompany(payload) {
  const response = await apiClient.post('/admin/companies', payload);
  return response.data;
}

/**
 * GET /api/admin/companies/check-exists
 * Check if a company with the specified name or domain already exists in the database.
 */
export async function checkCompanyExists(name, domain) {
  const response = await apiClient.get('/admin/companies/check-exists', { params: { name, domain } });
  return response.data;
}

/**
 * PUT /api/admin/companies/:id
 * Update company metadata, placement criteria, rounds, or questions.
 */
export async function updateAdminCompany(id, payload) {
  const response = await apiClient.put(`/admin/companies/${id}`, payload);
  return response.data;
}

/**
 * DELETE /api/admin/companies/:id
 * Permanently delete a company and all cascading placement records.
 */
export async function deleteAdminCompany(id) {
  const response = await apiClient.delete(`/admin/companies/${id}`);
  return response.data;
}

/**
 * POST /api/admin/companies/:id/verify-website
 * Ping and verify company official website URL reachability.
 */
export async function verifyCompanyWebsite(id, website) {
  const response = await apiClient.post(`/admin/companies/${id}/verify-website`, { website });
  return response.data;
}

/**
 * POST /api/admin/companies/:id/preview-official-refresh
 * Verify website and fetch side-by-side comparison between current DB and new official source.
 */
export async function previewOfficialRefresh(id, website) {
  const response = await apiClient.post(`/admin/companies/${id}/preview-official-refresh`, { website });
  return response.data;
}

/**
 * POST /api/admin/companies/:id/apply-official-refresh
 * Apply verified official company metadata while preserving 100% of placement data intact.
 */
export async function applyOfficialRefresh(id, payload = {}) {
  const response = await apiClient.post(`/admin/companies/${id}/apply-official-refresh`, payload);
  return response.data;
}

/**
 * POST /api/admin/companies/:id/scrape-official
 * Trigger official website scraping from verified domain.
 */
export async function scrapeCompanyOfficialInfo(id, website) {
  const response = await apiClient.post(`/admin/companies/${id}/scrape-official`, { website });
  return response.data;
}

/**
 * POST /api/admin/companies/verify-url
 * Standalone canonical domain checker for creation forms.
 */
export async function verifyUrlStandalone(url, name) {
  const response = await apiClient.post('/admin/companies/verify-url', { url, name });
  return response.data;
}

/**
 * DELETE /api/admin/companies/questions/:questionId
 * Remove a specific question from a company.
 */
export async function deleteCompanyQuestion(questionId) {
  const response = await apiClient.delete(`/admin/companies/questions/${questionId}`);
  return response.data;
}

/**
 * POST /api/admin/companies/bulk-questions
 * Resolves or creates a company by name, then batch-inserts questions.
 */
export async function bulkAddQuestions(payload) {
  const response = await apiClient.post('/admin/companies/bulk-questions', payload);
  return response.data;
}

/**
 * GET /api/companies?search=<query>
 * Lightweight company existence check for debounced lookup.
 */
export async function searchCompanies(query) {
  const response = await apiClient.get('/companies', { params: { search: query } });
  return response.data;
}

