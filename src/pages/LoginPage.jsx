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
    <div className="py-10">
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-paper-line bg-paper-card p-8 shadow-soft sm:p-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">Welcome back</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink">
            {isAdminLogin ? 'Admin sign in' : 'Student sign in'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            {isAdminLogin
              ? 'Manage students, courses, password OTPs, and platform issues.'
              : 'Access your courses, peers, notes, and study schedule.'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-paper p-1">
          <button
            type="button"
            onClick={() => switchRole('student')}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
              !isAdminLogin ? 'bg-pine text-paper-card' : 'text-ink-muted hover:bg-paper-card'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => switchRole('admin')}
            className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
              isAdminLogin ? 'bg-pine text-paper-card' : 'text-ink-muted hover:bg-paper-card'
            }`}
          >
            Admin
          </button>
        </div>

        <p className="mb-6 rounded-lg border border-paper-line bg-paper px-4 py-3 text-sm text-ink-muted">
          {isAdminLogin ? (
            <>
              Demo admin: <span className="font-medium text-ink">admin@studymatch.com / admin123</span>
            </>
          ) : (
            <>
              Try <span className="font-medium text-ink">maya@example.com / password123</span>
            </>
          )}
        </p>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-soft">
              {isAdminLogin ? 'Admin email' : 'Student email'}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-md border border-paper-line bg-paper px-4 py-3 text-ink shadow-sm focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-md border border-paper-line bg-paper px-4 py-3 text-ink shadow-sm focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20"
            />
            {!isAdminLogin && (
              <div className="mt-3 flex justify-end">
                <Link to="/forgot-password" className="text-sm font-semibold text-pine hover:text-pine-deep">
                  Forgot password?
                </Link>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-pine px-6 py-3.5 text-base font-semibold text-paper-card transition hover:bg-pine-deep disabled:cursor-not-allowed disabled:bg-ink-muted"
          >
            {loading ? 'Signing in…' : isAdminLogin ? 'Sign in as Admin' : 'Sign in as Student'}
          </button>
        </form>

        <div className="mt-8 border-t border-paper-line pt-6 text-sm text-ink-muted">
          {isAdminLogin ? (
            <p>
              Need a student account?{' '}
              <Link to="/register" className="font-semibold text-pine">
                Register here
              </Link>
            </p>
          ) : (
            <p>
              New to StudyMatch?{' '}
              <Link to="/register" className="font-semibold text-pine">
                Create a student account
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
