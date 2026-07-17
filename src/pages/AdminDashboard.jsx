import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, totalGroups: 0, totalUnits: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to load stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [token]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'groups', label: 'Groups', icon: '👫' },
    { id: 'units', label: 'Units', icon: '📚' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm shadow-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Admin Panel</p>
            <h1 className="mt-3 text-4xl font-semibold text-slate-900">Platform Management</h1>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-blue-100 to-blue-50 px-5 py-4 text-blue-700 shadow-inner">
            <p className="text-sm uppercase tracking-[0.3em] font-semibold">Role</p>
            <p className="mt-2 text-2xl font-bold">Administrator</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-slate-600">Manage users, study groups, units, and platform settings.</p>
      </section>

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
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Total Users</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.totalUsers}</p>
            <p className="mt-2 text-sm text-slate-500">Registered users on platform</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Active Users</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.activeUsers}</p>
            <p className="mt-2 text-sm text-slate-500">Users active this month</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Study Groups</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.totalGroups}</p>
            <p className="mt-2 text-sm text-slate-500">Active study groups</p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Total Units</p>
            <p className="mt-4 text-4xl font-semibold text-slate-900">{stats.totalUnits}</p>
            <p className="mt-2 text-sm text-slate-500">Courses on platform</p>
          </div>
        </section>
      )}

      <section className="rounded-3xl bg-white shadow-sm shadow-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex flex-wrap gap-1 overflow-x-auto px-8 py-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Platform Overview</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="font-semibold text-slate-900">User Growth</p>
                  <p className="mt-2 text-sm text-slate-600">Total registered users have grown by 24% this month.</p>
                  <div className="mt-4 h-32 rounded-2xl bg-white" />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="font-semibold text-slate-900">Group Activity</p>
                  <p className="mt-2 text-sm text-slate-600">Study groups are most active on weekends.</p>
                  <div className="mt-4 h-32 rounded-2xl bg-white" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">User Management</h2>
              <div className="rounded-3xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold text-slate-700">Name</th>
                        <th className="px-6 py-4 text-left font-semibold text-slate-700">Email</th>
                        <th className="px-6 py-4 text-left font-semibold text-slate-700">Role</th>
                        <th className="px-6 py-4 text-left font-semibold text-slate-700">Joined</th>
                        <th className="px-6 py-4 text-left font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-6 py-4">User {i}</td>
                          <td className="px-6 py-4">user{i}@example.com</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
                              Student
                            </span>
                          </td>
                          <td className="px-6 py-4">July 10, 2026</td>
                          <td className="px-6 py-4">
                            <button className="text-sm text-blue-600 hover:text-blue-700">View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Study Groups</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <p className="font-semibold text-slate-900">Study Group {i}</p>
                    <p className="mt-2 text-sm text-slate-600">5 members • Active</p>
                    <button className="mt-4 text-sm text-blue-600 hover:text-blue-700">Manage</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'units' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Course Management</h2>
              <div className="space-y-4">
                {['CIS301', 'CIS201', 'MATH201', 'CIS401'].map((code) => (
                  <div key={code} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6">
                    <div>
                      <p className="font-semibold text-slate-900">{code}</p>
                      <p className="text-sm text-slate-600">45 students enrolled</p>
                    </div>
                    <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900">Platform Settings</h2>
              <div className="space-y-6 max-w-2xl">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <label className="block">
                    <p className="font-semibold text-slate-900">Platform Name</p>
                    <input
                      type="text"
                      defaultValue="StudyMatch"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                    />
                  </label>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded" />
                    <span className="font-semibold text-slate-900">Allow new user registration</span>
                  </label>
                </div>
                <button className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
