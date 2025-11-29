import { io, Socket } from "socket.io-client";

/**
 * Endpoint used for real-time chat (Socket.IO).
 */
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

/**
 * Subscribe to a Socket.IO event and return an unsubscribe function.
 */
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
 * Join a chat room associated with a meeting ID.
 */
export const joinRoom = (roomId: string, userInfo: ChatUserInfo) =>
  socket.emit("join:room", roomId, userInfo);

/**
 * Emit a chat message to the room.
 */
export const sendChatMessage = (payload: ChatMessagePayload) =>
  socket.emit("chat:message", payload);

/**
 * Listen for the current list of room participants.
 */
export const onExistingUsers = (handler: (users: ChatParticipant[]) => void) =>
  subscribe("existing:users", handler);

/**
 * Listen for new participants joining the room.
 */
export const onUserJoined = (
  handler: (data: ChatParticipant) => void
) => subscribe("user:joined", handler);

/**
 * Listen for participants leaving the room.
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
 * Listen for the "room full" warning (max capacity reached).
 */
export const onRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

/**
 * Listen for socket connection events.
 */
export const onSocketConnect = (handler: () => void) =>
  subscribe("connect", handler);

/**
 * Listen for socket disconnection events.
 */
export const onSocketDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

/**
 * Listen for socket errors.
 */
export const onSocketError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

export { socket };
