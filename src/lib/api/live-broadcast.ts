import { io, type Socket } from 'socket.io-client';
import { apiClient, extractData } from './client';
import { getApiOrigin, getApiBaseUrl } from '@/lib/api-config';

/** A coaching OBS/RTMP broadcast lecture (separate from Agora/Bunny live-class). */
export interface BroadcastLecture {
  id: string;
  title: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'PROCESSED' | 'PROCESSING_FAILED';
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  teacherId: string;
  createdAt?: string;
  batchId?: string;
  batchName?: string;
  subjectId?: string;
  subjectName?: string;
  description?: string;
  /** Only present for the owning teacher / admin */
  streamKey?: string;
  rtmpUrl?: string;
}

export interface BroadcastRecordingUrl {
  url: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  expiresIn: number;
}

export interface BroadcastCreated {
  lectureId: string;
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
}

export interface BroadcastStreamInfo {
  lectureId: string;
  streamKey: string;
  rtmpUrl: string;
  status: string;
}

export interface BroadcastChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface BroadcastQuestion {
  id: string;
  userId: string;
  userName: string;
  text: string;
  answer: string | null;
  createdAt: string;
}

export interface BroadcastParticipant {
  userId: string;
  userName: string;
  joinedAt?: string;
  handRaised?: boolean;
}

export interface BroadcastStats {
  id: string;
  title: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  teacherId: string;
  teacherName?: string | null;
  totalParticipants: number;
  totalMessages: number;
  totalReactions: number;
  reactionBreakdown: { emoji: string; count: number }[];
  participants: { userId: string; userName: string; joinedAt: string; leftAt: string | null; durationSeconds: number | null }[];
  polls?: { id: string; question: string; options: string[]; correctOption?: string; status: string; createdAt: string; results: Record<string, number> }[];
}

export const BROADCAST_REACTIONS = ['👍', '❤️', '😮', '😂', '🔥', '👏'] as const;

export const liveBroadcast = {
  /** Schedule a new OBS broadcast — returns stream key + RTMP URL immediately. */
  create: (payload: { title: string; scheduledAt?: string; batchId?: string; subjectId?: string; batchName?: string; subjectName?: string; description?: string }) =>
    apiClient.post('/lectures', payload).then((r) => extractData<BroadcastCreated>(r)),

  /** List all broadcast lectures for the caller's institute. */
  list: () =>
    apiClient.get('/lectures').then((r) => extractData<BroadcastLecture[]>(r) ?? []),

  /** Get stream credentials for a broadcast the caller owns. */
  streamInfo: (id: string) =>
    apiClient.get(`/lectures/${id}/stream-info`).then((r) => extractData<BroadcastStreamInfo>(r)),

  /** Get HLS stream URL + status for a lecture. */
  getStreamUrl: (id: string) =>
    apiClient.get(`/lectures/${id}/stream-url`).then((r) =>
      extractData<{
        url: string;
        status: string;
        streamKey?: string;
        title?: string;
        startedAt?: string;
        createdAt?: string;
        teacherId?: string;
        teacherName?: string;
        qualities?: Array<{ label: string; url: string }>;
      }>(r)),

  /** End a live broadcast from the app. */
  endLecture: (id: string) =>
    apiClient.post(`/lectures/${id}/end`).then((r) => extractData<{ success: boolean; status: string }>(r)),

  /** Delete a broadcast lecture. */
  delete: (id: string) =>
    apiClient.delete(`/lectures/${id}`).then((r) => extractData<{ success: boolean }>(r)),

  /** Chat history (last 500). */
  getChatHistory: (id: string) =>
    apiClient.get(`/lectures/${id}/chat`).then((r) => extractData<BroadcastChatMessage[]>(r) ?? []),

  /** Questions asked during the live class. */
  getQuestions: (id: string) =>
    apiClient.get(`/lectures/${id}/questions`).then((r) => extractData<BroadcastQuestion[]>(r) ?? []),

  /** Teacher/admin answer for a live question. */
  answerQuestion: (id: string, questionId: string, answer: string) =>
    apiClient.post(`/lectures/${id}/questions/${questionId}/answer`, { answer })
      .then((r) => extractData<{ success: boolean; answer: string }>(r)),

  /** Currently active participants (teacher-only). */
  getActiveParticipants: (id: string) =>
    apiClient.get(`/lectures/${id}/participants/active`).then((r) => extractData<BroadcastParticipant[]>(r) ?? []),

  /** Student: raise or lower hand. */
  setHandRaised: (id: string, raised: boolean) =>
    apiClient.post(`/lectures/${id}/hand`, { raised }).then((r) => extractData<{ raised: boolean }>(r)),

  /** Post-class stats: duration, participants, reactions, polls. */
  getStats: (id: string) =>
    apiClient.get(`/lectures/${id}/stats`).then((r) => extractData<BroadcastStats>(r)),

  /** Create a live poll (ends any currently active poll first). */
  createPoll: (id: string, question: string, options: string[], correctOption?: string) =>
    apiClient.post(`/lectures/${id}/polls`, { question, options, correctOption }).then((r) => extractData<any>(r)),

  /** End an active poll. */
  endPoll: (id: string, pollId: string) =>
    apiClient.post(`/lectures/${id}/polls/${pollId}/end`).then((r) => extractData<any>(r)),

  /** Get the currently active poll with live vote counts. */
  getActivePoll: (id: string) =>
    apiClient.get(`/lectures/${id}/polls/active`).then((r) =>
      extractData<{ poll: any; results: Record<string, number> } | null>(r)),

  /** Student: cast or change a vote. */
  votePoll: (id: string, pollId: string, option: string) =>
    apiClient.post(`/lectures/${id}/polls/${pollId}/vote`, { option }).then((r) => extractData<any>(r)),

  /** All polls with results. */
  listPolls: (id: string) =>
    apiClient.get(`/lectures/${id}/polls`).then((r) => extractData<any[]>(r) ?? []),

  /** Lectures that are currently LIVE (student discovery). */
  liveNow: () =>
    apiClient.get('/lectures/live/now').then((r) => extractData<BroadcastLecture[]>(r) ?? []),

  /** Get signed recording URL for a PROCESSED lecture (4-hour expiry). */
  getRecordingUrl: (id: string) =>
    apiClient.get(`/lectures/${id}/recording-url`).then((r) => extractData<BroadcastRecordingUrl>(r)),
};

/** Connect to the coaching `/stream` realtime namespace. */
export function createBroadcastSocket(): Socket {
  const explicit = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim();
  const base = explicit || getApiOrigin() || window.location.origin;
  return io(`${base}/stream`, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });
}

/** Same-origin HLS proxy URL for a coaching broadcast stream key. */
export function broadcastHlsUrl(streamKey: string): string {
  return `${getApiBaseUrl()}/lectures/hls/${streamKey}/index.m3u8`;
}

export function broadcastHls480Url(streamKey: string): string {
  return `${getApiBaseUrl()}/lectures/hls480/${streamKey}/index.m3u8`;
}

export function broadcastHls360Url(streamKey: string): string {
  return `${getApiBaseUrl()}/lectures/hls360/${streamKey}/index.m3u8`;
}

export function getBroadcastToken(): string {
  try {
    return localStorage.getItem('eddva_access_token') || '';
  } catch {
    return '';
  }
}
