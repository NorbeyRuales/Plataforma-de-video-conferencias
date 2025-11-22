/**
 * Registration page UI.
 * GUI-only in Sprint 1. Later it should send data to backend / Firebase to create the user.
 *
 * @returns {JSX.Element} Sign-up form for new users.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { registerUser } from '../../services/api';
import {
  FacebookAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { setAuthToken } from '../../services/authToken';
import './RegisterPage.scss';

/**
 * React component that renders the registration form for new users.
 * In Sprint 1 it does not persist data and only shows a success toast.
 *
 * @returns {JSX.Element} Sign-up page with personal data and password fields.
 */
export function RegisterPage(): JSX.Element {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
  const isStrongPassword = (value: string): boolean =>
    strongPasswordRegex.test(value);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const numericAge = Number(age);
  const hasAge = age.trim().length > 0;
  const isAgeValid = hasAge && Number.isFinite(numericAge) && numericAge >= 13;

  const hasEmail = email.trim().length > 0;
  const isEmailValid = hasEmail && emailRegex.test(email);

  const hasPassword = password.trim().length > 0;
  const isPasswordStrong = hasPassword && isStrongPassword(password);

  const hasPasswordConfirm = passwordConfirm.trim().length > 0;
  const isPasswordMismatch = hasPasswordConfirm && passwordConfirm !== password;
  const isPasswordMatch = hasPasswordConfirm && passwordConfirm === password;

  const isFormValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isAgeValid &&
    isEmailValid &&
    isPasswordStrong &&
    isStrongPassword(passwordConfirm) &&
    isPasswordMatch;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await registerUser({
        email: email.trim(),
        password,
        username: firstName.trim(),
        lastname: lastName.trim(),
        birthdate: age.trim(),
      });

      showToast('Cuenta creada con éxito. Ahora inicia sesión.', 'success');
      navigate('/login');
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo registrar.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialRegister = async (providerType: 'google' | 'facebook' | 'github') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const provider =
        providerType === 'google'
          ? new GoogleAuthProvider()
          : providerType === 'facebook'
          ? new FacebookAuthProvider()
          : new GithubAuthProvider();

      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      setAuthToken(idToken);
      showToast(
        `Cuenta creada con ${providerType === 'google' ? 'Google' : providerType === 'facebook' ? 'Facebook' : 'GitHub'}`,
        'success'
      );
      navigate('/account');
    } catch (error: any) {
      showToast(
        error.message ??
          `No se pudo registrar con ${providerType === 'google' ? 'Google' : providerType === 'facebook' ? 'Facebook' : 'GitHub'}.`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit}>
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
                aria-invalid={hasAge && !isAgeValid}
                aria-describedby={hasAge && !isAgeValid ? 'age-tooltip' : undefined}
                required
                value={age}
                onChange={(event) => setAge(event.target.value)}
              />
              {hasAge && !isAgeValid && (
                <div
                  id="age-tooltip"
                  role="tooltip"
                  className="field-error-tooltip field-error-tooltip--error"
                >
                  Debes tener al menos 13 años.
                </div>
              )}
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
                aria-invalid={hasEmail && !isEmailValid}
                aria-describedby={hasEmail && !isEmailValid ? 'email-tooltip' : undefined}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {hasEmail && !isEmailValid && (
                <div
                  id="email-tooltip"
                  role="tooltip"
                  className="field-error-tooltip field-error-tooltip--error"
                >
                  Introduce un correo electrónico válido.
                </div>
              )}
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
                aria-invalid={hasPassword && !isPasswordStrong}
                aria-describedby={
                  hasPassword && !isPasswordStrong ? 'password-tooltip' : undefined
                }
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

            {hasPassword && !isPasswordStrong && (
              <div
                id="password-tooltip"
                role="tooltip"
                className="field-error-tooltip field-error-tooltip--error"
              >
                Usa 8 caracteres con mayúsculas, minúsculas y números.
              </div>
            )}

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
                aria-invalid={isPasswordMismatch}
                aria-describedby={
                  isPasswordMismatch ? 'passwordConfirm-tooltip' : undefined
                }
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

              {isPasswordMismatch && (
                <div
                  id="passwordConfirm-tooltip"
                  role="tooltip"
                  className="field-error-tooltip field-error-tooltip--error"
                >
                  Las contraseñas deben coincidir.
                </div>
              )}
            </div>

            {isPasswordMatch && (
              <p className="form-hint form-hint-success">
                Las contraseñas coinciden.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Creando cuenta…' : 'Crear Cuenta'}
          </button>

          {/* Divider + social buttons (like login) */}
          <div className="auth-divider">O regístrate con</div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con Google"
              onClick={() => handleSocialRegister('google')}
              disabled={isSubmitting}
            >
              <Chromium className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con Facebook"
              onClick={() => handleSocialRegister('facebook')}
              disabled={isSubmitting}
            >
              <Facebook className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Registrarte con GitHub"
              onClick={() => handleSocialRegister('github')}
              disabled={isSubmitting}
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



