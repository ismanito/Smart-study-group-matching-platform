import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import UnitBadge from '../components/UnitBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { STUDY_METHOD_OPTIONS } from '../data/studyPrefs.js';

const emptyMeetingForm = {
  title: '',
  scheduledAt: '',
  durationMinutes: '60',
  mode: 'online',
  location: '',
  meetingLink: '',
  notes: '',
};

const emptyReschedule = {
  meetingId: '',
  title: '',
  scheduledAt: '',
  mode: 'online',
  location: '',
  meetingLink: '',
  notes: '',
  reason: '',
};

const toLocalInputValue = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatWhen = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const fieldClass =
  'w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function GroupDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [chatBody, setChatBody] = useState('');
  const [meetingForm, setMeetingForm] = useState(emptyMeetingForm);
  const [reschedule, setReschedule] = useState(emptyReschedule);
  const [ratingForm, setRatingForm] = useState({ method: STUDY_METHOD_OPTIONS[0], score: '4', comment: '' });
  const [howWeMeet, setHowWeMeet] = useState({
    meetingMode: 'online',
    meetingLink: '',
    campusLocation: '',
    nextSession: '',
  });

  const loadGroup = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load this group.');
      setGroup(payload);
      setHowWeMeet({
        meetingMode: payload.meetingMode || 'online',
        meetingLink: payload.meetingLink || '',
        campusLocation: payload.campusLocation || '',
        nextSession: payload.nextSession || '',
      });
      setMeetingForm((current) => ({
        ...current,
        mode: payload.meetingMode || current.mode,
        location: payload.campusLocation || current.location,
        meetingLink: payload.meetingLink || current.meetingLink,
      }));
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load this group.');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const api = async (path, options = {}) => {
    const response = await fetch(path, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'Request failed.');
    return payload;
  };

  const handleJoin = async () => {
    setBusy('join');
    setStatus('');
    setError('');
    try {
      const payload = await api(`/api/groups/${id}/join`, { method: 'POST', body: '{}' });
      setStatus(payload.message);
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleSendChat = async (event) => {
    event.preventDefault();
    if (!chatBody.trim()) return;
    setBusy('chat');
    setError('');
    try {
      await api(`/api/groups/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: chatBody.trim() }),
      });
      setChatBody('');
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleScheduleMeeting = async (event) => {
    event.preventDefault();
    setBusy('schedule');
    setStatus('');
    setError('');
    try {
      const payload = await api(`/api/groups/${id}/meetings`, {
        method: 'POST',
        body: JSON.stringify({
          ...meetingForm,
          durationMinutes: Number(meetingForm.durationMinutes),
        }),
      });
      setStatus(payload.message);
      setMeetingForm((current) => ({ ...emptyMeetingForm, mode: current.mode, location: current.location, meetingLink: current.meetingLink }));
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const openReschedule = (meeting) => {
    setReschedule({
      meetingId: meeting.id,
      title: meeting.title,
      scheduledAt: toLocalInputValue(meeting.scheduledAt),
      mode: meeting.mode,
      location: meeting.location || '',
      meetingLink: meeting.meetingLink || '',
      notes: meeting.notes || '',
      reason: '',
    });
  };

  const handleReschedule = async (event) => {
    event.preventDefault();
    setBusy('reschedule');
    setStatus('');
    setError('');
    try {
      const payload = await api(`/api/groups/${id}/meetings/${reschedule.meetingId}`, {
        method: 'PATCH',
        body: JSON.stringify(reschedule),
      });
      setStatus(payload.message);
      setReschedule(emptyReschedule);
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleRsvp = async (meetingId, rsvpStatus) => {
    setBusy(`rsvp-${meetingId}`);
    setError('');
    try {
      await api(`/api/groups/${id}/meetings/${meetingId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status: rsvpStatus }),
      });
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleRateMethod = async (event) => {
    event.preventDefault();
    setBusy('rate');
    setStatus('');
    setError('');
    try {
      const payload = await api(`/api/groups/${id}/method-ratings`, {
        method: 'POST',
        body: JSON.stringify({
          method: ratingForm.method,
          score: Number(ratingForm.score),
          comment: ratingForm.comment,
        }),
      });
      setStatus(payload.message);
      setRatingForm((current) => ({ ...current, comment: '' }));
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const handleHowWeMeet = async (event) => {
    event.preventDefault();
    setBusy('how');
    setStatus('');
    setError('');
    try {
      const payload = await api(`/api/groups/${id}/how-we-meet`, {
        method: 'PATCH',
        body: JSON.stringify(howWeMeet),
      });
      setStatus(payload.message);
      await loadGroup();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const downloadNote = async (note) => {
    try {
      const response = await fetch(`/api/notes/${note.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || 'Download failed.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = note.filename || 'note';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">Loading group details…</div>;
  }

  if (error && !group) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-lg font-semibold text-slate-900">Group unavailable</p>
        <p className="text-slate-600">{error}</p>
        <Link to="/groups" className="inline-flex rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Back to groups
        </Link>
      </div>
    );
  }

  const isMember = group.isMember;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <Link to="/groups" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          ← Back to groups
        </Link>
        <p className="mt-4 text-sm uppercase tracking-[0.3em] text-violet-600">Study group</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-900">{group.name}</h1>
        <p className="mt-4 max-w-3xl text-slate-600">{group.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(group.unitCodes || []).map((code) => (
            <UnitBadge key={code} code={code} />
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">How we meet</p>
            <p className="mt-1 font-semibold capitalize text-slate-900">{group.meetingMode || 'TBD'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next session</p>
            <p className="mt-1 font-semibold text-slate-900">{group.nextSession || 'Schedule coming soon'}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
            <p className="mt-1 font-semibold text-slate-900">
              {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        {group.meetingLink ? (
          <p className="mt-4 text-sm text-slate-600">
            Online link:{' '}
            <a href={group.meetingLink} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:text-blue-700">
              {group.meetingLink}
            </a>
          </p>
        ) : null}
        {group.campusLocation ? (
          <p className="mt-2 text-sm text-slate-600">Campus: {group.campusLocation}</p>
        ) : null}
        {(group.preferredMethods || []).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {group.preferredMethods.map((method) => (
              <span key={method} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {method}
              </span>
            ))}
          </div>
        ) : null}
        {!isMember ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={busy === 'join'}
            className="mt-6 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy === 'join' ? 'Joining…' : 'Join this group'}
          </button>
        ) : (
          <p className="mt-6 text-sm font-semibold text-emerald-700">You are a member — chat, meet, rate methods, and share notes below.</p>
        )}
        {status ? <p className="mt-4 text-sm font-medium text-emerald-700">{status}</p> : null}
        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Members</h2>
        <div className="mt-6 space-y-3">
          {(group.members || []).length > 0 ? (
            group.members.map((member) => (
              <div key={member.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="font-semibold text-slate-900">
                  {member.name}
                  {member.id === user?.id ? ' (you)' : ''}
                </p>
                <p className="text-sm text-slate-600">{member.email}</p>
                {(member.studyMethods || []).length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">Methods: {member.studyMethods.join(', ')}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-slate-600">No members yet. Be the first to join.</p>
          )}
        </div>
      </section>

      {isMember ? (
        <>
          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900">Group chat</h2>
              <p className="mt-2 text-sm text-slate-600">Coordinate with members in real time.</p>
              <div className="mt-6 max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {(group.messages || []).length > 0 ? (
                  group.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-2xl px-4 py-3 ${message.isMine ? 'ml-8 bg-blue-600 text-white' : 'mr-8 border border-slate-200 bg-white text-slate-900'}`}
                    >
                      <p className={`text-xs font-semibold ${message.isMine ? 'text-blue-100' : 'text-slate-600'}`}>
                        {message.name} · {new Date(message.createdAt).toLocaleString()}
                      </p>
                      <p className={`mt-1 text-sm whitespace-pre-wrap ${message.isMine ? 'text-white' : 'text-slate-900'}`}>
                        {message.body}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No messages yet. Say hi to the group.</p>
                )}
              </div>
              <form onSubmit={handleSendChat} className="mt-4 flex gap-2">
                <input
                  value={chatBody}
                  onChange={(event) => setChatBody(event.target.value)}
                  placeholder="Write a message…"
                  className={`flex-1 ${fieldClass}`}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  disabled={busy === 'chat' || !chatBody.trim()}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900">How we meet</h2>
              <p className="mt-2 text-sm text-slate-600">Set online link, campus spot, or hybrid defaults.</p>
              <form onSubmit={handleHowWeMeet} className="mt-6 space-y-3">
                <select
                  value={howWeMeet.meetingMode}
                  onChange={(event) => setHowWeMeet((current) => ({ ...current, meetingMode: event.target.value }))}
                  className={fieldClass}
                >
                  <option value="online">Online</option>
                  <option value="campus">On campus</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <input
                  value={howWeMeet.meetingLink}
                  onChange={(event) => setHowWeMeet((current) => ({ ...current, meetingLink: event.target.value }))}
                  placeholder="Video meeting link"
                  className={fieldClass}
                />
                <input
                  value={howWeMeet.campusLocation}
                  onChange={(event) => setHowWeMeet((current) => ({ ...current, campusLocation: event.target.value }))}
                  placeholder="Campus location"
                  className={fieldClass}
                />
                <input
                  value={howWeMeet.nextSession}
                  onChange={(event) => setHowWeMeet((current) => ({ ...current, nextSession: event.target.value }))}
                  placeholder="Recurring next-session label"
                  className={fieldClass}
                />
                <button
                  type="submit"
                  disabled={busy === 'how'}
                  className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busy === 'how' ? 'Saving…' : 'Save meeting plan'}
                </button>
              </form>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Meetings</h2>
                <p className="mt-2 text-sm text-slate-600">Schedule sessions, RSVP, and reschedule when plans change.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {(group.meetings || []).length > 0 ? (
                group.meetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{meeting.title}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatWhen(meeting.scheduledAt)} · {meeting.durationMinutes} min · {meeting.mode}
                        </p>
                        {meeting.location ? <p className="mt-1 text-sm text-slate-600">Location: {meeting.location}</p> : null}
                        {meeting.meetingLink ? (
                          <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-blue-600">
                            Join online
                          </a>
                        ) : null}
                        {meeting.notes ? <p className="mt-2 text-sm text-slate-500">{meeting.notes}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => openReschedule(meeting)}
                        className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                      >
                        Reschedule
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['going', 'maybe', 'not_going'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleRsvp(meeting.id, option)}
                          disabled={busy === `rsvp-${meeting.id}`}
                          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                            meeting.myRsvp === option
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-700 ring-1 ring-slate-200'
                          }`}
                        >
                          {option.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                    {(meeting.rsvps || []).length > 0 ? (
                      <p className="mt-3 text-xs text-slate-500">
                        RSVPs:{' '}
                        {meeting.rsvps.map((entry) => `${entry.name} (${entry.status.replace('_', ' ')})`).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-slate-600">No meetings yet. Schedule the first one.</p>
              )}
            </div>

            {reschedule.meetingId ? (
              <form onSubmit={handleReschedule} className="mt-6 space-y-3 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-semibold text-slate-900">Reschedule meeting</p>
                <input
                  value={reschedule.title}
                  onChange={(event) => setReschedule((current) => ({ ...current, title: event.target.value }))}
                  className={fieldClass}
                  required
                />
                <input
                  type="datetime-local"
                  value={reschedule.scheduledAt}
                  onChange={(event) => setReschedule((current) => ({ ...current, scheduledAt: event.target.value }))}
                  className={fieldClass}
                  required
                />
                <select
                  value={reschedule.mode}
                  onChange={(event) => setReschedule((current) => ({ ...current, mode: event.target.value }))}
                  className={fieldClass}
                >
                  <option value="online">Online</option>
                  <option value="campus">On campus</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <input
                  value={reschedule.location}
                  onChange={(event) => setReschedule((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Location"
                  className={fieldClass}
                />
                <input
                  value={reschedule.meetingLink}
                  onChange={(event) => setReschedule((current) => ({ ...current, meetingLink: event.target.value }))}
                  placeholder="Meeting link"
                  className={fieldClass}
                />
                <input
                  value={reschedule.reason}
                  onChange={(event) => setReschedule((current) => ({ ...current, reason: event.target.value }))}
                  placeholder="Reason for change"
                  className={fieldClass}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy === 'reschedule'}
                    className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {busy === 'reschedule' ? 'Saving…' : 'Save new time'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReschedule(emptyReschedule)}
                    className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <form onSubmit={handleScheduleMeeting} className="mt-8 grid gap-3 rounded-3xl border border-slate-200 p-5 md:grid-cols-2">
              <p className="md:col-span-2 font-semibold text-slate-900">Schedule a new meeting</p>
              <input
                value={meetingForm.title}
                onChange={(event) => setMeetingForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Meeting title"
                className={fieldClass}
                required
              />
              <input
                type="datetime-local"
                value={meetingForm.scheduledAt}
                onChange={(event) => setMeetingForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                className={fieldClass}
                required
              />
              <select
                value={meetingForm.mode}
                onChange={(event) => setMeetingForm((current) => ({ ...current, mode: event.target.value }))}
                className={fieldClass}
              >
                <option value="online">Online</option>
                <option value="campus">On campus</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <input
                value={meetingForm.durationMinutes}
                onChange={(event) => setMeetingForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                type="number"
                min="15"
                max="240"
                placeholder="Duration (minutes)"
                className={fieldClass}
              />
              <input
                value={meetingForm.location}
                onChange={(event) => setMeetingForm((current) => ({ ...current, location: event.target.value }))}
                placeholder="Campus location"
                className={fieldClass}
              />
              <input
                value={meetingForm.meetingLink}
                onChange={(event) => setMeetingForm((current) => ({ ...current, meetingLink: event.target.value }))}
                placeholder="Online meeting link"
                className={fieldClass}
              />
              <input
                value={meetingForm.notes}
                onChange={(event) => setMeetingForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Agenda / prep notes"
                className={`md:col-span-2 ${fieldClass}`}
              />
              <button
                type="submit"
                disabled={busy === 'schedule'}
                className="md:col-span-2 w-fit rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy === 'schedule' ? 'Scheduling…' : 'Schedule meeting'}
              </button>
            </form>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <h2 className="text-2xl font-semibold text-slate-900">Evaluate study methods</h2>
              <p className="mt-2 text-sm text-slate-600">Rate what works for this group so members can adapt.</p>
              <div className="mt-6 space-y-3">
                {(group.methodRatings || []).length > 0 ? (
                  group.methodRatings.map((item) => (
                    <div key={item.method} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{item.method}</p>
                        <p className="text-sm font-semibold text-violet-700">
                          {item.average}/5 · {item.count} {item.count === 1 ? 'rating' : 'ratings'}
                        </p>
                      </div>
                      {(item.comments || []).slice(0, 2).map((comment, index) => (
                        <p key={`${item.method}-${index}`} className="mt-2 text-xs text-slate-500">
                          {comment.name}: “{comment.comment}”
                        </p>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No ratings yet. Be the first to evaluate a method.</p>
                )}
              </div>
              <form onSubmit={handleRateMethod} className="mt-6 space-y-3">
                <select
                  value={ratingForm.method}
                  onChange={(event) => setRatingForm((current) => ({ ...current, method: event.target.value }))}
                  className={fieldClass}
                >
                  {STUDY_METHOD_OPTIONS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <select
                  value={ratingForm.score}
                  onChange={(event) => setRatingForm((current) => ({ ...current, score: event.target.value }))}
                  className={fieldClass}
                >
                  {[5, 4, 3, 2, 1].map((score) => (
                    <option key={score} value={score}>
                      {score} / 5
                    </option>
                  ))}
                </select>
                <input
                  value={ratingForm.comment}
                  onChange={(event) => setRatingForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Optional comment"
                  className={fieldClass}
                />
                <button
                  type="submit"
                  disabled={busy === 'rate'}
                  className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {busy === 'rate' ? 'Saving…' : 'Submit rating'}
                </button>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Shared group notes</h2>
                  <p className="mt-2 text-sm text-slate-600">Notes shared with visibility set to this group.</p>
                </div>
                <Link
                  to="/notes"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Upload / share notes
                </Link>
              </div>
              <div className="mt-6 space-y-3">
                {(group.notes || []).length > 0 ? (
                  group.notes.map((note) => (
                    <div key={note.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-900">{note.title}</p>
                        <p className="text-xs text-slate-500">
                          {note.unitCode} · {note.filename} · by {note.uploaderName || 'member'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadNote(note)}
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        Download
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No group notes yet. On the Notes page, upload a file and choose visibility “group”, then pick this group.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Member tools locked</h2>
          <p className="mt-3 text-slate-600">
            Join this group to chat with members, schedule or reschedule meetings, evaluate study methods, and access shared notes.
          </p>
        </section>
      )}
    </div>
  );
}
