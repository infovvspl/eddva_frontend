import { useEffect, useRef } from "react";
import { learningApi, sendFinalHeartbeat, type ActivitySection } from "@/lib/api/learning-path";

const TICK_MS = 1_000;
const SEND_EVERY_SECONDS = 15;
const DEFAULT_IDLE_MS = 60_000;
const INTERACTION_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"] as const;

export interface ActivityTrackerOptions {
  section: ActivitySection;
  threadId?: string;
  stepId?: string;
  enabled?: boolean;
  /** How long without input still counts as active (notes reading allows longer). */
  idleMs?: number;
  /** A playing video counts as active without any input. */
  mediaPlaying?: boolean;
}

/**
 * Counts the student's active seconds in one section of the learning path and
 * reports them to the server every 15 s. A second counts only while the page
 * is visible and the student interacted recently (or a video is playing).
 * The server never credits more than the time that actually passed, so this
 * count is a claim, not the record.
 */
export function useActivityTracker({ section, threadId, stepId, enabled = true, idleMs = DEFAULT_IDLE_MS, mediaPlaying = false }: ActivityTrackerOptions) {
  const lastInteraction = useRef(Date.now());
  const pending = useRef(0);
  const sinceSend = useRef(0);
  const scope = useRef({ section, threadId, stepId });
  const playing = useRef(mediaPlaying);
  playing.current = mediaPlaying;

  // Interaction listeners, shared across scope changes.
  useEffect(() => {
    const mark = () => {
      lastInteraction.current = Date.now();
    };
    INTERACTION_EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true, capture: true }));
    return () => INTERACTION_EVENTS.forEach((e) => window.removeEventListener(e, mark, { capture: true } as EventListenerOptions));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    scope.current = { section, threadId, stepId };
    lastInteraction.current = Date.now();

    const send = (final: boolean) => {
      const seconds = pending.current;
      pending.current = 0;
      sinceSend.current = 0;
      if (seconds <= 0) return;
      const body = { ...scope.current, beats: [seconds] };
      if (final) sendFinalHeartbeat(body);
      else learningApi.heartbeat(body).catch(() => undefined); // engagement is best effort; never interrupt studying
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
      send(false); // leaving this section (or the page within the app)
    };
  }, [enabled, section, threadId, stepId, idleMs]);
}
