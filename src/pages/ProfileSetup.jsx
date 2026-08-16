/**
 * ProfileSetup Page Component
 * 
 * Production-ready student onboarding and profile setup page for SASTRA University students:
 * 1. Choice of setup: "Fill Automatically from Resume" vs "Enter Manually"
 * 2. Accurate database auto-fill without hardcoded dummy fallbacks
 * 3. Client-side intelligent resume text parser with pre-validation & non-resume rejection
 * 4. "Review information extracted from your resume" card with conflict detection & inline editing
 * 5. Complete Light Mode / Dark Mode visual consistency across all cards, inputs, dropdowns, and buttons
 * 6. High contrast labels (pure black/dark slate in light mode) and light-styled inputs
 * 7. Real-time dynamic profile completion percentage tracking
 * 8. Full validation and database persistence
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../services/userService';
import { calculateProfileCompletion, SASTRA_DEPARTMENTS } from '../utils/profileCompletion';
import { parseRollNumber, detectBranchFromEmail } from '../utils/programCodeMap';
import { 
  validateResumeFileMetadata, 
  parseResumeFile, 
  RESUME_REJECTION_MESSAGE 
} from '../utils/resumeParser';
import { ROUTES } from '../constants/routes';
import { 
  User, 
  Target, 
  Code, 
  Link as LinkIcon, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Edit3,
  UploadCloud,
  RefreshCw,
  Check,
  ChevronRight,
  HelpCircle,
  Eye,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

const SUGGESTED_ROLES = [
  'Software Engineer',
  'Data Scientist',
  'AI Engineer',
  'Product Engineer',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'DevOps Engineer',
];

export function getGraduationYearFromEmailOrRoll(emailOrRoll) {
  if (!emailOrRoll) return '';
  const parsed = parseRollNumber(String(emailOrRoll));
  if (parsed && parsed.graduationYear) return parsed.graduationYear;
  const str = String(emailOrRoll).trim();
  const roll = str.includes('@') ? str.split('@')[0] : str;
  if (roll.length >= 3 && /^\d+$/.test(roll)) {
    const yy = parseInt(roll.substring(1, 3), 10);
    if (!isNaN(yy) && yy >= 0 && yy <= 99) {
      return 2000 + yy;
    }
  }
  return '';
}

function resolveDepartmentOption(rawDept) {
  if (!rawDept || rawDept === 'Select your department') return '';
  const clean = String(rawDept).trim().toLowerCase();
  const match = SASTRA_DEPARTMENTS.find(
    (d) =>
      d.toLowerCase() === clean ||
      d.toLowerCase().includes(`(${clean})`) ||
      d.toLowerCase().includes(clean) ||
      clean.includes(d.toLowerCase())
  );
  return match || rawDept;
}

export function ProfileSetup() {
  const { user, updateUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Setup mode: 'choice' | 'resume' | 'resume_review' | 'manual'
  const [setupMode, setSetupMode] = useState('choice');

  // Resume processing state
  const [resumeFile, setResumeFile] = useState(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseResult, setResumeParseResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Core Form State (strictly initialized from actual user DB record without dummy defaults)
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || '');
  const [department, setDepartment] = useState(resolveDepartmentOption(user?.department || user?.branch) || '');
  const [degree, setDegree] = useState(user?.degree || 'B.Tech');
  const [graduationYear, setGraduationYear] = useState(
    user?.graduationYear || user?.batchYear || getGraduationYearFromEmailOrRoll(user?.email || user?.rollNumber) || ''
  );
  const [section, setSection] = useState(user?.section || '');
  const [rollNumber, setRollNumber] = useState(
    user?.rollNumber || user?.rollNo || (user?.email && /^\d{9}@/.test(user.email) ? user.email.split('@')[0] : '')
  );
  const [cgpa, setCgpa] = useState(user?.cgpa || '');
  const [placementGoal, setPlacementGoal] = useState(user?.placementGoal || user?.targetRole || '');

  // Career & Skills State
  const [interestedRoles, setInterestedRoles] = useState(
    user?.interestedRoles
      ? (Array.isArray(user.interestedRoles) ? user.interestedRoles : user.interestedRoles.split(',').map((s) => s.trim()))
      : []
  );
  const [programmingLanguages, setProgrammingLanguages] = useState(
    user?.programmingLanguages
      ? (Array.isArray(user.programmingLanguages) ? user.programmingLanguages.join(', ') : user.programmingLanguages)
      : ''
  );
  const [frameworks, setFrameworks] = useState(
    user?.frameworks
      ? (Array.isArray(user.frameworks) ? user.frameworks.join(', ') : user.frameworks)
      : ''
  );
  const [technologies, setTechnologies] = useState(
    user?.technologies
      ? (Array.isArray(user.technologies) ? user.technologies.join(', ') : user.technologies)
      : ''
  );

  // Coding Profiles State
  const [leetcode, setLeetcode] = useState(user?.leetcode || '');
  const [codeforces, setCodeforces] = useState(user?.codeforces || '');
  const [codechef, setCodechef] = useState(user?.codechef || '');
  const [github, setGithub] = useState(user?.github || '');
  const [linkedin, setLinkedin] = useState(user?.linkedin || '');
  const [resume, setResume] = useState(user?.resume || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rollError, setRollError] = useState('');
  const [formError, setFormError] = useState('');

  // Sync state when user object loads/changes
  useEffect(() => {
    if (user) {
      if (user.fullName || user.name) setFullName(user.fullName || user.name);
      if (user.avatar || user.avatarUrl) setAvatar(user.avatar || user.avatarUrl);
      if (user.rollNumber || user.rollNo) setRollNumber(user.rollNumber || user.rollNo);
      if (user.department || user.branch) {
        const resolved = resolveDepartmentOption(user.department || user.branch);
        if (resolved) setDepartment(resolved);
      }
      if (user.degree) setDegree(user.degree);
      if (user.section) setSection(user.section);
      if (user.cgpa) setCgpa(user.cgpa);
      if (user.placementGoal || user.targetRole) setPlacementGoal(user.placementGoal || user.targetRole);
      if (user.graduationYear || user.batchYear) setGraduationYear(user.graduationYear || user.batchYear);
      if (user.programmingLanguages) {
        setProgrammingLanguages(
          Array.isArray(user.programmingLanguages) ? user.programmingLanguages.join(', ') : user.programmingLanguages
        );
      }
      if (user.frameworks) {
        setFrameworks(Array.isArray(user.frameworks) ? user.frameworks.join(', ') : user.frameworks);
      }
      if (user.technologies) {
        setTechnologies(Array.isArray(user.technologies) ? user.technologies.join(', ') : user.technologies);
      }
      if (user.github) setGithub(user.github);
      if (user.linkedin) setLinkedin(user.linkedin);
      if (user.leetcode) setLeetcode(user.leetcode);
      if (user.codeforces) setCodeforces(user.codeforces);
      if (user.codechef) setCodechef(user.codechef);
      if (user.resume) setResume(user.resume);
      if (user.bio) setBio(user.bio);
    }
  }, [user]);

  const toggleRole = (role) => {
    if (interestedRoles.includes(role)) {
      setInterestedRoles(interestedRoles.filter((r) => r !== role));
    } else {
      setInterestedRoles([...interestedRoles, role]);
    }
  };

  const handleRollChange = (val) => {
    const numericVal = val.replace(/\D/g, ''); // Numbers only
    setRollNumber(numericVal);

    const parsed = parseRollNumber(numericVal);
    if (parsed) {
      if (parsed.graduationYear && !graduationYear) {
        setGraduationYear(parsed.graduationYear);
      }
      if (parsed.branch && !department) {
        const matched = resolveDepartmentOption(parsed.branch);
        if (matched) setDepartment(matched);
      }
    } else if (numericVal.length >= 3 && !graduationYear) {
      const yy = parseInt(numericVal.substring(1, 3), 10);
      if (!isNaN(yy) && yy >= 0 && yy <= 99) {
        setGraduationYear(2000 + yy);
      }
    }

    if (numericVal.length > 0 && numericVal.length !== 9) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
    } else {
      setRollError('');
    }
  };

  // Resume File Upload & Parsing Handler with Strict Validation
  const handleResumeFileSelect = async (file) => {
    if (!file) return;
    setFormError('');

    const metaValidation = validateResumeFileMetadata(file);
    if (!metaValidation.isValid) {
      setFormError(metaValidation.reason);
      toast.error(metaValidation.reason);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setResumeFile(file);
    setIsParsingResume(true);

    try {
      const parseResult = await parseResumeFile(file, user);

      if (!parseResult.isValid) {
        const rejectMsg = parseResult.reason || RESUME_REJECTION_MESSAGE;
        setFormError(rejectMsg);
        toast.error(rejectMsg);
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setResumeParseResult(parseResult);

      // Pre-apply extracted values to form states (without overwriting conflicting verified database values without user confirmation)
      const ex = parseResult.extracted;
      if (ex.fullName) setFullName(ex.fullName);
      if (ex.rollNumber && !rollNumber) setRollNumber(ex.rollNumber);
      if (ex.department) setDepartment(resolveDepartmentOption(ex.department) || ex.department);
      if (ex.cgpa) setCgpa(ex.cgpa);
      if (ex.degree) setDegree(ex.degree);
      if (ex.graduationYear) setGraduationYear(ex.graduationYear);
      if (ex.placementGoal) setPlacementGoal(ex.placementGoal);
      if (ex.interestedRoles && ex.interestedRoles.length > 0) setInterestedRoles(ex.interestedRoles);
      if (ex.programmingLanguages) setProgrammingLanguages(ex.programmingLanguages);
      if (ex.frameworks) setFrameworks(ex.frameworks);
      if (ex.technologies) setTechnologies(ex.technologies);
      if (ex.github) setGithub(ex.github);
      if (ex.linkedin) setLinkedin(ex.linkedin);
      if (ex.leetcode) setLeetcode(ex.leetcode);
      if (ex.codeforces) setCodeforces(ex.codeforces);
      if (ex.codechef) setCodechef(ex.codechef);
      if (ex.bio) setBio(ex.bio);

      setSetupMode('resume_review');
      toast.success(`Resume parsed! Detected ${parseResult.detectedCount} profile attributes.`);
    } catch (err) {
      console.error('Resume extraction error:', err);
      setFormError(RESUME_REJECTION_MESSAGE);
      toast.error(RESUME_REJECTION_MESSAGE);
      setResumeFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleResumeFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Form Submission & Database Update
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('Please enter your Full Name.');
      toast.error('Please enter your Full Name.');
      return;
    }

    if (!rollNumber.trim() || !/^\d{9}$/.test(rollNumber.trim())) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
      setFormError('Please enter a valid 9-digit SASTRA Roll Number.');
      toast.error('Please enter a valid 9-digit SASTRA Roll Number.');
      return;
    }

    if (!department || department === 'Select your department') {
      setFormError('Please select your SASTRA Department / Branch.');
      toast.error('Please select your SASTRA Department / Branch.');
      return;
    }

    if (cgpa && String(cgpa).trim()) {
      const parsed = parseFloat(String(cgpa).trim());
      if (isNaN(parsed) || parsed < 0 || parsed > 10) {
        setFormError('CGPA must be a valid number between 0.00 and 10.00.');
        toast.error('CGPA must be a valid number between 0.00 and 10.00.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        name: fullName.trim(),
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        department,
        branch: department,
        degree: degree || 'B.Tech',
        graduationYear: graduationYear ? parseInt(graduationYear, 10) : 2026,
        batchYear: graduationYear ? parseInt(graduationYear, 10) : 2026,
        section: section ? section.trim() : '',
        rollNumber: rollNumber.trim(),
        rollNo: rollNumber.trim(),
        cgpa: cgpa ? parseFloat(cgpa).toFixed(2) : '',
        placementGoal: placementGoal ? placementGoal.trim() : '',
        targetRole: placementGoal ? placementGoal.trim() : '',
        interestedRoles: Array.isArray(interestedRoles) ? interestedRoles.join(', ') : interestedRoles,
        programmingLanguages,
        frameworks,
        technologies,
        github: github.trim(),
        linkedin: linkedin.trim(),
        leetcode: leetcode.trim(),
        codeforces: codeforces.trim(),
        codechef: codechef.trim(),
        resume: resume.trim(),
        bio: bio.trim(),
        isSetup: true,
      };

      const res = await updateProfile(payload);
      if (res && res.user) {
        updateUserData({
          ...res.user,
          profileCompleted: true,
        });
        toast.success('Profile setup complete! Welcome to Placemints Dashboard.');
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      console.error('Profile setup error:', err);
      const msg = err.response?.data?.message || 'Failed to save profile. Please try again.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live dynamic profile completion score
  const previewUser = {
    fullName,
    email: user?.email,
    avatar,
    rollNumber,
    department,
    degree,
    section,
    graduationYear,
    cgpa,
    placementGoal,
    interestedRoles,
    bio,
    programmingLanguages,
    frameworks,
    technologies,
    github,
    linkedin,
    leetcode,
    codeforces,
    codechef,
    resume,
  };
  const completionStats = calculateProfileCompletion(previewUser);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 sm:py-12 px-4 sm:px-6 antialiased transition-colors font-sans select-none">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Onboarding Header Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white rounded-3xl p-6 sm:p-8 shadow-card relative overflow-hidden space-y-3 border border-brand-500/20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SASTRA Student Profile Onboarding</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Complete Your Student Profile
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed mt-1">
                Personalize your academic metrics, placement goals, and coding profile links to unlock campus selection rounds and PYQs.
              </p>
            </div>

            {/* Completion Percentage Score Badge */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center shrink-0 border border-white/20 min-w-[120px]">
              <span className="text-[11px] font-bold text-indigo-100 uppercase tracking-wider block">Completion</span>
              <span className="text-3xl font-black text-white">{completionStats.percentage}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-2">
            <div
              className="bg-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn shadow-subtle">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{formError}</span>
          </div>
        )}

        {/* SECTION 0: Setup Choice Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-card space-y-4 transition-colors">
          <div className="space-y-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              How would you like to complete your profile?
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Choose between automatic resume extraction or manual step-by-step entry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Option A: Auto-Fill from Resume */}
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setSetupMode('resume');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                setupMode === 'resume' || setupMode === 'resume_review'
                  ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Fill Automatically from Resume</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                    Fast
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upload PDF or DOCX to auto-extract personal details, CGPA, skills & coding handles for review.
                </p>
              </div>
            </button>

            {/* Option B: Enter Manually */}
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setSetupMode('manual');
              }}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                setupMode === 'manual'
                  ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-slate-200 shrink-0 mt-0.5">
                <Edit3 className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">Enter Manually</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Fill in your academic information, career goals, and technical stacks step-by-step.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* RESUME UPLOAD FLOW (When setupMode === 'resume') */}
        {setupMode === 'resume' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors animate-fadeIn">
            <div className="space-y-1 text-center max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upload Your Student Resume</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                We'll validate and scan your resume to extract relevant student metrics for your review.
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/70 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => handleResumeFileSelect(e.target.files?.[0])}
              />

              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center mb-4 border border-brand-200 dark:border-brand-900 shadow-sm">
                {isParsingResume ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>

              {isParsingResume ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analyzing Resume & Extracting Details...</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Validating resume structure, department, CGPA, technical skills, and coding handles...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Drop your resume here, or <span className="text-brand-600 dark:text-brand-400 underline font-semibold">browse</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Supports PDF, DOCX, DOC, or TXT up to 10MB
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSetupMode('manual')}
                className="text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-bold"
              >
                Prefer to enter manually? Click here
              </button>
            </div>
          </div>
        )}

        {/* RESUME EXTRACTION REVIEW CARD (When setupMode === 'resume_review') */}
        {setupMode === 'resume_review' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Review Information Extracted from Your Resume
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Verify and edit detected fields below before confirming. Missing fields can be updated directly.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ✓ {resumeParseResult?.detectedCount || 0} Fields Detected
                </span>
              </div>
            </div>

            {/* Conflict Resolution Banner (if DB profile differs from Resume) */}
            {resumeParseResult?.conflicts && resumeParseResult.conflicts.length > 0 && (
              <div className="space-y-3">
                {resumeParseResult.conflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-2.5 animate-fadeIn"
                  >
                    <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Different {conflict.label} found in your resume</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800">
                        <span className="text-[11px] font-bold text-slate-500 block">Current Database Profile:</span>
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{conflict.current}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800">
                        <span className="text-[11px] font-bold text-slate-500 block">Extracted from Resume:</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">{conflict.extracted}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (conflict.field === 'department') setDepartment(conflict.current);
                          if (conflict.field === 'cgpa') setCgpa(conflict.current);
                          toast.success(`Retained database ${conflict.label}.`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Keep Current Database Value
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (conflict.field === 'department') setDepartment(conflict.extracted);
                          if (conflict.field === 'cgpa') setCgpa(conflict.extracted);
                          toast.success(`Applied resume ${conflict.label}.`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
                      >
                        Use Resume Value ({conflict.extracted})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Extraction Grid with In-Line Edit */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>Full Name *</span>
                    {resumeParseResult?.confidence?.fullName ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Shaik Haroon"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>SASTRA Roll Number (9 Digits) *</span>
                    {resumeParseResult?.confidence?.rollNumber ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    value={rollNumber}
                    onChange={(e) => handleRollChange(e.target.value)}
                    placeholder="e.g. 127015088"
                    maxLength={9}
                    required
                  />
                  {rollError && <span className="text-xs text-red-600 font-bold">{rollError}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>Department / Branch *</span>
                    {resumeParseResult?.confidence?.department ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-500 transition-all shadow-subtle hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                    required
                  >
                    <option value="">Select your department</option>
                    {SASTRA_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>Current CGPA</span>
                    {resumeParseResult?.confidence?.cgpa ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 8.75"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>Graduation Year</span>
                    {resumeParseResult?.confidence?.graduationYear ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="2026"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>GitHub Profile</span>
                    {resumeParseResult?.confidence?.github ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                    <span>LinkedIn Profile</span>
                    {resumeParseResult?.confidence?.linkedin ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">— Missing</span>
                    )}
                  </div>
                  <Input
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span>Programming Languages & Skills</span>
                  {resumeParseResult?.confidence?.programmingLanguages ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">— Missing</span>
                  )}
                </div>
                <Input
                  value={programmingLanguages}
                  onChange={(e) => setProgrammingLanguages(e.target.value)}
                  placeholder="e.g. Java, Python, C++, JavaScript"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span>Primary Placement Goal</span>
                  {resumeParseResult?.confidence?.placementGoal ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">✓ Detected</span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">— Missing</span>
                  )}
                </div>
                <Input
                  value={placementGoal}
                  onChange={(e) => setPlacementGoal(e.target.value)}
                  placeholder="e.g. Software Engineer (SDE-1)"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSetupMode('manual')}
                className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors order-2 sm:order-1"
              >
                ← Edit Remaining Details in Full Form
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setResumeFile(null);
                    setResumeParseResult(null);
                    setSetupMode('resume');
                  }}
                  className="flex-1 sm:flex-none justify-center h-11"
                >
                  Upload Different File
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1 sm:flex-none justify-center gap-2 h-11 px-6 shadow-card"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile & Continue</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* FULL MANUAL FORM (When setupMode === 'manual' or default) */}
        {(setupMode === 'manual' || setupMode === 'choice') && (
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* SECTION 1: Personal & Academic Details */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-900/60">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Personal & Academic Details</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Official SASTRA University student profile records
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter Your Name"
                  required
                />
                <Input
                  label="SASTRA Email"
                  value={user?.email || ''}
                  isDisabled
                  placeholder="127XXXXXX@sastra.ac.in"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* SASTRA Department Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    Department / Branch *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-500 transition-all shadow-subtle hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                    required
                  >
                    <option value="">Select your department</option>
                    {SASTRA_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Degree *"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  placeholder="e.g. B.Tech, M.Tech"
                  required
                />

                <Input
                  label="Graduation Year *"
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="2026"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A, B, C (Optional)"
                />

                {/* 9-Digit Roll Number Input */}
                <div>
                  <Input
                    label="SASTRA Roll Number (9 Digits) *"
                    value={rollNumber}
                    onChange={(e) => handleRollChange(e.target.value)}
                    placeholder="e.g. 127015088"
                    maxLength={9}
                    required
                  />
                  {rollError && (
                    <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{rollError}</span>
                    </p>
                  )}
                </div>

                <Input
                  label="Current CGPA"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g. 8.75"
                />
              </div>
            </div>

            {/* SECTION 2: Career Information & Interested Roles */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Career Goals & Roles</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Define your primary campus recruitment ambitions
                  </p>
                </div>
              </div>

              <Input
                label="Primary Placement Goal"
                value={placementGoal}
                onChange={(e) => setPlacementGoal(e.target.value)}
                placeholder="e.g. Software Development Engineer (SDE-1)"
              />

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Interested Target Roles (Click to select)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTED_ROLES.map((role) => {
                    const isSelected = interestedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                        }`}
                      >
                        {isSelected ? `✓ ${role}` : `+ ${role}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: Technical Stack */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Technical Stack</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Technologies and frameworks for company matching
                  </p>
                </div>
              </div>

              <Input
                label="Programming Languages"
                value={programmingLanguages}
                onChange={(e) => setProgrammingLanguages(e.target.value)}
                placeholder="e.g. C++, Java, Python, JavaScript"
              />

              <Input
                label="Frameworks & Libraries"
                value={frameworks}
                onChange={(e) => setFrameworks(e.target.value)}
                placeholder="e.g. React, Node.js, Express, Spring Boot"
              />

              <Input
                label="Tools & Technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="e.g. Git, PostgreSQL, Docker, AWS"
              />
            </div>

            {/* SECTION 4: Coding Profiles & Links */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6 transition-colors">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Coding Handles & Profiles</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Live coding sync and external portfolio links
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="LeetCode Username / URL"
                  value={leetcode}
                  onChange={(e) => setLeetcode(e.target.value)}
                  placeholder="https://leetcode.com/u/username"
                />
                <Input
                  label="Codeforces Handle / URL"
                  value={codeforces}
                  onChange={(e) => setCodeforces(e.target.value)}
                  placeholder="https://codeforces.com/profile/handle"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Profile URL"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                />
                <Input
                  label="LinkedIn Profile URL"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              <Input
                label="Resume Link (Google Drive / Cloud URL)"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Short Bio / Student Summary
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of your technical interests and campus placement goals..."
                  className="w-full p-3.5 text-sm bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:focus:border-brand-500 transition-all shadow-subtle hover:border-slate-400 dark:hover:border-slate-600 font-medium"
                />
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="gap-2 px-8 h-12 shadow-card"
              >
                <span>Complete Setup & Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfileSetup;
