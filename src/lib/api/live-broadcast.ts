import { apiClient, extractData } from './client';

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
  /** Only present for the owning teacher / admin */
  streamKey?: string;
  rtmpUrl?: string;
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

export const liveBroadcast = {
  /** Schedule a new OBS broadcast — returns stream key + RTMP URL immediately. */
  create: (payload: { title: string; scheduledAt?: string }) =>
    apiClient.post('/lectures', payload).then((r) => extractData<BroadcastCreated>(r)),

  /** List all broadcast lectures for the caller's institute. */
  list: () =>
    apiClient.get('/lectures').then((r) => extractData<BroadcastLecture[]>(r) ?? []),

  /** Get stream credentials for a broadcast the caller owns. */
  streamInfo: (id: string) =>
    apiClient.get(`/lectures/${id}/stream-info`).then((r) => extractData<BroadcastStreamInfo>(r)),

  /** Delete a broadcast lecture. */
  delete: (id: string) =>
    apiClient.delete(`/lectures/${id}`).then((r) => extractData<{ success: boolean }>(r)),
};
