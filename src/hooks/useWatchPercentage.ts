import { useState, useEffect, useRef } from "react";

export function useWatchPercentage(videoRef: React.RefObject<HTMLVideoElement>) {
  const [watchPct, setWatchPct] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration || 0);
    v.addEventListener("loadedmetadata", onMeta);
    if (v.duration) setDuration(v.duration);
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [videoRef]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const tick = () => {
      if (!v.paused && !v.ended && v.duration) {
        const pct = (v.currentTime / v.duration) * 100;
        setWatchPct(pct);
        setCurrentTime(v.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef]);

  return { watchPct, currentTime, duration };
}
