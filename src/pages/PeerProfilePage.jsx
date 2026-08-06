import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UnitBadge from '../components/UnitBadge.jsx';

const NAVY = '#1a3a52';

export default function PeerProfilePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load profile.');
        setProfile(payload);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
        <p>{error || 'Profile not found.'}</p>
        <Link to="/interest-matches" className="font-semibold text-blue-700 hover:underline">
          ← Back to matches
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/interest-matches" className="inline-block text-sm font-semibold text-blue-700 hover:underline">
        ← Back to matches
      </Link>

      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white"
            style={{ backgroundColor: NAVY }}
          >
            {(profile.name || '?')
              .split(/\s+/)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase() || '')
              .join('')}
          </div>
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: NAVY }}>
              {profile.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
          </div>
        </div>

        {profile.bio && (
          <p className="mt-6 text-slate-700">{profile.bio}</p>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Profile interests
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.interests || []).length > 0 ? (
                profile.interests.map((item) => (
                  <span
                    key={item}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: NAVY }}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">None listed</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Study methods
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(profile.studyMethods || []).length > 0 ? (
                profile.studyMethods.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold"
                    style={{ color: NAVY }}
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">None listed</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Enrolled courses
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(profile.enrolledUnits || []).length > 0 ? (
              profile.enrolledUnits.map((code) => <UnitBadge key={code} code={code} />)
            ) : (
              <p className="text-sm text-slate-500">No courses yet</p>
            )}
          </div>
        </div>

        {profile.compatibility?.sharedInterests?.length > 0 && (
          <div className="mt-8 rounded-2xl p-4" style={{ backgroundColor: '#eef3f7' }}>
            <p className="text-sm font-semibold" style={{ color: NAVY }}>
              Shared with you
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {(profile.compatibility.sharedInterests || []).join(' · ')}
            </p>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">
        Profile view only — no connection message box on this screen.
      </p>
    </div>
  );
}
