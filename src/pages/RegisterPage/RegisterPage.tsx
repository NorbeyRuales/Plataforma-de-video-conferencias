/**
 * Registration page UI.
 * GUI-only in Sprint 1. Later it should send data to backend / Firebase to create the user.
 *
 * @returns {JSX.Element} Sign-up form for new users.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  User,
  CalendarDays,
  Mail,
  Lock,
  Chromium,
  Facebook,
  Github,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '../../components/layout/ToastProvider';
import { PasswordStrengthHint } from '../../components/auth/PasswordStrengthHint';
import './RegisterPage.scss';

/**
 * React component that renders the registration form for new users.
 * In Sprint 1 it does not persist data and only shows a success toast.
 *
 * @returns {JSX.Element} Sign-up page with personal data and password fields.
 */
export function RegisterPage(): JSX.Element {
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
  const isStrongPassword = (value: string): boolean =>
    strongPasswordRegex.test(value);

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    age.trim().length > 0 &&
    email.trim().length > 0 &&
    isStrongPassword(password) &&
    isStrongPassword(passwordConfirm) &&
    password === passwordConfirm;

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="register-title">Crea Tu Cuenta</h1>

        <p className="auth-subtitle">
          Únete a VideoMeet y comienza a colaborar.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            console.log('TODO: handle registration');
            showToast(
              'Demo: el registro se mostrará aquí cuando el backend esté listo.',
              'success'
            );
          }}
        >
          {/* First and last name in two columns */}
          <div className="auth-row-2">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">
                Nombre
              </label>
              <div className="field-wrapper">
                <span className="field-icon" aria-hidden="true">
                  <User size={16} />
                </span>
                <input
                  className="form-input"
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder="Juan"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">
                Apellido
              </label>
              <div className="field-wrapper">
                <span className="field-icon" aria-hidden="true">
                  <User size={16} />
                </span>
                <input
                  className="form-input"
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder="Pérez"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Age */}
          <div className="form-group">
            <label className="form-label" htmlFor="age">
              Edad
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <CalendarDays size={16} />
              </span>
              <input
                className="form-input"
                type="number"
                id="age"
                name="age"
                placeholder="25"
                min={0}
                max={120}
                inputMode="numeric"
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                <Lock size={16} />
              </span>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="********"
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

          {/* Confirm password */}
          <div className="form-group">
            <label className="form-label" htmlFor="passwordConfirm">
              Confirmar contraseña
            </label>
            <div className="field-wrapper">
              <span className="field-icon" aria-hidden="true">
                <Lock size={16} />
              </span>
              <input
                className="form-input"
                type={showPasswordConfirm ? 'text' : 'password'}
                id="passwordConfirm"
                name="passwordConfirm"
                placeholder="********"
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

            {passwordConfirm &&
              (passwordConfirm !== password ? (
                <p className="form-hint form-hint-error">
                  Las contraseñas deben coincidir.
                </p>
              ) : (
                <p className="form-hint form-hint-success">
                  Las contraseñas coinciden.
                </p>
              ))}
          </div>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid}
          >
            Crear Cuenta
          </button>

          {/* Divider + social buttons (like login) */}
          <div className="auth-divider">O regístrate con</div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con Google"
            >
              <Chromium className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con Facebook"
            >
              <Facebook className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con GitHub"
            >
              <Github className="auth-social-icon" aria-hidden="true" />
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
