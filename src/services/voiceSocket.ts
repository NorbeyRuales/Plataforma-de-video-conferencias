import { io, Socket } from "socket.io-client";

const DEFAULT_DEV_URL = "http://localhost:3002";
const DEFAULT_PROD_URL = "https://backend-meet-voice.onrender.com";

const rawVoiceUrl =
  import.meta.env.VITE_VOICE_SOCKET_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

// Ajusta el esquema a wss/https si la página está en https (evita mixed content).
const voiceSocketUrl =
  typeof window === "undefined"
    ? rawVoiceUrl
    : (() => {
        const isHttpsPage = window.location.protocol === "https:";
        if (!isHttpsPage) return rawVoiceUrl;
        // Permite http local en https solo para localhost (dev).
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
  forceNew: true, // evita reusar managers viejos y rutas incorrectas
  // arranca en polling; si no se fuerza solo-polling, intenta upgrade a websocket
  transports,
  upgrade: !forcePolling,
  reconnection: true,
  reconnectionDelayMax: 5000,
  path: "/socket.io",
});

const subscribe = <TPayload>(
  event: string,
  handler: (payload: TPayload) => void
) => {
  voiceSocket.off(event, handler);
  voiceSocket.on(event, handler);
  return () => voiceSocket.off(event, handler);
};

export const connectVoiceSocket = () => voiceSocket.connect();
export const disconnectVoiceSocket = () => voiceSocket.disconnect();

export const joinVoiceRoom = (roomId: string, userInfo: VoiceUserInfo) =>
  voiceSocket.emit("join:room", roomId, userInfo);

export const onVoiceExistingUsers = (
  handler: (users: VoiceParticipant[]) => void
) => subscribe("existing:users", handler);

export const onVoiceUserJoined = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:joined", handler);

export const onVoiceUserLeft = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:left", handler);

export const onVoiceRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

export const onVoiceConnect = (handler: () => void) =>
  subscribe("connect", handler);

export const onVoiceDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

export const onVoiceError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

export const sendWebrtcOffer = (payload: WebrtcOfferPayload) =>
  voiceSocket.emit("webrtc:offer", payload);

export const sendWebrtcAnswer = (payload: WebrtcAnswerPayload) =>
  voiceSocket.emit("webrtc:answer", payload);

export const sendVoiceIceCandidate = (payload: WebrtcIceCandidatePayload) =>
  voiceSocket.emit("webrtc:ice-candidate", payload);

export const onVoiceWebrtcOffer = (
  handler: (data: Omit<WebrtcOfferPayload, "to">) => void
) => subscribe("webrtc:offer", handler);

export const onVoiceWebrtcAnswer = (
  handler: (data: Omit<WebrtcAnswerPayload, "to">) => void
) => subscribe("webrtc:answer", handler);

export const onVoiceWebrtcCandidate = (
  handler: (data: Omit<WebrtcIceCandidatePayload, "to">) => void
) => subscribe("webrtc:ice-candidate", handler);

export const sendVoiceMediaToggle = (payload: MediaTogglePayload) =>
  voiceSocket.emit("media:toggle", payload);

export const onVoicePeerMediaToggle = (
  handler: (data: MediaTogglePayload & { socketId: string }) => void
) => subscribe("peer:media-toggle", handler);

export { voiceSocket, voiceSocketUrl };
