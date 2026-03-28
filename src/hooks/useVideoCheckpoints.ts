import { useState, useEffect, useRef } from "react";

export interface VideoCheckpoint {
  id: string;
  timestampSeconds: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  segmentTitle?: string;
}

export function useVideoCheckpoints(
  videoRef: React.RefObject<HTMLVideoElement>,
  checkpoints: VideoCheckpoint[],
) {
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const firedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (activeCheckpoint) return;
      for (const cp of checkpoints) {
        if (firedIds.current.has(cp.id)) continue;
        if (Math.abs(v.currentTime - cp.timestampSeconds) < 0.5) {
          v.pause();
          setActiveCheckpoint(cp);
          firedIds.current.add(cp.id);
          break;
        }
      }
    };
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [videoRef, checkpoints, activeCheckpoint]);

  const dismiss = () => {
    setActiveCheckpoint(null);
    videoRef.current?.play();
  };

  return { activeCheckpoint, dismiss };
}
