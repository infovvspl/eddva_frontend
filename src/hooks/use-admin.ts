import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "@/lib/api/admin";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const adminKeys = {
  batches: ["admin", "batches"] as const,
  batch: (id: string) => ["admin", "batch", id] as const,
  batchRoster: (id: string) => ["admin", "batch", id, "roster"] as const,
  batchStudents: (id: string) => ["admin", "batch", id, "students"] as const,
  subjectTeachers: (batchId: string) => ["admin", "batch", batchId, "subject-teachers"] as const,
  teachers: ["admin", "teachers"] as const,
  teacher: (id: string) => ["admin", "teacher", id] as const,
  students: (params?: any) => ["admin", "students", params] as const,
  subjects: ["admin", "subjects"] as const,
  chapters: (subjectId: string) => ["admin", "chapters", subjectId] as const,
  topics: (chapterId: string) => ["admin", "topics", chapterId] as const,
  questions: (params?: any) => ["admin", "questions", params] as const,
  lectures: ["admin", "lectures"] as const,
  dashboard: ["admin", "dashboard"] as const,
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export function useAdminDashboard() {
  return useQuery({
    queryKey: adminKeys.dashboard,
    queryFn: adminApi.getAdminDashboardStats,
    staleTime: 30 * 1000, // 30s
  });
}

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------
export function useBatches() {
  return useQuery({ queryKey: adminKeys.batches, queryFn: adminApi.listBatches });
}

export function useBatch(id: string) {
  return useQuery({ queryKey: adminKeys.batch(id), queryFn: () => adminApi.getBatch(id), enabled: !!id });
}

export function useBatchRoster(id: string) {
  return useQuery({ queryKey: adminKeys.batchRoster(id), queryFn: () => adminApi.getBatchRoster(id), enabled: !!id });
}

export function useBatchAttendance(id: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["admin", "batch-attendance", id, startDate, endDate],
    queryFn: () => adminApi.getBatchAttendance(id, startDate, endDate),
    enabled: !!id && !!startDate && !!endDate,
  });
}

export function useBatchLiveAttendance(id: string) {
  return useQuery({
    queryKey: ["admin", "batch-live-attendance", id],
    queryFn: () => adminApi.getBatchLiveAttendance(id),
    enabled: !!id,
    refetchInterval: 30_000, // auto-refresh every 30s
    staleTime: 20_000,
  });
}

export function useBatchPerformance(id: string) {
  return useQuery({
    queryKey: ["admin", "batch-performance", id],
    queryFn: () => adminApi.getBatchPerformance(id),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.batches }),
  });
}

export function useUpdateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<adminApi.CreateBatchPayload & { status: string }>) =>
      adminApi.updateBatch(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.batches }),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteBatch,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.batches }),
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, studentId }: { batchId: string; studentId: string }) =>
      adminApi.enrollStudent(batchId, studentId),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: adminKeys.batchRoster(vars.batchId) }),
  });
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------
export function useTeachers() {
  return useQuery({ queryKey: adminKeys.teachers, queryFn: adminApi.listTeachers });
}

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createTeacher,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.teachers }),
  });
}

export function useTeacherDetail(id: string) {
  return useQuery({
    queryKey: adminKeys.teacher(id),
    queryFn: () => adminApi.getTeacherDetail(id),
    enabled: !!id,
  });
}

export function useBulkCreateTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.bulkCreateTeachers,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.teachers }),
  });
}

export function useSubjectTeachers(batchId: string) {
  return useQuery({
    queryKey: adminKeys.subjectTeachers(batchId),
    queryFn: () => adminApi.getSubjectTeachers(batchId),
    enabled: !!batchId,
  });
}

export function useAssignSubjectTeacher(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectName, teacherId }: { subjectName: string; teacherId: string }) =>
      adminApi.assignSubjectTeacher(batchId, subjectName, teacherId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjectTeachers(batchId) }),
  });
}

export function useRemoveSubjectTeacher(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) => adminApi.removeSubjectTeacher(batchId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjectTeachers(batchId) }),
  });
}

export function useCreateBatchStudent(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: adminApi.BatchStudentRow) => adminApi.createBatchStudent(batchId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.batchStudents(batchId) });
      qc.invalidateQueries({ queryKey: adminKeys.batches });
    },
  });
}

export function useBulkCreateBatchStudents(batchId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (students: adminApi.BatchStudentRow[]) => adminApi.bulkCreateBatchStudents(batchId, students),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.batchStudents(batchId) });
      qc.invalidateQueries({ queryKey: adminKeys.batches });
    },
  });
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------
export function useStudents(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: adminKeys.students(params),
    queryFn: () => adminApi.listStudents(params),
  });
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
export function useSubjects() {
  return useQuery({ queryKey: adminKeys.subjects, queryFn: adminApi.listSubjects });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteSubject,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.subjects }),
  });
}

export function useChapters(subjectId: string) {
  return useQuery({
    queryKey: adminKeys.chapters(subjectId),
    queryFn: () => adminApi.listChapters(subjectId),
    enabled: !!subjectId,
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createChapter,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "chapters"] }),
  });
}

export function useTopics(chapterId: string) {
  return useQuery({
    queryKey: adminKeys.topics(chapterId),
    queryFn: () => adminApi.listTopics(chapterId),
    enabled: !!chapterId,
  });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createTopic,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "topics"] }),
  });
}

export function useLectures() {
  return useQuery({ queryKey: adminKeys.lectures, queryFn: adminApi.listLectures });
}

