/**
 * Library Service Layer
 * 
 * Interacts with backend API for library resources.
 */

import apiClient from './api';

export async function getLibraryResources(category = '', search = '') {
  try {
    const res = await apiClient.get('/library', {
      params: { category, search },
    });
    return res.data;
  } catch (err) {
    console.warn('Backend offline, returning default mock library resources');
    return {
      data: [
        {
          id: 'res_1',
          title: 'SASTRA Placement Statistics 2023-2024 Batch',
          category: 'Placement Stats',
          type: 'PDF Document',
          format: 'PDF',
          size: '2.4 MB',
          url: 'https://sastra.edu',
          downloads: 1420,
          company: 'SASTRA Placement Cell',
        },
        {
          id: 'res_2',
          title: 'Top 100 System Design & LLD Questions for Zoho & Amazon',
          category: 'System Design',
          type: 'Cheatsheet',
          format: 'PDF',
          size: '5.1 MB',
          url: 'https://geeksforgeeks.org',
          downloads: 980,
          company: 'Zoho / Amazon',
        },
        {
          id: 'res_3',
          title: 'TCS NQT Advanced Quantitative Aptitude Formula Booklet',
          category: 'Aptitude Guide',
          type: 'Formula Sheet',
          format: 'PDF',
          size: '1.8 MB',
          url: 'https://leetcode.com',
          downloads: 2150,
          company: 'TCS Digital',
        },
      ],
    };
  }
}
