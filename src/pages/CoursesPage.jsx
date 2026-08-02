import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UnitBadge from '../components/UnitBadge.jsx';

export default function CoursesPage() {
  const { token } = useAuth();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadUnits = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/units', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load courses.');
      setUnits(Array.isArray(payload) ? payload : payload.units || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [token]);

  const enroll = async (unitId) => {
    setBusyId(unitId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/units/enroll', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unitId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to enroll.');
      setUnits((current) =>
        current.map((unit) => (unit.id === unitId ? { ...unit, enrolled: true } : unit))
      );
      setSuccess(payload.message || 'Enrolled successfully.');
    } catch (enrollError) {
      setError(enrollError.message || 'Unable to enroll.');
    } finally {
      setBusyId(null);
    }
  };

  const unenroll = async (unitId) => {
    setBusyId(unitId);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/units/unenroll', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ unitId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to unenroll.');
      setUnits((current) =>
        current.map((unit) => (unit.id === unitId ? { ...unit, enrolled: false } : unit))
      );
      setSuccess(payload.message || 'Unenrolled successfully.');
    } catch (unenrollError) {
      setError(unenrollError.message || 'Unable to unenroll.');
    } finally {
      setBusyId(null);
    }
  };

  const enrolledCount = useMemo(() => units.filter((unit) => unit.enrolled).length, [units]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Courses</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Enroll yourself</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Pick the units you are taking. Enrollment updates your matches, notes, and study groups right away.
        </p>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          You are enrolled in {enrolledCount} {enrolledCount === 1 ? 'course' : 'courses'}.
        </p>
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
        <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">Loading courses…</div>
      ) : (
        <section className="space-y-4">
          {units.map((unit) => (
            <article
              key={unit.id}
              className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <UnitBadge code={unit.code} />
                  <h2 className="text-xl font-semibold text-slate-900">{unit.name}</h2>
                </div>
                <p className="mt-2 text-sm text-slate-600">{unit.description}</p>
              </div>
              {unit.enrolled ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">Enrolled</span>
                  <button
                    type="button"
                    onClick={() => unenroll(unit.id)}
                    disabled={busyId === unit.id}
                    className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {busyId === unit.id ? 'Updating…' : 'Unenroll'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => enroll(unit.id)}
                  disabled={busyId === unit.id}
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {busyId === unit.id ? 'Enrolling…' : 'Enroll myself'}
                </button>
              )}
            </article>
          ))}
          {units.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
              No courses yet. Ask an admin to add units.
            </div>
          )}
        </section>
      )}

      <p className="text-sm text-slate-500">
        After enrolling, visit <Link to="/match" className="font-semibold text-blue-600">Find Peers</Link> to match with classmates in the same units.
      </p>
    </div>
  );
}