export function useUnpublishLecture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.unpublishLecture,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.lectures }),
  });
}

export function useLectureStats(id: string) {
  return useQuery({
    queryKey: ["admin", "lecture-stats", id],
    queryFn: () => adminApi.getLectureStats(id),
    enabled: !!id,
  });
}

export function useBulkCreateQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.bulkCreateQuestions,
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.questions() }),
  });
}

// ---------------------------------------------------------------------------
// Mock Tests
// ---------------------------------------------------------------------------

export const mockTestKeys = {
  all: ["admin", "mock-tests"] as const,
  detail: (id: string) => ["admin", "mock-tests", id] as const,
};

export function useMockTests(params?: { batchId?: string; isPublished?: boolean }) {
  return useQuery({
    queryKey: [...mockTestKeys.all, params],
    queryFn: () => adminApi.listMockTests(params),
  });
}

export function useMockTestDetail(id: string) {
  return useQuery({
    queryKey: mockTestKeys.detail(id),
    queryFn: () => adminApi.getMockTest(id),
    enabled: !!id,
  });
}

export function useCreateMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createMockTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: mockTestKeys.all }),
  });
}

export function useUpdateMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof adminApi.updateMockTest>[1]) =>
      adminApi.updateMockTest(id, payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: mockTestKeys.all });
      qc.invalidateQueries({ queryKey: mockTestKeys.detail(vars.id) });
    },
  });
}

export function useDeleteMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteMockTest,
    onSuccess: () => qc.invalidateQueries({ queryKey: mockTestKeys.all }),
  });
}

export function usePublishMockTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      publish ? adminApi.publishMockTest(id) : adminApi.unpublishMockTest(id),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: mockTestKeys.all });
      qc.invalidateQueries({ queryKey: mockTestKeys.detail(vars.id) });
    },
  });
}

export function useAddQuestionToMockTest(mockTestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: adminApi.CreateMockTestQuestionPayload) =>
      adminApi.addQuestionToMockTest(mockTestId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: mockTestKeys.detail(mockTestId) }),
  });
}

export function useRemoveQuestionFromMockTest(mockTestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => adminApi.removeQuestionFromMockTest(mockTestId, questionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: mockTestKeys.detail(mockTestId) }),
  });
}

// ---------------------------------------------------------------------------
// Institute Settings
// ---------------------------------------------------------------------------

export const settingsKeys = {
  branding:      ["institute", "settings", "branding"]      as const,
  subscription:  ["institute", "settings", "subscription"]  as const,
  notifications: ["institute", "settings", "notifications"] as const,
  calendar:      (y?: number, m?: number) => ["institute", "settings", "calendar", y, m] as const,
};

export function useInstituteBranding() {
  return useQuery({ queryKey: settingsKeys.branding, queryFn: adminApi.getInstituteBranding });
}

export function useUpdateInstituteBranding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateInstituteBranding,
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.branding }),
  });
}

export function useInstituteSubscription() {
  return useQuery({ queryKey: settingsKeys.subscription, queryFn: adminApi.getInstituteSubscription });
}

export function useUpdateBillingEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateBillingEmail,
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.subscription }),
  });
}

export function useInstituteNotificationPrefs() {
  return useQuery({ queryKey: settingsKeys.notifications, queryFn: adminApi.getInstituteNotificationPrefs });
}

export function useUpdateInstituteNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateInstituteNotificationPrefs,
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.notifications }),
  });
}

export function useCalendarEvents(year?: number, month?: number) {
  return useQuery({
    queryKey: settingsKeys.calendar(year, month),
    queryFn: () => adminApi.getCalendarEvents(year, month),
  });
}

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createCalendarEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute", "settings", "calendar"] }),
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteCalendarEvent,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute", "settings", "calendar"] }),
  });
}

// ─── PYQ Admin ────────────────────────────────────────────────────────────────

export const pyqAdminKeys = {
  stats: ["admin", "pyq", "stats"] as const,
  unverified: (params?: object) => ["admin", "pyq", "unverified", params] as const,
};

export function usePYQStats() {
  return useQuery({ queryKey: pyqAdminKeys.stats, queryFn: adminApi.getPYQStats, staleTime: 60_000 });
}

export function useUnverifiedPYQs(params: { topicId?: string; exam?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: pyqAdminKeys.unverified(params),
    queryFn: () => adminApi.getUnverifiedPYQs(params),
    staleTime: 30_000,
  });
}

export function useVerifyPYQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, payload }: { questionId: string; payload: { isVerified: boolean; correctedContent?: string; correctedExplanation?: string } }) =>
      adminApi.verifyPYQ(questionId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pyqAdminKeys.stats });
      qc.invalidateQueries({ queryKey: pyqAdminKeys.unverified() });
    },
  });
}

export function useRejectPYQ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => adminApi.rejectPYQ(questionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pyqAdminKeys.stats });
      qc.invalidateQueries({ queryKey: pyqAdminKeys.unverified() });
    },
  });
}

export function useGenerateAIPYQs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.generateAIPYQs,
    onSuccess: () => qc.invalidateQueries({ queryKey: pyqAdminKeys.unverified() }),
  });
}

export function useGenerateChapterPYQs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.generateChapterPYQs,
    onSuccess: () => qc.invalidateQueries({ queryKey: pyqAdminKeys.unverified() }),
  });
}

export function useImportPYQCSV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => adminApi.importPYQCSV(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pyqAdminKeys.stats });
      qc.invalidateQueries({ queryKey: pyqAdminKeys.unverified() });
    },
  });
}
