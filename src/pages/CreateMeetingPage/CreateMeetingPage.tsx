/**
 * Dashboard page to create or join a meeting.
 * GUI-only for now. Later this page should connect to backend / WebRTC.
 */
import { useEffect, useState } from 'react';
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
import {
  createMeeting,
  getMeeting,
  listMeetings,
  Meeting,
  updateMeeting,
  deleteMeetingApi,
} from '../../services/api';
import { AUTH_TOKEN_EVENT, getAuthToken } from '../../services/authToken';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

/**
 * React component that acts as the meetings dashboard.
 * Lets the user simulate creating or joining a meeting and shows demo toasts.
 *
 * @returns {JSX.Element} Layout with create/join meeting forms and helper text.
 */
export function CreateMeetingPage(): JSX.Element {
  const { showToast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [authTokenState, setAuthTokenState] = useState(() => getAuthToken() ?? '');
  const [meetingName, setMeetingName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState('');
  const [createdMeeting, setCreatedMeeting] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);

  const isCreateValid =
    meetingName.trim().length > 0 &&
    date.trim().length > 0 &&
    time.trim().length > 0 &&
    Number(duration) > 0;
  const isJoinValid = meetingId.trim().length > 0;
  const isAuthenticated = Boolean(authTokenState.trim());

  const loadMeetings = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await listMeetings();
      setMeetings(data);
    } catch (error: any) {
      showToast(error.message ?? 'No se pudieron cargar las reuniones.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authTokenState.trim()) {
      void loadMeetings();
    } else {
      setMeetings([]);
    }
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

  const handleTogglePanel = (panel: Exclude<SidePanelType, null>): void => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const resetForm = () => {
    setMeetingName('');
    setDate(today);
    setTime('09:00');
    setDuration(30);
    setDescription('');
    setMeetingId('');
    setSelectedMeeting(null);
  };

  const handleCreateMeeting = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showToast('Inicia sesi?n para crear reuniones.', 'error');
      return;
    }
    if (!isCreateValid || isCreating) return;

    setIsCreating(true);
    try {
      const payload = {
        title: meetingName.trim(),
        date,
        time,
        duration: Number(duration),
        description: description.trim() || undefined,
      };
      if (editingId) {
        await updateMeeting(editingId, payload);
        showToast('Reuni?n actualizada correctamente.', 'success');
        setEditingId(null);
        setCreatedMeeting(null);
        resetForm();
      } else {
        const response = await createMeeting(payload);
        setCreatedMeeting(response.meeting);
        setMeetingId(response.meeting.id);
        showToast('Reuni?n creada correctamente.', 'success');
        resetForm();
      }
      await loadMeetings();
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo guardar la reuni?n.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

const handleEditMeeting = (meeting: Meeting) => {
    setEditingId(meeting.id);
    setMeetingName(meeting.title);
    setDate(meeting.date);
    setTime(meeting.time);
    setDuration(meeting.duration);
    setDescription(meeting.description ?? '');
    showToast('Editando reuni?n. Guarda los cambios.', 'info');
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!isAuthenticated) {
      showToast('Inicia sesi?n para eliminar reuniones.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await deleteMeetingApi(id);
      showToast('Reuni?n eliminada.', 'success');
      if (editingId === id) {
        setEditingId(null);
        setCreatedMeeting(null);
      }
      await loadMeetings();
    } catch (error: any) {
      showToast(error.message ?? 'No se pudo eliminar la reuni?n.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

const handleLookupMeeting = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!isAuthenticated) {
      showToast('Inicia sesión para consultar reuniones.', 'error');
      return;
    }
    if (!isJoinValid) return;

    setIsLoading(true);
    try {
      const meeting = await getMeeting(meetingId.trim());
      setSelectedMeeting(meeting);
      showToast('Reuni��n encontrada.', 'success');
    } catch (error: any) {
      setSelectedMeeting(null);
      showToast(error.message ?? 'No se pudo encontrar la reuni��n.', 'error');
    } finally {
      setIsLoading(false);
    }
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

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <span
              className={`badge ${isAuthenticated ? 'badge-success' : 'badge-warning'}`}
              aria-label="Estado de autenticacion"
            >
              {isAuthenticated ? 'Sesión activa' : 'Sin sesi?n'}
            </span>
            {!isAuthenticated && (
              <p className="field-help">
                Inicia sesi?n para crear, listar o consultar reuniones protegidas.
              </p>
            )}
          </div>

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

                            <form className="meeting-form" onSubmit={handleCreateMeeting}>
                <div className="form-group">
                  <label className="form-label" htmlFor="meetingName">
                    Nombre de la reunion
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
                      placeholder="ej. Reunion de equipo"
                      required
                      value={meetingName}
                      onChange={(event) => setMeetingName(event.target.value)}
                      disabled={!isAuthenticated || isCreating}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="date">Fecha</label>
                  <input
                    className="form-input"
                    id="date"
                    name="date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    disabled={!isAuthenticated || isCreating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="time">Hora</label>
                  <input
                    className="form-input"
                    id="time"
                    name="time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    disabled={!isAuthenticated || isCreating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="duration">Duracion (minutos)</label>
                  <input
                    className="form-input"
                    id="duration"
                    name="duration"
                    type="number"
                    min={5}
                    max={480}
                    step={5}
                    value={duration}
                    onChange={(event) => setDuration(Number(event.target.value))}
                    disabled={!isAuthenticated || isCreating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="description">Descripcion (opcional)</label>
                  <textarea
                    className="form-textarea"
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Agenda, temas, invitados..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    disabled={!isAuthenticated || isCreating}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-dark meeting-primary"
                  disabled={!isAuthenticated || !isCreateValid || isCreating}
                >
                  {isCreating ? 'Creando...' : 'Crear reunion'}
                </button>

                {!isAuthenticated && (
                  <p className="form-hint form-hint-error">
                    Inicia sesión para crear reuniones.
                  </p>
                )}
                {createdMeeting && (
                  <p className="form-hint form-hint-success">
                    Reunion creada. ID: {createdMeeting.id}
                  </p>
                )}
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

                            <form className="meeting-form" onSubmit={handleLookupMeeting}>
                <div className="form-group">
                  <label className="form-label" htmlFor="meetingId">
                    ID de la reunion
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
                      disabled={!isAuthenticated || isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn meeting-secondary"
                  disabled={!isAuthenticated || !isJoinValid || isLoading}
                >
                  {isLoading ? 'Buscando...' : 'Unirse a reunion'}
                </button>

                {selectedMeeting && (
                  <p className="form-hint form-hint-success">
                    Reunion encontrada: {selectedMeeting.title} ({selectedMeeting.id})
                  </p>
                )}
                {!isAuthenticated && (
                  <p className="form-hint form-hint-error">
                    Inicia sesión para consultar reuniones.
                  </p>
                )}
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

        {isAuthenticated ? (
          <section className="meeting-column" aria-label="Tus reuniones">
            <h2 className="meeting-column-title">Tus reuniones</h2>
            {isLoading ? (
              <p>Cargando reuniones...</p>
            ) : meetings.length === 0 ? (
              <p>Todavia no has creado reuniones.</p>
            ) : (
              <ul className="meeting-list-items">
                {meetings.map((meeting) => (
                  <li key={meeting.id} className="meeting-list-item">
                    <div className="meeting-list-main">
                      <div>
                        <strong>{meeting.title}</strong> - {meeting.date} {meeting.time} (ID: {meeting.id})
                        {editingId === meeting.id && (
                          <span className="badge badge-info" style={{ marginLeft: '8px' }}>
                            Editando
                          </span>
                        )}
                      </div>
                      <div className="meeting-list-actions">
                        <button
                          type="button"
                          className="btn btn-small"
                          onClick={() => handleEditMeeting(meeting)}
                          disabled={isLoading}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteMeeting(meeting.id)}
                          disabled={isLoading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <p className="form-hint form-hint-error">
            Inicia sesin para listar tus reuniones.
          </p>
        )}

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


