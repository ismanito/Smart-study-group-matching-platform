import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'My Groups', path: '/groups' },
    { label: 'Find Peers', path: '/match' },
    { label: 'My Notes', path: '/notes' },
    { label: 'Schedule', path: '/schedule' },
  ];

  if (isAdmin()) {
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
            <button
              onClick={handleLogout}
              className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 md:inline-flex"
            >
              Logout
            </button>
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
