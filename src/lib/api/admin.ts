import { apiClient, extractData } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalBatches: number;
  activeBatches: number;
  totalLectures: number;
  totalTests: number;
  openDoubts: number;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  examTarget: string;
  class: string;
  teacherId: string;
  teacher?: { id: string; fullName: string };
  isPaid: boolean;
  feeAmount: number | null;
  /** Platform fee percentage (default 20) */
  platformFeePercent: number;
  status: string;
  startDate: string;
  endDate: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  studentCount?: number;
  teacherCount?: number;
  enrolledCount?: number;
  thumbnailUrl?: string;
  faqs?: { question: string; answer: string }[];
}

export interface CreateBatchPayload {
  name: string;
  description?: string;
  examTarget: string;
  class: string;
  teacherId?: string;
  isPaid?: boolean;
  feeAmount?: number;
  startDate?: string;
  endDate?: string;
  thumbnailUrl?: string;
  faqs?: { question: string; answer: string }[];
}

export interface Teacher {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateTeacherPayload {
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
}

export interface BulkTeacherRow {
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface BulkCreateResult {
  results: { fullName: string; email: string; tempPassword: string; status: string; error?: string }[];
  summary: { total: number; created: number; skipped: number };
  message: string;
}

export interface Student {
  id: string;
  userId: string;
  examTarget: string;
  class: string;
  examYear: number;
  language: string;
  city?: string;
  state?: string;
  xpTotal: number;
  currentStreak: number;
  onboardingComplete: boolean;
  createdAt: string;
  user?: { id: string; fullName: string; phoneNumber: string; email?: string; status: string; lastLoginAt?: string };
}

export interface Subject {
  id: string;
  batchId?: string | null;
  name: string;
  examTarget: string;
  icon?: string;
  colorCode?: string;
  sortOrder: number;
  isActive: boolean;
  chapters?: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  sortOrder: number;
  jeeWeightage?: number;
  neetWeightage?: number;
  isActive: boolean;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  chapterId: string;
  name: string;
  sortOrder: number;
  estimatedStudyMinutes?: number;
  gatePassPercentage?: number;
  isActive: boolean;
}

export type TopicResourceType = "pdf" | "dpp" | "pyq" | "quiz" | "video" | "notes" | "link";

export interface TopicResource {
  id: string;
  topicId: string;
  type: TopicResourceType;
  title: string;
  description?: string;
  fileUrl?: string | null;
  externalUrl?: string | null;
  fileSizeKb?: number;
  sortOrder?: number;
  createdAt: string;
}

export interface Question {
  id: string;
  topicId: string;
  content: string;
  type: string;
  difficulty: string;
  source: string;
  marksCorrect: number;
  marksWrong: number;
  isActive: boolean;
  options?: { id: string; optionLabel: string; content: string; isCorrect: boolean }[];
  createdAt: string;
}

export interface EnrollPayload {
  studentId: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardData {
  stats: {
    totalBatches: number;
    activeBatches: number;
    totalStudents: number;
    totalTeachers: number;
    activeTeachers: number;
    pendingTeachers: number;
    totalLectures: number;
    openDoubts: number;
    totalTestSessions: number;
  };
  recentBatches: {
    id: string;
    name: string;
    examTarget: string;
    class: string;
    status: string;
    teacherName: string | null;
    studentCount: number;
    maxStudents: number;
    startDate: string;
    endDate: string;
  }[];
}

export async function getAdminDashboardStats(): Promise<DashboardData> {
  const res = await apiClient.get("/batches/dashboard");
  return extractData<DashboardData>(res);
}

// ---------------------------------------------------------------------------
// Batches
// ---------------------------------------------------------------------------

export async function listBatches() {
  const res = await apiClient.get("/batches");
  return extractData<Batch[]>(res);
}

export async function getBatch(id: string) {
  const res = await apiClient.get(`/batches/${id}`);
  return extractData<Batch>(res);
}

export async function createBatch(payload: CreateBatchPayload) {
  const res = await apiClient.post("/batches", payload);
  return extractData<Batch>(res);
}

export async function updateBatch(id: string, payload: Partial<CreateBatchPayload & { status: string }>) {
  const res = await apiClient.patch(`/batches/${id}`, payload);
  return extractData<Batch>(res);
}

export async function deleteBatch(id: string) {
  const res = await apiClient.delete(`/batches/${id}`);
  return extractData<{ message: string }>(res);
}

export async function generateInviteLink(batchId: string) {
  const res = await apiClient.post(`/batches/${batchId}/invite-link`);
  return extractData<{ inviteUrl: string }>(res);
}

export interface BatchPreview {
  id: string;
  name: string;
  description?: string;
  examTarget: string;
  class: string;
  isPaid: boolean;
  feeAmount?: number;
  thumbnailUrl?: string;
  maxStudents: number;
  enrolledCount: number;
  startDate?: string;
  endDate?: string;
}

export async function getBatchPreview(token: string) {
  const res = await apiClient.get(`/batches/join/preview`, { params: { token } });
  return extractData<BatchPreview>(res);
}

export async function joinBatchByToken(token: string) {
  const res = await apiClient.post(`/batches/join`, { token });
  return extractData<{ message: string }>(res);
}

export async function getBatchRoster(batchId: string) {
  const res = await apiClient.get(`/batches/${batchId}/roster`);
  return extractData<any[]>(res);
}

export async function enrollStudent(batchId: string, studentId: string) {
  const res = await apiClient.post(`/batches/${batchId}/enroll`, { studentId });
  return extractData<any>(res);
}

export async function removeStudentFromBatch(batchId: string, studentId: string) {
  const res = await apiClient.delete(`/batches/${batchId}/students/${studentId}`);
  return extractData<{ message: string }>(res);
}

export async function getBatchAttendance(batchId: string, startDate: string, endDate: string) {
  const res = await apiClient.get(`/batches/${batchId}/attendance?startDate=${startDate}&endDate=${endDate}`);
  return extractData<any>(res);
}

export interface LiveAttendanceStudent {
  studentId: string;
  name: string | null;
  isActiveNow: boolean;
  studiedToday: boolean;
  lastLoginAt: string | null;
  lastActiveDate: string | null;
  lecturesWatchedToday: number;
  testsGivenToday: number;
  streakDays: number;
  currentActivity: string | null;
}

export interface LiveAttendance {
  totalStudents: number;
  activeNowCount: number;
  studiedTodayCount: number;
  asOf: string;
  students: LiveAttendanceStudent[];
}

export async function getBatchLiveAttendance(batchId: string) {
  const res = await apiClient.get(`/batches/${batchId}/live-attendance`);
  return extractData<LiveAttendance>(res);
}

export async function getBatchPerformance(batchId: string) {
  const res = await apiClient.get(`/batches/${batchId}/performance`);
  return extractData<any>(res);
}

export interface BatchStudentRow {
  fullName: string;
  phoneNumber: string;
  email: string;
}

export interface BulkStudentResult {
  results: { fullName: string; email: string; tempPassword: string; status: string; error?: string }[];
  summary: { total: number; created: number; skipped: number };
  message: string;
}

export async function createBatchStudent(batchId: string, payload: BatchStudentRow) {
  const res = await apiClient.post(`/batches/${batchId}/students`, payload);
  return extractData<{ student: any; tempPassword: string; message: string }>(res);
}

export async function bulkCreateBatchStudents(batchId: string, students: BatchStudentRow[]) {
  const res = await apiClient.post(`/batches/${batchId}/students/bulk`, { students });
  return extractData<BulkStudentResult>(res);
}

// ---------------------------------------------------------------------------
// Subject-Teacher Assignments
// ---------------------------------------------------------------------------

export interface SubjectTeacherAssignment {
  id: string;
  subjectName: string;
  teacherId: string;
  teacherName: string | null;
  teacherEmail: string | null;
  teacherStatus: string | null;
}

export async function getSubjectTeachers(batchId: string) {
  const res = await apiClient.get(`/batches/${batchId}/subject-teachers`);
  return extractData<SubjectTeacherAssignment[]>(res) ?? [];
}

export async function assignSubjectTeacher(batchId: string, subjectName: string, teacherId: string) {
  const res = await apiClient.post(`/batches/${batchId}/subject-teachers`, { subjectName, teacherId });
  return extractData<SubjectTeacherAssignment>(res);
}

export async function removeSubjectTeacher(batchId: string, assignmentId: string) {
  const res = await apiClient.delete(`/batches/${batchId}/subject-teachers/${assignmentId}`);
  return extractData<{ message: string }>(res);
}

// ---------------------------------------------------------------------------
// Teachers
// ---------------------------------------------------------------------------

export async function listTeachers() {
  const res = await apiClient.get("/auth/teachers");
  return extractData<Teacher[]>(res);
}

export async function createTeacher(payload: CreateTeacherPayload) {
  const res = await apiClient.post("/auth/teachers", payload);
  return extractData<{ teacher: Teacher; tempPassword: string; message: string }>(res);
}

export async function bulkCreateTeachers(teachers: BulkTeacherRow[]) {
  const res = await apiClient.post("/auth/teachers/bulk", { teachers });
  return extractData<BulkCreateResult>(res);
}

export interface TeacherDetail {
  teacher: Teacher;
  batches: {
    id: string;
    name: string;
    examTarget: string;
    class: string;
    status: string;
    maxStudents: number;
    startDate: string;
    endDate: string;
  }[];
  stats: {
    totalBatches: number;
    activeBatches: number;
    totalStudents: number;
    totalLectures: number;
    totalDoubts: number;
    resolvedDoubts: number;
    pendingDoubts: number;
  };
}

export async function getTeacherDetail(id: string) {
  const res = await apiClient.get(`/auth/teachers/${id}`);
  return extractData<TeacherDetail>(res);
}

// ---------------------------------------------------------------------------
// Students (via batch roster + content endpoints)
// ---------------------------------------------------------------------------

export async function listStudents(params?: { page?: number; limit?: number; search?: string }) {
  // Institute admin: aggregate students from all batches via /batches/{id}/students
  const batchesRes = await apiClient.get("/batches");
  const batches: any[] = extractData<any[]>(batchesRes) ?? [];

  const allStudents: any[] = [];
  const seen = new Set<string>();
  for (const batch of batches) {
    try {
      const rosterRes = await apiClient.get(`/batches/${batch.id}/roster`);
      const rosterRaw = extractData<any>(rosterRes);
      const roster: any[] = Array.isArray(rosterRaw) ? rosterRaw : (rosterRaw?.data ?? []);
      for (const s of roster) {
        const id = s.id || s.studentId || s.userId;
        if (id && !seen.has(id)) { seen.add(id); allStudents.push({ ...s, batchName: batch.name }); }
      }
    } catch { /* skip batches that fail */ }
  }

  // Client-side search + pagination
  const search = params?.search?.toLowerCase();
  const filtered = search
    ? allStudents.filter(s => (s.fullName || s.name || "").toLowerCase().includes(search) || (s.email || "").toLowerCase().includes(search) || (s.phoneNumber || s.phone || "").includes(search))
    : allStudents;

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return {
    items,
    meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) },
  };
}

// ---------------------------------------------------------------------------
// Content - Subjects
// ---------------------------------------------------------------------------

export async function listSubjects(batchId?: string) {
  const params = batchId ? `?batchId=${batchId}` : "";
  const res = await apiClient.get(`/content/subjects${params}`);
  return extractData<Subject[]>(res);
}

export async function createSubject(payload: { name: string; examTarget: string; batchId?: string; icon?: string; colorCode?: string }) {
  const res = await apiClient.post("/content/subjects", payload);
  return extractData<Subject>(res);
}

export async function updateSubject(id: string, payload: Partial<{ name: string; examTarget: string; isActive: boolean }>) {
  const res = await apiClient.patch(`/content/subjects/${id}`, payload);
  return extractData<Subject>(res);
}

export async function deleteSubject(id: string) {
  const res = await apiClient.delete(`/content/subjects/${id}`);
  return extractData<{ message: string }>(res);
}

// ---------------------------------------------------------------------------
// Content - Chapters
// ---------------------------------------------------------------------------

export async function listChapters(subjectId: string) {
  const res = await apiClient.get(`/content/chapters?subjectId=${subjectId}`);
  return extractData<Chapter[]>(res);
}

export async function createChapter(payload: { subjectId: string; name: string; sortOrder?: number }) {
  const res = await apiClient.post("/content/chapters", payload);
  return extractData<Chapter>(res);
}

export async function deleteChapter(id: string) {
  const res = await apiClient.delete(`/content/chapters/${id}`);
  return extractData<{ message: string }>(res);
}

// ---------------------------------------------------------------------------
// Content - Topics
// ---------------------------------------------------------------------------

export async function listTopics(chapterId: string) {
  const res = await apiClient.get(`/content/topics?chapterId=${chapterId}`);
  return extractData<Topic[]>(res);
}

export async function createTopic(payload: { chapterId: string; name: string; sortOrder?: number; estimatedStudyMinutes?: number; gatePassPercentage?: number }) {
  const res = await apiClient.post("/content/topics", payload);
  return extractData<Topic>(res);
}

export async function deleteTopic(id: string) {
  const res = await apiClient.delete(`/content/topics/${id}`);
  return extractData<{ message: string }>(res);
}

// ---------------------------------------------------------------------------
// Scope Resources (Mock Tests & PYQs at Course / Subject / Chapter / Topic)
// ---------------------------------------------------------------------------

export type ScopeLevel = "course" | "subject" | "chapter" | "topic";
export type ScopeResourceType = "mock_test" | "pyq";

export interface ScopeResource {
  id: string;
  type: ScopeResourceType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  sortOrder?: number;
  createdAt: string;
}

const _scopeListUrl: Record<ScopeLevel, (id: string) => string> = {
  course:  id => `/content/batches/${id}/resources`,
  subject: id => `/content/subjects/${id}/resources`,
  chapter: id => `/content/chapters/${id}/resources`,
  topic:   id => `/content/topics/${id}/resources`,
};

const _scopeUploadUrl: Record<ScopeLevel, (id: string) => string> = {
  course:  id => `/content/batches/${id}/resources/upload`,
  subject: id => `/content/subjects/${id}/resources/upload`,
  chapter: id => `/content/chapters/${id}/resources/upload`,
  topic:   id => `/content/topics/${id}/resources/upload`,
};

const _scopeDeleteUrl: Record<ScopeLevel, (id: string) => string> = {
  course:  id => `/content/batches/resources/${id}`,
  subject: id => `/content/subjects/resources/${id}`,
  chapter: id => `/content/chapters/resources/${id}`,
  topic:   id => `/content/topics/resources/${id}`,
};

export async function listScopeResources(level: ScopeLevel, scopeId: string): Promise<ScopeResource[]> {
  try {
    const res = await apiClient.get(_scopeListUrl[level](scopeId));
    const all = extractData<any[]>(res) ?? [];
    return all.filter((r: any) => r.type === "mock_test" || r.type === "pyq");
  } catch {
    return [];
  }
}

export async function uploadScopeResource(payload: {
  level: ScopeLevel;
  scopeId: string;
  file: File;
  type: ScopeResourceType;
  title: string;
  description?: string;
}): Promise<ScopeResource> {
  const fd = new FormData();
  fd.append("file", payload.file);
  fd.append("type", payload.type);
  fd.append("title", payload.title);
  if (payload.description) fd.append("description", payload.description);
  const res = await apiClient.post(_scopeUploadUrl[payload.level](payload.scopeId), fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return extractData<ScopeResource>(res);
}

export async function deleteScopeResource(level: ScopeLevel, resourceId: string): Promise<void> {
  await apiClient.delete(_scopeDeleteUrl[level](resourceId));
}

// ---------------------------------------------------------------------------
// Batch thumbnail upload
// ---------------------------------------------------------------------------

export async function uploadBatchThumbnail(batchId: string, file: File): Promise<{ thumbnailUrl: string }> {
  // Step 1 — upload the image file.
  // Primary route: POST /content/batches/:id/thumbnail (requires backend restart if newly added).
  // Fallback route: POST /auth/upload/avatar (always available, returns { url }).
  let thumbnailUrl = "";
  try {
    const fd = new FormData();
    fd.append("file", file);
    const primary = await apiClient.post(`/content/batches/${batchId}/thumbnail`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    thumbnailUrl = extractData<{ thumbnailUrl: string }>(primary)?.thumbnailUrl ?? "";
  } catch (primaryErr: any) {
    if (primaryErr?.response?.status === 404) {
      // Backend not yet restarted — fall back to avatar upload endpoint
      const fd2 = new FormData();
      fd2.append("file", file);
      const fallback = await apiClient.post("/auth/upload/avatar", fd2, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      thumbnailUrl = extractData<{ url: string }>(fallback)?.url ?? "";
    } else {
      throw primaryErr;
    }
  }

  if (!thumbnailUrl) throw new Error("Upload returned no URL");

  // Step 2 — persist the URL on the batch record
  await apiClient.patch(`/batches/${batchId}`, { thumbnailUrl });
  return { thumbnailUrl };
}

// ---------------------------------------------------------------------------
// Topic Resources (PDFs, DPPs, quizzes, etc.)
// ---------------------------------------------------------------------------

export async function listTopicResources(topicId: string) {
  const res = await apiClient.get(`/content/topics/${topicId}/resources`);
  return extractData<TopicResource[]>(res) ?? [];
}

export async function uploadTopicResource(payload: {
  topicId: string;
  file: File;
  type: TopicResourceType;
  title: string;
  description?: string;
  sortOrder?: number;
}) {
  const fd = new FormData();
  fd.append("file", payload.file);
  fd.append("type", payload.type);
  fd.append("title", payload.title);
  if (payload.description) fd.append("description", payload.description);
  if (payload.sortOrder != null) fd.append("sortOrder", String(payload.sortOrder));
  const res = await apiClient.post(
    `/content/topics/${payload.topicId}/resources/upload`,
    fd,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return extractData<TopicResource>(res);
}

export async function deleteTopicResource(resourceId: string, topicId: string) {
  const res = await apiClient.delete(`/content/topics/${topicId}/resources/${resourceId}`);
  return extractData<{ message: string }>(res);
}

export async function addTopicResourceLink(payload: {
  topicId: string;
  title: string;
  type: TopicResourceType;
  externalUrl: string;
  description?: string;
}) {
  const res = await apiClient.post(
    `/content/topics/${payload.topicId}/resources/link`,
    { title: payload.title, type: payload.type, externalUrl: payload.externalUrl, description: payload.description },
  );
  return extractData<TopicResource>(res);
}

// ---------------------------------------------------------------------------
// Content - Questions
// ---------------------------------------------------------------------------

export async function listQuestions(params?: { topicId?: string; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.topicId) query.set("topicId", params.topicId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const res = await apiClient.get(`/content/questions?${query}`);
  return extractData<any>(res);
}

export async function createQuestion(payload: any) {
  const res = await apiClient.post("/content/questions", payload);
  return extractData<Question>(res);
}

export async function bulkCreateQuestions(questions: any[]) {
  const res = await apiClient.post("/content/questions/bulk", { questions });
  return extractData<{ created: number; failed: number; errors: string[] }>(res);
}

// ---------------------------------------------------------------------------
// Content - Lectures
// ---------------------------------------------------------------------------

export interface CreateLecturePayload {
  batchId: string;
  topicId?: string;
  title: string;
  description?: string;
  type: "live" | "recorded";
  videoUrl?: string;
  scheduledAt?: string;
  liveMeetingUrl?: string;
}

export async function createLecture(dto: CreateLecturePayload) {
  const res = await apiClient.post("/content/lectures", dto);
  return extractData<any>(res);
}

export async function listLectures() {
  const res = await apiClient.get("/content/lectures");
  return extractData<any[]>(res);
}

export async function unpublishLecture(id: string) {
  const res = await apiClient.patch(`/content/lectures/${id}`, { status: "draft" });
  return extractData<any>(res);
}

export async function getLectureStats(id: string) {
  const res = await apiClient.get(`/content/lectures/${id}/stats`);
  const raw = extractData<any>(res);
  if (!raw) return raw;
  const totalStudents: number = raw.totalStudents ?? 0;
  const completedCount: number = raw.completedCount ?? 0;
  return {
    ...raw,
    // normalised aliases so all rendering code can use consistent names
    totalStudents,
    watchedCount: raw.watchedCount ?? 0,
    completedCount,
    avgWatchPercentage: raw.avgWatchPercentage ?? 0,
    // convenience aliases the admin page looks for
    totalViews: raw.watchedCount ?? 0,
    avgCompletionPct: raw.avgWatchPercentage ?? 0,
    completionRate: totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0,
    confusionHotspots: Array.isArray(raw.confusionHotspots)
      ? raw.confusionHotspots.map((h: any) => typeof h === 'number' ? h : { ...h, count: h.totalRewinds })
      : [],
  };
}

// ---------------------------------------------------------------------------
// Assessments - Mock Tests
// ---------------------------------------------------------------------------

export interface MockTest {
  id: string;
  title: string;
  type: "diagnostic" | "mock" | "practice" | "battle";
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  topicId?: string;
  batchId?: string;
  isPublished: boolean;
  scheduledAt?: string;
  createdAt: string;
  _count?: { questions: number };
}

export interface CreateMockTestPayload {
  title: string;
  type?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  batchId: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  scheduledAt?: string;
  questionIds: string[];
}

export interface MockTestQuestion {
  id: string;
  content: string;
  type: "mcq_single" | "mcq_multi" | "integer";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect: number;
  marksWrong: number;
  options?: { id: string; optionLabel: string; content: string; isCorrect: boolean }[];
}

export interface CreateMockTestQuestionPayload {
  content: string;
  type: "mcq_single" | "mcq_multi" | "integer";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect: number;
  marksWrong: number;
  options?: { optionLabel: string; content: string; isCorrect: boolean }[];
  integerAnswer?: string;
}

// ─── AI Question Generation ──────────────────────────────────────────────────

export interface AiGeneratedQuestion {
  questionText: string;
  options: { label: string; text: string }[];
  correctOption: string;
  difficulty?: string;
  subject?: string;
  explanation?: string;
}

export async function aiGenerateQuestions(payload: {
  transcript: string;
  lectureTitle?: string;
}): Promise<{ questions: AiGeneratedQuestion[] }> {
  const res = await apiClient.post("/ai/quiz/generate", payload, { timeout: 120_000 });
  return extractData(res);
}

// ---------------------------------------------------------------------------

export async function listMockTests(params?: { batchId?: string; isPublished?: boolean }): Promise<MockTest[]> {
  const q = new URLSearchParams();
  if (params?.batchId) q.set("batchId", params.batchId);
  if (params?.isPublished !== undefined) q.set("isPublished", String(params.isPublished));
  const res = await apiClient.get(`/assessments/mock-tests?${q}`);
  return extractData<MockTest[]>(res) ?? [];
}

export async function getMockTest(id: string): Promise<MockTest & { questions: MockTestQuestion[] }> {
  const res = await apiClient.get(`/assessments/mock-tests/${id}`);
  return extractData(res);
}

export async function createMockTest(payload: CreateMockTestPayload): Promise<MockTest> {
  // Strip undefined/empty fields so backend UUID validators don't choke
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  const res = await apiClient.post("/assessments/mock-tests", clean);
  return extractData<MockTest>(res);
}

export async function updateMockTest(id: string, payload: { title?: string; durationMinutes?: number; totalMarks?: number; passingMarks?: number; isPublished?: boolean; questionIds?: string[] }): Promise<MockTest> {
  const clean = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  const res = await apiClient.patch(`/assessments/mock-tests/${id}`, clean);
  return extractData<MockTest>(res);
}

export async function deleteMockTest(id: string): Promise<void> {
  await apiClient.delete(`/assessments/mock-tests/${id}`);
}

export async function publishMockTest(id: string): Promise<MockTest> {
  const res = await apiClient.patch(`/assessments/mock-tests/${id}`, { isPublished: true });
  return extractData<MockTest>(res);
}

export async function unpublishMockTest(id: string): Promise<MockTest> {
  const res = await apiClient.patch(`/assessments/mock-tests/${id}`, { isPublished: false });
  return extractData<MockTest>(res);
}

export async function addQuestionToMockTest(mockTestId: string, payload: CreateMockTestQuestionPayload): Promise<MockTestQuestion> {
  const res = await apiClient.post(`/assessments/mock-tests/${mockTestId}/questions`, payload);
  return extractData<MockTestQuestion>(res);
}

export async function removeQuestionFromMockTest(mockTestId: string, questionId: string): Promise<void> {
  await apiClient.delete(`/assessments/mock-tests/${mockTestId}/questions/${questionId}`);
}

// ---------------------------------------------------------------------------
// Institute Settings
// ---------------------------------------------------------------------------

export interface InstituteProfile {
  instituteName: string;
  adminName: string;
  email: string;
  orgImageUrl: string | null;
  coursesOffered: string[];
  yearsOfExperience: number | null;
  classTypes: string[];   // e.g. ["online", "offline", "hybrid"]
  teachingMode: string;   // e.g. "live", "recorded", "both"
}

export async function getInstituteProfile() {
  const res = await apiClient.get("/institute/settings/profile");
  return extractData<InstituteProfile>(res);
}

export async function updateInstituteProfile(payload: Partial<Omit<InstituteProfile, "orgImageUrl">>) {
  const res = await apiClient.patch("/institute/settings/profile", payload);
  return extractData<InstituteProfile>(res);
}

export async function uploadInstituteOrgImage(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);

  // Try the dedicated endpoint: POST /institute/settings/profile/image
  // Backend returns { avatarUrl } (saves to user.profilePictureUrl)
  try {
    const res = await apiClient.post("/institute/settings/profile/image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Accept both { avatarUrl } and { url } — backend currently returns avatarUrl
    const data = extractData<{ avatarUrl?: string; url?: string }>(res);
    const url = data?.avatarUrl ?? data?.url ?? "";
    if (!url) throw new Error("Upload returned no URL");
    return { url };
  } catch (err: any) {
    if (err?.response?.status !== 404) throw err;

    // 404 fallback: POST /auth/profile/avatar (always deployed)
    const fallbackRes = await apiClient.post("/auth/profile/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const fallbackData = extractData<{ avatarUrl?: string; url?: string }>(fallbackRes);
    const url = fallbackData?.avatarUrl ?? fallbackData?.url ?? "";
    if (!url) throw new Error("Fallback upload returned no URL");
    return { url };
  }
}

export async function getInstituteBranding() {
  const res = await apiClient.get("/institute/settings/branding");
  return extractData<{ logoUrl: string | null; brandColor: string; welcomeMessage: string; name: string; subdomain: string }>(res);
}

export async function updateInstituteBranding(payload: { logoUrl?: string; brandColor?: string; welcomeMessage?: string }) {
  const res = await apiClient.patch("/institute/settings/branding", payload);
  return extractData<any>(res);
}

export async function getInstituteSubscription() {
  const res = await apiClient.get("/institute/settings/subscription");
  return extractData<{
    plan: string; planLabel: string; status: string; trialEndsAt: string | null;
    maxStudents: number; maxTeachers: number; studentCount: number; teacherCount: number;
    studentUsagePct: number; teacherUsagePct: number; pricePerMonth: number;
    billingEmail: string | null;
    nextPlan: { key: string; label: string; maxStudents: number; maxTeachers: number; pricePerMonth: number } | null;
  }>(res);
}

export async function updateBillingEmail(billingEmail: string) {
  const res = await apiClient.patch("/institute/settings/billing-email", { billingEmail });
  return extractData<any>(res);
}

// ---------------------------------------------------------------------------
// Bulk Curriculum Import
// ---------------------------------------------------------------------------

export interface BulkImportTopic {
  name: string;
  estimatedStudyMinutes?: number;
}

export interface BulkImportChapter {
  name: string;
  jeeWeightage?: number;
  neetWeightage?: number;
  topics: BulkImportTopic[];
}

export interface BulkImportSubject {
  name: string;
  colorCode?: string;
  chapters: BulkImportChapter[];
}

export interface BulkImportPayload {
  batchId: string;
  examTarget?: string;
  subjects: BulkImportSubject[];
}

export interface BulkImportResult {
  message: string;
  created: { subjects: number; chapters: number; topics: number };
  skipped: { subjects: number; chapters: number; topics: number };
  curriculum: {
    id: string; name: string;
    chapters: { id: string; name: string; topics: { id: string; name: string }[] }[];
  }[];
}

export async function bulkImportCurriculum(payload: BulkImportPayload): Promise<BulkImportResult> {
  const res = await apiClient.post("/content/curriculum/bulk-import", payload);
  return extractData<BulkImportResult>(res);
}

export async function getInstituteNotificationPrefs() {
  const res = await apiClient.get("/institute/settings/notifications");
  return extractData<any>(res);
}

export async function updateInstituteNotificationPrefs(payload: any) {
  const res = await apiClient.patch("/institute/settings/notifications", payload);
  return extractData<any>(res);
}

export async function getCalendarEvents(year?: number, month?: number) {
  const q = new URLSearchParams();
  if (year)  q.set("year",  String(year));
  if (month) q.set("month", String(month));
  const res = await apiClient.get(`/institute/settings/calendar?${q}`);
  return extractData<any[]>(res);
}

export async function createCalendarEvent(payload: {
  title: string; type: string; date: string; endDate?: string; description?: string; color?: string;
}) {
  const res = await apiClient.post("/institute/settings/calendar", payload);
  return extractData<any>(res);
}

export async function deleteCalendarEvent(eventId: string) {
  const res = await apiClient.delete(`/institute/settings/calendar/${eventId}`);
  return extractData<any>(res);
}

// ─── Admin PYQ Management ──────────────────────────────────────────────────────

export interface PYQStatsRow { exam: string; examLabel: string; subject: string; total: number; verified: number; }
export interface PYQStats { totalVerified: number; totalUnverified: number; byExamAndSubject: PYQStatsRow[]; }

export interface UnverifiedPYQ {
  id: string;
  content: string;
  questionImageUrl: string | null;
  type: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  pyqYear: number;
  pyqExam: string;
  pyqExamLabel: string;
  solutionText: string | null;
  options: { optionLabel: string; content: string; isCorrect: boolean }[];
  topic: { id: string; name: string } | null;
  createdAt: string;
}

export async function getPYQStats(): Promise<PYQStats> {
  const res = await apiClient.get("/admin/pyqs/stats");
  return extractData<PYQStats>(res);
}

export async function getUnverifiedPYQs(params: { topicId?: string; exam?: string; page?: number; limit?: number } = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
  const res = await apiClient.get("/admin/pyqs/unverified?" + q.toString());
  return extractData<{ total: number; page: number; limit: number; questions: UnverifiedPYQ[] }>(res);
}

export async function verifyPYQ(questionId: string, payload: { isVerified: boolean; correctedContent?: string; correctedExplanation?: string }) {
  const res = await apiClient.patch("/admin/pyqs/" + questionId + "/verify", payload);
  return extractData<any>(res);
}

export async function rejectPYQ(questionId: string) {
  const res = await apiClient.delete("/admin/pyqs/" + questionId + "/reject");
  return extractData<any>(res);
}

export async function generateAIPYQs(payload: { topicId: string; startYear: number; endYear: number; exams: string[] }) {
  const res = await apiClient.post("/admin/pyqs/generate-ai", payload);
  return extractData<any>(res);
}

export async function generateChapterPYQs(payload: { chapterId: string; startYear: number; endYear: number; exams: string[] }) {
  const res = await apiClient.post("/admin/pyqs/generate-chapter", payload);
  return extractData<any>(res);
}

export async function importPYQCSV(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post("/admin/pyqs/import-csv", fd, { headers: { "Content-Type": "multipart/form-data" } });
  return extractData<any>(res);
}
