import { io } from "socket.io-client";
/**
 * Socket.IO client dedicated to voice/WebRTC signaling.
 * Falls back to the chat socket URL when a dedicated voice endpoint is not provided.
 */
const VOICE_URL = import.meta.env.VITE_VOICE_SOCKET_URL ||
    import.meta.env.VITE_CHAT_SOCKET_URL ||
    (import.meta.env.DEV
        ? "http://localhost:3002"
        : "https://backend-meet-chat.onrender.com");
const voiceSocket = io(VOICE_URL, {
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
const subscribe = (event, handler) => {
    voiceSocket.off(event, handler);
    voiceSocket.on(event, handler);
    return () => voiceSocket.off(event, handler);
};
/** Open the voice signaling socket. */
export const connectVoiceSocket = () => voiceSocket.connect();
/** Close the voice signaling socket. */
export const disconnectVoiceSocket = () => voiceSocket.disconnect();
/** Join a voice room (by meeting ID) with user metadata. */
export const joinVoiceRoom = (roomId, userInfo) => voiceSocket.emit("join:room", roomId, userInfo);
/** Receive the existing voice participants. */
export const onVoiceExistingUsers = (handler) => subscribe("existing:users", handler);
/** Fired when a participant joins the voice room. */
export const onVoiceUserJoined = (handler) => subscribe("user:joined", handler);
/** Fired when a participant leaves the voice room. */
export const onVoiceUserLeft = (handler) => subscribe("user:left", handler);
/** Fired when the room reaches capacity. */
export const onVoiceRoomFull = (handler) => subscribe("room:full", handler);
/** Fired when the socket connects. */
export const onVoiceConnect = (handler) => subscribe("connect", handler);
/** Fired when the socket disconnects. */
export const onVoiceDisconnect = (handler) => subscribe("disconnect", handler);
/** Fired when a socket error occurs. */
export const onVoiceError = (handler) => subscribe("connect_error", handler);
/** Send a WebRTC offer to a peer. */
export const sendWebrtcOffer = (payload) => voiceSocket.emit("webrtc:offer", payload);
/** Send a WebRTC answer to a peer. */
export const sendWebrtcAnswer = (payload) => voiceSocket.emit("webrtc:answer", payload);
/** Send an ICE candidate to a peer. */
export const sendVoiceIceCandidate = (payload) => voiceSocket.emit("webrtc:ice-candidate", payload);
/** Handle incoming WebRTC offers. */
export const onVoiceWebrtcOffer = (handler) => subscribe("webrtc:offer", handler);
/** Handle incoming WebRTC answers. */
export const onVoiceWebrtcAnswer = (handler) => subscribe("webrtc:answer", handler);
/** Handle incoming ICE candidates. */
export const onVoiceWebrtcCandidate = (handler) => subscribe("webrtc:ice-candidate", handler);
/** Broadcast that the local user muted/unmuted audio or video. */
export const sendVoiceMediaToggle = (payload) => voiceSocket.emit("media:toggle", payload);
/** Listen for remote peers toggling audio/video. */
export const onVoicePeerMediaToggle = (handler) => subscribe("peer:media-toggle", handler);
export { voiceSocket };
