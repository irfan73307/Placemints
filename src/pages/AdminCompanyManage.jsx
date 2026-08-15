/**
 * AdminCompanyManage Page
 *
 * Dedicated View / Edit / Manage Single Company Portal (/admin/companies/:id)
 * - Two distinct modes: View Mode & Edit Mode with dirty state confirmation.
 * - Slices data into General Information, SASTRA Placement Intelligence, Questions Manager, and Source Info.
 * - Interactive Website Verification & Official Scraper trigger.
 * - Danger Zone with safe cascading deletion requiring company name confirmation.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Building2,
  Globe,
  ExternalLink,
  Briefcase,
  CheckCircle2,
  Edit,
  Save,
  X,
  Trash2,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  FileCode2,
  Layers,
  Sparkles,
  HelpCircle,
  Clock,
  ShieldCheck,
  PlusCircle,
  Cpu,
  Check,
} from 'lucide-react';
import {
  getAdminCompanyDetails,
  updateAdminCompany,
  deleteAdminCompany,
  verifyCompanyWebsite,
  scrapeCompanyOfficialInfo,
  deleteCompanyQuestion,
  previewOfficialRefresh,
  applyOfficialRefresh,
} from '../services/adminService';
import { ROUTES } from '../constants/routes';
import CompanyLogo from '../components/CompanyLogo';
import Badge from '../components/Badge';
import { useToast } from '../contexts/ToastContext';

export default function AdminCompanyManage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Question sub-editor states
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionTopic, setNewQuestionTopic] = useState('DSA');
  const [newQuestionDiff, setNewQuestionDiff] = useState('Medium');
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);

  // Unsaved changes discard modal
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Website verification & scraping states
  const [isVerifyingWebsite, setIsVerifyingWebsite] = useState(false);
  const [isScraping, setIsScraping] = useState(false);

  // Re-verification & Preview comparison state
  const [previewComparison, setPreviewComparison] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplyingRefresh, setIsApplyingRefresh] = useState(false);

  const fetchDetails = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminCompanyDetails(id);
      const c = res.company;
      setCompany(c);
      const state = {
        name: c.name || '',
        website: c.website || c.officialWebsite || '',
        officialWebsite: c.officialWebsite || '',
        officialDomain: c.officialDomain || '',
        officialDescription: c.officialDescription || c.description || '',
        industry: c.industry || 'Technology & Engineering',
        headquarters: c.headquarters || 'Chennai / Global',
        foundedYear: c.foundedYear || '',
        officialServices: c.officialServices || '',
        officialTechnologies: c.officialTechnologies || '',
        customLogo: c.customLogo || '',
        logo: c.logo || '',
        tier: c.tier || 'Tier 2',
        ctc: c.ctc || 'Competitive',
        avgCtc: c.avgCtc || 0,
        sector: c.sector || 'IT',
        tags: c.tags || 'IT Services',
        description: c.description || '',
        eligibilityCriteria: c.eligibilityCriteria || '',
        selectionProcess: c.selectionProcess || '',
        placementNotes: c.placementNotes || '',
        questions: c.questions || [],
        rounds: c.rounds || [],
      };
      setFormData(state);
      setInitialFormState(JSON.stringify(state));
    } catch (err) {
      console.error('Failed to load company details:', err);
      toast.error('Failed to retrieve company details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Check if form is dirty
  const isDirty = useMemoDirty(formData, initialFormState);

  function useMemoDirty(form, initial) {
    try {
      return JSON.stringify(form) !== initial;
    } catch (e) {
      return false;
    }
  }

  // Handle Form Change
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save changes to database
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Company Name is required.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateAdminCompany(company.id, formData);
      toast.success(res.message || 'Company updated successfully.');
      setIsEditing(false);
      fetchDetails();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error(err.response?.data?.message || 'Failed to save company changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel edit with discard check
  const handleCancelClick = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      setIsEditing(false);
    }
  };

  const handleDiscardConfirm = () => {
    try {
      setFormData(JSON.parse(initialFormState));
    } catch (e) {}
    setShowDiscardModal(false);
    setIsEditing(false);
  };

  // Verify website URL action
  const handleVerifyWebsite = async () => {
    setIsVerifyingWebsite(true);
    try {
      const res = await verifyCompanyWebsite(company.id, formData.website || formData.officialWebsite);
      toast.success(res.message || 'Official website verified online!');
      fetchDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Website verification failed.');
    } finally {
      setIsVerifyingWebsite(false);
    }
  };

  // Trigger Re-Verification & Preview Comparison Modal
  const handleTriggerPreviewRefresh = async () => {
    const targetWebsite = formData.website || formData.officialWebsite;
    if (!targetWebsite || !targetWebsite.trim()) {
      toast.error('Please enter an official website URL first.');
      return;
    }

    setIsPreviewing(true);
    try {
      const res = await previewOfficialRefresh(company.id, targetWebsite);
      setPreviewComparison(res);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Official website could not be verified. Existing company information has been preserved.'
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  // Apply Verified Official Information
  const handleApplyRefresh = async () => {
    if (!previewComparison?.official) return;

    setIsApplyingRefresh(true);
    try {
      const res = await applyOfficialRefresh(company.id, {
        website: previewComparison.official.website,
        selectedData: previewComparison.official,
      });
      toast.success(res.message || 'Official company information updated. All placement data preserved.');
      setPreviewComparison(null);
      setIsEditing(false);
      fetchDetails();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Official website could not be verified. Existing company information has been preserved.'
      );
    } finally {
      setIsApplyingRefresh(false);
    }
  };

  // Scrape official website action
  const handleScrapeOfficial = async () => {
    handleTriggerPreviewRefresh();
  };

  // Delete question from company
  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteCompanyQuestion(questionId);
      toast.success('Question removed.');
      setFormData((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
    } catch (err) {
      toast.error('Failed to remove question.');
    }
  };

  // Add new question handler
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) {
      toast.error('Question text cannot be blank.');
      return;
    }
    const newQ = {
      id: `temp-${Date.now()}`,
      isNew: true,
      questionText: newQuestionText.trim(),
      topicTags: newQuestionTopic.trim() || 'DSA',
      difficulty: newQuestionDiff,
      year: new Date().getFullYear(),
      likeCount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      questions: [newQ, ...prev.questions],
    }));
    setNewQuestionText('');
    setShowAddQuestionModal(false);
    toast.success('Question added to queue (Click "Save Changes" to commit).');
  };

  // Safe delete handler
  const handleDeleteCompany = async () => {
    if (deleteConfirmInput.trim().toLowerCase() !== company.name.trim().toLowerCase()) {
      toast.error(`Please type "${company.name}" exactly to confirm deletion.`);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAdminCompany(company.id);
      toast.success(`Company "${company.name}" has been permanently deleted.`);
      navigate(ROUTES.ADMIN_COMPANIES);
    } catch (err) {
      console.error('Delete company failed:', err);
      toast.error(err.response?.data?.message || 'Failed to delete company.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Company Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested company does not exist in the database.</p>
        <Link
          to={ROUTES.ADMIN_COMPANIES}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Company Management</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to={ROUTES.ADMIN_COMPANIES}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Companies Directory</span>
        </Link>

        {/* Mode Actions */}
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all hover:scale-[1.02]"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Company</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Changes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <CompanyLogo
            name={formData.name}
            logo={formData.logo}
            customLogo={formData.customLogo}
            domain={formData.officialDomain}
            size="xl"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {formData.name}
              </h1>
              <Badge variant="brand" size="xs">
                {formData.tier || 'Tier 2'}
              </Badge>
              {company.manuallyVerified ? (
                <Badge variant="warning" size="xs">
                  Manually Verified
                </Badge>
              ) : company.officialDomain ? (
                <Badge variant="success" size="xs">
                  Verified Official
                </Badge>
              ) : (
                <Badge variant="neutral" size="xs">
                  Pending Verification
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
              <span>{formData.industry}</span>
              <span>•</span>
              <span>{formData.headquarters}</span>
            </p>

            {formData.website && (
              <a
                href={formData.website.startsWith('http') ? formData.website : `https://${formData.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 pt-1"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{formData.officialDomain || formData.website}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Official Actions */}
        <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
          <button
            type="button"
            onClick={handleVerifyWebsite}
            disabled={isVerifyingWebsite || (!formData.website && !formData.officialWebsite)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-40"
            title="Ping official website"
          >
            {isVerifyingWebsite ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5 text-brand-600" />}
            <span>Verify Website</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerPreviewRefresh}
            disabled={isPreviewing || (!formData.website && !formData.officialWebsite)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-colors disabled:opacity-40"
            title="Verify website & preview refreshing official company information"
          >
            {isPreviewing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            <span>Verify & Refresh Info</span>
          </button>
        </div>
      </div>

      {/* Main Content Form / View */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* SECTION 1: GENERAL COMPANY INFORMATION */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>General Company Information</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400">Official Website & Profile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Company Name *</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 dark:text-white py-2">{formData.name}</p>
              )}
            </div>

            {/* Official Website */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Official Website URL</label>
                {(formData.website || formData.officialWebsite) && (
                  <button
                    type="button"
                    onClick={handleTriggerPreviewRefresh}
                    disabled={isPreviewing}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Preview & Refresh Info</span>
                  </button>
                )}
              </div>
              {isEditing ? (
                <input
                  type="url"
                  placeholder="https://www.company.com"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
                  {formData.website || 'None'}
                </p>
              )}
            </div>

            {/* Official Domain */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Canonical Domain</label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="company.com"
                  value={formData.officialDomain}
                  onChange={(e) => handleChange('officialDomain', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
                  {formData.officialDomain || 'Auto-resolved from website'}
                </p>
              )}
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Industry / Sector</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">{formData.industry}</p>
              )}
            </div>

            {/* Headquarters */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Headquarters</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => handleChange('headquarters', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">{formData.headquarters}</p>
              )}
            </div>

            {/* Custom Logo URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Custom Logo URL (Overrides Auto-Logo)</label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.customLogo || ''}
                  onChange={(e) => handleChange('customLogo', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
                  {formData.customLogo || 'Using auto-resolved favicon logo'}
                </p>
              )}
            </div>

            {/* Official Services */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Core Services & Solutions (Comma-separated)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.officialServices}
                  onChange={(e) => handleChange('officialServices', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
                  {formData.officialServices || 'None specified'}
                </p>
              )}
            </div>

            {/* Official Technologies */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Key Technology Focus (Comma-separated)</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.officialTechnologies}
                  onChange={(e) => handleChange('officialTechnologies', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 py-2">
                  {formData.officialTechnologies || 'None specified'}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Official Company Description</label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={formData.officialDescription}
                  onChange={(e) => handleChange('officialDescription', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed py-2">
                  {formData.officialDescription || formData.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: PLACEMENT INFORMATION (PLACEMINTS DB) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>SASTRA Placement Information</span>
            </h2>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Owned solely by Placemints Database
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CTC / Package */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Package / CTC</label>
              {isEditing ? (
                <input
                  type="text"
                  placeholder="e.g. 12 LPA or ₹24.0 - 45.0 LPA"
                  value={formData.ctc}
                  onChange={(e) => handleChange('ctc', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-bold text-slate-900 dark:text-white py-2">{formData.ctc}</p>
              )}
            </div>

            {/* Tier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Dream Tier Category</label>
              {isEditing ? (
                <select
                  value={formData.tier}
                  onChange={(e) => handleChange('tier', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="Super Dream">Super Dream (&gt;= 15 LPA)</option>
                  <option value="Dream">Dream (8 - 15 LPA)</option>
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Mass Recruiter">Mass Recruiter</option>
                  <option value="Core Engineering">Core Engineering</option>
                </select>
              ) : (
                <p className="text-xs font-bold text-slate-900 dark:text-white py-2">{formData.tier}</p>
              )}
            </div>

            {/* Eligibility Criteria */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Eligibility Criteria (CGPA & Departments)</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.eligibilityCriteria}
                  onChange={(e) => handleChange('eligibilityCriteria', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 py-2">
                  {formData.eligibilityCriteria || 'B.Tech / M.Tech (CSE, IT, ECE, EEE) with CGPA 7.5+ and no active backlogs.'}
                </p>
              )}
            </div>

            {/* Selection Process */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Selection Process & Assessment Details</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.selectionProcess}
                  onChange={(e) => handleChange('selectionProcess', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 py-2">
                  {formData.selectionProcess || 'Online Assessment (OA) -> Technical DSA Round -> System Design -> HR Round'}
                </p>
              )}
            </div>

            {/* Placement Notes */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Placement Notes & Preparation Guidance</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.placementNotes}
                  onChange={(e) => handleChange('placementNotes', e.target.value)}
                  placeholder="Special instructions for SASTRA students..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 py-2">
                  {formData.placementNotes || 'No custom placement notes recorded yet.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: INTERVIEW & OA QUESTIONS MANAGEMENT */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <FileCode2 className="w-4 h-4 text-indigo-600" />
                <span>Interview & Assessment Questions ({formData.questions?.length || 0})</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Online Assessment questions, Coding challenges, and SASTRA previous question papers
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddQuestionModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 font-bold text-xs transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          {/* Questions List (Scrollable Container for Long Question Pools) */}
          {formData.questions && formData.questions.length > 0 ? (
            <div className="max-h-[460px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {formData.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-slate-400 font-mono">#{idx + 1}</span>
                      <Badge
                        variant={
                          q.difficulty === 'Hard' ? 'danger' : q.difficulty === 'Easy' ? 'success' : 'warning'
                        }
                        size="xs"
                      >
                        {q.difficulty || 'Medium'}
                      </Badge>
                      <Badge variant="brand" size="xs">
                        {q.topicTags || q.topic || 'DSA'}
                      </Badge>
                      {q.isNew && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
                      {q.questionText || q.question}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors shrink-0"
                    title="Remove Question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              No interview questions archived yet for this company. Click "Add Question" to attach OA problems.
            </div>
          )}
        </div>

        {/* SECTION 4: SOURCE TRACKING & AUDIT METADATA */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 text-xs text-slate-500 dark:text-slate-400">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Audit & Source Tracking Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div>
              <span className="block font-bold text-slate-700 dark:text-slate-300">Source Type:</span>
              <span className="font-mono text-[11px]">{company.officialSourceType || 'official_website'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-700 dark:text-slate-300">Last Scraped:</span>
              <span>{company.officialDataLastUpdated ? new Date(company.officialDataLastUpdated).toLocaleString() : 'Not Scraped'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-700 dark:text-slate-300">Last Modified By:</span>
              <span>{company.updatedBy || 'System Admin'}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-700 dark:text-slate-300">Last Updated:</span>
              <span>{new Date(company.updatedAt || company.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: DANGER ZONE (SAFE CASCADING DELETION) */}
        <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Delete Company Record</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Permanently delete this company, all associated selection rounds, questions pool, and student bookmarks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(true);
                setDeleteConfirmInput('');
              }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/20 transition-all shrink-0 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Company</span>
            </button>
          </div>
        </div>
      </form>

      {/* MODAL 1: ADD QUESTION MODAL */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Add Interview / OA Question</span>
              </h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Problem Title / Question *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Find minimum operations to make an array sorted..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Topic Tags</label>
                  <input
                    type="text"
                    placeholder="e.g. Graphs, DP, SQL"
                    value={newQuestionTopic}
                    onChange={(e) => setNewQuestionTopic(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">Difficulty</label>
                  <select
                    value={newQuestionDiff}
                    onChange={(e) => setNewQuestionDiff(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
              >
                Attach Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DISCARD UNSAVED CHANGES MODAL */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Discard Unsaved Changes?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              You have unsaved edits in this form. If you discard now, your modifications will be lost.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Continue Editing
              </button>
              <button
                onClick={handleDiscardConfirm}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SAFE DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete {company.name}?</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Danger Zone Action</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p>
                This will permanently delete <strong className="text-slate-900 dark:text-white">{company.name}</strong>{' '}
                and all associated placement questions, selection stages, and student bookmarks.
              </p>

              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Type <span className="font-mono text-red-600 font-black">{company.name}</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder={company.name}
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCompany}
                disabled={
                  isDeleting ||
                  deleteConfirmInput.trim().toLowerCase() !== company.name.trim().toLowerCase()
                }
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-500/20 transition-all flex items-center gap-1.5"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PREVIEW BEFORE REFRESH COMPARISON MODAL */}
      {previewComparison && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                    Official Verification & Refresh
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Domain Reachable: {previewComparison.official?.domain}</span>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Preview Official Information Refresh
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Compare current database records with verified official data from{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{previewComparison.official?.website}</strong>.
                </p>
              </div>

              <button
                onClick={() => setPreviewComparison(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preserved Placement Data Guarantee Notice */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Placement Information Protection Guarantee</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 leading-relaxed">
                Applying official information will <strong>ONLY</strong> update general company profile metadata.
                All SASTRA placement data will remain 100% untouched:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-semibold text-emerald-900 dark:text-emerald-200">
                <div className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  ✓ {previewComparison.placementPreserved?.questionsCount || 0} Archived Questions (Preserved)
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  ✓ {previewComparison.placementPreserved?.roundsCount || 0} Selection Rounds (Preserved)
                </div>
                <div className="p-2 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  ✓ CTC: {previewComparison.placementPreserved?.ctc || 'Competitive'} (Preserved)
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Column 1: Current DB Record */}
              <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 pb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500">
                    Current Database Record
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Existing
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Company Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{previewComparison.current?.name}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Industry / Sector</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{previewComparison.current?.industry}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Headquarters</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{previewComparison.current?.headquarters}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Description</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3">
                      {previewComparison.current?.description}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Services</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{previewComparison.current?.services}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Technologies</span>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{previewComparison.current?.technologies}</p>
                  </div>
                </div>
              </div>

              {/* Column 2: New Official Scraped Source */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800/60 pb-2">
                  <span className="font-extrabold uppercase tracking-wider text-[10px] text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>New Official Source ({previewComparison.official?.domain})</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    Verified
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Official Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{previewComparison.official?.name}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Industry / Sector</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{previewComparison.official?.industry}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Headquarters</span>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{previewComparison.official?.headquarters}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Verified Description</span>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-3">
                      {previewComparison.official?.description}
                    </p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Core Services</span>
                    <p className="font-semibold text-cyan-700 dark:text-cyan-300">{previewComparison.official?.services || 'None specified'}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Key Technologies</span>
                    <p className="font-semibold text-indigo-700 dark:text-indigo-300">{previewComparison.official?.technologies || 'None specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewComparison(null)}
                disabled={isApplyingRefresh}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreviewComparison(null);
                  handleSave();
                }}
                disabled={isApplyingRefresh}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors"
              >
                Keep Existing Information (Save URL Only)
              </button>

              <button
                type="button"
                onClick={handleApplyRefresh}
                disabled={isApplyingRefresh}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isApplyingRefresh ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Apply Official Information</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

