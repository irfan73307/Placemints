/**
 * Header / Navbar Component
 * 
 * Top sticky navigation bar displaying interactive global search, theme toggle,
 * settings link, notification bell popover, and profile avatar link.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, GraduationCap, Search, CheckCircle2, Calendar, FileText, X, Sun, Moon } from 'lucide-react';
import { Avatar } from './Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
    },
    {
      id: 2,
      title: 'New Zoho LLD PYQ contributed by student',
      time: '5 hours ago',
      unread: true,
      icon: FileText,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950',
    },
    {
      id: 3,
      title: 'Amazon SDE-1 Interview Experience uploaded',
      time: '1 day ago',
      unread: false,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950',
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/companies?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Mobile Brand Title */}
      <Link to={ROUTES.HOME} className="flex items-center gap-2 lg:hidden hover:opacity-90 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
          <GraduationCap className="w-4 h-4" />
        </div>
        <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">Placemints</span>
      </Link>

      {/* Desktop Global Search Bar */}
      <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies, topics, or PYQs... (Press Enter)"
          className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
        />
      </form>

      {/* Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Theme Toggle */}
        <button
          type="button"
          aria-label="Toggle Theme"
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* Notification Popover Drawer (Mobile-friendly fit) */}
          {showNotifications && (
            <div className="absolute right-0 sm:right-0 -mr-12 sm:mr-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-semibold">
                    3 New
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div key={n.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex gap-3 items-start">
                      <div className={`p-2 rounded-xl ${n.color} flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{n.title}</p>
                        <span className="text-[11px] text-slate-400 block">{n.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-center">
                <Link
                  to={ROUTES.COMPANIES}
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  View All Campus Drive Updates
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Profile Link (Avatar + Name) */}
        <Link
          to={ROUTES.PROFILE}
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity p-1 rounded-xl hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
        >
          <Avatar 
            name={user?.name || 'Student'} 
            src={user?.avatar} 
            size="md" 
          />
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.name || 'SASTRA Student'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {user?.department || 'Computer Science'}
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}

export default Header;
