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
import { useToast } from '../../components/layout/ToastProvider';
import { requestPasswordReset } from '../../services/api';
import './ForgotPasswordPage.scss';

/**
 * React component that renders the password-reset request form.
 * In Sprint 1 it only prevents default submission and logs a TODO.
 *
 * @returns {JSX.Element} Page with a single email field and actions.
 */
export function ForgotPasswordPage(): JSX.Element {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFormValid = email.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      showToast('Enlace enviado. Revisa tu correo.', 'success');
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo enviar el enlace.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="forgot-title">Recuperar contrase��a</h1>

        <p className="auth-subtitle">
          Ingresa tu correo electr��nico y te enviaremos un enlace
          para restablecer tu contrase��a.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electr��nico
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
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Enviando enlace…' : 'Enviar enlace de restablecimiento'}
          </button>
        </form>

        <p className="auth-footer-text">
          <Link to="/login">Volver al inicio de sesi��n</Link>
        </p>

        <p className="auth-footer-text">
          ��No tienes cuenta? <Link to="/register">Reg��strate</Link>
        </p>
      </section>
    </div>
  );
}

