/// <reference types="vite/client" />

interface Window {
  /** Peer id of the open chat thread; read by the notification layer to suppress duplicate toasts. */
  activeChatPeerId?: string | null;
}
