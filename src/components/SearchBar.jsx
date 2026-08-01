/**
 * SearchBar Component
 * 
 * Purpose:
 * Debounced search input component with embedded search icon.
 * Calls `onSearch` callback with debounced query value.
 * 
 * Future Backend Integration:
 * Used on Companies page and global header to trigger filtered API searches (e.g. GET /api/companies?q=query).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../utils/cn';

export function SearchBar({
  placeholder = 'Search by company name, technology, or tag...',
  onSearch,
  debounceMs = 300,
  className,
  initialValue = '',
}) {
  const [query, setQuery] = useState(initialValue);
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onSearchRef.current) {
        onSearchRef.current(query);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, debounceMs]);

  const handleClear = () => {
    setQuery('');
    if (onSearchRef.current) onSearchRef.current('');
  };

  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 shadow-subtle outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search query"
          className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
