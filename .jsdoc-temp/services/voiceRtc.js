import { sendVoiceIceCandidate, sendWebrtcAnswer, sendWebrtcOffer, voiceSocket, } from "./voiceSocket";
const DEFAULT_STUN = "stun:stun.l.google.com:19302";
// TURN públicos de respaldo (openrelay) para ayudar en NAT estrictos en producción.
const DEFAULT_TURNS = [
    {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
];
/**
 * Build the STUN/TURN server list based on environment variables with fallbacks.
 *
 * @returns {RTCIceServer[]} List of ICE servers for RTCPeerConnection.
 */
export const getIceServers = () => {
    const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
    const turnUrls = (import.meta.env.VITE_TURN_URL || "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
    const servers = [{ urls: stunUrl }];
    if (turnUrls.length && turnUser && turnCred) {
        turnUrls.forEach((url) => {
            servers.push({
                urls: url,
                username: turnUser,
                credential: turnCred,
            });
        });
    }
    else {
        servers.push(...DEFAULT_TURNS);
    }
    return servers;
};
/**
 * Ensure there is a peer connection for the given socket, attaching local audio
 * tracks if available and wiring up signaling callbacks.
 *
 * @param {string} remoteSocketId Target peer socket ID.
 * @param {PeerMap} peers Mutable map of peer connections keyed by socket ID.
 * @param {MediaStream | null} localStream Local microphone stream to attach.
 * @param {(remoteId: string, stream: MediaStream) => void} onRemoteStream Callback invoked when a remote stream arrives.
 * @returns {RTCPeerConnection} Existing or newly created peer connection.
 */
export const ensurePeerConnection = (remoteSocketId, peers, localStream, onRemoteStream) => {
    const forceTurn = (import.meta.env.VITE_FORCE_TURN || "")
        .toString()
        .toLowerCase() === "true";
    let pc = peers[remoteSocketId];
    if (!pc) {
        console.log('🆕[rtc] Creando nueva PeerConnection para', remoteSocketId);
        pc = new RTCPeerConnection({
            iceServers: getIceServers(),
            iceTransportPolicy: forceTurn ? "relay" : "all",
        });
        peers[remoteSocketId] = pc;
    }
    // Aseguramos que la pista local de audio esté añadida, incluso si el PC ya existía.
    if (localStream) {
        const hasAudioSender = pc
            .getSenders()
            .some((sender) => sender.track?.kind === "audio");
        if (!hasAudioSender) {
            console.log('🎤[rtc] Agregando tracks de audio local a', remoteSocketId);
            localStream
                .getTracks()
                .filter((t) => t.kind === "audio")
                .forEach((track) => {
                console.log('➡️[rtc] Agregando track', track.kind, track.enabled ? 'habilitado' : 'deshabilitado');
                pc.addTrack(track, localStream);
            });
        }
        else {
            console.log('✅[rtc] Ya existe sender de audio para', remoteSocketId);
        }
    }
    else {
        console.warn('⚠️[rtc] No hay stream local disponible al crear PC para', remoteSocketId);
    }
    pc.onicecandidate = (event) => {
        if (!event.candidate) {
            console.log('✅[ice] Gathering completo para', remoteSocketId);
            return;
        }
        console.log('🧊[ice] Enviando candidato ICE a', remoteSocketId);
        sendVoiceIceCandidate({
            to: remoteSocketId,
            from: voiceSocket.id ?? "",
            candidate: event.candidate.toJSON(),
        });
    };
    pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
            console.log('📡[rtc] Track remoto recibido de', remoteSocketId, '- kind:', event.track.kind, 'enabled:', event.track.enabled);
            onRemoteStream(remoteSocketId, remoteStream);
        }
    };
    pc.oniceconnectionstatechange = () => {
        console.log('🔌[ice] Estado de conexión ICE con', remoteSocketId, ':', pc.iceConnectionState);
    };
    pc.onconnectionstatechange = () => {
        console.log('🔗[rtc] Estado de conexión con', remoteSocketId, ':', pc.connectionState);
    };
    return pc;
};
/**
 * Create a WebRTC offer for a peer and send it through the signaling socket.
 *
 * @param {string} remoteSocketId Target peer socket ID.
 * @param {PeerMap} peers Mutable map of peer connections keyed by socket ID.
 * @param {MediaStream | null} localStream Local microphone stream to attach.
 * @param {(remoteId: string, stream: MediaStream) => void} onRemoteStream Callback invoked when a remote stream arrives.
 * @returns {Promise<void>}
 */
