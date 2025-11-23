/**
 * Vista dedicada para la sala de reunión (mock visual).
 * Se abre en una pestaña nueva desde "Unirse a reunión" y reutiliza
 * el mismo layout de la maqueta existente.
 */
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Captions,
  Hand,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
  PhoneOff,
  ScreenShare,
  Users,
  Video as VideoIcon,
} from 'lucide-react';
import '../CreateMeetingPage/CreateMeetingPage.scss';
import { getMeeting, Meeting } from '../../services/api';
import { getAuthToken } from '../../services/authToken';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

export default function MeetingRoomPage(): JSX.Element {
  const { meetingId: routeMeetingId } = useParams();
  const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);

  const handleTogglePanel = (panel: Exclude<SidePanelType, null>): void => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  useEffect(() => {
    if (!meetingId) return;
    const token = getAuthToken();
    if (!token) {
      setError('Inicia sesión para cargar los detalles de la reunión.');
      return;
    }

    setIsLoading(true);
    setError(null);
    getMeeting(meetingId)
      .then((data) => setMeeting(data))
      .catch((err: any) =>
        setError(err?.message || 'No se pudo cargar la reunión.')
      )
      .finally(() => setIsLoading(false));
  }, [meetingId]);

  const title = meeting?.title || 'Reunión';
  const code = meetingId || meeting?.id || 'sin-id';

  return (
    <div className="dashboard-wrapper">
      <div className="container">
        <header className="dashboard-main-header meeting-header">
          <div>
            <h1>Sala de reunión</h1>
            <p>Vista de la llamada en una pestaña dedicada.</p>
            <p className="field-help">ID: {code}</p>
            {isLoading && <p className="field-help">Cargando reunión...</p>}
            {error && <p className="form-hint form-hint-error">{error}</p>}
          </div>
        </header>

        <section
          className="meeting-mock"
          aria-label="Vista previa de la sala de videoconferencia"
        >
          <div className="meeting-mock-top">
            <div className="meeting-mock-stage">
              <div className="meeting-main">
                <div className="meeting-main-video" aria-label="Video principal">
                  <div className="meeting-main-avatar">A</div>
                  <span className="meeting-main-name">{title}</span>
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
                    <span className="meeting-self-name">Tú</span>
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
                    <h3>
                      {activePanel === 'participants'
                        ? 'Personas'
                        : activePanel === 'chat'
                        ? 'Mensajes de la llamada'
                        : 'Más opciones'}
                    </h3>
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
                        <p>Lista de participantes (demo):</p>
                        <ul>
                          <li>Tú — organizador</li>
                          <li>Ana Rodríguez — micrófono activo</li>
                          <li>Juan Carlos — micrófono silenciado</li>
                        </ul>
                      </>
                    )}
                    {activePanel === 'chat' && (
                      <>
                        <p>El chat en vivo llegará aquí.</p>
                        <div className="meeting-chat-info">
                          Vista previa: mensajes en tiempo real de la reunión.
                        </div>
                      </>
                    )}
                    {activePanel === 'more' && (
                      <>
                        <p>Opciones adicionales:</p>
                        <ul>
                          <li>Configurar cámara/micrófono</li>
                          <li>Cambiar diseño de la llamada</li>
                          <li>Activar fondos virtuales</li>
                          <li>Próximamente: grabación / transmisión</li>
                        </ul>
                      </>
                    )}
                  </div>
                  {activePanel === 'chat' && (
                    <footer className="meeting-sidepanel-footer">
                      <input
                        className="meeting-sidepanel-input"
                        type="text"
                        placeholder="Enviar mensaje (demo)"
                        disabled
                      />
                    </footer>
                  )}
                </>
              )}
            </aside>
          </div>

          <div className="meeting-mock-bottom">
            <div className="meeting-mock-meeting-code" aria-label="Nombre de la reunión">
              {code}
            </div>

            <div className="meeting-mock-toolbar" aria-label="Controles de la reunión">
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
