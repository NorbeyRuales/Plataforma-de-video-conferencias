/**
 * Root application component.
 * All routes are defined here. For now, everything is GUI-only
 * and there is no real authentication or backend integration.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
<<<<<<< HEAD
import { TopLoadingBar } from './components/layout/TopLoadingBar';
=======
import { Breadcrumbs } from './components/layout/Breadcrumbs';
>>>>>>> main
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
  // Temporary flag: later this should come from real authentication logic.
  const isAuthenticated = false;

  return (
    <>
      {/* WCAG: keyboard users can skip directly to the main content */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Global header (navigation bar) */}
      <AppHeader isAuthenticated={isAuthenticated} />

<<<<<<< HEAD
      {/* Route change loading indicator */}
      <TopLoadingBar />
=======
      {/* Breadcrumbs: show current location inside the app */}
      <Breadcrumbs />
>>>>>>> main

      {/* Routed views */}
      <main id="main-content">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* Authentication (GUI only for now) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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

          {/* 404 fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global footer */}
      <AppFooter />
    </>
  );
}
