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
        'group bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:shadow-card-hover hover:border-brand-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between relative font-sans',
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
                className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 block leading-tight"
              >
                {name}
              </Link>
              {ctc && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-emerald-200/60">
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
                ? 'bg-brand-50 text-brand-600 border-brand-200'
                : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-50'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isSaved && 'fill-brand-600')} />
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
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-normal">
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
        className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors group-hover:text-brand-700"
      >
        <span>View Interview Rounds & PYQs</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

export default CompanyCard;
