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
export function ResetPasswordPage(): JSX.Element {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^0-9a-zA-Z]).{8,}$/;
  const isStrongPassword = (value: string): boolean =>
    strongPasswordRegex.test(value);

  const isFormValid =
    isStrongPassword(password) &&
    isStrongPassword(passwordConfirm) &&
    password === passwordConfirm;

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="reset-title">Crea una Nueva Contraseña</h1>

        <p className="auth-subtitle">
          Elige una nueva contraseña para tu cuenta de VideoMeet.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            /**
             * TODO (logic sprint):
             * - Read password + confirmation.
             * - Validate the reset token from URL (e.g. /reset-password/:token).
             * - Send the new password to the backend / Firebase.
             * - Show success or error feedback and redirect to login.
             */
            console.log('TODO: handle real password reset');
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">
              Nueva contraseña
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                placeholder="Introduce una contraseña segura"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="field-toggle-button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <PasswordStrengthHint password={password} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPasswordConfirm">
              Confirmar contraseña
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                className="form-input"
                type={showPasswordConfirm ? 'text' : 'password'}
                id="newPasswordConfirm"
                name="newPasswordConfirm"
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
              <button
                type="button"
                className="field-toggle-button"
                aria-label={
                  showPasswordConfirm
                    ? 'Ocultar confirmación de contraseña'
                    : 'Mostrar confirmación de contraseña'
                }
                onClick={() => setShowPasswordConfirm((prev) => !prev)}
              >
                {showPasswordConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {passwordConfirm && passwordConfirm !== password && (
              <p className="form-hint form-hint-error">
                Las contraseñas no coinciden.
              </p>
            )}

            {passwordConfirm && passwordConfirm === password && (
              <p className="form-hint form-hint-success">
                Las contraseñas coinciden correctamente.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid}
          >
            Guardar nueva contraseña
          </button>
        </form>

        <p className="auth-footer-text">
          ¿Recordaste tu contraseña? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </div>
  );
}
