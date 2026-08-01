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
        <label htmlFor={id} className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none">
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
          'w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-400 shadow-subtle transition-colors outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800',
          error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 dark:border-slate-700',
          isDisabled && 'bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700',
          inputClassName
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</span>}
    </div>
  );
}

export default Input;
