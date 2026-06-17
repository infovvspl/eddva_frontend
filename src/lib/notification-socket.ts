import { io, type Socket } from "socket.io-client";
import { getApiOrigin } from "@/lib/api-config";

function getDeploymentSocketOrigin(): string | null {
  if (typeof window === "undefined") return null;

  const { protocol, hostname } = window.location;
  const host = hostname.toLowerCase();

  if (host === "dev.eddva.in") return `${protocol}//dev-api.eddva.in`;
  if (host === "eddva.in" || host === "www.eddva.in" || host.endsWith(".eddva.in")) {
    if (host !== "api.eddva.in" && host !== "dev-api.eddva.in") {
      return `${protocol}//api.eddva.in`;
    }
  }

  return null;
}

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
  const inferredDeploymentOrigin =
    apiOrigin === window.location.origin ? getDeploymentSocketOrigin() : null;
  const base = explicit || inferredDeploymentOrigin || apiOrigin || window.location.origin;

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
