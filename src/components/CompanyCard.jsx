/**
 * CompanyCard Component
 * 
 * Renders company logo, name, short description, metadata tags (Badge), and bookmark/save toggle.
 * Supports Dark Mode styling.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Building2, ChevronRight } from 'lucide-react';
import { Badge } from './Badge';
import { getCompanyDetailsPath } from '../constants/routes';
import { cn } from '../utils/cn';

export function CompanyCard({ company, onToggleSave, className }) {
  if (!company) return null;

  const { id, name, logo, description, tags = [], isSaved = false, ctc, tier } = company;

  const handleBookmarkClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(id);
    }
  };

  return (
    <div
      className={cn(
        'group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-card hover:shadow-md hover:border-brand-200 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between relative',
        className
      )}
    >
      {/* Top Header: Logo, Name, Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt={`${name} logo`}
                className="w-11 h-11 rounded-lg object-contain bg-slate-50 dark:bg-white p-1 border border-slate-100 dark:border-slate-700 shrink-0"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{ display: logo ? 'none' : 'flex' }}
              className="w-11 h-11 rounded-lg bg-brand-50 dark:bg-brand-950 border border-brand-100 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-lg shrink-0"
            >
              <Building2 className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <Link
                to={getCompanyDetailsPath(id)}
                className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1"
              >
                {name}
              </Link>
              {ctc && (
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md inline-block mt-0.5">
                  {ctc}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-label={isSaved ? `Remove ${name} from saved companies` : `Save ${name}`}
            className={cn(
              'p-2 rounded-lg transition-colors border shadow-subtle shrink-0',
              isSaved
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 border-brand-200 dark:border-brand-800 hover:bg-brand-100'
                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isSaved && 'fill-brand-600 dark:fill-brand-400')} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tier && <Badge variant="info">{tier}</Badge>}
          {tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="default">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="default">+{tags.length - 3}</Badge>
          )}
        </div>
      </div>

      {/* Footer Link */}
      <Link
        to={getCompanyDetailsPath(id)}
        className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group-hover:text-brand-700"
      >
        <span>View Interview Rounds & PYQs</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default CompanyCard;
