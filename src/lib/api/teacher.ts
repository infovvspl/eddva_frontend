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
  if (params?.limit) q.set("limit", String(params.limit));
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

export async function generateQuizForLecture(payload: { transcript: string; lectureTitle?: string; topicId?: string }): Promise<AiQuizResult> {
  const res = await apiClient.post("/ai/quiz/generate", payload, { timeout: 120_000 });
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
  const res = await apiClient.get(`/batches/${batchId}/students/${studentId}`);
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
  recentQuizzes: { id: string; mockTestId: string; score: number; correct: number; wrong: number; skipped: number; submittedAt: string }[];
  lectureActivity: { lectureId: string; lectureTitle: string; watchPercentage: number; isCompleted: boolean; rewindCount: number; confusionFlags: number }[];
  weakTopics: { topicId: string; topicName: string; chapterName: string; severity: string; accuracy: number; wrongCount: number; doubtCount: number }[];
  recentDoubts: { id: string; questionText: string; status: string; topicName: string | null; createdAt: string }[];
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
