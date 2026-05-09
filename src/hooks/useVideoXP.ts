import { useEffect, useRef } from "react";
import { xpApi } from "@/lib/api/xp";
import { triggerXPToast } from "@/lib/xp-toast";

export function useVideoXP(sessionId: string | undefined, isPlaying: boolean, currentSeconds?: number) {
  const secondsRef = useRef(0);
  const lastAwardAttemptRef = useRef(0);
  const hasPlaybackClockRef = useRef(false);

  useEffect(() => {
    if (typeof currentSeconds === "number" && Number.isFinite(currentSeconds)) {
      hasPlaybackClockRef.current = true;
      secondsRef.current = Math.max(secondsRef.current, Math.floor(currentSeconds));
    }
  }, [currentSeconds]);

  useEffect(() => {
    if (!sessionId || !isPlaying) return;

    const id = window.setInterval(() => {
      if (!hasPlaybackClockRef.current) {
        secondsRef.current += 60;
      }
      const secondsWatched = secondsRef.current;
      if (secondsWatched - lastAwardAttemptRef.current < 60) return;
      lastAwardAttemptRef.current = secondsWatched;

      xpApi.videoHeartbeat(sessionId, secondsWatched)
        .then((res) => triggerXPToast(res.xpEarned, res.isMockXp))
        .catch(() => {
          lastAwardAttemptRef.current = Math.max(0, lastAwardAttemptRef.current - 60);
        });
    }, 60_000);

    return () => window.clearInterval(id);
  }, [isPlaying, sessionId]);
}
