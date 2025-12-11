import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Login page UI.
 *
 * @returns {JSX.Element} Sign-in form layout.
 */
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Video, Mail, Lock, Chromium, Github, Eye, EyeOff } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useToast } from '../../components/layout/ToastProvider';
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { setAuthToken } from '../../services/authToken';
import { loginWithEmailPassword } from '../../services/api';
import Aurora from '../../components/Aurora/Aurora';
import './LoginPage.scss';
export function LoginPage() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const fromPath = location.state?.from || '/account';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCapsLockOn, setIsCapsLockOn] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginErrorMessage, setLoginErrorMessage] = useState(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasEmail = email.trim().length > 0;
    const isEmailValid = hasEmail && emailRegex.test(email);
    const showEmailError = hasEmail && !isEmailValid;
    const emailErrorMessage = showEmailError ? 'Ingresa un correo valido.' : undefined;
    const isFormValid = isEmailValid && password.trim().length > 0;
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isFormValid || isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            const { idToken } = await loginWithEmailPassword(email.trim(), password);
            setAuthToken(idToken);
            setLoginErrorMessage(null);
            showToast('Sesion iniciada', 'success');
            navigate(fromPath, { replace: true });
        }
        catch (error) {
            const message = error?.message ??
                'No se pudo iniciar sesion. Revisa el correo y la contrasena o usa Olvidaste tu contrasena.';
            setLoginErrorMessage('Revisa correo y contrasena o restablecela si la olvidaste.');
            showToast(message, 'error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleSocialLogin = async (providerType) => {
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            const provider = providerType === 'google'
                ? new GoogleAuthProvider()
                : new GithubAuthProvider();
            const credential = await signInWithPopup(auth, provider);
            const idToken = await credential.user.getIdToken();
            setAuthToken(idToken);
            showToast(`Sesión iniciada con ${providerType === 'google'
                ? 'Google'
                : 'GitHub'}`, 'success');
            navigate(fromPath, { replace: true });
        }
        catch (error) {
            showToast(error.message ??
                `No se pudo iniciar sesión con ${providerType === 'google'
                    ? 'Google'
                    : 'GitHub'}.`, 'error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsxs("div", { className: "auth-page", children: [_jsx("div", { className: "auth-aurora-layer", children: _jsx(Aurora, { colorStops: ['#ff0000', '#7f0010', '#05010a'], speed: 1.5, amplitude: 1.0 }) }), _jsxs("section", { className: "auth-card", "aria-labelledby": "login-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "login-title", children: "Bienvenido de Nuevo" }), _jsx("p", { className: "auth-subtitle", children: "Inicia sesi\u00F3n en tu cuenta de VideoMeet" }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo Electr\u00F3nico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Mail, { size: 16 }) }), _jsx("input", { className: "form-input", type: "email", id: "email", name: "email", placeholder: "tu@ejemplo.com", autoComplete: "email", required: true, "aria-invalid": showEmailError, "aria-describedby": showEmailError ? 'login-email-tooltip' : undefined, "data-tooltip-id": "login-email-tooltip", value: email, onChange: (event) => {
                                                    setEmail(event.target.value);
                                                    setLoginErrorMessage(null);
                                                } })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "password", children: "Contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: showPassword ? 'text' : 'password', id: "password", name: "password", placeholder: "********", autoComplete: "current-password", required: true, value: password, "aria-describedby": loginErrorMessage ? 'login-password-tooltip' : undefined, "data-tooltip-id": "login-password-tooltip", onChange: (event) => {
                                                    setPassword(event.target.value);
                                                    setLoginErrorMessage(null);
                                                }, onKeyDown: (event) => setIsCapsLockOn(event.getModifierState('CapsLock')), onKeyUp: (event) => setIsCapsLockOn(event.getModifierState('CapsLock')), onBlur: () => setIsCapsLockOn(false) }), _jsx("button", { type: "button", className: "field-toggle-button", "aria-label": showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña', onClick: () => setShowPassword((prev) => !prev), children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), _jsx(Tooltip, { id: "login-password-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(loginErrorMessage), content: loginErrorMessage ?? undefined, noArrow: true }), isCapsLockOn && (_jsx("p", { className: "form-hint form-hint-warning", children: "Bloq May\u00FAs est\u00E1 activado." }))] }), _jsx(Link, { to: "/forgot-password", className: "forgot-link", children: "\u00BFOlvidaste tu contrase\u00F1a?" }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", disabled: !isFormValid || isSubmitting, children: isSubmitting ? 'Iniciando...' : 'Iniciar Sesión' }), _jsx("div", { className: "auth-divider", children: "O contin\u00FAa con" }), _jsxs("div", { className: "auth-social-row", children: [_jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Continuar con Google", onClick: () => handleSocialLogin('google'), disabled: isSubmitting, children: _jsx(Chromium, { className: "auth-social-icon", "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Continuar con GitHub", onClick: () => handleSocialLogin('github'), disabled: isSubmitting, children: _jsx(Github, { className: "auth-social-icon", "aria-hidden": "true" }) })] })] }), _jsx(Tooltip, { id: "login-email-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(emailErrorMessage), content: emailErrorMessage, noArrow: true }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFNo tienes una cuenta? ", _jsx(Link, { to: "/register", children: "Reg\u00EDstrate" })] })] })] }));
}
