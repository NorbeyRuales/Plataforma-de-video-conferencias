import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Small helper component that shows which password rules
 * are already fulfilled as the user types.
 *
 * Rules:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Minimum length of 8 characters
 *
 * @param {PasswordStrengthHintProps} props Component props.
 * @returns {JSX.Element} List of password rules with dynamic feedback.
 */
export function PasswordStrengthHint({ password }) {
    if (!password) {
        return null;
    }
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^0-9a-zA-Z]/.test(password);
    const hasMinLength = password.length >= 8;
    return (_jsxs("div", { className: "password-hint", "aria-live": "polite", children: [_jsx("p", { className: "password-hint-title", children: "La contrase\u00F1a debe incluir:" }), _jsxs("ul", { className: "password-rules", children: [_jsxs("li", { className: `password-rule${hasUppercase ? ' password-rule--met' : ''}`, children: [_jsx("span", { className: "password-rule-dot", "aria-hidden": "true", children: hasUppercase ? '✓' : '' }), _jsx("span", { children: "Una letra may\u00FAscula" })] }), _jsxs("li", { className: `password-rule${hasLowercase ? ' password-rule--met' : ''}`, children: [_jsx("span", { className: "password-rule-dot", "aria-hidden": "true", children: hasLowercase ? '✓' : '' }), _jsx("span", { children: "Una letra min\u00FAscula" })] }), _jsxs("li", { className: `password-rule${hasNumber ? ' password-rule--met' : ''}`, children: [_jsx("span", { className: "password-rule-dot", "aria-hidden": "true", children: hasNumber ? '✓' : '' }), _jsx("span", { children: "Un n\u00FAmero" })] }), _jsxs("li", { className: `password-rule${hasSpecial ? ' password-rule--met' : ''}`, children: [_jsx("span", { className: "password-rule-dot", "aria-hidden": "true", children: hasSpecial ? '✓' : '' }), _jsx("span", { children: "Un car\u00E1cter especial" })] }), _jsxs("li", { className: `password-rule${hasMinLength ? ' password-rule--met' : ''}`, children: [_jsx("span", { className: "password-rule-dot", "aria-hidden": "true", children: hasMinLength ? '✓' : '' }), _jsx("span", { children: "M\u00EDnimo 8 caracteres" })] })] })] }));
}
