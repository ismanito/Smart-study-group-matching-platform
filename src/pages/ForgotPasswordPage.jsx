import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const EMAIL_KEY = 'studyMatchResetEmail';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingOtp, setCheckingOtp] = useState(false);
  const [autoCheck, setAutoCheck] = useState(() => Boolean(localStorage.getItem(EMAIL_KEY)));
  const [otpNotification, setOtpNotification] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      navigate(isAdmin() ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const checkForOtp = async ({ silent = false } = {}) => {
    if (!email.trim()) {
      if (!silent) setError('Enter your account email to check for the OTP notification.');
      return;
    }

    if (!silent) {
      setCheckingOtp(true);
      setError('');
    }

    try {
      const response = await fetch(
        `/api/auth/password-reset/notification?email=${encodeURIComponent(email.trim())}`
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to check for OTP.');

      if (payload.status === 'otp_sent' && payload.notification?.otp) {
        setOtpNotification(payload.notification);
        setOtp(payload.notification.otp);
        setStatusMessage('');
        setSuccess('OTP notification received. You can set a new password now — no login needed.');
        setStep('reset');
        setAutoCheck(false);
      } else if (payload.status === 'pending') {
        setOtpNotification(null);
        setStatusMessage(payload.message || 'Still waiting for an admin to send your OTP…');
        setStep('reset');
      } else if (payload.status === 'expired') {
        setOtpNotification(null);
        setAutoCheck(false);
        setError(payload.message || 'OTP expired. Request a new reset.');
      } else if (payload.status === 'none') {
        setOtpNotification(null);
        if (!silent) {
          setStatusMessage('No reset request found for this email yet. Submit step 1 first.');
        }
      } else if (payload.status === 'completed') {
        setAutoCheck(false);
        setSuccess(payload.message || 'Password was already updated. You can log in.');
      }
    } catch (checkError) {
      if (!silent) setError(checkError.message || 'Unable to check for OTP.');
    } finally {
      if (!silent) setCheckingOtp(false);
    }
  };

  useEffect(() => {
    if (!autoCheck || !email.trim()) return undefined;

    checkForOtp({ silent: true });
    const intervalId = setInterval(() => checkForOtp({ silent: true }), 3000);
    return () => clearInterval(intervalId);
  }, [autoCheck, email]);

  if (user) {
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  }

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setOtpNotification(null);
    setStatusMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to submit reset request.');

      localStorage.setItem(EMAIL_KEY, email.trim());
      setSuccess('Request sent. You do not need to log in. Stay here or come back with the same email to receive the OTP notification.');
      setStatusMessage('Waiting for an administrator to send your OTP…');
      setAutoCheck(true);
      setStep('reset');
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit reset request.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to update password.');

      localStorage.removeItem(EMAIL_KEY);
      setAutoCheck(false);
      setSuccess('Password updated. You can log in with your new password.');
      setTimeout(() => navigate('/login'), 1200);
    } catch (resetError) {
      setError(resetError.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Account recovery</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Forgot password</h1>
          <p className="mt-3 text-slate-600">
            You do <span className="font-semibold text-slate-800">not</span> need to log in. Request a reset, then receive the OTP as a notification on this page.
          </p>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setStep('request')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              step === 'request' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            1. Request reset
          </button>
          <button
            type="button"
            onClick={() => setStep('reset')}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              step === 'reset' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            2. Get OTP & new password
          </button>
        </div>

        {autoCheck && !otpNotification && (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-semibold">Listening for OTP notification…</p>
            <p className="mt-1">
              Keep this page open, or come back later, enter the same email, and tap “Check for OTP notification”.
            </p>
          </div>
        )}

        {otpNotification && (
          <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">OTP notification</p>
            <p className="mt-2 text-lg font-semibold">{otpNotification.title}</p>
            <p className="mt-2 text-sm">{otpNotification.message}</p>
            <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-3xl font-bold tracking-[0.35em] text-slate-900">
              {otpNotification.otp}
            </p>
          </div>
        )}

        {step === 'request' ? (
          <form className="space-y-6" onSubmit={requestReset}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Account email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <p className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This page works while logged out. After an admin sends the OTP, it appears here as a notification — then you create a new password and log in.
            </p>
            {error && <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? 'Submitting…' : 'Request password reset'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={resetPassword}>
            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">Account email</label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setAutoCheck(true);
                checkForOtp();
              }}
              disabled={checkingOtp || !email.trim()}
              className="inline-flex w-full items-center justify-center rounded-3xl border border-blue-300 bg-blue-50 px-6 py-3 text-base font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
            >
              {checkingOtp ? 'Checking…' : 'Check for OTP notification'}
            </button>

            {statusMessage && (
              <p className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{statusMessage}</p>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700">OTP code</label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="Appears here after admin sends OTP"
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            {error && <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}
            <button
              type="submit"
              disabled={loading || !otp}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
