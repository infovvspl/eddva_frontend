import { io, type Socket } from "socket.io-client";
import { tokenStorage } from "@/lib/api/client";

let sharedChatSocket: Socket | null = null;
let sharedChatOrigin: string | null = null;

export function ensureCoachingChatSocket(backendOrigin: string): Socket {
  const normalizedOrigin = (() => {
    try {
      return new URL(backendOrigin).origin;
    } catch {
      return backendOrigin;
    }
  })();

  const token = tokenStorage.getAccess();

  if (sharedChatSocket && sharedChatOrigin === normalizedOrigin) {
    if (!sharedChatSocket.connected) sharedChatSocket.connect();
    return sharedChatSocket;
  }

  if (sharedChatSocket) {
    sharedChatSocket.disconnect();
    sharedChatSocket = null;
  }

  sharedChatSocket = io(`${normalizedOrigin}/coaching-chat`, {
    auth: { token },
    transports: ["websocket", "polling"],
  });
  sharedChatOrigin = normalizedOrigin;
  return sharedChatSocket;
}

export function getCoachingChatSocket(): Socket | null {
  return sharedChatSocket;
}

export function disconnectCoachingChatSocket(): void {
  if (sharedChatSocket) {
    sharedChatSocket.disconnect();
    sharedChatSocket = null;
    sharedChatOrigin = null;
  }
}
