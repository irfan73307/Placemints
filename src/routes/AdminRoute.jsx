import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SplashScreen } from '../components/SplashScreen';
import { ROUTES } from '../constants/routes';

export function AdminRoute() {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  if (!isAdmin) {
    // HTTP 403 Forbidden Protection: Redirect normal students to Dashboard
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
