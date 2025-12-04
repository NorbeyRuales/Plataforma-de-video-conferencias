import { sendVideoSignal, videoSocket } from "./videoSocket";

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
export type MediaElementsMap = Record<string, HTMLMediaElement>;

type PeerMeta = {
  makingOffer: boolean;
  isSettingRemote: boolean;
  pendingCandidates: RTCIceCandidateInit[];
};

const peerMeta: Record<string, PeerMeta> = {};

const getPeerMeta = (id: string): PeerMeta => {
  if (!peerMeta[id]) {
    peerMeta[id] = {
      makingOffer: false,
      isSettingRemote: false,
      pendingCandidates: [],
    };
  }
  return peerMeta[id];
};

export const getIceServers = () => {
  const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
  const turnUrls = (import.meta.env.VITE_TURN_URL || "")
    .split(",")
    .map((u: string) => u.trim())
    .filter((u: string): u is string => Boolean(u));
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

export type SignalMessage =
  | { type: "offer"; sdp: any }
  | { type: "answer"; sdp: any }
  | { type: "candidate"; candidate: RTCIceCandidateInit };

export const ensurePeerConnection = (
  roomId: string,
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
): RTCPeerConnection => {
  let pc = peers[remoteSocketId];

  if (!pc) {
    const meta = getPeerMeta(remoteSocketId);
    const forceRelay =
      (import.meta.env.VITE_FORCE_TURN ?? import.meta.env.VITE_FORCE_RELAY ?? "")
        .toString()
        .toLowerCase() === "true";

    pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceTransportPolicy: forceRelay ? "relay" : "all",
    });

    // Prepara receptores para audio y video incluso si todavía no hay tracks locales.
    pc.addTransceiver("audio", { direction: "recvonly" });
    pc.addTransceiver("video", { direction: "recvonly" });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const fromId = videoSocket.id ?? "";
      if (!fromId) return;
      sendVideoSignal({
        to: remoteSocketId,
        from: fromId,
        roomId,
        signal: { type: "candidate", candidate: event.candidate.toJSON() },
      });
    };

    pc.onnegotiationneeded = async () => {
      try {
        const metaLocal = getPeerMeta(remoteSocketId);
        if (metaLocal.makingOffer) return;
        metaLocal.makingOffer = true;
        const fromId = videoSocket.id ?? "";
        if (!fromId) return;
        if (pc.signalingState !== "stable") return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendVideoSignal({
          to: remoteSocketId,
          from: fromId,
          roomId,
          signal: { type: "offer", sdp: offer },
        });
      } catch (err) {
        console.error("Negotiation error", err);
      } finally {
        const metaLocal = getPeerMeta(remoteSocketId);
        metaLocal.makingOffer = false;
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        onRemoteStream(remoteSocketId, remoteStream);
      }
    };

    peers[remoteSocketId] = pc;
  }

  if (localStream) {
    const existingTracks = new Set(
      pc
        .getSenders()
        .filter((sender) => sender.track)
        .map((sender) => sender.track as MediaStreamTrack)
    );
    localStream.getTracks().forEach((track) => {
      if (!existingTracks.has(track)) {
        pc.addTrack(track, localStream);
      }
    });
  }

  return pc;
};

export const createAndSendOffer = async (
  roomId: string,
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
  const pc = ensurePeerConnection(roomId, remoteSocketId, peers, localStream, onRemoteStream);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  sendVideoSignal({
    to: remoteSocketId,
    from: videoSocket.id ?? "",
    roomId,
    signal: { type: "offer", sdp: offer },
  });
};

export const handleIncomingOffer = async (
  roomId: string,
  from: string,
  offer: RTCSessionDescriptionInit,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
) => {
  const pc = ensurePeerConnection(roomId, from, peers, localStream, onRemoteStream);
  const meta = getPeerMeta(from);
  const desc = new RTCSessionDescription(offer);
  
  const readyForOffer =
    !meta.makingOffer && (pc.signalingState === "stable" || meta.isSettingRemote);
  const offerCollision = !readyForOffer;

  if (offerCollision) {
    const selfId = videoSocket.id ?? "";
    const isPolite = selfId < from;

    if (!isPolite) {
      // Impolite: ignoramos la oferta entrante y seguimos intentando enviar la nuestra.
      return;
    }

    // Polite: hacemos rollback de nuestra oferta local para aceptar la remota.
    try {
      await pc.setLocalDescription({ type: "rollback" } as any);
    } catch (e) {
      console.warn("Rollback failed", e);
    }
  }

  meta.isSettingRemote = true;
  await pc.setRemoteDescription(desc);
  meta.isSettingRemote = false;

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  sendVideoSignal({
    to: from,
    from: videoSocket.id ?? "",
    roomId,
    signal: { type: "answer", sdp: answer },
  });

  // Procesar candidatos pendientes si llegaron antes de la SDP remota.
  while (meta.pendingCandidates.length) {
    const candidate = meta.pendingCandidates.shift();
    if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
};

export const handleIncomingAnswer = async (
  from: string,
  answer: RTCSessionDescriptionInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  const meta = getPeerMeta(from);
  while (meta.pendingCandidates.length) {
    const candidate = meta.pendingCandidates.shift();
    if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
};

export const handleIncomingCandidate = async (
  from: string,
  candidate: RTCIceCandidateInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc || !candidate) return;
  const meta = getPeerMeta(from);
  if (pc.remoteDescription) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } else {
    meta.pendingCandidates.push(candidate);
  }
};

export const closePeer = (remoteSocketId: string, peers: PeerMap, medias: MediaElementsMap) => {
  peers[remoteSocketId]?.close();
  delete peers[remoteSocketId];
  if (medias[remoteSocketId]) {
    medias[remoteSocketId].pause();
    medias[remoteSocketId].srcObject = null;
    delete medias[remoteSocketId];
  }
};

export const cleanupAllPeers = (peers: PeerMap, medias: MediaElementsMap) => {
  Object.keys(peers).forEach((id) => closePeer(id, peers, medias));
};
