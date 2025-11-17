import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Forgot password page UI.
 * GUI-only in Sprint 1. Later it should trigger Firebase password reset
 * or a backend endpoint to send a recovery link.
 *
 * @returns {JSX.Element} Password recovery form.
 */
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import './ForgotPasswordPage.scss';
/**
 * React component that renders the password‑reset request form.
 * In Sprint 1 it only prevents default submission and logs a TODO.
 *
 * @returns {JSX.Element} Page with a single email field and actions.
 */
export function ForgotPasswordPage() {
    return (_jsx("div", { className: "auth-page", children: _jsxs("section", { className: "auth-card", "aria-labelledby": "forgot-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "forgot-title", children: "Recuperar contrase\u00F1a" }), _jsx("p", { className: "auth-subtitle", children: "Ingresa tu correo electr\u00F3nico y te enviaremos un enlace para restablecer tu contrase\u00F1a." }), _jsxs("form", { onSubmit: (event) => {
                        event.preventDefault();
                        /**
                         * TODO (logic sprint):
                         * - Read the email value from the form.
                         * - Call Firebase sendPasswordResetEmail or a backend endpoint.
                         * - Show a confirmation or error message based on the response.
                         */
                        console.log('TODO: handle password recovery');
                    }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo electr\u00F3nico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: "@" }), _jsx("input", { className: "form-input", type: "email", id: "email", name: "email", placeholder: "tu@ejemplo.com", autoComplete: "email", required: true })] })] }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", children: "Enviar enlace de restablecimiento" })] }), _jsx("p", { className: "auth-footer-text", children: _jsx(Link, { to: "/login", children: "Volver al inicio de sesi\u00F3n" }) }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFNo tienes cuenta? ", _jsx(Link, { to: "/register", children: "Reg\u00EDstrate" })] })] }) }));
}
