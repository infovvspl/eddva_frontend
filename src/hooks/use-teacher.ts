import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as teacherApi from "@/lib/api/teacher";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const teacherKeys = {
  dashboard: ["teacher", "dashboard"] as const,
  batches: ["teacher", "batches"] as const,
  roster: (batchId: string) => ["teacher", "roster", batchId] as const,
  performance: (batchId: string) => ["teacher", "performance", batchId] as const,
  lectures: (filters?: teacherApi.GetMyLecturesParams) =>
    ["teacher", "lectures", filters?.batchId ?? "", filters?.topicId ?? "", filters?.chapterId ?? "", filters?.subjectId ?? "", filters?.limit ?? 500] as const,
  lectureStats: (id: string) => ["teacher", "lecture-stats", id] as const,
  doubtQueue: (batchId?: string) => ["teacher", "doubt-queue", batchId] as const,
  allDoubts: (status?: string, batchId?: string) => ["teacher", "all-doubts", status, batchId] as const,
  doubt: (id: string) => ["teacher", "doubt", id] as const,
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useTeacherDashboard() {
  return useQuery({
    queryKey: teacherKeys.dashboard,
    queryFn: teacherApi.getTeacherDashboard,
    staleTime: 30_000,
  });
}

// ─── Batches ──────────────────────────────────────────────────────────────────

export function useMyBatches() {
  return useQuery({
    queryKey: teacherKeys.batches,
    queryFn: teacherApi.getMyBatches,
  });
}

export function useBatchRoster(batchId: string) {
  return useQuery({
    queryKey: teacherKeys.roster(batchId),
    queryFn: () => teacherApi.getBatchRoster(batchId),
    enabled: !!batchId,
  });
}

export function useBatchPerformance(batchId: string) {
  return useQuery({
    queryKey: teacherKeys.performance(batchId),
    queryFn: () => teacherApi.getBatchPerformance(batchId),
    enabled: !!batchId,
  });
}

// ─── Lectures ─────────────────────────────────────────────────────────────────

export function useMyLectures(filters?: teacherApi.GetMyLecturesParams) {
  return useQuery({
    queryKey: teacherKeys.lectures(filters),
    queryFn: () => teacherApi.getMyLectures(filters),
  });
}

export function useLectureStats(id: string) {
  return useQuery({
    queryKey: teacherKeys.lectureStats(id),
    queryFn: () => teacherApi.getLectureStats(id),
    enabled: !!id,
  });
}

export function useCreateLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherApi.createLecture,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "lectures"] }),
  });
}

export function useUpdateLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<teacherApi.CreateLecturePayload>) =>
      teacherApi.updateLecture(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "lectures"] }),
  });
}

export function useDeleteLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherApi.deleteLecture,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher", "lectures"] }),
  });
}

// ─── Doubts ───────────────────────────────────────────────────────────────────

export function useDoubtQueue(batchId?: string) {
  return useQuery({
    queryKey: teacherKeys.doubtQueue(batchId),
    queryFn: () => teacherApi.getDoubtQueue(batchId),
    refetchInterval: 30_000,
  });
}

export function useAllDoubts(status?: string, batchId?: string) {
  return useQuery({
    queryKey: teacherKeys.allDoubts(status, batchId),
    queryFn: () => teacherApi.getAllDoubts({ status: status || undefined, batchId: batchId || undefined }),
  });
}

export function useDoubtDetail(id: string) {
  return useQuery({
    queryKey: teacherKeys.doubt(id),
    queryFn: () => teacherApi.getDoubtById(id),
    enabled: !!id,
  });
}

const invalidateDoubts = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ["teacher", "doubt-queue"] });
  qc.invalidateQueries({ queryKey: ["teacher", "all-doubts"] });
};

export function useRespondToDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: teacherApi.TeacherResponsePayload }) =>
      teacherApi.respondToDoubt(id, payload),
    onSuccess: (_data, { id }) => {
      invalidateDoubts(qc);
      qc.invalidateQueries({ queryKey: teacherKeys.doubt(id) });
    },
  });
}

export function useMarkDoubtReviewed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, aiQualityRating }: { id: string; aiQualityRating?: string }) =>
      teacherApi.markDoubtReviewed(id, aiQualityRating),
    onSuccess: (_data, { id }) => {
      invalidateDoubts(qc);
      qc.invalidateQueries({ queryKey: teacherKeys.doubt(id) });
    },
  });
}

