import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import * as studentApi from "@/lib/api/student";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const studentKeys = {
  me: ["student", "me"] as const,
  publicBatches: (examTarget?: string) => ["student", "public-batches", examTarget] as const,
  myCourses: ["student", "my-courses"] as const,
  courseCurriculum: (batchId: string) => ["student", "my-courses", batchId] as const,
  courseTopicDetail: (batchId: string, topicId: string) => ["student", "my-courses", batchId, "topics", topicId] as const,
  dashboard: ["student", "dashboard"] as const,
  subjects: (examTarget?: string) => ["student", "subjects", examTarget] as const,
  chapters: (subjectId: string) => ["student", "chapters", subjectId] as const,
  topics: (chapterId: string) => ["student", "topics", chapterId] as const,
  progressOverview: ["student", "progress", "overview"] as const,
  topicProgress: (topicId: string) => ["student", "progress", "topic", topicId] as const,
  lectures: (batchId: string, topicId?: string) => ["student", "lectures", batchId, topicId] as const,
  lectureProgress: (lectureId: string) => ["student", "lecture-progress", lectureId] as const,
  mockTests: (params?: object) => ["student", "mock-tests", params] as const,
  sessions: (mockTestId?: string) => ["student", "sessions", mockTestId] as const,
  sessionResult: (sessionId: string) => ["student", "session-result", sessionId] as const,
  plan: ["student", "plan", "today"] as const,
  weeklyPlan: (start: string, end: string) => ["student", "plan", "weekly", start, end] as const,
  doubts: (status?: string) => ["student", "doubts", status] as const,
  doubt: (id: string) => ["student", "doubt", id] as const,
  performance: ["student", "performance"] as const,
  leaderboard: (params?: object) => ["student", "leaderboard", params] as const,
  dailyBattle: ["student", "battle", "daily"] as const,
  battleElo: ["student", "battle", "elo"] as const,
  studyStatus: (topicId: string) => ["student", "study-status", topicId] as const,
  aiSession: (topicId: string) => ["student", "ai-session", topicId] as const,
};

// ─── Auth / Me ────────────────────────────────────────────────────────────────

export function useStudentMe() {
  return useQuery({
    queryKey: studentKeys.me,
    queryFn: studentApi.getMe,
    staleTime: 60_000,
  });
}

export function usePublicBatches(examTarget?: string) {
  return useQuery({
    queryKey: studentKeys.publicBatches(examTarget),
    queryFn: () => studentApi.getPublicBatches(examTarget),
    enabled: !!examTarget,
    staleTime: 60_000,
  });
}

// ─── My Courses ───────────────────────────────────────────────────────────────

