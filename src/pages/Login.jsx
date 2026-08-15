/**
 * Login Page Component
 * 
 * Student authentication login page.
 * Offers dual authentication options:
 * 1. "Continue with Google" (backend verified @sastra.ac.in restriction)
 * 2. "Login with Email & Password" (with Show/Hide Password toggle)
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { loginWithEmail } from '../services/authService';
import { ROUTES } from '../constants/routes';
import { AlertCircle, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { validateSastraEmail } from '../utils/validation';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [searchParams] = useSearchParams();
  const { setUserData } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'domain_restricted') {
      const msg = 'Only SASTRA University students (@sastra.ac.in) can access Placemints.';
      setErrorMessage(msg);
      toast.error(msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      const msg = 'Google authentication failed. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, toast]);

  const handleGoogleLogin = () => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const defaultApi = `http://${hostname}:5000/api`;
    const apiBase = import.meta.env.VITE_API_BASE_URL || defaultApi;
    const serverUrl = apiBase.replace(/\/api\/?$/, '');
    window.location.href = `${serverUrl}/auth/google`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your SASTRA Email and Password.');
      return;
    }

    const emailCheck = validateSastraEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await loginWithEmail(email.trim(), password);
      if (data && data.user) {
        if (setUserData) setUserData(data.user);
        toast.success(`Welcome back, ${data.user.name}!`);

        const targetRoute = data.user.profileCompleted ? ROUTES.DASHBOARD : ROUTES.PROFILE_SETUP;
        navigate(targetRoute);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Student Sign In</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Access SASTRA University company selection rounds & PYQ database.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Option 1: Continue with Google */}
      <div>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 shadow-card hover:shadow-md transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
        <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 absolute">
          OR
        </span>
      </div>

      {/* Option 2: Login with Email & Password */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <Input
          label="SASTRA Email Address *"
          type="email"
          placeholder="127XXXXXX@sastra.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 select-none">Password *</label>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative flex items-center">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              inputClassName="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full justify-center gap-2 py-3 shadow-card"
        >
          <span>Sign In with Email</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300">
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default Login;
