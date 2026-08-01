/**
 * LoadingSkeleton Component
 * 
 * Purpose:
 * Exports named skeleton loading placeholders (SkeletonCard, SkeletonRow, SkeletonLine, SkeletonGrid)
 * utilizing Tailwind's `animate-pulse` to maintain realistic shape during async loading states.
 * 
 * Future Backend Integration:
 * Rendered while fetching data from API endpoints before responses resolve.
 */

import React from 'react';
import { cn } from '../utils/cn';

export function SkeletonLine({ className }) {
  return <div className={cn('h-4 bg-slate-200 rounded animate-pulse', className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5 shadow-card space-y-4 animate-pulse', className)}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-slate-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-5 bg-slate-200 rounded-full w-16" />
        <div className="h-5 bg-slate-200 rounded-full w-20" />
      </div>
    </div>
  );
}

export function SkeletonRow({ className }) {
  return (
    <div className={cn('flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 animate-pulse gap-4', className)}>
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
      <div className="h-6 bg-slate-200 rounded w-16" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5', className)}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

export default SkeletonCard;
