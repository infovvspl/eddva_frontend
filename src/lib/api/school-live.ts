import { io, type Socket } from 'socket.io-client';
import { getApiOrigin, getApiBaseUrl } from '@/lib/api-config';
import { extractData } from './client';
import schoolApi from './school-client';

/** Live class (RTMP → HLS) API + realtime socket for the school panel. */

export interface LiveLecture {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  streamKey?: string;
  playbackUrl?: string | null;
  rtmpUrl?: string;
  teacherId?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
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

export interface LiveParticipant {
  userId: string;
  userName: string;
  joinedAt?: string;
  handRaised?: boolean;
}

export const schoolLive = {
  createLecture: (title: string) =>
    schoolApi.post('/live/lectures', { title }).then((r) => extractData<CreatedLecture>(r)),

  listLectures: () =>
    schoolApi.get('/live/lectures').then((r) => extractData<LiveLecture[]>(r) ?? []),

  listLive: () =>
    schoolApi.get('/live/lectures/live').then((r) => extractData<LiveLecture[]>(r) ?? []),

  getStreamUrl: (id: string) =>
    schoolApi
      .get(`/live/lectures/${id}/stream-url`)
      .then((r) => extractData<{ url: string; status: string; streamKey?: string; createdAt?: string }>(r)),

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
