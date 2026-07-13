import { apiClient } from './client';

function extract<T>(res: { data: unknown }): T {
  const d = res.data as { data?: T } | T;
  if (d && typeof d === 'object' && 'data' in (d as object)) {
    return (d as { data: T }).data;
  }
  return d as T;
}

// ── Shared types ───────────────────────────────────────────────────────────────

export interface LiveUsageSummary {
  totalLectures: number;
  liveNow: number;
  completed: number;
  last30Days: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  totalRecordingGb?: number;
}

export interface LiveUsagePerInstitute {
  instituteId: string;
  instituteName: string;
  totalLectures: number;
  liveNow: number;
  completed: number;
  totalDurationSeconds: number;
  totalRecordingGb?: number;
  uniqueViewers: number;
  lastLectureAt: string | null;
}

export interface LiveUsageRecentLecture {
  id: string;
  title: string;
  status: string;
  instituteId: string;
  instituteName: string;
  teacherName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  participantCount: number;
}

export interface LiveUsageDayCount {
  day: string;
  count: number;
}

export interface LiveUsageData {
  summary: LiveUsageSummary;
  perInstitute: LiveUsagePerInstitute[];
  recentLectures: LiveUsageRecentLecture[];
  dailyTrend: LiveUsageDayCount[];
}

// ── Coaching super admin ───────────────────────────────────────────────────────

export async function getCoachingLiveUsage(): Promise<LiveUsageData> {
  const r = await apiClient.get('/admin/live-usage');
  return extract<LiveUsageData>(r);
}

// ── School super admin ─────────────────────────────────────────────────────────
// Note: SchoolSuperAdminController is at /super-admin/school (no /school prefix),
// so call apiClient directly — schoolApi would prepend /school and double-prefix.
export async function getSchoolLiveUsage(): Promise<LiveUsageData> {
  const r = await apiClient.get('/super-admin/school/live-usage');
  return extract<LiveUsageData>(r);
}
