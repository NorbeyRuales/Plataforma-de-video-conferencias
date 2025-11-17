/**
 * Login page UI.
 * GUI-only in Sprint 1. Later it should submit to the real auth endpoint (Firebase / backend).
 *
 * @returns {JSX.Element} Authentication form for existing users.
 */
import { Link } from 'react-router-dom';
import './LoginPage.scss';

export function LoginPage(): JSX.Element {
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo" aria-hidden="true">
          {/* TODO: Replace this placeholder with a proper SVG logo component if needed */}
          VideoMeet
        </div>

        <h1 id="login-title">Bienvenido de nuevo</h1>

        <p className="auth-subtitle">
          Inicia sesión en tu cuenta de VideoMeet para unirte a tus reuniones.
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
              Correo electrónico
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                ✉️
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
                🔒
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
            Iniciar sesión
          </button>

          <div className="auth-divider">o continúa con</div>

          <div className="auth-social-row">
            <button type="button" className="auth-social-btn">
              <span className="icon" aria-hidden="true">
                🌐
              </span>
              <span>Google</span>
            </button>
            <button type="button" className="auth-social-btn">
              <span className="icon" aria-hidden="true">
                📘
              </span>
              <span>Facebook</span>
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
