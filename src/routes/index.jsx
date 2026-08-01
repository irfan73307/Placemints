/**
 * Application Router Configuration
 * 
 * Purpose:
 * Binds all application routes to route path constants from constants/routes.js.
 * Configures public routes, auth routes, setup wizard, and protected app layout routes.
 */

import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

// Layouts
import AppLayout from '../layouts/AppLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ProfileSetup from '../pages/ProfileSetup';
import Dashboard from '../pages/Dashboard';
import Companies from '../pages/Companies';
import CompanyDetails from '../pages/CompanyDetails';
import Library from '../pages/Library';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

export const router = createBrowserRouter([
  // Public Marketing Landing Page
  {
    path: ROUTES.HOME,
    element: <Landing />,
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <Login />,
      },
      {
        path: ROUTES.REGISTER,
        element: <Register />,
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: <ForgotPassword />,
      },
    ],
  },

  // Onboarding & Protected App Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: ROUTES.PROFILE_SETUP,
        element: <ProfileSetup />,
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: <Dashboard />,
          },
          {
            path: ROUTES.COMPANIES,
            element: <Companies />,
          },
          {
            path: ROUTES.COMPANY_DETAILS,
            element: <CompanyDetails />,
          },
          {
            path: ROUTES.LIBRARY,
            element: <Library />,
          },
          {
            path: ROUTES.PROFILE,
            element: <Profile />,
          },
          {
            path: ROUTES.SETTINGS,
            element: <Settings />,
          },
        ],
      },
    ],
  },

  // 404 Catch-All
  {
    path: ROUTES.NOT_FOUND,
    element: <NotFound />,
  },
]);

export default router;
