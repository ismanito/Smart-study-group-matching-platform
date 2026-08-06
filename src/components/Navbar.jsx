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
        { label: 'Groups', path: '/groups' },
        { label: 'Notes', path: '/notes' },
        { label: 'Schedule', path: '/schedule' },
      ]
    : [];

  if (user && isAdmin()) {
    navItems.push({ label: 'Admin', path: '/admin' });
  }

  return (
    <header className="border-b border-paper-line bg-paper-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          StudyMatch
        </Link>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-pine text-paper-card' : 'text-ink-muted hover:bg-paper hover:text-ink'
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
                className="relative rounded-md border border-paper-line bg-paper-card px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-paper"
                aria-label="Notifications"
              >
                Alerts
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-brass px-1 text-xs font-bold text-ink">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-paper-line bg-paper-card p-4 shadow-soft">
                  <p className="font-display text-sm font-semibold text-ink">Notifications</p>
                  <div className="mt-3 max-h-80 space-y-3 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <div key={item.id} className="rounded-lg bg-paper px-3 py-3 text-sm">
                          <p className="font-semibold text-ink">{item.title}</p>
                          <p className="mt-1 text-ink-muted">{item.message}</p>
                          {item.otp && (
                            <p className="mt-2 font-bold tracking-[0.2em] text-pine">{item.otp}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-ink-muted">No notifications yet.</p>
                    )}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="rounded-md bg-pine px-4 py-2 text-sm font-semibold text-paper-card transition hover:bg-pine-deep"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden rounded-md bg-pine px-4 py-2 text-sm font-semibold text-paper-card transition hover:bg-pine-deep md:inline-flex"
            >
              Sign in
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-paper-line bg-paper-card text-ink lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-paper-line bg-paper lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => (
              <NavLink
                to={item.path}
                key={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-md px-4 py-3 text-base font-medium transition ${
                    isActive ? 'bg-pine text-paper-card' : 'text-ink-soft hover:bg-paper-card'
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
                className="w-full rounded-md bg-pine px-4 py-3 text-base font-medium text-paper-card"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md bg-pine px-4 py-3 text-center text-base font-medium text-paper-card"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
