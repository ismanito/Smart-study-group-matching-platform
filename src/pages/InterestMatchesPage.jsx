import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAVY = '#1a3a52';
const YELLOW = '#f5c518';

function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}

export default function InterestMatchesPage() {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch('/api/interests/find-matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load matches.');
      setMatches(Array.isArray(payload) ? payload : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load matches.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#1a3a52]" />
        <p className="text-sm text-slate-500">Finding study matches…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em]" style={{ color: NAVY }}>
          Shared subjects
        </p>
        <h1 className="mt-2 text-4xl font-semibold" style={{ color: NAVY }}>
          Study Group Matches
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Classmates who share your interests, ranked by how many subjects overlap.
        </p>
        <Link to="/interests" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">
          ← Edit your interests
        </Link>
      </section>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
          <h2 className="text-lg font-semibold" style={{ color: NAVY }}>
            No matches yet
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Add more interests or check back when more students join.
          </p>
          <Link
            to="/interests"
            className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-extrabold"
            style={{ backgroundColor: YELLOW, color: NAVY }}
          >
            Choose interests
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((peer) => (
            <article
              key={peer.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {peer.profilePicture ? (
                    <img
                      src={peer.profilePicture}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: NAVY }}
                    >
                      {initials(peer.name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: NAVY }}>
                      {peer.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {peer.sharedCount} shared interest{peer.sharedCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                <Link
                  to={`/peers/${peer.id}`}
                  className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-extrabold"
                  style={{ backgroundColor: NAVY, color: YELLOW }}
                >
                  View Profile
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(peer.sharedInterests || []).map((interest) => (
                  <span
                    key={interest.id || interest.name}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold"
                    style={{ color: NAVY }}
                  >
                    {interest.icon ? `${interest.icon} ` : ''}
                    {interest.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
