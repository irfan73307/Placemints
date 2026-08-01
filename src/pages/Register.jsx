/**
 * Register Page Component
 * 
 * New user registration for SASTRA University students.
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
import { User, Mail, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

import { validateSastraEmail } from '../utils/validation';

export function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await registerUser({
        fullName,
        email: email.trim(),
        password,
        confirmPassword,
      });

      if (data && data.user) {
        if (setUserData) setUserData(data.user);
        toast.success('Account created! Let\'s complete your student profile.');
        navigate(ROUTES.PROFILE_SETUP);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your credentials.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-bold text-slate-900">Create SASTRA Account</h2>
        <p className="text-xs text-slate-500">
          Register with your official SASTRA University email (@sastra.ac.in).
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="Enter Your Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="SASTRA Email *"
          type="email"
          placeholder="127XXXXXX@sastra.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password *"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          label="Confirm Password *"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          className="w-full justify-center gap-2 py-3 shadow-card"
        >
          <span>Continue to Profile Setup</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
        Already registered?{' '}
        <Link to={ROUTES.LOGIN} className="font-bold text-brand-600 hover:text-brand-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default Register;
