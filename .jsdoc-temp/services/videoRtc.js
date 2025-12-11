import { sendVideoSignal, videoSocket } from "./videoSocket";
const DEFAULT_STUN = "stun:stun.l.google.com:19302";
const DEFAULT_TURNS = [
    {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
    {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelayproject",
        credential: "openrelayproject",
    },
];
const peerMeta = {};
const getPeerMeta = (id) => {
    if (!peerMeta[id]) {
        peerMeta[id] = {
            makingOffer: false,
            isSettingRemote: false,
            pendingCandidates: [],
        };
    }
    return peerMeta[id];
};
/**
 * Build STUN/TURN server list from env vars with sensible defaults.
 *
 * @returns {RTCIceServer[]} ICE server configuration.
 */
export const getIceServers = () => {
    const stunUrl = import.meta.env.VITE_STUN_URL || DEFAULT_STUN;
    const turnUrls = (import.meta.env.VITE_TURN_URL || "")
        .split(",")
        .map((u) => u.trim())
        .filter((u) => Boolean(u));
    const turnUser = import.meta.env.VITE_TURN_USERNAME;
    const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
    const servers = [{ urls: stunUrl }];
    if (turnUrls.length && turnUser && turnCred) {
        turnUrls.forEach((url) => {
            servers.push({
                urls: url,
                username: turnUser,
                credential: turnCred,
            });
        });
    }
    else {
        servers.push(...DEFAULT_TURNS);
    }
    return servers;
};
/**
 * Ensure there is a peer connection for a remote participant, wiring recvonly transceivers
 * up-front and attaching local tracks when available.
 *
 * @param {string} roomId Current room id.
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 * @returns {RTCPeerConnection} Existing or newly created peer connection.
 */
export const ensurePeerConnection = (roomId, remoteSocketId, peers, localStream, onRemoteStream) => {
    let pc = peers[remoteSocketId];
    if (!pc) {
        const meta = getPeerMeta(remoteSocketId);
        const forceRelay = (import.meta.env.VITE_FORCE_TURN ?? import.meta.env.VITE_FORCE_RELAY ?? "")
            .toString()
            .toLowerCase() === "true";
        pc = new RTCPeerConnection({
            iceServers: getIceServers(),
            iceTransportPolicy: forceRelay ? "relay" : "all",
        });
        // Pre-wire audio and video receivers even if local tracks are not ready yet.
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
        pc.onicecandidate = (event) => {
            if (!event.candidate)
                return;
            const fromId = videoSocket.id ?? "";
            if (!fromId)
                return;
            sendVideoSignal({
                to: remoteSocketId,
                from: fromId,
                roomId,
                signal: { type: "candidate", candidate: event.candidate.toJSON() },
            });
        };
        pc.onnegotiationneeded = async () => {
            try {
                const metaLocal = getPeerMeta(remoteSocketId);
                if (metaLocal.makingOffer)
                    return;
                metaLocal.makingOffer = true;
                const fromId = videoSocket.id ?? "";
                if (!fromId)
                    return;
                if (pc.signalingState !== "stable")
                    return;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                sendVideoSignal({
                    to: remoteSocketId,
                    from: fromId,
                    roomId,
                    signal: { type: "offer", sdp: offer },
                });
            }
            catch (err) {
                console.error("Negotiation error", err);
            }
            finally {
                const metaLocal = getPeerMeta(remoteSocketId);
                metaLocal.makingOffer = false;
            }
        };
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (remoteStream) {
                onRemoteStream(remoteSocketId, remoteStream);
            }
        };
        peers[remoteSocketId] = pc;
    }
    if (localStream) {
        const existingTracks = new Set(pc
            .getSenders()
            .filter((sender) => sender.track)
            .map((sender) => sender.track));
        localStream.getTracks().forEach((track) => {
            if (!existingTracks.has(track)) {
                pc.addTrack(track, localStream);
            }
        });
    }
    return pc;
};
/**
 * Create and send an SDP offer to a remote peer.
 *
 * @param {string} roomId Current room id.
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 */
export const createAndSendOffer = async (roomId, remoteSocketId, peers, localStream, onRemoteStream) => {
    const pc = ensurePeerConnection(roomId, remoteSocketId, peers, localStream, onRemoteStream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendVideoSignal({
        to: remoteSocketId,
        from: videoSocket.id ?? "",
        roomId,
        signal: { type: "offer", sdp: offer },
    });
};
/**
 * Handle an incoming offer with "perfect negotiation" rules: ignore collisions when impolite,
 * rollback when polite, then set remote description and reply with an answer.
 *
 * @param {string} roomId Current room id.
 * @param {string} from Remote socket id.
 * @param {RTCSessionDescriptionInit} offer Incoming offer SDP.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaStream | null} localStream Local media stream.
 * @param {function(string, MediaStream): void} onRemoteStream Callback to attach remote stream.
 */
export const handleIncomingOffer = async (roomId, from, offer, peers, localStream, onRemoteStream) => {
    const pc = ensurePeerConnection(roomId, from, peers, localStream, onRemoteStream);
    const meta = getPeerMeta(from);
    const desc = new RTCSessionDescription(offer);
    const readyForOffer = !meta.makingOffer && (pc.signalingState === "stable" || meta.isSettingRemote);
    const offerCollision = !readyForOffer;
    if (offerCollision) {
        const selfId = videoSocket.id ?? "";
        const isPolite = selfId < from;
        if (!isPolite) {
            // Impolite side: ignore incoming offer and keep trying to send ours.
            return;
        }
        // Polite side: rollback local offer so we can accept the remote one.
        try {
            await pc.setLocalDescription({ type: "rollback" });
        }
        catch (e) {
            console.warn("Rollback failed", e);
        }
    }
    meta.isSettingRemote = true;
    await pc.setRemoteDescription(desc);
    meta.isSettingRemote = false;
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendVideoSignal({
        to: from,
        from: videoSocket.id ?? "",
        roomId,
        signal: { type: "answer", sdp: answer },
    });
    // Drain queued ICE candidates that arrived before remote SDP was set.
    while (meta.pendingCandidates.length) {
        const candidate = meta.pendingCandidates.shift();
        if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
};
/**
 * Handle an incoming SDP answer for an existing peer connection.
 *
 * @param {string} from Remote socket id.
 * @param {RTCSessionDescriptionInit} answer SDP answer.
 * @param {PeerMap} peers Map of peer connections.
 */
export const handleIncomingAnswer = async (from, answer, peers) => {
    const pc = peers[from];
    if (!pc)
        return;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    const meta = getPeerMeta(from);
    while (meta.pendingCandidates.length) {
        const candidate = meta.pendingCandidates.shift();
        if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
};
/**
 * Handle an incoming ICE candidate for a peer.
 *
 * @param {string} from Remote socket id.
 * @param {RTCIceCandidateInit} candidate ICE candidate.
 * @param {PeerMap} peers Map of peer connections.
 */
export const handleIncomingCandidate = async (from, candidate, peers) => {
    const pc = peers[from];
    if (!pc || !candidate)
        return;
    const meta = getPeerMeta(from);
    if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    else {
        meta.pendingCandidates.push(candidate);
    }
};
/**
 * Close and clean up a single peer connection and its media element.
 *
 * @param {string} remoteSocketId Target socket id.
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaElementsMap} medias Map of media elements keyed by socket id.
 */
export const closePeer = (remoteSocketId, peers, medias) => {
    peers[remoteSocketId]?.close();
    delete peers[remoteSocketId];
    if (medias[remoteSocketId]) {
        medias[remoteSocketId].pause();
        medias[remoteSocketId].srcObject = null;
        delete medias[remoteSocketId];
    }
};
/**
 * Close all peer connections and clear media references.
 *
 * @param {PeerMap} peers Map of peer connections.
 * @param {MediaElementsMap} medias Map of media elements keyed by socket id.
 */
export const cleanupAllPeers = (peers, medias) => {
    Object.keys(peers).forEach((id) => closePeer(id, peers, medias));
};
