/**
 * Account page to edit or delete the user account.
 * GUI-only for Sprint 1. Replace static values with real user data later.
 *
 * @returns {JSX.Element} Profile settings form and danger zone actions.
 */
import { useEffect, useState } from 'react';
import { useToast } from '../../components/layout/ToastProvider';
import {
  deleteProfile,
  getProfile,
  updateProfile,
  UserProfile,
} from '../../services/api';
import { AUTH_TOKEN_EVENT, getAuthToken, setAuthToken } from '../../services/authToken';
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isAuthenticated = Boolean(authTokenState.trim());

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
    const handleAuthChange = () => setAuthTokenState(getAuthToken() ?? '');
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener(AUTH_TOKEN_EVENT, handleAuthChange);
    };
  }, []);

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showToast('Inicia sesión para continuar.', 'error');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        username: firstName.trim(),
        lastname: lastName.trim(),
        birthdate: age.trim(),
      });
      showToast('Perfil actualizado', 'success');
      await loadProfile();
    } catch (error: any) {
      showToast(error.message ?? 'No se pudieron guardar los cambios.', 'error');
    } finally {
      setIsSavingProfile(false);
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
                    <span className="field-icon" aria-hidden="true">
                      :)
                    </span>
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
                    <span className="field-icon" aria-hidden="true">
                      :)
                    </span>
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
                  <span className="field-icon" aria-hidden="true">
                    #
                  </span>
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
                  <span className="field-icon" aria-hidden="true">
                    @
                  </span>
                  <input
                    className="form-input"
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                  />
                </div>
                <p className="field-help">
                  El correo electronico no se puede cambiar despues del registro.
                </p>
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
                <p className="field-help">Opcional (no se guarda aun en backend)</p>
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

          {/* Meeting statistics section (placeholder cards) */}
          <section
            className="account-section account-stats"
            aria-labelledby="stats-title"
          >
            <h2 id="stats-title" className="account-section-title">
              Estadísticas de reuniones
            </h2>
            <p className="card-subtitle">
              Resumen de tu actividad en videoconferencias. Más adelante estos
              datos vendrán del backend.
            </p>

            <div className="account-stats-grid">
              <div className="account-stat-card">
                <span className="account-stat-label">Reuniones creadas</span>
                <span className="account-stat-value">—</span>
              </div>
              <div className="account-stat-card">
                <span className="account-stat-label">Reuniones unidas</span>
                <span className="account-stat-value">—</span>
              </div>
              <div className="account-stat-card">
                <span className="account-stat-label">
                  Minutos en videollamadas
                </span>
                <span className="account-stat-value">—</span>
              </div>
            </div>
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
        </section>
      </div>
    </div>
  );
}
