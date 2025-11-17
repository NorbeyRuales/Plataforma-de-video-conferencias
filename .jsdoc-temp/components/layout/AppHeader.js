import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Video, Home, Info, Menu, X } from 'lucide-react';
/**
 * Top navigation bar displayed across the whole app.
 * It shows slightly different options depending on the auth state.
 *
 * @param {AppHeaderProps} props Component props.
 * @returns {JSX.Element} Sticky site header with primary navigation.
 */
export function AppHeader({ isAuthenticated }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (_jsx("header", { className: "site-header", children: _jsxs("div", { className: "container header-inner", children: [_jsxs(Link, { to: "/", className: "brand", "aria-label": "Ir al inicio de VideoMeet", children: [_jsx("span", { className: "brand-icon", "aria-hidden": "true", children: _jsx(Video, { className: "brand-icon-svg", "aria-hidden": "true" }) }), _jsx("span", { children: "VideoMeet" })] }), _jsx("button", { type: "button", className: "header-menu-toggle", "aria-label": isMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación', onClick: () => setIsMenuOpen((open) => !open), children: isMenuOpen ? _jsx(X, { "aria-hidden": "true" }) : _jsx(Menu, { "aria-hidden": "true" }) }), _jsxs("nav", { className: `main-nav${isMenuOpen ? ' is-open' : ''}`, "aria-label": "Navegaci\u00F3n principal", children: [_jsxs(NavLink, { to: "/", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx(Home, { className: "nav-link-icon", "aria-hidden": "true" }), _jsx("span", { children: "Inicio" })] }), _jsxs(NavLink, { to: "/about", className: ({ isActive }) => navLinkClass(isActive), children: [_jsx(Info, { className: "nav-link-icon", "aria-hidden": "true" }), _jsx("span", { children: "Acerca de" })] }), isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(NavLink, { to: "/meetings/new", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Panel" }) }), _jsx(NavLink, { to: "/account", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Perfil" }) }), _jsx("button", { type: "button", className: "nav-link nav-link-cta nav-link-button", onClick: () => {
                                        console.log('TODO: logout user');
                                    }, "aria-label": "Cerrar sesi\u00F3n", children: _jsx("span", { children: "Cerrar sesi\u00F3n" }) })] })) : (_jsxs(_Fragment, { children: [_jsx(NavLink, { to: "/login", className: ({ isActive }) => navLinkClass(isActive), children: _jsx("span", { children: "Iniciar Sesi\u00F3n" }) }), _jsx(NavLink, { to: "/register", className: ({ isActive }) => navLinkClass(isActive, 'nav-link-cta'), children: _jsx("span", { children: "Registrarse" }) })] }))] })] }) }));
}
/**
 * Utility to compose the className for a navigation link.
 *
 * @param {boolean} isActive Whether the route is currently active.
 * @param {string} [extra] Optional extra class to append.
 * @returns {string} Final className string for the link.
 */
function navLinkClass(isActive, extra) {
    const base = 'nav-link';
    const active = isActive ? ' is-active' : '';
    const extraClass = extra ? ` ${extra}` : '';
    return `${base}${active}${extraClass}`;
}
