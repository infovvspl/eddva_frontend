import { io, type Socket } from 'socket.io-client';
import { getApiOrigin, getApiBaseUrl } from '@/lib/api-config';
import { extractData } from './client';
import schoolApi from './school-client';

/** Live class (RTMP → HLS) API + realtime socket for the school panel. */

export interface LiveRecording {
  id: string;
  title: string;
  status: 'PROCESSED';
  teacherId?: string;
  classRecordingId?: string | null;
  className?: string | null;
  sectionName?: string | null;
  subjectName?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  durationSeconds?: number | null;
  recordingSizeGb?: number | null;
  thumbnailKey?: string | null;
  createdAt?: string;
}

export interface RecordingUrlResponse {
  url: string;
  thumbnailUrl: string;
  durationSeconds: number;
  expiresIn: number;
}

export interface LiveLecture {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'PROCESSED' | 'PROCESSING_FAILED' | 'CANCELLED';
  /** Set by the server: scheduled, and not live an hour after its start. */
  isMissed?: boolean;
  /** Plays the class without revealing its stream key. */
  playbackId?: string;
  /** Whether students may chat (saved per class). */
  chatEnabled?: boolean;
  /** Teachers only, and only while the class is open. */
  streamKey?: string;
  playbackUrl?: string | null;
  rtmpUrl?: string;
  teacherId?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  scheduledFor?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  subjectId?: string | null;
  description?: string | null;
  className?: string | null;
  sectionName?: string | null;
  subjectName?: string | null;
  // Populated after a class ends (LEFT JOIN class_recordings on the server).
  recordingUrl?: string | null;
  classRecordingId?: string | null;
  notesStatus?: string | null;
  transcriptStatus?: string | null;
  quizStatus?: string | null;
  notes?: string | null;
}

export interface CreatedLecture {
  lectureId: string;
  playbackId?: string;
  scheduledFor?: string | null;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
}

export interface LiveChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface CreateLecturePayload {
  title: string;
  scheduledFor?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  description?: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
}
export interface UpdateLecturePayload {
  title?: string;
  description?: string;
  scheduledFor?: string;
}

/**
 * A `datetime-local` value ("2026-10-16T22:00", no zone) as an exact UTC
 * instant. Sending the raw value made the server read it as UTC, so a class
 * set for 10:00 PM IST was stored as 22:00 UTC and shown as 3:30 AM.
 */
