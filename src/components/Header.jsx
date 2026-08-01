/**
 * Header / Navbar Component
 * 
 * Vercel/Linear inspired top sticky navbar:
 * Interactive global search, notifications drawer, responsive department indicator,
 * and user profile link.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, GraduationCap, Search, CheckCircle2, Calendar, FileText, X, Sun, Moon } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFormattedDepartment } from '../utils/departmentUtils';
import { ROUTES } from '../constants/routes';

export function Header() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      title: 'TCS Digital NQT 2026 Drive Announced',
      time: '2 hours ago',
      unread: true,
      icon: Calendar,
      color: 'text-brand-600 bg-brand-50 dark:bg-brand-950/60 dark:text-brand-400',
    },
    {
      id: 2,
      title: 'New Zoho LLD PYQ contributed by student',
      time: '5 hours ago',
      unread: true,
      icon: FileText,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      id: 3,
      title: 'Amazon SDE-1 Interview Experience uploaded',
      time: '1 day ago',
      unread: false,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const deptInfo = getFormattedDepartment(user?.department || user?.branch);

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors font-sans">
      {/* Mobile Brand Title */}
      <Link to={ROUTES.HOME} className="flex items-center gap-2.5 lg:hidden hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-sm">
          <GraduationCap className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Placemints</span>
      </Link>

      {/* Desktop Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies, topics, or PYQs... (Press Enter)"
          className="w-full pl-10 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all font-medium"
        />
        <kbd className="absolute right-3 hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md">
          /
        </kbd>
      </form>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          aria-label="Toggle Theme"
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4.5 h-4.5 text-amber-400" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-600" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Notification Popover Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Campus Notifications</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
                    3 New
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 items-start">
                      <div className={`p-2 rounded-xl ${n.color} shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{n.title}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to={ROUTES.COMPANIES}
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View All Drive Updates
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile Link (Avatar + Responsive Department) */}
        <Link
          to={ROUTES.PROFILE}
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity p-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
        >
          <Avatar 
            name={user?.name || 'Student'} 
            src={user?.avatar} 
            size="md" 
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[140px]">
              {user?.fullName || user?.name || 'SASTRA Student'}
            </div>
            <div className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
              {deptInfo.mobile}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
