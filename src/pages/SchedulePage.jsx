import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function SchedulePage() {
  const { token } = useAuth();
  const [myAvailability, setMyAvailability] = useState([]);
  const [alignments, setAlignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [alignRes, groupsRes] = await Promise.all([
          fetch('/api/schedule/align', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const alignData = await alignRes.json();
        const groupsData = await groupsRes.json();
        if (!alignRes.ok) throw new Error(alignData.message || 'Unable to load schedule alignment.');
        if (!groupsRes.ok) throw new Error(groupsData.message || 'Unable to load groups.');
        setMyAvailability(alignData.myAvailability || []);
        setAlignments(alignData.alignments || []);
        setGroups(Array.isArray(groupsData) ? groupsData : []);
      } catch (loadError) {
        setError(loadError.message || 'Unable to load schedule.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Schedule sync</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Align study time</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Compare your free slots with connected classmates and pick overlap times that work for both of you.
        </p>
        <Link to="/profile" className="mt-5 inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Edit my availability
        </Link>
      </section>

      {error && <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm">Loading schedules…</div>
      ) : (
        <>
          <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900">My availability</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {myAvailability.length > 0 ? (
                myAvailability.map((slot) => (
                  <span key={`${slot.day}-${slot.start}`} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {slot.day} · {slot.start}–{slot.end}
                  </span>
                ))
              ) : (
                <p className="text-slate-600">No personal slots yet. Add them on your profile to unlock alignment.</p>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Aligned with connections</h2>
            {alignments.length > 0 ? (
              alignments.map((item) => (
                <article key={item.peer.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{item.peer.name}</h3>
                      <p className="text-sm text-slate-600">{item.peer.email}</p>
                      {item.suggestion ? (
                        <p className="mt-3 text-sm font-semibold text-emerald-700">
                          Best overlap: {item.suggestion.day} · {item.suggestion.start}–{item.suggestion.end}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-amber-700">No overlapping free time yet. Ask them to update availability.</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{Math.round(item.totalMinutes / 60)}h shared / week</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.overlaps.map((slot) => (
                      <span key={`${slot.day}-${slot.start}`} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                        {slot.day} {slot.start}–{slot.end}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                Connect with classmates on <Link to="/match" className="font-semibold text-blue-600">Find Peers</Link> first. Mutual matches unlock schedule alignment.
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900">Group sessions</h2>
            <div className="mt-4 space-y-3">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <div key={group.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{group.nextSession || 'Schedule coming soon'}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-600">Join a group to see recurring session times here.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
