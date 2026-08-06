import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UnitBadge from '../components/UnitBadge.jsx';

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
      <section className="overflow-hidden rounded-2xl border border-paper-line bg-paper-card shadow-soft">
        <div className="border-b border-paper-line bg-gradient-to-br from-pine/10 via-paper-card to-brass/10 px-8 py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">Welcome back</p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-ink">
                {user?.name ?? 'Student'}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
                Your study network, enrolled units, and recent updates — in one place.
              </p>
            </div>
            <Link
              to="/interests"
              className="inline-flex items-center justify-center rounded-md bg-pine px-5 py-2.5 text-sm font-semibold text-paper-card transition hover:bg-pine-deep"
            >
              Choose study interests
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'My groups', value: summary.groups, hint: 'Active memberships' },
          { label: 'Connections', value: summary.peers, hint: 'Mutual classmates' },
          { label: 'Notes uploaded', value: summary.notes, hint: 'Shared course files' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-paper-line bg-paper-card p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">{stat.label}</p>
            <p className="mt-3 font-display text-4xl font-semibold text-ink">{loading ? '–' : stat.value}</p>
            <p className="mt-2 text-sm text-ink-muted">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-paper-line bg-paper-card p-8 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">Enrolled units</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Current courses</h2>
            </div>
            {loading && <span className="text-sm text-ink-muted">Loading…</span>}
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            {sortedUnits.length > 0 ? (
              sortedUnits.map((unit) => (
                <div
                  key={unit.id ?? unit.unitId ?? unit.code}
                  className="flex flex-col gap-4 rounded-xl border border-paper-line bg-paper px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <UnitBadge code={unit.code ?? unit.unitCode ?? 'UNKNOWN'} />
                      <p className="text-base font-semibold text-ink">{unit.name ?? unit.title ?? 'Untitled unit'}</p>
                    </div>
                    <p className="mt-2 text-sm text-ink-muted">
                      {unit.description ?? 'Stay enrolled to improve matching.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {unit.enrolled ? (
                      <span className="inline-flex items-center rounded-md bg-pine/10 px-3 py-1.5 text-sm font-semibold text-pine">
                        Enrolled
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => enrollUnit(unit.id ?? unit.unitId)}
                        disabled={savingUnitId === (unit.id ?? unit.unitId)}
                        className="rounded-md bg-pine px-4 py-2 text-sm font-semibold text-paper-card transition hover:bg-pine-deep disabled:cursor-not-allowed disabled:bg-ink-muted"
                      >
                        {savingUnitId === (unit.id ?? unit.unitId) ? 'Enrolling…' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-paper-line bg-paper p-8 text-ink-muted">
                <p className="font-semibold text-ink">No units available yet</p>
                <p className="mt-2 text-sm">Enroll in units to improve match recommendations.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-paper-line bg-paper-card p-8 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pine">Activity</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">Latest updates</h2>

          <div className="mt-6 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl bg-paper p-5" />
              ))
            ) : activity.length > 0 ? (
              activity.map((item) => (
                <div
                  key={item.id ?? item.timestamp ?? item.title}
                  className="rounded-xl border border-paper-line bg-paper p-4"
                >
                  <p className="text-sm font-semibold text-ink">
                    {item.title ?? item.message ?? 'Recent activity'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    {item.description ?? item.message ?? 'No additional details available.'}
                  </p>
                  {item.timestamp && (
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-ink-muted">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-paper-line bg-paper p-5 text-ink-muted">
                <p className="font-semibold text-ink">No recent activity</p>
                <p className="mt-2 text-sm">Group and note activity will show up here.</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
