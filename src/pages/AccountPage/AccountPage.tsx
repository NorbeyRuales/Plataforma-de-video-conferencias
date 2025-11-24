/**
 * Account page to edit or delete the user account.
 * GUI-only for Sprint 1. Replace static values with real user data later.
 *
 * @returns {JSX.Element} Profile settings form and danger zone actions.
 */
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../../components/layout/ToastProvider';
import {
  deleteProfile,
  getProfile,
  loginWithEmailPassword,
  changePassword,
  updateProfile,
  updateEmail,
  UserProfile,
} from '../../services/api';
import { AUTH_TOKEN_EVENT, getAuthToken, setAuthToken } from '../../services/authToken';
import { PasswordStrengthHint } from '../../components/auth/PasswordStrengthHint';
import './AccountPage.scss';

/**
 * React component for the account / profile settings page.
 * Shows editable personal information and a danger zone for destructive actions.
 *
 * @returns {JSX.Element} Dashboard‑style layout with profile forms.
 */
export function AccountPage(): JSX.Element {
  const { showToast } = useToast();
  const [authTokenState, setAuthTokenState] = useState(() => getAuthToken() ?? '');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailPassword, setEmailPassword] = useState('');
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailPasswordRef = useRef<HTMLInputElement | null>(null);
  const currentPasswordRef = useRef<HTMLInputElement | null>(null);
  const deleteConfirmRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const isAuthenticated = Boolean(authTokenState.trim());

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
  const isStrongPassword = (value: string): boolean =>
    strongPasswordRegex.test(value);

  const hasNewPassword = newPassword.trim().length > 0;
  const hasConfirmPassword = confirmPassword.trim().length > 0;
  const isNewPasswordStrong = hasNewPassword && isStrongPassword(newPassword);
  const isPasswordMismatch =
    hasConfirmPassword && confirmPassword.trim() !== newPassword.trim();
  const showConfirmPasswordMismatch =
    isPasswordModalOpen && hasConfirmPassword && isPasswordMismatch;
  const showConfirmPasswordMatch =
    isPasswordModalOpen && hasConfirmPassword && !isPasswordMismatch;
  const showEmailPasswordError = isEmailModalOpen && !emailPassword.trim();
  const canSubmitPasswordChange =
    isAuthenticated &&
    Boolean(profile?.email) &&
    currentPassword.trim().length > 0 &&
    isNewPasswordStrong &&
    !isPasswordMismatch;

  const loadProfile = async () => {
    if (!authTokenState.trim()) {
      setProfile(null);
      return;
    }

    setAuthToken(authTokenState.trim());
    setIsLoadingProfile(true);
    try {
      const user = await getProfile();
      setProfile(user);
      setFirstName(user.username ?? '');
      setLastName(user.lastname ?? '');
      setAge(user.birthdate ?? '');
      setEmail(user.email ?? '');
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo cargar el perfil.', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authTokenState]);

  useEffect(() => {
    if (isEmailModalOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      emailPasswordRef.current?.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsEmailModalOpen(false);
          setPendingEmailChange(null);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEmailModalOpen]);

  useEffect(() => {
    if (isPasswordModalOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      currentPasswordRef.current?.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPasswordModalOpen]);

  useEffect(() => {
    if (isDeleteDialogOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement;
      deleteConfirmRef.current?.focus();
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsDeleteDialogOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDeleteDialogOpen]);

  useEffect(() => {
    const handleAuthChange = () => setAuthTokenState(getAuthToken() ?? '');
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
    };
  }, []);

  const runSaveFlow = async (targetEmail: string) => {
    const emailChanged = profile && targetEmail !== (profile.email ?? '');
    setIsSavingProfile(true);
    try {
      if (emailChanged) {
        setIsUpdatingEmail(true);
        try {
          const reauthEmail = profile?.email ?? targetEmail;
          const loginResponse = await loginWithEmailPassword(reauthEmail, emailPassword);
          if (loginResponse?.idToken) {
            setAuthToken(loginResponse.idToken);
          }
          await updateEmail(targetEmail);
        } finally {
          setIsUpdatingEmail(false);
        }
      }

      await updateProfile({
        username: firstName.trim(),
        lastname: lastName.trim(),
        birthdate: age.trim(),
      });
      showToast('Perfil actualizado', 'success');
      setEmailPassword('');
      setPendingEmailChange(null);
      setIsEmailModalOpen(false);
      await loadProfile();
    } catch (error: any) {
      const message = error?.message ?? 'No se pudieron guardar los cambios.';
      showToast(message, 'error');
      if (emailChanged) {
        setIsEmailModalOpen(false);
        setPendingEmailChange(null);
        setEmailPassword('');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showToast('Inicia sesion para continuar.', 'error');
      return;
    }

    const trimmedEmail = email.trim();
    const emailChanged = profile && trimmedEmail !== (profile.email ?? '');

    if (emailChanged && !emailPassword.trim()) {
      setPendingEmailChange(trimmedEmail);
      setIsEmailModalOpen(true);
      return;
    }

    await runSaveFlow(trimmedEmail);
  };

  const handleUpdateEmail = async () => {
    if (!isAuthenticated) {
      showToast('Inicia sesion para continuar.', 'error');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      await updateEmail(email.trim());
      showToast('Correo actualizado', 'success');
      await loadProfile();
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo actualizar el correo.', 'error');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleConfirmEmailChange = async () => {
    if (!pendingEmailChange) {
      setIsEmailModalOpen(false);
      return;
    }
    if (!emailPassword.trim()) {
      showToast('Ingresa tu contrasena para actualizar el correo.', 'error');
      return;
    }
    await runSaveFlow(pendingEmailChange);
    lastFocusedRef.current?.focus();
  };

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated || !profile?.email) {
      showToast('Inicia sesion para continuar.', 'error');
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showToast('Completa las contrasenas.', 'error');
      return;
    }
    if (!isNewPasswordStrong) {
      showToast('Usa una contrasena fuerte (8+ chars, mayus/minus/numero/simbolo).', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Las contrasenas no coinciden.', 'error');
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(profile.email, currentPassword.trim(), newPassword.trim());
      showToast('Contrasena actualizada', 'success');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const message = error?.message ?? 'No se pudo cambiar la contrasena.';
      showToast(message, 'error');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleDeleteProfile = async () => {
    if (!isAuthenticated) {
      showToast('Inicia sesión para continuar.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteProfile();
      showToast('Cuenta eliminada', 'success');
      setAuthToken(null);
      setProfile(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo eliminar la cuenta.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card account-card"
          aria-labelledby="account-title"
        >
                    <header className="dashboard-main-header account-header">
            <div>
              <h1 id="account-title">Configuracion de Perfil</h1>
              <p>
                Administra la informacion de tu cuenta y tu historial de
                videoconferencias.
              </p>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <span
                  className={`badge ${
                    isAuthenticated ? 'badge-success' : 'badge-warning'
                  }`}
                  aria-label="Estado de autenticacion"
                >
                  {isAuthenticated ? 'Sesión activa' : 'Sin sesión'}
                </span>
                {!isAuthenticated && (
                  <p className="field-help">
                    Inicia sesión para cargar y editar tu perfil.
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Account information section */}
          <section
            className="account-section"
            aria-labelledby="account-info-title"
          >
            <h2 id="account-info-title" className="account-section-title">
              Información de la cuenta
            </h2>
            <p className="card-subtitle">
              Actualiza tus datos personales básicos. Más adelante estos datos
              se cargarán desde el backend.
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="account-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="firstName">
                    Nombre
                  </label>
                  <div className="field-wrapper">
                    <input
                      className="form-input"
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                      disabled={!isAuthenticated || isLoadingProfile}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="lastName">
                    Apellido
                  </label>
                  <div className="field-wrapper">
                    <input
                      className="form-input"
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                      disabled={!isAuthenticated || isLoadingProfile}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="age">
                  Edad
                </label>
                <div className="field-wrapper">
                  <input
                    className="form-input"
                    id="age"
                    name="age"
                    type="number"
                    min={0}
                    max={120}
                    inputMode="numeric"
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                    required
                    disabled={!isAuthenticated || isLoadingProfile}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Correo electronico
                </label>
                <div className="field-wrapper">
                  <input
                    className="form-input"
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={
                      !isAuthenticated || isLoadingProfile || isSavingProfile || isUpdatingEmail
                    }
                  />
                </div>
              </div>

              <div className="form-group">
              <label className="form-label" htmlFor="bio">
                Biografia
              </label>
              <textarea
                className="form-textarea"
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Hablamos un poco sobre ti..."
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  disabled={!isAuthenticated || isLoadingProfile}
                />
              </div>

              <button
                type="submit"
                className="btn btn-dark account-save-btn"
                disabled={!isAuthenticated || isSavingProfile}
              >
                {isSavingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {!isAuthenticated && (
                <p className="field-help">Inicia sesión para habilitar el formulario.</p>
              )}
              {isLoadingProfile && <p className="field-help">Cargando perfil...</p>}
            </form>
          </section>

          <section className="account-section" aria-label="Seguridad de la cuenta">
            <h2 className="account-section-title">Seguridad</h2>
            <p className="card-subtitle">Actualiza tu contrasena con una verificacion rapida.</p>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => setIsPasswordModalOpen(true)}
              disabled={!isAuthenticated}
            >
              Cambiar contrasena
            </button>
            {!isAuthenticated && (
              <p className="field-help">Inicia sesion para habilitar el cambio de contrasena.</p>
            )}
          </section>

          {/* Danger zone */}
          <section
            className="account-section account-danger"
            aria-labelledby="danger-zone-title"
          >
            <h2 id="danger-zone-title" className="account-section-title">
              Zona de peligro
            </h2>
            <p className="card-subtitle">
              Esta acción eliminará tu cuenta y el historial asociado cuando la
              funcionalidad esté implementada. No se podrá deshacer.
            </p>

            <button
              type="button"
              className="btn btn-danger account-delete-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={!isAuthenticated}
            >
              Eliminar cuenta
            </button>
          </section>

          {isDeleteDialogOpen && (
            <div
              className="account-dialog-backdrop"
              role="presentation"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              <div
                className="account-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="delete-dialog-title">¿Eliminar cuenta?</h3>
                <p id="delete-dialog-description">
                  Esta acción eliminará tu cuenta y el historial asociado cuando
                  la funcionalidad esté implementada. No se podrá deshacer.
                </p>

                <div className="account-dialog-actions">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDeleteProfile}
                    ref={deleteConfirmRef}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Eliminando..." : "Eliminar cuenta"}
                  </button>
                  <button
                    type="button"
                    className="btn account-dialog-cancel"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {isEmailModalOpen && (
            <div
              className="account-dialog-backdrop"
              role="presentation"
              onClick={() => {
                setIsEmailModalOpen(false);
                setPendingEmailChange(null);
                lastFocusedRef.current?.focus();
              }}
            >
              <div
                className="account-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="email-dialog-title"
                aria-describedby="email-dialog-description"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="email-dialog-title">Confirmar cambio de correo</h3>
                <p id="email-dialog-description">
                  Por seguridad, ingresa tu contrasena para actualizar el correo.
                </p>
                  <div className="form-group">
                  <label className="form-label" htmlFor="authPassword">
                    Contrasena
                  </label>
                  <div className="field-wrapper">
                    <input
                      className="form-input"
                      id="authPassword"
                      name="authPassword"
                      autoComplete="current-password"
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailPassword}
                      onChange={(event) => setEmailPassword(event.target.value)}
                      disabled={isSavingProfile || isUpdatingEmail}
                      ref={emailPasswordRef}
                      aria-describedby="email-password-error"
                    />
                    <button
                      type="button"
                      className="field-toggle-button"
                      aria-label={showEmailPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      onClick={() => setShowEmailPassword((prev) => !prev)}
                    >
                      {showEmailPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {showEmailPasswordError && (
                    <div
                      id="email-password-error"
                      role="tooltip"
                      className="field-error-tooltip field-error-tooltip--error"
                    >
                      Ingresa tu contrasena para confirmar el cambio de correo.
                    </div>
                  )}
                </div>
                <div className="account-dialog-actions">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={handleConfirmEmailChange}
                    disabled={isSavingProfile || isUpdatingEmail}
                  >
                    {isSavingProfile || isUpdatingEmail ? 'Verificando...' : 'Confirmar'}
                  </button>
                  <button
                    type="button"
                    className="btn account-dialog-cancel"
                    onClick={() => {
                      setIsEmailModalOpen(false);
                      setPendingEmailChange(null);
                      lastFocusedRef.current?.focus();
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {isPasswordModalOpen && (
            <div
              className="account-dialog-backdrop"
              role="presentation"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                lastFocusedRef.current?.focus();
              }}
            >
              <div
                className="account-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="password-dialog-title"
                aria-describedby="password-dialog-description"
                onClick={(event) => event.stopPropagation()}
              >
                <h3 id="password-dialog-title">Cambiar contrasena</h3>
                <p id="password-dialog-description">
                  Ingresa tu contrasena actual y la nueva. Si la actual es incorrecta, el proceso se cancelara.
                </p>

                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                    <label className="form-label" htmlFor="currentPassword">Contrasena actual</label>
                    <div className="field-wrapper">
                      <input
                        className="form-input"
                        id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        disabled={isChangingPassword}
                        required
                        ref={currentPasswordRef}
                      />
                      <button
                        type="button"
                        className="field-toggle-button"
                        aria-label={showCurrentPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">Nueva contrasena</label>
                    <div className="field-wrapper">
                      <input
                        className="form-input"
                        id="newPassword"
                        name="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        disabled={isChangingPassword}
                        required
                      />
                      <button
                        type="button"
                        className="field-toggle-button"
                        aria-label={showNewPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                        onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    </div>
                    <PasswordStrengthHint password={newPassword} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirmar contrasena</label>
                    <div className="field-wrapper">
                      <input
                        className="form-input"
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        disabled={isChangingPassword}
                        required
                        aria-describedby="confirm-password-error"
                      />
                      <button
                        type="button"
                        className="field-toggle-button"
                        aria-label={showConfirmPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    </div>
                    {showConfirmPasswordMismatch ? (
                      <div
                        id="confirm-password-error"
                        role="tooltip"
                        className="field-error-tooltip field-error-tooltip--error"
                      >
                        Las contrasenas deben coincidir.
                      </div>
                    ) : (
                      showConfirmPasswordMatch && (
                        <div
                          id="confirm-password-error"
                          role="tooltip"
                          className="field-error-tooltip field-error-tooltip--success"
                        >
                          Las contrasenas coinciden.
                        </div>
                      )
                    )}
                  </div>

                  <div className="account-dialog-actions">
                    <button
                      type="submit"
                      className="btn btn-dark"
                      disabled={isChangingPassword || !canSubmitPasswordChange}
                    >
                      {isChangingPassword ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      className="btn account-dialog-cancel"
                      onClick={() => {
                        setIsPasswordModalOpen(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        lastFocusedRef.current?.focus();
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
