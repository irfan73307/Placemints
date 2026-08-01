/**
 * Companies Page Component
 * 
 * Filterable company directory with SearchBar, tag filter Badges,
 * responsive grid of CompanyCard components, loading skeletons, error state, and empty state.
 * Supports Dark Mode styling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { CompanyCard } from '../components/CompanyCard';
import { Badge } from '../components/Badge';
import { SkeletonGrid } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { useLibrary } from '../contexts/LibraryContext';
import { getCompanies } from '../services/companyService';
import { AlertCircle, RefreshCw, Filter } from 'lucide-react';

const FILTER_TAGS = [
  'All',
  'Product-based',
  'Service-based',
  'Super Dream',
  'Dream Company',
  'Mass Recruiter',
  'Specialist',
];

export function Companies() {
  const { toggleSaveCompany, isCompanySaved } = useLibrary();
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedTag, setSelectedTag] = useState('All');
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearchQuery(q);
  }, [searchParams]);

  const fetchCompanies = useCallback(async (query, tag) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeTag = tag === 'All' ? '' : tag;
      const response = await getCompanies(query, activeTag);
      setCompanies(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load company directory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies(searchQuery, selectedTag);
  }, [searchQuery, selectedTag, fetchCompanies]);

  const handleSearch = (q) => {
    setSearchQuery(q);
  };

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recruiting Companies</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Explore campus recruiters visiting SASTRA, selection processes, CTC offers, and past question archives.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
        <SearchBar onSearch={handleSearch} placeholder="Search by company name, tag, or technology stack..." />

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar select-none">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {FILTER_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'info' : 'default'}
                isInteractive
                onClick={() => handleTagClick(tag)}
                className={`shrink-0 py-1 px-3 ${
                  isSelected ? 'bg-brand-600 text-white font-semibold border-transparent' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-8 text-center text-red-800 dark:text-red-300 space-y-3">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="text-base font-bold">Failed to load companies</h3>
          <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mx-auto">{error}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => fetchCompanies(searchQuery, selectedTag)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading</span>
          </Button>
        </div>
      ) : (() => {
        const displayedCompanies = companies.filter(
          (comp) => !isCompanySaved(comp.id) && !isCompanySaved(comp.slug)
        );

        if (displayedCompanies.length === 0) {
          return (
            <EmptyState
              title="No matching companies found"
              description={
                companies.length > 0
                  ? "All matching companies are currently saved in your Saved Library!"
                  : `We couldn't find any companies matching "${searchQuery}" under ${selectedTag}.`
              }
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('All');
                  }}
                >
                  Reset Search & Filters
                </Button>
              }
            />
          );
        }

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedCompanies.map((comp) => (
              <CompanyCard
                key={comp.id}
                company={{
                  ...comp,
                  isSaved: false,
                }}
                onToggleSave={toggleSaveCompany}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default Companies;
