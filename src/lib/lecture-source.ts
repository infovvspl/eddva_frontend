/** Shown when captions/transcript are missing or AI could not use them */
export const YOUTUBE_LECTURE_CAPTIONS_HINT =
  "YouTube lectures use on-video captions as the transcript. Enable captions on the video, or use an upload if none are available.";

/** Legacy export name — kept for imports; text reflects current behaviour */
export const YOUTUBE_LECTURE_AI_LIMITATION = YOUTUBE_LECTURE_CAPTIONS_HINT;

export function isYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

/** True if URL looks like a watch/embed/shorts link we can resolve to a video id */
export function extractYouTubeVideoId(url: string): string | null {
  const u = url.trim();
  const m =
    u.match(/[?&]v=([A-Za-z0-9_-]{11})/) ||
    u.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ||
    u.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function isValidYouTubeLectureUrl(url: string): boolean {
  return !!extractYouTubeVideoId(url);
}

/** Recorded lectures can run the AI pipeline from either uploaded media or YouTube captions */
export function supportsLectureAiPipeline(url?: string | null): boolean {
  return !!url?.trim();
}
