/**
 * ProtectedRoute Component
 * 
 * Purpose:
 * Route guard enforcing authentication, session initialization, and profile completion.
 * 
 * Rules:
 * 1. While isInitializing is true -> render SplashScreen (prevents UI flickering on refresh).
 * 2. If not authenticated -> redirect to /login.
 * 3. If authenticated but profileCompleted is false -> redirect to /profile/setup.
 * 4. If authenticated and profileCompleted is true -> render protected outlet.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SplashScreen } from '../components/SplashScreen';
import { ROUTES } from '../constants/routes';

export function ProtectedRoute() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // 1. Session Restoration / Loading Splash Screen
  if (isInitializing) {
    return <SplashScreen />;
  }

  // 2. Authentication Check
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Profile Completion Guard
  const isSetupRoute = location.pathname === ROUTES.PROFILE_SETUP;
  const isProfileCompleted = user?.profileCompleted ?? false;

  if (!isProfileCompleted && !isSetupRoute) {
    return <Navigate to={ROUTES.PROFILE_SETUP} replace />;
  }

  if (isProfileCompleted && isSetupRoute) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
