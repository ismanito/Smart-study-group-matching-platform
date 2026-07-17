import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UnitBadge from '../components/UnitBadge';

export default function MatchPage() {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [inviteState, setInviteState] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);
      setInviteState({ loading: false, error: '', success: '' });

      try {
        const [matchRes, groupsRes] = await Promise.all([
          fetch('/api/match', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!matchRes.ok) throw new Error('Unable to load matches.');
        if (!groupsRes.ok) throw new Error('Unable to load your groups.');

        const matchData = await matchRes.json();
        const groupsData = await groupsRes.json();

        setMatches(Array.isArray(matchData) ? matchData : matchData.matches || []);
        setGroups(Array.isArray(groupsData) ? groupsData : groupsData.groups || []);
      } catch (fetchError) {
        setInviteState((current) => ({ ...current, error: fetchError.message || 'Unable to load matches.' }));
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [token]);

  const openInviteModal = (peer) => {
    setSelectedPeer(peer);
    setSelectedGroup(groups[0]?.id ?? groups[0]?.groupId ?? '');
    setInviteState({ loading: false, error: '', success: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPeer(null);
    setSelectedGroup('');
    setInviteState({ loading: false, error: '', success: '' });
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

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.message || 'Unable to send the invitation.');
      }

      setInviteState({ loading: false, error: '', success: 'Invitation sent successfully!' });
    } catch (fetchError) {
      setInviteState({ loading: false, error: fetchError.message || 'Unable to send the invitation.', success: '' });
    }
  };

  const noMatches = !loading && matches.length === 0;
  const peerCards = useMemo(
    () => matches.map((peer) => ({
      ...peer,
      sharedUnits: peer.sharedUnits ?? peer.units ?? [],
    })),
    [matches]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Peer matching</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Find your next study partner</h1>
          </div>
          <p className="max-w-xl text-sm text-slate-600">
            Match with classmates based on shared units and learning goals. Invite the best peers directly into your groups.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
              <div className="h-10 w-1/3 rounded-full bg-slate-200" />
              <div className="mt-6 space-y-4">
                <div className="h-5 rounded-full bg-slate-200" />
                <div className="h-5 rounded-full bg-slate-200 w-4/5" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="h-9 rounded-full bg-slate-200" />
                  <div className="h-9 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : noMatches ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-700">
          <p className="text-xl font-semibold text-slate-900">No matches yet</p>
          <p className="mt-3 text-slate-600">
            Enroll in more units to find study partners who match your interests and schedule.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {peerCards.map((peer) => (
            <div key={peer.id} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{peer.name}</h2>
                  <p className="mt-2 text-sm text-slate-600">{peer.email}</p>
                </div>
                <button
                  onClick={() => openInviteModal(peer)}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Invite to Group
                </button>
              </div>
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Shared units</p>
                <div className="flex flex-wrap gap-2">
                  {peer.sharedUnits.length > 0 ? (
                    peer.sharedUnits.map((unit) => <UnitBadge key={unit} code={unit} />)
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">No shared units yet</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && selectedPeer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Invite {selectedPeer.name}</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a group</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">Your groups</label>
                <div className="mt-3 grid gap-3">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroup(group.id)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          selectedGroup === group.id
                            ? 'border-blue-600 bg-blue-50 text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <p className="font-semibold">{group.name ?? group.title ?? 'Study Group'}</p>
                        <p className="mt-1 text-sm text-slate-500">{group.description ?? 'Invite this peer to join your group.'}</p>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                      You don’t have any groups yet. Create one to send invitations.
                    </div>
                  )}
                </div>
              </div>

              {inviteState.error && (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {inviteState.error}
                </div>
              )}
              {inviteState.success && (
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {inviteState.success}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendInvite}
                  disabled={inviteState.loading || groups.length === 0}
                  className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {inviteState.loading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
