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

export const connectVideoSocket = () => videoSocket.connect();
export const disconnectVideoSocket = () => videoSocket.disconnect();

export const joinVideoRoom = (roomId: string, user: VideoUserInfo) =>
  videoSocket.emit("join:room", roomId, user.userId, user.displayName, user.photoURL);

export const leaveVideoRoom = (roomId: string) => videoSocket.emit("leave:room", roomId);

export const onVideoConnect = (handler: () => void) => subscribe("connect", handler);
export const onVideoDisconnect = (handler: () => void) => subscribe("disconnect", handler);
export const onVideoError = (handler: (err: Error) => void) =>
  subscribe("connect_error", handler as any);
export const onVideoRoomFull = (handler: () => void) => subscribe("room:full", handler);
export const onVideoRoomError = (handler: (message: string) => void) =>
  subscribe("room:error", handler);

export const onVideoRoomJoined = (
  handler: (payload: { roomId: string; existingUsers: VideoParticipant[] }) => void
) => subscribe("room:joined", handler);

export const onVideoUserJoined = (
  handler: (payload: VideoParticipant) => void
) => subscribe("user:joined", handler);

export const onVideoUserLeft = (handler: (socketId: string) => void) =>
  subscribe("user:left", handler);

export const sendVideoSignal = (payload: SignalPayload) =>
  videoSocket.emit("signal", payload);

export const onVideoSignal = (handler: (payload: Omit<SignalPayload, "to">) => void) =>
  subscribe("signal", handler);

export const sendVideoMediaState = (payload: {
  roomId: string;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
}) => videoSocket.emit("media:state", payload);

export const onVideoMediaState = (handler: (payload: MediaState) => void) =>
  subscribe("media:state", handler as any);

export const onVideoMediaStates = (
  handler: (payload: Record<string, MediaState>) => void
) => subscribe("media:states", handler);

export const sendVideoScreenShare = (payload: { roomId: string; sharing: boolean }) =>
  videoSocket.emit("screen:share", payload);

export const onVideoScreenShare = (
  handler: (payload: { socketId: string; sharing: boolean; displayName?: string; photoURL?: string }) => void
) => subscribe("screen:share", handler);

export const sendVideoChatMessage = (payload: { roomId: string; userId: string; message: string }) =>
  videoSocket.emit("chat:message", payload);

export const onVideoChatMessage = (handler: (payload: ChatMessage) => void) =>
  subscribe("chat:message", handler);

export { videoSocket, videoSocketUrl };
