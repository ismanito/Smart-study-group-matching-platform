import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function InterestSelectionPage() {
  const { token } = useAuth();
  const [allInterests, setAllInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        fetch('/api/interests/all'),
        fetch('/api/interests/my-interests', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const allData = await allRes.json();
      const mineData = await mineRes.json();

      if (!allRes.ok) throw new Error(allData.message || 'Unable to load interests.');
      setAllInterests(Array.isArray(allData) ? allData : []);

      if (!mineRes.ok) {
        if (mineRes.status === 401) {
          throw new Error('Your session expired after a server restart. Please log out and log in again.');
        }
        throw new Error(mineData.message || 'Unable to load your interests.');
      }
      setSelected(Array.isArray(mineData) ? mineData : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load interests.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedIds = useMemo(() => new Set(selected.map((item) => item.id)), [selected]);
  const available = useMemo(
    () => allInterests.filter((item) => !selectedIds.has(item.id)),
    [allInterests, selectedIds]
  );

  const addInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    setSelected((prev) => (prev.some((item) => item.id === interest.id) ? prev : [...prev, interest]));
    try {
      const response = await fetch('/api/interests/add', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interestId: interest.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to add interest.');
    } catch (addError) {
      setSelected((prev) => prev.filter((item) => item.id !== interest.id));
      setError(addError.message || 'Unable to add interest.');
    } finally {
      setBusyId(null);
    }
  };

  const removeInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    setSelected((prev) => prev.filter((item) => item.id !== interest.id));
    try {
      const response = await fetch(`/api/interests/remove/${interest.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to remove interest.');
    } catch (removeError) {
      setSelected((prev) => [...prev, interest]);
      setError(removeError.message || 'Unable to remove interest.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-paper-line border-t-pine" />
        <p className="text-sm text-ink-muted">Loading interests…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">Study subjects</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink">Your interests</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
          Select the subjects you want to study. Matches are based on shared interests.
        </p>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-paper-line bg-paper-card p-6 shadow-soft sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink">Selected</h2>
        {selected.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-paper-line bg-paper px-4 py-8 text-center text-sm text-ink-muted">
            No interests selected yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {selected.map((interest) => (
              <div
                key={interest.id}
                className="flex items-center justify-between rounded-xl bg-pine px-4 py-3 text-paper-card"
              >
                <span className="font-semibold">
                  {interest.icon ? `${interest.icon} ` : ''}
                  {interest.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  disabled={busyId === interest.id}
                  aria-label={`Remove ${interest.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-brass text-lg font-bold leading-none text-ink disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-paper-line bg-paper-card p-6 shadow-soft sm:p-8">
        <h2 className="font-display text-xl font-semibold text-ink">Available</h2>
        {available.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-paper-line bg-paper px-4 py-8 text-center text-sm text-ink-muted">
            You’ve selected every interest.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((interest) => (
              <button
                key={interest.id}
                type="button"
                onClick={() => addInterest(interest)}
                disabled={busyId === interest.id}
                className="rounded-xl border border-paper-line bg-paper px-4 py-3 text-sm font-semibold text-ink transition hover:border-pine hover:bg-pine/5 disabled:opacity-50"
              >
                {interest.icon ? `${interest.icon} ` : ''}
                {interest.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {selected.length > 0 && (
        <div className="flex justify-center pb-4">
          <Link
            to="/interest-matches"
            className="inline-flex rounded-md bg-pine px-8 py-3.5 text-base font-semibold text-paper-card transition hover:bg-pine-deep"
          >
            Find study matches
          </Link>
        </div>
      )}
    </div>
  );
}
