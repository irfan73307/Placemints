/**
 * Dashboard Page Component
 * 
 * Premium Purple #5B4CF5 Welcome Hero Redesign (Matching Reference Mockup):
 * - Full-width rounded container with purple gradient and soft ambient glows.
 * - Top Badge: SASTRA University Campus Placement Dashboard.
 * - Welcome Headline: Welcome back, {Student Name} 👋.
 * - 4 Glassmorphic Info Chips: Department, Batch, CGPA, Placement Goal with custom icons & colors.
 * - Vector Student Illustration on the right side (~30-35% width, floating, bottom aligned).
 * - Profile Completion Card placed outside the hero banner in right sidebar column.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CompanyCard } from '../components/CompanyCard';
import { CompanyLogo } from '../components/CompanyLogo';
import { StudentIllustration } from '../components/StudentIllustration';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import { getCompanies } from '../services/companyService';
import { calculateProfileCompletion } from '../utils/profileCompletion';
import { getFormattedDepartment } from '../utils/departmentUtils';
import { ROUTES } from '../constants/routes';
import { 
  Sparkles, 
  Target, 
  Bookmark, 
  Search, 
  ArrowRight, 
  CheckCircle2,
  Building2,
  BookOpen,
  User,
  Calendar,
  ChevronRight,
  GraduationCap,
  Star
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { savedCompanies, toggleSaveCompany, isCompanySaved } = useLibrary();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.COMPANIES}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
      {/* 1. Redesigned Welcome Hero Banner (Matching Reference Image 1:1) */}
      <div className="bg-gradient-to-r from-[#4F46E5] via-[#5B4CF5] to-[#3730A3] text-white rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden border border-white/20">
        {/* Subtle Ambient Background Decorative Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6 relative z-10">
          {/* Left Side Content */}
          <div className="flex-1 space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white/95 text-xs font-semibold shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>SASTRA University Campus Placement Dashboard</span>
            </div>

            {/* Large Welcome Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-snug">
              Welcome back, {user?.fullName || user?.name || 'Shaik Irfan'} 👋
            </h1>

            {/* 4 Clean Glassmorphic Information Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Card 1: Department */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 shadow-sm">
                <div className="p-2.5 rounded-xl bg-blue-500/25 text-blue-300 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200/90 block leading-tight">Department</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white block truncate mt-0.5" title={formattedDept.desktop}>
                    {formattedDept.desktop}
                  </span>
                </div>
              </div>

              {/* Card 2: Batch */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 shadow-sm">
                <div className="p-2.5 rounded-xl bg-indigo-500/25 text-indigo-200 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200/90 block leading-tight">Batch</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white block mt-0.5">
                    {user?.graduationYear || user?.batchYear || '2026'}
                  </span>
                </div>
              </div>

              {/* Card 3: CGPA (Soft Yellow Accent) */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 shadow-sm">
                <div className="p-2.5 rounded-xl bg-amber-500/25 text-amber-300 shrink-0">
                  <Star className="w-5 h-5 fill-amber-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200/90 block leading-tight">CGPA</span>
                  <span className="text-xs sm:text-sm font-black text-amber-300 block mt-0.5">
                    {user?.cgpa || '8.5475'}
                  </span>
                </div>
              </div>

              {/* Card 4: Placement Goal (Green Accent) */}
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white/15 hover:scale-[1.02] transition-all duration-200 shadow-sm">
                <div className="p-2.5 rounded-xl bg-emerald-500/25 text-emerald-300 shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-slate-200/90 block leading-tight">Goal</span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-200 block truncate mt-0.5" title={user?.placementGoal || 'Software Engineer (SDE-1)'}>
                    {user?.placementGoal || user?.targetRole || 'Software Engineer (SDE-1)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Vector Student Illustration (Occupies 30-35% width, floating, bottom aligned) */}
          <div className="hidden md:block w-72 lg:w-96 shrink-0 relative z-10 self-end -mb-8 -mr-4 transform hover:scale-105 transition-transform duration-300">
            <StudentIllustration className="drop-shadow-2xl" />
          </div>
        </div>
      </div>

      {/* 2. Main Content Grid: Search, Recruiters & Separate Profile Completion Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Search Bar, Quick Actions, Saved Companies & Top Recruiters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search target companies (Google, TCS, Zoho, Amazon), PYQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm shadow-subtle placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-all font-medium"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-brand-600 hover:bg-brand-700 shadow-sm"
            >
              Search
            </Button>
          </form>

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

          {/* Saved Target Companies Section */}
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

        {/* Right 1 Column: Profile Completion Card (Outside Hero) & Upcoming Drives */}
        <div className="space-y-6">
          {/* Profile Completion Card (Separate Card Outside Hero Banner) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-3xl font-black text-brand-600">{completion.percentage}%</span>
                <h3 className="text-xs font-bold text-slate-800 mt-0.5">
                  {completion.percentage === 100 ? "Your profile is 100% complete!" : "You're halfway there!"}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-brand-100 flex items-center justify-center text-xs font-black text-brand-600 bg-brand-50 shadow-inner">
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

          {/* Upcoming Placement Drives Card */}
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
