import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { INTEREST_OPTIONS, STUDY_METHOD_OPTIONS, WEEK_DAYS } from '../data/studyPrefs.js';

const emptySlot = { day: 'Monday', start: '18:00', end: '20:00' };

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.message || 'Unable to load profile.');
        setProfile({
          ...payload,
          interests: payload.interests || [],
          studyMethods: payload.studyMethods || [],
          availability: payload.availability?.length ? payload.availability : [],
        });
      } catch (loadError) {
        setError(loadError.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const toggleValue = (field, value) => {
    setProfile((current) => {
      const list = current[field] || [];
      return {
        ...current,
        [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value].slice(0, 8),
      };
    });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: profile.bio,
          interests: profile.interests,
          studyMethods: profile.studyMethods,
          availability: profile.availability,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save profile.');
      setProfile(payload.profile);
      setSuccess('Profile saved. Matching will use your interests, methods, and schedule.');
    } catch (saveError) {
      setError(saveError.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm">Loading your study profile…</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Your study identity</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">Profile & preferences</h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Tell classmates how you like to learn. Matches use shared courses, interests, study methods, and overlapping free time.
        </p>
      </section>

      <form onSubmit={saveProfile} className="space-y-6 rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div>
          <label className="block text-sm font-medium text-slate-700">Bio</label>
          <textarea
            value={profile.bio || ''}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
            maxLength={280}
            rows={3}
            placeholder="e.g. Second-year CS student looking for weekly exam prep partners."
            className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Interests</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <ToggleChip
                key={interest}
                label={interest}
                active={(profile.interests || []).includes(interest)}
                onClick={() => toggleValue('interests', interest)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Study methods</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {STUDY_METHOD_OPTIONS.map((method) => (
              <ToggleChip
                key={method}
                label={method}
                active={(profile.studyMethods || []).includes(method)}
                onClick={() => toggleValue('studyMethods', method)}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Weekly availability</p>
            <button
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  availability: [...(current.availability || []), { ...emptySlot }],
                }))
              }
              className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Add time slot
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {(profile.availability || []).map((slot, index) => (
              <div key={`${slot.day}-${index}`} className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
                <select
                  value={slot.day}
                  onChange={(event) =>
                    setProfile((current) => {
                      const availability = [...current.availability];
                      availability[index] = { ...availability[index], day: event.target.value };
                      return { ...current, availability };
                    })
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2"
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.start}
                  onChange={(event) =>
                    setProfile((current) => {
                      const availability = [...current.availability];
                      availability[index] = { ...availability[index], start: event.target.value };
                      return { ...current, availability };
                    })
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(event) =>
                    setProfile((current) => {
                      const availability = [...current.availability];
                      availability[index] = { ...availability[index], end: event.target.value };
                      return { ...current, availability };
                    })
                  }
                  className="rounded-2xl border border-slate-300 bg-white px-3 py-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProfile((current) => ({
                      ...current,
                      availability: current.availability.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                  className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
            {(profile.availability || []).length === 0 && (
              <p className="text-sm text-slate-500">Add when you can study so peers can align sessions with you.</p>
            )}
          </div>
        </div>

        {error && <p className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {success && <p className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}
