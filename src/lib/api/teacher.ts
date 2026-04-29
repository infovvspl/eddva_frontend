import { apiClient, extractData } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeacherBatch {
  id: string;
  name: string;
  examTarget: string;
  class: string;
  status: string;
  maxStudents: number;
  feeAmount: number;
  startDate: string;
  endDate: string;
  teacherId: string;
  teacherName?: string;
  studentCount?: number;
}

export interface RosterStudent {
  studentId: string;
  name: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  streakDays: number;
  lecturesWatchedThisWeek: number;
  lastTestScore: number | null;
}

export interface BatchPerformance {
  // backend returns these exact names
  avgAccuracy: number;
  avgScore: number;
  testCount: number;
  topStudents: { studentId: string; name: string | null; score: number }[];
  bottomStudents: { studentId: string; name: string | null; score: number }[];
  // keep aliases so existing code doesn't break
  averageAccuracy?: number;
  averageScore?: number;
  totalTests?: number;
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  batchId: string;
  teacherId: string;
  topicId?: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  thumbnailUrl?: string;
  scheduledAt?: string;
  liveMeetingUrl?: string;
  aiNotesMarkdown?: string;
  aiKeyConcepts?: string[];
  aiFormulas?: string[];
  transcript?: string;
  transcriptHi?: string;
  transcriptStatus?: "pending" | "processing" | "done" | "failed";
  transcriptLanguage?: string;
  lectureLanguage?: "en" | "hi" | "hinglish";
  createdAt: string;
  batch?: { id: string; name: string };
  topic?: {
    id: string;
    name: string;
    chapter?: { id: string; name: string; subject?: { id: string; name: string } };
  };
}

export interface CreateLecturePayload {
  batchId: string;
  title: string;
  description?: string;
  type: "recorded" | "live";
  topicId?: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  thumbnailUrl?: string;
  scheduledAt?: string;
  liveMeetingUrl?: string;
  lectureLanguage?: "en" | "hi" | "hinglish";
  status?: string;
  aiNotesMarkdown?: string;
  aiKeyConcepts?: string[];
}

export interface LectureStats {
  totalWatches: number;
  completionRate: number;
  averageWatchPercent: number;
  confusionHotspots: number[];
  // raw backend fields (kept for reference)
  totalStudents?: number;
}

export interface Doubt {
  id: string;
  questionText?: string;
  questionImageUrl?: string;
  ocrExtractedText?: string;
  source: string;
  status: "open" | "ai_resolved" | "escalated" | "teacher_resolved";
  explanationMode?: string;
  aiExplanation?: string;
  aiConceptLinks?: string[];
  teacherId?: string;
  teacherResponse?: string;
  teacherLectureRef?: string;
  teacherResponseImageUrl?: string;
  aiQualityRating?: "correct" | "partial" | "wrong";
  isHelpful?: boolean;
  isTeacherResponseHelpful?: boolean;
  teacherReviewedAt?: string;
  resolvedAt?: string;
  createdAt: string;
  student?: { id: string; fullName: string; phoneNumber?: string };
  topic?: { id: string; name: string; chapter?: { name: string; subject?: { name: string } } };
  minutesSinceAsked?: number;
  timeSinceAskedMinutes?: number;
  studentName?: string;
  topicName?: string;
  subjectName?: string;
}

export interface TeacherResponsePayload {
  teacherResponse: string;
  aiQualityRating?: "correct" | "partial" | "wrong";
  lectureRef?: string;
  responseImageUrl?: string;
}

