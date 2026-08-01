/**
 * Dashboard Page Component
 * 
 * Personalized student placement dashboard featuring:
 * - Dynamic Welcome banner with real student name, responsive department, year, CGPA, and Placement Goal.
 * - Profile Completion Progress bar (0% -> 100%).
 * - Smart Student Insights & Actionable Next Steps.
 * - Real Saved Companies list synced with database (displays "No saved companies yet." when empty).
 * - Target Company Archives search and top placement statistics.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { CompanyCard } from '../components/CompanyCard';
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
  TrendingUp,
  CheckCircle2
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

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* 1. Personalized Student Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>SASTRA University Campus Placement Dashboard</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.fullName || user?.name || 'SASTRA Student'} 👋
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-100 font-medium pt-1">
              <span>
                Dept:{' '}
                <strong className="text-white hidden sm:inline">{formattedDept.desktop}</strong>
                <strong className="text-white inline sm:hidden">{formattedDept.mobile}</strong>
              </span>
              <span>•</span>
              <span>Batch: <strong className="text-white">{user?.graduationYear || user?.batchYear || '2026'}</strong></span>
              <span>•</span>
              <span>CGPA: <strong className="text-amber-300">{user?.cgpa || '8.50'}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1 text-white">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Goal: <strong className="text-white">{user?.placementGoal || user?.targetRole || 'Software Engineer'}</strong>
              </span>
            </div>
          </div>

          {/* Completion Progress Metric Box */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center shrink-0 border border-white/20 sm:min-w-[180px]">
            <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider block">Profile Completion</span>
            <span className="text-3xl font-black text-white">{completion.percentage}%</span>
            <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Search & Smart Insights Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Search Bar & Top Recruiters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies (Google, Microsoft, Amazon), PYQs, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm shadow-subtle placeholder-slate-400 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Search
            </Button>
          </form>

          {/* Saved Companies Section (Synced directly with Database) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-brand-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Saved Companies</h2>
              </div>
              <Badge variant="brand">{savedCompanies.length} Saved</Badge>
            </div>

            {savedCompanies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedCompanies.map((company) => (
                  <Link
                    key={company.id}
                    to={`/companies/${company.slug || company.id}`}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-brand-300 shadow-subtle transition-all flex items-center gap-3 group"
                  >
                    <img
                      src={company.logo || company.logoUrl}
                      alt={company.name}
                      className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{company.ctc || 'Tier 1 Recruiter'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                <Bookmark className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No saved companies yet.</p>
                <p className="text-xs text-slate-400">
                  Browse company archives and click the bookmark button to save target recruiters.
                </p>
              </div>
            )}
          </div>

          {/* Top Recruiter Archives Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Campus Recruiters</h2>
              <Link to={ROUTES.COMPANIES} className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
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

        {/* Right 1 Column: Smart Insights & Next Action */}
        <div className="space-y-6">
          {/* Smart Student Insights */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Smart Student Insights</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1 border border-white/5">
                <div className="flex justify-between font-semibold text-slate-200">
                  <span>Profile Completion</span>
                  <span className="text-amber-300 font-extrabold">{completion.percentage}%</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {completion.percentage === 100
                    ? 'Your profile is fully completed and ready for placements!'
                    : `Your profile is ${completion.percentage}% complete.`}
                </p>
              </div>

              {completion.suggestions.map((sug, idx) => (
                <div key={idx} className="p-3 bg-white/10 rounded-xl text-xs text-slate-200 flex items-start gap-2 border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{sug}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/10">
              <Link to={ROUTES.PROFILE}>
                <Button variant="primary" size="sm" className="w-full justify-center bg-brand-500 hover:bg-brand-600 text-white">
                  Update Profile Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Suggested Next Action */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Suggested Next Action</span>
            </h3>

            <div className="p-4 bg-brand-50/50 dark:bg-brand-950/30 rounded-xl border border-brand-100 dark:border-brand-900/40 space-y-2">
              <h4 className="text-xs font-bold text-brand-950 dark:text-brand-100">Practice Top Interview Questions</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Review Google, Microsoft, and Amazon SASTRA campus questions with time and space complexities.
              </p>
              <Link to={ROUTES.COMPANIES} className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline pt-1">
                <span>Start Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
