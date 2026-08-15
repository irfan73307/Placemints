/**
 * BottomNav Component
 * 
 * Mobile bottom navigation bar (< 1024px).
 * Linear/SaaS inspired touch targets with purple accent active state.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const pathname = location.pathname;

  const isItemActive = (itemPath) => {
    if (itemPath === ROUTES.COMPANIES) {
      return (
        pathname === ROUTES.COMPANIES ||
        (pathname.startsWith('/companies/') && !pathname.startsWith('/admin'))
      );
    }
    if (itemPath === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD;
    }
    if (itemPath === ROUTES.LIBRARY) {
      return pathname === ROUTES.LIBRARY;
    }
    if (itemPath === ROUTES.PROFILE) {
      return pathname === ROUTES.PROFILE || pathname.startsWith('/profile');
    }
    if (itemPath === ROUTES.SETTINGS) {
      return pathname === ROUTES.SETTINGS;
    }
    return pathname === itemPath;
  };

  return (
    <nav 
      aria-label="Mobile bottom navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-40 pb-[env(safe-area-inset-bottom,4px)] transition-colors font-sans shadow-lg"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-brand-600 dark:text-brand-400 scale-110' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
export default BottomNav;
