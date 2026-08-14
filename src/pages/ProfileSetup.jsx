/**
 * ProfileSetup Page Component
 * 
 * Comprehensive student onboarding wizard.
 * Collects required personal, academic, career, technical, and coding profile information.
 * Enforces SASTRA department dropdown selection & 9-digit numeric roll number validation.
 * Sets profileCompleted = true upon submission before unlocking Dashboard.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../services/userService';
import { calculateProfileCompletion, SASTRA_DEPARTMENTS } from '../utils/profileCompletion';
import { detectBranchFromEmail } from '../utils/programCodeMap';
import { ROUTES } from '../constants/routes';
import { 
  User, 
  Target, 
  Code, 
  Link as LinkIcon, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2
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
  if (!rawDept) return '';
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

  const defaultRollNumber = user?.rollNumber || user?.rollNo || (user?.email ? user.email.split('@')[0] : '');
  const computedGraduationYear = user?.graduationYear || user?.batchYear || getGraduationYearFromEmailOrRoll(user?.email || defaultRollNumber) || 2026;
  const detectedBranch = detectBranchFromEmail(user?.email || defaultRollNumber) || '';
  const initialDepartment = resolveDepartmentOption(user?.department || user?.branch || detectedBranch) || 'Information Technology (IT)';

  // Personal & Academic State
  const [fullName, setFullName] = useState(user?.name || user?.fullName || '');
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatarUrl || '');
  const [department, setDepartment] = useState(initialDepartment);
  const [degree, setDegree] = useState(user?.degree || 'B.Tech');
  const [graduationYear, setGraduationYear] = useState(computedGraduationYear);
  const [section, setSection] = useState(user?.section || 'A');
  const [rollNumber, setRollNumber] = useState(defaultRollNumber);
  const [cgpa, setCgpa] = useState(user?.cgpa || '8.50');
  const [placementGoal, setPlacementGoal] = useState(user?.placementGoal || user?.targetRole || 'Software Engineer');

  // Sync state when user object updates
  React.useEffect(() => {
    if (user) {
      if (user.fullName || user.name) setFullName(user.fullName || user.name);
      if (user.avatar || user.avatarUrl) setAvatar(user.avatar || user.avatarUrl);
      const userRoll = user.rollNumber || user.rollNo || (user.email ? user.email.split('@')[0] : '');
      if (userRoll) setRollNumber(userRoll);

      const branchDetected = detectBranchFromEmail(user.email || userRoll) || '';
      const deptResolved = resolveDepartmentOption(user.department || user.branch || branchDetected);
      if (deptResolved) setDepartment(deptResolved);

      if (user.degree) setDegree(user.degree);
      if (user.section) setSection(user.section);
      if (user.cgpa) setCgpa(user.cgpa);
      if (user.placementGoal || user.targetRole) setPlacementGoal(user.placementGoal || user.targetRole);
      const gradYear = user.graduationYear || user.batchYear || getGraduationYearFromEmailOrRoll(user.email || userRoll);
      if (gradYear) setGraduationYear(gradYear);
    }
  }, [user]);

  // Career & Skills State
  const [interestedRoles, setInterestedRoles] = useState(
    user?.interestedRoles && Array.isArray(user.interestedRoles) && user.interestedRoles.length > 0
      ? user.interestedRoles
      : ['Software Engineer']
  );
  const [programmingLanguages, setProgrammingLanguages] = useState(
    user?.programmingLanguages
      ? (Array.isArray(user.programmingLanguages) ? user.programmingLanguages.join(', ') : user.programmingLanguages)
      : 'Java, Python, C++'
  );
  const [frameworks, setFrameworks] = useState(
    user?.frameworks
      ? (Array.isArray(user.frameworks) ? user.frameworks.join(', ') : user.frameworks)
      : 'React, Node.js, Express'
  );
  const [technologies, setTechnologies] = useState(
    user?.technologies
      ? (Array.isArray(user.technologies) ? user.technologies.join(', ') : user.technologies)
      : 'Git, Docker, PostgreSQL'
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

    // Auto compute graduation year from 2nd and 3rd digit if available (e.g. 127015088 -> 2027)
    if (numericVal.length >= 3) {
      const yy = parseInt(numericVal.substring(1, 3), 10);
      if (!isNaN(yy) && yy >= 0 && yy <= 99) {
        setGraduationYear(2000 + yy);
      }
    }

    // Auto-detect branch from roll number if at least 6 digits
    if (numericVal.length >= 6) {
      const branchCode = detectBranchFromEmail(numericVal);
      if (branchCode) {
        const matched = resolveDepartmentOption(branchCode);
        if (matched) {
          setDepartment(matched);
        }
      }
    }

    if (numericVal.length > 0 && numericVal.length !== 9) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
    } else {
      setRollError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your Full Name.');
      return;
    }

    if (!rollNumber.trim() || !/^\d{9}$/.test(rollNumber.trim())) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
      toast.error('Please enter a valid 9-digit SASTRA Roll Number.');
      return;
    }

    if (cgpa && String(cgpa).trim()) {
      const parsed = parseFloat(String(cgpa).trim());
      if (isNaN(parsed) || parsed < 0 || parsed > 10) {
        toast.error('CGPA must be a valid number between 0.00 and 10.00.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName,
        name: fullName,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
        department,
        branch: department,
        degree,
        graduationYear: parseInt(graduationYear),
        batchYear: parseInt(graduationYear),
        section,
        rollNumber,
        rollNo: rollNumber,
        cgpa: cgpa ? parseFloat(cgpa).toFixed(2) : '8.50',
        placementGoal,
        targetRole: placementGoal,
        interestedRoles: interestedRoles.join(', '),
        programmingLanguages,
        frameworks,
        technologies,
        github,
        linkedin,
        leetcode,
        codeforces,
        codechef,
        resume,
        bio,
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
      toast.error('Failed to complete profile setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview completion score
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 antialiased text-slate-900">
      <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
        {/* Onboarding Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 text-white rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SASTRA Student Setup</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Complete Your Student Profile
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed mt-1">
                Personalize your academic background, placement goals, and coding profile links to unlock campus Archives.
              </p>
            </div>

            {/* Completion Percentage Badge */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 text-center shrink-0 border border-white/20">
              <span className="text-xs font-bold text-indigo-100 uppercase tracking-wider block">Completion</span>
              <span className="text-3xl font-black text-white">{completionStats.percentage}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${completionStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Form Wizard */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Personal & Academic Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">1. Personal & Academic Details</h2>
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
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Department / Branch *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                  required
                >
                  <option value="" disabled>Select Department</option>
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
                placeholder="e.g. A, B, C"
              />

              {/* 9-Digit Roll Number input with validation */}
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
                  <p className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{rollError}</span>
                  </p>
                )}
              </div>

              <Input
                label="Current CGPA *"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="e.g. 8.75"
                required
              />
            </div>
          </div>

          {/* SECTION 2: Career Information & Interested Roles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">2. Career Goals & Roles</h2>
            </div>

            <Input
              label="Primary Placement Goal *"
              value={placementGoal}
              onChange={(e) => setPlacementGoal(e.target.value)}
              placeholder="e.g. Software Development Engineer (SDE-1)"
              required
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-brand-600 text-white border-brand-600 shadow-subtle'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Code className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">3. Technical Stack</h2>
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <LinkIcon className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">4. Coding Handles & Socials</h2>
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
              label="Resume Link (Google Drive / Cloudflare URL)"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Short Bio / Student Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your technical interests and campus placement goals..."
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="gap-2 px-8 py-3 shadow-card"
            >
              <span>Complete Setup & Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;
