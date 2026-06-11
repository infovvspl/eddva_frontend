import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import schoolApi from "@/lib/api/school-client";

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const schoolStudentKeys = {
  me: ["school-student", "me"] as const,
  coursePlanSummaries: ["school-student", "plan", "courses"] as const,
  plan: ["school-student", "plan", "today"] as const,
  todayPlanByBatch: (batchId: string) => ["school-student", "plan", "today", batchId] as const,
  weeklyPlan: (start: string, end: string) => ["school-student", "plan", "weekly", start, end] as const,
  weeklyPlanByBatch: (start: string, end: string, batchId: string) => ["school-student", "plan", "weekly", start, end, batchId] as const,
  progressReport: (batchId?: string) => ["school-student", "progress-report", batchId ?? "self"] as const,
  nextAction: (batchId?: string) => ["school-student", "plan", "next-action", batchId ?? ""] as const,
  revisionSpaced: (batchId?: string) => ["school-student", "revision", "spaced", batchId ?? ""] as const,
  revisionIntensive: (batchId?: string) => ["school-student", "revision", "intensive", batchId ?? ""] as const,
  revisionNotes: (batchId?: string) => ["school-student", "revision", "notes", batchId ?? ""] as const,
  practiceHistory: (batchId?: string) => ["school-student", "revision", "practice", batchId ?? ""] as const,
  studyStatus: (topicId: string) => ["school-student", "topics", topicId, "study-status"] as const,
  aiSession: (topicId: string) => ["school-student", "topics", topicId, "ai-study-session"] as const,
};

// ─── Profile / Stats ──────────────────────────────────────────────────────────
export function useStudentMe() {
  return useQuery({
    queryKey: schoolStudentKeys.me,
    queryFn: async () => {
      const res = await schoolApi.get("/auth/me");
      const me = res.data?.data ?? res.data ?? {};
      return {
        id: me.id,
        name: me.name,
        email: me.email,
        xpTotal: me.xpTotal ?? 0,
        currentStreak: me.currentStreak ?? 0,
        level: me.level ?? 1,
        studyConsistency: 85,
        accuracyTarget: 70,
        targetExam: "School",
        examYear: new Date().getFullYear(),
        currentClass: me.studentProfile?.className ?? "Class 10",
      };
    },
    staleTime: 5 * 60_000,
  });
}

// ─── My Courses / Summaries ────────────────────────────────────────────────────
export function useCoursePlanSummaries() {
  return useQuery({
    queryKey: schoolStudentKeys.coursePlanSummaries,
    queryFn: async () => {
      const res = await schoolApi.get("/study-plans/courses");
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 30_000,
  });
}

export function useMyCourses() {
  return useQuery({
    queryKey: ["school-student", "my-courses"],
    queryFn: async () => {
      const res = await schoolApi.get("/students/courses/my");
      const list = res.data?.data ?? res.data ?? [];
      return list.map((c: any) => ({
        id: c.batch?.id || c.enrollmentId,
        name: c.batch?.name || "School Class",
        examTarget: c.batch?.examTarget || "School",
        examYear: c.batch?.endDate ? new Date(c.batch.endDate).getFullYear() : new Date().getFullYear(),
        subjects: c.subjects ?? [],
        progress: c.progress ?? null,
      }));
    },
    staleTime: 60_000,
  });
}

export function useCourseCurriculum(classId?: string) {
  return useQuery({
    queryKey: ["school-student", "curriculum", classId],
    queryFn: async () => {
      if (!classId) return null;
      const res = await schoolApi.get(`/students/courses/${classId}`);
      const raw = res.data?.data ?? res.data ?? {};
      
      // Map school backend shape to B2C frontend shape so StudyPlanner can render it
      const subjects = (raw?.curriculum ?? []).map((s: any) => ({
        id:        s.id,
        name:      s.name,
        colorCode: s.colorCode ?? null,
        chapters:  (s.chapters ?? []).map((ch: any) => ({
          id:        ch.id,
          name:      ch.name,
          topics:    (ch.topics ?? []).map((t: any) => ({
            id:                 t.id,
            name:               t.name,
            status:             t.progress?.status ?? "unlocked",
            bestAccuracy:       t.progress?.bestAccuracy ?? 0,
            gatePassPercentage: t.gatePassPercentage ?? 70,
            completedAt:        t.progress?.completedAt ?? null,
            lectures: {
              total:     t.lectures?.total ?? 0,
              completed: t.lectures?.completed ?? 0,
            },
            resources:          t.resources ?? [],
            resourceCounts:     t.resourceCounts ?? {},
          })),
        })),
      }));

      return {
        batch: raw.batch,
        enrollment: raw.enrollment,
        summary: raw.summary,
        subjects,
        progress: raw.progress,
      };
    },
    enabled: !!classId,
    staleTime: 60_000,
  });
}

// ─── Todays Plan ──────────────────────────────────────────────────────────────
export function useTodaysPlan(batchId?: string) {
  return useQuery({
    queryKey: batchId ? schoolStudentKeys.todayPlanByBatch(batchId) : schoolStudentKeys.plan,
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/today${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Weekly Plan ──────────────────────────────────────────────────────────────
export function useWeeklyPlan(startDate: string, endDate: string, batchId?: string) {
  return useQuery({
    queryKey: batchId
      ? schoolStudentKeys.weeklyPlanByBatch(startDate, endDate, batchId)
      : schoolStudentKeys.weeklyPlan(startDate, endDate),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans?startDate=${startDate}&endDate=${endDate}${batchId ? `&batchId=${batchId}` : ""}`);
      const data = res.data?.data ?? res.data ?? {};
      if (Array.isArray(data)) return data;
      return Object.values(data).flat();
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60_000,
  });
}

export function useWeeklyPlanGrouped(startDate: string, endDate: string, batchId?: string) {
  return useQuery({
    queryKey: batchId
      ? [...schoolStudentKeys.weeklyPlanByBatch(startDate, endDate, batchId), "grouped"]
      : [...schoolStudentKeys.weeklyPlan(startDate, endDate), "grouped"],
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans?startDate=${startDate}&endDate=${endDate}${batchId ? `&batchId=${batchId}` : ""}`);
      const data = res.data?.data ?? res.data ?? {};
      if (Array.isArray(data)) {
        const today = new Date().toISOString().split("T")[0];
        return data.length ? { [today]: data } : {};
      }
      return data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────
export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await schoolApi.post("/study-plans/generate", payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["school-student", "plan"] });
      qc.invalidateQueries({ queryKey: ["school-student"] });
    },
  });
}

export function useRegeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload?: any) => {
      const body = typeof payload === "string" ? { batchId: payload } : (payload ?? {});
      const res = await schoolApi.post("/study-plans/regenerate", body);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["school-student", "plan"] });
      qc.invalidateQueries({ queryKey: ["school-student"] });
    },
  });
}

