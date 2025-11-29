import { io, Socket } from "socket.io-client";

/**
 * Socket.IO client dedicated to voice/WebRTC signaling.
 * Falls back to the chat socket URL when a dedicated voice endpoint is not provided.
 */
const VOICE_URL =
  import.meta.env.VITE_VOICE_SOCKET_URL ||
  import.meta.env.VITE_CHAT_SOCKET_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3002"
    : "https://backend-meet-chat.onrender.com");

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
  // Some proxies/local setups return "Invalid frame header" on websockets; polling keeps signaling stable.
  transports: ["polling"],
  timeout: 60000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
});

/**
 * Subscribe to a Socket.IO event on the voice socket and return an unsubscribe function.
 */
const subscribe = <TPayload>(
  event: string,
  handler: (payload: TPayload) => void
) => {
  voiceSocket.off(event, handler);
  voiceSocket.on(event, handler);
  return () => voiceSocket.off(event, handler);
};

/** Open the voice signaling socket. */
export const connectVoiceSocket = () => voiceSocket.connect();
/** Close the voice signaling socket. */
export const disconnectVoiceSocket = () => voiceSocket.disconnect();

/** Join a voice room (by meeting ID) with user metadata. */
export const joinVoiceRoom = (roomId: string, userInfo: VoiceUserInfo) =>
  voiceSocket.emit("join:room", roomId, userInfo);

/** Receive the existing voice participants. */
export const onVoiceExistingUsers = (
  handler: (users: VoiceParticipant[]) => void
) => subscribe("existing:users", handler);

/** Fired when a participant joins the voice room. */
export const onVoiceUserJoined = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:joined", handler);

/** Fired when a participant leaves the voice room. */
export const onVoiceUserLeft = (
  handler: (data: VoiceParticipant) => void
) => subscribe("user:left", handler);

/** Fired when the room reaches capacity. */
export const onVoiceRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

/** Fired when the socket connects. */
export const onVoiceConnect = (handler: () => void) =>
  subscribe("connect", handler);

/** Fired when the socket disconnects. */
export const onVoiceDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

/** Fired when a socket error occurs. */
export const onVoiceError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

/** Send a WebRTC offer to a peer. */
export const sendWebrtcOffer = (payload: WebrtcOfferPayload) =>
  voiceSocket.emit("webrtc:offer", payload);

/** Send a WebRTC answer to a peer. */
export const sendWebrtcAnswer = (payload: WebrtcAnswerPayload) =>
  voiceSocket.emit("webrtc:answer", payload);

/** Send an ICE candidate to a peer. */
export const sendVoiceIceCandidate = (payload: WebrtcIceCandidatePayload) =>
  voiceSocket.emit("webrtc:ice-candidate", payload);

/** Handle incoming WebRTC offers. */
export const onVoiceWebrtcOffer = (
  handler: (data: Omit<WebrtcOfferPayload, "to">) => void
) => subscribe("webrtc:offer", handler);

/** Handle incoming WebRTC answers. */
export const onVoiceWebrtcAnswer = (
  handler: (data: Omit<WebrtcAnswerPayload, "to">) => void
) => subscribe("webrtc:answer", handler);

/** Handle incoming ICE candidates. */
export const onVoiceWebrtcCandidate = (
  handler: (data: Omit<WebrtcIceCandidatePayload, "to">) => void
) => subscribe("webrtc:ice-candidate", handler);

/** Broadcast that the local user muted/unmuted audio or video. */
export const sendVoiceMediaToggle = (payload: MediaTogglePayload) =>
  voiceSocket.emit("media:toggle", payload);

/** Listen for remote peers toggling audio/video. */
export const onVoicePeerMediaToggle = (
  handler: (data: MediaTogglePayload & { socketId: string }) => void
) => subscribe("peer:media-toggle", handler);

export { voiceSocket };
