import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import UnitBadge from '../components/UnitBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const formatMemberCount = (count) => `${count} ${count === 1 ? 'member' : 'members'}`;

export default function GroupsPage() {
  const { token } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionGroupId, setActionGroupId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/groups/discoverable', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Unable to load study groups.');
        }

        setGroups(Array.isArray(payload) ? payload : payload.groups || []);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load study groups.');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [token]);

  const joinGroup = async (groupId) => {
    setActionGroupId(groupId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to join this study group.');
      }

      setGroups((current) =>
        current.map((group) => (group.id === groupId ? { ...group, ...payload.group, isMember: true } : group))
      );
      setSuccess(payload.message || 'You joined the study group.');
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to join this study group.');
    } finally {
      setActionGroupId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-600">Study groups</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Find your people</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Join a group that matches your courses, keep a steady study rhythm, and learn alongside classmates.
          </p>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <div className="h-6 w-2/3 rounded-full bg-slate-200" />
              <div className="mt-5 h-4 rounded-full bg-slate-200" />
              <div className="mt-3 h-4 w-4/5 rounded-full bg-slate-200" />
              <div className="mt-8 h-11 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : groups.length > 0 ? (
        <section className="grid gap-6 md:grid-cols-2" aria-label="Available study groups">
          {groups.map((group) => (
            <article
              key={group.id}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-violet-600">Study group</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{group.name}</h2>
                </div>
                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                  {formatMemberCount(group.memberCount ?? group.members?.length ?? 0)}
                </span>
              </div>

              <p className="mt-5 min-h-12 leading-6 text-slate-600">{group.description}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {(group.unitCodes || []).map((code) => <UnitBadge key={code} code={code} />)}
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Next session</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{group.nextSession || 'Schedule coming soon'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to={`/groups/${group.id}`}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    View details
                  </Link>
                  {group.isMember ? (
                    <span className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700">
                      <span aria-hidden="true">✓</span>
                      Joined
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => joinGroup(group.id)}
                      disabled={actionGroupId === group.id}
                      className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                      {actionGroupId === group.id ? 'Joining…' : 'Join group'}
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-700">
          <p className="text-xl font-semibold text-slate-900">No study groups available yet</p>
          <p className="mt-3 text-slate-600">Check back soon for groups built around your enrolled classes.</p>
        </div>
      )}
    </div>
  );
}
