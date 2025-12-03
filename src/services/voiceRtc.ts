import {
  sendVoiceIceCandidate,
  sendWebrtcAnswer,
  sendWebrtcOffer,
  voiceSocket,
} from "./voiceSocket";

const DEFAULT_STUN =
  import.meta.env.VITE_STUN_URL || "stun:stun.l.google.com:19302";

const DEFAULT_TURNS: RTCIceServer[] =
  import.meta.env.VITE_TURN_URL &&
  import.meta.env.VITE_TURN_USERNAME &&
  import.meta.env.VITE_TURN_CREDENTIAL
    ? import.meta.env.VITE_TURN_URL.split(",")
        .map((url: string) => url.trim())
        .filter((url: string): url is string => Boolean(url))
        .map((urls: string): RTCIceServer => ({
          urls,
          username: import.meta.env.VITE_TURN_USERNAME as string,
          credential: import.meta.env.VITE_TURN_CREDENTIAL as string,
        }))
    : [
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

/**
 * Attaches a remote MediaStream to (and lazily creates) an <audio> element.
 *
 * @param {string} remoteId Remote peer socket id.
 * @param {MediaStream} stream Incoming audio stream.
 * @param {AudioElementsMap} audioMap Cache of remote audio elements.
 */
export const playRemoteStream = (
  remoteId: string,
  stream: MediaStream,
  audioMap: AudioElementsMap
) => {
  console.log("[voice] playRemoteStream", remoteId, stream);
  let audio = audioMap[remoteId];

  if (!audio) {
    audio = document.createElement("audio");
    audio.autoplay = true;
    audio.controls = false;
    audio.muted = false;
    audio.setAttribute("playsinline", "");
    audio.preload = "auto";
    document.body.appendChild(audio);
    audioMap[remoteId] = audio;
  }

  audio.srcObject = stream;

  const tryPlay = async (attempt = 0) => {
    try {
      await audio.play();
      console.log("[voice] Remote audio playing for", remoteId);
    } catch (err) {
      console.warn("[voice] Play blocked, attempt:", attempt, err);
      if (attempt < 8) {
        setTimeout(() => tryPlay(attempt + 1), 350);
      }
    }
  };

  tryPlay();
};

/**
 * Builds the ICE server list from env vars, falling back to public STUN/TURN.
 *
 * @returns {RTCIceServer[]} ICE server definitions.
 */
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

/**
 * Returns an existing RTCPeerConnection for a peer or creates one and wires up handlers.
 *
 * @param {string} remoteSocketId Target peer socket id.
 * @param {PeerMap} peers Map of active peer connections keyed by socket id.
 * @param {MediaStream | null} localStream Local microphone stream.
 * @param {(remoteId: string, stream: MediaStream) => void} onRemoteStream Callback when a remote track arrives.
 * @returns {RTCPeerConnection} The ensured peer connection.
 */
export const ensurePeerConnection = (
  remoteSocketId: string,
  peers: PeerMap,
  localStream: MediaStream | null,
  onRemoteStream: (remoteId: string, stream: MediaStream) => void
): RTCPeerConnection => {
  let pc = peers[remoteSocketId];

  if (!pc) {
    const forceRelay =
      (import.meta.env.VITE_FORCE_TURN ?? import.meta.env.VITE_FORCE_RELAY ?? "")
        .toString()
        .toLowerCase() === "true";

    pc = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceTransportPolicy: forceRelay ? "relay" : "all",
    });
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
        onRemoteStream(remoteSocketId, remoteStream);
      }
    };

    peers[remoteSocketId] = pc;
  }

  if (localStream) {
    const existingAudioSenders = pc
      .getSenders()
      .filter((sender) => sender.track && sender.track.kind === "audio")
      .map((sender) => sender.track as MediaStreamTrack);
    const existingTracks = new Set(existingAudioSenders);
    localStream.getAudioTracks().forEach((track) => {
      if (!existingTracks.has(track)) {
        pc.addTrack(track, localStream);
      }
    });
  }

  return pc;
};

/**
 * Creates and sends an SDP offer to a peer.
 */
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

/**
 * Handles an incoming SDP offer and replies with an answer.
 */
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

/**
 * Handles an incoming SDP answer.
 */
export const handleIncomingAnswer = async (
  from: string,
  answer: RTCSessionDescriptionInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
};

/**
 * Handles an incoming ICE candidate message.
 */
export const handleIncomingCandidate = async (
  from: string,
  candidate: RTCIceCandidateInit,
  peers: PeerMap
) => {
  const pc = peers[from];
  if (!pc || !candidate) return;
  await pc.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
 * Tears down a specific peer connection and removes associated audio element.
 */
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

/**
 * Closes all peer connections and cleans up audio elements.
 */
export const cleanupAllPeers = (peers: PeerMap, audios: AudioElementsMap) => {
  Object.keys(peers).forEach((id) => closePeer(id, peers, audios));
};
