import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import UnitBadge from '../components/UnitBadge.jsx';

export default function MatchPage() {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [confirmedMatches, setConfirmedMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionPeerId, setDecisionPeerId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [inviteState, setInviteState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setInviteState({ loading: false, error: '', success: '' });

      try {
        const [matchRes, confirmedRes, groupsRes] = await Promise.all([
          fetch('/api/match', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/match/confirmed', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!matchRes.ok) throw new Error('Unable to load matches.');
        if (!confirmedRes.ok) throw new Error('Unable to load your matched peers.');
        if (!groupsRes.ok) throw new Error('Unable to load your groups.');

        setMatches(await matchRes.json());
        setConfirmedMatches(await confirmedRes.json());
        setGroups(await groupsRes.json());
      } catch (fetchError) {
        setInviteState((current) => ({ ...current, error: fetchError.message || 'Unable to load matches.' }));
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [token]);

  const decidePeer = async (peer, decision) => {
    setDecisionPeerId(peer.id);
    setInviteState({ loading: false, error: '', success: '' });

    try {
      const response = await fetch('/api/match/decide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ peerId: peer.id, decision }),
      });
      const payload = await response.json();

      if (!response.ok) throw new Error(payload.message || 'Unable to save your peer choice.');

      setMatches((current) => current.filter((item) => item.id !== peer.id));
      if (decision === 'match') {
        setConfirmedMatches((current) => [
          ...current,
          {
            ...peer,
            mutual: payload.mutual,
            connected: payload.mutual,
          },
        ]);
      }
      setInviteState({ loading: false, error: '', success: payload.message || 'Your choice was saved.' });
    } catch (decisionError) {
      setInviteState({ loading: false, error: decisionError.message || 'Unable to save your peer choice.', success: '' });
    } finally {
      setDecisionPeerId(null);
    }
  };

  const openInviteModal = (peer) => {
    setSelectedPeer(peer);
    setSelectedGroup(groups[0]?.id ?? '');
    setInviteState({ loading: false, error: '', success: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPeer(null);
    setSelectedGroup('');
  };

  const sendInvite = async () => {
    if (!selectedPeer || !selectedGroup) {
      setInviteState((current) => ({ ...current, error: 'Please select a group to invite to.' }));
      return;
    }

    setInviteState({ loading: true, error: '', success: '' });

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ peerId: selectedPeer.id, groupId: selectedGroup }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to send the invitation.');

      setInviteState({ loading: false, error: '', success: payload.message || 'Peer added to the group.' });
      if (payload.group) {
        setGroups((current) => {
          const exists = current.some((group) => group.id === payload.group.id);
          return exists
            ? current.map((group) => (group.id === payload.group.id ? payload.group : group))
            : [...current, payload.group];
        });
      }
    } catch (fetchError) {
      setInviteState({ loading: false, error: fetchError.message || 'Unable to send the invitation.', success: '' });
    }
  };

  const peerCards = useMemo(() => matches, [matches]);
  const connected = confirmedMatches.filter((peer) => peer.mutual || peer.connected);
  const waiting = confirmedMatches.filter((peer) => !(peer.mutual || peer.connected));

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Smart matching</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Find classmates who study like you</h1>
          </div>
          <p className="max-w-xl text-sm text-slate-600">
            Ranked by shared courses, interests, study methods, and overlapping free time. Connect when both of you match.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/profile" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Update preferences</Link>
          <Link to="/connections" className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">View connections</Link>
        </div>
      </section>

      {inviteState.error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{inviteState.error}</div>
      )}
      {inviteState.success && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">{inviteState.success}</div>
      )}

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-3xl bg-white shadow-sm" />
          ))}
        </div>
      ) : peerCards.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-700">
          <p className="text-xl font-semibold text-slate-900">No new peers to review</p>
          <p className="mt-3 text-slate-600">
            Enroll in courses and set interests/methods on your profile to unlock better matches.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {peerCards.map((peer) => (
            <div key={peer.id} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{peer.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{peer.email}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Score {peer.score || 0}
                </span>
              </div>
              {peer.bio && <p className="mt-4 text-sm text-slate-600">{peer.bio}</p>}
              {peer.theyMatchedYou && (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700">
                  They already want to connect with you
                </p>
              )}
              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Shared courses</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(peer.sharedUnits || []).length > 0
                      ? peer.sharedUnits.map((unit) => <UnitBadge key={unit} code={unit} />)
                      : <span className="text-slate-500">None</span>}
                  </div>
                </div>
                <p><span className="font-semibold text-slate-800">Interests:</span> {(peer.sharedInterests || []).join(', ') || '—'}</p>
                <p><span className="font-semibold text-slate-800">Methods:</span> {(peer.sharedMethods || []).join(', ') || '—'}</p>
                {(peer.scheduleOverlaps || [])[0] && (
                  <p className="font-semibold text-emerald-700">
                    Overlap: {peer.scheduleOverlaps[0].day} {peer.scheduleOverlaps[0].start}–{peer.scheduleOverlaps[0].end}
                  </p>
                )}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => decidePeer(peer, 'pass')}
                  disabled={decisionPeerId === peer.id}
                  className="rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                >
                  Pass
                </button>
                <button
                  type="button"
                  onClick={() => decidePeer(peer, 'match')}
                  disabled={decisionPeerId === peer.id}
                  className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                >
                  {decisionPeerId === peer.id ? 'Saving…' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {connected.length > 0 && (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-3xl font-semibold text-slate-900">Connected classmates</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {connected.map((peer) => (
              <div key={peer.id} className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{peer.name}</h3>
                    <p className="text-sm text-slate-600">{(peer.sharedUnits || []).join(' · ')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openInviteModal(peer)}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Invite to group
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {waiting.length > 0 && (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Waiting for them to connect back</h2>
          <div className="mt-4 space-y-3">
            {waiting.map((peer) => (
              <div key={peer.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="font-semibold text-slate-900">{peer.name}</p>
                <p className="text-sm text-slate-600">They need to press Connect on your profile for notes & schedule sharing.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {modalOpen && selectedPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-3xl font-semibold text-slate-900">Invite {selectedPeer.name}</h2>
            <div className="mt-6 space-y-3">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroup(group.id)}
                    className={`w-full rounded-3xl border px-4 py-4 text-left ${
                      selectedGroup === group.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className="font-semibold">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-600">
                  Join a group on the <Link to="/groups" className="font-semibold text-blue-600">Groups</Link> page first.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold">Cancel</button>
              <button
                type="button"
                onClick={sendInvite}
                disabled={inviteState.loading || groups.length === 0}
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-400"
              >
                {inviteState.loading ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
