import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Video, Home, Info, Menu, X } from 'lucide-react';
import { setAuthToken } from '../../services/authToken';
/**
 * Application header with brand, navigation and auth actions.
 * Responsive: shows a toggleable menu on small screens.
 *
 * @param {AppHeaderProps} props Header props with auth state and optional logout handler.
 * @returns {JSX.Element} Site header containing navigation links and auth buttons.
 */
export function AppHeader({ isAuthenticated, onLogout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    useEffect(() => {
        if (!isMenuOpen)
            return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' || event.key === 'Esc') {
                setIsMenuOpen(false);
                document.querySelector('.header-menu-toggle')?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMenuOpen]);
    useEffect(() => {
        if (!isMenuOpen)
            return;
        document.querySelector('.main-nav a, .main-nav button')?.focus();
    }, [isMenuOpen]);
    const handleHeaderClick = (event) => {
        const target = event.target;
        if (target.closest('a,button'))
            return;
        document.querySelector('.skip-link')?.click();
    };
    const handleLogoutClick = () => {
        if (onLogout) {
            onLogout();
        }
        else {
            setAuthToken(null);
            window.location.href = '/login';
        }
    };
    return (_jsx("header", { className: "site-header", children: _jsxs("div", { className: "container header-inner", onClick: handleHeaderClick, children: [_jsxs(Link, { to: "/", className: "brand", "aria-label": "Ir al inicio de VideoMeet", children: [_jsx("span", { className: "brand-icon", "aria-hidden": "true", children: _jsx(Video, { className: "brand-icon-svg", "aria-hidden": "true" }) }), _jsx("span", { children: "VideoMeet" })] }), _jsx("button", { type: "button", className: "header-menu-toggle", "aria-expanded": isMenuOpen, "aria-controls": "primary-navigation", "aria-label": isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación', onClick: () => setIsMenuOpen((open) => !open), children: isMenuOpen ? _jsx(X, { "aria-hidden": "true" }) : _jsx(Menu, { "aria-hidden": "true" }) }), _jsxs("nav", { id: "primary-navigation", className: `main-nav${isMenuOpen ? ' is-open' : ''}`, "aria-label": "Navegaci\u00F3n principal", children: [_jsxs(NavLink, { to: "/", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx(Home, { className: "nav-link-icon", "aria-hidden": "true" }), _jsx("span", { children: "Inicio" })] }), _jsxs(NavLink, { to: "/about", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx(Info, { className: "nav-link-icon", "aria-hidden": "true" }), _jsx("span", { children: "Sobre nosotros" })] }), isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(NavLink, { to: "/meetings/new", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Reuniones" }) }), _jsx(NavLink, { to: "/account", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Perfil" }) }), _jsx("button", { type: "button", className: "nav-link nav-link-cta nav-link-button", onClick: handleLogoutClick, "aria-label": "Cerrar sesi\u00F3n", children: _jsx("span", { children: "Cerrar sesi\u00F3n" }) })] })) : (_jsxs(_Fragment, { children: [_jsx(NavLink, { to: "/login", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Iniciar sesi\u00F3n" }) }), _jsx(NavLink, { to: "/register", className: ({ isActive }) => navLinkClass(isActive, 'nav-link-cta'), children: _jsx("span", { children: "Registrarse" }) })] }))] })] }) }));
}
function navLinkClass(isActive, extra) {
    const base = 'nav-link';
    const active = isActive ? ' is-active' : '';
    const extraClass = extra ? ` ${extra}` : '';
    return `${base}${active}${extraClass}`;
}
