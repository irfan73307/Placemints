/**
 * Button Component
 * 
 * Linear/Stripe style button component with accessible focus rings,
 * loading spinner, and subtle active scale micro-animations.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

const variantStyles = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm border border-transparent hover:shadow-md transition-all active:scale-[0.98]',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 active:bg-slate-100 shadow-subtle hover:border-slate-300 transition-all active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border border-transparent active:scale-[0.98]',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm border border-transparent active:scale-[0.98]',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 font-semibold',
  md: 'px-4 py-2 text-xs rounded-xl gap-2 font-bold',
  lg: 'px-6 py-2.5 text-sm rounded-2xl gap-2.5 font-extrabold',
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
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 outline-none select-none font-sans',
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
