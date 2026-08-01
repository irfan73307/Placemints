/**
 * CompanyCard Component
 * 
 * Linear/Stripe style company card component:
 * Displays official company logo, salary range, company type & dream level badges,
 * short description, metadata tags, bookmark toggle button, and "View Interview Rounds" CTA link.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ChevronRight, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { CompanyLogo } from './CompanyLogo';
import { getCompanyDetailsPath } from '../constants/routes';
import { cn } from '../utils/cn';

export function CompanyCard({ company, onToggleSave, className }) {
  if (!company) return null;

  const { id, slug, name, logo, logoUrl, description, tags = [], isSaved = false, ctc, tier } = company;
  const logoImage = logo || logoUrl || company.logoUrl;
  const companySlug = slug || id;

  // Determine Dream Level Badge based on CTC/Tier
  const getDreamLevel = () => {
    if (tier && (tier.includes('Super') || tier.includes('Tier 1'))) return 'Super Dream';
    if (ctc && (ctc.includes('15') || ctc.includes('20') || ctc.includes('25') || ctc.includes('30') || ctc.includes('40'))) {
      return 'Super Dream';
    }
    return 'Dream Company';
  };

  const dreamLevel = getDreamLevel();

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
        'group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card hover:shadow-card-hover hover:border-brand-300 dark:hover:border-brand-600 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative font-sans',
        className
      )}
    >
      <div>
        {/* Top Header: Logo, Name, CTC & Save Toggle */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo logoUrl={logoImage} name={name} size="md" />
            <div className="min-w-0 flex-1">
              <Link
                to={getCompanyDetailsPath(companySlug)}
                className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 block leading-tight"
              >
                {name}
              </Link>
              {ctc && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-200/60 dark:border-emerald-800">
                  💰 {ctc}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-label={isSaved ? `Remove ${name} from saved companies` : `Save ${name}`}
            className={cn(
              'p-2 rounded-xl transition-all duration-150 border shadow-subtle shrink-0 hover:scale-105 active:scale-95',
              isSaved
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800'
                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isSaved && 'fill-brand-600 dark:fill-brand-400')} />
          </button>
        </div>

        {/* Badges: Dream Level & Category */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Badge variant={dreamLevel === 'Super Dream' ? 'brand' : 'info'} size="xs" className="font-bold">
            <Sparkles className="w-3 h-3 inline mr-1" />
            {dreamLevel}
          </Badge>
          {tier && <Badge variant="neutral" size="xs">{tier}</Badge>}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4 font-normal">
          {description || `Explore ${name} recruitment process, eligibility criteria, and past interview questions.`}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="default" size="xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 3 && (
            <Badge variant="default" size="xs">+{tags.length - 3}</Badge>
          )}
        </div>
      </div>

      {/* Footer Link: View Interview Rounds */}
      <Link
        to={getCompanyDetailsPath(companySlug)}
        className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300"
      >
        <span>View Interview Rounds & PYQs</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default CompanyCard;
