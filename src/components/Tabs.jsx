/**
 * Tabs Component
 * 
 * Purpose:
 * Reusable tab bar component for switching between views (e.g. Rounds, PYQs, Resources).
 * 
 * Props:
 * `tabs`: Array of { id: string, label: string, badge?: string|number, icon?: Component }
 * `activeTab`: String id of current active tab
 * `onChange`: Function callback when tab is selected
 */

import React from 'react';
import { cn } from '../utils/cn';

export function Tabs({ tabs = [], activeTab, onChange, className }) {
  return (
    <div className={cn('flex border-b border-slate-200 gap-1 overflow-x-auto select-none no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap outline-none',
              isActive
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {Icon && <Icon className={cn('w-4 h-4', isActive ? 'text-brand-600' : 'text-slate-400')} />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-semibold',
                  isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
