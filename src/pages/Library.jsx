/**
 * Library Page Component
 * 
 * Renders user's bookmarked companies from LibraryContext as a responsive grid of CompanyCard items.
 * Includes loading skeleton and EmptyState when list is empty.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass } from 'lucide-react';
import { CompanyCard } from '../components/CompanyCard';
import { SkeletonGrid } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useLibrary } from '../contexts/LibraryContext';
import { ROUTES } from '../constants/routes';

export function Library() {
  const { savedCompanies, toggleSaveCompany } = useLibrary();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Saved Target Companies</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Quickly reference selection round patterns, hiring criteria, and practice PYQs for your targeted recruiters.
          </p>
        </div>

        <div className="text-xs font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-3.5 py-1.5 rounded-full border border-brand-200/80 dark:border-brand-800 w-fit shrink-0">
          {savedCompanies.length} Saved {savedCompanies.length === 1 ? 'Company' : 'Companies'}
        </div>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : savedCompanies.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="You haven't saved any companies yet"
          description="Browse the SASTRA placement company directory and click the bookmark icon on any company to save it here for instant access."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(ROUTES.COMPANIES)}
              className="gap-2 bg-brand-600 hover:bg-brand-700 shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Browse Companies Directory</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedCompanies.map((comp) => (
            <CompanyCard
              key={comp.id}
              company={{
                ...comp,
                isSaved: true,
              }}
              onToggleSave={toggleSaveCompany}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Library;
