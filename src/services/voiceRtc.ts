import {
  sendVoiceIceCandidate,
  sendWebrtcAnswer,
  sendWebrtcOffer,
  voiceSocket,
} from "./voiceSocket";

const DEFAULT_STUN = "stun:stun.l.google.com:19302";
// TURN públicos de respaldo (openrelay) para ayudar en NAT estrictos en producción.
const DEFAULT_TURNS: RTCIceServer[] = [
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

export type PeerMap = Record<string, RTCPeerConnection>;
export type AudioElementsMap = Record<string, HTMLAudioElement>;

export const getIceServers = () => {
  const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
  const turnUrls = (import.meta.env.VITE_TURN_URL || "")
    .split(",")
    .map((u: string) => u.trim())
    .filter(Boolean);
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;

  const servers: RTCIceServer[] = [{ urls: stunUrl }];

  if (turnUrls.length && turnUser && turnCred) {
    turnUrls.forEach((url: string) => {
      servers.push({
        urls: url,
        username: turnUser,
        credential: turnCred,
      });
    });
  } else {
    servers.push(...DEFAULT_TURNS);
  }

  return servers;
};

export const ensurePeerConnection = (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
): RTCPeerConnection => {
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
    } else {
      console.log('✅[rtc] Ya existe sender de audio para', remoteSocketId);
    }
  } else {
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

export const createAndSendOffer = async (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
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

export const handleIncomingOffer = async (
  from: string,
  offer: RTCSessionDescriptionInit,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
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

export const handleIncomingAnswer = async (
  from: string,
  answer: RTCSessionDescriptionInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc) {
    console.warn('⚠️[answer] No se encontró peer connection para', from);
    return;
  }
  console.log('📥[answer] Recibiendo respuesta de', from);
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  console.log('✅[answer] Descripción remota establecida desde', from);
};

export const handleIncomingCandidate = async (
  from: string,
  candidate: RTCIceCandidateInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc || !candidate) {
    console.warn('⚠️[ice] No se puede agregar candidato:', !pc ? 'peer no encontrado' : 'candidato inválido', 'para', from);
    return;
  }
  console.log('🧊[ice] Agregando candidato ICE de', from);
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
  console.log('✅[ice] Candidato ICE agregado desde', from);
};

export const closePeer = (
  remoteSocketId: string,
  peers: PeerMap,
  audios: AudioElementsMap
) => {
  peers[remoteSocketId]?.close();
  delete peers[remoteSocketId];
  if (audios[remoteSocketId]) {
    audios[remoteSocketId].pause();
    audios[remoteSocketId].srcObject = null;
    delete audios[remoteSocketId];
  }
};

export const cleanupAllPeers = (peers: PeerMap, audios: AudioElementsMap) => {
  Object.keys(peers).forEach((id) => closePeer(id, peers, audios));
};
