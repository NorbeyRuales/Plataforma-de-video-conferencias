/**
 * Root application component.
 * All routes are defined here. For now, everything is GUI-only
 * and there is no real authentication or backend integration.
 */
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useMatch,
} from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
import { TopLoadingBar } from './components/layout/TopLoadingBar';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { HomePage } from './pages/HomePage/HomePage';
import { AboutPage } from './pages/AboutPage/AboutPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/RegisterPage/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage/ResetPasswordPage';
import { AccountPage } from './pages/AccountPage/AccountPage';
import { CreateMeetingPage } from './pages/CreateMeetingPage/CreateMeetingPage';
import { SitemapPage } from './pages/SitemapPage/SitemapPage';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';
import PrivacyPage from './pages/Legal/PrivacyPage';
import DataDeletionPage from './pages/Legal/DataDeletionPage';
import MeetingRoomPage from './pages/MeetingRoomPage/MeetingRoomPage';
import { useEffect, useState } from 'react';
import { AUTH_TOKEN_EVENT, getAuthToken, setAuthToken } from './services/authToken';

/**
 * Application shell component.
 * Renders header, routed content and footer.
 *
 * TODO (logic sprint):
 * - Replace the hardcoded `isAuthenticated` flag with real auth state
 *   coming from a Context / state manager / Firebase Auth.
 * - Wrap private routes with a `<PrivateRoute />` component when auth exists.
 *
 * @returns {JSX.Element} The routed application shell.
 */
export default function App(): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getAuthToken())
  );
  const navigate = useNavigate();
  const location = useLocation();
  const isMeetingRoute = Boolean(useMatch('/meeting/:meetingId'));

  useEffect(() => {
    const handleAuthChange = () => setIsAuthenticated(Boolean(getAuthToken()));

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener(AUTH_TOKEN_EVENT, handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <>
      {/* WCAG: keyboard users can skip directly to the main content */}
      {!isMeetingRoute && (
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
      )}

      {/* Global header (navigation bar) */}
      {!isMeetingRoute && (
        <AppHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      )}

      {/* Route change loading indicator */}
      <TopLoadingBar />

      {/* Breadcrumbs: show current location inside the app */}
      {!isMeetingRoute && <Breadcrumbs />}

      {/* Routed views */}
      <main
        id="main-content"
        tabIndex={-1}
        className={isMeetingRoute ? 'app-main app-main--meeting' : 'app-main'}
      >
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication (GUI only for now) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/data-deletion" element={<DataDeletionPage />} />

          {/* Future private routes (panel, account, meetings) */}
          <Route
            path="/account"
            element={
              isAuthenticated ? <AccountPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/meetings/new"
            element={
              isAuthenticated ? (
                <CreateMeetingPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Sitemap page for accessibility and navigation */}
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/meeting/:meetingId" element={<MeetingRoomPage />} />

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global footer */}
      {!isMeetingRoute && <AppFooter />}
    </>
  );
}
