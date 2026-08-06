import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import MatchPage from './pages/MatchPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupDetailPage from './pages/GroupDetailPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import ReportIssuePage from './pages/ReportIssuePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import ConnectionsPage from './pages/ConnectionsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import InterestSelectionPage from './pages/InterestSelectionPage.jsx';
import InterestMatchesPage from './pages/InterestMatchesPage.jsx';
import PeerProfilePage from './pages/PeerProfilePage.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  return user && isAdmin() ? children : <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
          <Route path="/groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
          <Route path="/match" element={<RequireAuth><MatchPage /></RequireAuth>} />
          <Route path="/interests" element={<RequireAuth><InterestSelectionPage /></RequireAuth>} />
          <Route path="/interest-matches" element={<RequireAuth><InterestMatchesPage /></RequireAuth>} />
          <Route path="/peers/:id" element={<RequireAuth><PeerProfilePage /></RequireAuth>} />
          <Route path="/notes" element={<RequireAuth><NotesPage /></RequireAuth>} />
          <Route path="/courses" element={<RequireAuth><CoursesPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/connections" element={<RequireAuth><ConnectionsPage /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><ReportIssuePage /></RequireAuth>} />
          <Route path="/schedule" element={<RequireAuth><SchedulePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
