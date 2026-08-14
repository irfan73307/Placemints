/**
 * Profile Page Component
 * 
 * Implements a clean dual-mode student profile:
 * 1. Normal View (Default): Overview card with photo, name, roll number, responsive department,
 *    completion bar, resume status, and interactive Coding Platform Cards (GitHub, LeetCode, Codeforces, CodeChef, LinkedIn).
 * 2. Edit Mode: Displayed ONLY when clicking "Edit Profile".
 * 
 * Mobile Redesign: Optimized spacing, compact cards, responsive font sizes.
 */

import React, { useState, useEffect } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { updateProfile } from '../services/userService';
import { calculateProfileCompletion, SASTRA_DEPARTMENTS } from '../utils/profileCompletion';
import { getFormattedDepartment } from '../utils/departmentUtils';
import apiClient from '../services/api';
import { 
  User, 
  Target, 
  Code, 
  Github, 
  Linkedin, 
  FileText, 
  Edit2, 
  Save, 
  Sparkles, 
  Lock, 
  ExternalLink,
  Award,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Globe
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

export function Profile() {
  const { user, updateUserData } = useAuth();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [department, setDepartment] = useState('Information Technology (IT)');
  const [degree, setDegree] = useState('B.Tech');
  const [graduationYear, setGraduationYear] = useState(2026);
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [cgpa, setCgpa] = useState('8.50');
  const [placementGoal, setPlacementGoal] = useState('');
  const [interestedRoles, setInterestedRoles] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState('');
  const [frameworks, setFrameworks] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [leetcode, setLeetcode] = useState('');
  const [codeforces, setCodeforces] = useState('');
  const [codechef, setCodechef] = useState('');
  const [resume, setResume] = useState('');
  const [bio, setBio] = useState('');
  const [rollError, setRollError] = useState('');

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setAvatar(user.avatar || user.avatarUrl || '');
      setDepartment(user.department || user.branch || 'Information Technology (IT)');
      setDegree(user.degree || 'B.Tech');
      setGraduationYear(user.graduationYear || user.batchYear || 2026);
      setSection(user.section || 'A');
      setRollNumber(user.rollNumber || user.rollNo || '');
      setCgpa(user.cgpa || '8.50');
      setPlacementGoal(user.placementGoal || user.targetRole || 'Software Engineer');
      setInterestedRoles(
        Array.isArray(user.interestedRoles)
          ? user.interestedRoles
          : user.interestedRoles ? user.interestedRoles.split(',').map((s) => s.trim()) : []
      );
      setProgrammingLanguages(
        Array.isArray(user.programmingLanguages) ? user.programmingLanguages.join(', ') : user.programmingLanguages || ''
      );
      setFrameworks(
        Array.isArray(user.frameworks) ? user.frameworks.join(', ') : user.frameworks || ''
      );
      setTechnologies(
        Array.isArray(user.technologies) ? user.technologies.join(', ') : user.technologies || ''
      );
      setGithub(user.github || '');
      setLinkedin(user.linkedin || '');
      setLeetcode(user.leetcode || '');
      setCodeforces(user.codeforces || '');
      setCodechef(user.codechef || '');
      setResume(user.resume || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const completion = calculateProfileCompletion(user);
  const formattedDept = getFormattedDepartment(department);

  const handleRollChange = (val) => {
    const numericVal = val.replace(/\D/g, '');
    setRollNumber(numericVal);
    if (numericVal.length > 0 && numericVal.length !== 9) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
    } else {
      setRollError('');
    }
  };

  const toggleRole = (role) => {
    if (interestedRoles.includes(role)) {
      setInterestedRoles(interestedRoles.filter((r) => r !== role));
    } else {
      setInterestedRoles([...interestedRoles, role]);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (rollNumber && !/^\d{9}$/.test(rollNumber)) {
      setRollError('Roll Number must be exactly 9 digits (e.g. 127015088).');
      toast.error('Please enter a valid 9-digit SASTRA Roll Number.');
      return;
    }

    if (cgpa && String(cgpa).trim()) {
      const parsedCgpa = parseFloat(String(cgpa).trim());
      if (isNaN(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10) {
        toast.error('CGPA must be a valid number between 0.00 and 10.00.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        fullName,
        name: fullName,
        avatar,
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
        updateUserData(res.user);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Save profile error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/users/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Header Banner & Profile Completion Progress */}
      <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 rounded-2xl p-5 sm:p-8 text-white shadow-card relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <img
              src={avatar || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || 'User')}`}
              alt={fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-white/20 shadow-md shrink-0 bg-white"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white truncate">{fullName || 'SASTRA Student'}</h1>
                <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-100 border-emerald-400/30 text-[10px]">
                  Verified
                </Badge>
              </div>
              <p className="text-xs text-indigo-100 mt-1 truncate">
                {user?.email} • Roll: {rollNumber || 'Not set'}
              </p>
              {/* Responsive Department */}
              <p className="text-xs text-amber-300 font-semibold mt-1">
                <span className="hidden sm:inline">{formattedDept.desktop}</span>
                <span className="inline sm:hidden">{formattedDept.mobile}</span>
                <span> • CGPA: {cgpa}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant={isEditing ? 'secondary' : 'primary'}
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 backdrop-blur-sm text-xs py-2 px-3 sm:px-4"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1.5 backdrop-blur-sm text-xs py-2 px-3 sm:px-4"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security</span>
            </Button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-100">
            <span>Profile Completion</span>
            <span className="text-amber-300 font-extrabold">{completion.percentage}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* NORMAL VIEW (Clean & Professional) vs EDIT MODE */}
      {!isEditing ? (
        /* NORMAL VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left 2 Columns: Summary & Resume Status */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Summary Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-card space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <User className="w-4 h-4 text-brand-600" />
                <span>Student Summary</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">Department</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formattedDept.desktop}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">Roll Number</span>
                  <span className="font-bold text-slate-900 dark:text-white">{rollNumber || 'Not set'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">CGPA</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{cgpa}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">Degree / Batch</span>
                  <span className="font-bold text-slate-900 dark:text-white">{degree} ({graduationYear})</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">Placement Goal</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{placementGoal || 'Software Engineer'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-slate-500 dark:text-slate-400 block">Resume Status</span>
                  <span className={`font-bold ${resume ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {resume ? 'Uploaded' : 'Missing'}
                  </span>
                </div>
              </div>

              {bio && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Bio / Summary</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{bio}</p>
                </div>
              )}
            </div>

            {/* Resume Link Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-card space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Resume Document</span>
              </h2>

              {resume ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950 dark:text-emerald-100">Resume Uploaded Successfully</h4>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">My Resume (PDF Document)</p>
                    </div>
                  </div>
                  <a
                    href={resume}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Resume</span>
                  </a>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">No Resume Uploaded</span>
                      <span className="text-[11px] text-slate-400">Upload your PDF resume link to complete placement requirements.</span>
                    </div>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>Upload Resume</Button>
                </div>
              )}
            </div>

            {/* Target Roles & Tech Stack */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-card space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <Code className="w-4 h-4 text-indigo-600" />
                <span>Technical Stack & Target Roles</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Target Roles</span>
                  <div className="flex flex-wrap gap-1.5">
                    {interestedRoles.length > 0 ? (
                      interestedRoles.map((role) => <Badge key={role} variant="brand">{role}</Badge>)
                    ) : (
                      <span className="text-slate-400">No roles selected.</span>
                    )}
                  </div>
                </div>

                {programmingLanguages && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Languages</span>
                    <p className="text-slate-600 dark:text-slate-400">{programmingLanguages}</p>
                  </div>
                )}
                {frameworks && (
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Frameworks</span>
                    <p className="text-slate-600 dark:text-slate-400">{frameworks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 1 Column: Interactive Coding Platform & Readiness Summary */}
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Coding Platform Summary</span>
            </h2>

            {/* LeetCode Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">LeetCode</h3>
                </div>
                {leetcode ? (
                  <a href={leetcode.startsWith('http') ? leetcode : `https://leetcode.com/${leetcode}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>

              {leetcode ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Stats sync coming soon</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live GraphQL problem-solving metrics will sync here in Phase 2.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Link your LeetCode profile URL in Edit Profile to sync stats.</p>
              )}
            </div>

            {/* GitHub Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-slate-800 dark:text-slate-200" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">GitHub</h3>
                </div>
                {github ? (
                  <a href={github.startsWith('http') ? github : `https://github.com/${github}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>

              {github ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Stats sync coming soon</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Public repositories and commit analytics will sync in Phase 2.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Link your GitHub profile URL to sync repositories.</p>
              )}
            </div>

            {/* CodeChef Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">CodeChef</h3>
                </div>
                {codechef ? (
                  <a href={codechef.startsWith('http') ? codechef : `https://www.codechef.com/users/${codechef}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>

              {codechef ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Stats sync coming soon</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Contest stars and division rating metrics will sync in Phase 2.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Link your CodeChef handle to sync rating.</p>
              )}
            </div>

            {/* Codeforces Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Codeforces</h3>
                </div>
                {codeforces ? (
                  <a href={codeforces.startsWith('http') ? codeforces : `https://codeforces.com/profile/${codeforces}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                    <span>Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>

              {codeforces ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>Stats sync coming soon</span>
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Competitive rating and contest rank tier will sync in Phase 2.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Link your Codeforces handle to sync contest ratings.</p>
              )}
            </div>

            {/* LinkedIn Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">LinkedIn</h3>
                </div>
                {linkedin ? (
                  <a href={linkedin.startsWith('http') ? linkedin : `https://www.linkedin.com/in/${linkedin}`} target="_blank" rel="noreferrer" className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1">
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">Not linked</span>
                )}
              </div>
            </div>

            {/* Placement Readiness Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Placement Readiness</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  Phase 2
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700/60 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  AI & Placement Readiness analysis coming soon
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Algorithmic radar, company-specific fit & interview readiness metrics will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* EDIT MODE FORM (Cleanly separated) */
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Edit2 className="w-4 h-4 text-brand-600" />
              <span>Edit Profile Details</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Profile Avatar URL"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                >
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
                required
              />

              <Input
                label="Graduation Year *"
                type="number"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />

              <div>
                <Input
                  label="SASTRA Roll Number (9 Digits) *"
                  value={rollNumber}
                  onChange={(e) => handleRollChange(e.target.value)}
                  maxLength={9}
                  required
                />
                {rollError && <p className="text-[11px] text-red-600 font-semibold mt-1">{rollError}</p>}
              </div>

              <Input
                label="CGPA *"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="e.g. 8.50"
                required
              />
            </div>

            <Input
              label="Primary Placement Goal *"
              value={placementGoal}
              onChange={(e) => setPlacementGoal(e.target.value)}
              required
            />

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Interested Target Roles</label>
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
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? `✓ ${role}` : `+ ${role}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Programming Languages"
                value={programmingLanguages}
                onChange={(e) => setProgrammingLanguages(e.target.value)}
                placeholder="e.g. Java, Python, C++"
              />
              <Input
                label="Frameworks & Libraries"
                value={frameworks}
                onChange={(e) => setFrameworks(e.target.value)}
                placeholder="e.g. React, Node.js, Spring Boot"
              />
              <Input
                label="Developer Tools & Technologies"
                value={technologies}
                onChange={(e) => setTechnologies(e.target.value)}
                placeholder="e.g. Git, Docker, AWS"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="LeetCode Profile URL"
                value={leetcode}
                onChange={(e) => setLeetcode(e.target.value)}
                placeholder="https://leetcode.com/username"
              />
              <Input
                label="CodeChef Handle / URL"
                value={codechef}
                onChange={(e) => setCodechef(e.target.value)}
                placeholder="https://www.codechef.com/users/handle"
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
              label="Resume URL (PDF / Google Drive Link)"
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="https://drive.google.com/..."
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Short Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief introduction about your placement aspirations and technical interests..."
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Security Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-600" />
                <span>Change Password</span>
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {user?.passwordHash && (
                <Input
                  label="Current Password *"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
              )}

              <Input
                label="New Password *"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              <Input
                label="Confirm New Password *"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
