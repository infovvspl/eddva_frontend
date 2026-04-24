import { apiClient, extractData } from "./client";
import type { ApiResponse } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveTokenResponse {
  token: string | null;
  channelName: string;
  uid: number;
  appId: string;
  sessionId: string;
  status: "waiting" | "live" | "ended";
}

export interface LiveSessionInfo {
  id: string;
  lectureId: string;
  agoraChannelName: string;
  status: "waiting" | "live" | "ended";
  startedAt: string | null;
  endedAt: string | null;
  peakViewerCount: number;
  currentViewerCount: number;
  lectureTitle: string | null;
  topicName: string | null;
  teacherName: string | null;
}

export interface LiveChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  sentAt: string;
  isPinned: boolean;
}

export interface PollResult {
  index: number;
  text: string;
  count: number;
  percentage: number;
}

export interface LivePoll {
  id: string;
  question: string;
  options: string[];
  isActive: boolean;
  correctOptionIndex: number | null;
  closedAt: string | null;
  results?: PollResult[];
}

export interface EndClassResponse {
  duration: number;
  attendanceCount: number;
  sessionId: string;
  recordingUrl: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const getLiveClassToken = async (
  lectureId: string,
  role: "host" | "audience"
): Promise<LiveTokenResponse> => {
  const { data } = await apiClient.post<ApiResponse<LiveTokenResponse>>(
    "/live-class/token",
    { lectureId, role }
  );
  return extractData({ data });
};

export const startLiveClass = async (
  lectureId: string
): Promise<LiveTokenResponse> => {
  const { data } = await apiClient.post<ApiResponse<LiveTokenResponse>>(
    `/live-class/${lectureId}/start`
  );
  return extractData({ data });
};

export const endLiveClass = async (
  lectureId: string
): Promise<EndClassResponse> => {
  const { data } = await apiClient.post<ApiResponse<EndClassResponse>>(
    `/live-class/${lectureId}/end`
  );
  return extractData({ data });
};

export const getLiveSession = async (
  lectureId: string
): Promise<LiveSessionInfo> => {
  const { data } = await apiClient.get<ApiResponse<LiveSessionInfo>>(
    `/live-class/${lectureId}/session`
  );
  return extractData({ data });
};

export const getAttendance = async (lectureId: string) => {
  const { data } = await apiClient.get(`/live-class/${lectureId}/attendance`);
  return extractData({ data }) as {
    records: { studentName: string; joinedAt: string; leftAt: string | null; durationSeconds: number }[];
    summary: { totalInvited: number; totalJoined: number; avgDuration: number };
  };
};

export const createPoll = async (
  sessionId: string,
  question: string,
  options: string[],
  correctOptionIndex?: number
): Promise<LivePoll> => {
  const { data } = await apiClient.post<ApiResponse<LivePoll>>(
    `/live-class/${sessionId}/polls`,
    { question, options, correctOptionIndex }
  );
  return extractData({ data });
};

export const closePoll = async (pollId: string): Promise<LivePoll> => {
  const { data } = await apiClient.patch<ApiResponse<LivePoll>>(
    `/live-class/polls/${pollId}/close`
  );
  return extractData({ data });
};

export const respondToPoll = async (
  pollId: string,
  selectedOption: number
): Promise<void> => {
  await apiClient.post(`/live-class/polls/${pollId}/respond`, {
    selectedOption,
  });
};

export const getPolls = async (sessionId: string): Promise<LivePoll[]> => {
  const { data } = await apiClient.get<ApiResponse<LivePoll[]>>(
    `/live-class/${sessionId}/polls`
  );
  return extractData({ data });
};

export const getChatHistory = async (
  sessionId: string,
  page = 1
): Promise<{ data: LiveChatMessage[]; total: number }> => {
  const { data } = await apiClient.get(`/live-class/${sessionId}/chat`, {
    params: { page, limit: 50 },
  });
  return extractData({ data }) as { data: LiveChatMessage[]; total: number };
};

export const pinMessage = async (
  sessionId: string,
  messageId: string
): Promise<void> => {
  await apiClient.post(`/live-class/${sessionId}/chat/${messageId}/pin`);
};

export const attachRecording = async (
  lectureId: string,
  recordingUrl: string,
): Promise<void> => {
  await apiClient.patch(`/live-class/${lectureId}/attach-recording`, { recordingUrl });
};
