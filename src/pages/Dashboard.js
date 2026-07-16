import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UnitBadge from '../components/UnitBadge';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState({ groups: 0, peers: 0, notes: 0 });
  const [units, setUnits] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingUnitId, setSavingUnitId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setError('');
      setLoading(true);

      try {
        const [summaryRes, unitsRes, activityRes] = await Promise.all([
          fetch('/api/dashboard/summary', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/units', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/activity?limit=3', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!summaryRes.ok) throw new Error('Unable to load dashboard summary.');
        if (!unitsRes.ok) throw new Error('Unable to load enrolled units.');
        if (!activityRes.ok) throw new Error('Unable to load recent activity.');

        const summaryData = await summaryRes.json();
        const unitsData = await unitsRes.json();
        const activityData = await activityRes.json();

        setSummary({
          groups: summaryData.groupsCount ?? summaryData.groups ?? 0,
          peers: summaryData.peersCount ?? summaryData.matchedPeers ?? 0,
          notes: summaryData.notesCount ?? summaryData.uploadedNotes ?? 0,
        });
        setUnits(Array.isArray(unitsData) ? unitsData : unitsData.units || []);
        setActivity(Array.isArray(activityData) ? activityData : activityData.items || []);
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const enrollUnit = async (unitId) => {
    setSavingUnitId(unitId);
    setError('');

    try {
      const response = await fetch('/api/units/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ unitId }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to enroll in unit.');
      }

      setUnits((current) =>
        current.map((unit) =>
          unit.id === unitId || unit.unitId === unitId
            ? { ...unit, enrolled: true }
            : unit
        )
      );
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to enroll in the selected unit.');
    } finally {
      setSavingUnitId(null);
    }
  };

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => (b.enrolled === a.enrolled ? 0 : b.enrolled ? -1 : 1)),
    [units]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Welcome back</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">
              Hi, {user?.name ?? 'Student'}
            </h1>
          </div>
          <div className="rounded-3xl bg-slate-50 px-5 py-4 text-slate-700 shadow-inner">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Latest activity</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activity.length}</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-slate-600">
          Here’s a quick overview of your study network, enrolled units, and recent updates.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">My Groups</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{loading ? '–' : summary.groups}</p>
          <p className="mt-2 text-sm text-slate-500">Active groups you’re a member of.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Matched Peers</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{loading ? '–' : summary.peers}</p>
          <p className="mt-2 text-sm text-slate-500">Peers matched to your courses and study style.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Notes Uploaded</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{loading ? '–' : summary.notes}</p>
          <p className="mt-2 text-sm text-slate-500">Shared notes available across your study groups.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">My Enrolled Units</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Manage your current units</h2>
            </div>
            {loading && <span className="text-sm text-slate-400">Loading units…</span>}
          </div>

          {error && (
            <div className="my-6 rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4">
            {sortedUnits.length > 0 ? (
              sortedUnits.map((unit) => (
                <div key={unit.id ?? unit.unitId ?? unit.code} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <UnitBadge code={unit.code ?? unit.unitCode ?? 'UNKNOWN'} />
                      <p className="text-lg font-semibold text-slate-900">{unit.name ?? unit.title ?? 'Untitled unit'}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{unit.description ?? 'Stay enrolled and improve your matching results.'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {unit.enrolled ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                        <span>✓</span>
                        Enrolled
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => enrollUnit(unit.id ?? unit.unitId)}
                        disabled={savingUnitId === (unit.id ?? unit.unitId)}
                        className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {savingUnitId === (unit.id ?? unit.unitId) ? 'Enrolling…' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
                <p className="text-lg font-semibold text-slate-900">No units available yet</p>
                <p className="mt-2">Enroll in units to improve your match recommendations and group invitations.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Recent Activity</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Latest updates</h2>

          <div className="mt-6 space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-3xl bg-slate-100 p-5" />
              ))
            ) : activity.length > 0 ? (
              activity.map((item) => (
                <div key={item.id ?? item.timestamp ?? item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">{item.title ?? item.message ?? 'Recent activity'}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {item.description ?? item.message ?? 'No additional details available.'}
                  </p>
                  {item.timestamp && <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">{new Date(item.timestamp).toLocaleDateString()}</p>}
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-slate-600">
                <p className="font-semibold text-slate-900">No recent activity</p>
                <p className="mt-2">Once you interact with groups or upload notes, you’ll see your latest updates here.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
