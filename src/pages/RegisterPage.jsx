import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { INTEREST_OPTIONS, STUDY_METHOD_OPTIONS } from '../data/studyPrefs.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    interests: [],
    studyMethods: [],
  });
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'student',
          interests: formData.interests,
          studyMethods: formData.studyMethods,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.message || 'Registration failed. Please try again.');
        return;
      }

      if (!payload.token) {
        setError('Registration succeeded but no token was returned.');
        return;
      }

      login(payload.token);
      navigate('/profile');
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Create your account</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900">Register for StudyMatch</h1>
          <p className="mt-3 text-slate-600">Join your study community and start collaborating with peers today.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
                minLength={6}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Interests (pick a few)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTEREST_OPTIONS.slice(0, 6).map((interest) => {
                const active = formData.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        interests: active
                          ? current.interests.filter((item) => item !== interest)
                          : [...current.interests, interest].slice(0, 5),
                      }))
                    }
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Study methods</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STUDY_METHOD_OPTIONS.slice(0, 6).map((method) => {
                const active = formData.studyMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      setFormData((current) => ({
                        ...current,
                        studyMethods: active
                          ? current.studyMethods.filter((item) => item !== method)
                          : [...current.studyMethods, method].slice(0, 5),
                      }))
                    }
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-blue-600 px-6 py-4 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? (
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Registering...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
}