export interface TeacherDashboardStats {
  totalBatches: number;
  totalStudents: number;
  totalLectures: number;
  openDoubts: number;
  activeBatches: number;
  recentBatches: TeacherBatch[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getTeacherDashboard(): Promise<TeacherDashboardStats> {
  const [batchesResult, lecturesResult, doubtsResult] = await Promise.allSettled([
    apiClient.get("/batches"),
    apiClient.get("/content/lectures"),
    apiClient.get("/doubts/queue"),
  ]);

  const batches: TeacherBatch[] = batchesResult.status === "fulfilled"
    ? (extractData<TeacherBatch[]>(batchesResult.value) ?? [])
    : [];
  const lectures: Lecture[] = lecturesResult.status === "fulfilled"
    ? (extractData<Lecture[]>(lecturesResult.value) ?? [])
    : [];
  const doubts: Doubt[] = doubtsResult.status === "fulfilled"
    ? (extractData<Doubt[]>(doubtsResult.value) ?? [])
    : [];

  return {
    totalBatches: batches.length,
    activeBatches: batches.filter(b => b.status === "active").length,
    totalStudents: 0,
    totalLectures: lectures.length,
    openDoubts: doubts.length,
    recentBatches: batches.slice(0, 5),
  };
}

export async function backfillStudyMaterialsFromTopicResources(): Promise<{
  tenantId: string;
  scanned: number;
  inserted: number;
  skipped: number;
}> {
  const res = await apiClient.post("/admin/study-materials/backfill-topic-resources");
  return extractData<{ tenantId: string; scanned: number; inserted: number; skipped: number }>(res);
}

// ─── AI Engine Health ─────────────────────────────────────────────────────────

export interface AiEngineHealth {
  overall: "operational" | "degraded" | "critical";
  summary: { total: number; ok: number; rate_limited: number; dead: number; error: number; usable: number };
  keys: { index: number; hint: string; status: "ok" | "dead" }[];
  cached: boolean;
}

export async function getAiEngineHealth(refresh = false): Promise<AiEngineHealth> {
  const res = await apiClient.get(`/ai/engine/health${refresh ? "?refresh=true" : ""}`);
  return extractData<AiEngineHealth>(res);
}

// ─── Batches ──────────────────────────────────────────────────────────────────

/** Returns subject-teacher assignments for a batch (used to filter subject dropdown) */
export async function getBatchSubjectTeachers(batchId: string): Promise<{ subjectName: string; teacherId: string }[]> {
  const res = await apiClient.get(`/batches/${batchId}/subject-teachers`);
  const result = extractData<any[]>(res);
  return Array.isArray(result) ? result : [];
}

export async function getMyBatches(): Promise<TeacherBatch[]> {
  const res = await apiClient.get("/batches");
  return extractData<TeacherBatch[]>(res) ?? [];
}

export async function getBatchRoster(batchId: string): Promise<RosterStudent[]> {
  const res = await apiClient.get(`/batches/${batchId}/roster`);
  const result = extractData<{ data: RosterStudent[]; meta: any } | RosterStudent[]>(res);
  // Backend wraps in { data: [...], meta: {...} } pagination object
  if (result && !Array.isArray(result) && Array.isArray((result as any).data)) {
    return (result as any).data ?? [];
  }
  return (result as RosterStudent[]) ?? [];
}

export async function getBatchPerformance(batchId: string): Promise<BatchPerformance> {
  const res = await apiClient.get(`/batches/${batchId}/performance`);
  return extractData<BatchPerformance>(res);
}

// ─── Lectures ─────────────────────────────────────────────────────────────────

export type GetMyLecturesParams = {
  batchId?: string;
  topicId?: string;
  chapterId?: string;
  subjectId?: string;
  /** List endpoint max is 500. */
  limit?: number;
};

export async function getMyLectures(filters?: GetMyLecturesParams): Promise<Lecture[]> {
  const q = new URLSearchParams();
  if (filters?.batchId) q.set("batchId", filters.batchId);
  if (filters?.topicId) q.set("topicId", filters.topicId);
  if (filters?.chapterId) q.set("chapterId", filters.chapterId);
  if (filters?.subjectId) q.set("subjectId", filters.subjectId);
  q.set("limit", String(filters?.limit ?? 500));
  const qs = q.toString();
  const res = await apiClient.get(`/content/lectures?${qs}`);
  return extractData<Lecture[]>(res) ?? [];
}

export async function createLecture(payload: CreateLecturePayload): Promise<Lecture> {
  const res = await apiClient.post("/content/lectures", payload);
  return extractData<Lecture>(res);
}

export async function updateLecture(id: string, payload: Partial<CreateLecturePayload>): Promise<Lecture> {
  const res = await apiClient.patch(`/content/lectures/${id}`, payload);
  return extractData<Lecture>(res);
}

export async function deleteLecture(id: string): Promise<{ message: string }> {
  const res = await apiClient.delete(`/content/lectures/${id}`);
  return extractData<{ message: string }>(res);
}

export async function retranscribeLecture(id: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/content/lectures/${id}/retranscribe`, {});
  return extractData<{ message: string }>(res);
}

export async function regenerateNotes(id: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/content/lectures/${id}/regenerate-notes`, {});
  return extractData<{ message: string }>(res);
}

export async function translateTranscriptToHindi(id: string): Promise<{ transcriptHi: string }> {
  const res = await apiClient.post(`/content/lectures/${id}/translate-transcript`, {});
  return extractData<{ transcriptHi: string }>(res);
}

export async function translateNotesToEnglish(id: string): Promise<{ notesEn: string }> {
  const res = await apiClient.post(`/content/lectures/${id}/translate-notes`, {});
  return extractData<{ notesEn: string }>(res);
}

export async function getLectureStats(id: string): Promise<LectureStats> {
  const res = await apiClient.get(`/content/lectures/${id}/stats`);
  const raw = extractData<any>(res);
  if (!raw) return raw;
  // Map backend field names → frontend interface
  const totalStudents: number = raw.totalStudents ?? 0;
  const completedCount: number = raw.completedCount ?? 0;
  return {
    totalStudents,
    totalWatches: raw.watchedCount ?? 0,
    completionRate: totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0,
    averageWatchPercent: raw.avgWatchPercentage ?? 0,
    // backend returns [{timestampSeconds, totalRewinds}] → extract just the seconds
    confusionHotspots: Array.isArray(raw.confusionHotspots)
      ? raw.confusionHotspots.map((h: any) => typeof h === 'number' ? h : h.timestampSeconds)
      : [],
  };
}

// ─── Doubts ───────────────────────────────────────────────────────────────────

export async function getDoubtQueue(batchId?: string): Promise<Doubt[]> {
  const q = new URLSearchParams();
  if (batchId) q.set("batchId", batchId);
  const qs = q.toString();
  const res = await apiClient.get(`/doubts/queue${qs ? `?${qs}` : ""}`);
  return extractData<Doubt[]>(res) ?? [];
}

export async function getAllDoubts(params?: { status?: string; batchId?: string; page?: number; limit?: number }): Promise<Doubt[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.batchId) q.set("batchId", params.batchId);
  if (params?.page) q.set("page", String(params.page));
  q.set("limit", String(params?.limit ?? 100));
  const res = await apiClient.get(`/doubts?${q}`);
  return extractData<Doubt[]>(res) ?? [];
}

