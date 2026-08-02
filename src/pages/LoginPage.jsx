import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isAdmin } = useAuth();
  const [loginAs, setLoginAs] = useState('student');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      navigate(isAdmin() ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (user) {
    return <Navigate to={isAdmin() ? '/admin' : '/dashboard'} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const switchRole = (role) => {
    setLoginAs(role);
    setError('');
    setFormData({ email: '', password: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: loginAs,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Login failed. Please try again.');
        return;
      }

      if (!payload.token) {
        setError('Login succeeded but no token was returned.');
        return;
      }

      const sessionUser = login(payload.token);
      navigate(sessionUser.role === 'admin' ? '/admin' : '/dashboard');
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminLogin = loginAs === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200">
        <div className="mb-8 text-center">
          <p className={`text-sm uppercase tracking-[0.3em] ${isAdminLogin ? 'text-violet-600' : 'text-blue-600'}`}>
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">
            {isAdminLogin ? 'Admin login' : 'Student login'}
          </h1>
          <p className="mt-3 text-slate-600">
            {isAdminLogin
              ? 'Manage students, courses, password OTPs, and platform issues.'
              : 'Access your courses, peers, notes, and study schedule.'}
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 rounded-3xl bg-slate-100 p-2">
          <button
            type="button"
            onClick={() => switchRole('student')}
            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
              !isAdminLogin ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => switchRole('admin')}
            className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
              isAdminLogin ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            Admin Login
          </button>
        </div>

        <p className="mb-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {isAdminLogin ? (
            <>
              Demo admin: <span className="font-medium text-slate-700">admin@studymatch.com / admin123</span>
            </>
          ) : (
            <>
              Register a student account, or try{' '}
              <span className="font-medium text-slate-700">maya@example.com / password123</span>
            </>
          )}
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              {isAdminLogin ? 'Admin email' : 'Student email'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
                isAdminLogin ? 'focus:border-violet-500 focus:ring-violet-100' : 'focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 ${
                isAdminLogin ? 'focus:border-violet-500 focus:ring-violet-100' : 'focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {!isAdminLogin && (
              <div className="mt-3 flex flex-col items-end gap-1 text-right">
                <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                  Forgot password?
                </Link>
                <p className="text-xs text-slate-500">Works without logging in — OTP arrives as a page notification.</p>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`inline-flex w-full items-center justify-center rounded-3xl px-6 py-4 text-base font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400 ${
              isAdminLogin ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </span>
            ) : isAdminLogin ? (
              'Sign in as Admin'
            ) : (
              'Sign in as Student'
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:flex-row">
          {isAdminLogin ? (
            <p>Need the student portal instead?</p>
          ) : (
            <p>New to StudyMatch?</p>
          )}
          {isAdminLogin ? (
            <button type="button" onClick={() => switchRole('student')} className="font-semibold text-blue-600 hover:text-blue-700">
              Switch to Student Login
            </button>
          ) : (
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Create a student account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
