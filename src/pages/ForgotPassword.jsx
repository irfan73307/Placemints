/**
 * ForgotPassword Page Component
 * 
 * Password recovery request form for SASTRA student accounts.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useToast } from '../contexts/ToastContext';
import { forgotPassword } from '../services/authService';
import { ROUTES } from '../constants/routes';
import { Mail, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !email.toLowerCase().trim().endsWith('@sastra.ac.in')) {
      setErrorMessage('Please enter a valid official SASTRA email address (@sastra.ac.in).');
      return;
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      setErrorMessage('Failed to send reset link. Please verify your email.');
      toast.error('Failed to process request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-xs text-slate-500">
          Enter your SASTRA email to receive password reset instructions.
        </p>
      </div>

      {isSubmitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3 animate-fadeIn">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-900">Instructions Sent</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            If an account exists for <span className="font-semibold">{email}</span>, password reset instructions have been sent to your inbox.
          </p>
          <div className="pt-2">
            <Link to={ROUTES.LOGIN}>
              <Button variant="secondary" size="sm" className="w-full justify-center">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Input
            label="SASTRA Email Address *"
            type="email"
            placeholder="127XXXXXX@sastra.ac.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full justify-center py-3 shadow-card"
          >
            Send Reset Link
          </Button>

          <div className="pt-2 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors"
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
