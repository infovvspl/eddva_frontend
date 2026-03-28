import { useState, useEffect, useRef } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const LS_KEY = "apexiq_playback_speed";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function SpeedControl({ videoRef }: Props) {
  const [speed, setSpeed] = useState<number>(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? parseFloat(saved) : 1;
  });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed, videoRef]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (s: number) => {
    setSpeed(s);
    localStorage.setItem(LS_KEY, String(s));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="text-xs px-2.5 py-1 rounded transition-colors"
        style={{
          background: "transparent",
          border: "1px solid #30363D",
          color: "#8B949E",
          fontSize: "13px",
        }}
      >
        {speed === 1 ? "1x" : `${speed}x`}
      </button>

      {open && (
        <div
          className="absolute bottom-full mb-2 right-0 rounded-lg overflow-hidden z-50"
          style={{
            background: "#161B22",
            border: "1px solid #30363D",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            minWidth: "72px",
          }}
        >
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => select(s)}
              className="w-full text-center py-2 text-sm transition-colors"
              style={{
                color: s === speed ? "#F97316" : "#E6EDF3",
                background: "transparent",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#21262D")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {s === 1 ? "1x" : `${s}x`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
