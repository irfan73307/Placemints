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
import AdminRoute from './AdminRoute';

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
import AdminStudents from '../pages/AdminStudents';
import AdminSettings from '../pages/AdminSettings';
import AdminCompanyAdd from '../pages/AdminCompanyAdd';
import AdminCompanyList from '../pages/AdminCompanyList';
import AdminCompanyManage from '../pages/AdminCompanyManage';
import NotFound from '../pages/NotFound';
import RouteErrorBoundary from '../components/RouteErrorBoundary';

export const router = createBrowserRouter([
  // Public Marketing Landing Page
  {
    path: ROUTES.HOME,
    element: <Landing />,
    errorElement: <RouteErrorBoundary />,
  },

  // Auth Routes
  {
    element: <AuthLayout />,
    errorElement: <RouteErrorBoundary />,
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
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: ROUTES.PROFILE_SETUP,
        element: <ProfileSetup />,
      },
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
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
            errorElement: <RouteErrorBoundary />,
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
      // Dedicated RBAC Protected Admin Panel Routes
      {
        element: <AdminRoute />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            element: <AppLayout />,
            errorElement: <RouteErrorBoundary />,
            children: [
              {
                path: '/admin',
                element: <AdminCompanyList />,
              },
              {
                path: '/admin/companies',
                element: <AdminCompanyList />,
              },
              {
                path: '/admin/companies/:id',
                element: <AdminCompanyManage />,
              },
              {
                path: '/admin/companies/add',
                element: <AdminCompanyAdd />,
              },
              {
                path: '/admin/students',
                element: <AdminStudents />,
              },
              {
                path: '/admin/settings',
                element: <AdminSettings />,
              },
            ],
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
