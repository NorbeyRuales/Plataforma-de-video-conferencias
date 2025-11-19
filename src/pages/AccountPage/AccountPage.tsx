/**
 * Account page to edit or delete the user account.
 * GUI-only for Sprint 1. Replace static values with real user data later.
 *
 * @returns {JSX.Element} Profile settings form and danger zone actions.
 */
import { useState } from 'react';
import './AccountPage.scss';

/**
 * React component for the account / profile settings page.
 * Shows editable personal information and a danger zone for destructive actions.
 *
 * @returns {JSX.Element} Dashboard‑style layout with profile forms.
 */
export function AccountPage(): JSX.Element {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card account-card"
          aria-labelledby="account-title"
        >
          <header className="dashboard-main-header account-header">
            <div>
              <h1 id="account-title">Configuración de Perfil</h1>
              <p>
                Administra la información de tu cuenta y tu historial de
                videoconferencias.
              </p>
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

            <form
              onSubmit={(event) => {
                event.preventDefault();
                /**
                 * TODO (logic sprint):
                 * - Read form values (first name, last name, age, bio).
                 * - Call backend / Firebase to update the user profile.
                 * - Handle success (toast / message) and errors.
                 */
                console.log('TODO: update account');
              }}
            >
              <div className="account-form-row">
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
                      id="firstName"
                      name="firstName"
                      type="text"
                      defaultValue="Juan"
                      required
                    />
                  </div>
                </div>

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
                      id="lastName"
                      name="lastName"
                      type="text"
                      defaultValue="Pérez"
                      required
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
                    🎂
                  </span>
                  <input
                    className="form-input"
                    id="age"
                    name="age"
                    type="number"
                    defaultValue={20}
                    min={0}
                    max={120}
                    inputMode="numeric"
                    required
                  />
                </div>
              </div>

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
                    id="email"
                    name="email"
                    type="email"
                    defaultValue="ejemplo@doodle.com"
                    disabled
                  />
                </div>
                <p className="field-help">
                  El correo electrónico no se puede cambiar después del
                  registro.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="bio">
                  Biografía
                </label>
                <textarea
                  className="form-textarea"
                  id="bio"
                  name="bio"
                  rows={4}
                  placeholder="Háblanos un poco sobre ti..."
                />
                <p className="field-help">0/200 caracteres</p>
                {/* TODO: turn this into a real character counter when bio is controlled state */}
              </div>

              <button type="submit" className="btn btn-dark account-save-btn">
                Guardar cambios
              </button>
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
                    onClick={() => {
                      /**
                       * TODO (logic sprint):
                       * - Call backend / Firebase to delete the user account.
                       * - Redirect user to home / goodbye page.
                       */
                      console.log('TODO: confirm delete account');
                      setIsDeleteDialogOpen(false);
                    }}
                  >
                    Eliminar cuenta
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