export function localInputToIso(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** An ISO instant as a `datetime-local` value in the browser's zone. */
export function isoToLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface LiveParticipant {
  userId: string;
  userName: string;
  joinedAt?: string;
  handRaised?: boolean;
}

export const schoolLive = {
  createLecture: (payload: CreateLecturePayload) =>
    schoolApi.post('/live/lectures', payload).then((r) => extractData<CreatedLecture>(r)),

  updateLecture: (id: string, payload: UpdateLecturePayload) =>
    schoolApi.patch(`/live/lectures/${id}`, payload).then((r) => extractData<LiveLecture>(r)),

  listLectures: () =>
    schoolApi.get('/live/lectures').then((r) => extractData<LiveLecture[]>(r) ?? []),

  listLive: () =>
    schoolApi.get('/live/lectures/live').then((r) => extractData<LiveLecture[]>(r) ?? []),

  getStreamUrl: (id: string) =>
    schoolApi
      .get(`/live/lectures/${id}/stream-url`)
      .then((r) => extractData<{
        url: string;
        status: string;
        playbackId?: string;
        isMissed?: boolean;
        chatEnabled?: boolean;
        streamKey?: string;
        createdAt?: string;
        title?: string;
        startedAt?: string;
        viewerCount?: number;
        qualities?: Array<{ label: string; url: string }>;
      }>(r)),

  getChatHistory: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/chat`).then((r) => extractData<LiveChatMessage[]>(r) ?? []),

  getQuestions: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/questions`).then((r) => extractData<Array<{
      id: string;
      userId: string;
      userName: string;
      text: string;
      answer: string | null;
      createdAt: string;
    }>>(r) ?? []),

  answerQuestion: (id: string, questionId: string, answer: string) =>
    schoolApi.post(`/live/lectures/${id}/questions/${questionId}/answer`, { answer })
      .then((r) => extractData<{ success: boolean; answer: string }>(r)),

  getActiveParticipants: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/participants/active`).then((r) => extractData<LiveParticipant[]>(r) ?? []),

  setHandRaised: (id: string, raised: boolean) =>
    schoolApi.post(`/live/lectures/${id}/hand`, { raised }).then((r) => extractData<{ raised: boolean }>(r)),

  endLecture: (id: string) =>
    schoolApi.post(`/live/lectures/${id}/end`).then((r) => extractData<{ success: boolean; status: string }>(r)),

  getStats: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/stats`).then((r) => extractData<LiveLectureStats>(r)),

  deleteLecture: (id: string) =>
    schoolApi.delete(`/live/lectures/${id}`).then((r) => extractData<{ success: boolean }>(r)),
  createPoll: (id: string, question: string, options: string[], correctOption?: string) =>
    schoolApi.post(`/live/lectures/${id}/polls`, { question, options, correctOption }).then((r) => extractData<any>(r)),

  endPoll: (id: string, pollId: string) =>
    schoolApi.post(`/live/lectures/${id}/polls/${pollId}/end`).then((r) => extractData<any>(r)),

  getActivePoll: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/polls/active`).then((r) => extractData<{ poll: any; results: Record<string, number> } | null>(r)),

  votePoll: (id: string, pollId: string, option: string) =>
    schoolApi.post(`/live/lectures/${id}/polls/${pollId}/vote`, { option }).then((r) => extractData<any>(r)),

  listPolls: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/polls`).then((r) => extractData<any[]>(r) ?? []),

  listRecordings: () =>
    schoolApi.get('/live/recordings').then((r) => extractData<LiveRecording[]>(r) ?? []),

  getRecordingUrl: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/recording-url`).then((r) => extractData<RecordingUrlResponse>(r)),
};

export interface LiveLectureStats {
  id: string;
  title: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  teacherId: string;
  teacherName: string | null;
  totalParticipants: number;
  totalMessages: number;
  totalReactions: number;
  reactionBreakdown: { emoji: string; count: number }[];
  participants: {
    userId: string;
    userName: string;
    joinedAt: string;
    leftAt: string | null;
    durationSeconds: number | null;
  }[];
  polls?: {
    id: string;
    question: string;
    options: string[];
    correctOption?: string;
    status: string;
    createdAt: string;
    results: Record<string, number>;
  }[];
}

/** Connect to the `/school-live` realtime namespace (gateway lives on the API host). */
export function createLiveSocket(): Socket {
  const explicit = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
  const base = explicit || getApiOrigin() || window.location.origin;
  return io(`${base}/school-live`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
}

/**
 * Connect to the `/school-broadcast` relay namespace — used by the in-browser
 * Studio to stream composited WebM chunks to the server, which pipes them
 * through ffmpeg to the same RTMP ingest OBS uses. No OBS required.
 */
export function createBroadcastRelaySocket(): Socket {
  const explicit = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
  const base = explicit || getApiOrigin() || window.location.origin;
  return io(`${base}/school-broadcast`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    // Binary WebM chunks — keep the buffer generous so 1s chunks aren't dropped.
    forceNew: true,
  });
}

/**
 * Same-origin HLS URL via the backend proxy — avoids the CORS block on the
 * public R2 (`pub-*.r2.dev`) domain, which serves HLS without CORS headers.
 * Takes the class's playback ID (never its stream key: whoever holds the key
 * can publish into the class).
 */
export function hlsProxyUrl(playbackId: string): string {
  return `${getApiBaseUrl()}/school/live/hls/${playbackId}/index.m3u8`;
}

export function hlsProxy480Url(playbackId: string): string {
  return `${getApiBaseUrl()}/school/live/hls480/${playbackId}/index.m3u8`;
}

export function hlsProxy360Url(playbackId: string): string {
  return `${getApiBaseUrl()}/school/live/hls360/${playbackId}/index.m3u8`;
}

export function getLiveToken(): string {
  try {
    return localStorage.getItem('eddva_access_token') || '';
  } catch {
    return '';
  }
}

/**
 * Best-effort "end lecture" that survives page unload (tab close / navigation),
 * so a browser broadcast doesn't leave the class stuck in a LIVE status.
 * Uses fetch `keepalive` (sendBeacon can't set the auth header).
 */
export function endLectureBeacon(id: string): void {
  try {
    const token = getLiveToken();
    void fetch(`${getApiBaseUrl()}/school/live/lectures/${id}/end`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* ignore — best effort */
  }
}

export const LIVE_REACTIONS = ['👍', '❤️', '😮', '😂', '🔥', '👏'] as const;
