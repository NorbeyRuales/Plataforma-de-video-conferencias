/**
 * Forgot password page UI.
 * GUI-only in Sprint 1. Later it should trigger Firebase password reset
 * or a backend endpoint to send a recovery link.
 *
 * @returns {JSX.Element} Password recovery form.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import './ForgotPasswordPage.scss';

/**
<<<<<<< HEAD
 * React component that renders the password-reset request form.
=======
 * React component that renders the password‑reset request form.
>>>>>>> main
 * In Sprint 1 it only prevents default submission and logs a TODO.
 *
 * @returns {JSX.Element} Page with a single email field and actions.
 */
export function ForgotPasswordPage(): JSX.Element {
  const [email, setEmail] = useState('');
  const isFormValid = email.trim().length > 0;

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="forgot-title">Recuperar contraseña</h1>

        <p className="auth-subtitle">
          Ingresa tu correo electrónico y te enviaremos un enlace
          para restablecer tu contraseña.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            /**
             * TODO (logic sprint):
             * - Read the email value from the form.
             * - Call Firebase sendPasswordResetEmail or a backend endpoint.
             * - Show a confirmation or error message based on the response.
             */
            console.log('TODO: handle password recovery');
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electrónico
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                @
              </span>
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                placeholder="tu@ejemplo.com"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid}
          >
            Enviar enlace de restablecimiento
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>

        <p className="auth-footer-text">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </section>
    </div>
  );
}

