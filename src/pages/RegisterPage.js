import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Student',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          role: formData.role.toLowerCase(),
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
      navigate('/dashboard');
    } catch (fetchError) {
      setError('Unable to connect to the server. Please try again later.');
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
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option>Student</option>
              <option>Admin</option>
            </select>
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
