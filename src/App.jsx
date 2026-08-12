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
import SchedulePage from './pages/SchedulePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import InterestSelection from './pages/InterestSelection.jsx';
import StudyGroupMatches from './pages/StudyGroupMatches.jsx';
import PeerProfilePage from './pages/PeerProfilePage.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth();
  return user && isAdmin() ? children : <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function needsInterestOnboarding(user, isAdmin) {
  if (!user || isAdmin()) return false;
  return user.interestsOnboarded === false;
}

function RequireOnboarded({ children }) {
  const { user, isAdmin } = useAuth();
  if (needsInterestOnboarding(user, isAdmin)) {
    return <Navigate to="/interests" replace />;
  }
  return children;
}

function InterestOnboardingRoute() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin()) return <Navigate to="/admin" replace />;
  if (user.interestsOnboarded !== false) {
    return <Navigate to="/dashboard" replace />;
  }
  return <InterestSelection />;
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
          <Route path="/interests" element={<InterestOnboardingRoute />} />
          <Route path="/dashboard" element={<RequireAuth><RequireOnboarded><Dashboard /></RequireOnboarded></RequireAuth>} />
          <Route path="/groups" element={<RequireAuth><RequireOnboarded><GroupsPage /></RequireOnboarded></RequireAuth>} />
          <Route path="/groups/:id" element={<RequireAuth><RequireOnboarded><GroupDetailPage /></RequireOnboarded></RequireAuth>} />
          <Route path="/match" element={<RequireAuth><RequireOnboarded><MatchPage /></RequireOnboarded></RequireAuth>} />
          <Route path="/study-matches" element={<RequireAuth><RequireOnboarded><StudyGroupMatches /></RequireOnboarded></RequireAuth>} />
          <Route path="/interest-matches" element={<Navigate to="/study-matches" replace />} />
          <Route path="/peers/:id" element={<RequireAuth><RequireOnboarded><PeerProfilePage /></RequireOnboarded></RequireAuth>} />
          <Route path="/notes" element={<RequireAuth><RequireOnboarded><NotesPage /></RequireOnboarded></RequireAuth>} />
          <Route path="/courses" element={<RequireAuth><RequireOnboarded><CoursesPage /></RequireOnboarded></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><RequireOnboarded><ReportIssuePage /></RequireOnboarded></RequireAuth>} />
          <Route path="/schedule" element={<RequireAuth><RequireOnboarded><SchedulePage /></RequireOnboarded></RequireAuth>} />
          <Route path="/profile" element={<Navigate to="/dashboard" replace />} />
          <Route path="/connections" element={<Navigate to="/match" replace />} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
