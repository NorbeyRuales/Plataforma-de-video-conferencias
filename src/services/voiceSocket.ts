import { io, Socket } from "socket.io-client";

/**
 * Socket.IO client used for audio/WebRTC signaling.
 */
const DEFAULT_DEV_URL = "http://localhost:3002";
const DEFAULT_PROD_URL = "https://backend-meet-voice.onrender.com";

const rawVoiceUrl =
  import.meta.env.VITE_VOICE_SOCKET_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

// Normalize scheme to wss/https when the page runs over https (avoid mixed content).
const voiceSocketUrl =
  typeof window === "undefined"
    ? rawVoiceUrl
    : (() => {
        const isHttpsPage = window.location.protocol === "https:";
        if (!isHttpsPage) return rawVoiceUrl;
        // Allow http local endpoints when running on localhost during development.
        if (rawVoiceUrl.startsWith("http://localhost")) return rawVoiceUrl;
        return rawVoiceUrl.startsWith("http://")
          ? rawVoiceUrl.replace(/^http:/, "https:")
          : rawVoiceUrl;
      })();

const forcePolling =
  (import.meta.env.VITE_VOICE_FORCE_POLLING ?? "")
    .toString()
    .toLowerCase() === "true";

const transports = forcePolling ? ["polling"] : ["polling", "websocket"];

export type VoiceUserInfo = {
  userId: string;
  displayName: string;
  photoURL?: string;
};

export type VoiceParticipant = {
  socketId: string;
  userInfo: VoiceUserInfo;
};

export type WebrtcOfferPayload = {
  to: string;
  from: string;
  offer: RTCSessionDescriptionInit;
};

export type WebrtcAnswerPayload = {
  to: string;
  from: string;
  answer: RTCSessionDescriptionInit;
};

export type WebrtcIceCandidatePayload = {
  to: string;
  from: string;
  candidate: RTCIceCandidateInit;
};

export type MediaTogglePayload = {
  roomId: string;
  type: "audio" | "video";
  enabled: boolean;
};

const voiceSocket: Socket = io(voiceSocketUrl, {
  autoConnect: false,
  forceNew: true, // avoid reusing stale managers or incorrect namespaces
  // start in polling; if not forced to only-polling, try to upgrade to websocket
  transports,
  upgrade: !forcePolling,
  reconnection: true,
  reconnectionDelayMax: 5000,
  path: "/socket.io",
});

/**
 * Subscribes to a socket event and returns the cleanup function.
 *
 * @param {string} event Socket event name.
 * @param {(payload: TPayload) => void} handler Callback invoked on event emission.
 * @returns {() => void} Unsubscribe function.
 */
const subscribe = <TPayload>(
  event: string,
  handler: (payload: TPayload) => void
) => {
  voiceSocket.off(event, handler);
  voiceSocket.on(event, handler);
  return () => voiceSocket.off(event, handler);
};

/**
 * Opens the voice signaling socket.
 */
export const connectVoiceSocket = () => voiceSocket.connect();

/**
 * Disconnects the voice signaling socket.
 */
export const disconnectVoiceSocket = () => voiceSocket.disconnect();

/**
 * Joins a voice/WebRTC room with user metadata.
 *
 * @param {string} roomId Meeting/room identifier.
 * @param {VoiceUserInfo} userInfo Metadata for the joining user.
 */
export const joinVoiceRoom = (roomId: string, userInfo: VoiceUserInfo) =>
  voiceSocket.emit("join:room", roomId, userInfo);

/**
 * Subscribes to the current participant list sent after joining a room.
 */
export const onVoiceExistingUsers = (
  handler: (users: VoiceParticipant[]) => void
) => subscribe("existing:users", handler);

/**
 * Subscribes to participant joins.
 */
export const onVoiceUserJoined = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:joined", handler);

/**
 * Subscribes to participant leaves.
 */
export const onVoiceUserLeft = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:left", handler);

/**
 * Subscribes to the "room is full" event.
 */
export const onVoiceRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

/**
 * Subscribes to socket connect.
 */
export const onVoiceConnect = (handler: () => void) =>
  subscribe("connect", handler);

/**
 * Subscribes to socket disconnect.
 */
export const onVoiceDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

/**
 * Subscribes to connection errors.
 */
export const onVoiceError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

/**
 * Emits a WebRTC offer to another peer.
 */
export const sendWebrtcOffer = (payload: WebrtcOfferPayload) =>
  voiceSocket.emit("webrtc:offer", payload);

/**
 * Emits a WebRTC answer to another peer.
 */
export const sendWebrtcAnswer = (payload: WebrtcAnswerPayload) =>
  voiceSocket.emit("webrtc:answer", payload);

/**
 * Emits an ICE candidate to another peer.
 */
export const sendVoiceIceCandidate = (payload: WebrtcIceCandidatePayload) =>
  voiceSocket.emit("webrtc:ice-candidate", payload);

/**
 * Subscribes to incoming WebRTC offers.
 */
export const onVoiceWebrtcOffer = (
  handler: (data: Omit<WebrtcOfferPayload, "to">) => void
) => subscribe("webrtc:offer", handler);

/**
 * Subscribes to incoming WebRTC answers.
 */
export const onVoiceWebrtcAnswer = (
  handler: (data: Omit<WebrtcAnswerPayload, "to">) => void
) => subscribe("webrtc:answer", handler);

/**
 * Subscribes to incoming ICE candidates.
 */
export const onVoiceWebrtcCandidate = (
  handler: (data: Omit<WebrtcIceCandidatePayload, "to">) => void
) => subscribe("webrtc:ice-candidate", handler);

/**
 * Notifies peers about media (audio/video) state changes.
 */
export const sendVoiceMediaToggle = (payload: MediaTogglePayload) =>
  voiceSocket.emit("media:toggle", payload);

/**
 * Subscribes to peer media state changes.
 */
export const onVoicePeerMediaToggle = (
  handler: (data: MediaTogglePayload & { socketId: string }) => void
) => subscribe("peer:media-toggle", handler);

export { voiceSocket, voiceSocketUrl };
