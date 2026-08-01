import React, { useState } from 'react';

/**
 * CompanyLogo Component
 * 
 * Scalable Database-Driven Company Logo Component:
 * - Prioritizes customLogo -> logo -> logoUrl
 * - Displays circular fallback avatar with bold letter if logo is NULL or image fails to load.
 * - Prevents broken image icons ([x]) throughout the application.
 */
export function CompanyLogo({ customLogo, logo, logoUrl, name = 'Company', size = 'md', className = '' }) {
  const [imageError, setImageError] = useState(false);

  const activeLogo = customLogo || logo || logoUrl;
  const initial = name ? name.trim().charAt(0).toUpperCase() : 'C';

  // Size dimensions
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Circular fallback avatar if image fails or logo is missing
  if (imageError || !activeLogo || activeLogo.trim() === '') {
    return (
      <div
        className={`${currentSizeClass} rounded-full bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 text-white font-extrabold flex items-center justify-center shadow-sm shrink-0 border border-white/20 select-none ${className}`}
        title={name}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${currentSizeClass} rounded-xl bg-white p-1 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
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
