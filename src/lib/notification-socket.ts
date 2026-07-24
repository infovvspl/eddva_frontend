import { io, type Socket } from "socket.io-client";
import { getApiOrigin } from "@/lib/api-config";

/**
 * Connect to the school notification realtime namespace (`/notifications`).
 *
 * The Socket.IO gateway runs on the API host, not the frontend origin. In a
 * split deployment (e.g. dev.eddva.in → dev-api.eddva.in) connecting to the
 * page origin fails, so we target the API origin. Order:
 *   VITE_SOCKET_URL (explicit) → API origin (from VITE_API_BASE_URL) →
 *   same origin (local dev, where Vite proxies /socket.io).
 */
export function createNotificationSocket(): Socket {
  const explicit = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
  const apiOrigin = getApiOrigin();
  const base = explicit || apiOrigin || (typeof window !== "undefined" ? window.location.origin : "");

  const socket = io(`${base}/notifications`, {
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
  socket.on("connect", () => console.info("[notification-socket] connected", socket.id));
  socket.on("disconnect", (reason) => console.info("[notification-socket] disconnected:", reason));
  socket.on("connect_error", (err) =>
    console.error("[notification-socket] connect_error:", err.message),
  );

  return socket;
}
