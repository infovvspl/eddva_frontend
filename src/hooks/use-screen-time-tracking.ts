import { useEffect, useRef } from "react";
import { apiClient, tokenStorage } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api-config";
import { useAuth } from "@/context/SchoolAuthContext";

// Same event set use-idle-logout.ts listens for, so both hooks agree on what
// "active" means — touchstart/touchmove cover mobile browsers, the rest cover
// desktop.
const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "touchmove", "click"] as const;
const HEARTBEAT_INTERVAL_MS = 30_000;
// A tab left open with nobody touching it must not keep racking up screen
// time — only send a heartbeat if something happened recently.
const ACTIVE_WINDOW_MS = 60_000;
const HEARTBEAT_URL = `${getApiBaseUrl()}/school/screen-time/heartbeat`;

/**
 * Reports this user's active screen time to the backend every ~30s while the
 * tab is visible and they've actually interacted recently — pauses the
 * instant they go idle or switch away. Mounted once per portal layout
 * (student, teacher, admin — see each layout's root component); tracks every
 * school role the same way, since the parent panel and the institute admin's
 * consolidated report both read from the same per-user totals.
 */
export function useScreenTimeTracking() {
  const { isAuthenticated } = useAuth();
  const lastActivityAt = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onActivity = () => { lastActivityAt.current = Date.now(); };

    const wasRecentlyActive = () =>
      document.visibilityState === "visible" && Date.now() - lastActivityAt.current < ACTIVE_WINDOW_MS;

    // Mobile browsers (and desktop ones) can kill an in-flight request the
    // instant a tab backgrounds or the page starts unloading — `keepalive`
    // is the fetch flag built for exactly that. navigator.sendBeacon can't
    // be used instead: it can't carry the Authorization header this backend
    // requires, only an unauthenticated body.
    const sendFinalHeartbeat = () => {
      const token = tokenStorage.getAccess();
      if (!token) return;
      try {
        void fetch(HEARTBEAT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      } catch { /* keepalive unsupported in this browser — the next tick just won't fire */ }
    };

    const tick = () => {
      if (wasRecentlyActive()) void apiClient.post("/school/screen-time/heartbeat").catch(() => {});
    };

    // Credits the active stretch right up to the moment the tab backgrounds
    // or the page unloads, instead of waiting for the next 30s tick — which,
    // once the tab is hidden, may never fire for it again at all.
    const onGoingAway = () => { if (wasRecentlyActive()) sendFinalHeartbeat(); };
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") onGoingAway(); };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onGoingAway);

    onActivity(); // mounting the portal layout itself counts as activity
    const timer = setInterval(tick, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onGoingAway);
    };
  }, [isAuthenticated]);
}
