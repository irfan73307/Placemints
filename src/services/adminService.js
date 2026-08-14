/**
 * adminService.js
 *
 * API service functions for admin-only operations.
 * Uses the shared apiClient (auto-attaches Bearer token from localStorage).
 */

import apiClient from './api';

/**
 * POST /api/admin/companies/bulk-questions
 * Resolves or creates a company by name, then batch-inserts questions.
 *
 * @param {Object} payload
 * @param {string}  payload.companyName   - Required
 * @param {string}  [payload.description]
 * @param {string}  [payload.tags]        - Comma-separated
 * @param {string}  [payload.tier]
 * @param {string}  [payload.ctc]
 * @param {string}  [payload.website]
 * @param {string}  [payload.sector]
 * @param {Array}   payload.questions     - Required; [{questionText, topicTags, difficulty, year, roundTitle?}]
 * @returns {Promise<{success, isNew, company, questionsInserted, message}>}
 */
export async function bulkAddQuestions(payload) {
  const response = await apiClient.post('/admin/companies/bulk-questions', payload);
  return response.data;
}

/**
 * GET /api/companies?search=<query>
 * Lightweight company existence check for debounced lookup.
 * Returns { data: Company[] }
 */
export async function searchCompanies(query) {
  const response = await apiClient.get('/companies', { params: { search: query } });
  return response.data;
}
