import { io, Socket } from "socket.io-client";

const DEFAULT_DEV_URL = "http://localhost:9000";
const DEFAULT_PROD_URL = "https://your-video-backend.example.com";

const rawVideoUrl =
  import.meta.env.VITE_VIDEO_SOCKET_URL ||
  (import.meta.env.DEV ? DEFAULT_DEV_URL : DEFAULT_PROD_URL);

const videoSocketUrl =
  typeof window === "undefined"
    ? rawVideoUrl
    : (() => {
        const isHttpsPage = window.location.protocol === "https:";
        if (!isHttpsPage) return rawVideoUrl;
        if (rawVideoUrl.startsWith("http://localhost")) return rawVideoUrl;
        return rawVideoUrl.startsWith("http://")
          ? rawVideoUrl.replace(/^http:/, "https:")
          : rawVideoUrl;
      })();

export type VideoUserInfo = {
  userId: string;
  displayName: string;
  photoURL?: string;
};

export type VideoParticipant = {
  socketId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
};

export type MediaState = {
  socketId?: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing?: boolean;
};

export type SignalPayload = {
  to: string;
  from: string;
  signal: any;
  roomId: string;
};

export type ChatMessage = {
  userId: string;
  message: string;
  timestamp: string;
};

const videoSocket: Socket = io(videoSocketUrl, {
  autoConnect: false,
  transports: ["websocket"],
});

const subscribe = <T>(event: string, handler: (payload: T) => void) => {
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
export const joinVideoRoom = (roomId: string, user: VideoUserInfo) =>
  videoSocket.emit("join:room", roomId, user.userId, user.displayName, user.photoURL);

/**
 * Leave a video room.
 *
 * @param {string} roomId Room identifier.
 */
export const leaveVideoRoom = (roomId: string) => videoSocket.emit("leave:room", roomId);

/**
 * Listen for socket connect event.
 */
export const onVideoConnect = (handler: () => void) => subscribe("connect", handler);

/**
 * Listen for socket disconnect event.
 */
export const onVideoDisconnect = (handler: () => void) => subscribe("disconnect", handler);

/**
 * Listen for socket errors.
 */
export const onVideoError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler as any);

/**
 * Listen for room-full errors.
 */
export const onVideoRoomFull = (handler: () => void) => subscribe("room:full", handler);

/**
 * Listen for generic room errors.
 */
export const onVideoRoomError = (handler: (message: string) => void) =>
  subscribe("room:error", handler);

/**
 * Listen for confirmation that the room was joined.
 */
export const onVideoRoomJoined = (
  handler: (payload: { roomId: string; existingUsers: VideoParticipant[] }) => void
) => subscribe("room:joined", handler);

/**
 * Listen for a participant joining.
 */
export const onVideoUserJoined = (
  handler: (payload: VideoParticipant) => void
) => subscribe("user:joined", handler);

/**
 * Listen for a participant leaving.
 */
export const onVideoUserLeft = (handler: (socketId: string) => void) =>
  subscribe("user:left", handler);

/**
 * Send a signaling payload to another peer.
 */
export const sendVideoSignal = (payload: SignalPayload) =>
  videoSocket.emit("signal", payload);

/**
 * Listen for incoming signaling messages.
 */
export const onVideoSignal = (handler: (payload: Omit<SignalPayload, "to">) => void) =>
  subscribe("signal", handler);

/**
 * Broadcast local media state to the room.
 */
export const sendVideoMediaState = (payload: {
  roomId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}) => videoSocket.emit("media:state", payload);

/**
 * Listen for a single participant's media state change.
 */
export const onVideoMediaState = (handler: (payload: MediaState) => void) =>
  subscribe("media:state", handler as any);

/**
 * Listen for the full map of media states.
 */
export const onVideoMediaStates = (
  handler: (payload: Record<string, MediaState>) => void
) => subscribe("media:states", handler);

/**
 * Broadcast screen share state.
 */
export const sendVideoScreenShare = (payload: { roomId: string; sharing: boolean }) =>
  videoSocket.emit("screen:share", payload);

/**
 * Listen for peer screen share events.
 */
export const onVideoScreenShare = (
  handler: (payload: { socketId: string; sharing: boolean; displayName?: string; photoURL?: string }) => void
) => subscribe("screen:share", handler);

/**
 * Send a chat message within the meeting room.
 */
export const sendVideoChatMessage = (payload: { roomId: string; userId: string; message: string }) =>
  videoSocket.emit("chat:message", payload);

/**
 * Listen for incoming meeting-room chat messages.
 */
export const onVideoChatMessage = (handler: (payload: ChatMessage) => void) =>
  subscribe("chat:message", handler);

export { videoSocket, videoSocketUrl };
