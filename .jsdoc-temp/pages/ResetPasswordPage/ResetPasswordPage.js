import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Reset password page UI.
 * GUI-only in Sprint 1. Later it should validate the token from the email
 * and send the new password to the backend.
 *
 * @returns {JSX.Element} Form to choose a new password.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Lock, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthHint } from '../../components/auth/PasswordStrengthHint';
import './ResetPasswordPage.scss';
/**
 * React component for the "set a new password" page.
 * This is what users would see after clicking the link in the email.
 *
 * @returns {JSX.Element} New password and confirmation form.
 */
export function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^0-9a-zA-Z]).{8,}$/;
    const isStrongPassword = (value) => strongPasswordRegex.test(value);
    const isFormValid = isStrongPassword(password) &&
        isStrongPassword(passwordConfirm) &&
        password === passwordConfirm;
    return (_jsx("div", { className: "auth-page", children: _jsxs("section", { className: "auth-card", "aria-labelledby": "reset-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "reset-title", children: "Crea una Nueva Contrase\u00F1a" }), _jsx("p", { className: "auth-subtitle", children: "Elige una nueva contrase\u00F1a para tu cuenta de VideoMeet." }), _jsxs("form", { onSubmit: (event) => {
                        event.preventDefault();
                        /**
                         * TODO (logic sprint):
                         * - Read password + confirmation.
                         * - Validate the reset token from URL (e.g. /reset-password/:token).
                         * - Send the new password to the backend / Firebase.
                         * - Show success or error feedback and redirect to login.
                         */
                        console.log('TODO: handle real password reset');
                    }, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "newPassword", children: "Nueva contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: showPassword ? 'text' : 'password', id: "newPassword", name: "newPassword", placeholder: "Introduce una contrase\u00F1a segura", autoComplete: "new-password", required: true, value: password, onChange: (event) => setPassword(event.target.value) }), _jsx("button", { type: "button", className: "field-toggle-button", "aria-label": showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña', onClick: () => setShowPassword((prev) => !prev), children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), _jsx(PasswordStrengthHint, { password: password })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "newPasswordConfirm", children: "Confirmar contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: showPasswordConfirm ? 'text' : 'password', id: "newPasswordConfirm", name: "newPasswordConfirm", placeholder: "Repite la nueva contrase\u00F1a", autoComplete: "new-password", required: true, value: passwordConfirm, onChange: (event) => setPasswordConfirm(event.target.value) }), _jsx("button", { type: "button", className: "field-toggle-button", "aria-label": showPasswordConfirm
                                                ? 'Ocultar confirmaci\u00f3n de contraseña'
                                                : 'Mostrar confirmaci\u00f3n de contraseña', onClick: () => setShowPasswordConfirm((prev) => !prev), children: showPasswordConfirm ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), passwordConfirm &&
                                    (passwordConfirm !== password ? (_jsx("p", { className: "form-hint form-hint-error", children: "Las contrase\u00F1as deben coincidir." })) : (_jsx("p", { className: "form-hint form-hint-success", children: "Las contrase\u00F1as coinciden." })))] }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", disabled: !isFormValid, children: "Guardar nueva contrase\u00F1a" })] }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFRecordaste tu contrase\u00F1a? ", _jsx(Link, { to: "/login", children: "Inicia sesi\u00F3n" })] })] }) }));
}
