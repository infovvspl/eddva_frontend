import { io, type Socket } from "socket.io-client";
import { getApiOrigin } from "@/lib/api-config";

/**
 * Connect to the school chat realtime namespace (`/chat`).
 *
 * The Socket.IO gateway runs on the API host. In a split deployment
 * (dev.eddva.in → dev-api.eddva.in) the page origin has no socket server, so
 * target the API origin: VITE_SOCKET_URL → API origin → same origin (local dev).
 */
export function createChatSocket(): Socket {
  const explicit = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
  const base = explicit || getApiOrigin() || window.location.origin;

  const socket = io(`${base}/chat`, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  // Lightweight diagnostics — visible in the browser console so connection
  // problems (e.g. backend not restarted with the gateway) are obvious.
  socket.on("connect", () => console.info("[chat-socket] connected", socket.id));
  socket.on("disconnect", (reason) => console.info("[chat-socket] disconnected:", reason));
  socket.on("connect_error", (err) =>
    console.error("[chat-socket] connect_error:", err.message),
  );

  return socket;
}
