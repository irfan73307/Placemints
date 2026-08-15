/**
 * Global Route Constants for Placemints
 * 
 * Why this file exists:
 * Centralizing route path strings prevents magic string typos and makes path updating safe across the app.
 */

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  PROFILE_SETUP: '/profile/setup',
  DASHBOARD: '/dashboard',
  COMPANIES: '/companies',
  COMPANY_DETAILS: '/companies/:id',
  LIBRARY: '/library',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  // Admin-specific routes
  ADMIN: '/admin',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_COMPANY_MANAGE: '/admin/companies/:id',
  ADMIN_COMPANY_ADD: '/admin/companies/add',
  NOT_FOUND: '*',
};

/**
 * Helper functions to generate dynamic paths safely
 */
export const getCompanyDetailsPath = (id) => `/companies/${id}`;
export const getAdminCompanyManagePath = (id) => `/admin/companies/${id}`;