export async function getDoubtById(id: string): Promise<Doubt> {
  const res = await apiClient.get(`/doubts/${id}`);
  return extractData<Doubt>(res);
}

export async function respondToDoubt(id: string, payload: TeacherResponsePayload): Promise<Doubt> {
  const res = await apiClient.patch(`/doubts/${id}/teacher-response`, payload);
  return extractData<Doubt>(res);
}

export async function markDoubtReviewed(id: string, aiQualityRating = "correct"): Promise<Doubt> {
  const res = await apiClient.patch(`/doubts/${id}/mark-reviewed`, { aiQualityRating });
  return extractData<Doubt>(res);
}

export async function deleteDoubt(id: string): Promise<void> {
  await apiClient.delete(`/doubts/${id}`);
}

/** Teacher runs full AI resolution for an escalated (or open) doubt — same outcome as student-side AI answer. */
export async function resolveDoubtWithAiAsTeacher(doubtId: string): Promise<Doubt> {
  const res = await apiClient.patch(`/doubts/${doubtId}/resolve-with-ai`, {});
  return extractData<Doubt>(res);
}

export async function rateTeacherResponse(id: string, isHelpful: boolean): Promise<Doubt> {
  const res = await apiClient.patch(`/doubts/${id}/rate-teacher`, { isHelpful });
  return extractData<Doubt>(res);
}

// ─── AI Tools ─────────────────────────────────────────────────────────────────

export interface GradeSubjectivePayload {
  questionText: string;
  studentAnswer: string;
  rubric?: string;
  subjectArea?: string;
}

export interface GradeSubjectiveResult {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  rubricBreakdown?: Record<string, number>;
}

export interface EngagementDetectPayload {
  studentId?: string;
  signals: {
    clickRate?: number;
    scrollDepth?: number;
    pauseCount?: number;
    replayCount?: number;
    timeOnPage?: number;
    interactionCount?: number;
  };
}

export interface EngagementDetectResult {
  engagementLevel: "high" | "medium" | "low" | "disengaged";
  engagementScore: number;
  insights: string[];
  recommendations: string[];
}

export interface SttNotesPayload {
  audioUrl: string;
  language?: string;
}

export interface SttNotesResult {
  transcript: string;
  notesMarkdown: string;
  keyConcepts: string[];
  summary: string;
}

export interface FeedbackGeneratePayload {
  studentId?: string;
  performanceData: {
    averageScore: number;
    weakTopics: string[];
    strongTopics: string[];
    recentTestScores: number[];
    totalTests?: number;
  };
}

export interface FeedbackGenerateResult {
  feedback: string;
  studyPlan: string[];
  priorityTopics: string[];
  motivationalMessage: string;
}

export interface PerformanceAnalyzePayload {
  studentId?: string;
  testHistory: {
    testId?: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    topicId?: string;
    topicName?: string;
    takenAt?: string;
  }[];
}

export interface PerformanceAnalyzeResult {
  overallTrend: "improving" | "declining" | "stable";
  averageScore: number;
  weakAreas: string[];
  strongAreas: string[];
  predictedScore: number;
  insights: string[];
  recommendations: string[];
}

export async function gradeSubjective(payload: GradeSubjectivePayload): Promise<GradeSubjectiveResult> {
  const res = await apiClient.post("/ai/grade/subjective", payload);
  return extractData<GradeSubjectiveResult>(res);
}

export async function detectEngagement(payload: EngagementDetectPayload): Promise<EngagementDetectResult> {
  const res = await apiClient.post("/ai/engagement/detect", payload);
  return extractData<EngagementDetectResult>(res);
}

export async function generateLectureNotes(payload: SttNotesPayload): Promise<SttNotesResult> {
  // Video transcription + LLM notes can take 3-8 minutes for long videos
  const res = await apiClient.post("/ai/stt/notes", payload, { timeout: 600_000 });
  return extractData<SttNotesResult>(res);
}

export async function generateFeedback(payload: FeedbackGeneratePayload): Promise<FeedbackGenerateResult> {
  const res = await apiClient.post("/ai/feedback/generate", payload);
  return extractData<FeedbackGenerateResult>(res);
}

export async function analyzePerformance(payload: PerformanceAnalyzePayload): Promise<PerformanceAnalyzeResult> {
  const res = await apiClient.post("/ai/performance/analyze", payload);
  return extractData<PerformanceAnalyzeResult>(res);
}

// ─── Quiz / Mock Test ──────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  topicId: string;
  content: string;
  type: "mcq_single" | "mcq_multi" | "integer" | "descriptive";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect: number;
  marksWrong: number;
  integerAnswer?: string;
  tags?: string[];
  source?: string;
  options?: { id: string; optionLabel: string; content: string; isCorrect: boolean; sortOrder: number }[];
  topic?: { id: string; name: string };
}

export interface MockTest {
  id: string;
  title: string;
  type: string;
  totalMarks: number;
  durationMinutes: number;
  passingMarks?: number;
  questionIds: string[];
  questions?: QuizQuestion[];
  batchId?: string;
  topicId?: string;
  isPublished: boolean;
  scheduledAt?: string;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  allowReattempt: boolean;
  createdAt: string;
  createdBy: string;
}

export interface CreateMockTestPayload {
  batchId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  topicId?: string;
  questionIds: string[];
  scheduledAt?: string;
  shuffleQuestions?: boolean;
  showAnswersAfterSubmit?: boolean;
  allowReattempt?: boolean;
}

