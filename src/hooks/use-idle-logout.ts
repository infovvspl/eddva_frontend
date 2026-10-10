import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/SchoolAuthContext";

// Single source of truth for "how long is a school session allowed to sit
// idle" on the frontend — must stay in step with the backend's own default
// (SCHOOL_IDLE_TIMEOUT_MINUTES in school-jwt.guard.ts), which is what
// actually terminates the session; this hook exists so the user gets a
// warning and a clean redirect instead of their next click just 401ing.
const IDLE_TIMEOUT_MS = 30 * 60_000;
const WARNING_BEFORE_MS = 60_000;

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"] as const;
// Activity fires far too often (mousemove especially) to reset two timers and
// re-check a toast on every event; only the first event in each window does.
const ACTIVITY_RESET_THROTTLE_MS = 5_000;
// Keeps the server's auth_sessions.last_active_at from drifting too far behind
// real activity when a page makes few/no API calls on its own — piggybacked on
// activity rather than a bare interval, so a genuinely idle tab sends nothing
// and the server and client idle clocks stay in agreement.
const HEARTBEAT_INTERVAL_MS = 5 * 60_000;

/**
 * Logs the user out after IDLE_TIMEOUT_MS of no mouse/keyboard/touch/scroll
 * activity, with a toast warning WARNING_BEFORE_MS before it happens. No-op
 * whenever there's no active session (nothing to time out on /login etc.).
 */
export function useIdleLogout() {
  const { isAuthenticated, logout } = useAuth();
  const warnTimer = useRef<ReturnType<typeof setTimeout>>();
  const logoutTimer = useRef<ReturnType<typeof setTimeout>>();
  const warningToastId = useRef<string | number | null>(null);
  const lastResetAt = useRef(0);
  const lastHeartbeatAt = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const dismissWarning = () => {
      if (warningToastId.current != null) {
        toast.dismiss(warningToastId.current);
        warningToastId.current = null;
      }
    };

    const scheduleTimers = () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      dismissWarning();

      warnTimer.current = setTimeout(() => {
        warningToastId.current = toast.warning(
          "You'll be signed out in 1 minute due to inactivity.",
          {
            duration: WARNING_BEFORE_MS,
            action: { label: "Stay signed in", onClick: () => scheduleTimers() },
          },
        );
      }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

      logoutTimer.current = setTimeout(() => {
        dismissWarning();
        logout("idle_timeout");
      }, IDLE_TIMEOUT_MS);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastResetAt.current >= ACTIVITY_RESET_THROTTLE_MS) {
        lastResetAt.current = now;
        scheduleTimers();
      }
      if (now - lastHeartbeatAt.current >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatAt.current = now;
        apiClient.get("/school/auth/me").catch(() => {});
      }
    };

    scheduleTimers();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      if (warnTimer.current) clearTimeout(warnTimer.current);
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      dismissWarning();
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- logout is stable per auth state; re-running per render would thrash the timers
  }, [isAuthenticated]);
}
