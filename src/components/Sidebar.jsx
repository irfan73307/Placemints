/**
 * Sidebar Component
 * 
 * Persistent desktop & tablet navigation drawer.
 * Database-driven Role-Based Access Control (RBAC):
 * - Students see ONLY Student navigation links.
 * - Admins see Student navigation + Admin Panel button.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, Bookmark, User, GraduationCap, Settings as SettingsIcon, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

  const navItems = [
    { name: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: 'Companies', path: ROUTES.COMPANIES, icon: Building2 },
    { name: 'Library', path: ROUTES.LIBRARY, icon: Bookmark },
    { name: 'Profile', path: ROUTES.PROFILE, icon: User },
    { name: 'Settings', path: ROUTES.SETTINGS, icon: SettingsIcon },
  ];

  if (isAdmin) {
    navItems.push({ name: 'Admin Directory', path: '/admin/students', icon: ShieldAlert });
    navItems.push({ name: 'Admin Settings', path: '/admin/settings', icon: ShieldCheck });
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 select-none z-30 transition-colors">
      {/* Brand Header */}
      <Link to={ROUTES.HOME} className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-3 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-subtle">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight block leading-none">Placemints</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">SASTRA Placement Prep</span>
        </div>
      </Link>

      {/* Main Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p className="font-medium text-slate-700 dark:text-slate-300">Placemints v1.0</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Targeted for SASTRA Students</p>
      </div>
    </aside>
  );
}
export default Sidebar;
