import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Account page to edit or delete the user account.
 * GUI-only for Sprint 1. Replace static values with real user data later.
 *
 * @returns {JSX.Element} Profile settings form and danger zone actions.
 */
import './AccountPage.scss';
/**
 * React component for the account / profile settings page.
 * Shows editable personal information and a danger zone for destructive actions.
 *
 * @returns {JSX.Element} Dashboard‑style layout with profile forms.
 */
export function AccountPage() {
    return (_jsx("div", { className: "dashboard-wrapper", children: _jsx("div", { className: "container", children: _jsxs("section", { className: "dashboard-card account-card", "aria-labelledby": "account-title", children: [_jsx("header", { className: "dashboard-main-header account-header", children: _jsxs("div", { children: [_jsx("h1", { id: "account-title", children: "Configuraci\u00F3n de Perfil" }), _jsx("p", { children: "Administra la informaci\u00F3n de tu cuenta y tu historial de videoconferencias." })] }) }), _jsxs("section", { className: "account-section", "aria-labelledby": "account-info-title", children: [_jsx("h2", { id: "account-info-title", className: "account-section-title", children: "Informaci\u00F3n de la cuenta" }), _jsx("p", { className: "card-subtitle", children: "Actualiza tus datos personales b\u00E1sicos. M\u00E1s adelante estos datos se cargar\u00E1n desde el backend." }), _jsxs("form", { onSubmit: (event) => {
                                    event.preventDefault();
                                    /**
                                     * TODO (logic sprint):
                                     * - Read form values (first name, last name, age, bio).
                                     * - Call backend / Firebase to update the user profile.
                                     * - Handle success (toast / message) and errors.
                                     */
                                    console.log('TODO: update account');
                                }, children: [_jsxs("div", { className: "account-form-row", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "firstName", children: "Nombre" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: "\uD83D\uDC64" }), _jsx("input", { className: "form-input", id: "firstName", name: "firstName", type: "text", defaultValue: "Juan", required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "lastName", children: "Apellido" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: "\uD83D\uDC64" }), _jsx("input", { className: "form-input", id: "lastName", name: "lastName", type: "text", defaultValue: "P\u00E9rez", required: true })] })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "age", children: "Edad" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: "\uD83C\uDF82" }), _jsx("input", { className: "form-input", id: "age", name: "age", type: "number", defaultValue: 20, min: 0, max: 120, inputMode: "numeric", required: true })] })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "email", children: "Correo electr\u00F3nico" }), _jsxs("div", { className: "field-wrapper", children: [_jsx("span", { className: "field-icon", "aria-hidden": "true", children: "\u2709\uFE0F" }), _jsx("input", { className: "form-input", id: "email", name: "email", type: "email", defaultValue: "ejemplo@doodle.com", disabled: true })] }), _jsx("p", { className: "field-help", children: "El correo electr\u00F3nico no se puede cambiar despu\u00E9s del registro." })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { className: "form-label", htmlFor: "bio", children: "Biograf\u00EDa" }), _jsx("textarea", { className: "form-textarea", id: "bio", name: "bio", rows: 4, placeholder: "H\u00E1blanos un poco sobre ti..." }), _jsx("p", { className: "field-help", children: "0/200 caracteres" })] }), _jsx("button", { type: "submit", className: "btn btn-dark account-save-btn", children: "Guardar cambios" })] })] }), _jsxs("section", { className: "account-section account-stats", "aria-labelledby": "stats-title", children: [_jsx("h2", { id: "stats-title", className: "account-section-title", children: "Estad\u00EDsticas de reuniones" }), _jsx("p", { className: "card-subtitle", children: "Resumen de tu actividad en videoconferencias. M\u00E1s adelante estos datos vendr\u00E1n del backend." }), _jsxs("div", { className: "account-stats-grid", children: [_jsxs("div", { className: "account-stat-card", children: [_jsx("span", { className: "account-stat-label", children: "Reuniones creadas" }), _jsx("span", { className: "account-stat-value", children: "\u2014" })] }), _jsxs("div", { className: "account-stat-card", children: [_jsx("span", { className: "account-stat-label", children: "Reuniones unidas" }), _jsx("span", { className: "account-stat-value", children: "\u2014" })] }), _jsxs("div", { className: "account-stat-card", children: [_jsx("span", { className: "account-stat-label", children: "Minutos en videollamadas" }), _jsx("span", { className: "account-stat-value", children: "\u2014" })] })] })] }), _jsxs("section", { className: "account-section account-danger", "aria-labelledby": "danger-zone-title", children: [_jsx("h2", { id: "danger-zone-title", className: "account-section-title", children: "Zona de peligro" }), _jsx("p", { className: "card-subtitle", children: "Esta acci\u00F3n eliminar\u00E1 tu cuenta y el historial asociado cuando la funcionalidad est\u00E9 implementada. No se podr\u00E1 deshacer." }), _jsx("button", { type: "button", className: "btn btn-danger account-delete-btn", onClick: () => {
                                    /**
                                     * TODO (logic sprint):
                                     * - Ask for a confirmation (modal / dialog).
                                     * - Call backend / Firebase to delete the user account.
                                     * - Redirect user to home / goodbye page.
                                     */
                                    console.log('TODO: delete account');
                                }, children: "Eliminar cuenta" })] })] }) }) }));
}