export interface MockTestListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MockTestSession {
  id: string;
  studentId: string;
  mockTestId: string;
  status: "in_progress" | "completed" | "abandoned";
  totalScore?: number;
  correctCount?: number;
  wrongCount?: number;
  skippedCount?: number;
  startedAt: string;
  submittedAt?: string;
  student?: { id: string; fullName: string };
}

export interface BankQuestion {
  id: string;
  content: string;
  type: string;
  difficulty: string;
  marksCorrect: number;
  marksWrong: number;
  topicId: string;
  topic?: { id: string; name: string };
  options?: { id: string; optionLabel: string; content: string; isCorrect: boolean }[];
}

export async function getMockTests(params?: { batchId?: string; isPublished?: boolean; page?: number; limit?: number }): Promise<MockTest[]> {
  const query = new URLSearchParams();
  if (params?.batchId) query.set("batchId", params.batchId);
  if (params?.isPublished !== undefined) query.set("isPublished", String(params.isPublished));
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const res = await apiClient.get(`/assessments/mock-tests?${query}`);
  return extractData(res);
}

export async function getMockTestById(id: string): Promise<MockTest> {
  const res = await apiClient.get(`/assessments/mock-tests/${id}`);
  return extractData<MockTest>(res);
}

export async function createMockTest(payload: CreateMockTestPayload): Promise<MockTest> {
  const res = await apiClient.post("/assessments/mock-tests", payload);
  return extractData<MockTest>(res);
}

export async function updateMockTest(id: string, payload: Partial<CreateMockTestPayload> & { isPublished?: boolean }): Promise<MockTest> {
  const res = await apiClient.patch(`/assessments/mock-tests/${id}`, payload);
  return extractData<MockTest>(res);
}

export async function deleteMockTest(id: string): Promise<{ message: string }> {
  const res = await apiClient.delete(`/assessments/mock-tests/${id}`);
  return extractData<{ message: string }>(res);
}

export interface QuestionStat {
  questionId: string;
  order: number;
  content: string;
  type: string;
  difficulty: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number | null;       // null if no attempts yet
  avgTimeSeconds: number | null;
}

export async function getMockTestQuestionStats(mockTestId: string): Promise<QuestionStat[]> {
  const res = await apiClient.get(`/assessments/mock-tests/${mockTestId}/question-stats`);
  return extractData<QuestionStat[]>(res) ?? [];
}

export async function getMockTestSessions(mockTestId: string): Promise<MockTestSession[]> {
  const res = await apiClient.get(`/assessments/sessions?mockTestId=${mockTestId}&limit=500`);
  const result = extractData<{ data: MockTestSession[]; meta: any } | MockTestSession[]>(res);
  if (result && !Array.isArray(result) && Array.isArray((result as any).data)) {
    return (result as any).data ?? [];
  }
  return (result as MockTestSession[]) ?? [];
}

export async function getQuestionBank(params?: { topicId?: string; difficulty?: string; type?: string; search?: string; page?: number; limit?: number }): Promise<{ data: BankQuestion[]; meta: MockTestListMeta }> {
  const query = new URLSearchParams();
  if (params?.topicId) query.set("topicId", params.topicId);
  if (params?.difficulty) query.set("difficulty", params.difficulty);
  if (params?.type) query.set("type", params.type);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const res = await apiClient.get(`/content/questions?${query}`);
  return extractData(res);
}

export interface CreateQuestionPayload {
  topicId: string;
  content: string;
  type: "mcq_single" | "mcq_multi" | "integer" | "descriptive";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect?: number;
  marksWrong?: number;
  integerAnswer?: string;
  /** Shown after mock test submit (review); populate from AI explanation when generating */
  solutionText?: string;
  tags?: string[];
  options?: { optionLabel: string; content: string; isCorrect: boolean; sortOrder?: number }[];
}

export async function createQuestion(payload: CreateQuestionPayload): Promise<BankQuestion> {
  const res = await apiClient.post("/content/questions", payload);
  return extractData<BankQuestion>(res);
}

// ─── In-Video Quiz ─────────────────────────────────────────────────────────

export interface QuizOption { label: string; text: string; }

export interface QuizCheckpoint {
  id: string;
  questionText: string;
  options: QuizOption[];
  correctOption: string;
  triggerAtPercent: number;
  segmentTitle: string;
  explanation?: string;
}

export interface QuizResponse {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  answeredAt: string;
  timeTakenSeconds?: number;
}

export interface QuizSubmitResult {
  isCorrect: boolean;
  correctOption: string;
  explanation?: string;
}

export interface StudentWatchStat {
  studentId: string;
  studentName: string;
  watchPercentage: number;
  isCompleted: boolean;
  lastPositionSeconds: number;
  quizScore: number | null;
  answeredCount: number;
  correctCount: number;
  responses: QuizResponse[];
}

export interface QuestionStat {
  questionId: string;
  questionText: string;
  segmentTitle: string;
  totalAttempts: number;
  correctCount: number;
  accuracy: number | null;
}

export interface WatchAnalytics {
  students: StudentWatchStat[];
  questionStats: QuestionStat[];
  totalWatchers: number;
}

export interface AiQuizResult {
  questions: QuizCheckpoint[];
}

