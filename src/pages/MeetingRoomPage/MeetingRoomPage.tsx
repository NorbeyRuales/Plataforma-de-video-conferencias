/**
 * Meeting room view.
 * Connects to the unified Socket.IO backend for WebRTC signaling,
 * in-room chat, and media state sync.
 */
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  VideoOff as VideoOffIcon,
} from 'lucide-react';
import '../CreateMeetingPage/CreateMeetingPage.scss';
import { getMeeting, getProfile, Meeting, UserProfile } from '../../services/api';
import { getAuthToken, setAuthToken } from '../../services/authToken';
import {
  cleanupAllPeers,
  createAndSendOffer,
  handleIncomingAnswer,
  handleIncomingCandidate,
  handleIncomingOffer,
  ensurePeerConnection,
  PeerMap,
  closePeer,
  MediaElementsMap,
} from '../../services/videoRtc';
import {
  connectVideoSocket,
  disconnectVideoSocket,
  joinVideoRoom,
  leaveVideoRoom,
  onVideoChatMessage,
  onVideoConnect,
  onVideoDisconnect,
  onVideoError,
  onVideoMediaState,
  onVideoMediaStates,
  onVideoRoomError,
  onVideoRoomFull,
  onVideoRoomJoined,
  onVideoScreenShare,
  onVideoSignal,
  onVideoUserJoined,
  onVideoUserLeft,
  sendVideoChatMessage,
  sendVideoMediaState,
  sendVideoScreenShare,
  videoSocket,
  videoSocketUrl,
  VideoParticipant,
  MediaState,
} from '../../services/videoSocket';

type RemoteTileProps = {
  participant: VideoParticipant;
  mediaState?: MediaState;
  stream?: MediaStream;
  remoteMediasRef: React.MutableRefObject<MediaElementsMap>;
  renderMediaIcons: (videoEnabled: boolean, audioEnabled: boolean) => React.ReactNode;
};

const RemoteTile = memo(function RemoteTile({
  participant,
  mediaState,
  stream,
  remoteMediasRef,
  renderMediaIcons,
}: RemoteTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const name = participant.displayName || 'Invitado';
  const initial = name.charAt(0).toUpperCase() || '?';
  const videoOn = mediaState?.videoEnabled !== false && Boolean(stream);
  const audioOn = mediaState?.audioEnabled !== false;

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream && videoOn) {
      remoteMediasRef.current[participant.socketId] = el;
      el.srcObject = stream;
      el.muted = false;
      el.playsInline = true;
      el.autoplay = true;
      el.play().catch(() => undefined);
    }
  }, [stream, videoOn, participant.socketId]);

  return (
    <div
      className="meeting-participant-tile"
      aria-label={`Participante ${name}`}
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0b1b3a, #0e1830)',
        borderRadius: '16px',
      }}
    >
      {videoOn && (
        <video
          className="meeting-participant-video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '16px',
            backgroundColor: '#0b1b3a',
          }}
          ref={videoRef}
          muted={false}
          playsInline
          autoPlay
        />
      )}
      {!videoOn && (
        <div
          className="meeting-participant-avatar"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #b3a4ff 0%, #6b7bff 100%)',
            borderRadius: '18px',
            boxShadow: '0 15px 40px rgba(66, 100, 255, 0.35)',
            color: '#0d1117',
            fontSize: '2rem',
            fontWeight: 800,
            width: '72px',
            height: '72px',
            margin: 'auto',
            zIndex: 2,
          }}
        >
          {initial}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)',
          color: '#fff',
        }}
      >
        <div>
          <span className="meeting-participant-name" style={{ display: 'block', fontWeight: 700 }}>
            {name}
          </span>
          <span className="meeting-participant-status" style={{ display: 'block', fontSize: '0.9rem' }}>
            En la reunión
          </span>
        </div>
        {renderMediaIcons(videoOn, audioOn)}
      </div>
    </div>
  );
});

