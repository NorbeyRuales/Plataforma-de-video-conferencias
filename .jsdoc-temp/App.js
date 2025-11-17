import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Root application component.
 * All routes are defined here. For now, everything is GUI-only
 * and there is no real authentication or backend integration.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppHeader } from './components/layout/AppHeader';
import { AppFooter } from './components/layout/AppFooter';
import { Breadcrumbs } from './components/layout/Breadcrumbs';
import { HomePage } from './pages/HomePage/HomePage';
import { AboutPage } from './pages/AboutPage/AboutPage';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/RegisterPage/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage/ForgotPasswordPage';
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
export default function App() {
    // Temporary flag: later this should come from real authentication logic.
    const isAuthenticated = true;
    return (_jsxs(_Fragment, { children: [_jsx("a", { href: "#main-content", className: "skip-link", children: "Skip to main content" }), _jsx(AppHeader, { isAuthenticated: isAuthenticated }), _jsx(Breadcrumbs, {}), _jsx("main", { id: "main-content", children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/forgot-password", element: _jsx(ForgotPasswordPage, {}) }), _jsx(Route, { path: "/account", element: isAuthenticated ? _jsx(AccountPage, {}) : _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "/meetings/new", element: isAuthenticated ? (_jsx(CreateMeetingPage, {})) : (_jsx(Navigate, { to: "/login", replace: true })) }), _jsx(Route, { path: "/sitemap", element: _jsx(SitemapPage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }), _jsx(AppFooter, {})] }));
}