export const createAndSendOffer = async (remoteSocketId, peers, localStream, onRemoteStream) => {
    console.log('📤[offer] Creando oferta para', remoteSocketId);
    const pc = ensurePeerConnection(remoteSocketId, peers, localStream, onRemoteStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('✅[offer] Oferta creada y descripción local establecida para', remoteSocketId);
    sendWebrtcOffer({
        to: remoteSocketId,
        from: voiceSocket.id ?? "",
        offer,
    });
    console.log('📤[offer] Oferta enviada vía socket a', remoteSocketId);
};
/**
 * Process an incoming WebRTC offer, set it as the remote description and reply with an answer.
 *
 * @param {string} from Sender socket ID.
 * @param {RTCSessionDescriptionInit} offer SDP offer received.
 * @param {PeerMap} peers Mutable map of peer connections.
 * @param {MediaStream | null} localStream Local microphone stream to attach.
 * @param {(remoteId: string, stream: MediaStream) => void} onRemoteStream Callback invoked when a remote stream arrives.
 * @returns {Promise<void>}
 */
export const handleIncomingOffer = async (from, offer, peers, localStream, onRemoteStream) => {
    console.log('📥[offer] Recibiendo oferta de', from);
    const pc = ensurePeerConnection(from, peers, localStream, onRemoteStream);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log('✅[offer] Descripción remota establecida desde', from);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log('✅[answer] Respuesta creada y descripción local establecida para', from);
    sendWebrtcAnswer({ to: from, from: voiceSocket.id ?? "", answer });
    console.log('📤[answer] Respuesta enviada a', from);
};
/**
 * Apply a remote answer to an existing peer connection.
 *
 * @param {string} from Sender socket ID.
 * @param {RTCSessionDescriptionInit} answer SDP answer received.
 * @param {PeerMap} peers Mutable map of peer connections.
 * @returns {Promise<void>}
 */
export const handleIncomingAnswer = async (from, answer, peers) => {
    const pc = peers[from];
    if (!pc) {
        console.warn('⚠️[answer] No se encontró peer connection para', from);
        return;
    }
    console.log('📥[answer] Recibiendo respuesta de', from);
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log('✅[answer] Descripción remota establecida desde', from);
};
/**
 * Add an ICE candidate to an existing peer connection.
 *
 * @param {string} from Sender socket ID.
 * @param {RTCIceCandidateInit} candidate ICE candidate to add.
 * @param {PeerMap} peers Mutable map of peer connections.
 * @returns {Promise<void>}
 */
export const handleIncomingCandidate = async (from, candidate, peers) => {
    const pc = peers[from];
    if (!pc || !candidate) {
        console.warn('⚠️[ice] No se puede agregar candidato:', !pc ? 'peer no encontrado' : 'candidato inválido', 'para', from);
        return;
    }
    console.log('🧊[ice] Agregando candidato ICE de', from);
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
    console.log('✅[ice] Candidato ICE agregado desde', from);
};
/**
 * Tear down a single peer connection and its associated audio element.
 *
 * @param {string} remoteSocketId Target peer socket ID.
 * @param {PeerMap} peers Mutable map of peer connections.
 * @param {AudioElementsMap} audios Map of remote audio elements keyed by socket ID.
 */
export const closePeer = (remoteSocketId, peers, audios) => {
    peers[remoteSocketId]?.close();
    delete peers[remoteSocketId];
    if (audios[remoteSocketId]) {
        audios[remoteSocketId].pause();
        audios[remoteSocketId].srcObject = null;
        delete audios[remoteSocketId];
    }
};
/**
 * Close and remove every peer connection and audio element.
 *
 * @param {PeerMap} peers Mutable map of peer connections.
 * @param {AudioElementsMap} audios Map of remote audio elements keyed by socket ID.
 */
export const cleanupAllPeers = (peers, audios) => {
    Object.keys(peers).forEach((id) => closePeer(id, peers, audios));
};
