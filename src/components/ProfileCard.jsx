/**
 * ProfileCard Component
 * 
 * Purpose:
 * Displays user avatar, name, email, branch details, and summary stat badges.
 * 
 * Props:
 * `user`: { name, email, avatar, branch, savedCount, practicedCount, targetRole }
 * 
 * Future Backend Integration:
 * Consumes user profile data from GET /api/profile.
 */

import React from 'react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Bookmark, CheckCircle2, GraduationCap, Mail } from 'lucide-react';
import { cn } from '../utils/cn';

export function ProfileCard({ user, className }) {
  if (!user) return null;

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row items-center gap-6', className)}>
      <Avatar name={user.name} src={user.avatar} size="lg" className="ring-4 ring-brand-50" />

      <div className="flex-1 text-center sm:text-left space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
          <Badge variant="info" className="w-fit mx-auto sm:mx-0">
            {user.targetRole || 'Software Engineer Candidate'}
          </Badge>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-slate-500 pt-1">
          <span className="inline-flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {user.email}
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            {user.branch || 'CSE'}, SASTRA
          </span>
        </div>

        {/* Stat Badges */}
        <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700">
            <Bookmark className="w-4 h-4 text-brand-600" />
            <span>Companies Saved: <strong className="text-brand-700">{user.savedCount ?? 0}</strong></span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-xs font-semibold text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>PYQs Practiced: <strong className="text-emerald-700">{user.practicedCount ?? 0}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;
