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
  const turnUrls = (import.meta.env.VITE_TURN_URL || "").split(",").map((u) => u.trim()).filter(Boolean);
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
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
  }

  pc.onicecandidate = (event) => {
    if (!event.candidate) return;
    sendVoiceIceCandidate({
      to: remoteSocketId,
      from: voiceSocket.id ?? "",
      candidate: event.candidate.toJSON(),
    });
  };

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    if (remoteStream) {
      onRemoteStream(remoteSocketId, remoteStream);
    }
  };

  peers[remoteSocketId] = pc;
  return pc;
};

export const createAndSendOffer = async (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
  const pc = ensurePeerConnection(remoteSocketId, peers, localStream, onRemoteStream);
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
