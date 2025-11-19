import type { JSX } from 'react';

/**
 * Props for the password strength hint component.
 */
export interface PasswordStrengthHintProps {
  /**
   * Current password value to validate.
   */
  password: string;
}

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
export function PasswordStrengthHint({
  password
}: PasswordStrengthHintProps): JSX.Element | null {
  if (!password) {
    return null;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^0-9a-zA-Z]/.test(password);
  const hasMinLength = password.length >= 8;

  return (
    <div className="password-hint" aria-live="polite">
      <p className="password-hint-title">La contraseña debe incluir:</p>
      <ul className="password-rules">
        <li
          className={`password-rule${
            hasUppercase ? ' password-rule--met' : ''
          }`}
        >
          <span className="password-rule-dot" aria-hidden="true">
            {hasUppercase ? '✓' : ''}
          </span>
          <span>Una letra mayúscula</span>
        </li>
        <li
          className={`password-rule${
            hasLowercase ? ' password-rule--met' : ''
          }`}
        >
          <span className="password-rule-dot" aria-hidden="true">
            {hasLowercase ? '✓' : ''}
          </span>
          <span>Una letra minúscula</span>
        </li>
        <li
          className={`password-rule${hasNumber ? ' password-rule--met' : ''}`}
        >
          <span className="password-rule-dot" aria-hidden="true">
            {hasNumber ? '✓' : ''}
          </span>
          <span>Un número</span>
        </li>
        <li
          className={`password-rule${
            hasSpecial ? ' password-rule--met' : ''
          }`}
        >
          <span className="password-rule-dot" aria-hidden="true">
            {hasSpecial ? '✓' : ''}
          </span>
          <span>Un carácter especial</span>
        </li>
        <li
          className={`password-rule${
            hasMinLength ? ' password-rule--met' : ''
          }`}
        >
          <span className="password-rule-dot" aria-hidden="true">
            {hasMinLength ? '✓' : ''}
          </span>
          <span>Mínimo 8 caracteres</span>
        </li>
      </ul>
    </div>
  );
}
