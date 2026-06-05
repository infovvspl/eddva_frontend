import { io, type Socket } from "socket.io-client";

/**
 * Connect to the school notification realtime namespace (`/notifications`).
 *
 * Socket.IO uses the `/socket.io` path, which the Vite dev server proxies to
 * the backend (and a reverse proxy forwards in production), so connecting to
 * the same origin reaches the NestJS gateway on whichever port it runs.
 */
export function createNotificationSocket(): Socket {
  const socket = io(`${window.location.origin}/notifications`, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => console.info("[notification-socket] connected", socket.id));
  socket.on("disconnect", (reason) => console.info("[notification-socket] disconnected:", reason));
  socket.on("connect_error", (err) =>
    console.error("[notification-socket] connect_error:", err.message),
  );

  return socket;
}
