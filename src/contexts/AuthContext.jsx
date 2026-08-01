/**
 * AuthContext Component
 * 
 * Provides global user authentication state `{ user, isAuthenticated, isInitializing, login, logout, updateUserData, setUserData }`.
 * Manages JWT tokens, page refresh session restoration, and profile completion tracking.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';

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

      const token = localStorage.getItem('placemints_auth_token');
      if (token) {
        try {
          const res = await getCurrentUser();
          if (isMounted && res && res.user) {
            setUser(res.user);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.warn('Session restoration failed:', err.message);
          localStorage.removeItem('placemints_auth_token');
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }

      if (isMounted) {
        setIsInitializing(false);
      }
    }

    initializeSession();
    return () => { isMounted = false; };
  }, []);

  const login = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  const logout = () => {
    localStorage.removeItem('placemints_auth_token');
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
