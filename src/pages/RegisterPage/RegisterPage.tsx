/**
 * Registration page UI.
 * GUI-only in Sprint 1. Later it should send data to backend / Firebase to create the user.
 *
 * @returns {JSX.Element} Sign-up form for new users.
 */
import { Link } from 'react-router-dom';
import './RegisterPage.scss';

export function RegisterPage(): JSX.Element {
  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-logo" aria-hidden="true">
          {/* TODO: Replace this placeholder with a camera SVG logo component */}
          VideoMeet
        </div>

        <h1 id="register-title">Crea tu cuenta</h1>

        <p className="auth-subtitle">
          Únete a VideoMeet y comienza a colaborar en tus videollamadas.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            /**
             * TODO (logic sprint):
             * - Read form values (name, last name, age, email, password).
             * - Validate password and confirmation.
             * - Call Firebase Auth or backend /auth/register endpoint.
             * - Handle success (redirect to login/dashboard) and errors (show message).
             */
            console.log('TODO: handle registration');
          }}
        >
          {/* First name */}
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">
              Nombre
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                👤
              </span>
              <input
                className="form-input"
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Juan"
                autoComplete="given-name"
                required
              />
            </div>
          </div>

          {/* Last name */}
          <div className="form-group">
            <label className="form-label" htmlFor="lastName">
              Apellido
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                👤
              </span>
              <input
                className="form-input"
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Pérez"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          {/* Age */}
          <div className="form-group">
            <label className="form-label" htmlFor="age">
              Edad
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                🎂
              </span>
              <input
                className="form-input"
                type="number"
                id="age"
                name="age"
                placeholder="20"
                min={0}
                max={120}
                inputMode="numeric"
                required
              />
            </div>
          </div>

          {/* Email */}
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
                placeholder="ejemplo@correo.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
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
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label" htmlFor="passwordConfirm">
              Confirmar contraseña
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                🔒
              </span>
              <input
                className="form-input"
                type="password"
                id="passwordConfirm"
                name="passwordConfirm"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-dark auth-btn-main">
            Crear cuenta
          </button>

          <div className="auth-divider">o regístrate con</div>

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
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </div>
  );
}
