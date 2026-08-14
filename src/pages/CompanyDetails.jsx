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
import { CompanyLogo } from '../components/CompanyLogo';
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
  Star, 
  Award,
  LayoutGrid,
  Hash,
  GitFork,
  Code2,
  Database,
  Link2,
  Tag,
  Cpu,
  Briefcase,
  Boxes,
  Users,
  UserCheck,
  DollarSign,
  TrendingUp,
  Wallet,
  Landmark,
  MapPin,
  Users2,
  Shield,
  GitBranch
} from 'lucide-react';

// Topic to Lucide icon resolver
function getTopicIcon(topic = '') {
  const t = String(topic).toLowerCase().trim();
  if (t.includes('array') || t.includes('matrix') || t.includes('grid')) return LayoutGrid;
  if (t.includes('hash') || t.includes('map') || t.includes('set') || t.includes('dict')) return Hash;
  if (t.includes('tree') || t.includes('bst') || t.includes('trie') || t.includes('graph') || t.includes('dfs') || t.includes('bfs')) return GitFork;
  if (t.includes('string') || t.includes('text') || t.includes('pattern') || t.includes('parsing')) return Code2;
  if (t.includes('dbms') || t.includes('sql') || t.includes('database') || t.includes('query')) return Database;
  if (t.includes('stack') || t.includes('queue') || t.includes('heap') || t.includes('priority')) return Layers;
  if (t.includes('dp') || t.includes('dynamic') || t.includes('greedy') || t.includes('recursion') || t.includes('backtrack')) return Sparkles;
  if (t.includes('system') || t.includes('os') || t.includes('design') || t.includes('thread') || t.includes('concurrency') || t.includes('lld') || t.includes('hld')) return Cpu;
  if (t.includes('link')) return Link2;
  return Tag;
}

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

  const cleanRounds = React.useMemo(() => {
    if (!company || !company.rounds || !Array.isArray(company.rounds)) return [];
    const unique = [];
    const seen = new Set();
    company.rounds.forEach((r) => {
      let title = r.title || `Round ${r.roundNumber || ''}`;
      let cleanTitle = title.replace(/^(Round\s*\d+\s*:\s*)+/i, '').trim();
      const key = cleanTitle.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({
          ...r,
          displayTitle: cleanTitle.toLowerCase().startsWith('round') ? cleanTitle : `Round ${unique.length + 1}: ${cleanTitle}`,
        });
      }
    });
    return unique;
  }, [company]);

  const { sastraQuestionsList, generalQuestionsList } = React.useMemo(() => {
    if (!company) return { sastraQuestionsList: [], generalQuestionsList: [] };

    if (company.sastraQuestions || company.generalQuestions) {
      return {
        sastraQuestionsList: company.sastraQuestions || [],
        generalQuestionsList: company.generalQuestions || [],
      };
    }

    const rawList = company.questions || company.pyqs || [];
    const all = rawList.map((q, idx) => {
      const freqVal = q.likeCount || (100 - idx * 3);
      const rawTags = q.topicTags || q.topic || ['DSA'];
      const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags).split(','))
        .map((t) => (typeof t === 'string' ? t.trim() : String(t)))
        .filter(Boolean);

      return {
        id: q.id || `q_${idx}`,
        problemNumber: q.problemNumber || `#${101 + idx}`,
        question: q.question || q.questionText || 'Practice Problem',
        difficulty: q.difficulty || 'Easy',
        topic: tags[0] || 'DSA',
        topicTags: tags,
        frequency: q.frequency || `${Math.max(60, freqVal)}%`,
        starRating: q.starRating || '★★★★★',
        importanceLabel: q.importanceLabel || 'Very Frequently Asked',
        expectedRound: q.expectedRound || (q.round && q.round.title) || 'Round 2: Technical Interview (DSA & Core CS)',
        isSastraPyq: true,
        leetcodeUrl: q.leetcodeUrl || null,
        hasVerifiedLink: Boolean(q.leetcodeUrl || q.hasVerifiedLink),
      };
    });

    return {
      sastraQuestionsList: all.slice(0, 6),
      generalQuestionsList: all.slice(6),
    };
  }, [company]);

  const wikiFacts = React.useMemo(() => {
    if (!company?.wikiData) return [];
    const wd = company.wikiData;
    const items = [
      { key: 'industry', label: 'Industry', value: wd.industry, icon: Briefcase },
      { key: 'products', label: 'Products', value: wd.products, icon: Boxes },
      { key: 'founders', label: 'Founders', value: wd.founders, icon: Users },
      { key: 'keyPeople', label: 'Key People', value: wd.keyPeople, icon: UserCheck },
      { key: 'revenue', label: 'Revenue', value: wd.revenue, icon: DollarSign },
      { key: 'operatingIncome', label: 'Operating Income', value: wd.operatingIncome, icon: TrendingUp },
      { key: 'netIncome', label: 'Net Income', value: wd.netIncome, icon: Wallet },
      { key: 'totalAssets', label: 'Total Assets', value: wd.totalAssets, icon: Landmark },
      { key: 'headquarters', label: 'Headquarters / Locations', value: wd.headquarters, icon: MapPin },
      { key: 'numEmployees', label: 'Number of Employees', value: wd.numEmployees, icon: Users2 },
      { key: 'parentCompany', label: 'Parent Company', value: wd.parentCompany, icon: Shield },
      { key: 'subsidiaries', label: 'Subsidiaries / Divisions', value: wd.subsidiaries, icon: GitBranch },
    ];
    return items.filter((item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== '');
  }, [company?.wikiData]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading placement intelligence...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Company not found</h2>
        <p className="text-xs text-slate-500">The requested recruitment profile does not exist.</p>
        <Link to="/companies">
          <Button variant="secondary" size="sm">Back to Companies</Button>
        </Link>
      </div>
    );
  }


  const renderQuestionCard = (q, idx) => {
    const rawTags = q.topicTags || q.topic || [];
    const tags = (Array.isArray(rawTags) ? rawTags : String(rawTags).split(','))
      .map((t) => (typeof t === 'string' ? t.trim() : String(t)))
      .filter(Boolean);

    const problemNum = q.problemNumber || `#${101 + (idx || 0)}`;
    const frequency = q.frequency || '100%';
    const starRating = q.starRating || '★★★★★';
    const importanceLabel = q.importanceLabel || 'Very Frequently Asked';
    const expectedRound = q.expectedRound || 'Round 2: Technical Interview (DSA & Core CS)';
    const hasLink = Boolean(q.leetcodeUrl || q.hasVerifiedLink);

    return (
      <div
        key={q.id || idx}
        className="bg-white dark:bg-[#070e1e] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-card hover:border-slate-300 dark:hover:border-slate-700/80 transition-all space-y-3"
      >
        {/* Row 1: Problem #, Title, and Action/Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700/50">
              {problemNum}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {q.question}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Difficulty Pill */}
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${
                q.difficulty === 'Hard'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
                  : q.difficulty === 'Medium'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
              }`}
            >
              {q.difficulty || 'Easy'}
            </span>

            {/* Frequency Badge */}
            <span className="px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
              Freq: {frequency}
            </span>

            {/* LeetCode / Verified Link */}
            {hasLink ? (
              <a
                href={q.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30 font-semibold text-xs hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
              >
                <span>LeetCode</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 text-xs font-medium">
                No verified link
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Stars, Importance Label, Round */}
        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
          <span className="text-amber-500 font-bold tracking-wider">{String(starRating).replace(/☆/g, '')}</span>
          <span className="font-medium text-slate-600 dark:text-slate-300">{importanceLabel}</span>
          <span className="text-slate-400 dark:text-slate-600">•</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{expectedRound}</span>
        </div>

        {/* Row 3: Question Topic Tags (e.g. [icon] Arrays, [#] HashMap) */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
            {tags.map((tag, tagIdx) => {
              const TagIcon = getTopicIcon(tag);
              return (
                <span
                  key={tagIdx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-[#0a2328]/70 border border-teal-200 dark:border-[#114b4f] text-teal-700 dark:text-[#2dd4bf] text-xs font-medium hover:border-teal-400 dark:hover:border-teal-500/50 transition-colors shadow-sm"
                >
                  <TagIcon className="w-3.5 h-3.5 text-teal-600 dark:text-[#2dd4bf] shrink-0" />
                  <span>{tag}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-brand-500/30">
        <div className="flex items-center gap-5">
          <CompanyLogo logoUrl={company.logo || company.logoUrl} name={company.name} size="xl" />
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
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 sm:gap-6 text-sm font-semibold overflow-x-auto no-scrollbar whitespace-nowrap pt-1">
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
          Interview Rounds ({cleanRounds.length})
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
            {/* Placement Facts (Wikipedia Sourced - Rendered only if facts exist) */}
            {wikiFacts.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Company Placement Facts</span>
                  </h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Official Facts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wikiFacts.map((fact) => {
                    const Icon = fact.icon;
                    return (
                      <div
                        key={fact.key}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1 hover:border-brand-300 dark:hover:border-brand-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                          <Icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                          <span>{fact.label}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug break-words">
                          {fact.value}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {company?.wikiData?.wikipediaUrl && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-end text-[11px] text-slate-400 dark:text-slate-500">
                    <a
                      href={company.wikiData.wikipediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-brand-600 dark:hover:text-brand-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>Source: Wikipedia</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Company Overview</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {company.overview || (company.description ? `${company.name} is a premier campus recruiter at SASTRA University. ${company.description}` : `${company.name} recruitment profile and selection archives at SASTRA University.`)}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Hiring Process</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {company.hiringProcess || `The selection process typically spans ${cleanRounds.length > 0 ? cleanRounds.length : 3}-4 rounds, starting with an Online Coding & Aptitude Assessment (OA), followed by Technical DSA interviews, System Design (LLD/HLD), and HR assessment.`}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Eligibility Criteria</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {company.eligibilityCriteria || 'B.Tech / M.Tech students in CSE, IT, ECE, EEE with CGPA 7.5+ and no active backlogs.'}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Preparation Tips</span>
              </h3>
              <ul className="space-y-2.5">
                {(company.preparationTips && Array.isArray(company.preparationTips) && company.preparationTips.length > 0
                  ? company.preparationTips
                  : [
                      'Focus on Core Data Structures: Arrays, HashMaps, Trees, Graphs, and Dynamic Programming.',
                      'Review Object-Oriented Design (OOPs) concepts and Low-Level System Design patterns.',
                      'Practice SQL queries using CTEs, JOINs, and window functions.',
                    ]
                ).map((tip, idx) => (
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
                {(company.frequentlyAskedTopics && Array.isArray(company.frequentlyAskedTopics) && company.frequentlyAskedTopics.length > 0
                  ? company.frequentlyAskedTopics
                  : ['Dynamic Programming', 'Trees & Binary Search Trees', 'Graph Topological Sort', 'System Design (LLD)', 'SQL Queries']
                ).map((topic) => (
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
          {cleanRounds.length > 0 ? (
            cleanRounds.map((round, idx) => (
              <div key={round.id || idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-extrabold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{round.displayTitle}</h3>
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
          {sastraQuestionsList.length > 0 && (
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
                {sastraQuestionsList.map((q, idx) => renderQuestionCard(q, idx))}
              </div>
            </div>
          )}

          {/* 2. General LeetCode & DSA Questions Section */}
          {generalQuestionsList.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                General LeetCode & Practice Problems ({generalQuestionsList.length})
              </h3>
              <div className="space-y-4">
                {generalQuestionsList.map((q, idx) => renderQuestionCard(q, sastraQuestionsList.length + idx))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanyDetails;
