import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Registration page UI.
 * GUI-only in Sprint 1. Later it should send data to backend / Firebase to create the user.
 *
 * @returns {JSX.Element} Sign-up form for new users.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, User, CalendarDays, Mail, Lock, Chromium, Github, Eye, EyeOff, } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useToast } from '../../components/layout/ToastProvider';
import { PasswordStrengthHint } from '../../components/auth/PasswordStrengthHint';
import { registerUser } from '../../services/api';
import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { setAuthToken } from '../../services/authToken';
import './RegisterPage.scss';
/**
 * React component that renders the registration form for new users.
 * In Sprint 1 it does not persist data and only shows a success toast.
 *
 * @returns {JSX.Element} Sign-up page with personal data and password fields.
 */
export function RegisterPage() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    const isStrongPassword = (value) => strongPasswordRegex.test(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const numericAge = Number(age);
    const hasAge = age.trim().length > 0;
    const isAgeValid = hasAge && Number.isFinite(numericAge) && numericAge >= 13;
    const hasEmail = email.trim().length > 0;
    const isEmailValid = hasEmail && emailRegex.test(email);
    const hasPassword = password.trim().length > 0;
    const isPasswordStrong = hasPassword && isStrongPassword(password);
    const hasPasswordConfirm = passwordConfirm.trim().length > 0;
    const isPasswordMismatch = hasPasswordConfirm && passwordConfirm !== password;
    const isPasswordMatch = hasPasswordConfirm && passwordConfirm === password;
    const ageErrorMessage = hasAge && !isAgeValid ? 'Debes tener al menos 13 años.' : undefined;
    const emailErrorMessage = hasEmail && !isEmailValid ? 'Introduce un correo electrónico válido.' : undefined;
    const passwordErrorMessage = hasPassword && !isPasswordStrong
        ? 'Usa 8 caracteres con mayúsculas, minúsculas y números.'
        : undefined;
    const passwordConfirmErrorMessage = isPasswordMismatch ? 'Las contraseñas deben coincidir.' : undefined;
    const isFormValid = firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        isAgeValid &&
        isEmailValid &&
        isPasswordStrong &&
        isStrongPassword(passwordConfirm) &&
        isPasswordMatch;
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isFormValid || isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await registerUser({
                email: email.trim(),
                password,
                username: firstName.trim(),
                lastname: lastName.trim(),
                birthdate: age.trim(),
            });
            showToast('Cuenta creada con éxito. Ahora inicia sesión.', 'success');
            navigate('/login');
        }
        catch (error) {
            showToast(error.message ?? 'No se pudo registrar.', 'error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleSocialRegister = async (providerType) => {
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            const provider = providerType === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
            const providerName = providerType === 'google' ? 'Google' : 'GitHub';
            const credential = await signInWithPopup(auth, provider);
            const idToken = await credential.user.getIdToken();
            setAuthToken(idToken);
            showToast(`Cuenta creada con ${providerName}`, 'success');
            navigate('/account');
        }
        catch (error) {
            showToast(error.message ?? `No se pudo registrar con ${providerType === 'google' ? 'Google' : 'GitHub'}.`, 'error');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "auth-page", children: _jsxs("section", { className: "auth-card", "aria-labelledby": "register-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "register-title", children: "Crea Tu Cuenta" }), _jsx("p", { className: "auth-subtitle", children: "\u00DAnete a VideoMeet y comienza a colaborar." }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "auth-row-2", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "firstName", children: "Nombre" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(User, { size: 16 }) }), _jsx("input", { className: "form-input", type: "text", id: "firstName", name: "firstName", placeholder: "Juan", autoComplete: "given-name", required: true, value: firstName, onChange: (event) => setFirstName(event.target.value) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "lastName", children: "Apellido" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(User, { size: 16 }) }), _jsx("input", { className: "form-input", type: "text", id: "lastName", name: "lastName", placeholder: "P\u00E9rez", autoComplete: "family-name", required: true, value: lastName, onChange: (event) => setLastName(event.target.value) })] })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "age", children: "Edad" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(CalendarDays, { size: 16 }) }), _jsx("input", { className: "form-input", type: "number", id: "age", name: "age", placeholder: "25", min: 0, max: 120, inputMode: "numeric", "aria-invalid": hasAge && !isAgeValid, "aria-describedby": hasAge && !isAgeValid ? 'age-tooltip' : undefined, "data-tooltip-id": "age-tooltip", required: true, value: age, onChange: (event) => setAge(event.target.value) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo electr\u00F3nico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Mail, { size: 16 }) }), _jsx("input", { className: "form-input", type: "email", id: "email", name: "email", placeholder: "tu@ejemplo.com", autoComplete: "email", "aria-invalid": hasEmail && !isEmailValid, "aria-describedby": hasEmail && !isEmailValid ? 'email-tooltip' : undefined, "data-tooltip-id": "email-tooltip", required: true, value: email, onChange: (event) => setEmail(event.target.value) })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "password", children: "Contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: showPassword ? 'text' : 'password', id: "password", name: "password", placeholder: "********", autoComplete: "new-password", "aria-invalid": hasPassword && !isPasswordStrong, "aria-describedby": hasPassword && !isPasswordStrong ? 'password-tooltip' : undefined, "data-tooltip-id": "password-tooltip", required: true, value: password, onChange: (event) => setPassword(event.target.value) }), _jsx("button", { type: "button", className: "field-toggle-button", "aria-label": showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña', onClick: () => setShowPassword((prev) => !prev), children: showPassword ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), _jsx(PasswordStrengthHint, { password: password })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "passwordConfirm", children: "Confirmar contrase\u00F1a" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Lock, { size: 16 }) }), _jsx("input", { className: "form-input", type: showPasswordConfirm ? 'text' : 'password', id: "passwordConfirm", name: "passwordConfirm", placeholder: "********", autoComplete: "new-password", "aria-invalid": isPasswordMismatch, "aria-describedby": isPasswordMismatch ? 'passwordConfirm-tooltip' : undefined, "data-tooltip-id": "passwordConfirm-tooltip", required: true, value: passwordConfirm, onChange: (event) => setPasswordConfirm(event.target.value) }), _jsx("button", { type: "button", className: "field-toggle-button", "aria-label": showPasswordConfirm
                                                ? 'Ocultar confirmación de contraseña'
                                                : 'Mostrar confirmación de contraseña', onClick: () => setShowPasswordConfirm((prev) => !prev), children: showPasswordConfirm ? _jsx(EyeOff, { size: 16 }) : _jsx(Eye, { size: 16 }) })] }), isPasswordMatch && (_jsx("p", { className: "form-hint form-hint-success", children: "Las contrase\u00F1as coinciden." }))] }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", disabled: !isFormValid || isSubmitting, children: isSubmitting ? 'Creando cuenta…' : 'Crear Cuenta' }), _jsx("div", { className: "auth-divider", children: "O reg\u00EDstrate con" }), _jsxs("div", { className: "auth-social-row", children: [_jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Registrarte con Google", onClick: () => handleSocialRegister('google'), disabled: isSubmitting, children: _jsx(Chromium, { className: "auth-social-icon", "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: "auth-social-btn", "aria-label": "Registrarte con GitHub", onClick: () => handleSocialRegister('github'), disabled: isSubmitting, children: _jsx(Github, { className: "auth-social-icon", "aria-hidden": "true" }) })] }), _jsx(Tooltip, { id: "age-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(ageErrorMessage), content: ageErrorMessage, noArrow: true }), _jsx(Tooltip, { id: "email-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(emailErrorMessage), content: emailErrorMessage, noArrow: true }), _jsx(Tooltip, { id: "password-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(passwordErrorMessage), content: passwordErrorMessage, noArrow: true }), _jsx(Tooltip, { id: "passwordConfirm-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(passwordConfirmErrorMessage), content: passwordConfirmErrorMessage, noArrow: true })] }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFYa tienes una cuenta? ", _jsx(Link, { to: "/login", children: "Inicia sesi\u00F3n" })] })] }) }));
}
