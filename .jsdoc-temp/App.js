import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Root application component.
 * All routes are defined here. For now, everything is GUI-only
 * and there is no real authentication or backend integration.
 */
import { Routes, Route, Navigate, useNavigate, useLocation, useMatch, } from 'react-router-dom';
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
export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getAuthToken()));
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
    return (_jsxs(_Fragment, { children: [!isMeetingRoute && (_jsx("a", { href: "#main-content", className: "skip-link", children: "Skip to main content" })), !isMeetingRoute && (_jsx(AppHeader, { isAuthenticated: isAuthenticated, onLogout: handleLogout })), _jsx(TopLoadingBar, {}), !isMeetingRoute && _jsx(Breadcrumbs, {}), _jsx("main", { id: "main-content", tabIndex: -1, className: isMeetingRoute ? 'app-main app-main--meeting' : 'app-main', children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, { isAuthenticated: isAuthenticated }) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/reset-password", element: _jsx(ResetPasswordPage, {}) }), _jsx(Route, { path: "/privacy", element: _jsx(PrivacyPage, {}) }), _jsx(Route, { path: "/data-deletion", element: _jsx(DataDeletionPage, {}) }), _jsx(Route, { path: "/account", element: isAuthenticated ? (_jsx(AccountPage, {})) : (_jsx(Navigate, { to: "/login", replace: true, state: { from: `${location.pathname}${location.search}` } })) }), _jsx(Route, { path: "/meetings/new", element: isAuthenticated ? (_jsx(CreateMeetingPage, {})) : (_jsx(Navigate, { to: "/login", replace: true, state: { from: `${location.pathname}${location.search}` } })) }), _jsx(Route, { path: "/sitemap", element: _jsx(SitemapPage, {}) }), _jsx(Route, { path: "/meeting/:meetingId", element: isAuthenticated ? (_jsx(MeetingRoomPage, {})) : (_jsx(Navigate, { to: "/login", replace: true, state: { from: `${location.pathname}${location.search}` } })) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }), !isMeetingRoute && _jsx(AppFooter, {})] }));
}
