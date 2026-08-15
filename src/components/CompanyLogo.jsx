import React, { useState, useEffect } from 'react';

/**
 * CompanyLogo Component
 * 
 * Scalable Database-Driven Company Logo Component:
 * - Priority 1: Custom verified logo / Admin uploaded logo (customLogo)
 * - Priority 2: Stored logo URL in PostgreSQL (logo / logoUrl)
 * - Priority 3: Canonical official domain favicon (https://icon.horse/icon/${domain})
 * - Priority 4: Bold alphabet gradient fallback avatar ([P] for Prodapt, [G] for Google, [M] for Microsoft)
 * 
 * Guaranteed zero broken image icons throughout the application.
 */
export function CompanyLogo({
  customLogo,
  logo,
  logoUrl,
  domain,
  officialDomain,
  name = 'Company',
  size = 'md',
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  // Clean domain if provided (e.g. https://www.prodapt.com -> prodapt.com)
  const resolvedDomain = (domain || officialDomain || '')
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .trim();

  // Active logo determination
  const activeLogo =
    customLogo ||
    logo ||
    logoUrl ||
    (resolvedDomain ? `https://icon.horse/icon/${resolvedDomain}` : null);

  const initial = name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'C';

  // Reset error on activeLogo or name change
  useEffect(() => {
    setImageError(false);
  }, [activeLogo, name]);

  // Size dimensions
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Fallback Alphabet Avatar
  if (imageError || !activeLogo || typeof activeLogo !== 'string' || activeLogo.trim() === '') {
    return (
      <div
        className={`${currentSizeClass} rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-600 text-white font-black flex items-center justify-center shadow-sm shrink-0 border border-white/20 select-none ${className}`}
        title={name}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div
      className={`${currentSizeClass} rounded-2xl bg-white dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={activeLogo}
        alt={name}
        onError={() => setImageError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export default CompanyLogo;
