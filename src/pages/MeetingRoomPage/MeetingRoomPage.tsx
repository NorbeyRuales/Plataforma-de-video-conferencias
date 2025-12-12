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
  addLocalTracksAndRenegotiate,
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
  isSpeaking?: boolean;
};

const RemoteTile = memo(function RemoteTile({
  participant,
  mediaState,
  stream,
  remoteMediasRef,
  renderMediaIcons,
  isSpeaking = false,
}: RemoteTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const name = participant.displayName || 'Invitado';
  const initial = name.charAt(0).toUpperCase() || '?';
  const hasVideoTrack = Boolean(stream?.getVideoTracks().some((t) => t.enabled));
  const videoOn = hasVideoTrack && mediaState?.videoEnabled !== false;
  const audioOn = mediaState?.audioEnabled !== false;
  const showSpeaking = isSpeaking && !videoOn;

  // Separate audio element for reliable audio playback
  useEffect(() => {
    if (!stream) return;
    
    // Create a dedicated audio element for this participant
    let audioEl = audioRef.current;
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = `remote-audio-${participant.socketId}`;
      audioEl.autoplay = true;
      // Hidden audio elements don't need to be in DOM but we add for debugging
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      audioRef.current = audioEl;
    }
    
    // Assign stream to audio element
    audioEl.srcObject = stream;
    audioEl.muted = false;
    audioEl.volume = 1.0;
    
    // Store in ref map for unlocking
    remoteMediasRef.current[`audio-${participant.socketId}`] = audioEl;
    
    const playAudio = () => {
      audioEl!.play()
        .then(() => console.log(`[RemoteTile] Audio playing for ${participant.socketId}`))
        .catch((e) => {
          console.warn(`[RemoteTile] Audio autoplay blocked for ${participant.socketId}`, e);
        });
    };
    
    playAudio();
    
    // Also try on any user interaction
    const retryPlay = () => playAudio();
    document.addEventListener('click', retryPlay, { once: true });
    document.addEventListener('keydown', retryPlay, { once: true });
    
    return () => {
      document.removeEventListener('click', retryPlay);
      document.removeEventListener('keydown', retryPlay);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.srcObject = null;
        audioRef.current.remove();
        audioRef.current = null;
      }
      delete remoteMediasRef.current[`audio-${participant.socketId}`];
    };
  }, [stream, participant.socketId, remoteMediasRef]);

  // Video element (muted - audio comes from separate element)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    remoteMediasRef.current[participant.socketId] = el;
    if (stream) {
      el.srcObject = stream;
      // Video element is MUTED - audio comes from the separate audio element
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
      el.play().catch(() => undefined);
    } else {
      el.srcObject = null;
    }

    return () => {
      if (remoteMediasRef.current[participant.socketId] === el) {
        delete remoteMediasRef.current[participant.socketId];
      }
    };
  }, [stream, participant.socketId, remoteMediasRef]);

  return (
    <div
      className={`meeting-participant-tile${showSpeaking ? ' meeting-participant-tile--speaking' : ''}`}
      aria-label={`Participante ${name}`}
      style={{
        position: 'relative',
        aspectRatio: '16/9',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0b1b3a, #0e1830)',
        borderRadius: '16px',
      }}
    >
      {stream && (
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
            // Keep the element alive for audio playback; just hide the picture.
            opacity: videoOn ? 1 : 0,
            pointerEvents: 'none',
          }}
          ref={videoRef}
          muted={false}
          playsInline
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
  isSpeaking?: boolean;
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
  isSpeaking = false,
}: LocalTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const showSpeaking = isSpeaking && !localVideoEnabled;

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
      className={`meeting-participant-tile meeting-participant-tile--self${
        showSpeaking ? ' meeting-participant-tile--speaking' : ''
      }`}
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
            transform: 'scaleX(-1)', // mirror for self-view
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
  const [isMuted, setIsMuted] = useState(true); // Start muted by default
  const [isVideoOff, setIsVideoOff] = useState(true); // Start with video off by default
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMap, setSpeakingMap] = useState<Record<string, boolean>>({});
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
  const remoteAudioAnalyzersRef = useRef<
    Record<
      string,
      {
        analyser: AnalyserNode;
        source: MediaStreamAudioSourceNode;
        dataArray: Uint8Array<ArrayBuffer>;
        rafId: number | null;
      }
    >
  >({});
  const sharedAudioContextRef = useRef<AudioContext | null>(null);
  const hasUserGestureRef = useRef(false);
  const pendingLocalMeterRef = useRef(false);

  const ensureSharedAudioContext = (): AudioContext | null => {
    // Creating/resuming AudioContext without a user gesture triggers Chrome autoplay warnings.
    if (!hasUserGestureRef.current) return null;
    if (!sharedAudioContextRef.current) {
      sharedAudioContextRef.current = new AudioContext();
    }
    if (sharedAudioContextRef.current.state === 'suspended') {
      sharedAudioContextRef.current.resume().catch(() => undefined);
    }
    return sharedAudioContextRef.current;
  };

  const setupLocalVoiceMeter = useCallback(
    (stream: MediaStream) => {
      if (analyserRef.current || sourceRef.current || levelRafRef.current) return;
      const ctx = ensureSharedAudioContext();
      if (!ctx) {
        pendingLocalMeterRef.current = true;
        return;
      }

      pendingLocalMeterRef.current = false;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;
      const dataArray: Uint8Array<ArrayBuffer> = new Uint8Array(
        analyser.frequencyBinCount
      ) as Uint8Array<ArrayBuffer>;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
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
        const speakingNow = maxDeviation > 4 && !isMuted;
        setIsSpeaking(speakingNow);
        levelRafRef.current = requestAnimationFrame(tick);
      };
      levelRafRef.current = requestAnimationFrame(tick);
    },
    [ensureSharedAudioContext, isMuted]
  );

  useEffect(() => {
    if (!authToken) {
      navigate('/login', {
        replace: true,
        state: { from: `${location.pathname}${location.search}` },
      });
    }
  }, [authToken, navigate, location]);

  useEffect(() => {
    const unlock = () => {
      if (hasUserGestureRef.current) return; // Only run once
      hasUserGestureRef.current = true;
      console.log('[MeetingRoom] User gesture detected, unlocking audio...');
      // Try to unlock media playback + audio contexts on the first real gesture.
      handleUnlockAudio().catch(() => undefined);
    };
    
    // Listen to multiple events to catch any user interaction
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => {
      window.addEventListener(event, unlock, { once: true, passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, unlock);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playRemoteStream = (remoteId: string, stream: MediaStream) => {
    console.log(`[MeetingRoom] Playing remote stream from ${remoteId}, tracks:`, stream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    
    setRemoteStreams((prev) => {
      return { ...prev, [remoteId]: stream };
    });

    // The RemoteTile component will handle creating/attaching the audio element
    // Just mark gesture as received if we got here from user action
    if (hasUserGestureRef.current) {
      // Try to unlock any pending audio
      setTimeout(() => handleUnlockAudio(), 100);
    }
  };

  /**
   * Attempts to start an offer to a remote peer.
   * Now works even without localStream - remote peer can still send us their media.
   * When localStream becomes available later, tracks will be added via ensurePeerConnection.
   */
  const startOfferTo = async (remoteSocketId: string) => {
    if (!meetingId) return;
    if (!remoteSocketId || !videoSocket.id) return;
    if (!voiceConnectedRef.current) return;
    // Allow creating peer connection even without local stream.
    // This ensures we can receive remote media even if camera/mic fails.
    if (peersRef.current[remoteSocketId]) {
      // Peer exists; ensure tracks are added if we now have a local stream
      if (localStreamRef.current) {
        ensurePeerConnection(
          meetingId,
          remoteSocketId,
          peersRef.current,
          localStreamRef.current,
          playRemoteStream
        );
      }
      return;
    }
    try {
      await createAndSendOffer(
        meetingId,
        remoteSocketId,
        peersRef.current,
        localStreamRef.current, // Can be null - will still create peer for receiving
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
    // Unlock remote audio when user interacts with mic button
    handleUnlockAudio();
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
    // Use the camera toggle gesture as an audio/autoplay unlock
    handleUnlockAudio();
  };

  const handleUnlockAudio = async () => {
    console.log('[MeetingRoom] Unlocking audio...');
    hasUserGestureRef.current = true;
    
    // Resume audio contexts
    const sharedCtx = ensureSharedAudioContext();
    if (sharedCtx && sharedCtx.state === 'suspended') {
      await sharedCtx.resume().catch(() => undefined);
    }
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume().catch(() => undefined);
    }
    
    // Find all audio elements (both in ref map and created dynamically)
    const allAudioElements = document.querySelectorAll('audio[id^="remote-audio-"]');
    console.log(`[MeetingRoom] Found ${allAudioElements.length} remote audio elements`);
    
    for (const audioEl of allAudioElements) {
      try {
        const audio = audioEl as HTMLAudioElement;
        audio.muted = false;
        audio.volume = 1.0;
        await audio.play();
        console.log(`[MeetingRoom] Audio element ${audio.id} now playing`);
      } catch (e) {
        console.warn('[MeetingRoom] Failed to play audio element', e);
      }
    }
    
    // Also try media elements from ref
    const medias = Object.values(remoteMediasRef.current);
    console.log(`[MeetingRoom] Unlocking ${medias.length} remote media refs`);
    
    for (const media of medias) {
      try {
        // Only unmute audio elements, video stays muted
        if (media instanceof HTMLAudioElement) {
          media.muted = false;
          media.volume = 1.0;
        }
        await media.play();
      } catch (e) {
        // Silently continue
      }
    }
    
    setAudioUnlocked(true);
    console.log('[MeetingRoom] Audio unlocked');
  };

  // Whenever remote streams change and user has already interacted, try to unmute them
  useEffect(() => {
    if (!hasUserGestureRef.current) return;
    
    const streamIds = Object.keys(remoteStreams);
    if (streamIds.length === 0) return;
    
    console.log(`[MeetingRoom] Remote streams changed, attempting to unmute ${streamIds.length} streams`);
    
    // Give a small delay for the audio elements to be attached
    const timer = setTimeout(() => {
      // Try to play all audio elements
      const allAudioElements = document.querySelectorAll('audio[id^="remote-audio-"]');
      allAudioElements.forEach((audioEl) => {
        const audio = audioEl as HTMLAudioElement;
        if (audio.paused || audio.muted) {
          console.log(`[MeetingRoom] Attempting to play audio: ${audio.id}`);
          audio.muted = false;
          audio.volume = 1.0;
          audio.play().catch(() => undefined);
        }
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [remoteStreams]);

  // If the local meter was skipped because there was no user gesture yet,
  // retry it right after audio gets unlocked.
  useEffect(() => {
    if (!audioUnlocked) return;
    if (!pendingLocalMeterRef.current) return;
    const stream = localStreamRef.current;
    if (!stream) return;
    setupLocalVoiceMeter(stream);
  }, [audioUnlocked, setupLocalVoiceMeter]);

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
      existingUsers.forEach(({ socketId }) => {
        ensurePeerConnection(meetingId, socketId, peersRef.current, localStreamRef.current, playRemoteStream);
        // Start offer to existing users (we are the newcomer)
        // Use setTimeout to ensure peer connection is fully set up
        setTimeout(() => {
          if (voiceConnectedRef.current) {
            startOfferTo(socketId);
          }
        }, 100);
      });
    });

    const stopUserJoined = onVideoUserJoined((data) =>
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.socketId !== data.socketId);
        const next = [...filtered, data];
        ensurePeerConnection(meetingId, data.socketId, peersRef.current, localStreamRef.current, playRemoteStream);
        // When a new user joins, initiate offer if we should be the initiator
        // (based on socket ID comparison for consistent polite/impolite roles)
        const selfId = videoSocket.id ?? '';
        const shouldInitiate = selfId && selfId < data.socketId;
        if (shouldInitiate && voiceConnectedRef.current) {
          setTimeout(() => startOfferTo(data.socketId), 100);
        }
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
    const analyzers = remoteAudioAnalyzersRef.current;

    const sharedCtx = ensureSharedAudioContext();
    // Don't create/attach analysers until the user has interacted.
    if (!sharedCtx) return;

    // Create analysers for new streams (only when they include audio)
    Object.entries(remoteStreams).forEach(([socketId, stream]) => {
      const hasAudioTrack = Boolean(stream?.getAudioTracks().length);
      if (!stream || analyzers[socketId] || !hasAudioTrack) return;
      try {
        const analyser = sharedCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.75;
        const dataArray = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
        const source = sharedCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        if (sharedCtx.state === 'suspended') {
          sharedCtx.resume().catch(() => undefined);
        }

        const tick = () => {
          const entry = analyzers[socketId];
          if (!entry) return;
          entry.analyser.getByteTimeDomainData(entry.dataArray);
          const audioEnabled = stream.getAudioTracks().some((t) => t.enabled);
          if (!audioEnabled) {
            setSpeakingMap((prev) => {
              if (!prev[socketId]) return prev;
              const next = { ...prev };
              delete next[socketId];
              return next;
            });
            entry.rafId = requestAnimationFrame(tick);
            return;
          }
          let maxDeviation = 0;
          for (let i = 0; i < entry.dataArray.length; i++) {
            const deviation = Math.abs(entry.dataArray[i] - 128);
            if (deviation > maxDeviation) maxDeviation = deviation;
          }
          const speakingNow = maxDeviation > 4;
          setSpeakingMap((prev) => {
            const current = Boolean(prev[socketId]);
            if (current === speakingNow) return prev;
            return { ...prev, [socketId]: speakingNow };
          });
          entry.rafId = requestAnimationFrame(tick);
        };

        analyzers[socketId] = {
          analyser,
          source,
          dataArray,
          rafId: requestAnimationFrame(tick),
        };
      } catch (err) {
        console.warn('No se pudo crear el analizador de audio remoto', err);
      }
    });

    // Clean up analysers for removed streams
    Object.keys(analyzers).forEach((socketId) => {
      if (remoteStreams[socketId]) return;
      const entry = analyzers[socketId];
      if (entry?.rafId) cancelAnimationFrame(entry.rafId);
      try {
        entry?.source.disconnect();
        entry?.analyser.disconnect();
      } catch (err) {
        console.warn('Error al limpiar analizador de audio remoto', err);
      }
      delete analyzers[socketId];
      setSpeakingMap((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    return () => {
      Object.values(analyzers).forEach((entry) => {
        if (entry?.rafId) cancelAnimationFrame(entry.rafId);
        try {
          entry.source.disconnect();
          entry.analyser.disconnect();
        } catch {
          /* ignore */
        }
      });
      remoteAudioAnalyzersRef.current = {};
    };
  }, [remoteStreams, audioUnlocked]);

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
        
        // Start with audio and video tracks DISABLED (user must enable them)
        stream.getAudioTracks().forEach((track) => {
          track.enabled = false;
          console.log('[MeetingRoom] Audio track disabled by default');
        });
        stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
          console.log('[MeetingRoom] Video track disabled by default');
        });
        
        // Add tracks to existing peers and trigger renegotiation
        // This ensures audio/video is sent to peers that connected before media was ready
        const peerIds = Object.keys(peersRef.current);
        for (const socketId of peerIds) {
          try {
            await addLocalTracksAndRenegotiate(meetingId, socketId, peersRef.current, stream);
          } catch (err) {
            console.warn(`[MeetingRoom] Failed to add tracks to peer ${socketId}`, err);
          }
        }
        
        setIsVoiceReady(true);
        // Send initial state as disabled (matching isMuted=true, isVideoOff=true)
        if (meetingId) {
          sendVideoMediaState({
            roomId: meetingId,
            audioEnabled: false,
            videoEnabled: false,
          });
        }
        setLocalStreamVersion((v) => v + 1);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => undefined);
        }
        // Voice level meter (may be deferred until the first user gesture)
        setupLocalVoiceMeter(stream);
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
                    isSpeaking={Boolean(speakingMap[participant.socketId])}
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
                  isSpeaking={isSpeaking}
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


