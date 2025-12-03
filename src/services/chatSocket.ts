import { io, Socket } from "socket.io-client";

/**
 * Socket.IO client used for chat signaling.
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
 * Subscribes to a socket event and returns an unsubscribe function.
 *
 * @param {string} event Socket event name.
 * @param {(payload: TPayload) => void} handler Callback for the event payload.
 * @returns {() => void} Cleanup function to remove the listener.
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
 * Opens the chat socket connection.
 */
export const connectSocket = () => socket.connect();

/**
 * Disconnects the chat socket connection.
 */
export const disconnectSocket = () => socket.disconnect();

/**
 * Joins a chat room with user metadata.
 *
 * @param {string} roomId Meeting/room identifier.
 * @param {ChatUserInfo} userInfo Metadata for the joining user.
 */
export const joinRoom = (roomId: string, userInfo: ChatUserInfo) =>
  socket.emit("join:room", roomId, userInfo);

/**
 * Emits a chat message to the current room.
 *
 * @param {ChatMessagePayload} payload Message content.
 */
export const sendChatMessage = (payload: ChatMessagePayload) =>
  socket.emit("chat:message", payload);

/**
 * Subscribes to the initial participant list when joining a room.
 */
export const onExistingUsers = (handler: (users: ChatParticipant[]) => void) =>
  subscribe("existing:users", handler);

/**
 * Subscribes to a participant join event.
 */
export const onUserJoined = (
  handler: (data: ChatParticipant) => void
) => subscribe("user:joined", handler);

/**
 * Subscribes to a participant leave event.
 */
export const onUserLeft = (
  handler: (data: ChatParticipant) => void
) => subscribe("user:left", handler);

/**
 * Subscribes to incoming chat messages.
 */
export const onChatMessage = (
  handler: (data: ChatMessagePayload) => void
) => subscribe("chat:message", handler);

/**
 * Subscribes to the "room is full" event.
 */
export const onRoomFull = (handler: () => void) =>
  subscribe("room:full", handler);

/**
 * Subscribes to socket connect.
 */
export const onSocketConnect = (handler: () => void) =>
  subscribe("connect", handler);

/**
 * Subscribes to socket disconnect.
 */
export const onSocketDisconnect = (handler: () => void) =>
  subscribe("disconnect", handler);

/**
 * Subscribes to socket connection errors.
 */
export const onSocketError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler);

export { socket };
