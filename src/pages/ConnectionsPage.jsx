import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UnitBadge from '../components/UnitBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ConnectionsPage() {
  const { token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/connections', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load connections.');
        setConnections(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load connections.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Your network</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Connections</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Mutual matches become real connections. Share notes, compare schedules, and study with people who learn like you.
        </p>
      </section>

      {error && <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm">Loading connections…</div>
      ) : connections.length > 0 ? (
        <section className="grid gap-5 md:grid-cols-2">
          {connections.map((peer) => (
            <article key={peer.id} className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{peer.name}</h2>
                  <p className="text-sm text-slate-600">{peer.email}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  Connected
                </span>
              </div>
              {peer.bio && <p className="mt-4 text-sm text-slate-600">{peer.bio}</p>}
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shared courses</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(peer.sharedUnits || []).map((code) => <UnitBadge key={code} code={code} />)}
                  {(peer.sharedUnits || []).length === 0 && <span className="text-sm text-slate-500">None yet</span>}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shared interests</p>
                <p className="mt-2 text-sm text-slate-700">{(peer.sharedInterests || []).join(' · ') || '—'}</p>
              </div>
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shared methods</p>
                <p className="mt-2 text-sm text-slate-700">{(peer.sharedMethods || []).join(' · ') || '—'}</p>
              </div>
              {(peer.scheduleOverlaps || []).length > 0 && (
                <p className="mt-4 text-sm font-semibold text-emerald-700">
                  Next overlap: {peer.scheduleOverlaps[0].day} {peer.scheduleOverlaps[0].start}–{peer.scheduleOverlaps[0].end}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/notes" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Shared notes</Link>
                <Link to="/schedule" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Align schedule</Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
          <p className="text-xl font-semibold text-slate-900">No connections yet</p>
          <p className="mt-3">Match with classmates and wait for them to match you back.</p>
          <Link to="/match" className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">
            Find peers
          </Link>
        </div>
      )}
    </div>
  );
}
