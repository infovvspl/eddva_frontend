import { useEffect, useRef, useState } from "react";
import { CheckCircle2, PlayCircle, SkipForward } from "lucide-react";
import type { StepVideo } from "@/lib/api/learning-path";
import { cn } from "@/lib/utils";

let apiPromise: Promise<any> | null = null;
/** Loads the YouTube IFrame API once (to know when a video is actually playing). */
function loadYouTubeApi(): Promise<any> {
  const w = window as any; // the app declares a narrower YT type elsewhere
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(w.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return apiPromise;
}

interface VideosStepProps {
  videos: StepVideo[];
  watched: string[];
  onWatched: (videoId: string) => void;
  onSkip: () => void;
  onPlayingChange: (playing: boolean) => void;
}

/** YouTube videos for the topic, played privacy-enhanced (youtube-nocookie.com). */
export function VideosStep({ videos, watched, onWatched, onSkip, onPlayingChange }: VideosStepProps) {
  const [current, setCurrent] = useState<string | null>(videos[0]?.videoId ?? null);
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<any>(null);
  const watchedSet = new Set(watched);

  useEffect(() => {
    if (!current || !holder.current) return;
    let cancelled = false;
    const mount = document.createElement("div");
    holder.current.replaceChildren(mount);
    loadYouTubeApi().then((YT) => {
      if (cancelled || !YT?.Player) return;
      player.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId: current,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            onPlayingChange(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) onWatched(current);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      onPlayingChange(false);
      try {
        player.current?.destroy?.();
      } catch {
        /* already gone */
      }
      player.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!videos.length) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No videos were found for this topic right now. Continue with the notes.</p>
        <button type="button" onClick={onSkip} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Go to notes</button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <div ref={holder} className="aspect-video w-full overflow-hidden rounded-2xl bg-black" />
        {current && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{videos.find((v) => v.videoId === current)?.title}</p>
            <button type="button" onClick={() => onWatched(current)} disabled={watchedSet.has(current)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-60">
              <CheckCircle2 className="size-4 text-emerald-500" /> {watchedSet.has(current) ? "Watched" : "Mark as watched"}
            </button>
          </div>
        )}
      </div>
      <aside className="space-y-2">
        {videos.map((v) => (
          <button key={v.videoId} type="button" onClick={() => setCurrent(v.videoId)}
            className={cn("flex w-full gap-3 rounded-xl border p-2 text-left", current === v.videoId ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted")}>
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img src={v.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" referrerPolicy="no-referrer" />
              <PlayCircle className="absolute inset-0 m-auto size-6 text-white drop-shadow" />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-xs font-semibold text-foreground">{v.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{[v.channel, v.duration].filter(Boolean).join(" · ")}</p>
              {watchedSet.has(v.videoId) && <p className="mt-0.5 text-[11px] font-medium text-emerald-600">Watched</p>}
            </div>
          </button>
        ))}
        <button type="button" onClick={onSkip} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted">
          <SkipForward className="size-3.5" /> Skip videos, go to notes
        </button>
      </aside>
    </div>
  );
}
