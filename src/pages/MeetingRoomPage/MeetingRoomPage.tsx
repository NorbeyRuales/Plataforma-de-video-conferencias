/**
 * Vista dedicada para la sala de reunión.
 * Ahora conecta contra el backend de chat (Socket.IO) para participantes
 * y mensajes en vivo usando la lógica de /eisc-chat/api/index.ts.
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
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
  Send,
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
  onRoomFull,
  onSocketConnect,
  onSocketDisconnect,
  onSocketError,
  sendChatMessage,
} from '../../services/chatSocket';
import {
  AudioElementsMap,
  cleanupAllPeers,
  createAndSendOffer,
  handleIncomingAnswer,
  handleIncomingCandidate,
  handleIncomingOffer,
  PeerMap,
  closePeer,
} from '../../services/voiceRtc';
import {
  connectVoiceSocket,
  disconnectVoiceSocket,
  joinVoiceRoom,
  onVoiceConnect,
  onVoiceDisconnect,
  onVoiceError,
  onVoiceExistingUsers,
  onVoiceWebrtcOffer,
  onVoiceWebrtcAnswer,
  onVoiceWebrtcCandidate,
  onVoiceRoomFull,
  onVoiceUserJoined,
  onVoiceUserLeft,
  sendVoiceMediaToggle,
  voiceSocket,
  VoiceParticipant,
} from '../../services/voiceSocket';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

export default function MeetingRoomPage(): JSX.Element {
  const { meetingId: routeMeetingId } = useParams();
  const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [chatError, setChatError] = useState<string | null>(null);
  const [roomFull, setRoomFull] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const peersRef = useRef<PeerMap>({});
  const remoteAudiosRef = useRef<AudioElementsMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatStatusRef = useRef<typeof chatStatus>('idle');
  const voiceConnectedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Corrección del error de 'playsInline':
  const playRemoteStream = (remoteId: string, stream: MediaStream) => {
    let audio = remoteAudiosRef.current[remoteId];
    if (!audio) {
      audio = new Audio();
      audio.autoplay = true;
      // Eliminada la propiedad 'playsInline' porque no es válida para HTMLAudioElement
      remoteAudiosRef.current[remoteId] = audio;
      console.log('🔊[audio] Nuevo elemento de audio creado para', remoteId);
    }
    audio.srcObject = stream;
    audio.muted = false;
    audio.volume = 1;
    console.log('🔊[audio] Reproduciendo stream remoto de', remoteId, 'tracks:', stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    audio.play()
      .then(() => console.log('✅[audio] Audio iniciado correctamente para', remoteId))
      .catch((err) => {
        console.error('❌[audio] Error al reproducir audio de', remoteId, err);
        // Reintentar después de un breve delay
        setTimeout(() => audio.play().catch(console.error), 1000);
      });
  };

  const startOfferTo = async (remoteSocketId: string) => {
    if (!remoteSocketId || remoteSocketId === voiceSocket.id) {
      console.log('⏭️[webrtc] Omitiendo oferta a', remoteSocketId, '(mismo socket o inválido)');
      return;
    }
    if (!localStreamRef.current || !voiceConnectedRef.current) {
      console.log('⏳[webrtc] No se puede iniciar oferta: stream o conexión no lista');
      return;
    }
    
    // Desempate: solo el socket con ID menor inicia para evitar colisiones
    if (voiceSocket.id && voiceSocket.id > remoteSocketId) {
      console.log('⏭️[webrtc] Desempate: esperando que', remoteSocketId, 'inicie la oferta');
      return;
    }

    const existingPc = peersRef.current[remoteSocketId];
    if (existingPc) {
      const hasAudioSender = existingPc
        .getSenders()
        .some((s) => s.track?.kind === "audio");
      if (hasAudioSender) {
        console.log('✅[webrtc] Ya existe conexión con audio para', remoteSocketId);
        return;
      }
      console.log('🔄[webrtc] Renegociando para agregar audio a', remoteSocketId);
    }
    
    try {
      console.log('📤[webrtc] Iniciando oferta a', remoteSocketId);
      await createAndSendOffer(
        remoteSocketId,
        peersRef.current,
        localStreamRef.current,
        playRemoteStream
      );
      console.log('✅[webrtc] Oferta enviada exitosamente a', remoteSocketId);
    } catch (err) {
      console.error('❌[webrtc] Error al iniciar oferta con', remoteSocketId, err);
      // Reintentar después de 2 segundos
      setTimeout(() => startOfferTo(remoteSocketId), 2000);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    const targetEnabled = !nextMuted; // audio habilitado cuando no está en mute
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = targetEnabled;
      });
    }
    setIsMuted(nextMuted);
    if (meetingId && voiceConnectedRef.current) {
      sendVoiceMediaToggle({
        roomId: meetingId,
        type: 'audio',
        enabled: targetEnabled,
      });
    }
    if (nextMuted) {
      setIsSpeaking(false);
    }
  };

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
    chatStatusRef.current = 'connecting';

    const handleConnect = () => {
      setChatStatus('connected');
      chatStatusRef.current = 'connected';
      joinRoom(meetingId, {
        userId: profile.id,
        displayName: localUserName,
        photoURL: undefined,
      });
    };

    const handleConnectError = (err: any) => {
      console.error('Socket connect error', err);
      setChatStatus('error');
      chatStatusRef.current = 'error';
      setChatError('No se pudo conectar al chat en tiempo real.');
    };

    const handleDisconnect = () =>
      setChatStatus((current) => {
        const next = current === 'error' ? 'error' : 'idle';
        chatStatusRef.current = next;
        return next;
      });

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
      stopChat();
      stopRoomFull();
      stopConnect();
      stopError();
      stopDisconnect();
      disconnectSocket();
      setChatMessages([]);
      setChatStatus('idle');
    };
  }, [meetingId, profile, localUserName]);

  useEffect(() => {
    if (!meetingId || !profile) return;

    setVoiceError(null);
    voiceConnectedRef.current = false;
    setIsSpeaking(false);

    const handleConnect = () => {
      voiceConnectedRef.current = true;
      joinVoiceRoom(meetingId, {
        userId: profile.id,
        displayName: localUserName,
        photoURL: undefined,
      });
    };

    const handleDisconnect = () => {
      voiceConnectedRef.current = false;
    };

    const handleError = (err: any) => {
      console.error('Socket voz error', err);
      setVoiceError('No se pudo conectar a la señalización de voz.');
      voiceConnectedRef.current = false;
    };

    const stopExisting = onVoiceExistingUsers((users) => {
      console.log('👥[voice] Usuarios existentes recibidos:', users.length);
      setParticipants(users);
      // Iniciar ofertas con un pequeño delay para asegurar que el stream local esté listo
      setTimeout(() => {
        users.forEach(({ socketId }) => startOfferTo(socketId));
      }, 500);
    });

    const stopJoined = onVoiceUserJoined((data) => {
      console.log('👤[voice] Nuevo usuario unido:', data.userInfo.displayName, data.socketId);
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== data.socketId);
        return [...filtered, data];
      });
      // Iniciar oferta con delay para el nuevo usuario
      setTimeout(() => startOfferTo(data.socketId), 500);
    });

    const stopLeft = onVoiceUserLeft((data) =>
      setParticipants((prev) => {
        closePeer(data.socketId, peersRef.current, remoteAudiosRef.current);
        return prev.filter((p) => p.socketId !== data.socketId);
      })
    );

    const stopRoomFull = onVoiceRoomFull(() => {
      setRoomFull(true);
      setVoiceError('La sala de voz está llena (máx. 10).');
      disconnectVoiceSocket();
    });

    const stopConnect = onVoiceConnect(handleConnect);
    const stopDisconnect = onVoiceDisconnect(handleDisconnect);
    const stopError = onVoiceError(handleError);

    connectVoiceSocket();

    return () => {
      stopExisting();
      stopJoined();
      stopLeft();
      stopRoomFull();
      stopConnect();
      stopDisconnect();
      stopError();
      disconnectVoiceSocket();
      voiceConnectedRef.current = false;
      setIsSpeaking(false);
      setParticipants([]);
      cleanupAllPeers(peersRef.current, remoteAudiosRef.current);
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

  useEffect(() => {
    chatStatusRef.current = chatStatus;
  }, [chatStatus]);

  // Corrección del error de tipo 'Uint8Array<ArrayBufferLike>' sin cambiar la funcionalidad:
  const handleAudioBuffer = (buffer: ArrayBufferLike): Uint8Array => {
    if (buffer instanceof SharedArrayBuffer) {
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(arrayBuffer).set(new Uint8Array(buffer));
      return new Uint8Array(arrayBuffer);
    }
    return new Uint8Array(buffer as ArrayBuffer);
  };

  useEffect(() => {
    if (!meetingId) return;
    const stopOffer = onVoiceWebrtcOffer(async ({ from, offer }) => {
      await handleIncomingOffer(from, offer, peersRef.current, localStreamRef.current, playRemoteStream);
    });
    const stopAnswer = onVoiceWebrtcAnswer(async ({ from, answer }) => {
      await handleIncomingAnswer(from, answer, peersRef.current);
    });
    const stopCandidate = onVoiceWebrtcCandidate(async ({ from, candidate }) => {
      await handleIncomingCandidate(from, candidate, peersRef.current);
    });

    return () => {
      stopOffer();
      stopAnswer();
      stopCandidate();
    };
  }, [meetingId]);

  useEffect(() => {
    if (!isVoiceReady || !localStreamRef.current) return;
    participants.forEach(({ socketId }) => startOfferTo(socketId));
  }, [isVoiceReady, participants]);

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
            {voiceError && (
              <p className="form-hint form-hint-error">
                {voiceError}
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
                        <div
                          className={`meeting-chat-info meeting-chat-info--${
                            chatStatus === 'connected'
                              ? 'ok'
                              : chatStatus === 'connecting'
                              ? 'pending'
                              : 'error'
                          }`}
                        >
                          <span className="meeting-chat-dot" aria-hidden />
                          <span>
                            {chatStatus === 'connected'
                              ? 'Chat en vivo conectado.'
                              : chatStatus === 'connecting'
                              ? 'Conectando al chat...'
                              : chatError || 'Chat desconectado.'}
                          </span>
                        </div>
                        <div
                          className="meeting-chat-messages"
                          role="log"
                          aria-live="polite"
                        >
                          {chatMessages.length === 0 ? (
                            <p className="field-help">Aún no hay mensajes.</p>
                          ) : (
                            chatMessages.map((msg, index) => {
                              const isSelf = msg.userName === localUserName;
                              const initial =
                                (msg.userName?.trim()?.[0] || '?').toUpperCase();
                              return (
                                <div
                                  key={`${msg.timestamp}-${index}`}
                                  className={`meeting-chat-message${
                                    isSelf ? ' meeting-chat-message--self' : ''
                                  }`}
                                >
                                  {!isSelf && (
                                    <div
                                      className="meeting-chat-avatar"
                                      aria-hidden
                                    >
                                      {initial}
                                    </div>
                                  )}
                                  <div className="meeting-chat-bubble">
                                    <div className="meeting-chat-message-header">
                                      <strong>{msg.userName}</strong>
                                      <span className="meeting-chat-time">
                                        {new Date(msg.timestamp).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <div className="meeting-chat-message-body">
                                      {msg.message}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
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
                          className="mock-btn meeting-chat-send"
                          disabled={chatDisabled || !chatInput.trim()}
                          aria-label="Enviar mensaje"
                        >
                          <Send size={28} />
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
                className={`mock-btn${!isMuted ? ' mock-btn-mic-on' : ''}${isSpeaking && !isMuted ? ' mock-btn-speaking' : ''}`}
                aria-label="Activar o desactivar el micrófono"
                onClick={handleToggleMute}
              >
                {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
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
