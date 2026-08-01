/**
 * Badge Component
 * 
 * Linear/Stripe pill badge component for tag labels, statuses, difficulty levels, or company tiers.
 */

import React from 'react';
import { cn } from '../utils/cn';

const variantStyles = {
  default: 'bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700',
  brand: 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border-brand-200/80 dark:border-brand-800 font-bold',
  info: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800 font-semibold',
  success: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800 font-semibold',
  warning: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800 font-semibold',
  danger: 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800 font-semibold',
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium',
};

const sizeStyles = {
  xs: 'px-2 py-0.5 text-[10px] rounded-md font-bold tracking-tight',
  sm: 'px-2.5 py-0.5 text-xs rounded-full font-semibold',
  md: 'px-3 py-1 text-xs rounded-full font-bold',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className,
  onClick,
  isInteractive = false,
}) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border select-none transition-colors font-sans',
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.sm,
        isInteractive && 'cursor-pointer hover:opacity-85',
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
