/**
 * Footer Component
 * 
 * Purpose:
 * Minimal public marketing footer used on non-authenticated pages like Landing.
 * 
 * Future Backend Integration:
 * None; static link structure for privacy policy, terms, and community links.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';

export function Footer() {
  const { isAuthenticated } = useAuth();
  const logoDestination = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME;

  return (
    <footer className="bg-white border-t border-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
        <Link to={logoDestination} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 tracking-tight text-base">Placemints</span>
          <span className="text-xs text-slate-400">| Crafted for SASTRA Placement Candidates</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-600">
          <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
          <a href="#companies" className="hover:text-brand-600 transition-colors">Companies</a>
          <a href="#resources" className="hover:text-brand-600 transition-colors">Resources</a>
          <span className="text-slate-300">|</span>
          <p className="text-slate-400">© {new Date().getFullYear()} Placemints. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
