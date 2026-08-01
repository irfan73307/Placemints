/**
 * Companies Page Component
 * 
 * Filterable company directory with SearchBar, tag filter Badges,
 * responsive grid of CompanyCard components, loading skeletons, error state, and empty state.
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
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [selectedTag, setSelectedTag] = useState('All');
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state if URL search param changes
  useEffect(() => {
    setSearchQuery(urlQuery);
  }, [urlQuery]);

  const fetchCompanies = useCallback(async (query, tag, showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true);
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
    fetchCompanies(searchQuery, selectedTag, companies.length === 0);
  }, [searchQuery, selectedTag, fetchCompanies]);

  const handleSearch = useCallback((q) => {
    setSearchQuery(q);
    if (q.trim()) {
      setSearchParams({ search: q.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [setSearchParams]);

  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTag('All');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans pb-12">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Recruiting Companies Archive</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Explore 246+ campus recruiters visiting SASTRA, selection processes, CTC offers, and past question archives.
          </p>
        </div>

        <div className="text-xs font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950 px-3.5 py-1.5 rounded-full border border-brand-200/80 dark:border-brand-800 w-fit shrink-0">
          {companies.length} Companies Archived
        </div>
      </div>

      {/* Search & Filters Card */}
      <div className="space-y-3.5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card">
        <SearchBar 
          onSearch={handleSearch} 
          initialValue={searchQuery}
          placeholder="Search by company name (Google, TCS, Zoho), tag, or technology stack..." 
        />

        {/* Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 no-scrollbar select-none">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 mr-1 uppercase tracking-wider text-[10px]">
            <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            Filter By:
          </span>
          {FILTER_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Badge
                key={tag}
                variant={isSelected ? 'brand' : 'neutral'}
                isInteractive
                onClick={() => handleTagClick(tag)}
                className={`shrink-0 py-1 px-3.5 text-xs ${
                  isSelected ? 'bg-brand-600 text-white font-bold border-transparent shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-800 space-y-3">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
          <h3 className="text-base font-bold">Failed to load companies</h3>
          <p className="text-xs text-red-600 max-w-sm mx-auto">{error}</p>
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
      ) : companies.length === 0 ? (
        <EmptyState
          title="No matching companies found"
          description="Try broadening your search query or choosing a different filter category above."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear Search Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <CompanyCard
              key={company.id}
              company={{
                ...company,
                isSaved: isCompanySaved(company.id) || isCompanySaved(company.slug),
              }}
              onToggleSave={toggleSaveCompany}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Companies;
