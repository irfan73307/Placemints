/**
 * SplashScreen Component
 * 
 * Purpose:
 * Renders an animated Placemints branded loading splash screen during initial auth & session restoration.
 * Prevents UI flickering and unexpected redirects before authentication is confirmed.
 */

import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 antialiased text-white">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-xl ring-4 ring-white/10">
          <GraduationCap className="w-9 h-9 text-white" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 justify-center">
            <span>Placemints</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            SASTRA University Campus Placement Platform
          </p>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-brand-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
