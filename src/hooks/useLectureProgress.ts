import { useEffect, useRef, useCallback } from "react";
import { upsertLectureProgress } from "@/lib/api/teacher";
import type { LectureCompletionReward } from "@/lib/api/teacher";

interface ProgressState {
  watchPercentage: number;
  lastPositionSeconds: number;
}

export function useLectureProgress(
  lectureId: string,
  videoRef: React.RefObject<HTMLVideoElement>,
  onCompletion?: (reward: LectureCompletionReward) => void,
) {
  const rewindCountRef = useRef(0);
  const confusionFlagsRef = useRef<{ timestampSeconds: number; rewindCount: number }[]>([]);
  const lastPositionRef = useRef(0);
  const completionFiredRef = useRef(false);
  const isPlayingRef = useRef(false);

  const save = useCallback(async (state: ProgressState) => {
    try {
      const result = await upsertLectureProgress(lectureId, {
        watchPercentage: state.watchPercentage,
        lastPositionSeconds: state.lastPositionSeconds,
        rewindCount: rewindCountRef.current,
      });
      if (result?.completionReward && !completionFiredRef.current) {
        completionFiredRef.current = true;
        onCompletion?.(result.completionReward);
      }
    } catch { /* silent */ }
  }, [lectureId, onCompletion]);

  const getCurrentState = useCallback((): ProgressState => {
    const v = videoRef.current;
    if (!v) return { watchPercentage: 0, lastPositionSeconds: 0 };
    return {
      watchPercentage: v.duration ? (v.currentTime / v.duration) * 100 : 0,
      lastPositionSeconds: Math.floor(v.currentTime),
    };
  }, [videoRef]);

  // Track rewinds and confusion flags
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onSeeked = () => {
      const cur = v.currentTime;
      const prev = lastPositionRef.current;
      if (prev - cur > 5) {
        rewindCountRef.current += 1;
        const ts = Math.floor(cur);
        const existing = confusionFlagsRef.current.find(f => Math.abs(f.timestampSeconds - ts) < 10);
        if (existing) {
          existing.rewindCount += 1;
        } else {
          confusionFlagsRef.current.push({ timestampSeconds: ts, rewindCount: 1 });
        }
      }
      lastPositionRef.current = cur;
    };
    const onTimeUpdate = () => { lastPositionRef.current = v.currentTime; };
    const onPlay = () => { isPlayingRef.current = true; };
    const onPause = () => {
      isPlayingRef.current = false;
      save(getCurrentState());
    };
    const onEnded = () => {
      isPlayingRef.current = false;
      save({ watchPercentage: 100, lastPositionSeconds: Math.floor(v.duration || v.currentTime) });
    };
    v.addEventListener("seeked", onSeeked);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    return () => {
      v.removeEventListener("seeked", onSeeked);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
    };
  }, [videoRef, save, getCurrentState]);

  // 30-second interval save
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlayingRef.current) save(getCurrentState());
    }, 30000);
    return () => clearInterval(interval);
  }, [save, getCurrentState]);

  // Save on tab visibility change and beforeunload
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) save(getCurrentState()); };
    const onUnload = () => { save(getCurrentState()); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [save, getCurrentState]);

  return { rewindCountRef, confusionFlagsRef };
}
