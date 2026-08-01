/**
 * Company Service Layer
 * 
 * Interacts with backend endpoints for listing companies, details, and PYQ liking.
 */

import apiClient from './api';
import { mockCompanies } from '../constants/mockData';

export async function getCompanies(searchQuery = '', filterTag = '') {
  try {
    const res = await apiClient.get('/companies', {
      params: { search: searchQuery, tag: filterTag },
    });
    return res.data;
  } catch (err) {
    console.warn('Backend offline, using fallback mock companies data');
    let results = [...mockCompanies];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filterTag) {
      results = results.filter((c) => c.tags.includes(filterTag));
    }

    return { data: results, total: results.length };
  }
}

export async function getCompanyById(id) {
  try {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  } catch (err) {
    console.warn(`Backend offline, using fallback mock data for company ID: ${id}`);
    const company = mockCompanies.find((c) => c.id === id || c.slug === id);
    if (!company) {
      return Promise.reject(new Error(`Company with ID "${id}" not found`));
    }
    return { company };
  }
}

export async function toggleQuestionLike(questionId) {
  try {
    const res = await apiClient.post(`/questions/${questionId}/like`);
    return res.data;
  } catch (err) {
    console.warn('Backend error on toggle like:', err.message);
    return { liked: true, likeCount: 1 };
  }
}
