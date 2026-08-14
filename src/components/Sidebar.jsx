/**
 * Sidebar Component
 * 
 * Linear/Vercel-inspired desktop & tablet navigation drawer.
 * Database-driven Role-Based Access Control (RBAC):
 * - Students see ONLY Student navigation links.
 * - Admins see Student navigation + Admin Directory & Settings links.
 */

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Building2, Bookmark, User, GraduationCap, Settings as SettingsIcon, ShieldAlert, ShieldCheck, PlusCircle } from 'lucide-react';
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

  const adminItems = isAdmin ? [
    { name: 'Admin Directory', path: '/admin/students', icon: ShieldAlert },
    { name: 'Admin Settings', path: '/admin/settings', icon: ShieldCheck },
    { name: 'Company Addn', path: ROUTES.ADMIN_COMPANY_ADD, icon: PlusCircle },
  ] : [];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen fixed top-0 left-0 bottom-0 select-none z-40 font-sans transition-colors">
      {/* Brand Header */}
      <Link to={ROUTES.HOME} className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800 gap-3 hover:opacity-90 transition-opacity">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight block leading-none">Placemints</span>
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider uppercase block mt-1">SASTRA University</span>
        </div>
      </Link>

      {/* Main Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
            Platform Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border-l-4 border-brand-600 dark:border-brand-500 shadow-subtle'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Admin Navigation Section */}
        {isAdmin && (
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-amber-600 dark:text-amber-400 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Management</span>
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border-l-4 border-amber-500 shadow-subtle'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
          <span>Placemints SaaS</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">v1.0</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500">Single Source of Truth DB</p>
      </div>
    </aside>
  );
}
export default Sidebar;
