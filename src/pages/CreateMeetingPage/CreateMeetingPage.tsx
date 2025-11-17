/**
 * Dashboard page to create or join a meeting.
 * GUI-only for Sprint 1. Later it should call backend / Firestore
 * to create meetings and join existing ones.
 *
 * @returns {JSX.Element} Main meeting hub with create/join forms and a mock call area.
 */
import './CreateMeetingPage.scss';
import { useToast } from '../../components/layout/ToastProvider';

/**
 * React component that acts as the meetings dashboard.
 * Lets the user simulate creating or joining a meeting and shows demo toasts.
 *
 * @returns {JSX.Element} Layout with create/join meeting forms and helper text.
 */
export function CreateMeetingPage(): JSX.Element {
  const { showToast } = useToast();

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card meeting-card"
          aria-labelledby="meeting-dashboard-title"
        >
          <header className="dashboard-main-header meeting-header">
            <div>
              <h1 id="meeting-dashboard-title">¡Bienvenido, Usuario!</h1>
              <p>Inicia o únete a una videoconferencia.</p>
            </div>
          </header>

          {/* Create / Join row */}
          <div className="meeting-actions-row">
            {/* Create meeting column */}
            <section
              className="meeting-column"
              aria-labelledby="create-meeting-title"
            >
              <h2 id="create-meeting-title" className="meeting-column-title">
                + Crear nueva reunión
              </h2>
              <p className="meeting-column-subtitle">
                Inicia una reunión instantánea e invita participantes.
              </p>

              <form
                className="meeting-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  /**
                   * TODO (logic sprint):
                   * - Read meeting name from the form.
                   * - Call backend / Firestore to create a meeting.
                   * - Show generated meeting ID / link below.
                   */
                  console.log('TODO: create meeting');
                  showToast(
                    'Demo: aquí se creará la reunión cuando el backend esté conectado.',
                    'success'
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="meetingName">
                    Nombre de la reunión
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon" aria-hidden="true">
                      🎥
                    </span>
                    <input
                      className="form-input"
                      id="meetingName"
                      name="meetingName"
                      type="text"
                      placeholder="ej. Reunión de equipo"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-dark meeting-primary">
                  Crear reunión
                </button>
              </form>
            </section>

            {/* Join meeting column */}
            <section
              className="meeting-column"
              aria-labelledby="join-meeting-title"
            >
              <h2 id="join-meeting-title" className="meeting-column-title">
                → Unirse a reunión
              </h2>
              <p className="meeting-column-subtitle">
                Ingresa un ID de reunión para unirte a una sesión existente.
              </p>

              <form
                className="meeting-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  /**
                   * TODO (logic sprint):
                   * - Read meeting ID from the form.
                   * - Validate format (2–10 participants limit later).
                   * - Navigate to the meeting room / join via WebRTC layer.
                   */
                  console.log('TODO: join meeting');
                  showToast(
                    'Demo: aquí te unirás a una reunión existente cuando la lógica esté implementada.',
                    'info'
                  );
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="meetingId">
                    ID de la reunión
                  </label>
                  <div className="field-wrapper">
                    <span className="field-icon" aria-hidden="true">
                      🔑
                    </span>
                    <input
                      className="form-input"
                      id="meetingId"
                      name="meetingId"
                      type="text"
                      placeholder="ej. ABC123xyz9"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn meeting-secondary">
                  → Unirse a reunión
                </button>
              </form>
            </section>
          </div>

          {/* Quick guide row */}
          <section
            className="quick-guide"
            aria-label="Guía rápida para usar las reuniones"
          >
            <h2 className="quick-guide-title">Guía rápida</h2>

            <div className="quick-guide-steps">
              <article className="quick-step">
                <span className="quick-step-badge">1</span>
                <h3>Crear o unirse</h3>
                <p>
                  Inicia una nueva reunión o únete usando un ID de reunión
                  compartido contigo.
                </p>
              </article>

              <article className="quick-step">
                <span className="quick-step-badge">2</span>
                <h3>Compartir ID de reunión</h3>
                <p>
                  Comparte el ID de reunión con los participantes para que
                  puedan unirse.
                </p>
              </article>

              <article className="quick-step">
                <span className="quick-step-badge">3</span>
                <h3>Comenzar a colaborar</h3>
                <p>
                  Usa video, audio y chat para comunicarte y trabajar con tu
                  equipo.
                </p>
              </article>
            </div>
          </section>
        </section>

        {/* Meeting mock area – purely visual in Sprint 1 */}
        <section
          className="meeting-mock"
          aria-label="Vista previa de la sala de videoconferencia"
        >
          {/* TODO (WebRTC sprint):
           * - Replace this mock layout with the real video grid + chat.
           * - Integrate Socket.io + PeerJS + STUN/TURN here.
           */}
          <div className="meeting-mock-top">
            <span className="meeting-mock-title">Reunión: 5B123xyz</span>
            <span className="meeting-mock-chat-label">Chat</span>
          </div>

          <div className="meeting-mock-body">
            <div className="meeting-mock-main-video">
              <div className="meeting-mock-avatar">US</div>
              <span className="meeting-mock-username">Usuario</span>
              <span className="meeting-mock-status">Cámara apagada</span>
            </div>

            <div className="meeting-mock-side-video">
              <span>Esperando participantes</span>
            </div>

            <aside className="meeting-mock-chat">
              <p>No hay mensajes todavía. ¡Inicia la conversación!</p>
            </aside>
          </div>

          <div className="meeting-mock-toolbar">
            <button type="button" className="mock-btn">
              🎙️
            </button>
            <button type="button" className="mock-btn">
              🎥
            </button>
            <button type="button" className="mock-btn">
              🖥️
            </button>
            <button type="button" className="mock-btn mock-btn-leave">
              Salir
            </button>
          </div>

          <div className="meeting-mock-chat-input">
            <span>Escribe un mensaje…</span>
          </div>
        </section>
      </div>
    </div>
  );
}
