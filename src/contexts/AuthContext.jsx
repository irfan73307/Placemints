/**
 * AuthContext Component
 * 
 * Provides global user authentication state `{ user, isAuthenticated, isInitializing, login, logout, updateUserData, setUserData }`.
 * Manages JWT tokens, page refresh session restoration, and profile completion tracking.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as authLogout } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      // Check if URL query contains token from Google OAuth redirect
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('placemints_auth_token', urlToken);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }

      try {
        // Fetch verified user from database via HTTP-only cookie or Bearer token
        const res = await getCurrentUser();
        if (isMounted && res && res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
        } else if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initializeSession();

    // Multi-tab logout synchronization listener
    const handleStorageChange = (e) => {
      if (e.key === 'placemints_auth_sync' && e.newValue === 'logout') {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const defaultApi = `http://${hostname}:5000/api`;
    const apiBase = import.meta.env.VITE_API_BASE_URL || defaultApi;
    const serverUrl = apiBase.replace(/\/api\/?$/, '');
    window.location.href = `${serverUrl}/auth/google`;
  };

  const logout = async () => {
    try {
      await authLogout();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('placemints_auth_token');
    localStorage.setItem('placemints_auth_sync', 'logout');
    setTimeout(() => localStorage.removeItem('placemints_auth_sync'), 100);
    setUser(null);
    setIsAuthenticated(false);
  };

  const setUserData = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        login,
        logout,
        setUserData,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
