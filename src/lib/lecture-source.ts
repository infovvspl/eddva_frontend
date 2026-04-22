export const YOUTUBE_LECTURE_AI_LIMITATION =
  "Automatic transcription, AI notes, formulas, and quiz generation require an uploaded video file. Raw YouTube links are playback-only.";

export function isYouTubeUrl(url?: string | null): boolean {
  if (!url) return false;
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export function supportsLectureAiPipeline(url?: string | null): boolean {
  return !!url && !isYouTubeUrl(url);
}
