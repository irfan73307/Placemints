/**
 * Register Page Component
 * 
 * Standardized New User Registration for SASTRA University students.
 * Enforces @sastra.ac.in email requirement and continues to Profile Setup.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { registerUser } from '../services/authService';
import { ROUTES } from '../constants/routes';
import { User, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { validateSastraEmail } from '../utils/validation';

export function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { setUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const emailCheck = validateSastraEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.message);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await registerUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (data && data.user) {
        if (setUserData) setUserData(data.user);
        toast.success("Account created! Let's complete your student profile.");
        navigate(ROUTES.PROFILE_SETUP);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create SASTRA Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Register with your official SASTRA University email (@sastra.ac.in).
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. Shaik Haroon"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        <Input
          label="SASTRA Email *"
          type="email"
          placeholder="127XXXXXX@sastra.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          required
        />

        <Input
          label="Password *"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        <Input
          label="Confirm Password *"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full justify-center gap-2 h-11 shadow-card"
        >
          <span>Continue to Profile Setup</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Already registered?{' '}
        <Link to={ROUTES.LOGIN} className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default Register;
