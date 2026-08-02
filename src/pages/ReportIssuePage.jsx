import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ReportIssuePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    severity: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          message: formData.message.trim(),
          severity: formData.severity,
          path: window.location.pathname,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to report issue.');

      setSuccess(payload.message || 'Issue reported to administrators.');
      setFormData({ title: '', message: '', severity: 'medium' });
    } catch (submitError) {
      setError(submitError.message || 'Unable to report issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-600">Support</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Report an issue</h1>
        <p className="mt-3 text-slate-600">
          Tell an administrator what went wrong. Your report appears live in the admin Errors queue.
        </p>
        <p className="mt-4 text-sm text-slate-500">Signed in as {user?.email}</p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">Issue title</label>
          <input
            id="title"
            required
            maxLength={120}
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            placeholder="e.g. Cannot enroll in CIS301"
            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3"
          />
        </div>

        <div>
          <label htmlFor="severity" className="block text-sm font-medium text-slate-700">Severity</label>
          <select
            id="severity"
            value={formData.severity}
            onChange={(event) => setFormData((current) => ({ ...current, severity: event.target.value }))}
            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700">Describe the problem</label>
          <textarea
            id="message"
            required
            rows={6}
            value={formData.message}
            onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))}
            placeholder="What were you trying to do, and what happened instead?"
            className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3"
          />
        </div>

        {error && <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:bg-slate-400"
          >
            {loading ? 'Sending…' : 'Send to admin'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700"
          >
            Back
          </button>
          <Link to="/dashboard" className="rounded-full border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700">
            Dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}