export function useClearPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batchId?: string) => {
      const res = await schoolApi.post("/study-plans/clear", batchId ? { batchId } : {});
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["school-student", "plan"] });
      qc.invalidateQueries({ queryKey: ["school-student"] });
    },
  });
}

export function useCompletePlanItem(batchId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await schoolApi.patch(`/study-plans/items/${itemId}/complete`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-student"] });
    },
  });
}

export function useSkipPlanItem(batchId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await schoolApi.patch(`/study-plans/items/${itemId}/skip`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["school-student", "plan"] });
    },
  });
}

// ─── Actions & Revision ───────────────────────────────────────────────────────
export function useNextAction(batchId?: string) {
  return useQuery({
    queryKey: schoolStudentKeys.nextAction(batchId),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/next-action${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? null;
    },
    staleTime: 60_000,
  });
}

export function useProgressReport(batchId?: string) {
  return useQuery({
    queryKey: schoolStudentKeys.progressReport(batchId),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/revision/intensive${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? null;
    },
    staleTime: 30_000,
  });
}

export function useRevisionSpaced(batchId?: string) {
  return useQuery({
    queryKey: schoolStudentKeys.revisionSpaced(batchId),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/revision/spaced${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useRevisionNotes(batchId?: string) {
  return useQuery({
    queryKey: schoolStudentKeys.revisionNotes(batchId),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/revision/notes${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function usePracticeHistory(batchId?: string) {
  return useQuery({
    queryKey: schoolStudentKeys.practiceHistory(batchId),
    queryFn: async () => {
      const res = await schoolApi.get(`/study-plans/revision/practice${batchId ? `?batchId=${batchId}` : ""}`);
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Dummy Stubs ─────────────────────────────────────────────────────────────
// Stubs to prevent compilation errors if referenced in layouts or generic imports
export function useAllBatchLectures(batchId?: string) {
  return useQuery({
    queryKey: ["school-student", "all-lectures", batchId],
    queryFn: async () => {
      const res = await schoolApi.get(`/classes/recordings${batchId ? `?classId=${batchId}` : ""}`);
      const list = res.data?.data ?? res.data ?? [];
      return list.map((l: any) => ({
        ...l,
        topic: l.topic_id ? {
          id: l.topic_id,
          name: l.topic_name,
          chapter: l.chapter_id ? {
            id: l.chapter_id,
            name: l.chapter_name,
            subject: l.subject_id ? {
              id: l.subject_id,
              name: l.subject_name
            } : undefined
          } : undefined
        } : undefined
      }));
    },
    staleTime: 30_000,
  });
}

export function useMockTests(params?: any) {
  return useQuery({
    queryKey: ["school-student", "mock-tests", params],
    queryFn: async () => {
      const q = new URLSearchParams(params).toString();
      const res = await schoolApi.get(`/assessments/mock-tests${q ? `?${q}` : ""}`);
      const list = res.data?.data ?? res.data ?? [];
      return list.map((t: any) => ({
        ...t,
        subjectName: t.subject_name || "Full Syllabus",
        chapterName: t.chapter_name || "All Chapters",
        batchId: t.class_id,
        classId: t.class_id
      }));
    },
    staleTime: 30_000,
  });
}

export function useStudentSessions() {
  return useQuery({
    queryKey: ["school-student", "sessions"],
    queryFn: () => [],
    staleTime: Infinity,
  });
}

export function useWeeklyActivity() {
  return useQuery({
    queryKey: ["school-student", "weekly-activity"],
    queryFn: () => [],
    staleTime: Infinity,
  });
}

export function useAiStudyHistory() {
  return useQuery({
    queryKey: ["school-student", "ai-study-history"],
    queryFn: async () => {
      const res = await schoolApi.get("/ai-study/history");
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useStudyStatus(topicId: string) {
  return useQuery({
    queryKey: schoolStudentKeys.studyStatus(topicId),
    queryFn: async () => {
      const res = await schoolApi.get(`/topics/${topicId}/study-status`);
      return res.data?.data ?? res.data;
    },
    enabled: !!topicId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useAiStudySession(topicId: string) {
  return useQuery({
    queryKey: schoolStudentKeys.aiSession(topicId),
    queryFn: async () => {
      const res = await schoolApi.get(`/topics/${topicId}/ai-study/session`);
      return res.data?.data === null ? null : (res.data?.data ?? res.data);
    },
    enabled: !!topicId,
    staleTime: 0,
    retry: false,
  });
}

export function useStartAiStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (topicId: string) => {
      const res = await schoolApi.post(`/topics/${topicId}/ai-study/start`);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, topicId) => {
      qc.invalidateQueries({ queryKey: schoolStudentKeys.studyStatus(topicId) });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.aiSession(topicId) });
    },
  });
}

export function useAskAiQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ topicId, sessionId, question }: { topicId: string; sessionId: string; question: string }) => {
      const res = await schoolApi.post(`/topics/${topicId}/ai-study/${sessionId}/ask`, { question });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: schoolStudentKeys.aiSession(topicId) });
    },
  });
}

export function useCompleteAiStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      topicId,
      sessionId,
      timeSpentSeconds,
      highlights,
      inlineComments,
    }: {
      topicId: string;
      sessionId: string;
      timeSpentSeconds: number;
      highlights: any[];
      inlineComments: any[];
    }) => {
      const res = await schoolApi.patch(`/topics/${topicId}/ai-study/${sessionId}/complete`, { timeSpentSeconds, highlights, inlineComments });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: schoolStudentKeys.studyStatus(topicId) });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.aiSession(topicId) });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.me });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.plan });
      qc.invalidateQueries({ queryKey: ["school-student", "ai-study-history"] });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.progressReport() });
    },
  });
}

