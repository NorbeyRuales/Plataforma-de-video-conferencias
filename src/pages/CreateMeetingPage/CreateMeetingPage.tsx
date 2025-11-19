/**
 * Dashboard page to create or join a meeting.
 * GUI-only for now. Later this page should connect to backend / WebRTC.
 */
import { useState } from 'react';
import {
  Captions,
  Hand,
  Hash,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
  PencilLine,
  PhoneOff,
  ScreenShare,
  Users,
  Video as VideoIcon,
} from 'lucide-react';
import './CreateMeetingPage.scss';
import { useToast } from '../../components/layout/ToastProvider';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

/**
 * React component that acts as the meetings dashboard.
 * Lets the user simulate creating or joining a meeting and shows demo toasts.
 *
 * @returns {JSX.Element} Layout with create/join meeting forms and helper text.
 */
export function CreateMeetingPage(): JSX.Element {
  const { showToast } = useToast();

  const [meetingName, setMeetingName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);

  const isCreateValid = meetingName.trim().length > 0;
  const isJoinValid = meetingId.trim().length > 0;

  const handleTogglePanel = (panel: Exclude<SidePanelType, null>): void => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const sidePanelTitle =
    activePanel === 'participants'
      ? 'Personas'
      : activePanel === 'chat'
      ? 'Mensajes de la llamada'
      : activePanel === 'more'
      ? 'Más opciones'
      : '';

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <section
          className="dashboard-card meeting-card"
          aria-labelledby="meeting-dashboard-title"
        >
          <header className="dashboard-main-header meeting-header">
            <div>
              <h1 id="meeting-dashboard-title">Bienvenido, Usuario</h1>
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
                      <PencilLine size={16} />
                    </span>
                    <input
                      className="form-input"
                      id="meetingName"
                      name="meetingName"
                      type="text"
                      placeholder="ej. Reunión de equipo"
                      required
                      value={meetingName}
                      onChange={(event) => setMeetingName(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-dark meeting-primary"
                  disabled={!isCreateValid}
                >
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
                Unirse a reunión
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
                   * - Validate format.
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
                      <Hash size={16} />
                    </span>
                    <input
                      className="form-input"
                      id="meetingId"
                      name="meetingId"
                      type="text"
                      placeholder="ej. abc-defg-hij"
                      required
                      value={meetingId}
                      onChange={(event) => setMeetingId(event.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn meeting-secondary"
                  disabled={!isJoinValid}
                >
                  Unirse a reunión
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

        {/* Meeting mock area — purely visual in this phase */}
        <section
          className="meeting-mock"
          aria-label="Vista previa de la sala de videoconferencia"
        >
          <div className="meeting-mock-top">
            <div className="meeting-mock-stage">
              <div
                className={`meeting-main${
                  activePanel ? ' meeting-main--with-panel' : ''
                }`}
              >
                <div className="meeting-main-video" aria-label="Video principal">
                  <div className="meeting-main-avatar">A</div>
                  <span className="meeting-main-name">Alejo</span>
                  <span
                    className="meeting-main-mic"
                    aria-label="Micrófono silenciado"
                  >
                    <MicOff size={16} />
                  </span>
                </div>

                <div className="meeting-self-tile" aria-label="Tu vista propia">
                  <div className="meeting-self-avatar" />
                  <div className="meeting-self-footer">
                    <span className="meeting-self-name">Norvey Ruales</span>
                    <span
                      className="meeting-self-mic"
                      aria-label="Micrófono silenciado"
                    >
                      <MicOff size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side panel */}
            <aside
              className={`meeting-sidepanel${
                activePanel
                  ? ' meeting-sidepanel--visible'
                  : ' meeting-sidepanel--hidden'
              }`}
              aria-hidden={!activePanel}
            >
              {activePanel && (
                <>
                  <header className="meeting-sidepanel-header">
                    <h3>{sidePanelTitle}</h3>
                    <button
                      type="button"
                      className="meeting-sidepanel-close"
                      aria-label="Cerrar panel"
                      onClick={() => setActivePanel(null)}
                    >
                      ×
                    </button>
                  </header>

                  <div className="meeting-sidepanel-body">
                    {activePanel === 'participants' && (
                      <>
                        <p>
                          Aquí aparecerá la lista de personas en la llamada con
                          opciones para fijar, silenciar o expulsar
                          participantes.
                        </p>
                        <ul>
                          <li>Ana Rodríguez — micrófono activo</li>
                          <li>Juan Carlos — micrófono silenciado</li>
                          <li>Tú — organizador</li>
                        </ul>
                      </>
                    )}

                    {activePanel === 'chat' && (
                      <>
                        <div className="meeting-chat-toggle">
                          Permitir que los participantes envíen mensajes
                        </div>
                        <div className="meeting-chat-info">
                          El chat continuo está desactivado en esta vista de
                          demostración. Más adelante aquí verás los mensajes en
                          tiempo real de la reunión.
                        </div>
                      </>
                    )}

                    {activePanel === 'more' && (
                      <>
                        <p>
                          Vista previa de opciones adicionales que podría tener
                          la reunión:
                        </p>
                        <ul>
                          <li>Cambiar diseño de la llamada</li>
                          <li>Configuración de cámara y micrófono</li>
                          <li>Activar fondos virtuales y efectos</li>
                          <li>Opciones futuras como grabación o transmisión</li>
                        </ul>
                      </>
                    )}
                  </div>

                  {activePanel === 'chat' && (
                    <footer className="meeting-sidepanel-footer">
                      <input
                        className="meeting-sidepanel-input"
                        type="text"
                        placeholder="Envía un mensaje"
                        disabled
                      />
                    </footer>
                  )}
                </>
              )}
            </aside>
          </div>

          <div className="meeting-mock-bottom">
            <div
              className="meeting-mock-meeting-code"
              aria-label="Nombre de la reunión"
            >
              a-z123
            </div>

            <div
              className="meeting-mock-toolbar"
              aria-label="Controles de la reunión"
            >
              <button
                type="button"
                className="mock-btn"
                aria-label="Activar o desactivar el micrófono"
              >
                <Mic size={18} />
              </button>
              <button
                type="button"
                className="mock-btn"
                aria-label="Activar o desactivar la cámara"
              >
                <VideoIcon size={18} />
              </button>
              <button
                type="button"
                className="mock-btn"
                aria-label="Activar o desactivar subtítulos"
              >
                <Captions size={18} />
              </button>
              <button
                type="button"
                className="mock-btn"
                aria-label="Levantar la mano"
              >
                <Hand size={18} />
              </button>
              <button
                type="button"
                className="mock-btn"
                aria-label="Compartir tu pantalla o pestaña"
              >
                <ScreenShare size={18} />
              </button>
              <button
                type="button"
                className="mock-btn mock-btn-leave"
                aria-label="Salir de la reunión"
              >
                <PhoneOff size={18} />
              </button>
            </div>

            <div
              className="meeting-mock-right-actions"
              aria-label="Más opciones y participantes"
            >
              <button
                type="button"
                className="mock-icon-btn"
                aria-label="Abrir panel de personas"
                onClick={() => handleTogglePanel('participants')}
              >
                <Users size={18} />
              </button>
              <button
                type="button"
                className="mock-icon-btn"
                aria-label="Abrir chat de la reunión"
                onClick={() => handleTogglePanel('chat')}
              >
                <MessageCircle size={18} />
              </button>
              <button
                type="button"
                className="mock-icon-btn"
                aria-label="Más opciones de la reunión"
                onClick={() => handleTogglePanel('more')}
              >
                <MoreVertical size={18} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

