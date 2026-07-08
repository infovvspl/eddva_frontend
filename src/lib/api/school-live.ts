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
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'PROCESSED' | 'PROCESSING_FAILED';
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
}

export interface CreatedLecture {
  lectureId: string;
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
export interface LiveParticipant {
  userId: string;
  userName: string;
  joinedAt?: string;
  handRaised?: boolean;
}

export const schoolLive = {
  createLecture: (payload: CreateLecturePayload) =>
    schoolApi.post('/live/lectures', payload).then((r) => extractData<CreatedLecture>(r)),

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
        streamKey?: string;
        createdAt?: string;
        title?: string;
        startedAt?: string;
        viewerCount?: number;
        qualities?: Array<{ label: string; url: string }>;
      }>(r)),

  getChatHistory: (id: string) =>
    schoolApi.get(`/live/lectures/${id}/chat`).then((r) => extractData<LiveChatMessage[]>(r) ?? []),

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
 * Same-origin HLS URL via the backend proxy — avoids the CORS block on the
 * public R2 (`pub-*.r2.dev`) domain, which serves HLS without CORS headers.
 */
export function hlsProxyUrl(streamKey: string): string {
  return `${getApiBaseUrl()}/school/live/hls/${streamKey}/index.m3u8`;
}

export function getLiveToken(): string {
  try {
    return localStorage.getItem('eddva_access_token') || '';
  } catch {
    return '';
  }
}

export const LIVE_REACTIONS = ['👍', '❤️', '😮', '😂', '🔥', '👏'] as const;
