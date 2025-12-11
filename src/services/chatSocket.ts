import { io, Socket } from "socket.io-client";

const CHAT_URL =
  import.meta.env.VITE_CHAT_SOCKET_URL || "http://localhost:3000";

export type ChatUserInfo = {
  userId: string;
  displayName: string;
  photoURL?: string;
};

export type ChatParticipant = {
  socketId: string;
  userInfo: ChatUserInfo;
};

export type ChatMessagePayload = {
  roomId: string;
  userName: string;
  message: string;
  timestamp: number;
};

// Single socket instance for the entire app.
const socket: Socket = io(CHAT_URL, {
  autoConnect: false,
  transports: ["websocket"],
});

const subscribe = <TPayload>(
  event: string,
  handler: (payload: TPayload) => void
) => {
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
export const joinRoom = (roomId: string, userInfo: ChatUserInfo) =>
  socket.emit("join:room", roomId, userInfo);

/**
 * Send a chat message to the current room.
 *
 * @param {ChatMessagePayload} payload Message payload.
 */
export const sendChatMessage = (payload: ChatMessagePayload) =>
  socket.emit("chat:message", payload);

/**
 * Listen for the initial list of users in the room.
 */
export const onExistingUsers = (handler: (users: ChatParticipant[]) => void) =>
  subscribe("existing:users", handler);

/**
 * Listen for a user joining the room.
 */
export const onUserJoined = (
  handler: (data: ChatParticipant) => void
) => subscribe("user:joined", handler);

/**
 * Listen for a user leaving the room.
 */
export const onUserLeft = (
  handler: (data: ChatParticipant) => void
) => subscribe("user:left", handler);

/**
 * Listen for incoming chat messages.
 */
export const onChatMessage = (
  handler: (data: ChatMessagePayload) => void
) => subscribe("chat:message", handler);

/**
 * Listen for room-full events.
 */
export const onRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

/**
 * Listen for successful socket connections.
 */
export const onSocketConnect = (handler: () => void) =>
  subscribe("connect", handler);

/**
 * Listen for socket disconnections.
 */
export const onSocketDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

/**
 * Listen for socket connection errors.
 */
export const onSocketError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

export { socket };