export function useMyCourses() {
  return useQuery({
    queryKey: studentKeys.myCourses,
    queryFn: studentApi.getMyCourses,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCourseCurriculum(batchId: string) {
  return useQuery({
    queryKey: studentKeys.courseCurriculum(batchId),
    queryFn: () => studentApi.getCourseCurriculum(batchId),
    enabled: !!batchId,
    staleTime: 0,
    retry: false,
  });
}

export function useAllEnrolledSubjectNames(): string[] {
  const { data: myCourses = [] } = useMyCourses();
  const batchIds = myCourses.map(c => c.id).filter(Boolean);

  const results = useQueries({
    queries: batchIds.map(batchId => ({
      queryKey: studentKeys.courseCurriculum(batchId),
      queryFn: () => studentApi.getCourseCurriculum(batchId),
      enabled: !!batchId,
      staleTime: 0,
    })),
    combine: (results) => {
      const names = new Set<string>();
      for (const r of results) {
        for (const s of r.data?.subjects ?? []) {
          if (s.name?.trim()) names.add(s.name.trim());
        }
      }
      return [...names].sort((a, b) => a.localeCompare(b));
    },
  });

  return results;
}

export function useCourseTopicDetail(batchId: string, topicId: string) {
  return useQuery({
    queryKey: studentKeys.courseTopicDetail(batchId, topicId),
    queryFn: () => studentApi.getCourseTopicDetail(batchId, topicId),
    enabled: !!batchId && !!topicId,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useStudentDashboard() {
  return useQuery({
    queryKey: studentKeys.dashboard,
    queryFn: studentApi.getStudentDashboard,
    staleTime: 30_000,
    retry: false,
  });
}

// ─── Content Tree ─────────────────────────────────────────────────────────────

export function useSubjects(examTarget?: string, batchId?: string) {
  return useQuery({
    queryKey: [...studentKeys.subjects(examTarget), batchId ?? ""] as const,
    queryFn: () => studentApi.getSubjects(examTarget, batchId),
    enabled: batchId ? batchId.length > 0 : true,
    staleTime: 5 * 60_000,
  });
}

export function useChapters(subjectId: string) {
  return useQuery({
    queryKey: studentKeys.chapters(subjectId),
    queryFn: () => studentApi.getChapters(subjectId),
    enabled: !!subjectId,
    staleTime: 5 * 60_000,
  });
}

export function useTopics(chapterId: string) {
  return useQuery({
    queryKey: studentKeys.topics(chapterId),
    queryFn: () => studentApi.getTopics(chapterId),
    enabled: !!chapterId,
    staleTime: 5 * 60_000,
  });
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export function useProgressOverview() {
  return useQuery({
    queryKey: studentKeys.progressOverview,
    queryFn: studentApi.getProgressOverview,
    staleTime: 60_000,
  });
}

export function useTopicProgress(topicId: string) {
  return useQuery({
    queryKey: studentKeys.topicProgress(topicId),
    queryFn: () => studentApi.getTopicProgress(topicId),
    enabled: !!topicId,
    staleTime: 30_000,
  });
}

// ─── Lectures ─────────────────────────────────────────────────────────────────

export function useStudentLectures(batchId: string, topicId?: string) {
  return useQuery({
    queryKey: studentKeys.lectures(batchId, topicId),
    queryFn: () => studentApi.getLecturesByBatchAndTopic(batchId, topicId),
    enabled: !!topicId,
    staleTime: 60_000,
  });
}

export function useAllBatchLectures(batchId?: string) {
  return useQuery({
    queryKey: ["student", "all-lectures", batchId ?? ""],
    // backend filters by enrolled batches for student role, so batchId is optional
    queryFn: () => studentApi.getAllBatchLectures(batchId),
    staleTime: 30_000,
  });
}

export function useStudentLectureProgress(lectureId: string) {
  return useQuery({
    queryKey: studentKeys.lectureProgress(lectureId),
    queryFn: () => studentApi.getLectureProgress(lectureId),
    enabled: !!lectureId,
    staleTime: 30_000,
  });
}

// ─── Mock Tests ───────────────────────────────────────────────────────────────

export function useMockTests(params?: {
  batchId?: string;
  topicId?: string;
  type?: string;
  isPublished?: boolean;
}) {
  return useQuery({
    queryKey: studentKeys.mockTests(params),
    queryFn: () => studentApi.getMockTests(params),
    staleTime: 60_000,
  });
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

/** Fetch all completed sessions for the current student (builds per-test progress map) */
export function useStudentSessions() {
  return useQuery({
    queryKey: studentKeys.sessions(undefined),
    queryFn: () => studentApi.getActiveSessions(), // no filter = all sessions
    staleTime: 30_000,
  });
}

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mockTestId: string) => studentApi.startSession(mockTestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "sessions"] });
    },
  });
}

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({
      sessionId,
      ...payload
    }: { sessionId: string } & Parameters<typeof studentApi.submitAnswer>[1]) =>
      studentApi.submitAnswer(sessionId, payload),
  });
}

export function useSubmitSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => studentApi.submitSession(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.progressOverview });
      qc.invalidateQueries({ queryKey: studentKeys.performance });
      qc.invalidateQueries({ queryKey: studentKeys.me });
    },
  });
}

