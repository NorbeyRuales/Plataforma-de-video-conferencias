/**

 * Login page UI.

 */

import { useState } from 'react';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Video, Mail, Lock, Chromium, Github, Eye, EyeOff } from 'lucide-react';

import { Tooltip } from 'react-tooltip';

import { useToast } from '../../components/layout/ToastProvider';

import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '../../services/firebaseClient';

import { setAuthToken } from '../../services/authToken';

import { loginWithEmailPassword } from '../../services/api';

import Aurora from '../../components/Aurora/Aurora';

import './LoginPage.scss';



export function LoginPage(): JSX.Element {

  const { showToast } = useToast();

  const navigate = useNavigate();
  const location = useLocation();
  const fromPath =
    (location.state as { from?: string } | null)?.from || '/account';

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginErrorMessage, setLoginErrorMessage] = useState<string | null>(null);



  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const hasEmail = email.trim().length > 0;

  const isEmailValid = hasEmail && emailRegex.test(email);

  const showEmailError = hasEmail && !isEmailValid;

  const emailErrorMessage = showEmailError ? 'Ingresa un correo valido.' : undefined;



  const isFormValid = isEmailValid && password.trim().length > 0;



  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();

    if (!isFormValid || isSubmitting) return;



    setIsSubmitting(true);

    try {

      const { idToken } = await loginWithEmailPassword(email.trim(), password);

      setAuthToken(idToken);

      setLoginErrorMessage(null);



      showToast('Sesion iniciada', 'success');

      navigate(fromPath, { replace: true });

    } catch (error: any) {

      const message =
        (error as any)?.message ??
        'No se pudo iniciar sesion. Revisa el correo y la contrasena o usa Olvidaste tu contrasena.';

      setLoginErrorMessage('Revisa correo y contrasena o restablecela si la olvidaste.');

      showToast(message, 'error');

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleSocialLogin = async (providerType: 'google' | 'github') => {


    if (isSubmitting) return;

    setIsSubmitting(true);

    try {

      const provider =

        providerType === 'google'

          ? new GoogleAuthProvider()

          : new GithubAuthProvider();



      const credential = await signInWithPopup(auth, provider);

      const idToken = await credential.user.getIdToken();

      setAuthToken(idToken);

      showToast(

        `Sesión iniciada con ${

          providerType === 'google'

            ? 'Google'

            : 'GitHub'

        }`,

        'success'

      );

      navigate(fromPath, { replace: true });

    } catch (error: any) {

      showToast(

        error.message ??

          `No se pudo iniciar sesión con ${

            providerType === 'google'

              ? 'Google'

              : 'GitHub'

          }.`,

        'error'

      );

    } finally {

      setIsSubmitting(false);

    }

  };



  return (

    <div className="auth-page">
      <div className="auth-aurora-layer">
        <Aurora
          colorStops={['#ff0000', '#7f0010', '#05010a']}
          speed={0.5}
          amplitude={1.0}
        />
      </div>

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

                aria-invalid={showEmailError}

                aria-describedby={showEmailError ? 'login-email-tooltip' : undefined}

                data-tooltip-id="login-email-tooltip"

                value={email}

                onChange={(event) => {
                  setEmail(event.target.value);
                  setLoginErrorMessage(null);
                }}

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

                aria-describedby={loginErrorMessage ? 'login-password-tooltip' : undefined}
                data-tooltip-id="login-password-tooltip"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setLoginErrorMessage(null);
                }}

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

            <Tooltip
              id="login-password-tooltip"
              place="bottom"
              offset={6}
              className="field-error-tooltip field-error-tooltip--error"
              openOnClick={false}
              isOpen={Boolean(loginErrorMessage)}
              content={loginErrorMessage ?? undefined}
              noArrow
            />

            {isCapsLockOn && (

              <p className="form-hint form-hint-warning">Bloq Mayús está activado.</p>

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

              aria-label="Continuar con GitHub"

              onClick={() => handleSocialLogin('github')}

              disabled={isSubmitting}

            >

              <Github className="auth-social-icon" aria-hidden="true" />

            </button>

          </div>

        </form>



        <Tooltip

          id="login-email-tooltip"

          place="bottom"

          offset={6}

          className="field-error-tooltip field-error-tooltip--error"

          openOnClick={false}

          isOpen={Boolean(emailErrorMessage)}

          content={emailErrorMessage}

          noArrow

        />



        <p className="auth-footer-text">

          ¿No tienes una cuenta? <Link to="/register">Regístrate</Link>

        </p>

      </section>

    </div>

  );

}

