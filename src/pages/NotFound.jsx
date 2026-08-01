/**
 * NotFound Page Component (404)
 * 
 * Purpose:
 * Clean 404 page rendered when users attempt to navigate to nonexistent routes.
 * Checks AuthContext to intelligently route back to /dashboard or home /.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export function NotFound() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleReturn = () => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.HOME);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center select-none">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-modal p-8 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mx-auto shadow-subtle">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
          <h2 className="text-lg font-bold text-slate-800">Page Not Found</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            The page you are looking for doesn't exist or may have been relocated.
          </p>
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleReturn}
            className="w-full gap-2 py-2.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to {isAuthenticated ? 'Dashboard' : 'Home'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
