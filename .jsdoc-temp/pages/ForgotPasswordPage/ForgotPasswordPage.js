import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Forgot password page UI.
 *
 * @returns {JSX.Element} Password reset request form.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Mail } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { useToast } from "../../components/layout/ToastProvider";
import { requestPasswordReset } from "../../services/api";
import "./ForgotPasswordPage.scss";
/**
 * React component that renders the password-reset request form.
 */
export function ForgotPasswordPage() {
    const { showToast } = useToast();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [emailErrorMessage, setEmailErrorMessage] = useState(null);
    const isFormValid = email.trim().length > 0 && !isSent;
    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isFormValid || isSubmitting)
            return;
        setIsSubmitting(true);
        try {
            await requestPasswordReset(email.trim());
            setIsSent(true);
            setEmailErrorMessage(null);
            showToast("Enlace enviado. Revisa tu correo.", "success");
        }
        catch (error) {
            const message = error?.message ??
                "No se pudo enviar el enlace. Revisa que el correo este bien escrito o intentalo de nuevo.";
            setEmailErrorMessage("Revisa que el correo este bien escrito o intentalo de nuevo.");
            showToast(message, "error");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (_jsx("div", { className: "auth-page", children: _jsxs("section", { className: "auth-card forgot-card", "aria-labelledby": "forgot-title", children: [_jsx("div", { className: "auth-logo", "aria-hidden": "true", children: _jsx(Video, { className: "auth-logo-icon", "aria-hidden": "true" }) }), _jsx("h1", { id: "forgot-title", children: "Recuperar contrasena" }), _jsx("p", { className: "auth-subtitle", children: "Ingresa tu correo electronico y te enviaremos un enlace para restablecer tu contrasena." }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo electronico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: _jsx(Mail, { size: 16 }) }), _jsx("input", { className: "form-input", type: "email", id: "email", name: "email", placeholder: "tu@ejemplo.com", autoComplete: "email", required: true, "aria-describedby": emailErrorMessage ? "forgot-email-tooltip" : undefined, "data-tooltip-id": "forgot-email-tooltip", value: email, onChange: (event) => {
                                                setEmail(event.target.value);
                                                setEmailErrorMessage(null);
                                            }, disabled: isSent })] }), _jsx("p", { className: "form-hint forgot-email-hint", children: "Formato recomendado: nombre@dominio.com" })] }), _jsx("button", { type: "submit", className: "btn btn-dark auth-btn-main", disabled: !isFormValid || isSubmitting, children: isSubmitting
                                ? "Enviando enlace..."
                                : isSent
                                    ? "Enlace enviado"
                                    : "Enviar enlace de restablecimiento" })] }), _jsx(Tooltip, { id: "forgot-email-tooltip", place: "bottom", offset: 6, className: "field-error-tooltip field-error-tooltip--error", openOnClick: false, isOpen: Boolean(emailErrorMessage), content: emailErrorMessage ?? undefined, noArrow: true }), isSent && (_jsx("p", { className: "auth-subtitle", role: "status", children: "Si tu correo existe, recibiras un enlace para restablecer tu contrasena. Revisa bandeja de entrada y spam." })), _jsx("p", { className: "auth-footer-text", children: _jsx(Link, { to: "/login", children: "Volver al inicio de sesion" }) }), _jsxs("p", { className: "auth-footer-text", children: ["\u00BFNo tienes cuenta? ", _jsx(Link, { to: "/register", children: "Reg\u00EDstrate" })] })] }) }));
}
