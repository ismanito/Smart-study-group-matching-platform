import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import UnitBadge from '../components/UnitBadge.jsx';

const emptyGroupForm = { name: '', description: '', nextSession: '', unitCodes: '' };
const emptyUnitForm = { code: '', name: '', description: '' };
const emptyErrorForm = { title: '', message: '', severity: 'medium' };

const formatDateTime = (value) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalGroups: 0,
    totalUnits: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    loggedInToday: 0,
    openErrors: 0,
    pendingPasswordResets: 0,
    totalNotes: 0,
  });
  const [users, setUsers] = useState([]);
  const [logins, setLogins] = useState([]);
  const [activity, setActivity] = useState([]);
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState([]);
  const [passwordResets, setPasswordResets] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [unitForm, setUnitForm] = useState(emptyUnitForm);
  const [errorForm, setErrorForm] = useState(emptyErrorForm);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingUnitId, setEditingUnitId] = useState(null);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const loadAdminData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const endpoints = [
        '/api/admin/stats',
        '/api/admin/users',
        '/api/admin/logins?limit=40',
        '/api/admin/activity?limit=30',
        '/api/admin/groups',
        '/api/admin/units',
        '/api/admin/errors',
        '/api/admin/password-resets',
      ];
      const responses = await Promise.all(
        endpoints.map((endpoint) => fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } }))
      );
      const payloads = await Promise.all(responses.map((response) => response.json()));

      responses.forEach((response, index) => {
        if (!response.ok) {
          throw new Error(payloads[index].message || `Failed to load ${endpoints[index]}`);
        }
      });

      setStats(payloads[0]);
      setUsers(Array.isArray(payloads[1]) ? payloads[1] : []);
      setLogins(Array.isArray(payloads[2]) ? payloads[2] : []);
      setActivity(Array.isArray(payloads[3]) ? payloads[3] : []);
      setGroups(Array.isArray(payloads[4]) ? payloads[4] : []);
      setUnits(Array.isArray(payloads[5]) ? payloads[5] : []);
      setErrors(Array.isArray(payloads[6]) ? payloads[6] : []);
      setPasswordResets(Array.isArray(payloads[7]) ? payloads[7] : []);
    } catch (loadError) {
      if (!silent) {
        setError(loadError.message || 'Unable to load admin data.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadAdminData({ silent: true });
    }, 5000);
    return () => clearInterval(intervalId);
  }, [loadAdminData]);

  const runAction = async (label, action) => {
    setBusy(label);
    setError('');
    setSuccess('');
    try {
      await action();
      await loadAdminData();
    } catch (actionError) {
      setError(actionError.message || 'Action failed.');
    } finally {
      setBusy('');
    }
  };

  const openUserDetail = async (userId) => {
    setBusy(`user-${userId}`);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load user details.');
      setSelectedUser(payload);
    } catch (detailError) {
      setError(detailError.message || 'Unable to load user details.');
    } finally {
      setBusy('');
    }
  };

  const updateUser = (userId, body, successMessage) =>
    runAction(`update-${userId}`, async () => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to update user.');
      setSuccess(successMessage || payload.message);
      if (selectedUser?.id === userId) {
        setSelectedUser((current) => ({ ...current, ...payload.user }));
      }
    });

  const resetPassword = (userId) =>
    runAction(`reset-${userId}`, async () => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to reset password.');
      setSuccess(`Temporary password for ${payload.user.email}: ${payload.temporaryPassword}`);
    });

  const deleteUser = (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    runAction(`delete-${user.id}`, async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to delete user.');
      setSuccess(payload.message);
      if (selectedUser?.id === user.id) setSelectedUser(null);
    });
  };

  const saveGroup = (event) => {
    event.preventDefault();
    runAction('save-group', async () => {
      const body = {
        name: groupForm.name,
        description: groupForm.description,
        nextSession: groupForm.nextSession,
        unitCodes: groupForm.unitCodes
          .split(',')
          .map((code) => code.trim())
          .filter(Boolean),
      };
      const response = await fetch(editingGroupId ? `/api/admin/groups/${editingGroupId}` : '/api/admin/groups', {
        method: editingGroupId ? 'PATCH' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save group.');
      setGroupForm(emptyGroupForm);
      setEditingGroupId(null);
      setSuccess(payload.message);
    });
  };

  const saveUnit = (event) => {
    event.preventDefault();
    runAction('save-unit', async () => {
      const body = { ...unitForm };
      const response = await fetch(editingUnitId ? `/api/admin/units/${editingUnitId}` : '/api/admin/units', {
        method: editingUnitId ? 'PATCH' : 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to save unit.');
      setUnitForm(emptyUnitForm);
      setEditingUnitId(null);
      setSuccess(payload.message);
    });
  };

  const deleteGroup = (group) => {
    if (!window.confirm(`Delete group "${group.name}"?`)) return;
    runAction(`delete-group-${group.id}`, async () => {
      const response = await fetch(`/api/admin/groups/${group.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to delete group.');
      setSuccess(payload.message);
    });
  };

  const deleteUnit = (unit) => {
    if (!window.confirm(`Delete unit ${unit.code}?`)) return;
    runAction(`delete-unit-${unit.id}`, async () => {
      const response = await fetch(`/api/admin/units/${unit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to delete unit.');
      setSuccess(payload.message);
    });
  };

  const logError = (event) => {
    event.preventDefault();
    runAction('log-error', async () => {
      const response = await fetch('/api/admin/errors', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(errorForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to log error.');
      setErrorForm(emptyErrorForm);
      setSuccess(payload.message);
    });
  };

  const resolveError = (report, status = 'resolved') =>
    runAction(`error-${report.id}`, async () => {
      const note = status === 'resolved'
        ? window.prompt('Resolution note (optional):', report.resolutionNote || '') || ''
        : '';
      const response = await fetch(`/api/admin/errors/${report.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status, resolutionNote: note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to update error.');
      setSuccess(payload.message);
    });

  const sendPasswordOtp = (request) =>
    runAction(`otp-${request.id}`, async () => {
      const response = await fetch(`/api/admin/password-resets/${request.id}/send-otp`, {
        method: 'POST',
        headers: authHeaders,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to send OTP.');
      setSuccess(`${payload.message} OTP: ${payload.otp}`);
      window.alert(`Share this OTP with ${request.email}:\n\n${payload.otp}\n\nIt expires in 15 minutes.`);
    });

  const filteredUsers = users.filter((user) => {
    if (userFilter === 'students') return user.role === 'student';
    if (userFilter === 'admins') return user.role === 'admin';
    if (userFilter === 'suspended') return user.status === 'suspended';
    if (userFilter === 'logged-in') return Boolean(user.lastLoginAt);
    return true;
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'students', label: 'Students' },
    { id: 'resets', label: `Password OTPs${stats.pendingPasswordResets ? ` (${stats.pendingPasswordResets})` : ''}` },
    { id: 'logins', label: 'Logins' },
    { id: 'groups', label: 'Groups' },
    { id: 'units', label: 'Units' },
    { id: 'errors', label: 'Errors' },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Admin Panel</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Website Management</h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Live view of real student registrations and logins. Data refreshes automatically every 5 seconds.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading || Boolean(busy)}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
          >
            Refresh data
          </button>
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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
              <div className="h-8 w-1/2 rounded-full bg-slate-200" />
              <div className="mt-4 h-10 w-2/3 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Students</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.totalStudents ?? stats.activeUsers}</p>
            <p className="mt-2 text-sm text-slate-500">{stats.suspendedUsers || 0} suspended</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Logged in today</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.loggedInToday || 0}</p>
            <p className="mt-2 text-sm text-slate-500">Unique accounts in last 24h</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Open errors</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.openErrors || 0}</p>
            <p className="mt-2 text-sm text-slate-500">{stats.pendingPasswordResets || 0} password resets waiting</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Catalog</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.totalGroups}/{stats.totalUnits}</p>
            <p className="mt-2 text-sm text-slate-500">Groups / units</p>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white shadow-sm shadow-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex flex-wrap gap-1 overflow-x-auto px-8 py-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">Live student logins</h2>
                <p className="text-sm text-slate-500">Updates automatically when students sign in.</p>
                {logins.slice(0, 8).map((login) => (
                  <div key={login.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="font-semibold text-slate-900">{login.name}</p>
                    <p className="text-sm text-slate-600">{login.email} · {login.role}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(login.timestamp)}</p>
                  </div>
                ))}
                {logins.length === 0 && (
                  <p className="text-slate-600">No student logins yet. When someone signs in, they appear here instantly.</p>
                )}
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">Platform activity</h2>
                {activity.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.userName}: {item.message}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(item.timestamp)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold text-slate-900">Student & account management</h2>
                <select
                  value={userFilter}
                  onChange={(event) => setUserFilter(event.target.value)}
                  className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm"
                >
                  <option value="all">All accounts</option>
                  <option value="students">Students only</option>
                  <option value="admins">Admins only</option>
                  <option value="logged-in">Have logged in</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Student</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Last login</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Logins</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Courses</th>
                        <th className="px-4 py-4 text-left font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="align-top hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-slate-600">{user.email}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{user.role}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              user.status === 'suspended'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{formatDateTime(user.lastLoginAt)}</td>
                          <td className="px-4 py-4 text-slate-600">{user.loginCount}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(user.enrolledUnits || []).map((code) => <UnitBadge key={code} code={code} />)}
                              {(user.enrolledUnits || []).length === 0 && <span className="text-slate-400">None</span>}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => openUserDetail(user.id)} className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-200">
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => updateUser(
                                  user.id,
                                  { status: user.status === 'suspended' ? 'active' : 'suspended' },
                                  user.status === 'suspended' ? 'Account reactivated.' : 'Account suspended.'
                                )}
                                className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-700 hover:bg-amber-100"
                              >
                                {user.status === 'suspended' ? 'Activate' : 'Suspend'}
                              </button>
                              <button type="button" onClick={() => resetPassword(user.id)} className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 hover:bg-blue-100">
                                Reset password
                              </button>
                              {user.role === 'student' ? (
                                <button type="button" onClick={() => updateUser(user.id, { role: 'admin' }, 'Promoted to admin.')} className="rounded-full bg-violet-50 px-3 py-1.5 font-semibold text-violet-700 hover:bg-violet-100">
                                  Make admin
                                </button>
                              ) : (
                                <button type="button" onClick={() => updateUser(user.id, { role: 'student' }, 'Changed to student.')} className="rounded-full bg-violet-50 px-3 py-1.5 font-semibold text-violet-700 hover:bg-violet-100">
                                  Make student
                                </button>
                              )}
                              <button type="button" onClick={() => deleteUser(user)} className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100">
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedUser && (
                <div className="rounded-3xl border border-blue-200 bg-blue-50/40 p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900">{selectedUser.name}</h3>
                      <p className="text-slate-600">{selectedUser.email}</p>
                    </div>
                    <button type="button" onClick={() => setSelectedUser(null)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      Close
                    </button>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Logins</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedUser.loginCount}</p>
                      <p className="mt-1 text-sm text-slate-500">Last: {formatDateTime(selectedUser.lastLoginAt)}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Groups</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedUser.groupCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Notes</p>
                      <p className="mt-2 text-2xl font-semibold">{selectedUser.notesCount}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="font-semibold text-slate-900">Recent logins</p>
                      <div className="mt-3 space-y-2">
                        {(selectedUser.recentLogins || []).map((login) => (
                          <p key={login.id} className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                            {formatDateTime(login.timestamp)}
                          </p>
                        ))}
                        {(selectedUser.recentLogins || []).length === 0 && <p className="text-sm text-slate-500">No logins yet.</p>}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">Recent activity</p>
                      <div className="mt-3 space-y-2">
                        {(selectedUser.recentActivity || []).map((item) => (
                          <div key={item.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-slate-600">{item.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'resets' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Password reset OTPs</h2>
                <p className="mt-2 text-slate-600">
                  When a student uses Forgot password, send them a one-time OTP here so they can update their password.
                </p>
              </div>

              <div className="space-y-3">
                {passwordResets.length > 0 ? (
                  passwordResets.map((request) => (
                    <article key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{request.name}</h3>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              request.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : request.status === 'otp_sent'
                                  ? 'bg-blue-100 text-blue-700'
                                  : request.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-700'
                            }`}
                            >
                              {request.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{request.email}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                            Requested {formatDateTime(request.requestedAt)}
                            {request.otpSentAt ? ` · OTP sent ${formatDateTime(request.otpSentAt)}` : ''}
                            {request.expiresAt ? ` · expires ${formatDateTime(request.expiresAt)}` : ''}
                          </p>
                          {request.otp && request.status === 'otp_sent' && (
                            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold tracking-[0.3em] text-slate-900">
                              OTP: {request.otp}
                            </p>
                          )}
                        </div>
                        {['pending', 'otp_sent', 'expired'].includes(request.status) && (
                          <button
                            type="button"
                            onClick={() => sendPasswordOtp(request)}
                            disabled={Boolean(busy)}
                            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-slate-400"
                          >
                            {request.status === 'otp_sent' ? 'Resend OTP' : 'Send OTP'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-slate-600">No password reset requests yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logins' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">Login history</h2>
              <p className="text-slate-600">Every successful sign-in is listed here so you can see who accessed the site and when.</p>
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Role</th>
                      <th className="px-4 py-3 text-left">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logins.map((login) => (
                      <tr key={login.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{login.name}</td>
                        <td className="px-4 py-3 text-slate-600">{login.email}</td>
                        <td className="px-4 py-3 text-slate-600">{login.role}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(login.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Manage study groups</h2>
              <form onSubmit={saveGroup} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-2">
                <input
                  required
                  value={groupForm.name}
                  onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Group name"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  value={groupForm.nextSession}
                  onChange={(event) => setGroupForm((current) => ({ ...current, nextSession: event.target.value }))}
                  placeholder="Next session (e.g. Mondays · 5 PM)"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  value={groupForm.unitCodes}
                  onChange={(event) => setGroupForm((current) => ({ ...current, unitCodes: event.target.value }))}
                  placeholder="Unit codes (comma separated)"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-2"
                />
                <textarea
                  value={groupForm.description}
                  onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Description"
                  className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-2"
                />
                <div className="flex gap-3 md:col-span-2">
                  <button type="submit" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    {editingGroupId ? 'Update group' : 'Create group'}
                  </button>
                  {editingGroupId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGroupId(null);
                        setGroupForm(emptyGroupForm);
                      }}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="grid gap-4 md:grid-cols-2">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    <p className="mt-2 text-sm text-slate-600">{group.description}</p>
                    <p className="mt-4 text-sm text-slate-700">{group.memberCount} members · {group.nextSession}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(group.unitCodes || []).map((code) => <UnitBadge key={code} code={code} />)}
                    </div>
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setGroupForm({
                            name: group.name,
                            description: group.description || '',
                            nextSession: group.nextSession || '',
                            unitCodes: (group.unitCodes || []).join(', '),
                          });
                        }}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteGroup(group)} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'units' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Manage course units</h2>
              <form onSubmit={saveUnit} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3">
                <input
                  required
                  value={unitForm.code}
                  onChange={(event) => setUnitForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="Code (CIS301)"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <input
                  required
                  value={unitForm.name}
                  onChange={(event) => setUnitForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Unit name"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-2"
                />
                <input
                  value={unitForm.description}
                  onChange={(event) => setUnitForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Description"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-3"
                />
                <div className="flex gap-3 md:col-span-3">
                  <button type="submit" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    {editingUnitId ? 'Update unit' : 'Create unit'}
                  </button>
                  {editingUnitId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUnitId(null);
                        setUnitForm(emptyUnitForm);
                      }}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {units.map((unit) => (
                  <div key={unit.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <UnitBadge code={unit.code} />
                        <p className="font-semibold text-slate-900">{unit.name}</p>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{unit.description}</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">{unit.enrolledCount} enrolled</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnitId(unit.id);
                          setUnitForm({ code: unit.code, name: unit.name, description: unit.description || '' });
                        }}
                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteUnit(unit)} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Error & issue queue</h2>
              <p className="text-slate-600">
                Track reported problems, mark them resolved, and keep notes on what you fixed.
              </p>

              <form onSubmit={logError} className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-[1fr_1fr_auto]">
                <input
                  required
                  value={errorForm.title}
                  onChange={(event) => setErrorForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Issue title"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                />
                <select
                  value={errorForm.severity}
                  onChange={(event) => setErrorForm((current) => ({ ...current, severity: event.target.value }))}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button type="submit" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                  Log issue
                </button>
                <textarea
                  required
                  value={errorForm.message}
                  onChange={(event) => setErrorForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Describe the problem and who is affected"
                  className="min-h-24 rounded-2xl border border-slate-300 bg-white px-4 py-3 md:col-span-3"
                />
              </form>

              <div className="space-y-3">
                {errors.map((report) => (
                  <article key={report.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-900">{report.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            report.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                          >
                            {report.status}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                            {report.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{report.message}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                          {report.source} · {formatDateTime(report.createdAt)}
                          {report.userEmail ? ` · ${report.userEmail}` : ''}
                        </p>
                        {report.resolutionNote && (
                          <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                            Fix note: {report.resolutionNote}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {report.status === 'open' ? (
                          <button type="button" onClick={() => resolveError(report, 'resolved')} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                            Mark fixed
                          </button>
                        ) : (
                          <button type="button" onClick={() => resolveError(report, 'open')} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {errors.length === 0 && <p className="text-slate-600">No reported errors yet.</p>}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
