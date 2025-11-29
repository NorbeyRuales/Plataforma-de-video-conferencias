import { jsx as _jsx } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
/**
 * Simple breadcrumb component.
 * Uses the current location pathname to render a short navigation trail.
 *
 * GUI-only: no dynamic data from backend is needed in Sprint 1.
 *
 * @returns {JSX.Element | null} Breadcrumb navigation element or null when the route is not mapped.
 */
export function Breadcrumbs() {
    const location = useLocation();
    // Basic mapping from pathnames to human-readable labels.
    const map = {
        '/': ['Inicio'],
        '/about': ['Inicio', 'Sobre nosotros'],
        '/login': ['Inicio', 'Iniciar sesión'],
        '/register': ['Inicio', 'Registro'],
        '/forgot-password': ['Inicio', 'Recuperar contraseña'],
        '/account': ['Inicio', 'Cuenta'],
        '/meetings/new': ['Inicio', 'Reuniones', 'Nueva reunión'],
        '/sitemap': ['Inicio', 'Mapa del sitio']
    };
    const labels = map[location.pathname];
    // If the route is not in the map (e.g. 404), do not render breadcrumbs.
    if (!labels || labels.length === 0)
        return null;
    const lastIndex = labels.length - 1;
    return (_jsx("nav", { className: "breadcrumbs", "aria-label": "Ruta de navegaci\u00F3n", children: _jsx("ol", { children: labels.map((label, index) => {
                const isLast = index === lastIndex;
                // The first label always links back to home.
                if (index === 0) {
                    return (_jsx("li", { children: isLast ? (_jsx("span", { "aria-current": "page", children: label })) : (_jsx(Link, { to: "/", children: label })) }, label));
                }
                // Intermediate / last items are plain text (current section).
                return (_jsx("li", { children: isLast ? (_jsx("span", { "aria-current": "page", children: label })) : (_jsx("span", { children: label })) }, label));
            }) }) }));
}
