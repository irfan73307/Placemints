/**
 * AuthLayout Component
 * 
 * Purpose:
 * Minimal, centered card layout dedicated to authentication screens (e.g. Login page).
 * Eliminates sidebars, bottom nav, and headers to keep auth flows clean and focused.
 * 
 * Future Backend Integration:
 * None; purely a layout wrapper for authentication child components via <Outlet />.
 */

import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none">
      {/* Background Decorative Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-modal p-6 sm:p-8 relative z-10">
        {/* Brand Header */}
        <Link to={ROUTES.HOME} className="flex flex-col items-center text-center mb-8 hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Placemints</h1>
          <p className="text-xs text-slate-500 mt-1">SASTRA University Placement Portal</p>
        </Link>

        {/* Auth Route Outlet */}
        <Outlet />
      </div>

      {/* Auth Footer */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Protected student access. SASTRA University credentials required.
      </div>
    </div>
  );
}
export default AuthLayout;
