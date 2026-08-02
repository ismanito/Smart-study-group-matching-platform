import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import UnitBadge from '../components/UnitBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const MAX_NOTE_SIZE = 10 * 1024 * 1024;
const acceptedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.md'];
const emptyForm = { title: '', unitId: '', visibility: 'connections', groupId: '' };

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatUploadedDate = (value) => new Date(value).toLocaleDateString();

const isAcceptedFile = (file) => {
  const filename = file.name.toLowerCase();
  return acceptedExtensions.some((extension) => filename.endsWith(extension));
};

export default function NotesPage() {
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [units, setUnits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [downloadingNoteId, setDownloadingNoteId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError('');

      try {
        const [unitsResponse, notesResponse, sharedResponse, groupsResponse] = await Promise.all([
          fetch('/api/units', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/notes', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/notes/shared', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const unitsPayload = await unitsResponse.json();
        const notesPayload = await notesResponse.json();
        const sharedPayload = await sharedResponse.json();
        const groupsPayload = await groupsResponse.json();

        if (!unitsResponse.ok) throw new Error(unitsPayload.message || 'Unable to load your courses.');
        if (!notesResponse.ok) throw new Error(notesPayload.message || 'Unable to load your notes.');
        if (!sharedResponse.ok) throw new Error(sharedPayload.message || 'Unable to load shared notes.');
        if (!groupsResponse.ok) throw new Error(groupsPayload.message || 'Unable to load groups.');

        const enrolledUnits = (Array.isArray(unitsPayload) ? unitsPayload : unitsPayload.units || [])
          .filter((unit) => unit.enrolled);
        const myGroups = Array.isArray(groupsPayload) ? groupsPayload : [];
        setUnits(enrolledUnits);
        setGroups(myGroups);
        setNotes(Array.isArray(notesPayload) ? notesPayload : notesPayload.notes || []);
        setSharedNotes(Array.isArray(sharedPayload) ? sharedPayload : []);
        setFormData((current) => ({
          ...current,
          unitId: current.unitId || String(enrolledUnits[0]?.id || ''),
          groupId: current.groupId || myGroups[0]?.id || '',
        }));
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load your notes.');
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [token]);

  const chooseFile = (candidate) => {
    if (!candidate) return;
    setError('');
    setSuccess('');

    if (!isAcceptedFile(candidate)) {
      setFile(null);
      setError('Choose a PDF, Word, Markdown, or text file.');
      return;
    }

    if (candidate.size > MAX_NOTE_SIZE) {
      setFile(null);
      setError('Notes must be 10 MB or smaller.');
      return;
    }

    setFile(candidate);
  };

  const handleFileChange = (event) => chooseFile(event.target.files?.[0]);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title.trim() || !formData.unitId || !file) {
      setError('Add a title, choose an enrolled course, and select a file.');
      return;
    }

    setUploading(true);
    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('unitId', formData.unitId);
    payload.append('visibility', formData.visibility);
    if (formData.visibility === 'group') payload.append('groupId', formData.groupId);
    payload.append('file', file);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: payload,
      });
      const responseData = await response.json();

      if (!response.ok) throw new Error(responseData.message || 'Unable to upload this note.');

      setNotes((current) => [responseData.note, ...current]);
      setFormData((current) => ({
        ...emptyForm,
        unitId: current.unitId,
        visibility: current.visibility,
        groupId: current.groupId,
      }));
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess(responseData.message || 'Note uploaded successfully.');
    } catch (uploadError) {
      setError(uploadError.message || 'Unable to upload this note.');
    } finally {
      setUploading(false);
    }
  };

  const downloadNote = async (note) => {
    setDownloadingNoteId(note.id);
    setError('');

    try {
      const response = await fetch(`/api/notes/${note.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to download this note.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = note.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || 'Unable to download this note.');
    } finally {
      setDownloadingNoteId(null);
    }
  };

  const deleteNote = async (note) => {
    if (!window.confirm(`Delete “${note.title}”?`)) return;

    setDeletingNoteId(note.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || 'Unable to delete this note.');

      setNotes((current) => current.filter((item) => item.id !== note.id));
      setSuccess(payload.message || 'Note deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-600">My notes</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Share study notes</h1>
            <p className="mt-3 max-w-2xl leading-6 text-slate-600">
              Keep private files for yourself, or share with connections and study groups so classmates can download them.
            </p>
          </div>
          <span className="w-fit rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            {notes.length} mine · {sharedNotes.length} shared with you
          </span>
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

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
        <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Upload a note</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Publish your study material</h2>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <label
              htmlFor="note-file"
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`block cursor-pointer rounded-3xl border-2 border-dashed p-6 text-center transition ${
                dragging ? 'border-violet-500 bg-violet-50' : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                id="note-file"
                type="file"
                accept={acceptedExtensions.join(',')}
                onChange={handleFileChange}
                className="sr-only"
              />
              <span className="text-3xl" aria-hidden="true">↑</span>
              <span className="mt-3 block font-semibold text-slate-900">Choose a file or drag it here</span>
              <span className="mt-2 block text-sm leading-5 text-slate-500">PDF, DOC, DOCX, TXT, or MD · up to 10 MB</span>
              {file && <span className="mt-4 block truncate text-sm font-semibold text-violet-700">Selected: {file.name}</span>}
            </label>

            <div>
              <label htmlFor="note-title" className="block text-sm font-medium text-slate-700">Note title</label>
              <input
                id="note-title"
                name="title"
                type="text"
                maxLength={120}
                value={formData.title}
                onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                placeholder="e.g. Week 4 recursion summary"
                required
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label htmlFor="note-unit" className="block text-sm font-medium text-slate-700">Course</label>
              <select
                id="note-unit"
                name="unitId"
                value={formData.unitId}
                onChange={(event) => setFormData((current) => ({ ...current, unitId: event.target.value }))}
                disabled={units.length === 0}
                required
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select an enrolled course</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.code} · {unit.name}</option>)}
              </select>
              {units.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  Enroll in a course on your <Link to="/dashboard" className="font-semibold text-blue-600 hover:text-blue-700">dashboard</Link> before uploading notes.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="note-visibility" className="block text-sm font-medium text-slate-700">Who can see this</label>
              <select
                id="note-visibility"
                value={formData.visibility}
                onChange={(event) => setFormData((current) => ({ ...current, visibility: event.target.value }))}
                className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
              >
                <option value="private">Only me</option>
                <option value="connections">My connections</option>
                <option value="group">A study group</option>
              </select>
            </div>

            {formData.visibility === 'group' && (
              <div>
                <label htmlFor="note-group" className="block text-sm font-medium text-slate-700">Study group</label>
                <select
                  id="note-group"
                  value={formData.groupId}
                  onChange={(event) => setFormData((current) => ({ ...current, groupId: event.target.value }))}
                  className="mt-2 block w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3"
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || units.length === 0}
              className="inline-flex w-full items-center justify-center rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {uploading ? 'Uploading…' : 'Upload note'}
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Personal library</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Your uploaded notes</h2>
            </div>
            <p className="text-sm text-slate-500">Private, connections, or group visibility.</p>
          </div>

          <div className="mt-7 space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-3xl bg-slate-100 p-5">
                  <div className="h-5 w-2/3 rounded-full bg-slate-200" />
                  <div className="mt-3 h-4 w-1/2 rounded-full bg-slate-200" />
                </div>
              ))
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <article key={note.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-violet-200 hover:bg-white sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{note.title}</h3>
                      <UnitBadge code={note.unitCode} />
                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {note.visibility || 'private'}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-600">{note.filename}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {formatFileSize(note.fileSize)} · Uploaded {formatUploadedDate(note.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => downloadNote(note)}
                      disabled={downloadingNoteId === note.id}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingNoteId === note.id ? 'Downloading…' : 'Download'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(note)}
                      disabled={deletingNoteId === note.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingNoteId === note.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                <p className="text-lg font-semibold text-slate-900">Your notes will appear here</p>
                <p className="mt-2">Upload a course file to start building your personal study library.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <p className="text-sm uppercase tracking-[0.28em] text-emerald-600">From your network</p>
        <h2 className="mt-3 text-2xl font-semibold text-slate-900">Notes shared with you</h2>
        <div className="mt-6 space-y-3">
          {sharedNotes.length > 0 ? (
            sharedNotes.map((note) => (
              <article key={note.id} className="flex flex-col gap-4 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">{note.title}</h3>
                    <UnitBadge code={note.unitCode} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">Shared by {note.uploaderName} · {note.filename}</p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadNote(note)}
                  disabled={downloadingNoteId === note.id}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  {downloadingNoteId === note.id ? 'Downloading…' : 'Download'}
                </button>
              </article>
            ))
          ) : (
            <p className="text-slate-600">
              When connected classmates share notes with connections or groups you join, they appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