export function useSessionResult(sessionId: string) {
  return useQuery({
    queryKey: studentKeys.sessionResult(sessionId),
    queryFn: () => studentApi.getSessionResult(sessionId),
    enabled: !!sessionId,
    staleTime: Infinity,
  });
}

// ─── Study Plan ───────────────────────────────────────────────────────────────

export function useTodaysPlan() {
  return useQuery({
    queryKey: studentKeys.plan,
    queryFn: studentApi.getTodaysPlan,
    staleTime: 60_000,
    retry: false,
  });
}

export function useWeeklyPlan(startDate: string, endDate: string) {
  return useQuery({
    queryKey: studentKeys.weeklyPlan(startDate, endDate),
    queryFn: () => studentApi.getWeeklyPlan(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
  });
}

export function useWeeklyPlanGrouped(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...studentKeys.weeklyPlan(startDate, endDate), "grouped"],
    queryFn: () => studentApi.getWeeklyPlanGrouped(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 60_000,
    retry: false,
  });
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentApi.generatePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "plan"] });
    },
  });
}

export function useRegeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentApi.regeneratePlan,
    onSuccess: async () => {
      // Clear stale cached plan slices first, then force active refetch.
      qc.removeQueries({ queryKey: ["student", "plan"] });
      await qc.invalidateQueries({ queryKey: ["student", "plan"] });
      await qc.invalidateQueries({ queryKey: ["student", "plan", "weekly"] });
      await qc.invalidateQueries({ queryKey: [...studentKeys.plan, "next-action"] });
      await qc.refetchQueries({ queryKey: ["student", "plan"], type: "active" });
    },
  });
}

export function useCompletePlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => studentApi.completePlanItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.plan });
      qc.invalidateQueries({ queryKey: studentKeys.me });
    },
  });
}

export function useSkipPlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => studentApi.skipPlanItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.plan });
    },
  });
}

export function useNextAction() {
  return useQuery({
    queryKey: [...studentKeys.plan, "next-action"],
    queryFn: studentApi.getNextAction,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Doubts ───────────────────────────────────────────────────────────────────

export function useMyDoubts(status?: string) {
  return useQuery({
    queryKey: studentKeys.doubts(status),
    queryFn: () => studentApi.getMyDoubts(status ? { status } : { limit: 50 }),
    staleTime: 30_000,
    retry: false,
  });
}

export function useDoubt(id: string) {
  return useQuery({
    queryKey: studentKeys.doubt(id),
    queryFn: () => studentApi.getDoubtById(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: studentApi.CreateDoubtPayload) => studentApi.createDoubt(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "doubts"] });
    },
  });
}

export function useRequestAiForDoubt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentApi.requestAiForDoubt(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "doubts"] });
    },
  });
}

export function useMarkDoubtHelpful() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isHelpful }: { id: string; isHelpful: boolean }) =>
      studentApi.markDoubtHelpful(id, isHelpful),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["student", "doubts"] });
      qc.invalidateQueries({ queryKey: studentKeys.doubt(id) });
    },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useMyPerformance() {
  return useQuery({
    queryKey: studentKeys.performance,
    queryFn: studentApi.getMyPerformance,
    staleTime: 60_000,
    retry: false,
  });
}

