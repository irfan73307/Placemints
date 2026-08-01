/**
 * Button Component
 * 
 * Purpose:
 * Core interactive button with standard size variants, style variants, accessible focus rings,
 * loading spinner, and icon support.
 * 
 * Future Backend Integration:
 * Used across the app to trigger async actions (e.g. form submission, save company API calls).
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

const variantStyles = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-subtle border border-transparent',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 active:bg-slate-100 shadow-subtle',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-subtle border border-transparent',
};

const sizeStyles = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
  md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  type = 'button',
  ariaLabel,
  className,
  onClick,
  ...props
}) {
  const disabled = isDisabled || isLoading;

  return (
    <button
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 outline-none select-none',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        disabled && 'opacity-60 cursor-not-allowed pointer-events-none shadow-none',
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  );
}

export default Button;
