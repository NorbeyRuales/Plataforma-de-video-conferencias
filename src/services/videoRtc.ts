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

/**
 * Build STUN/TURN server list from env vars with sensible defaults.
 *
 * @returns {RTCIceServer[]} ICE server configuration.
 */
export const getIceServers = () => {
  const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
  const turnUrls = (import.meta.env.VITE_TURN_URL || "")
    .split(",")
    .map((u: string) => u.trim())
    .filter((u: string): u is string => Boolean(u));
  const turnTcpUrl = (import.meta.env.VITE_TURN_TCP_URL || "").trim();
  const turnUser = import.meta.env.VITE_TURN_USERNAME;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;

  const servers: RTCIceServer[] = [{ urls: stunUrl }];

  const allTurnUrls = [...turnUrls];
  if (turnTcpUrl) allTurnUrls.push(turnTcpUrl);

  const normalizeTurnUrl = (url: string) => {
    // Port 5349 is commonly TURN over TLS; using `turn:` there often fails.
    if (/^turn:/.test(url) && /:5349(\?|$)/.test(url)) {
      return url.replace(/^turn:/, "turns:");
    }
    return url;
  };

  if (allTurnUrls.length && turnUser && turnCred) {
    allTurnUrls.forEach((url: string) => {
      servers.push({
        urls: normalizeTurnUrl(url),
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

/**
 * Ensure there is a peer connection for a remote participant, wiring recvonly transceivers
 * up-front and attaching local tracks when available.
 *
 * @param {string} roomId Current room id.
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 * @returns {RTCPeerConnection} Existing or newly created peer connection.
 */
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

    // Pre-wire audio and video transceivers. Use sendrecv so media flows both ways
    // from the start; tracks will be added dynamically as they become available.
    pc.addTransceiver("audio", { direction: "sendrecv" });
    pc.addTransceiver("video", { direction: "sendrecv" });

    // Monitor connection state for debugging and potential reconnection
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${remoteSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.warn(`[WebRTC] Connection with ${remoteSocketId} is ${pc.connectionState}. May need reconnection.`);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${remoteSocketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        // Attempt ICE restart with a new offer
        console.warn(`[WebRTC] ICE failed with ${remoteSocketId}, attempting restart...`);
        pc.restartIce();
        // Send a new offer after ICE restart
        (async () => {
          try {
            if (pc.signalingState === "stable") {
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              sendVideoSignal({
                to: remoteSocketId,
                from: videoSocket.id ?? "",
                roomId,
                signal: { type: "offer", sdp: offer },
              });
            }
          } catch (err) {
            console.error("[WebRTC] ICE restart offer failed", err);
          }
        })();
      }
    };

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
      // Handle both stream-based and track-based scenarios
      let remoteStream = event.streams?.[0];
      
      // If no stream is provided (some browsers), create one from the track
      if (!remoteStream && event.track) {
        remoteStream = new MediaStream([event.track]);
      }
      
      if (remoteStream) {
        console.log(`[WebRTC] Received track from ${remoteSocketId}: ${event.track?.kind}`);
        onRemoteStream(remoteSocketId, remoteStream);
      }
    };

    peers[remoteSocketId] = pc;
  }

  if (localStream) {
    console.log(`[WebRTC] Adding ${localStream.getTracks().length} local tracks to peer ${remoteSocketId}`);
    
    // Get current senders and their track IDs
    const senders = pc.getSenders();
    const existingTrackIds = new Set(
      senders
        .filter((sender) => sender.track)
        .map((sender) => sender.track!.id)
    );

    for (const track of localStream.getTracks()) {
      console.log(`[WebRTC] Processing track: ${track.kind}, enabled: ${track.enabled}, id: ${track.id.substring(0, 8)}...`);
      
      // Check if this exact track ID is already added
      if (existingTrackIds.has(track.id)) {
        console.log(`[WebRTC] Track ${track.kind} (${track.id.substring(0, 8)}) already added to sender`);
        continue;
      }

      // Find a transceiver of the same kind that doesn't have a sender track
      const transceiver = pc.getTransceivers().find(
        (t) => !t.sender.track && t.receiver.track?.kind === track.kind
      );

      if (transceiver) {
        console.log(`[WebRTC] Using existing transceiver for ${track.kind}`);
        transceiver.sender.replaceTrack(track)
          .then(() => {
            if (transceiver.direction === "recvonly") {
              transceiver.direction = "sendrecv";
            }
          })
          .catch((err) => {
            console.warn(`[WebRTC] replaceTrack failed for ${track.kind}, using addTrack`, err);
            try {
              pc.addTrack(track, localStream);
            } catch (e) {
              console.error(`[WebRTC] addTrack also failed for ${track.kind}`, e);
            }
          });
      } else {
        // No suitable transceiver, add new track
        console.log(`[WebRTC] Adding new track for ${track.kind} via addTrack`);
        try {
          pc.addTrack(track, localStream);
        } catch (err) {
          console.error(`[WebRTC] Failed to add track ${track.kind}`, err);
        }
      }
    }

    // Ensure all transceivers with tracks are set to sendrecv
    pc.getTransceivers().forEach((t) => {
      if (t.sender.track && (t.direction === "recvonly" || t.direction === "inactive")) {
        console.log(`[WebRTC] Setting transceiver direction to sendrecv for ${t.sender.track.kind}`);
        t.direction = "sendrecv";
      }
    });
  }

  return pc;
};

/**
 * Add or update local tracks on an existing peer connection and trigger renegotiation if needed.
 * This is useful when the local stream becomes available after the peer connection was created.
 *
 * @param {string} roomId Current room id.
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream} localStream Local media stream.
 */
export const addLocalTracksAndRenegotiate = async (
  roomId: string,
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream
): Promise<void> => {
  const pc = peers[remoteSocketId];
  if (!pc) {
    console.log(`[WebRTC] No peer connection for ${remoteSocketId}, skipping addLocalTracksAndRenegotiate`);
    return;
  }

  console.log(`[WebRTC] addLocalTracksAndRenegotiate for ${remoteSocketId}`);

  const senders = pc.getSenders();
  const existingTrackIds = new Set(
    senders.filter((s) => s.track).map((s) => s.track!.id)
  );

  let tracksAdded = false;

  for (const track of localStream.getTracks()) {
    if (existingTrackIds.has(track.id)) {
      console.log(`[WebRTC] Track ${track.kind} already in sender, skipping`);
      continue;
    }

    const matchingTransceiver = pc.getTransceivers().find(
      (t) => !t.sender.track && t.receiver.track?.kind === track.kind
    );

    if (matchingTransceiver) {
      console.log(`[WebRTC] Replacing track on transceiver for ${track.kind}`);
      try {
        await matchingTransceiver.sender.replaceTrack(track);
        if (matchingTransceiver.direction === "recvonly") {
          matchingTransceiver.direction = "sendrecv";
        }
        tracksAdded = true;
      } catch (err) {
        console.warn("[WebRTC] Failed to replace track, trying addTrack", err);
        try {
          pc.addTrack(track, localStream);
          tracksAdded = true;
        } catch (e) {
          console.error("[WebRTC] addTrack failed", e);
        }
      }
    } else {
      console.log(`[WebRTC] Adding new track for ${track.kind}`);
      try {
        pc.addTrack(track, localStream);
        tracksAdded = true;
      } catch (err) {
        console.error("[WebRTC] Failed to add track", err);
      }
    }
  }

  // Ensure sendrecv direction for all transceivers with tracks
  pc.getTransceivers().forEach((t) => {
    if (t.sender.track && (t.direction === "recvonly" || t.direction === "inactive")) {
      t.direction = "sendrecv";
    }
  });

  // If we added tracks and connection is stable, manually trigger renegotiation
  if (tracksAdded && pc.signalingState === "stable") {
    console.log(`[WebRTC] Triggering renegotiation for ${remoteSocketId}`);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendVideoSignal({
        to: remoteSocketId,
        from: videoSocket.id ?? "",
        roomId,
        signal: { type: "offer", sdp: offer },
      });
      console.log(`[WebRTC] Renegotiation offer sent to ${remoteSocketId}`);
    } catch (err) {
      console.error("[WebRTC] Renegotiation failed", err);
    }
  }
};

/**
 * Create and send an SDP offer to a remote peer.
 *
 * @param {string} roomId Current room id.
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 */
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

/**
 * Handle an incoming offer with "perfect negotiation" rules: ignore collisions when impolite,
 * rollback when polite, then set remote description and reply with an answer.
 *
 * @param {string} roomId Current room id.
 * @param {string} from Remote socket id.
 * @param {RTCSessionDescriptionInit} offer Incoming offer SDP.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 */
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
      // Impolite side: ignore incoming offer and keep trying to send ours.
      return;
    }

    // Polite side: rollback local offer so we can accept the remote one.
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

  // Drain queued ICE candidates that arrived before remote SDP was set.
  while (meta.pendingCandidates.length) {
    const candidate = meta.pendingCandidates.shift();
    if (candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
};

/**
 * Handle an incoming SDP answer for an existing peer connection.
 *
 * @param {string} from Remote socket id.
 * @param {RTCSessionDescriptionInit} answer SDP answer.
 * @param {PeerMap} peers Map of peer connections.
 */
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

/**
 * Handle an incoming ICE candidate for a peer.
 *
 * @param {string} from Remote socket id.
 * @param {RTCIceCandidateInit} candidate ICE candidate.
 * @param {PeerMap} peers Map of peer connections.
 */
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

/**
 * Close and clean up a single peer connection and its media element.
 *
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaElementsMap} medias Map of media elements keyed by socket id.
 */
export const closePeer = (remoteSocketId: string, peers: PeerMap, medias: MediaElementsMap) => {
  peers[remoteSocketId]?.close();
  delete peers[remoteSocketId];
  if (medias[remoteSocketId]) {
    medias[remoteSocketId].pause();
    medias[remoteSocketId].srcObject = null;
    delete medias[remoteSocketId];
  }
};

/**
 * Close all peer connections and clear media references.
 *
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaElementsMap} medias Map of media elements keyed by socket id.
 */
export const cleanupAllPeers = (peers: PeerMap, medias: MediaElementsMap) => {
  Object.keys(peers).forEach((id) => closePeer(id, peers, medias));
};