type LocalTileProps = {
  localUserName: string;
  participantsLength: number;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  localVideoRef: React.MutableRefObject<HTMLVideoElement | null>;
  localVideoEnabled: boolean;
  isMuted: boolean;
  renderMediaIcons: (videoEnabled: boolean, audioEnabled: boolean) => React.ReactNode;
  stream: MediaStream | null;
};

const LocalTile = memo(function LocalTile({
  localUserName,
  participantsLength,
  localStreamRef,
  localVideoRef,
  localVideoEnabled,
  isMuted,
  renderMediaIcons,
  stream,
}: LocalTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      el.srcObject = stream;
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
      el.play().catch(() => undefined);
      if (localVideoRef) localVideoRef.current = el;
    }
  }, [stream, localVideoEnabled]);

  return (
    <div
      className="meeting-participant-tile meeting-participant-tile--self"
      aria-label="Tu vista propia"
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0b1b3a, #0e1830)',
        borderRadius: '16px',
      }}
    >
      {stream && localVideoEnabled ? (
        <video
          className="meeting-participant-video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '16px',
            backgroundColor: '#0b1b3a',
            transform: 'scaleX(-1)', // espejo para vista propia
          }}
          ref={videoRef}
          muted
          playsInline
          autoPlay
        />
      ) : (
        <div
          className="meeting-participant-avatar"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #b3a4ff 0%, #6b7bff 100%)',
            borderRadius: '18px',
            boxShadow: '0 15px 40px rgba(66, 100, 255, 0.35)',
            color: '#0d1117',
            fontSize: '2rem',
            fontWeight: 800,
            width: '72px',
            height: '72px',
            margin: 'auto',
            zIndex: 2,
          }}
        >
          {(localUserName || 'T').charAt(0).toUpperCase()}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.45) 100%)',
          color: '#fff',
        }}
      >
        <div>
          <span className="meeting-participant-name" style={{ display: 'block', fontWeight: 700 }}>
            {localUserName}
          </span>
          <span className="meeting-participant-status" style={{ display: 'block', fontSize: '0.9rem' }}>
            {participantsLength ? 'Conectado' : 'Solo tú en la reunión'}
          </span>
        </div>
        {renderMediaIcons(localVideoEnabled, !isMuted)}
      </div>
    </div>
  );
});

type SidePanelType = 'participants' | 'chat' | 'more' | null;
type ChatMessage = {
  userId: string;
  message: string;
  timestamp: string;
};

