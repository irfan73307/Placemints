/**
 * Input Component
 * 
 * Accessible text input control with label support, error message slot, disabled state,
 * and Dark Mode theme styling.
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
  isDisabled = false,
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
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={isDisabled}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-subtle transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 dark:border-slate-800',
          isDisabled && 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800',
          inputClassName
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</span>}
    </div>
  );
}

export default Input;
