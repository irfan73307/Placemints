/**
 * AppLayout Component
 * 
 * Main authenticated application wrapper layout.
 * Integrates persistent Sidebar on desktop, top Header, and BottomNav on mobile.
 * Contains React Router's <Outlet /> for rendering authenticated page views.
 * Supports complete Dark Mode theme styling.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row antialiased text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors">
      {/* Desktop Sidebar (Persistent >= 1024px) */}
      <Sidebar />

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:pl-64">
        {/* Top Header */}
        <Header />

        {/* Dynamic Page Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation (Visible < 1024px) */}
        <BottomNav />
      </div>
    </div>
  );
}
export default AppLayout;
