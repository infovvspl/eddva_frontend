import { useEffect, useRef } from "react";
import { appActivityApi, sendFinalAppHeartbeat, type AppActivityCategory } from "@/lib/api/app-activity";

const TICK_MS = 1_000;
const SEND_EVERY_SECONDS = 15;
const DEFAULT_IDLE_MS = 60_000;
const INTERACTION_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"] as const;

export interface AppActivityTrackerOptions {
  category: AppActivityCategory;
  refId?: string;
  enabled?: boolean;
  /** How long without input still counts as active. Categories that are legitimately
   *  low-interaction while genuine work happens (reading, watching, writing an
   *  assignment answer on paper) should pass a generous value here — this hook
   *  never scores those by click/keystroke cadence. */
  idleMs?: number;
  /** A playing video counts as active without any input. */
  mediaPlaying?: boolean;
}

/**
 * App-wide sibling of use-activity-tracker.ts (which stays scoped to the AI
 * Study Plan and is not modified by this hook). Counts active seconds in one
 * page category and reports them to the server every 15s; a second counts
 * only while the page is visible and the user interacted recently (or a
 * video is playing). The server never credits more than the time that
 * actually passed, so this count is a claim, not the record — "verified
 * engagement" for categories that have one comes from that category's own
 * ground-truth data, read separately in the report.
 */
export function useAppActivityTracker({
  category,
  refId,
  enabled = true,
  idleMs = DEFAULT_IDLE_MS,
  mediaPlaying = false,
}: AppActivityTrackerOptions) {
  const lastInteraction = useRef(Date.now());
  const pending = useRef(0);
  const sinceSend = useRef(0);
  const scope = useRef({ category, refId });
  const playing = useRef(mediaPlaying);
  playing.current = mediaPlaying;

  useEffect(() => {
    const mark = () => {
      lastInteraction.current = Date.now();
    };
    INTERACTION_EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true, capture: true }));
    return () => INTERACTION_EVENTS.forEach((e) => window.removeEventListener(e, mark, { capture: true } as EventListenerOptions));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    scope.current = { category, refId };
    lastInteraction.current = Date.now();

    const send = (final: boolean) => {
      const seconds = pending.current;
      pending.current = 0;
      sinceSend.current = 0;
      if (seconds <= 0) return;
      const body = { ...scope.current, beats: [seconds] };
      if (final) sendFinalAppHeartbeat(body);
      else appActivityApi.heartbeat(body).catch(() => undefined); // best effort; never interrupt the page it's measuring
    };

    const tick = window.setInterval(() => {
      const visible = document.visibilityState === "visible";
      const recent = Date.now() - lastInteraction.current < idleMs;
      if (visible && (playing.current || recent)) pending.current += 1;
      sinceSend.current += 1;
      if (sinceSend.current >= SEND_EVERY_SECONDS) send(false);
    }, TICK_MS);

    const onHide = () => {
      if (document.visibilityState === "hidden") send(true);
    };
    const onPageHide = () => send(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      send(false); // leaving this category (or navigating within the app)
    };
  }, [enabled, category, refId, idleMs]);
}
