import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Dedicated meeting-room view.
 * Connects to the chat backend (Socket.IO) for participants and live messages,
 * and wires WebRTC signaling for voice.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Captions, Hand, MessageCircle, Mic, MicOff, MoreVertical, PhoneOff, ScreenShare, Users, Video as VideoIcon, Send, } from 'lucide-react';
import '../CreateMeetingPage/CreateMeetingPage.scss';
import { getMeeting, getProfile } from '../../services/api';
import { getAuthToken } from '../../services/authToken';
import { connectSocket, disconnectSocket, joinRoom, onChatMessage, onRoomFull, onSocketConnect, onSocketDisconnect, onSocketError, sendChatMessage, } from '../../services/chatSocket';
import { cleanupAllPeers, createAndSendOffer, handleIncomingAnswer, handleIncomingCandidate, handleIncomingOffer, closePeer, } from '../../services/voiceRtc';
import { connectVoiceSocket, disconnectVoiceSocket, joinVoiceRoom, onVoiceConnect, onVoiceDisconnect, onVoiceError, onVoiceExistingUsers, onVoiceWebrtcOffer, onVoiceWebrtcAnswer, onVoiceWebrtcCandidate, onVoiceRoomFull, onVoiceUserJoined, onVoiceUserLeft, sendVoiceMediaToggle, voiceSocket, } from '../../services/voiceSocket';
/**
 * Full meeting experience: loads meeting metadata, connects chat and voice sockets,
 * and renders the in-call UI with side panels.
 *
 * @returns {JSX.Element} Dedicated meeting room layout.
 */