export default function MeetingRoomPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { meetingId: routeMeetingId } = useParams();
  const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);
  const authToken = getAuthToken();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SidePanelType>(null);
  const [participants, setParticipants] = useState<VideoParticipant[]>([]);
  const [mediaStates, setMediaStates] = useState<Record<string, MediaState>>({});
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [chatError, setChatError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [roomFull, setRoomFull] = useState(false);
  const [isVoiceReady, setIsVoiceReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [localStreamVersion, setLocalStreamVersion] = useState(0);
  const [copied, setCopied] = useState(false);

  const peersRef = useRef<PeerMap>({});
  const remoteMediasRef = useRef<MediaElementsMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const chatStatusRef = useRef<typeof chatStatus>('idle');
  const voiceConnectedRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!authToken) {
      navigate('/login', {
        replace: true,
        state: { from: `${location.pathname}${location.search}` },
      });
    }
  }, [authToken, navigate, location]);

  const playRemoteStream = (remoteId: string, stream: MediaStream) => {
    setRemoteStreams((prev) => ({ ...prev, [remoteId]: stream }));

    // Small delay to ensure the video element exists before attaching the stream.
    setTimeout(() => {
      const mediaEl = remoteMediasRef.current[remoteId];
      if (mediaEl) {
        mediaEl.srcObject = stream;
        mediaEl.muted = false;
        mediaEl
          .play()
          .then(() => setAudioUnlocked(true))
          .catch((e) => console.warn("Autoplay prevented", e));
      }
    }, 100);
  };

  const startOfferTo = async (remoteSocketId: string) => {
    if (!meetingId) return;
    if (!remoteSocketId || !videoSocket.id) return;
    if (!localStreamRef.current || !voiceConnectedRef.current) return;
    if (peersRef.current[remoteSocketId]) return;
    try {
      await createAndSendOffer(
        meetingId,
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
    const targetEnabled = !nextMuted; // enable audio tracks only when not muted
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = targetEnabled;
      });
    }
    setIsMuted(nextMuted);
    if (meetingId && voiceConnectedRef.current) {
      sendVideoMediaState({
        roomId: meetingId,
        audioEnabled: targetEnabled,
      });
    }
    if (nextMuted) {
      setIsSpeaking(false);
    }
  };

  const handleToggleVideo = () => {
    const nextOff = !isVideoOff;
    const targetEnabled = !nextOff;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = targetEnabled;
      });
    }
    setIsVideoOff(nextOff);
    setLocalStreamVersion((v) => v + 1);
    if (meetingId && voiceConnectedRef.current) {
      sendVideoMediaState({
        roomId: meetingId,
        videoEnabled: targetEnabled,
      });
    }
  };

  const handleUnlockAudio = async () => {
    const medias = Object.values(remoteMediasRef.current);
    await Promise.all(
      medias.map((media) =>
        media
          .play()
          .then(() => undefined)
          .catch(() => undefined)
      )
    );
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => undefined);
    }
    setAudioUnlocked(true);
  };

  const handleTogglePanel = (panel: Exclude<SidePanelType, null>): void => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  /**
   * Cleanly leaves the meeting: closes sockets/peers, stops local tracks,
   * tries to close the tab (if script-opened) and falls back to navigation.
   */
  const handleLeaveMeeting = () => {
    leaveVideoRoom(meetingId);
    disconnectVideoSocket();
    cleanupAllPeers(peersRef.current, remoteMediasRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setRemoteStreams({});
    setMediaStates({});
    setParticipants([]);
    setActivePanel(null);

    // Try to close the current tab (works if it was opened by script).
    window.close();

    // Fallback: navigate away to avoid lingering in the room UI.
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
      .catch((err: any) => {
        const message =
          err?.message || 'No se pudo cargar la reunión o el perfil.';
        if (String(message).includes('401')) {
          setAuthToken(null);
          navigate('/login', {
            replace: true,
            state: { from: `${location.pathname}${location.search}` },
          });
          return;
        }
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, [meetingId, navigate, location]);

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
    setVoiceError(null);
    chatStatusRef.current = 'connecting';
    voiceConnectedRef.current = false;

    const handleConnect = () => {
      setChatStatus('connected');
      chatStatusRef.current = 'connected';
      voiceConnectedRef.current = true;
      joinVideoRoom(meetingId, {
        userId: profile.id,
        displayName: localUserName,
        photoURL: undefined,
      });
    };

    const stopRoomJoined = onVideoRoomJoined(({ existingUsers }) => {
      setParticipants(existingUsers);
      existingUsers.forEach(({ socketId }) =>
        ensurePeerConnection(meetingId, socketId, peersRef.current, localStreamRef.current, playRemoteStream)
      );
    });

    const stopUserJoined = onVideoUserJoined((data) =>
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== data.socketId);
        const next = [...filtered, data];
        ensurePeerConnection(meetingId, data.socketId, peersRef.current, localStreamRef.current, playRemoteStream);
        return next;
      })
    );

    const stopUserLeft = onVideoUserLeft((socketId) =>
      setParticipants((prev) => {
        closePeer(socketId, peersRef.current, remoteMediasRef.current);
        setMediaStates((states) => {
          const copy = { ...states };
          delete copy[socketId];
          return copy;
        });
        setRemoteStreams((prevStreams) => {
          const next = { ...prevStreams };
          delete next[socketId];
          return next;
        });
        return prev.filter((p) => p.socketId !== socketId);
      })
    );

    const stopMediaStates = onVideoMediaStates((states) => {
      const mapped = Object.fromEntries(
        Object.entries(states).map(([socketId, state]) => [
          socketId,
          { ...state, socketId },
        ])
      );
      setMediaStates(mapped);
    });
    const stopMediaState = onVideoMediaState((state) =>
      state.socketId
        ? setMediaStates((prev) => ({ ...prev, [state.socketId!]: state }))
        : undefined
    );

    const stopSignal = onVideoSignal(async ({ from, signal, roomId }) => {
      const targetRoomId = roomId || meetingId;
      if (!signal || !targetRoomId) return;
      if (signal.type === 'offer') {
        await handleIncomingOffer(
          targetRoomId,
          from,
          signal.sdp,
          peersRef.current,
          localStreamRef.current,
          playRemoteStream
        );
      } else if (signal.type === 'answer') {
        await handleIncomingAnswer(from, signal.sdp, peersRef.current);
      } else if (signal.type === 'candidate') {
        await handleIncomingCandidate(from, signal.candidate, peersRef.current);
      }
    });

    const stopChat = onVideoChatMessage((msg) =>
      setChatMessages((prev) => [...prev, msg])
    );

    const stopScreenShare = onVideoScreenShare(() => {
      /* TODO: reflect screen-share state in UI when design is ready */
    });

    const stopRoomFull = onVideoRoomFull(() => {
      setRoomFull(true);
      setChatStatus('error');
      setVoiceError('La sala está llena (máx. 10).');
      chatStatusRef.current = 'error';
      disconnectVideoSocket();
    });

    const stopRoomError = onVideoRoomError((message) => {
      setChatStatus('error');
      chatStatusRef.current = 'error';
      setChatError(message);
    });

    const stopConnect = onVideoConnect(handleConnect);
    const stopError = onVideoError((err: any) => {
      console.error('Socket video error', err);
      setChatStatus('error');
      chatStatusRef.current = 'error';
      setChatError('No se pudo conectar al servidor de video.');
      voiceConnectedRef.current = false;
    });
    const stopDisconnect = onVideoDisconnect(() => {
      voiceConnectedRef.current = false;
      setChatStatus((current) => (current === 'error' ? 'error' : 'idle'));
      setParticipants([]);
      setMediaStates({});
      setRemoteStreams({});
      cleanupAllPeers(peersRef.current, remoteMediasRef.current);
    });

    connectVideoSocket();

    return () => {
      stopRoomJoined();
      stopUserJoined();
      stopUserLeft();
      stopMediaStates();
      stopMediaState();
      stopSignal();
      stopChat();
      stopScreenShare();
      stopRoomFull();
      stopRoomError();
      stopConnect();
      stopError();
      stopDisconnect();
      leaveVideoRoom(meetingId);
      disconnectVideoSocket();
      setChatMessages([]);
      setChatStatus('idle');
      setParticipants([]);
      setMediaStates({});
      setRemoteStreams({});
      cleanupAllPeers(peersRef.current, remoteMediasRef.current);
    };
  }, [meetingId, profile, localUserName]);

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!chatInput.trim() || !meetingId || !profile || chatStatus !== 'connected' || roomFull) {
      return;
    }
    sendVideoChatMessage({
      roomId: meetingId,
      userId: profile.id,
      message: chatInput.trim(),
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
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setVoiceError(null);
        Object.keys(peersRef.current).forEach((socketId) => {
          ensurePeerConnection(meetingId, socketId, peersRef.current, stream, playRemoteStream);
        });
        setIsVoiceReady(true);
        if (meetingId) {
          sendVideoMediaState({
            roomId: meetingId,
            audioEnabled: true,
            videoEnabled: true,
          });
        }
        setLocalStreamVersion((v) => v + 1);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => undefined);
        }
        // Voice level meter
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.85; // more sensitive to subtle variations
        // Buffer to capture audio samples
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
          // Low threshold to catch soft speech / whispers
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
      cleanupAllPeers(peersRef.current, remoteMediasRef.current);
    };
  }, [meetingId, profile]);
  const title = meeting?.title || 'Reunión';
  const code = meetingId || meeting?.id || 'sin-id';
  const description = meeting?.description || 'Vista de la llamada en una pestaña dedicada.';
  const handleCopyMeetingId = () => {
    if (!code) return;
    navigator.clipboard
      ?.writeText(code)
      .then(() => setCopied(true))
      .catch(() => setCopied(false));
  };
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timeout);
  }, [copied]);
  const chatDisabled = chatStatus !== 'connected' || roomFull;
  const chatStatusLabel =
    chatStatus === 'connected'
      ? 'Chat en vivo conectado.'
      : chatStatus === 'connecting'
      ? 'Conectando al chat...'
      : chatError || 'Chat desconectado.';
  const chatStatusTone =
    chatStatus === 'connected' ? 'ok' : chatStatus === 'connecting' ? 'pending' : 'error';

  const getDisplayName = (userId: string): string => {
    if (profile?.id === userId) return localUserName;
    const participant = participants.find((p) => p.userId === userId);
    return participant?.displayName || 'Invitado';
  };

  const isInitiator = (remoteSocketId: string) => {
    const selfId = videoSocket.id ?? '';
    if (!selfId || !remoteSocketId) return false;
    return selfId < remoteSocketId;
  };

  const renderMediaIcons = useCallback(
    (videoEnabled: boolean, audioEnabled: boolean) => (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(9,15,33,0.65)',
          padding: '4px 8px',
          borderRadius: 999,
        }}
      >
        {videoEnabled ? <VideoIcon size={16} /> : <VideoOffIcon size={16} />}
        {audioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
      </span>
    ),
    []
  );

  const localVideoEnabled = (() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    return tracks.some((t) => t.enabled);
  })();



  return (
    <div
      className="dashboard-wrapper meeting-fullscreen"
      onClick={() => {
        if (!audioUnlocked) handleUnlockAudio();
      }}
    >
      <div className="container">
        <section
          className="meeting-mock"
          aria-label="Vista previa de la sala de videoconferencia"
        >
          <div className="meeting-mock-top">
            <div className="meeting-mock-stage">
              <div className="meeting-main">
                {participants.map((participant) => (
                  <RemoteTile
                    key={participant.socketId}
                    participant={participant}
                    mediaState={mediaStates[participant.socketId]}
                    stream={remoteStreams[participant.socketId]}
                    remoteMediasRef={remoteMediasRef}
                    renderMediaIcons={renderMediaIcons}
                  />
                ))}

                <LocalTile
                  localUserName={localUserName}
                  participantsLength={participants.length}
                  localStreamRef={localStreamRef}
                  localVideoRef={localVideoRef}
                  localVideoEnabled={localVideoEnabled}
                  isMuted={isMuted}
                  renderMediaIcons={renderMediaIcons}
                  stream={localStreamRef.current}
                />
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
                          {participants.map(({ socketId, displayName }) => (
                            <li key={socketId}>
                              <strong>{displayName || 'Invitado'}</strong>
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
                            chatMessages.map((msg, index) => {
                              const author = getDisplayName(msg.userId);
                              const isSelf = msg.userId === profile?.id;
                              return (
                                <div
                                  key={`${msg.timestamp}-${index}`}
                                  className={`meeting-chat-message${isSelf ? ' meeting-chat-message--self' : ''}`}
                                >
                                  {!isSelf && (
                                    <div className="meeting-chat-avatar">
                                      {(author || '?').charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <div className="meeting-chat-bubble">
                                    <div className="meeting-chat-message-header">
                                      <strong>{author}</strong>
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
                              );
                            })
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
                              className={`meeting-info-copy${copied ? ' meeting-info-copy--copied' : ''}`}
                              onClick={handleCopyMeetingId}
                              aria-label="Copiar ID de la reunión"
                            >
                              {copied ? '¡Copiado!' : 'Copiar'}
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
                onClick={handleToggleVideo}
              >
                {isVideoOff ? <VideoOffIcon size={18} /> : <VideoIcon size={18} />}
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


