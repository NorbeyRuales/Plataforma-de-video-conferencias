import { io } from "socket.io-client";
const DEFAULT_DEV_URL = "http://localhost:9000";
const DEFAULT_PROD_URL = "https://your-video-backend.example.com";
const rawVideoUrl = import.meta.env.VITE_VIDEO_SOCKET_URL ||
    (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);
const videoSocketUrl = typeof window === "undefined"
    ? rawVideoUrl
    : (() => {
        const isHttpsPage = window.location.protocol === "https:";
        if (!isHttpsPage)
            return rawVideoUrl;
        if (rawVideoUrl.startsWith("http://localhost"))
            return rawVideoUrl;
        return rawVideoUrl.startsWith("http://")
            ? rawVideoUrl.replace(/^http:/, "https:")
            : rawVideoUrl;
    })();
const videoSocket = io(videoSocketUrl, {
    autoConnect: false,
    transports: ["websocket"],
});
const subscribe = (event, handler) => {
    videoSocket.off(event, handler);
    videoSocket.on(event, handler);
    return () => videoSocket.off(event, handler);
};
/**
 * Open the video socket connection.
 */
export const connectVideoSocket = () => videoSocket.connect();
/**
 * Close the video socket connection.
 */
export const disconnectVideoSocket = () => videoSocket.disconnect();
/**
 * Join a video room, announcing user identity.
 *
 * @param {string} roomId Room identifier.
 * @param {VideoUserInfo} user User metadata.
 */
export const joinVideoRoom = (roomId, user) => videoSocket.emit("join:room", roomId, user.userId, user.displayName, user.photoURL);
/**
 * Leave a video room.
 *
 * @param {string} roomId Room identifier.
 */
export const leaveVideoRoom = (roomId) => videoSocket.emit("leave:room", roomId);
/**
 * Listen for socket connect event.
 */
export const onVideoConnect = (handler) => subscribe("connect", handler);
/**
 * Listen for socket disconnect event.
 */
export const onVideoDisconnect = (handler) => subscribe("disconnect", handler);
/**
 * Listen for socket errors.
 */
export const onVideoError = (handler) => subscribe("connect_error", handler);
/**
 * Listen for room-full errors.
 */
export const onVideoRoomFull = (handler) => subscribe("room:full", handler);
/**
 * Listen for generic room errors.
 */
export const onVideoRoomError = (handler) => subscribe("room:error", handler);
/**
 * Listen for confirmation that the room was joined.
 */
export const onVideoRoomJoined = (handler) => subscribe("room:joined", handler);
/**
 * Listen for a participant joining.
 */
export const onVideoUserJoined = (handler) => subscribe("user:joined", handler);
/**
 * Listen for a participant leaving.
 */
export const onVideoUserLeft = (handler) => subscribe("user:left", handler);
/**
 * Send a signaling payload to another peer.
 */
export const sendVideoSignal = (payload) => videoSocket.emit("signal", payload);
/**
 * Listen for incoming signaling messages.
 */
export const onVideoSignal = (handler) => subscribe("signal", handler);
/**
 * Broadcast local media state to the room.
 */
export const sendVideoMediaState = (payload) => videoSocket.emit("media:state", payload);
/**
 * Listen for a single participant's media state change.
 */
export const onVideoMediaState = (handler) => subscribe("media:state", handler);
/**
 * Listen for the full map of media states.
 */
export const onVideoMediaStates = (handler) => subscribe("media:states", handler);
/**
 * Broadcast screen share state.
 */
export const sendVideoScreenShare = (payload) => videoSocket.emit("screen:share", payload);
/**
 * Listen for peer screen share events.
 */
export const onVideoScreenShare = (handler) => subscribe("screen:share", handler);
/**
 * Send a chat message within the meeting room.
 */
export const sendVideoChatMessage = (payload) => videoSocket.emit("chat:message", payload);
/**
 * Listen for incoming meeting-room chat messages.
 */
export const onVideoChatMessage = (handler) => subscribe("chat:message", handler);
export { videoSocket, videoSocketUrl };
