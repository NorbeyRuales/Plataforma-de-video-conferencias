import {
  sendVoiceIceCandidate,
  sendWebrtcAnswer,
  sendWebrtcOffer,
  voiceSocket,
} from "./voiceSocket";

const DEFAULT_STUN = "stun:stun.l.google.com:19302";

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

/* ---------------------------------------------
   NUEVO: FUNCIÓN PARA REPRODUCCIÓN SEGURA (EDGE)
---------------------------------------------- */
export const playRemoteStream = (
  remoteId: string,
  stream: MediaStream,
  audioMap: AudioElementsMap
) => {
  console.log("[voice] playRemoteStream →", remoteId, stream);

  let audio = audioMap[remoteId];

  if (!audio) {
    audio = document.createElement("audio");

    // 🔊 NECESARIO para Chrome, Edge, Safari
    audio.autoplay = true;
    audio.controls = false;
    audio.muted = false;
    // usar el atributo DOM 'playsinline' para evitar el error de tipo en TypeScript
    audio.setAttribute("playsinline", "");
    audio.preload = "auto";

    // 🔥 EDGE requiere que esté en el DOM
    document.body.appendChild(audio);

    audioMap[remoteId] = audio;
  }

  audio.srcObject = stream;

  const tryPlay = async (attempt = 0) => {
    try {
      await audio.play();
      console.log("🎉 Audio remoto reproduciéndose para", remoteId);
    } catch (err) {
      console.warn("⚠️ Play bloqueado (Edge?) intento:", attempt, err);
      if (attempt < 8) {
        setTimeout(() => tryPlay(attempt + 1), 350);
      }
    }
  };

  tryPlay();
};

/* ---------------------------------------------
   SERVIDORES ICE
---------------------------------------------- */
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
    turnUrls.forEach((url) => {
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

/* ---------------------------------------------
   CREACIÓN / RECUPERACIÓN DE PEER
---------------------------------------------- */
export const ensurePeerConnection = (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
): RTCPeerConnection => {
  if (peers[remoteSocketId]) return peers[remoteSocketId];

  const pc = new RTCPeerConnection({
    iceServers: getIceServers(),
  });

  if (localStream) {
    localStream.getTracks().forEach((track) =>
      pc.addTrack(track, localStream)
    );
  }

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    const fromId = voiceSocket.id ?? "";
    if (!fromId) return;
    sendVoiceIceCandidate({
      to: remoteSocketId,
      from: fromId,
      candidate: event.candidate.toJSON(),
    });
  };

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream) {
      console.log("[voice] ontrack remote stream recibido", remoteStream);
      onRemoteStream(remoteSocketId, remoteStream);
    }
  };

  peers[remoteSocketId] = pc;
  return pc;
};

/* ---------------------------------------------
   OFERTAS / ANSWERS
---------------------------------------------- */
export const createAndSendOffer = async (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
  const pc = ensurePeerConnection(
    remoteSocketId,
    peers,
    localStream,
    onRemoteStream
  );
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendWebrtcOffer({
    to: remoteSocketId,
    from: voiceSocket.id ?? "",
    offer,
  });
};

export const handleIncomingOffer = async (
  from: string,
  offer: RTCSessionDescriptionInit,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
  const pc = ensurePeerConnection(from, peers, localStream, onRemoteStream);
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendWebrtcAnswer({ to: from, from: voiceSocket.id ?? "", answer });
};

export const handleIncomingAnswer = async (
  from: string,
  answer: RTCSessionDescriptionInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
};

export const handleIncomingCandidate = async (
  from: string,
  candidate: RTCIceCandidateInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc || !candidate) return;
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
};

/* ---------------------------------------------
   CIERRE / LIMPIEZA
---------------------------------------------- */
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
    audios[remoteSocketId].remove();
    delete audios[remoteSocketId];
  }
};

export const cleanupAllPeers = (peers: PeerMap, audios: AudioElementsMap) => {
  Object.keys(peers).forEach((id) => closePeer(id, peers, audios));
};
