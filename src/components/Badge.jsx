/**
 * Badge Component
 * 
 * Linear/Stripe pill badge component for tag labels, statuses, difficulty levels, or company tiers.
 */

import React from 'react';
import { cn } from '../utils/cn';

const variantStyles = {
  default: 'bg-slate-100/80 text-slate-700 border-slate-200/80',
  brand: 'bg-brand-50 text-brand-700 border-brand-200/80 font-bold',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 font-semibold',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-semibold',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/80 font-semibold',
  danger: 'bg-red-50 text-red-700 border-red-200/80 font-semibold',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
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
