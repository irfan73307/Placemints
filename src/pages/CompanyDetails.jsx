/**
 * CompanyDetails Page Component
 * 
 * Displays complete company selection information:
 * Overview, Hiring Process, Eligibility Criteria, Salary Package (CTC),
 * Interview Rounds, Preparation Tips, Frequently Asked Topics,
 * SASTRA Previous Interview Questions section (stars & expected rounds),
 * and LeetCode Questions with problem details and complexities.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getCompanyById } from '../services/companyService';
import { useLibrary } from '../contexts/LibraryContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useToast } from '../contexts/ToastContext';
import { 
  Building2, 
  Bookmark, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Layers, 
  Sparkles,
  ArrowLeft,
  Clock,
  Code,
  Star,
  Award
} from 'lucide-react';

export function CompanyDetails() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const { toggleSaveCompany, isCompanySaved } = useLibrary();

  const [company, setCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const saved = company ? isCompanySaved(company.id) || isCompanySaved(company.slug) : false;

  useEffect(() => {
    async function loadCompanyDetails() {
      setIsLoading(true);
      try {
        const res = await getCompanyById(id);
        if (res && res.company) {
          setCompany(res.company);
        }
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanyDetails();
  }, [id]);

  useEffect(() => {
    if (location.hash === '#rounds') {
      setActiveTab('rounds');
    } else if (location.hash === '#pyqs') {
      setActiveTab('pyqs');
    }
  }, [location.hash]);

  const handleToggleSave = async () => {
    if (!company) return;
    try {
      const res = await toggleSaveCompany(company.id);
      const nowSaved = res && res.isSaved !== undefined ? res.isSaved : !saved;
      toast.success(nowSaved ? `Saved ${company.name}!` : `Removed ${company.name} from saved.`);
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-medium">Loading company archive...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Company Not Found</h2>
        <p className="text-xs text-slate-500">The requested company archive could not be located.</p>
        <Link to="/companies">
          <Button variant="secondary" size="sm">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  const renderQuestionCard = (q) => (
    <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
              {q.problemNumber}
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">{q.question}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pl-1">
            <span className="text-amber-500 font-bold tracking-wider">{q.starRating}</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">{q.importanceLabel}</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{q.expectedRound}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Medium' ? 'warning' : 'success'}>
            {q.difficulty}
          </Badge>
          <Badge variant="neutral">Freq: {q.frequency}</Badge>
          {q.leetcodeUrl && (
            <a
              href={q.leetcodeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-semibold text-xs hover:bg-brand-100 dark:hover:bg-brand-900 transition-colors"
            >
              <span>LeetCode</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Expected Approach</span>
          <p className="text-slate-600 dark:text-slate-400">{q.expectedApproach}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Time Complexity</span>
          <p className="font-mono text-brand-600 dark:text-brand-400 font-bold">{q.timeComplexity}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">Space Complexity</span>
          <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{q.spaceComplexity}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Back Link */}
      <div>
        <Link to="/companies" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies Directory</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-5">
          <img
            src={company.logo || company.logoUrl}
            alt={company.name}
            className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-slate-700 shadow-md shrink-0"
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{company.name}</h1>
              <Badge variant="brand">{company.tier || 'Tier 1'}</Badge>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">{company.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span>Salary Package: <strong className="text-emerald-400">{company.ctc || '18-24 LPA'}</strong></span>
              <span>•</span>
              <span>Sector: <strong className="text-slate-200">{company.sector || 'Technology'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={saved ? 'secondary' : 'primary'}
            onClick={handleToggleSave}
            className="gap-2"
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-brand-600 text-brand-600' : ''}`} />
            <span>{saved ? 'Saved' : 'Save Company'}</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview & Tips
        </button>
        <button
          onClick={() => setActiveTab('rounds')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'rounds'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Interview Rounds ({company.rounds ? company.rounds.length : 0})
        </button>
        <button
          onClick={() => setActiveTab('pyqs')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'pyqs'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          PYQs & LeetCode ({company.pyqs ? company.pyqs.length : 0})
        </button>
      </div>

      {/* TAB 1: Company Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Company Overview</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{company.overview}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Hiring Process</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{company.hiringProcess}</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Eligibility Criteria</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{company.eligibilityCriteria}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Preparation Tips</span>
              </h3>
              <ul className="space-y-2.5">
                {company.preparationTips && company.preparationTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0 mt-1.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span>Frequently Asked Topics</span>
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {company.frequentlyAskedTopics && company.frequentlyAskedTopics.map((topic) => (
                  <Badge key={topic} variant="brand">{topic}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Interview Rounds */}
      {activeTab === 'rounds' && (
        <div className="space-y-4">
          {company.rounds && company.rounds.length > 0 ? (
            company.rounds.map((round, idx) => (
              <div key={round.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-extrabold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{round.title}</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-10">{round.description}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">No round breakdown available.</p>
          )}
        </div>
      )}

      {/* TAB 3: SASTRA Previous Questions & LeetCode Problems */}
      {activeTab === 'pyqs' && (
        <div className="space-y-8">
          {/* 1. SASTRA Previous Interview Questions Section (FIRST) */}
          {company.sastraQuestions && company.sastraQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 rounded-2xl border border-brand-200 dark:border-brand-800/50 flex items-center gap-3">
                <Award className="w-6 h-6 text-brand-600 dark:text-brand-400 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-brand-950 dark:text-brand-100">
                    SASTRA Previous Interview Questions
                  </h3>
                  <p className="text-xs text-brand-800 dark:text-brand-300">
                    Actual campus drive questions reported by SASTRA University students. Ordered by frequency rating.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {company.sastraQuestions.map(renderQuestionCard)}
              </div>
            </div>
          )}

          {/* 2. General LeetCode & DSA Questions Section */}
          {company.generalQuestions && company.generalQuestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                General LeetCode & Practice Problems ({company.generalQuestions.length})
              </h3>
              <div className="space-y-4">
                {company.generalQuestions.map(renderQuestionCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanyDetails;