export function useLeaderboard(params?: {
  scope?: "global" | "state" | "city" | "school" | "subject" | "battle_xp";
  period?: string;
  scopeValue?: string;
}) {
  return useQuery({
    queryKey: studentKeys.leaderboard(params),
    queryFn: () => studentApi.getLeaderboard(params),
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Battle ───────────────────────────────────────────────────────────────────

export function useDailyBattle() {
  return useQuery({
    queryKey: studentKeys.dailyBattle,
    queryFn: studentApi.getDailyBattle,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useBattleRoom(battleId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["student", "battle", "room", battleId],
    queryFn: () => studentApi.getBattleRoom(battleId),
    enabled: !!battleId && enabled,
    refetchInterval: 3000,
    staleTime: 0,
    retry: 1,
  });
}

export function useCreateBattle() {
  return useMutation({
    mutationFn: ({ mode, topicId, topicName }: { mode: studentApi.BattleMode; topicId?: string; topicName?: string }) =>
      studentApi.createBattle(mode, topicId, topicName),
  });
}

export function useJoinBattle() {
  return useMutation({
    mutationFn: (roomCode: string) => studentApi.joinBattleByCode(roomCode),
  });
}

export function useCancelBattle() {
  return useMutation({
    mutationFn: (battleId: string) => studentApi.cancelBattle(battleId),
  });
}

export function useBattleLeaderboard() {
  return useQuery({
    queryKey: studentKeys.leaderboard({ scope: "battle_xp" }),
    queryFn: () => studentApi.getBattleLeaderboard(),
    staleTime: 60_000,
    retry: false,
  });
}

export function useMyBattleElo() {
  return useQuery({
    queryKey: studentKeys.battleElo,
    queryFn: studentApi.getMyBattleElo,
    staleTime: 60_000,
    retry: false,
  });
}

export function useMyBattleHistory() {
  return useQuery({
    queryKey: ["student", "battle", "history"],
    queryFn: studentApi.getMyBattleHistory,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── AI Self-Study ────────────────────────────────────────────────────────────

export function useStudyStatus(topicId: string) {
  return useQuery({
    queryKey: studentKeys.studyStatus(topicId),
    queryFn: () => studentApi.getStudyStatus(topicId),
    enabled: !!topicId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAiStudySession(topicId: string) {
  return useQuery({
    queryKey: studentKeys.aiSession(topicId),
    queryFn: () => studentApi.getAiStudySession(topicId),
    enabled: !!topicId,
    staleTime: 0,
    retry: false,
  });
}

export function useStartAiStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => studentApi.startAiStudy(topicId),
    onSuccess: (_data, topicId) => {
      qc.invalidateQueries({ queryKey: studentKeys.studyStatus(topicId) });
      qc.invalidateQueries({ queryKey: studentKeys.aiSession(topicId) });
    },
  });
}

export function useAskAiQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, sessionId, question }: { topicId: string; sessionId: string; question: string }) =>
      studentApi.askAiQuestion(topicId, sessionId, question),
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: studentKeys.aiSession(topicId) });
    },
  });
}

export function useCompleteAiStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, sessionId, timeSpentSeconds }: { topicId: string; sessionId: string; timeSpentSeconds: number }) =>
      studentApi.completeAiStudy(topicId, sessionId, timeSpentSeconds),
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: studentKeys.studyStatus(topicId) });
      qc.invalidateQueries({ queryKey: studentKeys.aiSession(topicId) });
      qc.invalidateQueries({ queryKey: studentKeys.me });
    },
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: studentApi.updateProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.me });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => studentApi.uploadAvatar(file),
    onSuccess: (avatarUrl) => {
      // Optimistically patch the cached me data so avatar updates instantly
      qc.setQueryData<studentApi.StudentMe>(studentKeys.me, (old) =>
        old ? { ...old, profilePictureUrl: avatarUrl } : old
      );
    },
  });
}
// ─── PYQ (Previous Year Questions) ───────────────────────────────────────────

export const pyqKeys = {
  overview: (topicId: string) => ["student", "pyq", "overview", topicId] as const,
  list: (topicId: string, params?: object) => ["student", "pyq", "list", topicId, params] as const,
  progress: (topicId: string) => ["student", "pyq", "progress", topicId] as const,
};

export function usePYQOverview(topicId: string) {
  return useQuery({
    queryKey: pyqKeys.overview(topicId),
    queryFn: () => studentApi.getPYQOverview(topicId),
    enabled: !!topicId,
    staleTime: 60_000,
  });
}

export function usePYQs(topicId: string, params: Record<string, any> = {}) {
  return useQuery({
    queryKey: pyqKeys.list(topicId, params),
    queryFn: () => studentApi.getPYQs(topicId, params),
    enabled: !!topicId,
    staleTime: 30_000,
  });
}

