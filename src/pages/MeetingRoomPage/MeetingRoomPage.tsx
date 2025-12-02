/**
 * Vista dedicada para la sala de reunión.
 * Ahora conecta contra el backend de chat (Socket.IO) para participantes
 * y mensajes en vivo usando la lógica de /eisc-chat/api/index.ts.
 */
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Captions,
  Hand,
  MessageCircle,
  Mic,
  MicOff,
  MoreVertical,
  PhoneOff,
  Send,
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
  voiceSocketUrl,
  VoiceParticipant,
} from '../../services/voiceSocket';

type SidePanelType = 'participants' | 'chat' | 'more' | null;

export default function MeetingRoomPage(): JSX.Element {
  const navigate = useNavigate();
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
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const playRemoteStream = (remoteId: string, stream: MediaStream) => {
  console.log('[voice] playRemoteStream', remoteId, stream, 'tracks:', stream.getTracks());
  let audio = remoteAudiosRef.current[remoteId];
  if (!audio) {
    audio = new Audio();
    audio.autoplay = true;
    audio.setAttribute('playsinline', 'true');
    audio.preload = 'auto';
    remoteAudiosRef.current[remoteId] = audio;
  }
  audio.srcObject = stream;
  audio.muted = false;
  audio.volume = 1;

  const tryPlay = async (n = 0) => {
    try {
      await audio.play();
      console.log('[voice] Reproduciendo audio remoto', remoteId);
    } catch (err) {
      console.warn('[voice] play() falló, reintentando...', n, err);
      if (n < 3) setTimeout(() => tryPlay(n + 1), 500);
    }
  };

  tryPlay();
};


  const startOfferTo = async (remoteSocketId: string) => {
    if (!remoteSocketId || remoteSocketId === voiceSocket.id) return;
    if (!localStreamRef.current || !voiceConnectedRef.current) return;
    // Desempate simple: solo el socket con ID menor inicia la oferta para evitar glare.
    if (voiceSocket.id && voiceSocket.id > remoteSocketId) return;
    if (peersRef.current[remoteSocketId]) return;
    try {
      await createAndSendOffer(
        remoteSocketId,
        peersRef.current,
        localStreamRef.current,
        playRemoteStream
      );
    } catch (err) {
      console.error('No se pudo iniciar la oferta con', remoteSocketId, err);
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

  const handleLeaveMeeting = () => {
    // Limpia conexiones activas antes de salir.
    disconnectSocket();
    disconnectVoiceSocket();
    cleanupAllPeers(peersRef.current, remoteAudiosRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setParticipants([]);
    setActivePanel(null);

    // Intenta cerrar la pestaña actual (funciona si fue abierta por script).
    window.close();

    // Fallback: redirigir al panel para quitar header/footer y evitar quedar en la sala.
    navigate('/meetings/new', { replace: true });
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
      setVoiceError(null);
      voiceConnectedRef.current = true;
      joinVoiceRoom(meetingId, {
        userId: profile.id,
        displayName: localUserName,
        photoURL: undefined,
      });
    };

    const handleDisconnect = () => {
      voiceConnectedRef.current = false;
      cleanupAllPeers(peersRef.current, remoteAudiosRef.current);
      setParticipants([]);
      setIsSpeaking(false);
    };

    const handleError = (err: any) => {
      console.error('Socket voz error', err);
      setVoiceError(
        `No se pudo conectar a la señalización de voz (${voiceSocketUrl}). Reintentando...`
      );
      voiceConnectedRef.current = false;
    };

    const stopExisting = onVoiceExistingUsers((users) => {
      setParticipants(users);
      users.forEach(({ socketId }) => startOfferTo(socketId));
    });

    const stopJoined = onVoiceUserJoined((data) =>
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== data.socketId);
        return [...filtered, data];
      })
    );

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

  useEffect(() => {
    if (!meetingId || !profile) return;
    let cancelled = false;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setVoiceError(null);
        setIsVoiceReady(true);
        setIsMuted(false);
        // Configurar medidor de voz
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85; // más sensible a variaciones suaves
        // Buffer para capturar muestras de audio
        const dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(analyser.frequencyBinCount);
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
        sourceRef.current = source;

        const tick = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          const buffer = dataArrayRef.current;
          analyserRef.current.getByteTimeDomainData(buffer);
          let maxDeviation = 0;
          for (let i = 0; i < buffer.length; i++) {
            const deviation = Math.abs(buffer[i] - 128);
            if (deviation > maxDeviation) maxDeviation = deviation;
          }
          // Umbral bajo para captar voz suave / susurros
          const speakingNow = maxDeviation > 4 && !isMuted;
          setIsSpeaking(speakingNow);
          levelRafRef.current = requestAnimationFrame(tick);
        };
        levelRafRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        if (cancelled) return;
        setVoiceError('No se pudo acceder al micrófono. Revisa permisos o dispositivo.');
        setIsVoiceReady(false);
      }
    };

    startAudio();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (levelRafRef.current) {
        cancelAnimationFrame(levelRafRef.current);
        levelRafRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
        analyserRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      cleanupAllPeers(peersRef.current, remoteAudiosRef.current);
    };
  }, [meetingId, profile, chatStatus]);

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
  const description = meeting?.description || 'Vista de la llamada en una pestaña dedicada.';
  const handleCopyMeetingId = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => undefined);
  };
  const chatDisabled = chatStatus !== 'connected' || roomFull;
  const chatStatusLabel =
    chatStatus === 'connected'
      ? 'Chat en vivo conectado.'
      : chatStatus === 'connecting'
      ? 'Conectando al chat...'
      : chatError || 'Chat desconectado.';
  const chatStatusTone =
    chatStatus === 'connected' ? 'ok' : chatStatus === 'connecting' ? 'pending' : 'error';

  return (
    <div className="dashboard-wrapper meeting-fullscreen">
      <div className="container">
        <section
          className="meeting-mock"
          aria-label="Vista previa de la sala de videoconferencia"
        >
          <div className="meeting-mock-top">
            <div className="meeting-mock-stage">
              <div className="meeting-main">
                {participants.length === 0 && (
                  <div
                    className="meeting-participant-tile meeting-participant-tile--self"
                    aria-label="Tu vista propia"
                  >
                    <div className="meeting-participant-avatar">
                      {(localUserName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="meeting-participant-info">
                      <span className="meeting-participant-name">{localUserName}</span>
                      <span className="meeting-participant-status">Solo tú en la reunión</span>
                    </div>
                    <span
                      className="meeting-participant-mic"
                      aria-label={isMuted ? 'Micrófono silenciado' : 'Micrófono activo'}
                    >
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </span>
                  </div>
                )}

                {participants.map(({ socketId, userInfo }) => {
                  const name = userInfo.displayName || 'Invitado';
                  const initial = name.charAt(0).toUpperCase() || '?';
                  return (
                    <div
                      key={socketId}
                      className="meeting-participant-tile"
                      aria-label={`Participante ${name}`}
                    >
                      <div className="meeting-participant-avatar">{initial}</div>
                      <div className="meeting-participant-info">
                        <span className="meeting-participant-name">{name}</span>
                        <span className="meeting-participant-status">En la reunión</span>
                      </div>
                      <span className="meeting-participant-mic" aria-label="Micrófono de participante">
                        <MicOff size={16} />
                      </span>
                    </div>
                  );
                })}

                {participants.length > 0 && (
                  <div
                    className="meeting-participant-tile meeting-participant-tile--self"
                    aria-label="Tu vista propia"
                  >
                    <div className="meeting-participant-avatar">
                      {(localUserName || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="meeting-participant-info">
                      <span className="meeting-participant-name">Tú</span>
                      <span className="meeting-participant-status">Conectado</span>
                    </div>
                    <span
                      className="meeting-participant-mic"
                      aria-label={isMuted ? 'Micrófono silenciado' : 'Micrófono activo'}
                    >
                      {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                    </span>
                  </div>
                )}
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
                        <div className={`meeting-chat-info meeting-chat-info--${chatStatusTone}`}>
                          <span className="meeting-chat-dot" />
                          <span>{chatStatusLabel}</span>
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
                                className={`meeting-chat-message${
                                  msg.userName === localUserName
                                    ? ' meeting-chat-message--self'
                                    : ''
                                }`}
                              >
                                {msg.userName !== localUserName && (
                                  <div className="meeting-chat-avatar">
                                    {(msg.userName || '?').charAt(0).toUpperCase()}
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
                                  <div className="meeting-chat-message-body">{msg.message}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                    {activePanel === 'more' && (
                      <>
                        <div className="meeting-info-block">
                          <p className="meeting-info-title">{title}</p>
                          <p className="meeting-info-desc">{description}</p>
                          <div className="meeting-info-id">
                            <span className="meeting-info-id-label">ID de la reunión:</span>
                            <span className="meeting-info-id-value">{code}</span>
                            <button
                              type="button"
                              className="meeting-info-copy"
                              onClick={handleCopyMeetingId}
                              aria-label="Copiar ID de la reunión"
                            >
                              Copiar
                            </button>
                          </div>
                        </div>

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
                        >
                          <Send size={18} />
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
                onClick={handleLeaveMeeting}
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
