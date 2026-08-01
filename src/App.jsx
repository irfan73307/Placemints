/**
 * App Root Component
 * 
 * Purpose:
 * Wraps the router tree with all application providers (AuthProvider, ThemeProvider, LibraryProvider, ToastProvider).
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { ToastProvider } from './contexts/ToastContext';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
