/**
 * ForgotPassword Page Component
 * 
 * Standardized password recovery request form for SASTRA student accounts.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import { forgotPassword } from '../services/authService';
import { ROUTES } from '../constants/routes';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import { validateSastraEmail } from '../utils/validation';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const emailCheck = validateSastraEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.message);
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      setErrorMessage('Failed to send reset link. Please verify your email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter your SASTRA email to receive password reset instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Instructions Sent</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            If an account exists for <span className="font-semibold">{email}</span>, password reset instructions have been sent to your inbox.
          </p>
          <div className="pt-2">
            <Link to={ROUTES.LOGIN}>
              <Button variant="secondary" size="md" className="w-full justify-center h-11">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          <Input
            label="SASTRA Email Address *"
            type="email"
            placeholder="127XXXXXX@sastra.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center h-11 shadow-card"
          >
            Send Reset Link
          </Button>

          <div className="pt-2 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default ForgotPassword;
