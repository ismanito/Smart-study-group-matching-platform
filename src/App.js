import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MatchPage from './pages/MatchPage';

function GroupsPage() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-slate-900">My Groups</h2>
      <p className="mt-3 text-slate-600">Browse all your study groups and join the conversations.</p>
    </div>
  );
}

function GroupDetailPage() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-slate-900">Group details</h2>
      <p className="mt-3 text-slate-600">Explore the group description, members, and upcoming sessions.</p>
    </div>
  );
}

function SchedulePage() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-slate-900">Schedule</h2>
      <p className="mt-3 text-slate-600">Keep track of your study sessions and course calendar.</p>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold text-slate-900">Admin Dashboard</h2>
      <p className="mt-3 text-slate-600">Manage users, groups, and platform settings.</p>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  return user && isAdmin() ? children : <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  const auth = useAuth();
  const authReady = useMemo(() => !!auth, [auth]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {authReady && (
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
            <Route path="/groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
            <Route path="/match" element={<RequireAuth><MatchPage /></RequireAuth>} />
            <Route path="/schedule" element={<RequireAuth><SchedulePage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

export default App;
