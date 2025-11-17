import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Login page UI.
 * GUI-only in Sprint 1. Later it should submit to the real auth endpoint (Firebase / backend).
 *
 * @returns {JSX.Element} Authentication form for existing users.
 */
import { Link } from 'react-router-dom';
import { Video, Mail, Lock, Chromium, Facebook, Github } from 'lucide-react';
import { useToast } from '../../components/layout/ToastProvider';
import './LoginPage.scss';
/**
 * React component that renders the login form for existing users.
 * In Sprint 1 it only simulates submission and shows a toast.
 *
 * @returns {JSX.Element} Authentication page with email/password inputs.
 */
export function LoginPage() {
    const { showToast } = useToast();
    return (_jsx("div", { className: "auth-page", children: _jsxs("section", { className: "auth-card", "aria-labelledby": "login-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "login-title", children: "Bienvenido de Nuevo" }), _jsx("p", { className: "auth-subtitle", children: "Inicia sesi\u00F3n en tu cuenta de VideoMeet" }), _jsxs("form", { onSubmit: (event) => {
                        event.preventDefault();
                        /**
                         * TODO (logic sprint):
                         * - Read form values (email, password).
                         * - Call Firebase Auth or backend /auth/login endpoint.
                         * - Handle success (redirect to dashboard) and errors (show message).
                         */
                        console.log('TODO: handle login');
                        showToast('Demo: autenticación aún no conectada al servidor.', 'error');
                    }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo Electr\u00F3nico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Mail, { size: 16 }) }), _jsx("input", { className: "form-input", type: "email", id: "email", name: "email", placeholder: "tu@ejemplo.com", autoComplete: "email", required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "password", children: "Contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: "password", id: "password", name: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", required: true })] })] }), _jsx(Link, { to: "/forgot-password", className: "forgot-link", children: "\u00BFOlvidaste tu contrase\u00F1a?" }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", children: "Iniciar Sesi\u00F3n" }), _jsx("div", { className: "auth-divider", children: "O contin\u00FAa con" }), _jsxs("div", { className: "auth-social-row", children: [_jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Continuar con Google", children: _jsx(Chromium, { className: "auth-social-icon", "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Continuar con Facebook", children: _jsx(Facebook, { className: "auth-social-icon", "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Continuar con GitHub", children: _jsx(Github, { className: "auth-social-icon", "aria-hidden": "true" }) })] })] }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFNo tienes una cuenta? ", _jsx(Link, { to: "/register", children: "Reg\u00EDstrate" })] })] }) }));
}
