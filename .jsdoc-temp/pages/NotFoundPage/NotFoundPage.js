import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Fallback 404 page for unknown routes.
 * GUI-only in Sprint 1. Later you can add telemetry or error reporting here.
 *
 * @returns {JSX.Element} Not found message with navigation shortcuts.
 */
import { Link } from 'react-router-dom';
import './NotFoundPage.scss';
/**
 * React component for the 404 "page not found" view.
 * Provides shortcuts back to the home page and sitemap.
 *
 * @returns {JSX.Element} Error card with navigation actions.
 */
export function NotFoundPage() {
    return (_jsx("div", { className: "dashboard-wrapper", children: _jsx("div", { className: "container", children: _jsxs("section", { className: "dashboard-card not-found-card", "aria-labelledby": "not-found-title", children: [_jsx("div", { className: "not-found-badge", "aria-hidden": "true", children: "404" }), _jsx("h1", { id: "not-found-title", children: "P\u00E1gina no encontrada" }), _jsx("p", { className: "not-found-text", children: "La ruta que intentas visitar no existe en VideoMeet o a\u00FAn no ha sido implementada en este sprint." }), _jsxs("div", { className: "not-found-actions", children: [_jsx(Link, { to: "/", className: "btn btn-dark", children: "Volver al inicio" }), _jsx(Link, { to: "/sitemap", className: "btn btn-primary", children: "Ver mapa del sitio" })] }), _jsx("p", { className: "not-found-hint", children: "Tip: usa el mapa del sitio para navegar a las secciones disponibles" })] }) }) }));
}