export function useSaveAiStudyNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      topicId,
      sessionId,
      highlights,
      inlineComments,
    }: {
      topicId: string;
      sessionId: string;
      highlights: any[];
      inlineComments: any[];
    }) => {
      const res = await schoolApi.patch(`/topics/${topicId}/ai-study/${sessionId}/save-notes`, { highlights, inlineComments });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { topicId }) => {
      qc.invalidateQueries({ queryKey: schoolStudentKeys.aiSession(topicId) });
    },
  });
}

export function useGenerateAiQuiz() {
  return useMutation({
    mutationFn: async (topicId: string) => {
      const res = await schoolApi.post(`/topics/${topicId}/ai-quiz/generate`);
      return res.data?.data ?? res.data;
    },
  });
}

export function useCompleteAiQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      topicId,
      score,
      totalMarks,
      accuracy,
      correctCount,
      wrongCount,
    }: {
      topicId: string;
      score: number;
      totalMarks: number;
      accuracy: number;
      correctCount: number;
      wrongCount: number;
    }) => {
      const res = await schoolApi.post(`/topics/${topicId}/ai-quiz/complete`, { score, totalMarks, accuracy, correctCount, wrongCount });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: schoolStudentKeys.me });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.plan });
      qc.invalidateQueries({ queryKey: schoolStudentKeys.progressReport() });
    },
  });
}

