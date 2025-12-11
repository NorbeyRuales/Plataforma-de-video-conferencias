import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Meeting room view.
 * Connects to the unified Socket.IO backend for WebRTC signaling,
 * in-room chat, and media state sync.
 */
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Captions, Hand, MessageCircle, Mic, MicOff, MoreVertical, PhoneOff, Send, ScreenShare, Users, Video as VideoIcon, VideoOff as VideoOffIcon, } from 'lucide-react';
import '../CreateMeetingPage/CreateMeetingPage.scss';
import { getMeeting, getProfile } from '../../services/api';
import { getAuthToken, setAuthToken } from '../../services/authToken';
import { cleanupAllPeers, createAndSendOffer, handleIncomingAnswer, handleIncomingCandidate, handleIncomingOffer, ensurePeerConnection, closePeer, } from '../../services/videoRtc';
import { connectVideoSocket, disconnectVideoSocket, joinVideoRoom, leaveVideoRoom, onVideoChatMessage, onVideoConnect, onVideoDisconnect, onVideoError, onVideoMediaState, onVideoMediaStates, onVideoRoomError, onVideoRoomFull, onVideoRoomJoined, onVideoScreenShare, onVideoSignal, onVideoUserJoined, onVideoUserLeft, sendVideoChatMessage, sendVideoMediaState, videoSocket, } from '../../services/videoSocket';
const RemoteTile = memo(function RemoteTile({ participant, mediaState, stream, remoteMediasRef, renderMediaIcons, isSpeaking = false, }) {
    const videoRef = useRef(null);
    const name = participant.displayName || 'Invitado';
    const initial = name.charAt(0).toUpperCase() || '?';
    const hasVideoTrack = Boolean(stream?.getVideoTracks().some((t) => t.enabled));
    const videoOn = hasVideoTrack && mediaState?.videoEnabled !== false;
    const audioOn = mediaState?.audioEnabled !== false;
    const showSpeaking = isSpeaking && !videoOn;
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
    return (_jsxs("div", { className: `meeting-participant-tile${showSpeaking ? ' meeting-participant-tile--speaking' : ''}`, "aria-label": `Participante ${name}`, style: {
            position: 'relative',
            aspectRatio: '16/9',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0b1b3a, #0e1830)',
            borderRadius: '16px',
        }, children: [videoOn && (_jsx("video", { className: "meeting-participant-video", style: {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    backgroundColor: '#0b1b3a',
                }, ref: videoRef, muted: false, playsInline: true, autoPlay: true })), !videoOn && (_jsx("div", { className: "meeting-participant-avatar", style: {
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
                }, children: initial })), _jsxs("div", { style: {
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
                }, children: [_jsxs("div", { children: [_jsx("span", { className: "meeting-participant-name", style: { display: 'block', fontWeight: 700 }, children: name }), _jsx("span", { className: "meeting-participant-status", style: { display: 'block', fontSize: '0.9rem' }, children: "En la reuni\u00F3n" })] }), renderMediaIcons(videoOn, audioOn)] })] }));
});
const LocalTile = memo(function LocalTile({ localUserName, participantsLength, localStreamRef, localVideoRef, localVideoEnabled, isMuted, renderMediaIcons, stream, isSpeaking = false, }) {
    const videoRef = useRef(null);
    const showSpeaking = isSpeaking && !localVideoEnabled;
    useEffect(() => {
        const el = videoRef.current;
        if (el && stream) {
            el.srcObject = stream;
            el.muted = true;
            el.playsInline = true;
            el.autoplay = true;
            el.play().catch(() => undefined);
            if (localVideoRef)
                localVideoRef.current = el;
        }
    }, [stream, localVideoEnabled]);
    return (_jsxs("div", { className: `meeting-participant-tile meeting-participant-tile--self${showSpeaking ? ' meeting-participant-tile--speaking' : ''}`, "aria-label": "Tu vista propia", style: {
            position: 'relative',
            aspectRatio: '16/9',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #0b1b3a, #0e1830)',
            borderRadius: '16px',
        }, children: [stream && localVideoEnabled ? (_jsx("video", { className: "meeting-participant-video", style: {
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '16px',
                    backgroundColor: '#0b1b3a',
                    transform: 'scaleX(-1)', // mirror for self-view
                }, ref: videoRef, muted: true, playsInline: true, autoPlay: true })) : (_jsx("div", { className: "meeting-participant-avatar", style: {
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
                }, children: (localUserName || 'T').charAt(0).toUpperCase() })), _jsxs("div", { style: {
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
                }, children: [_jsxs("div", { children: [_jsx("span", { className: "meeting-participant-name", style: { display: 'block', fontWeight: 700 }, children: localUserName }), _jsx("span", { className: "meeting-participant-status", style: { display: 'block', fontSize: '0.9rem' }, children: participantsLength ? 'Conectado' : 'Solo tú en la reunión' })] }), renderMediaIcons(localVideoEnabled, !isMuted)] })] }));
});
export default function MeetingRoomPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { meetingId: routeMeetingId } = useParams();
    const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);
    const authToken = getAuthToken();
    const [meeting, setMeeting] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [mediaStates, setMediaStates] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatStatus, setChatStatus] = useState('idle');
    const [chatError, setChatError] = useState(null);
    const [voiceError, setVoiceError] = useState(null);
    const [roomFull, setRoomFull] = useState(false);
    const [isVoiceReady, setIsVoiceReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMap, setSpeakingMap] = useState({});
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [localStreamVersion, setLocalStreamVersion] = useState(0);
    const [copied, setCopied] = useState(false);
    const peersRef = useRef({});
    const remoteMediasRef = useRef({});
    const localStreamRef = useRef(null);
    const localVideoRef = useRef(null);
    const chatStatusRef = useRef('idle');
    const voiceConnectedRef = useRef(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const levelRafRef = useRef(null);
    const sourceRef = useRef(null);
    const remoteAudioAnalyzersRef = useRef({});
    const sharedAudioContextRef = useRef(null);
    useEffect(() => {
        if (!authToken) {
            navigate('/login', {
                replace: true,
                state: { from: `${location.pathname}${location.search}` },
            });
        }
    }, [authToken, navigate, location]);
    const ensureSharedAudioContext = () => {
        if (!sharedAudioContextRef.current) {
            sharedAudioContextRef.current = new AudioContext();
        }
        if (sharedAudioContextRef.current.state === 'suspended') {
            sharedAudioContextRef.current.resume().catch(() => undefined);
        }
        return sharedAudioContextRef.current;
    };
    useEffect(() => {
        const unlock = () => {
            ensureSharedAudioContext();
        };
        window.addEventListener('click', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const playRemoteStream = (remoteId, stream) => {
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
    const startOfferTo = async (remoteSocketId) => {
        if (!meetingId)
            return;
        if (!remoteSocketId || !videoSocket.id)
            return;
        if (!localStreamRef.current || !voiceConnectedRef.current)
            return;
        if (peersRef.current[remoteSocketId])
            return;
        try {
            await createAndSendOffer(meetingId, remoteSocketId, peersRef.current, localStreamRef.current, playRemoteStream);
        }
        catch (err) {
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
        // Use the camera toggle gesture as an audio/autoplay unlock
        handleUnlockAudio();
    };
    const handleUnlockAudio = async () => {
        const sharedCtx = ensureSharedAudioContext();
        if (sharedCtx.state === 'suspended') {
            await sharedCtx.resume().catch(() => undefined);
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume().catch(() => undefined);
        }
        const medias = Object.values(remoteMediasRef.current);
        await Promise.all(medias.map((media) => media
            .play()
            .then(() => undefined)
            .catch(() => undefined)));
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume().catch(() => undefined);
        }
        setAudioUnlocked(true);
    };
    const handleTogglePanel = (panel) => {
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
        if (!meetingId)
            return;
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
            .catch((err) => {
            const message = err?.message || 'No se pudo cargar la reunión o el perfil.';
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
        if (!profile)
            return 'Invitado';
        const compactName = `${profile.username ?? ''} ${profile.lastname ?? ''}`.trim();
        return compactName || profile.email || 'Invitado';
    }, [profile]);
    useEffect(() => {
        if (!meetingId || !profile)
            return;
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
            existingUsers.forEach(({ socketId }) => ensurePeerConnection(meetingId, socketId, peersRef.current, localStreamRef.current, playRemoteStream));
        });
        const stopUserJoined = onVideoUserJoined((data) => setParticipants((prev) => {
            const filtered = prev.filter((p) => p.socketId !== data.socketId);
            const next = [...filtered, data];
            ensurePeerConnection(meetingId, data.socketId, peersRef.current, localStreamRef.current, playRemoteStream);
            return next;
        }));
        const stopUserLeft = onVideoUserLeft((socketId) => setParticipants((prev) => {
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
        }));
        const stopMediaStates = onVideoMediaStates((states) => {
            const mapped = Object.fromEntries(Object.entries(states).map(([socketId, state]) => [
                socketId,
                { ...state, socketId },
            ]));
            setMediaStates(mapped);
        });
        const stopMediaState = onVideoMediaState((state) => state.socketId
            ? setMediaStates((prev) => ({ ...prev, [state.socketId]: state }))
            : undefined);
        const stopSignal = onVideoSignal(async ({ from, signal, roomId }) => {
            const targetRoomId = roomId || meetingId;
            if (!signal || !targetRoomId)
                return;
            if (signal.type === 'offer') {
                await handleIncomingOffer(targetRoomId, from, signal.sdp, peersRef.current, localStreamRef.current, playRemoteStream);
            }
            else if (signal.type === 'answer') {
                await handleIncomingAnswer(from, signal.sdp, peersRef.current);
            }
            else if (signal.type === 'candidate') {
                await handleIncomingCandidate(from, signal.candidate, peersRef.current);
            }
        });
        const stopChat = onVideoChatMessage((msg) => setChatMessages((prev) => [...prev, msg]));
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
        const stopError = onVideoError((err) => {
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
    const handleSendMessage = (event) => {
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
        // Create analysers for new streams (only when they include audio)
        Object.entries(remoteStreams).forEach(([socketId, stream]) => {
            const hasAudioTrack = Boolean(stream?.getAudioTracks().length);
            if (!stream || analyzers[socketId] || !hasAudioTrack)
                return;
            try {
                const analyser = sharedCtx.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.75;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const source = sharedCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                if (sharedCtx.state === 'suspended') {
                    sharedCtx.resume().catch(() => undefined);
                }
                const tick = () => {
                    const entry = analyzers[socketId];
                    if (!entry)
                        return;
                    entry.analyser.getByteTimeDomainData(entry.dataArray);
                    const audioEnabled = stream.getAudioTracks().some((t) => t.enabled);
                    if (!audioEnabled) {
                        setSpeakingMap((prev) => {
                            if (!prev[socketId])
                                return prev;
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
                        if (deviation > maxDeviation)
                            maxDeviation = deviation;
                    }
                    const speakingNow = maxDeviation > 4;
                    setSpeakingMap((prev) => {
                        const current = Boolean(prev[socketId]);
                        if (current === speakingNow)
                            return prev;
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
            }
            catch (err) {
                console.warn('No se pudo crear el analizador de audio remoto', err);
            }
        });
        // Clean up analysers for removed streams
        Object.keys(analyzers).forEach((socketId) => {
            if (remoteStreams[socketId])
                return;
            const entry = analyzers[socketId];
            if (entry?.rafId)
                cancelAnimationFrame(entry.rafId);
            try {
                entry?.source.disconnect();
                entry?.analyser.disconnect();
            }
            catch (err) {
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
                if (entry?.rafId)
                    cancelAnimationFrame(entry.rafId);
                try {
                    entry.source.disconnect();
                    entry.analyser.disconnect();
                }
                catch {
                    /* ignore */
                }
            });
            remoteAudioAnalyzersRef.current = {};
        };
    }, [remoteStreams]);
    useEffect(() => {
        if (!meetingId || !profile)
            return;
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
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                audioContextRef.current = audioCtx;
                analyserRef.current = analyser;
                dataArrayRef.current = dataArray;
                sourceRef.current = source;
                const tick = () => {
                    if (!analyserRef.current || !dataArrayRef.current)
                        return;
                    const buffer = dataArrayRef.current;
                    analyserRef.current.getByteTimeDomainData(buffer);
                    let maxDeviation = 0;
                    for (let i = 0; i < buffer.length; i++) {
                        const deviation = Math.abs(buffer[i] - 128);
                        if (deviation > maxDeviation)
                            maxDeviation = deviation;
                    }
                    // Low threshold to catch soft speech / whispers
                    const speakingNow = maxDeviation > 4 && !isMuted;
                    setIsSpeaking(speakingNow);
                    levelRafRef.current = requestAnimationFrame(tick);
                };
                levelRafRef.current = requestAnimationFrame(tick);
            }
            catch (err) {
                if (cancelled)
                    return;
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
        if (!code)
            return;
        navigator.clipboard
            ?.writeText(code)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));
    };
    useEffect(() => {
        if (!copied)
            return;
        const timeout = setTimeout(() => setCopied(false), 1400);
        return () => clearTimeout(timeout);
    }, [copied]);
    const chatDisabled = chatStatus !== 'connected' || roomFull;
    const chatStatusLabel = chatStatus === 'connected'
        ? 'Chat en vivo conectado.'
        : chatStatus === 'connecting'
            ? 'Conectando al chat...'
            : chatError || 'Chat desconectado.';
    const chatStatusTone = chatStatus === 'connected' ? 'ok' : chatStatus === 'connecting' ? 'pending' : 'error';
    const getDisplayName = (userId) => {
        if (profile?.id === userId)
            return localUserName;
        const participant = participants.find((p) => p.userId === userId);
        return participant?.displayName || 'Invitado';
    };
    const isInitiator = (remoteSocketId) => {
        const selfId = videoSocket.id ?? '';
        if (!selfId || !remoteSocketId)
            return false;
        return selfId < remoteSocketId;
    };
    const renderMediaIcons = useCallback((videoEnabled, audioEnabled) => (_jsxs("span", { style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(9,15,33,0.65)',
            padding: '4px 8px',
            borderRadius: 999,
        }, children: [videoEnabled ? _jsx(VideoIcon, { size: 16 }) : _jsx(VideoOffIcon, { size: 16 }), audioEnabled ? _jsx(Mic, { size: 16 }) : _jsx(MicOff, { size: 16 })] })), []);
    const localVideoEnabled = (() => {
        const tracks = localStreamRef.current?.getVideoTracks() ?? [];
        return tracks.some((t) => t.enabled);
    })();
    return (_jsx("div", { className: "dashboard-wrapper meeting-fullscreen", onClick: () => {
            if (!audioUnlocked)
                handleUnlockAudio();
        }, children: _jsx("div", { className: "container", children: _jsxs("section", { className: "meeting-mock", "aria-label": "Vista previa de la sala de videoconferencia", children: [_jsxs("div", { className: "meeting-mock-top", children: [_jsx("div", { className: "meeting-mock-stage", children: _jsxs("div", { className: "meeting-main", children: [participants.map((participant) => (_jsx(RemoteTile, { participant: participant, mediaState: mediaStates[participant.socketId], stream: remoteStreams[participant.socketId], remoteMediasRef: remoteMediasRef, renderMediaIcons: renderMediaIcons, isSpeaking: Boolean(speakingMap[participant.socketId]) }, participant.socketId))), _jsx(LocalTile, { localUserName: localUserName, participantsLength: participants.length, localStreamRef: localStreamRef, localVideoRef: localVideoRef, localVideoEnabled: localVideoEnabled, isMuted: isMuted, renderMediaIcons: renderMediaIcons, stream: localStreamRef.current, isSpeaking: isSpeaking })] }) }), _jsx("aside", { className: `meeting-sidepanel${activePanel
                                    ? ' meeting-sidepanel--visible'
                                    : ' meeting-sidepanel--hidden'}`, "aria-hidden": !activePanel, children: activePanel && (_jsxs(_Fragment, { children: [_jsxs("header", { className: "meeting-sidepanel-header", children: [_jsx("h3", { children: activePanel === 'participants'
                                                        ? 'Personas'
                                                        : activePanel === 'chat'
                                                            ? 'Mensajes de la llamada'
                                                            : 'Más opciones' }), _jsx("button", { type: "button", className: "meeting-sidepanel-close", "aria-label": "Cerrar panel", onClick: () => setActivePanel(null), children: "\u00D7" })] }), _jsxs("div", { className: "meeting-sidepanel-body", children: [activePanel === 'participants' && (_jsxs(_Fragment, { children: [_jsx("p", { children: "Personas en la sala" }), _jsxs("ul", { className: "meeting-participant-list", children: [_jsxs("li", { children: [_jsx("strong", { children: "T\u00FA" }), " \u2014 ", localUserName] }), participants.map(({ socketId, displayName }) => (_jsx("li", { children: _jsx("strong", { children: displayName || 'Invitado' }) }, socketId)))] }), !participants.length && (_jsx("p", { className: "field-help", children: "A\u00FAn no hay m\u00E1s participantes conectados." })), roomFull && (_jsx("p", { className: "form-hint form-hint-error", children: "La sala est\u00E1 llena; intenta m\u00E1s tarde." }))] })), activePanel === 'chat' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: `meeting-chat-info meeting-chat-info--${chatStatusTone}`, children: [_jsx("span", { className: "meeting-chat-dot" }), _jsx("span", { children: chatStatusLabel })] }), _jsx("div", { className: "meeting-chat-messages", role: "log", "aria-live": "polite", children: chatMessages.length === 0 ? (_jsx("p", { className: "field-help", children: "A\u00FAn no hay mensajes." })) : (chatMessages.map((msg, index) => {
                                                                const author = getDisplayName(msg.userId);
                                                                const isSelf = msg.userId === profile?.id;
                                                                return (_jsxs("div", { className: `meeting-chat-message${isSelf ? ' meeting-chat-message--self' : ''}`, children: [!isSelf && (_jsx("div", { className: "meeting-chat-avatar", children: (author || '?').charAt(0).toUpperCase() })), _jsxs("div", { className: "meeting-chat-bubble", children: [_jsxs("div", { className: "meeting-chat-message-header", children: [_jsx("strong", { children: author }), _jsx("span", { className: "meeting-chat-time", children: new Date(msg.timestamp).toLocaleTimeString([], {
                                                                                                hour: '2-digit',
                                                                                                minute: '2-digit',
                                                                                            }) })] }), _jsx("div", { className: "meeting-chat-message-body", children: msg.message })] })] }, `${msg.timestamp}-${index}`));
                                                            })) })] })), activePanel === 'more' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "meeting-info-block", children: [_jsx("p", { className: "meeting-info-title", children: title }), _jsx("p", { className: "meeting-info-desc", children: description }), _jsxs("div", { className: "meeting-info-id", children: [_jsx("span", { className: "meeting-info-id-label", children: "ID de la reuni\u00F3n:" }), _jsx("span", { className: "meeting-info-id-value", children: code }), _jsx("button", { type: "button", className: `meeting-info-copy${copied ? ' meeting-info-copy--copied' : ''}`, onClick: handleCopyMeetingId, "aria-label": "Copiar ID de la reuni\u00F3n", children: copied ? '¡Copiado!' : 'Copiar' })] })] }), _jsx("p", { children: "Opciones adicionales:" }), _jsxs("ul", { children: [_jsx("li", { children: "Configurar c\u00E1mara/micr\u00F3fono" }), _jsx("li", { children: "Cambiar dise\u00F1o de la llamada" }), _jsx("li", { children: "Activar fondos virtuales" }), _jsx("li", { children: "Pr\u00F3ximamente: grabaci\u00F3n / transmisi\u00F3n" })] })] }))] }), activePanel === 'chat' && (_jsx("footer", { className: "meeting-sidepanel-footer", children: _jsxs("form", { className: "meeting-chat-form", onSubmit: handleSendMessage, children: [_jsx("input", { className: "meeting-sidepanel-input", type: "text", placeholder: chatDisabled
                                                            ? 'Conecta al chat para enviar mensajes'
                                                            : 'Escribe un mensaje', value: chatInput, onChange: (event) => setChatInput(event.target.value), disabled: chatDisabled }), _jsx("button", { type: "submit", className: "mock-btn meeting-chat-send", disabled: chatDisabled || !chatInput.trim(), children: _jsx(Send, { size: 18 }) })] }) }))] })) })] }), _jsxs("div", { className: "meeting-mock-bottom", children: [_jsx("div", { className: "meeting-mock-meeting-code", "aria-label": "Nombre de la reuni\u00F3n", children: code }), _jsxs("div", { className: "meeting-mock-toolbar", "aria-label": "Controles de la reuni\u00F3n", children: [_jsx("button", { type: "button", className: `mock-btn${!isMuted ? ' mock-btn-mic-on' : ''}${isSpeaking && !isMuted ? ' mock-btn-speaking' : ''}`, "aria-label": "Activar o desactivar el micr\u00F3fono", onClick: handleToggleMute, children: isMuted ? _jsx(MicOff, { size: 18 }) : _jsx(Mic, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Activar o desactivar la c\u00E1mara", onClick: handleToggleVideo, children: isVideoOff ? _jsx(VideoOffIcon, { size: 18 }) : _jsx(VideoIcon, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Activar o desactivar subt\u00EDtulos", children: _jsx(Captions, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Levantar la mano", children: _jsx(Hand, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Compartir tu pantalla o pesta\u00F1a", children: _jsx(ScreenShare, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn mock-btn-leave", "aria-label": "Salir de la reuni\u00F3n", onClick: handleLeaveMeeting, children: _jsx(PhoneOff, { size: 18 }) })] }), _jsxs("div", { className: "meeting-mock-right-actions", "aria-label": "M\u00E1s opciones y participantes", children: [_jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "Abrir panel de personas", onClick: () => handleTogglePanel('participants'), children: _jsx(Users, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "Abrir chat de la reuni\u00F3n", onClick: () => handleTogglePanel('chat'), children: _jsx(MessageCircle, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "M\u00E1s opciones de la reuni\u00F3n", onClick: () => handleTogglePanel('more'), children: _jsx(MoreVertical, { size: 18 }) })] })] })] }) }) }));
}
