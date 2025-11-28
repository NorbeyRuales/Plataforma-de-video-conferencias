import { io, Socket } from "socket.io-client";

const VOICE_URL =
  import.meta.env.VITE_VOICE_SOCKET_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3002"
    : "https://backend-meet-voice.onrender.com");

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

const voiceSocket: Socket = io(VOICE_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"], // preferir websocket en prod para menor latencia
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

export { voiceSocket };
