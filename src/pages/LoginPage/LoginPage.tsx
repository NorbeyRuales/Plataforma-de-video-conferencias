/**
 * Login page UI.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, Mail, Lock, Chromium, Facebook, Github, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/layout/ToastProvider';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../services/firebaseClient';
import { setAuthToken } from '../../services/authToken';
import './LoginPage.scss';

export function LoginPage(): JSX.Element {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const idToken = await credential.user.getIdToken();
      setAuthToken(idToken);

      showToast('Sesión iniciada', 'success');
      navigate('/account');
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo iniciar sesión.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (providerType: 'google' | 'facebook' | 'github') => {
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
        `Sesión iniciada con ${providerType === 'google' ? 'Google' : 'Facebook'}`,
        'success'
      );
      navigate('/account');
    } catch (error: any) {
      showToast(
        error.message ??
          `No se pudo iniciar sesión con ${
            providerType === 'google' ? 'Google' : 'Facebook'
          }.`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-logo" aria-hidden="true">
          <Video className="auth-logo-icon" aria-hidden="true" />
        </div>

        <h1 id="login-title">Bienvenido de Nuevo</h1>

        <p className="auth-subtitle">Inicia sesión en tu cuenta de VideoMeet</p>

        <form onSubmit={handleSubmit}>
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="********"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) =>
                  setIsCapsLockOn(event.getModifierState('CapsLock'))
                }
                onKeyUp={(event) =>
                  setIsCapsLockOn(event.getModifierState('CapsLock'))
                }
                onBlur={() => setIsCapsLockOn(false)}
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

            {isCapsLockOn && (
              <p className="form-hint form-hint-warning">
                Bloq Mayús está activado.
              </p>
            )}
          </div>

          <Link to="/forgot-password" className="forgot-link">
            ¿Olvidaste tu contraseña?
          </Link>

          <button
            type="submit"
            className="btn btn-dark auth-btn-main"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>

          <div className="auth-divider">O continúa con</div>

          <div className="auth-social-row">
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con Google"
              onClick={() => handleSocialLogin('google')}
              disabled={isSubmitting}
            >
              <Chromium className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con Facebook"
              onClick={() => handleSocialLogin('facebook')}
              disabled={isSubmitting}
            >
              <Facebook className="auth-social-icon" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="auth-social-btn"
              aria-label="Continuar con GitHub"
              onClick={() => handleSocialLogin('github')}
              disabled={isSubmitting}
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