export async function generateQuizForLecture(payload: {
  notes?: string;
  transcript?: string;
  lectureTitle?: string;
  topicId?: string;
  numQuestions?: number;
  courseLevel?: string;
}): Promise<AiQuizResult> {
  const res = await apiClient.post("/ai/quiz/generate", payload, { timeout: 180_000 });
  return extractData<AiQuizResult>(res);
}

export async function saveQuizCheckpoints(lectureId: string, questions: QuizCheckpoint[]): Promise<{ message: string; count: number }> {
  const res = await apiClient.put(`/content/lectures/${lectureId}/quiz-checkpoints`, { questions });
  return extractData(res);
}

export async function getQuizCheckpoints(lectureId: string): Promise<QuizCheckpoint[]> {
  const res = await apiClient.get(`/content/lectures/${lectureId}/quiz-checkpoints`);
  return extractData<QuizCheckpoint[]>(res) ?? [];
}

export async function submitQuizResponse(lectureId: string, payload: { questionId: string; selectedOption: string; timeTakenSeconds?: number }): Promise<QuizSubmitResult> {
  const res = await apiClient.post(`/content/lectures/${lectureId}/quiz-response`, payload);
  return extractData<QuizSubmitResult>(res);
}

export async function getWatchAnalytics(lectureId: string): Promise<WatchAnalytics> {
  const res = await apiClient.get(`/content/lectures/${lectureId}/watch-analytics`);
  return extractData<WatchAnalytics>(res);
}

export interface LectureCompletionReward {
  xpAwarded: number;
  quizAvailable: boolean;
  mockTestId: string | null;
  topicId: string;
  message: string;
}

export async function upsertLectureProgress(
  lectureId: string,
  payload: { watchPercentage: number; lastPositionSeconds: number; rewindCount?: number },
): Promise<{ completionReward?: LectureCompletionReward }> {
  const res = await apiClient.post(`/content/lectures/${lectureId}/progress`, payload);
  return extractData<{ completionReward?: LectureCompletionReward }>(res) ?? {};
}

// ─── Manage My Students ───────────────────────────────────────────────────────

export type FlagReason = 'missed_classes' | 'score_drop' | 'not_engaging';
export type EngagementState = 'engaged' | 'bored' | 'confused' | 'frustrated' | 'thriving';
export type WeakTopicSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface StudentProfileDetail {
  studentId: string;
  userId: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  class: string;
  examTarget: string;
  examYear: string;
  targetCollege: string | null;
  streakDays: number;
  longestStreak: number;
  xpTotal: number;
  lastActiveDate: string | null;
  lastLoginAt: string | null;
  subscriptionPlan: string;
  enrolledAt: string;
  aiEngagementState: EngagementState | null;
}

export interface StudentAttendanceSummary {
  totalLectures: number;
  watchedLectures: number;
  attendancePct: number;
}

export interface StudentEngagementLogItem {
  state: EngagementState;
  context: string;
  contextRefId: string | null;
  confidence: number | null;
  loggedAt: string;
}

export interface StudentWeakTopicItem {
  topicId: string;
  topicName: string;
  severity: WeakTopicSeverity;
  accuracy: number;
  wrongCount: number;
  lastAttemptedAt: string | null;
}

export interface StudentLectureItem {
  lectureId: string;
  title: string;
  scheduledAt: string | null;
  watchPercentage: number;
  isCompleted: boolean;
  rewindCount: number;
  quizScore: number | null;
  quizTotal: number;
  quizCorrect: number;
}

export interface StudentTestScoreItem {
  sessionId: string;
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  submittedAt: string;
}

export interface StudentDetail {
  profile: StudentProfileDetail;
  attendance: StudentAttendanceSummary;
  engagementLogs: StudentEngagementLogItem[];
  weakTopics: StudentWeakTopicItem[];
  lectures: StudentLectureItem[];
  testScores: StudentTestScoreItem[];
}

export interface InactiveStudent {
  studentId: string;
  userId: string | null;
  name: string | null;
  phone: string | null;
  lastLoginAt: string | null;
  daysInactive: number | null;
  streakDays: number;
}

export interface InactiveStudentsResult {
  total: number;
  cutoffDays: number;
  students: InactiveStudent[];
}

export interface FlagStudentPayload {
  reason: FlagReason;
  note?: string;
}

export interface FlagStudentResult {
  flagged: boolean;
  studentName: string | null;
  reason: FlagReason;
  parentNotified: boolean;
  adminsNotified: number;
}

export async function getStudentDetail(batchId: string, studentId: string): Promise<StudentDetail> {
  const res = await apiClient.get(`/analytics/teacher/student/${studentId}/profile`, {
    params: batchId ? { batchId } : {}
  });
  return extractData(res);
}

export async function flagStudent(batchId: string, studentId: string, payload: FlagStudentPayload): Promise<FlagStudentResult> {
  const res = await apiClient.post(`/batches/${batchId}/students/${studentId}/flag`, payload);
  return extractData(res);
}

export async function getInactiveStudents(batchId: string): Promise<InactiveStudentsResult> {
  const res = await apiClient.get(`/batches/${batchId}/inactive`);
  return extractData(res);
}

export async function sendBulkReminder(batchId: string): Promise<{ sent: number; message: string }> {
  const res = await apiClient.post(`/batches/${batchId}/bulk-remind`, {});
  return extractData(res);
}

export async function removeStudentFromBatch(batchId: string, studentId: string): Promise<{ message: string }> {
  const res = await apiClient.delete(`/batches/${batchId}/students/${studentId}`);
  return extractData(res);
}