export default function MeetingRoomPage() {
    const { meetingId: routeMeetingId } = useParams();
    const meetingId = useMemo(() => (routeMeetingId ?? '').trim(), [routeMeetingId]);
    const [meeting, setMeeting] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activePanel, setActivePanel] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [chatStatus, setChatStatus] = useState('idle');
    const [chatError, setChatError] = useState(null);
    const [roomFull, setRoomFull] = useState(false);
    const [voiceError, setVoiceError] = useState(null);
    const [isVoiceReady, setIsVoiceReady] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const peersRef = useRef({});
    const remoteAudiosRef = useRef({});
    const localStreamRef = useRef(null);
    const chatStatusRef = useRef('idle');
    const voiceConnectedRef = useRef(false);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const levelRafRef = useRef(null);
    const sourceRef = useRef(null);
    /**
     * Create (if needed) and play the audio element for a remote participant.
     * Retries playback when autoplay is blocked.
     */
    const playRemoteStream = (remoteId, stream) => {
        let audio = remoteAudiosRef.current[remoteId];
        if (!audio) {
            audio = new Audio();
            audio.autoplay = true;
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
    /**
     * Trigger a WebRTC offer toward a peer, with tie-breaking to avoid glare.
     *
     * @param {string} remoteSocketId Target peer socket ID.
     */
    const startOfferTo = async (remoteSocketId) => {
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
            await createAndSendOffer(remoteSocketId, peersRef.current, localStreamRef.current, playRemoteStream);
            console.log('✅[webrtc] Oferta enviada exitosamente a', remoteSocketId);
        }
        catch (err) {
            console.error('❌[webrtc] Error al iniciar oferta con', remoteSocketId, err);
            // Reintentar después de 2 segundos
            setTimeout(() => startOfferTo(remoteSocketId), 2000);
        }
    };
    /**
     * Toggle local microphone and notify peers about the new audio state.
     */
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
    /**
     * Toggle the visibility of a side panel (chat, participants, more).
     *
     * @param {"participants" | "chat" | "more"} panel Panel identifier to show/hide.
     */
    const handleTogglePanel = (panel) => {
        setActivePanel((current) => (current === panel ? null : panel));
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
            .catch((err) => setError(err?.message || 'No se pudo cargar la reunión o el perfil.'))
            .finally(() => setIsLoading(false));
    }, [meetingId]);
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
        const handleConnectError = (err) => {
            console.error('Socket connect error', err);
            setChatStatus('error');
            chatStatusRef.current = 'error';
            setChatError('No se pudo conectar al chat en tiempo real.');
        };
        const handleDisconnect = () => setChatStatus((current) => {
            const next = current === 'error' ? 'error' : 'idle';
            chatStatusRef.current = next;
            return next;
        });
        const stopChat = onChatMessage((msg) => setChatMessages((prev) => [...prev, msg]));
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
        if (!meetingId || !profile)
            return;
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
        const handleError = (err) => {
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
        const stopLeft = onVoiceUserLeft((data) => setParticipants((prev) => {
            closePeer(data.socketId, peersRef.current, remoteAudiosRef.current);
            return prev.filter((p) => p.socketId !== data.socketId);
        }));
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
    /**
     * Submit a chat message to the room if the socket is connected.
     */
    const handleSendMessage = (event) => {
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
    /**
     * Normalize incoming audio buffer payloads regardless of ArrayBuffer/SharedArrayBuffer type.
     */
    const handleAudioBuffer = (buffer) => {
        if (buffer instanceof SharedArrayBuffer) {
            const arrayBuffer = new ArrayBuffer(buffer.byteLength);
            new Uint8Array(arrayBuffer).set(new Uint8Array(buffer));
            return new Uint8Array(arrayBuffer);
        }
        return new Uint8Array(buffer);
    };
    useEffect(() => {
        if (!meetingId)
            return;
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
        if (!isVoiceReady || !localStreamRef.current)
            return;
        participants.forEach(({ socketId }) => startOfferTo(socketId));
    }, [isVoiceReady, participants]);
    const title = meeting?.title || 'Reunión';
    const code = meetingId || meeting?.id || 'sin-id';
    const chatDisabled = chatStatus !== 'connected' || roomFull;
    return (_jsx("div", { className: "dashboard-wrapper", children: _jsxs("div", { className: "container", children: [_jsx("header", { className: "dashboard-main-header meeting-header", children: _jsxs("div", { children: [_jsx("h1", { children: "Sala de reuni\u00F3n" }), _jsx("p", { children: "Vista de la llamada en una pesta\u00F1a dedicada." }), _jsxs("p", { className: "field-help", children: ["ID: ", code] }), isLoading && _jsx("p", { className: "field-help", children: "Cargando reuni\u00F3n..." }), error && _jsx("p", { className: "form-hint form-hint-error", children: error }), chatStatus === 'connecting' && (_jsx("p", { className: "field-help", children: "Conectando al chat en tiempo real..." })), chatStatus === 'error' && (_jsx("p", { className: "form-hint form-hint-error", children: chatError ?? 'El chat no está disponible en este momento.' })), roomFull && (_jsx("p", { className: "form-hint form-hint-error", children: "La sala est\u00E1 llena (m\u00E1x. 10 participantes)." })), voiceError && (_jsx("p", { className: "form-hint form-hint-error", children: voiceError }))] }) }), _jsxs("section", { className: "meeting-mock", "aria-label": "Vista previa de la sala de videoconferencia", children: [_jsxs("div", { className: "meeting-mock-top", children: [_jsx("div", { className: "meeting-mock-stage", children: _jsxs("div", { className: "meeting-main", children: [_jsxs("div", { className: "meeting-main-video", "aria-label": "Video principal", children: [_jsx("div", { className: "meeting-main-avatar", children: "A" }), _jsx("span", { className: "meeting-main-name", children: title }), _jsx("span", { className: "meeting-main-mic", "aria-label": "Micr\u00F3fono silenciado", children: _jsx(MicOff, { size: 16 }) })] }), _jsxs("div", { className: "meeting-self-tile", "aria-label": "Tu vista propia", children: [_jsx("div", { className: "meeting-self-avatar" }), _jsxs("div", { className: "meeting-self-footer", children: [_jsx("span", { className: "meeting-self-name", children: "T\u00FA" }), _jsx("span", { className: "meeting-self-mic", "aria-label": "Micr\u00F3fono silenciado", children: _jsx(MicOff, { size: 14 }) })] })] })] }) }), _jsx("aside", { className: `meeting-sidepanel${activePanel
                                        ? ' meeting-sidepanel--visible'
                                        : ' meeting-sidepanel--hidden'}`, "aria-hidden": !activePanel, children: activePanel && (_jsxs(_Fragment, { children: [_jsxs("header", { className: "meeting-sidepanel-header", children: [_jsx("h3", { children: activePanel === 'participants'
                                                            ? 'Personas'
                                                            : activePanel === 'chat'
                                                                ? 'Mensajes de la llamada'
                                                                : 'Más opciones' }), _jsx("button", { type: "button", className: "meeting-sidepanel-close", "aria-label": "Cerrar panel", onClick: () => setActivePanel(null), children: "\u00D7" })] }), _jsxs("div", { className: "meeting-sidepanel-body", children: [activePanel === 'participants' && (_jsxs(_Fragment, { children: [_jsx("p", { children: "Personas en la sala" }), _jsxs("ul", { className: "meeting-participant-list", children: [_jsxs("li", { children: [_jsx("strong", { children: "T\u00FA" }), " \u2014 ", localUserName] }), participants.map(({ socketId, userInfo }) => (_jsx("li", { children: _jsx("strong", { children: userInfo.displayName || 'Invitado' }) }, socketId)))] }), !participants.length && (_jsx("p", { className: "field-help", children: "A\u00FAn no hay m\u00E1s participantes conectados." })), roomFull && (_jsx("p", { className: "form-hint form-hint-error", children: "La sala est\u00E1 llena; intenta m\u00E1s tarde." }))] })), activePanel === 'chat' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: `meeting-chat-info meeting-chat-info--${chatStatus === 'connected'
                                                                    ? 'ok'
                                                                    : chatStatus === 'connecting'
                                                                        ? 'pending'
                                                                        : 'error'}`, children: [_jsx("span", { className: "meeting-chat-dot", "aria-hidden": true }), _jsx("span", { children: chatStatus === 'connected'
                                                                            ? 'Chat en vivo conectado.'
                                                                            : chatStatus === 'connecting'
                                                                                ? 'Conectando al chat...'
                                                                                : chatError || 'Chat desconectado.' })] }), _jsx("div", { className: "meeting-chat-messages", role: "log", "aria-live": "polite", children: chatMessages.length === 0 ? (_jsx("p", { className: "field-help", children: "A\u00FAn no hay mensajes." })) : (chatMessages.map((msg, index) => {
                                                                    const isSelf = msg.userName === localUserName;
                                                                    const initial = (msg.userName?.trim()?.[0] || '?').toUpperCase();
                                                                    return (_jsxs("div", { className: `meeting-chat-message${isSelf ? ' meeting-chat-message--self' : ''}`, children: [!isSelf && (_jsx("div", { className: "meeting-chat-avatar", "aria-hidden": true, children: initial })), _jsxs("div", { className: "meeting-chat-bubble", children: [_jsxs("div", { className: "meeting-chat-message-header", children: [_jsx("strong", { children: msg.userName }), _jsx("span", { className: "meeting-chat-time", children: new Date(msg.timestamp).toLocaleTimeString([], {
                                                                                                    hour: '2-digit',
                                                                                                    minute: '2-digit',
                                                                                                }) })] }), _jsx("div", { className: "meeting-chat-message-body", children: msg.message })] })] }, `${msg.timestamp}-${index}`));
                                                                })) })] })), activePanel === 'more' && (_jsxs(_Fragment, { children: [_jsx("p", { children: "Opciones adicionales:" }), _jsxs("ul", { children: [_jsx("li", { children: "Configurar c\u00E1mara/micr\u00F3fono" }), _jsx("li", { children: "Cambiar dise\u00F1o de la llamada" }), _jsx("li", { children: "Activar fondos virtuales" }), _jsx("li", { children: "Pr\u00F3ximamente: grabaci\u00F3n / transmisi\u00F3n" })] })] }))] }), activePanel === 'chat' && (_jsx("footer", { className: "meeting-sidepanel-footer", children: _jsxs("form", { className: "meeting-chat-form", onSubmit: handleSendMessage, children: [_jsx("input", { className: "meeting-sidepanel-input", type: "text", placeholder: chatDisabled
                                                                ? 'Conecta al chat para enviar mensajes'
                                                                : 'Escribe un mensaje', value: chatInput, onChange: (event) => setChatInput(event.target.value), disabled: chatDisabled }), _jsx("button", { type: "submit", className: "mock-btn meeting-chat-send", disabled: chatDisabled || !chatInput.trim(), "aria-label": "Enviar mensaje", children: _jsx(Send, { size: 28 }) })] }) }))] })) })] }), _jsxs("div", { className: "meeting-mock-bottom", children: [_jsx("div", { className: "meeting-mock-meeting-code", "aria-label": "Nombre de la reuni\u00F3n", children: code }), _jsxs("div", { className: "meeting-mock-toolbar", "aria-label": "Controles de la reuni\u00F3n", children: [_jsx("button", { type: "button", className: `mock-btn${!isMuted ? ' mock-btn-mic-on' : ''}${isSpeaking && !isMuted ? ' mock-btn-speaking' : ''}`, "aria-label": "Activar o desactivar el micr\u00F3fono", onClick: handleToggleMute, children: isMuted ? _jsx(MicOff, { size: 18 }) : _jsx(Mic, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Activar o desactivar la c\u00E1mara", children: _jsx(VideoIcon, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Activar o desactivar subt\u00EDtulos", children: _jsx(Captions, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Levantar la mano", children: _jsx(Hand, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn", "aria-label": "Compartir tu pantalla o pesta\u00F1a", children: _jsx(ScreenShare, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-btn mock-btn-leave", "aria-label": "Salir de la reuni\u00F3n", children: _jsx(PhoneOff, { size: 18 }) })] }), _jsxs("div", { className: "meeting-mock-right-actions", "aria-label": "M\u00E1s opciones y participantes", children: [_jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "Abrir panel de personas", onClick: () => handleTogglePanel('participants'), children: _jsx(Users, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "Abrir chat de la reuni\u00F3n", onClick: () => handleTogglePanel('chat'), children: _jsx(MessageCircle, { size: 18 }) }), _jsx("button", { type: "button", className: "mock-icon-btn", "aria-label": "M\u00E1s opciones de la reuni\u00F3n", onClick: () => handleTogglePanel('more'), children: _jsx(MoreVertical, { size: 18 }) })] })] })] })] }) }));
}
