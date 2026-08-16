/**
 * Standardized Input Component
 * 
 * Accessible text input control adhering to Placemints design tokens:
 * - Fixed comfortable height (44px / h-11)
 * - Harmonized light / dark color schemes
 * - Subtle hover transitions, brand-focused glow, and invalid state indicators
 * - Left icon and right action slot (e.g., password toggle) support
 */

import React, { useId } from 'react';
import { cn } from '../utils/cn';

export function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  isDisabled = false,
  required = false,
  leftIcon,
  rightElement,
  id: customId,
  className,
  inputClassName,
  ...props
}) {
  const generatedId = useId();
  const id = customId || generatedId;

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold text-slate-900 dark:text-slate-100 select-none flex items-center justify-between"
        >
          <span>
            {label}
            {required && !label.includes('*') && <span className="text-brand-600 dark:text-brand-400 ml-0.5">*</span>}
          </span>
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={isDisabled}
          required={required}
          className={cn(
            'w-full h-11 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-subtle transition-all duration-150 outline-none',
            'hover:border-slate-400 dark:hover:border-slate-600',
            'focus:bg-white dark:focus:bg-slate-800 focus:border-brand-600 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            leftIcon ? 'pl-10 pr-3.5' : 'px-3.5',
            rightElement ? 'pr-11' : '',
            error
              ? 'border-red-500 dark:border-red-500 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 dark:border-slate-700',
            isDisabled &&
              'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 cursor-not-allowed border-slate-300 dark:border-slate-700 hover:border-slate-300 shadow-none font-medium',
            inputClassName
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400 font-medium animate-fadeIn">{error}</span>
      ) : helperText ? (
        <span className="text-xs text-slate-400 dark:text-slate-500">{helperText}</span>
      ) : null}
    </div>
  );
}

export default Input;
