import { io } from "socket.io-client";
const DEFAULT_DEV_URL = "http://localhost:3002";
const DEFAULT_PROD_URL = "https://backend-meet-voice.onrender.com";
const rawVoiceUrl = import.meta.env.VITE_VOICE_SOCKET_URL ||
    (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);
// Adjust scheme to wss/https when the page is https (avoid mixed content).
const voiceSocketUrl = typeof window === "undefined"
    ? rawVoiceUrl
    : (() => {
        const isHttpsPage = window.location.protocol === "https:";
        if (!isHttpsPage)
            return rawVoiceUrl;
        // Allow http on https page only when pointing to localhost (dev).
        if (rawVoiceUrl.startsWith("http://localhost"))
            return rawVoiceUrl;
        return rawVoiceUrl.startsWith("http://")
            ? rawVoiceUrl.replace(/^http:/, "https:")
            : rawVoiceUrl;
    })();
const forcePolling = (import.meta.env.VITE_VOICE_FORCE_POLLING ?? "")
    .toString()
    .toLowerCase() === "true";
const transports = forcePolling ? ["polling"] : ["polling", "websocket"];
const voiceSocket = io(voiceSocketUrl, {
    autoConnect: false,
    forceNew: true, // avoid reusing stale managers and wrong paths
    // start with polling; upgrade to websocket unless polling-only is forced
    transports,
    upgrade: !forcePolling,
    reconnection: true,
    reconnectionDelayMax: 5000,
    path: "/socket.io",
});
const subscribe = (event, handler) => {
    voiceSocket.off(event, handler);
    voiceSocket.on(event, handler);
    return () => voiceSocket.off(event, handler);
};
/**
 * Open the voice socket connection.
 */
export const connectVoiceSocket = () => voiceSocket.connect();
/**
 * Close the voice socket connection.
 */
export const disconnectVoiceSocket = () => voiceSocket.disconnect();
/**
 * Join a voice room with user metadata.
 *
 * @param {string} roomId Room identifier.
 * @param {VoiceUserInfo} userInfo User info for peers.
 */
export const joinVoiceRoom = (roomId, userInfo) => voiceSocket.emit("join:room", roomId, userInfo);
/**
 * Listen for the existing participants in the room.
 */
export const onVoiceExistingUsers = (handler) => subscribe("existing:users", handler);
/**
 * Listen for users joining.
 */
export const onVoiceUserJoined = (handler) => subscribe("user:joined", handler);
/**
 * Listen for users leaving.
 */
export const onVoiceUserLeft = (handler) => subscribe("user:left", handler);
/**
 * Listen for room-full events.
 */
export const onVoiceRoomFull = (handler) => subscribe("room:full", handler);
/**
 * Listen for socket connect events.
 */
export const onVoiceConnect = (handler) => subscribe("connect", handler);
/**
 * Listen for socket disconnect events.
 */
export const onVoiceDisconnect = (handler) => subscribe("disconnect", handler);
/**
 * Listen for socket errors.
 */
export const onVoiceError = (handler) => subscribe("connect_error", handler);
/**
 * Send a WebRTC offer to a peer.
 */
export const sendWebrtcOffer = (payload) => voiceSocket.emit("webrtc:offer", payload);
/**
 * Send a WebRTC answer to a peer.
 */
export const sendWebrtcAnswer = (payload) => voiceSocket.emit("webrtc:answer", payload);
/**
 * Send ICE candidate to a peer.
 */
export const sendVoiceIceCandidate = (payload) => voiceSocket.emit("webrtc:ice-candidate", payload);
/**
 * Listen for incoming WebRTC offers.
 */
export const onVoiceWebrtcOffer = (handler) => subscribe("webrtc:offer", handler);
/**
 * Listen for incoming WebRTC answers.
 */
export const onVoiceWebrtcAnswer = (handler) => subscribe("webrtc:answer", handler);
/**
 * Listen for incoming ICE candidates.
 */
export const onVoiceWebrtcCandidate = (handler) => subscribe("webrtc:ice-candidate", handler);
/**
 * Broadcast local media toggle state.
 */
export const sendVoiceMediaToggle = (payload) => voiceSocket.emit("media:toggle", payload);
/**
 * Listen for peers toggling audio/video.
 */
export const onVoicePeerMediaToggle = (handler) => subscribe("peer:media-toggle", handler);
export { voiceSocket, voiceSocketUrl };