// ─── Teacher Analytics Types ──────────────────────────────────────────────────

export interface TeacherOverview {
  totalBatches: number;
  totalStudents: number;
  quizzes: { totalAttempts: number; avgScore: number };
  lectures: { avgWatchPercentage: number; completedCount: number };
  doubts: { total: number; open: number; resolved: number; resolutionRate: number };
  batches: { id: string; name: string; status: string }[];
}

export interface ClassPerformanceStudent {
  studentId: string;
  name: string;
  avatar: string | null;
  quizzesTaken: number;
  avgScore: number;
  accuracy: number;
  avgWatchPercentage: number;
  doubtCount: number;
  openDoubts: number;
  rank: number;
  accuracyPerSubject: Record<string, number>;
  errorBreakdown: { conceptual: number; silly: number; time: number; guess: number; skip: number };
}

export interface TopicCoverageItem {
  topicId: string;
  topicName: string;
  chapterName: string;
  subjectName: string;
  severity: string;
  affectedStudents: number;
  affectedPercentage: number;
  avgAccuracy: number;
  totalWrong: number;
  totalDoubt: number;
  taught: boolean;
  lectureCount: number;
  gatePassPercentage: number;
  estimatedStudyMinutes: number;
  studentsPassedGate: number;
  gatePassRate: number;
}

export interface EngagementSegment {
  segmentIndex: number;
  startSeconds: number;
  endSeconds: number;
  rewindCount: number;
  confusionCount: number;
  watchers: number;
}

export interface EngagementHeatmap {
  lecture: { id: string; title: string; durationSeconds: number; totalViewers: number; avgWatchPercentage: number } | null;
  segments: EngagementSegment[];
  confusionPeaks: EngagementSegment[];
}

export interface DoubtAnalytics {
  summary: {
    total: number;
    openEscalated: number;
    aiResolved: number;
    teacherResolved: number;
    avgResolutionMinutes: number;
    aiResolutionRate: number;
  };
  byStatus: { status: string; count: number }[];
  byTopic: { topicId: string; topicName: string; count: number }[];
  recentDoubts: { id: string; questionText: string; status: string; studentName: string; topicName: string | null; createdAt: string }[];
}

export interface StudentDeepDive {
  student: { id: string; name: string; avatar: string | null; email: string | null; phone: string | null; class: string; examTarget: string };
  performance: { avgScore: number; accuracy: number; quizzesTaken: number; lecturesWatched: number; avgWatchPercentage: number; doubtCount: number };
  recentQuizzes: { id: string; mockTestId: string; score: number; correct: number; wrong: number; skipped: number; submittedAt: string };
  lectureActivity: { lectureId: string; lectureTitle: string; watchPercentage: number; isCompleted: boolean; rewindCount: number; confusionFlags: number };
  weakTopics: { topicId: string; topicName: string; chapterName: string; severity: string; accuracy: number; wrongCount: number; doubtCount: number };
  recentDoubts: { id: string; questionText: string; status: string; topicName: string | null; createdAt: string };
}

// ─── Advanced Student Tracking (Split Endpoints) ──────────────────────────────

export interface AdvancedPerformance {
  scoreTrend: { date: string; score: number }[];
  subjectAccuracy: Record<string, number>;
  topicPerformance: { topicId: string; topicName: string; score: number; accuracy: number; timeTaken: number; attempts: number }[];
  mistakePatterns: { type: string; count: number; description: string }[];
  speedMetrics: { avgTimePerQuestion: number; trend: "improving" | "declining" | "stable" };
}

export interface AdvancedEngagement {
  dailyActiveMinutes: { date: string; minutes: number }[];
  sessionDistribution: { timeOfDay: string; count: number }[];
  contentPreference: { type: string; percentage: number }[];
  lectureDropOffs: { timestamp: number; count: number }[];
  deadNotesCount: number;
  bounceRate: number;
}

export interface AdvancedStudyPlan {
  adherence: { completed: number; skipped: number; pending: number };
  completionRateTrend: { date: string; rate: number }[];
  currentStreak: number;
  startDelayAvgHours: number;
  skipPatterns: { type: string; count: number }[];
  overdueItemsCount: number;
  regenerationFrequency: number;
}

export interface RiskSignal {
  id: string;
  type: "critical" | "warning" | "info";
  label: string;
  description: string;
  detectedAt: string;
}

export interface StudentInsights {
  riskStatus: "critical" | "warning" | "good";
  performanceTrend: "improving" | "declining" | "stable";
  studyConsistency: number; // 0-100
  topWeakTopics: string[];
  engagementScore: number; // 0-100
  recentSignals: RiskSignal[];
}

export async function getStudentAdvancedPerformance(studentId: string, batchId?: string): Promise<AdvancedPerformance> {
  try {
    const res = await apiClient.get(`/analytics/teacher/student/${studentId}/performance`, { 
      params: batchId ? { batchId } : {} 
    });
    return extractData(res);
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 500) {
      // Legacy Fallback: Try to get data from the monolithic deep-dive endpoint
      const deepDive = await getStudentDeepDive(studentId, { batchId });
      if (deepDive) return bridgePerformance(deepDive);
      return mockAdvancedPerformance();
    }
    throw err;
  }
}

