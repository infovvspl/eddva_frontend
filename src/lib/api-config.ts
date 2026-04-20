/**
 * REST API base path or absolute URL.
 * - Set `VITE_API_BASE_URL` in production when the API is on another host.
 * - Omit in dev to use `/api/v1` (Vite `server.proxy` → backend).
 * - Omit in prod to use same origin `/api/v1` (reverse proxy).
 */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) {
    const normalized = raw.replace(/\/$/, "");
    if (typeof window !== "undefined") {
      try {
        const parsed = new URL(normalized, window.location.origin);
        const host = parsed.hostname.toLowerCase();
        const isLoopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
        const currentHost = window.location.hostname;
        // If app is opened over LAN IP but env points to localhost, remap to current host.
        if (isLoopback && currentHost && currentHost !== "localhost" && currentHost !== "127.0.0.1") {
          parsed.hostname = currentHost;
          return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, "");
        }
      } catch {
        // Keep original normalized value.
      }
    }
    return normalized;
  }
  if (import.meta.env.DEV) return "/api/v1";
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api/v1`;
  }
  return "http://127.0.0.1:3000/api/v1";
}

/** HTTP origin for static/media URLs (no trailing path). */
export function getApiOrigin(): string {
  const base = getApiBaseUrl();
  if (base.startsWith("/")) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  try {
    return new URL(base).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
}
