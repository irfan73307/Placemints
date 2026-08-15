/**
 * Settings Page Component
 * 
 * Organised Settings Page Structure:
 * 1. Account: Edit Profile link, Change Password button, Connected Accounts info.
 * 2. Preferences: Theme Switch (Light/Dark mode), Placement Drive Notifications toggle.
 * 3. Support & Legal: Interactive modals for Help Center, Terms & Conditions, Privacy Policy, About Placemints.
 * 4. Danger Zone (VERY BOTTOM): Visually separated Logout button.
 * 
 * Features professional SASTRA University placement portal content for all support & policy links.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ROUTES } from '../constants/routes';
import apiClient from '../services/api';
import { 
  Lock, 
  Moon, 
  Sun, 
  Bell, 
  HelpCircle, 
  ShieldCheck, 
  FileText, 
  LogOut, 
  User, 
  Sparkles,
  ChevronRight,
  Info,
  Edit2,
  AlertTriangle,
  GraduationCap,
  X
} from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Password Change Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Content Modals State
  const [activeModal, setActiveModal] = useState(null); // 'help' | 'terms' | 'privacy' | 'about'

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

  const isAdmin = user?.role === 'ADMIN' || user?.isAdmin;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-16 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-card border border-slate-800 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Application Settings</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Manage your SASTRA student account security, theme preferences, and placement portal documentation.
        </p>
      </div>

      <div className="space-y-6">
        {/* ADMIN MANAGEMENT PORTAL (Mobile & Desktop Quick Access) */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-indigo-950/90 rounded-2xl border border-amber-500/40 p-6 shadow-xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-extrabold tracking-tight">Admin Management Portal</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                Admin Privileges Active
              </span>
            </div>

            <p className="text-xs text-amber-100/80">
              Quick Mobile & Desktop navigation to SASTRA placement database controls and admin account management.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <Link
                to="/admin/companies"
                className="p-4 bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-white block group-hover:text-emerald-300 transition-colors">
                      Company Management
                    </span>
                    <span className="text-[11px] text-amber-200/70 block truncate">
                      View, edit, verify, scrape & manage 290+ recruiters
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </Link>

              <Link
                to="/admin/students"
                className="p-4 bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-white block group-hover:text-amber-300 transition-colors">
                      Student Directory
                    </span>
                    <span className="text-[11px] text-amber-200/70 block truncate">
                      Manage students, filter CGPA, export CSV
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </Link>

              <Link
                to="/admin/settings"
                className="p-4 bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm text-white block group-hover:text-indigo-300 transition-colors">
                      Admin Settings & RBAC
                    </span>
                    <span className="text-[11px] text-indigo-200/70 block truncate">
                      Manage admin accounts & system logs
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </Link>
            </div>
          </div>
        )}

        {/* SECTION 1: Account Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-4 h-4 text-brand-600" />
            <span>1. Account Settings</span>
          </h2>

          <div className="space-y-3 text-xs">
            {/* Edit Profile Quick Link */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Student Profile Details</span>
                <span className="text-slate-500 dark:text-slate-400">Update academic roll number, department, and CGPA</span>
              </div>
              <Link to={ROUTES.PROFILE}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </Button>
              </Link>
            </div>

            {/* Connected Account */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Verified Email Account</span>
                <span className="text-slate-500 dark:text-slate-400">{user?.email}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                {user?.googleId ? 'Google Verified' : 'SASTRA Student'}
              </span>
            </div>

            {/* Change Password */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Account Password</span>
                <span className="text-slate-500 dark:text-slate-400">Update your account login password</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                className="gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </Button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Appearance & Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>2. Preferences</span>
          </h2>

          <div className="space-y-3 text-xs">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Theme Appearance</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Currently: {isDark ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDark ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notifications Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Campus Drive Notifications</span>
                  <span className="text-slate-500 dark:text-slate-400">Receive alerts for new company archives and PYQs</span>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-brand-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: Support & Policies */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>3. Support & Policies</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => setActiveModal('help')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Help Center & FAQs</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal('terms')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Terms & Conditions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal('privacy')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">Privacy Policy</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => setActiveModal('about')}
              className="p-3.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">About Placemints</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SECTION 4: Danger Zone (Placed at the VERY BOTTOM, visually separated) */}
        <div className="bg-red-50/40 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 p-6 shadow-card space-y-4">
          <h2 className="text-base font-bold text-red-900 dark:text-red-300 flex items-center gap-2 border-b border-red-200 dark:border-red-900/40 pb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span>4. Danger Zone</span>
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <span className="font-bold text-red-950 dark:text-red-200 block text-sm">Sign Out of Placemints</span>
              <span className="text-red-700 dark:text-red-400">
                Terminates your active JWT session on this device. You will need to sign in again with your SASTRA credentials.
              </span>
            </div>

            <Button
              variant="danger"
              size="lg"
              onClick={logout}
              className="gap-2 shrink-0 justify-center py-2.5 px-6 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
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
                <X className="w-5 h-5" />
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

      {/* Interactive Content Modals (Help Center, Terms, Privacy, About) */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                {activeModal === 'help' && <HelpCircle className="w-6 h-6 text-brand-600" />}
                {activeModal === 'terms' && <FileText className="w-6 h-6 text-indigo-600" />}
                {activeModal === 'privacy' && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
                {activeModal === 'about' && <GraduationCap className="w-6 h-6 text-amber-500" />}
                <h3 className="text-xl font-bold">
                  {activeModal === 'help' && 'Help Center & Frequently Asked Questions'}
                  {activeModal === 'terms' && 'SASTRA Campus Placement Portal Terms & Conditions'}
                  {activeModal === 'privacy' && 'Student Data Privacy Policy'}
                  {activeModal === 'about' && 'About Placemints Platform'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {activeModal === 'help' && (
                <>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Q: Who can log in to Placemints?</h4>
                    <p>Only verified SASTRA University students with official emails ending in <code>@sastra.ac.in</code> can log in using Google OAuth or registered email accounts.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Q: How do I save target placement companies?</h4>
                    <p>Click the "Save Company" button on any company card or details page. Your bookmarks sync immediately to your database profile and reflect in your dashboard count.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Q: Are the company interview questions real?</h4>
                    <p>Yes. Questions categorized under "SASTRA Previous Interview Questions" represent actual campus drive experiences reported by senior students across IT, CSE, ECE, and core engineering streams.</p>
                  </div>
                </>
              )}

              {activeModal === 'terms' && (
                <>
                  <p>Welcome to Placemints, SASTRA University's campus placement preparation portal. By accessing this application, students agree to comply with the following academic and placement code of conduct:</p>
                  <ul className="list-disc pl-5 space-y-2 font-medium">
                    <li><strong>Academic Integrity:</strong> All interview experiences and PYQs shared must be accurate representations of actual campus recruitment drives.</li>
                    <li><strong>Authorized Access:</strong> Portal credentials and company question archives are strictly for active SASTRA University students. Sharing portal access with unauthorized external entities is prohibited.</li>
                    <li><strong>Placement Eligibility:</strong> Students must maintain updated academic records (CGPA, Roll Number, Department) matching SASTRA Training & Placement Cell records.</li>
                  </ul>
                </>
              )}

              {activeModal === 'privacy' && (
                <>
                  <p>Placemints prioritizes the confidentiality and security of SASTRA student records:</p>
                  <ul className="list-disc pl-5 space-y-2 font-medium">
                    <li><strong>Information Collected:</strong> We securely store verified student names, `@sastra.ac.in` email addresses, 9-digit roll numbers, department codes, CGPA, target placement goals, and public coding platform links.</li>
                    <li><strong>Data Usage:</strong> Student records are used solely to personalize placement preparation recommendations, calculate profile completion metrics, and present aggregated campus drive analytics.</li>
                    <li><strong>Security & Authentication:</strong> Sessions are secured using cryptographic JWT tokens and HTTP-only cookies. Passwords are stored securely using salted bcrypt hashes.</li>
                  </ul>
                </>
              )}

              {activeModal === 'about' && (
                <>
                  <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800/50 space-y-2">
                    <h4 className="font-bold text-sm text-brand-950 dark:text-brand-100">Placemints — SASTRA Campus Placement Platform</h4>
                    <p>Placemints is a dedicated placement preparation platform built specifically for SASTRA University students. It centralizes 246+ company selection round archives, 6,600+ past interview questions (PYQs), time & space complexity breakdowns, and real-time coding profile synchronization (GitHub, LeetCode, Codeforces).</p>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">Targeted for B.Tech / M.Tech students preparing for campus recruitment drives across TCS, Zoho, Amazon, Google, Microsoft, Adobe, and core engineering recruiters.</p>
                </>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setActiveModal(null)}>
                Close Modal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
