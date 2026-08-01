/**
 * Badge Component
 * 
 * Purpose:
 * Small pill badge component used to highlight tags like "Product-based", "Applied", "Saved",
 * difficulty levels, or round types.
 * 
 * Future Backend Integration:
 * Displays dynamic tag labels fetched from company or question metadata.
 */

import React from 'react';
import { cn } from '../utils/cn';

const variantStyles = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

export function Badge({
  children,
  variant = 'default',
  className,
  onClick,
  isInteractive = false,
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors',
        variantStyles[variant] || variantStyles.default,
        isInteractive && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
