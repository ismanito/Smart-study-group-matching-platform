import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return undefined;
    }

    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?limit=8', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!cancelled && response.ok) {
          setNotifications(Array.isArray(payload) ? payload : []);
        }
      } catch (_error) {
        // Ignore transient notification fetch errors.
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((item) => !item.read).length;

  const navItems = user
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Courses', path: '/courses' },
        { label: 'Profile', path: '/profile' },
        { label: 'Find Peers', path: '/match' },
        { label: 'Connections', path: '/connections' },
        { label: 'My Groups', path: '/groups' },
        { label: 'Notes', path: '/notes' },
        { label: 'Schedule', path: '/schedule' },
        { label: 'Report', path: '/report' },
      ]
    : [];

  if (user && isAdmin()) {
    navItems.push({ label: 'Admin Panel', path: '/admin' });
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-blue-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-xl">📚</span>
          <span className="text-xl font-semibold">StudyMatch</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {user ? (
            <div className="relative hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                aria-label="Notifications"
              >
                Alerts
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-slate-600">{item.message}</p>
                          {item.otp && (
                            <p className="mt-2 font-bold tracking-[0.2em] text-blue-700">{item.otp}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 md:inline-flex"
            >
              Login
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-slate-50 md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-base font-medium transition ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white hover:text-blue-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-base font-medium text-white transition hover:bg-blue-700"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl bg-blue-600 px-4 py-3 text-center text-base font-medium text-white transition hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
