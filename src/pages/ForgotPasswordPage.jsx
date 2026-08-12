import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpReady, setOtpReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      navigate(isAdmin() ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (user) {
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  }

  const requestReset = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to create OTP.');

      setOtp(payload.otp || '');
      setExpiresAt(payload.expiresAt || null);
      setOtpReady(true);
      setSuccess('OTP ready. Enter a new password below — no admin needed.');
    } catch (requestError) {
      setOtpReady(false);
      setError(requestError.message || 'Unable to create OTP.');
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
      <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Account recovery</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Forgot password</h1>
          <p className="mt-3 text-slate-600">
            Enter your email to get an instant OTP, then set a new password. No admin wait.
          </p>
        </div>

        {!otpReady ? (
          <form className="space-y-6" onSubmit={requestReset}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Account email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            {error && (
              <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? 'Creating OTP…' : 'Get instant OTP'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={resetPassword}>
            <div className="rounded-3xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Your OTP</p>
              <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-center text-3xl font-bold tracking-[0.35em] text-slate-900">
                {otp}
              </p>
              {expiresAt && (
                <p className="mt-3 text-center text-sm text-blue-800">
                  Expires at {new Date(expiresAt).toLocaleTimeString()}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700">
                Account email
              </label>
              <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                OTP code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">
                  New password
                </label>
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
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
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

            {error && (
              <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            {success && (
              <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !otp}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpReady(false);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                setExpiresAt(null);
                setSuccess('');
                setError('');
              }}
              className="w-full text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Use a different email
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
