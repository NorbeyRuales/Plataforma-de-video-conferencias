import { io } from "socket.io-client";
const CHAT_URL = import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:3000";
// Single socket instance for the entire app.
const socket = io(CHAT_URL, {
    autoConnect: false,
    transports: ["websocket"],
});
const subscribe = (event, handler) => {
    socket.off(event, handler);
    socket.on(event, handler);
    return () => socket.off(event, handler);
};
/**
 * Open the chat socket connection.
 */
export const connectSocket = () => socket.connect();
/**
 * Close the chat socket connection.
 */
export const disconnectSocket = () => socket.disconnect();
/**
 * Join a chat room with user metadata.
 *
 * @param {string} roomId Room identifier.
 * @param {ChatUserInfo} userInfo User info to broadcast.
 */
export const joinRoom = (roomId, userInfo) => socket.emit("join:room", roomId, userInfo);
/**
 * Send a chat message to the current room.
 *
 * @param {ChatMessagePayload} payload Message payload.
 */
export const sendChatMessage = (payload) => socket.emit("chat:message", payload);
/**
 * Listen for the initial list of users in the room.
 */
export const onExistingUsers = (handler) => subscribe("existing:users", handler);
/**
 * Listen for a user joining the room.
 */
export const onUserJoined = (handler) => subscribe("user:joined", handler);
/**
 * Listen for a user leaving the room.
 */
export const onUserLeft = (handler) => subscribe("user:left", handler);
/**
 * Listen for incoming chat messages.
 */
export const onChatMessage = (handler) => subscribe("chat:message", handler);
/**
 * Listen for room-full events.
 */
export const onRoomFull = (handler) => subscribe("room:full", handler);
/**
 * Listen for successful socket connections.
 */
export const onSocketConnect = (handler) => subscribe("connect", handler);
/**
 * Listen for socket disconnections.
 */
export const onSocketDisconnect = (handler) => subscribe("disconnect", handler);
/**
 * Listen for socket connection errors.
 */
export const onSocketError = (handler) => subscribe("connect_error", handler);
export { socket };
