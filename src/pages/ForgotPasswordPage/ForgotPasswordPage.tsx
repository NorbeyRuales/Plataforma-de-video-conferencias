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
export function ForgotPasswordPage(): JSX.Element {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);
  const isFormValid = email.trim().length > 0 && !isSent;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setIsSent(true);
      setEmailErrorMessage(null);
      showToast("Enlace enviado. Revisa tu correo.", "success");
    } catch (error: any) {
      const message =
        error?.message ??
        "No se pudo enviar el enlace. Revisa que el correo este bien escrito o intentalo de nuevo.";
      setEmailErrorMessage("Revisa que el correo este bien escrito o intentalo de nuevo.");
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card forgot-card" aria-labelledby="forgot-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="forgot-title">Recuperar contrasena</h1>

        <p className="auth-subtitle">
          Ingresa tu correo electronico y te enviaremos un enlace
          para restablecer tu contrasena.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electronico
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <Mail size={16} />
              </span>
              <input
                className="form-input"
                type="email"
                id="email"
                name="email"
                placeholder="tu@ejemplo.com"
                autoComplete="email"
                required
                aria-describedby={emailErrorMessage ? "forgot-email-tooltip" : undefined}
                data-tooltip-id="forgot-email-tooltip"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailErrorMessage(null);
                }}
                disabled={isSent}
              />
            </div>
            <p className="form-hint forgot-email-hint">Formato recomendado: nombre@dominio.com</p>
          </div>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting
              ? "Enviando enlace..."
              : isSent
              ? "Enlace enviado"
              : "Enviar enlace de restablecimiento"}
          </button>
        </form>

        <Tooltip
          id="forgot-email-tooltip"
          place="bottom"
          offset={6}
          className="field-error-tooltip field-error-tooltip--error"
          openOnClick={false}
          isOpen={Boolean(emailErrorMessage)}
          content={emailErrorMessage ?? undefined}
          noArrow
        />

        {isSent && (
          <p className="auth-subtitle" role="status">
            Si tu correo existe, recibiras un enlace para restablecer tu contrasena. Revisa bandeja de entrada y spam.
          </p>
        )}

        <p className="auth-footer-text">
          <Link to="/login">Volver al inicio de sesion</Link>
        </p>

        <p className="auth-footer-text">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </section>
    </div>
  );
}
