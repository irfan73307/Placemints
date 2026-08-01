/**
 * EmptyState Component
 * 
 * Purpose:
 * Flexible placeholder component displayed whenever lists or queries return no results.
 * Includes title, description, custom icon, and an optional action button.
 * 
 * Props:
 * `icon`: Lucide icon component
 * `title`: String
 * `description`: String
 * `action`: React node (e.g. Button component)
 * 
 * Future Backend Integration:
 * Displayed when endpoints (e.g. GET /api/library or filtered GET /api/companies) return empty arrays.
 */

import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../utils/cn';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There is no data available to display right now.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-card my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 mb-4 shadow-subtle">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
