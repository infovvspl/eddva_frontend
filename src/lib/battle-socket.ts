import { io, type Socket } from "socket.io-client";

let sharedBattleSocket: Socket | null = null;
let sharedBattleOrigin: string | null = null;

export function ensureBattleSocket(backendOrigin: string, token: string): Socket {
  const normalizedOrigin = (() => {
    try {
      return new URL(backendOrigin).origin;
    } catch {
      return backendOrigin;
    }
  })();

  if (sharedBattleSocket && sharedBattleOrigin === normalizedOrigin) {
    if (!sharedBattleSocket.connected) sharedBattleSocket.connect();
    return sharedBattleSocket;
  }

  if (sharedBattleSocket) {
    sharedBattleSocket.disconnect();
    sharedBattleSocket = null;
  }

  sharedBattleSocket = io(`${normalizedOrigin}/battle`, {
    auth: { token },
    transports: ["websocket"],
  });
  sharedBattleOrigin = normalizedOrigin;
  return sharedBattleSocket;
}

export function getBattleSocket(): Socket | null {
  return sharedBattleSocket;
}

export function disconnectBattleSocket(): void {
  if (sharedBattleSocket) {
    sharedBattleSocket.disconnect();
    sharedBattleSocket = null;
    sharedBattleOrigin = null;
  }
}
