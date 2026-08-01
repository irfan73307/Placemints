import React, { useState } from 'react';

/**
 * CompanyLogo Component
 * 
 * Renders official company logo with smooth, automatic fallback handling.
 * Prevents broken image icons ([x]) throughout the application.
 */
export function CompanyLogo({ logoUrl, name = 'Company', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'C';

  // Size dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Clean fallback SVG badge if image fails or logoUrl is missing
  if (imageError || !logoUrl || logoUrl.trim() === '') {
    return (
      <div
        className={`${currentSizeClass} rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-brand-700 text-white font-extrabold flex items-center justify-center shadow-sm shrink-0 border border-white/20 select-none ${className}`}
        title={name}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${currentSizeClass} rounded-xl bg-white dark:bg-slate-800 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      <img
        src={logoUrl}
        alt={name}
        onError={() => setImageError(true)}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

export default CompanyLogo;