export async function getStudentAdvancedEngagement(studentId: string, batchId?: string): Promise<AdvancedEngagement> {
  try {
    const res = await apiClient.get(`/analytics/teacher/student/${studentId}/engagement`, { 
      params: batchId ? { batchId } : {} 
    });
    return extractData(res);
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 500) {
      const deepDive = await getStudentDeepDive(studentId, { batchId });
      if (deepDive) return bridgeEngagement(deepDive);
      return mockAdvancedEngagement();
    }
    throw err;
  }
}

export async function getStudentAdvancedStudyPlan(studentId: string, batchId?: string): Promise<AdvancedStudyPlan> {
  try {
    const res = await apiClient.get(`/analytics/teacher/student/${studentId}/study-plan`, { 
      params: batchId ? { batchId } : {} 
    });
    return extractData(res);
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 500) {
      const deepDive = await getStudentDeepDive(studentId, { batchId });
      if (deepDive) return bridgeStudyPlan(deepDive);
      return mockAdvancedStudyPlan();
    }
    throw err;
  }
}

export async function getStudentRiskSignals(studentId: string, batchId?: string): Promise<RiskSignal[]> {
  try {
    const res = await apiClient.get(`/analytics/teacher/student/${studentId}/risk-signals`, { 
      params: batchId ? { batchId } : {} 
    });
    return extractData(res) ?? [];
  } catch (err: any) {
    if (err.response?.status === 404 || err.response?.status === 500) {
      return mockRiskSignals(); // Risk signals are usually new, keep mocks for now
    }
    throw err;
  }
}

/**
 * Data Prioritization Layer: Transforms raw advanced data into high-level insights.
 */
export function getStudentInsights(
  performance: AdvancedPerformance,
  engagement: AdvancedEngagement,
  studyPlan: AdvancedStudyPlan,
  signals: RiskSignal[]
): StudentInsights {
  const hasCriticalSignal = signals.some(s => s.type === "critical");
  const hasWarningSignal = signals.some(s => s.type === "warning");

  const riskStatus = hasCriticalSignal ? "critical" : hasWarningSignal ? "warning" : "good";

  return {
    riskStatus,
    performanceTrend: performance.speedMetrics.trend,
    studyConsistency: Math.round((studyPlan.adherence.completed / (studyPlan.adherence.completed + studyPlan.adherence.skipped + studyPlan.adherence.pending || 1)) * 100),
    topWeakTopics: performance.topicPerformance.filter(t => t.accuracy < 50).slice(0, 3).map(t => t.topicName),
    engagementScore: 100 - (engagement.bounceRate * 100),
    recentSignals: signals.slice(0, 5),
  };
}

export interface BatchComparisonItem {
  batchId: string;
  batchName: string;
  examTarget: string;
  status: string;
  studentCount: number;
  avgScore: number;
  avgWatchPercentage: number;
  quizAttempts: number;
  doubtCount: number;
  openDoubts: number;
}

export interface TeacherAnalyticsQuery {
  from?: string;
  to?: string;
  batchId?: string;
}

export interface ClassPerformanceQuery extends TeacherAnalyticsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// ─── Teacher Analytics API Functions ─────────────────────────────────────────

export async function getTeacherOverview(query?: TeacherAnalyticsQuery): Promise<TeacherOverview> {
  const res = await apiClient.get('/analytics/teacher/overview', { params: query });
  return extractData(res);
}

