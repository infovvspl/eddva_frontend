/** Loads https://www.youtube.com/iframe_api once and resolves when `window.YT.Player` exists. */

declare global {
  interface Window {
    YT?: {
      Player: new (el: string | HTMLElement, config: Record<string, unknown>) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Minimal typing for IFrame Player (enough for progress + pause/play). */
export interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;

export { YT_PLAYING, YT_PAUSED, YT_ENDED };

let loadPromise: Promise<void> | null = null;

export function ensureYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } finally {
        done();
      }
    };

    const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const t = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(t);
          done();
        }
      }, 50);
      window.setTimeout(() => {
        window.clearInterval(t);
        if (window.YT?.Player) done();
      }, 15_000);
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.onerror = () => {
      loadPromise = null;
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.head.appendChild(tag);
  });

  return loadPromise;
}

export function extractYouTubeVideoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
