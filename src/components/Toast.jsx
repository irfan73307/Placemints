/**
 * Toast Component
 * 
 * Purpose:
 * Floating notification popup card component rendering message, status icon, and close button.
 */

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

const variantConfig = {
  success: {
    icon: CheckCircle2,
    style: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    iconStyle: 'text-emerald-600',
  },
  error: {
    icon: AlertCircle,
    style: 'bg-red-50 text-red-900 border-red-200',
    iconStyle: 'text-red-600',
  },
  info: {
    icon: Info,
    style: 'bg-brand-50 text-brand-900 border-brand-200',
    iconStyle: 'text-brand-600',
  },
};

export function Toast({ message, variant = 'info', onClose }) {
  const config = variantConfig[variant] || variantConfig.info;
  const Icon = config.icon;

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-card text-sm font-medium transition-all duration-200 animate-slideInRight',
        config.style
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn('w-4 h-4 shrink-0', config.iconStyle)} />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss toast"
        className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity ml-2"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default Toast;
