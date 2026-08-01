/**
 * BottomNav Component
 * 
 * Mobile bottom navigation bar (< 1024px).
 * Linear/SaaS inspired touch targets with purple accent active state.
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
      className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-md z-40 pb-[env(safe-area-inset-bottom)] font-sans"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all ${
                  isActive ? 'text-brand-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-brand-600 scale-110' : 'text-slate-400'}`} />
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