export function useMyPYQProgress(topicId: string) {
  return useQuery({
    queryKey: pyqKeys.progress(topicId),
    queryFn: () => studentApi.getMyPYQProgress(topicId),
    enabled: !!topicId,
    staleTime: 30_000,
  });
}

export function useSubmitPYQAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, questionId, payload }: {
      topicId: string;
      questionId: string;
      payload: { selectedOptionIds?: string[]; integerResponse?: string; timeTakenSeconds?: number };
    }) => studentApi.submitPYQAnswer(topicId, questionId, payload),
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: pyqKeys.overview(topicId) });
      qc.invalidateQueries({ queryKey: pyqKeys.progress(topicId) });
      qc.invalidateQueries({ queryKey: pyqKeys.list(topicId) });
    },
  });
}

export function useStartPYQSession() {
  return useMutation({
    mutationFn: ({ topicId, payload }: {
      topicId: string;
      payload: { year?: number; startYear?: number; endYear?: number; exam?: string; difficulty?: string; limit?: number };
    }) => studentApi.startPYQSession(topicId, payload),
  });
}

export function useProgressReport(studentId?: string) {
  return useQuery({
    queryKey: ['progress-report', studentId ?? 'self'],
    queryFn: () => studentApi.getProgressReport(studentId),
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

// ─── Weekly Activity ──────────────────────────────────────────────────────────

export function useWeeklyActivity() {
  return useQuery({
    queryKey: ["student", "weekly-activity"] as const,
    queryFn: studentApi.getWeeklyActivity,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

// ─── Continue Learning ────────────────────────────────────────────────────────

export function useContinueLearning() {
  return useQuery({
    queryKey: ["student", "continue-learning"] as const,
    queryFn: studentApi.getContinueLearning,
    staleTime: 60_000,
    retry: false,
  });
}

// ─── Student Profile (full) ───────────────────────────────────────────────────

export function useStudentProfile() {
  return useQuery({
    queryKey: ["student", "profile"] as const,
    queryFn: studentApi.getStudentProfile,
    staleTime: 60_000,
    retry: false,
  });
}

export function useUpdateStudentProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: studentApi.UpdateStudentProfilePayload) =>
      studentApi.updateStudentProfile(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", "profile"] });
      qc.invalidateQueries({ queryKey: studentKeys.me });
    },
  });
}

// ─── All Public Batches (no exam-target filter) ───────────────────────────────

export function useAllPublicBatches() {
  return useQuery({
    queryKey: ["student", "all-public-batches"] as const,
    queryFn: () => studentApi.getPublicBatches(undefined),
    staleTime: 60_000,
  });
}

// ─── Discover Batches ─────────────────────────────────────────────────────────

export function useDiscoverBatches(enabled = true) {
  return useQuery({
    queryKey: ["student", "discover-batches"] as const,
    queryFn: studentApi.discoverBatches,
    staleTime: Infinity,
    retry: false,
    enabled,
  });
}

export function useEnrollInBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => studentApi.enrollInBatch(batchId),
    onSuccess: (_data, batchId) => {
      qc.invalidateQueries({ queryKey: studentKeys.myCourses });
      qc.invalidateQueries({ queryKey: studentKeys.me });
      qc.invalidateQueries({ queryKey: ["student", "discover-batches"] });
      // Invalidate the preview so the detail page re-checks enrollment status
      qc.invalidateQueries({ queryKey: ["student", "batch-preview", batchId] });
      // Invalidate the curriculum so it reloads now that we're enrolled
      qc.invalidateQueries({ queryKey: studentKeys.courseCurriculum(batchId) });
    },
  });
}

export function useBatchPreview(batchId: string) {
  return useQuery({
    queryKey: ["student", "batch-preview", batchId] as const,
    queryFn: () => studentApi.getBatchPreview(batchId),
    staleTime: 0,       // always fetch fresh so resourceCounts are never served from stale cache
    gcTime: 0,
    retry: false,
    enabled: !!batchId,
  });
}
