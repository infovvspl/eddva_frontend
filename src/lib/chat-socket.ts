import { io, type Socket } from "socket.io-client";

/**
 * Connect to the school chat realtime namespace (`/chat`).
 *
 * Socket.IO uses the `/socket.io` path, which the Vite dev server proxies to
 * the backend (and a reverse proxy forwards in production), so connecting to
 * the same origin reaches the NestJS gateway on whichever port it runs.
 */
export function createChatSocket(): Socket {
  const socket = io(`${window.location.origin}/chat`, {
    transports: ["websocket", "polling"],
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