export function useRateTeacherResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      teacherApi.rateTeacherResponse(id, isHelpful),
    onSuccess: (_data, { id }) => {
      invalidateDoubts(qc);
      qc.invalidateQueries({ queryKey: teacherKeys.doubt(id) });
    },
  });
}

// ─── AI Tools ─────────────────────────────────────────────────────────────────

export function useGradeSubjective() {
  return useMutation({ mutationFn: teacherApi.gradeSubjective });
}

export function useDetectEngagement() {
  return useMutation({ mutationFn: teacherApi.detectEngagement });
}

export function useGenerateLectureNotes() {
  return useMutation({ mutationFn: teacherApi.generateLectureNotes });
}

export function useGenerateFeedback() {
  return useMutation({ mutationFn: teacherApi.generateFeedback });
}

export function useAnalyzePerformance() {
  return useMutation({ mutationFn: teacherApi.analyzePerformance });
}

// ─── Teacher Analytics ────────────────────────────────────────────────────────

export const analyticsKeys = {
  overview: (query?: teacherApi.TeacherAnalyticsQuery) => ["teacher", "analytics", "overview", query] as const,
  classPerformance: (query?: teacherApi.ClassPerformanceQuery) => ["teacher", "analytics", "class-performance", query] as const,
  topicCoverage: (query?: teacherApi.TeacherAnalyticsQuery) => ["teacher", "analytics", "topic-coverage", query] as const,
  engagementHeatmap: (lectureId: string) => ["teacher", "analytics", "heatmap", lectureId] as const,
  doubtAnalytics: (query?: teacherApi.TeacherAnalyticsQuery) => ["teacher", "analytics", "doubts", query] as const,
  studentDeepDive: (studentId: string) => ["teacher", "analytics", "student", studentId] as const,
  batchComparison: (query?: teacherApi.TeacherAnalyticsQuery) => ["teacher", "analytics", "batch-comparison", query] as const,
};

export function useTeacherOverview(query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.overview(query),
    queryFn: () => teacherApi.getTeacherOverview(query),
    staleTime: 60_000,
  });
}

export function useClassPerformance(query?: teacherApi.ClassPerformanceQuery) {
  return useQuery({
    queryKey: analyticsKeys.classPerformance(query),
    queryFn: () => teacherApi.getClassPerformance(query),
    staleTime: 60_000,
  });
}

export function useTopicCoverage(query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.topicCoverage(query),
    queryFn: () => teacherApi.getTopicCoverage(query),
    staleTime: 60_000,
  });
}

export function useEngagementHeatmap(lectureId: string) {
  return useQuery({
    queryKey: analyticsKeys.engagementHeatmap(lectureId),
    queryFn: () => teacherApi.getEngagementHeatmap(lectureId),
    enabled: !!lectureId,
    staleTime: 120_000,
  });
}

export function useTeacherDoubtAnalytics(query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.doubtAnalytics(query),
    queryFn: () => teacherApi.getTeacherDoubtAnalytics(query),
    staleTime: 60_000,
  });
}

export function useStudentDeepDive(studentId: string, query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.studentDeepDive(studentId),
    queryFn: () => teacherApi.getStudentDeepDive(studentId, query),
    enabled: !!studentId,
    staleTime: 60_000,
  });
}

export function useBatchComparison(query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: analyticsKeys.batchComparison(query),
    queryFn: () => teacherApi.getBatchComparison(query),
    staleTime: 60_000,
  });
}

export function useExportTeacherAnalytics() {
  return useMutation({ mutationFn: teacherApi.exportTeacherAnalyticsCsv });
}

export function useSmartInsights(query?: teacherApi.TeacherAnalyticsQuery) {
  return useQuery({
    queryKey: ["teacher", "analytics", "smart-insights", query],
    queryFn: () => teacherApi.getSmartInsights(query),
    staleTime: 60_000,
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationKeys = {
  list: (params?: { page?: number; limit?: number; isRead?: boolean }) => ["notifications", params] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export function useNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => teacherApi.getNotifications(params),
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: teacherApi.getUnreadNotificationCount,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherApi.markNotificationRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: teacherApi.markAllNotificationsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
