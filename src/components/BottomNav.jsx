/**
 * BottomNav Component
 * 
 * Purpose:
 * Mobile navigation bar fixed to the bottom of the screen (< 1024px).
 * Optimized for touch targets with safe-area padding for iOS home indicator bars.
 * Supports Dark Mode.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Bookmark, User, Settings as SettingsIcon } from 'lucide-react';
import { ROUTES } from '../constants/routes';

const navItems = [
  { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { name: 'Companies', path: ROUTES.COMPANIES, icon: Building2 },
  { name: 'Library', path: ROUTES.LIBRARY, icon: Bookmark },
  { name: 'Profile', path: ROUTES.PROFILE, icon: User },
  { name: 'Settings', path: ROUTES.SETTINGS, icon: SettingsIcon },
];

export function BottomNav() {
  return (
    <nav 
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 pb-[env(safe-area-inset-bottom)] transition-colors"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
export default BottomNav;
