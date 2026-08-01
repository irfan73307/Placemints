/**
 * LibraryContext Component
 * 
 * Provides global user saved companies state `{ savedCompanies, toggleSaveCompany, isCompanySaved }`.
 * Fully integrated with backend database via GET /api/users/me/saved and POST /api/users/me/saved/:id.
 * 
 * Rules:
 * - New accounts default to 0 saved companies (empty array).
 * - Toggling bookmark sends an API request to backend Prisma SQLite database.
 * - State updates instantly across Dashboard, Library, Companies directory, and Company Details pages.
 * - Saved companies persist across page refreshes, logouts, logins, and device restarts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSavedCompanies, toggleSaveCompany as toggleSaveCompanyApi } from '../services/userService';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);

export function LibraryProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [savedCompanies, setSavedCompanies] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const refreshSavedCompanies = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedCompanies([]);
      return;
    }
    setIsLoadingSaved(true);
    try {
      const res = await getSavedCompanies();
      if (res && res.data) {
        setSavedCompanies(res.data);
      } else {
        setSavedCompanies([]);
      }
    } catch (err) {
      console.error('Error fetching saved companies:', err);
      setSavedCompanies([]);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshSavedCompanies();
  }, [user, isAuthenticated, refreshSavedCompanies]);

  const toggleSaveCompany = async (companyId) => {
    try {
      const res = await toggleSaveCompanyApi(companyId);
      if (res && res.data) {
        setSavedCompanies(res.data);
      } else {
        await refreshSavedCompanies();
      }
      return res;
    } catch (err) {
      console.error('Failed to toggle save company:', err);
      throw err;
    }
  };

  const isCompanySaved = (idOrSlug) => {
    if (!idOrSlug || !savedCompanies) return false;
    const target = String(idOrSlug).toLowerCase();
    return savedCompanies.some(
      (c) => String(c.id).toLowerCase() === target || String(c.slug).toLowerCase() === target
    );
  };

  return (
    <LibraryContext.Provider
      value={{
        savedCompanies,
        isLoadingSaved,
        toggleSaveCompany,
        isCompanySaved,
        refreshSavedCompanies,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
