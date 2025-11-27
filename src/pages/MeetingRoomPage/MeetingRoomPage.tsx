/**
 * Vista dedicada para la sala de reunión.
 * Ahora conecta contra el backend de chat (Socket.IO) para participantes
 * y mensajes en vivo usando la lógica de /eisc-chat/api/index.ts.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { getMeeting, getProfile, Meeting, UserProfile } from '../../services/api';
import { getAuthToken } from '../../services/authToken';
import {
  ChatMessagePayload,
  ChatParticipant,
  connectSocket,
  disconnectSocket,
  joinRoom,
  onChatMessage,
  onExistingUsers,
  onRoomFull,
  onSocketConnect,
  onSocketDisconnect,
  onSocketError,
  onUserJoined,
  onUserLeft,
  sendChatMessage,
} from '../../services/chatSocket';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

export default function MeetingRoomPage(): JSX.Element {
  const { meetingId: routeMeetingId } = useParams();
  const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [chatError, setChatError] = useState<string | null>(null);
  const [roomFull, setRoomFull] = useState(false);

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
    Promise.all([getMeeting(meetingId), getProfile()])
      .then(([meetingData, userProfile]) => {
        setMeeting(meetingData);
        setProfile(userProfile);
      })
      .catch((err: any) =>
        setError(err?.message || 'No se pudo cargar la reunión o el perfil.')
      )
      .finally(() => setIsLoading(false));
  }, [meetingId]);

  const localUserName = useMemo(() => {
    if (!profile) return 'Invitado';
    const compactName = `${profile.username ?? ''} ${profile.lastname ?? ''}`.trim();
    return compactName || profile.email || 'Invitado';
  }, [profile]);

  useEffect(() => {
    if (!meetingId || !profile) return;

    setChatStatus('connecting');
    setChatError(null);
    setRoomFull(false);

    const handleConnect = () => {
      setChatStatus('connected');
      joinRoom(meetingId, {
        userId: profile.id,
        displayName: localUserName,
        photoURL: undefined,
      });
    };

    const handleConnectError = (err: any) => {
      console.error('Socket connect error', err);
      setChatStatus('error');
      setChatError('No se pudo conectar al chat en tiempo real.');
    };

    const handleDisconnect = () =>
      setChatStatus((current) => (current === 'error' ? 'error' : 'idle'));

    const stopExisting = onExistingUsers((users) => setParticipants(users));
    const stopJoined = onUserJoined((data) =>
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== data.socketId);
        return [...filtered, data];
      })
    );
    const stopLeft = onUserLeft((data) =>
      setParticipants((prev) =>
        prev.filter((p) => p.socketId !== data.socketId)
      )
    );
    const stopChat = onChatMessage((msg) =>
      setChatMessages((prev) => [...prev, msg])
    );
    const stopRoomFull = onRoomFull(() => {
      setRoomFull(true);
      setChatStatus('error');
      setChatError('La sala está llena (máx. 10 participantes).');
      disconnectSocket();
    });

    const stopConnect = onSocketConnect(handleConnect);
    const stopError = onSocketError(handleConnectError);
    const stopDisconnect = onSocketDisconnect(handleDisconnect);

    connectSocket();

    return () => {
      stopExisting();
      stopJoined();
      stopLeft();
      stopChat();
      stopRoomFull();
      stopConnect();
      stopError();
      stopDisconnect();
      disconnectSocket();
      setParticipants([]);
      setChatMessages([]);
      setChatStatus('idle');
    };
  }, [meetingId, profile, localUserName]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim() || !meetingId || !profile || chatStatus !== 'connected' || roomFull) {
      return;
    }
    sendChatMessage({
      roomId: meetingId,
      userName: localUserName,
      message: chatInput.trim(),
      timestamp: Date.now(),
    });
    setChatInput('');
  };

  const title = meeting?.title || 'Reunión';
  const code = meetingId || meeting?.id || 'sin-id';
  const chatDisabled = chatStatus !== 'connected' || roomFull;

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
            {chatStatus === 'connecting' && (
              <p className="field-help">Conectando al chat en tiempo real...</p>
            )}
            {chatStatus === 'error' && (
              <p className="form-hint form-hint-error">
                {chatError ?? 'El chat no está disponible en este momento.'}
              </p>
            )}
            {roomFull && (
              <p className="form-hint form-hint-error">
                La sala está llena (máx. 10 participantes).
              </p>
            )}
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
                        <p>Personas en la sala</p>
                        <ul className="meeting-participant-list">
                          <li>
                            <strong>Tú</strong> — {localUserName}
                          </li>
                          {participants.map(({ socketId, userInfo }) => (
                            <li key={socketId}>
                              <strong>{userInfo.displayName || 'Invitado'}</strong>
                            </li>
                          ))}
                        </ul>
                        {!participants.length && (
                          <p className="field-help">Aún no hay más participantes conectados.</p>
                        )}
                        {roomFull && (
                          <p className="form-hint form-hint-error">
                            La sala está llena; intenta más tarde.
                          </p>
                        )}
                      </>
                    )}
                    {activePanel === 'chat' && (
                      <>
                        <div className="meeting-chat-info">
                          {chatStatus === 'connected'
                            ? 'Chat en vivo conectado.'
                            : chatStatus === 'connecting'
                            ? 'Conectando al chat...'
                            : chatError || 'Chat desconectado.'}
                        </div>
                        <div
                          className="meeting-chat-messages"
                          role="log"
                          aria-live="polite"
                        >
                          {chatMessages.length === 0 ? (
                            <p className="field-help">Aún no hay mensajes.</p>
                          ) : (
                            chatMessages.map((msg, index) => (
                              <div
                                key={`${msg.timestamp}-${index}`}
                                className="meeting-chat-message"
                              >
                                <div className="meeting-chat-message-header">
                                  <strong>{msg.userName}</strong>
                                  <span className="meeting-chat-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                                <div className="meeting-chat-message-body">{msg.message}</div>
                              </div>
                            ))
                          )}
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
                      <form className="meeting-chat-form" onSubmit={handleSendMessage}>
                        <input
                          className="meeting-sidepanel-input"
                          type="text"
                          placeholder={
                            chatDisabled
                              ? 'Conecta al chat para enviar mensajes'
                              : 'Escribe un mensaje'
                          }
                          value={chatInput}
                          onChange={(event) => setChatInput(event.target.value)}
                          disabled={chatDisabled}
                        />
                        <button
                          type="submit"
                          className="mock-btn"
                          disabled={chatDisabled || !chatInput.trim()}
                        >
                          Enviar
                        </button>
                      </form>
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
