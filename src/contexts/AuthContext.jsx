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

  // Core session verification helper
  const verifySession = async () => {
    try {
      const res = await getCurrentUser();
      if (res && res.user) {
        setUser(res.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  };

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

    // Multi-tab sync listener
    const handleStorageChange = (e) => {
      if (e.key === 'placemints_auth_sync' && e.newValue) {
        try {
          const syncData = JSON.parse(e.newValue);
          if (syncData.action === 'account_revoked' || syncData.action === 'logout') {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch {
          if (e.newValue === 'logout') {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }
    };

    // Current-tab account revocation custom event
    const handleAccountRevoked = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('placemints:account_revoked', handleAccountRevoked);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('placemints:account_revoked', handleAccountRevoked);
    };
  }, []);

  // Periodic heartbeat & tab focus revalidation
  useEffect(() => {
    if (!isAuthenticated || isInitializing) return;

    let isSubscribed = true;

    const performCheck = async () => {
      if (document.hidden) return;
      try {
        const res = await getCurrentUser();
        if (!res || !res.user) {
          if (isSubscribed) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        if (isSubscribed) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    // 1. Check on tab visibility change (e.g. switching back from Admin tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        performCheck();
      }
    };

    const handleFocus = () => {
      performCheck();
    };

    // 2. Heartbeat interval every 25 seconds while active
    const heartbeatInterval = setInterval(performCheck, 25000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isSubscribed = false;
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, isInitializing]);

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
    try {
      localStorage.setItem('placemints_auth_sync', JSON.stringify({ action: 'logout', timestamp: Date.now() }));
      setTimeout(() => localStorage.removeItem('placemints_auth_sync'), 200);
    } catch (e) {}
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
        verifySession,
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
