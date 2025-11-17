/**
 * Login page UI.
 * GUI-only in Sprint 1. Later it should submit to the real auth endpoint (Firebase / backend).
 *
 * @returns {JSX.Element} Authentication form for existing users.
 */
import { Link } from 'react-router-dom';
import { Video, Mail, Lock, Chromium, Facebook, Github } from 'lucide-react';
import './LoginPage.scss';

export function LoginPage(): JSX.Element {
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="login-title">Bienvenido de Nuevo</h1>

        <p className="auth-subtitle">
          Inicia sesión en tu cuenta de VideoMeet
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            /**
             * TODO (logic sprint):
             * - Read form values (email, password).
             * - Call Firebase Auth or backend /auth/login endpoint.
             * - Handle success (redirect to dashboard) and errors (show message).
             */
            console.log('TODO: handle login');
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo Electrónico
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
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                className="form-input"
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Link to="/forgot-password" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>

          <button type="submit" className="btn btn-dark auth-btn-main">
            Iniciar Sesión
          </button>

          <div className="auth-divider">O continúa con</div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con Google"
            >
              <Chromium className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con Facebook"
            >
              <Facebook className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con GitHub"
            >
              <Github className="auth-social-icon" aria-hidden="true" />
            </button>
          </div>
        </form>

        <p className="auth-footer-text">
          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </section>
    </div>
  );
}
