import { io } from "socket.io-client";
/**
 * Endpoint used for real-time chat (Socket.IO).
 */
const CHAT_URL = import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:3000";
// Single socket instance for the entire app.
const socket = io(CHAT_URL, {
    autoConnect: false,
    transports: ["websocket"],
});
/**
 * Subscribe to a Socket.IO event and return an unsubscribe function.
 */
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
 * Join a chat room associated with a meeting ID.
 */
export const joinRoom = (roomId, userInfo) => socket.emit("join:room", roomId, userInfo);
/**
 * Emit a chat message to the room.
 */
export const sendChatMessage = (payload) => socket.emit("chat:message", payload);
/**
 * Listen for the current list of room participants.
 */
export const onExistingUsers = (handler) => subscribe("existing:users", handler);
/**
 * Listen for new participants joining the room.
 */
export const onUserJoined = (handler) => subscribe("user:joined", handler);
/**
 * Listen for participants leaving the room.
 */
export const onUserLeft = (handler) => subscribe("user:left", handler);
/**
 * Listen for incoming chat messages.
 */
export const onChatMessage = (handler) => subscribe("chat:message", handler);
/**
 * Listen for the "room full" warning (max capacity reached).
 */
export const onRoomFull = (handler) => subscribe("room:full", handler);
/**
 * Listen for socket connection events.
 */
export const onSocketConnect = (handler) => subscribe("connect", handler);
/**
 * Listen for socket disconnection events.
 */
export const onSocketDisconnect = (handler) => subscribe("disconnect", handler);
/**
 * Listen for socket errors.
 */
export const onSocketError = (handler) => subscribe("connect_error", handler);
export { socket };
