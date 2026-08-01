/**
 * Dashboard Page Component
 * 
 * Linear/Stripe inspired SaaS student placement dashboard featuring:
 * - Premium Purple #5B4CF5 Welcome Banner with structured metric cards (Dept, Batch, CGPA, Goal).
 * - Interactive Profile Completion Checklist Card (50% progress, items checklist, Update Profile CTA).
 * - Premium Quick Action Cards with smooth hover micro-animations.
 * - Live Saved Companies section synced 100% with Supabase PostgreSQL database.
 * - Top Campus Recruiters grid with CompanyLogo fallback handling.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyLogo } from '../components/CompanyLogo';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { getCompanies } from '../services/companyService';
import { calculateProfileCompletion } from '../utils/profileCompletion';
import { getFormattedDepartment } from '../utils/departmentUtils';
import { 
  Sparkles, 
  Target, 
  Bookmark, 
  ArrowRight, 
  TrendingUp,
  CheckCircle2,
  Building2,
  BookOpen,
  User,
  Calendar,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Award
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { savedCompanies, toggleSaveCompany, isCompanySaved } = useLibrary();
  const navigate = useNavigate();

  const [topCompanies, setTopCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const compRes = await getCompanies();
        if (compRes && compRes.data) {
          setTopCompanies(compRes.data.slice(0, 6));
        }
      } catch (err) {
        console.error('Error loading dashboard companies:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const completion = calculateProfileCompletion(user);
  const formattedDept = getFormattedDepartment(user?.department || user?.branch);

  // Checklist items completion status
  const checklistItems = [
    { label: 'Resume Upload', done: !!user?.resume },
    { label: 'GitHub Profile', done: !!user?.github },
    { label: 'LeetCode Handle', done: !!user?.leetcode },
    { label: 'LinkedIn Profile', done: !!user?.linkedin },
    { label: 'Short Bio', done: !!user?.bio },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-12 font-sans">
      {/* 1. Premium Purple #5B4CF5 Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6 border border-brand-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SASTRA University Placement Prep Hub</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.fullName || user?.name || 'SASTRA Student'} 👋
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100/90 max-w-xl font-medium">
              Access SASTRA campus selection round archives, top PYQs, and company placement statistics.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 shrink-0 sm:min-w-[280px]">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Department</span>
              <span className="text-xs sm:text-sm font-bold text-white block mt-0.5 truncate">{formattedDept.code}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Graduation Batch</span>
              <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">{user?.graduationYear || user?.batchYear || '2026'}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Academic CGPA</span>
              <span className="text-xs sm:text-sm font-black text-amber-300 block mt-0.5">{user?.cgpa || '8.50'}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Placement Goal</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-300 block mt-0.5 truncate">{user?.placementGoal || 'SDE-1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Recruiters & Profile Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Saved Companies & Top Recruiters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to={ROUTES.COMPANIES}
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  Company Archives
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Browse selection round details for 246+ campus recruiters.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>Explore Directory</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={`${ROUTES.COMPANIES}?tab=pyqs`}
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  SASTRA PYQs
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Practice 6,600+ past campus interview questions.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>Solve PYQs</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to={ROUTES.PROFILE}
              className="p-5 bg-white border border-slate-200 rounded-2xl shadow-card hover:shadow-card-hover hover:border-brand-300 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                  My Profile
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Update CGPA, target role, and coding platform links.
                </p>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs font-bold text-brand-600">
                <span>Manage Profile</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Saved Companies Section (Synced directly with Database) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-extrabold text-slate-900">Saved Target Companies</h2>
              </div>
              <Badge variant="brand">{savedCompanies.length} Saved</Badge>
            </div>

            {savedCompanies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedCompanies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/companies/${company.slug || company.id}`}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-brand-300 shadow-subtle hover:shadow-md transition-all flex items-center gap-3 group"
                  >
                    <CompanyLogo logoUrl={company.logo || company.logoUrl} name={company.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{company.ctc || 'Tier 1 Recruiter'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No saved companies yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse company archives and click the bookmark button on any company to save it here for quick reference.
                </p>
              </div>
            )}
          </div>

          {/* Top Recruiter Archives Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Top Campus Recruiters</h2>
              <Link to={ROUTES.COMPANIES} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
                <span>View All 246 Companies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={{
                    ...company,
                    isSaved: isCompanySaved(company.id),
                  }}
                  onToggleSave={toggleSaveCompany}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Refined Profile Completion Checklist & Campus Drive Status */}
        <div className="space-y-6">
          {/* Profile Completion Checklist Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-3xl font-black text-brand-600">{completion.percentage}%</span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5">
                  {completion.percentage === 100 ? "Your profile is 100% complete!" : "You're halfway there!"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-brand-100 flex items-center justify-center text-xs font-black text-brand-600 bg-brand-50">
                {completion.percentage}%
              </div>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Complete these to reach 100%:
            </p>

            <div className="space-y-2.5">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-medium py-1">
                  <div className="flex items-center gap-2.5">
                    {item.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                        □
                      </div>
                    )}
                    <span className={item.done ? 'text-slate-800 font-semibold' : 'text-slate-500'}>
                      {item.label}
                    </span>
                  </div>
                  {item.done ? (
                    <Badge variant="success" size="xs">Done</Badge>
                  ) : (
                    <Badge variant="neutral" size="xs">Pending</Badge>
                  )}
                </div>
              ))}
            </div>

            <Link to={ROUTES.PROFILE} className="block pt-2">
              <Button variant="primary" size="md" className="w-full justify-center bg-brand-600 hover:bg-brand-700 shadow-sm py-2.5">
                Update Profile
              </Button>
            </Link>
          </div>

          {/* Upcoming Drives Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Upcoming Placement Drives</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CompanyLogo logoUrl="https://logo.clearbit.com/tcs.com" name="TCS" size="xs" />
                    <span className="text-xs font-bold text-slate-900">TCS Digital & Prime</span>
                  </div>
                  <Badge variant="success" size="xs">Open</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Last Date: Aug 15</span>
                  <Link to="/companies/tcs-digital" className="text-brand-600 font-bold hover:underline">Apply / Details</Link>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CompanyLogo logoUrl="https://logo.clearbit.com/zoho.com" name="Zoho" size="xs" />
                    <span className="text-xs font-bold text-slate-900">Zoho Corporation</span>
                  </div>
                  <Badge variant="warning" size="xs">Closing Soon</Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Last Date: Aug 10</span>
                  <Link to="/companies/zoho" className="text-brand-600 font-bold hover:underline">Apply / Details</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