export async function getClassPerformance(
  query?: ClassPerformanceQuery,
): Promise<{ data: ClassPerformanceStudent[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const res = await apiClient.get('/analytics/teacher/class-performance', { params: query });
  return extractData(res);
}

export async function getTopicCoverage(query?: TeacherAnalyticsQuery): Promise<TopicCoverageItem[]> {
  const res = await apiClient.get('/analytics/teacher/topic-coverage', { params: query });
  return extractData(res);
}

export async function getEngagementHeatmap(lectureId: string): Promise<EngagementHeatmap> {
  const res = await apiClient.get(`/analytics/teacher/engagement-heatmap/${lectureId}`);
  return extractData(res);
}

export async function getTeacherDoubtAnalytics(query?: TeacherAnalyticsQuery): Promise<DoubtAnalytics> {
  const res = await apiClient.get('/analytics/teacher/doubt-analytics', { params: query });
  return extractData(res);
}

export async function getStudentDeepDive(studentId: string, query?: TeacherAnalyticsQuery): Promise<StudentDeepDive | null> {
  const res = await apiClient.get(`/analytics/teacher/student/${studentId}`, { params: query });
  return extractData(res);
}

export async function getBatchComparison(query?: TeacherAnalyticsQuery): Promise<BatchComparisonItem[]> {
  const res = await apiClient.get('/analytics/teacher/batch-comparison', { params: query });
  return extractData(res);
}

export async function exportTeacherAnalyticsCsv(query?: TeacherAnalyticsQuery & { type?: string }): Promise<void> {
  const params = new URLSearchParams(query as any).toString();
  const url = `/analytics/teacher/export${params ? `?${params}` : ''}`;
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data as BlobPart], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `analytics-export-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

export interface SmartInsight {
  type: string;
  severity: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  action: string;
}

export async function getSmartInsights(query?: TeacherAnalyticsQuery & { batchId?: string }): Promise<SmartInsight[]> {
  const res = await apiClient.get('/analytics/teacher/smart-insights', { params: query });
  return extractData(res);
}

// ─── Notifications ─────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: string;
  channel: string;
  status: string;
  title: string;
  body: string;
  data: { refType?: string; refId?: string } | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationListResult {
  data: AppNotification[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export async function getNotifications(params?: { page?: number; limit?: number; isRead?: boolean }): Promise<NotificationListResult> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.isRead !== undefined) q.set("isRead", String(params.isRead));
  const res = await apiClient.get(`/notifications?${q}`);
  return extractData(res);
}

export async function getUnreadNotificationCount(): Promise<{ count: number }> {
  const res = await apiClient.get("/notifications/unread-count");
  return extractData(res);
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch("/notifications/read-all");
}

// ─── Analytics Mocks (Fallback for 404s) ───────────────────────────────────

function mockAdvancedPerformance(): AdvancedPerformance {
  return {
    scoreTrend: [
      { date: "2026-04-20", score: 65 },
      { date: "2026-04-22", score: 72 },
      { date: "2026-04-24", score: 68 },
      { date: "2026-04-26", score: 78 },
      { date: "2026-04-28", score: 75 },
    ],
    subjectAccuracy: { Physics: 68, Chemistry: 75, Biology: 82 },
    topicPerformance: [
      { topicId: "1", topicName: "Kinematics", score: 85, accuracy: 82, timeTaken: 45, attempts: 12 },
      { topicId: "2", topicName: "Atomic Structure", score: 42, accuracy: 45, timeTaken: 120, attempts: 8 },
      { topicId: "3", topicName: "Genetics", score: 92, accuracy: 90, timeTaken: 30, attempts: 15 },
    ],
    mistakePatterns: [
      { type: "Calculation Error", count: 5, description: "Common in multi-step physics problems." },
      { type: "Conceptual Gap", count: 3, description: "Focus needed on inorganic chemistry bonding." },
    ],
    speedMetrics: { avgTimePerQuestion: 48, trend: "improving" },
  };
}

function mockAdvancedEngagement(): AdvancedEngagement {
  return {
    dailyActiveMinutes: [
      { date: "2026-04-22", minutes: 120 },
      { date: "2026-04-23", minutes: 145 },
      { date: "2026-04-24", minutes: 90 },
      { date: "2026-04-25", minutes: 30 },
      { date: "2026-04-26", minutes: 210 },
      { date: "2026-04-27", minutes: 180 },
      { date: "2026-04-28", minutes: 160 },
    ],
    sessionDistribution: [
      { timeOfDay: "Morning", count: 12 },
      { timeOfDay: "Afternoon", count: 8 },
      { timeOfDay: "Evening", count: 25 },
    ],
    contentPreference: [
      { type: "Video Lectures", percentage: 45 },
      { type: "Practice Quizzes", percentage: 35 },
      { type: "Doubt Clearing", percentage: 20 },
    ],
    lectureDropOffs: [
      { timestamp: 300, count: 2 },
      { timestamp: 1200, count: 5 },
    ],
    deadNotesCount: 12,
    bounceRate: 0.15,
  };
}

function mockAdvancedStudyPlan(): AdvancedStudyPlan {
  return {
    adherence: { completed: 24, skipped: 5, pending: 3 },
    completionRateTrend: [
      { date: "W1", rate: 85 },
      { date: "W2", rate: 78 },
      { date: "W3", rate: 92 },
    ],
    currentStreak: 5,
    startDelayAvgHours: 1.5,
    skipPatterns: [
      { type: "Weekend Skips", count: 4 },
      { type: "Subject Specific (Physics)", count: 2 },
    ],
    overdueItemsCount: 2,
    regenerationFrequency: 1,
  };
}

function mockRiskSignals(): RiskSignal[] {
  return [
    { id: "1", type: "warning", label: "Inactivity Detected", description: "No activity in the last 48 hours.", detectedAt: new Date().toISOString() },
    { id: "2", type: "critical", label: "Score Drop", description: "Average score dropped by 15% in Physics.", detectedAt: new Date().toISOString() },
  ];
}

// ─── Legacy Bridges (Map old endpoint data to new structures) ─────────────

function bridgePerformance(d: StudentDeepDive): AdvancedPerformance {
  const m = mockAdvancedPerformance(); // Use mocks for data not in old endpoint
  return {
    ...m,
    subjectAccuracy: { "Overall Accuracy": d.performance.accuracy },
    topicPerformance: [
      { 
        topicId: d.weakTopics.topicId, 
        topicName: d.weakTopics.topicName, 
        score: d.weakTopics.accuracy, 
        accuracy: d.weakTopics.accuracy, 
        timeTaken: 0, 
        attempts: d.weakTopics.wrongCount 
      }
    ]
  };
}

function bridgeEngagement(d: StudentDeepDive): AdvancedEngagement {
  const m = mockAdvancedEngagement();
  return {
    ...m,
    deadNotesCount: 0,
    bounceRate: 1 - (d.performance.avgWatchPercentage / 100),
  };
}

function bridgeStudyPlan(d: StudentDeepDive): AdvancedStudyPlan {
  const m = mockAdvancedStudyPlan();
  return {
    ...m,
    adherence: { completed: d.performance.lecturesWatched, skipped: 0, pending: 0 },
  };
}

export async function interveneStudent(payload: {
  studentId: string;
  batchId: string;
  type: 'assign_practice' | 'send_reminder' | 'schedule_doubt' | 'regenerate_plan';
  message?: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await apiClient.post('/analytics/teacher/student/intervene', payload);
  return extractData<{ success: boolean; message: string }>(res);
}
