import { apiClient, extractData } from "./client";
import { uploadToS3 } from "./upload";


// ─── Subjects / Chapters / Topics ─────────────────────────────────────────────

export interface Subject {
  id: string;
  name: string;
  examTarget: string;
  colorCode?: string;
  icon?: string;
  sortOrder?: number;
  chapters?: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  subjectId: string;
  sortOrder?: number;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  chapterId: string;
  gatePassPercentage?: number;
  estimatedStudyMinutes?: number;
}

// ─── Public Batch Listing (for students browsing courses) ─────────────────────

export interface PublicBatch {
  id: string;
  name: string;
  description?: string | null;
  examTarget: string;
  class: string;
  status: string;
  isPaid: boolean;
  feeAmount: number | null;
  maxStudents: number;
  startDate?: string | null;
  endDate?: string | null;
  thumbnailUrl?: string;
  studentCount?: number;
  teacher?: { id: string; fullName: string };
}

export async function getPublicBatches(examTarget?: string): Promise<PublicBatch[]> {
  const q = new URLSearchParams();
  if (examTarget && examTarget !== "other") q.set("examTarget", examTarget);
  q.set("status", "active");
  try {
    const res = await apiClient.get(`/batches?${q}`);
    return extractData<PublicBatch[]>(res) ?? [];
  } catch {
    return [];
  }
}

export async function getSubjects(examTarget?: string, batchId?: string): Promise<Subject[]> {
  const q = new URLSearchParams();
  if (examTarget) q.set("examTarget", examTarget);
  if (batchId) q.set("batchId", batchId);
  const qs = q.toString();
  const res = await apiClient.get(`/content/subjects${qs ? `?${qs}` : ""}`);
  return extractData<Subject[]>(res) ?? [];
}

export async function getChapters(subjectId: string): Promise<Chapter[]> {
  const res = await apiClient.get(`/content/chapters?subjectId=${subjectId}`);
  return extractData<Chapter[]>(res) ?? [];
}

export async function getTopics(chapterId: string): Promise<Topic[]> {
  const res = await apiClient.get(`/content/topics?chapterId=${chapterId}`);
  return extractData<Topic[]>(res) ?? [];
}

// ─── My Courses (enrolled) ────────────────────────────────────────────────────

export interface MyCourseProgress {
  completedTopics: number;
  totalTopics: number;
  completedLectures: number;
  totalLectures: number;
  overallPct: number;
}

export interface MyCourse {
  id: string;
  name: string;
  description?: string | null;
  examTarget: string;
  class: string;
  thumbnailUrl?: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  enrolledAt?: string;
  teacher?: { id: string; fullName: string };
  progress: MyCourseProgress;
  /** Subject names assigned to this batch (from batch_subject_teachers) — for filters, etc. */
  assignedSubjectNames?: string[];
}

export interface CourseResource {
  id: string;
  type: "pdf" | "dpp" | "pyq" | "quiz" | "notes" | "video" | "link";
  title: string;
  fileUrl: string | null;
  externalUrl: string | null;
  fileSizeKb: number | null;
  description: string | null;
  /** injected by normalizer for context in flat lists */
  topicId?: string;
  topicName?: string;
  subjectName?: string;
  chapterName?: string;
}

export interface CourseTopic {
  id: string;
  name: string;
  sortOrder?: number;
  estimatedStudyMinutes?: number;
  gatePassPercentage?: number;
  status: "locked" | "unlocked" | "in_progress" | "completed";
  completedAt?: string | null;
  bestAccuracy?: number;
  lectureCount?: number;
  resourceCounts?: Record<string, number>;
  lectures: { total: number; completed: number };
  resources: CourseResource[];
}

export interface CourseChapter {
  id: string;
  name: string;
  sortOrder?: number;
  jeeWeightage?: number;
  neetWeightage?: number;
  topics: CourseTopic[];
}

export interface CourseSubject {
  id: string;
  name: string;
  examTarget?: string;
  colorCode?: string;
  icon?: string | null;
  teacher?: { id: string; name: string } | null;
  chapters: CourseChapter[];
}

export interface CourseCurriculum {
  batch: {
    id: string;
    name: string;
    examTarget: string;
    class: string;
    thumbnailUrl?: string | null;
    status?: string;
    teacher?: { id: string; fullName: string } | null;
    startDate?: string | null;
    endDate?: string | null;
    isPaid?: boolean;
    feeAmount?: number | null;
  };
  enrollment: {
    id: string;
    status: string;
    enrolledAt: Date;
    feePaid: number | null;
  };
  summary: {
    totalSubjects: number;
    totalTopics: number;
    completedTopics: number;
    totalLectures: number;
    watchedLectures: number;
    progressPercent: number;
  };
  subjects: CourseSubject[];
  progress: MyCourseProgress;
}

export interface TopicLecture {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  watchProgress?: number;
  isCompleted?: boolean;
  sortOrder?: number;
  createdAt?: string;
}

export interface TopicResource {
  id: string;
  type: string;
  title: string;
  fileUrl: string | null;
  externalUrl?: string | null;
  fileSize?: number;
  sortOrder?: number;
}

export interface TopicDetailWithContent {
  topic: {
    id: string;
    name: string;
    estimatedStudyMinutes?: number;
    gatePassPercentage?: number;
    status: string;
    progressPct?: number;
    completedAt?: string;
  };
  chapter: { id: string; name: string };
  subject:  { id: string; name: string };
  lectures:  TopicLecture[];
  resources: TopicResource[];
}

// Raw shape returned by backend (nested enrollment record)
interface RawEnrollment {
  enrollmentId?: string;
  enrollmentStatus?: string;
  enrolledAt?: string;
  feePaid?: boolean;
  batch?: {
    id: string;
    name: string;
    description?: string | null;
    examTarget?: string;
    class?: string;
    thumbnailUrl?: string | null;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    teacher?: { id: string; fullName: string };
  };
  subjects?: string[];
  progress?: {
    totalLectures?: number;
    watchedLectures?: number;
    completedTopics?: number;
    inProgressTopics?: number;
    totalTopics?: number;
    completedLectures?: number;
    overallPct?: number;
  };
}

function normalizeEnrollment(raw: RawEnrollment): MyCourse {
  const batch = raw.batch ?? {} as NonNullable<RawEnrollment["batch"]>;
  const p = raw.progress ?? {};
  const total = p.totalLectures ?? 0;
  const watched = p.watchedLectures ?? 0;
  const totalTopics = p.totalTopics ?? 0;
  const completedTopics = p.completedTopics ?? 0;
  // Prefer topic-based completion (more meaningful) over lecture watch count
  const overallPct = p.overallPct
    ?? (totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100)
    : total > 0 ? Math.round((watched / total) * 100) : 0);
  const subjRaw = raw.subjects;
  const assignedSubjectNames = Array.isArray(subjRaw)
    ? subjRaw.map((x: unknown) => String(x ?? "").trim()).filter(Boolean)
    : [];

  return {
    id: batch.id ?? raw.enrollmentId ?? "",
    name: batch.name ?? "",
    description: batch.description ?? null,
    examTarget: batch.examTarget ?? "",
    class: batch.class ?? "",
    thumbnailUrl: batch.thumbnailUrl ?? undefined,
    status: batch.status ?? raw.enrollmentStatus ?? "active",
    startDate: batch.startDate ?? null,
    endDate: batch.endDate ?? null,
    enrolledAt: raw.enrolledAt,
    teacher: batch.teacher,
    progress: {
      completedTopics: p.completedTopics ?? 0,
      totalTopics: p.totalTopics ?? 0,
      completedLectures: p.completedLectures ?? watched,
      totalLectures: total,
      overallPct,
    },
    assignedSubjectNames: assignedSubjectNames.length ? assignedSubjectNames : undefined,
  };
}

export async function getMyCourses(): Promise<MyCourse[]> {
  const res = await apiClient.get("/students/my-courses");
  const raw = extractData<unknown[]>(res) ?? [];
  // Support both flat MyCourse[] (if backend already flattens) and
  // nested enrollment[] (current backend shape).
  return raw.map((item: any) => {
    if (item && typeof item === "object" && "batch" in item) {
      return normalizeEnrollment(item as RawEnrollment);
    }
    return item as MyCourse;
  });
}

export async function getCourseCurriculum(batchId: string): Promise<CourseCurriculum> {
  const res = await apiClient.get(`/students/my-courses/${batchId}`);
  const raw = extractData<any>(res);

  // Map backend shape { batch, enrollment, summary, curriculum[] }
  // → frontend shape { batch, enrollment, summary, subjects[], progress }
  const subjects: CourseSubject[] = (raw?.curriculum ?? []).map((s: any) => ({
    id:        s.id,
    name:      s.name,
    colorCode: s.colorCode ?? null,
    icon:      s.icon ?? null,
    teacher:   s.teacher ?? null,
    chapters:  (s.chapters ?? []).map((c: any) => ({
      id:            c.id,
      name:          c.name,
      jeeWeightage:  c.jeeWeightage,
      neetWeightage: c.neetWeightage,
      topics:        (c.topics ?? []).map((t: any) => ({
        id:                    t.id,
        name:                  t.name,
        estimatedStudyMinutes: t.estimatedStudyMinutes,
        gatePassPercentage:    t.gatePassPercentage,
        status:                t.progress?.status ?? "locked",
        completedAt:           t.progress?.completedAt ?? null,
        bestAccuracy:          t.progress?.bestAccuracy ?? 0,
        lectureCount:          t.lectureCount,
        resourceCounts:        t.resourceCounts,
        lectures:              t.lectures ?? { total: 0, completed: 0 },
        resources:             (t.resources ?? []).map((r: any) => ({
          id:          r.id,
          type:        r.type,
          title:       r.title,
          fileUrl:     r.fileUrl ?? null,
          externalUrl: r.externalUrl ?? null,
          fileSizeKb:  r.fileSizeKb ?? null,
          description: r.description ?? null,
        })),
      })),
    })),
  }));

  const sm = raw?.summary ?? {};
  return {
    batch:      raw?.batch ?? {},
    enrollment: raw?.enrollment ?? {},
    summary:    sm,
    subjects,
    progress: {
      completedTopics:   sm.completedTopics   ?? 0,
      totalTopics:       sm.totalTopics       ?? 0,
      completedLectures: sm.watchedLectures   ?? 0,
      totalLectures:     sm.totalLectures     ?? 0,
      overallPct:        sm.progressPercent   ?? 0,
    },
  } as CourseCurriculum;
}

export async function getCourseTopicDetail(batchId: string, topicId: string): Promise<TopicDetailWithContent> {
  const res = await apiClient.get(`/students/my-courses/${batchId}/topics/${topicId}`);
  const raw = extractData<any>(res);
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid topic detail response");
  }

  const t = raw.topic ?? {};
  const chapter = raw.chapter ?? t.chapter ?? {};
  const subject = raw.subject ?? t.subject ?? {};
  const lecturesRaw = Array.isArray(raw.lectures) ? raw.lectures : [];
  const resources = Array.isArray(raw.resources) ? raw.resources : [];

  const lectures: TopicLecture[] = lecturesRaw.map((l: any) => {
    const prog = l.progress ?? l.studentProgress ?? {};
    return {
      id: l.id,
      title: l.title ?? "",
      description: l.description,
      duration: l.durationSeconds ?? l.videoDurationSeconds ?? l.duration,
      videoUrl: l.videoUrl,
      thumbnailUrl: l.thumbnailUrl,
      watchProgress: prog.watchPercentage ?? l.watchProgress ?? 0,
      isCompleted: prog.isCompleted ?? l.isCompleted ?? false,
      sortOrder: l.sortOrder,
      createdAt: l.createdAt,
    };
  });

  const prog = raw.progress ?? {};

  return {
    topic: {
      id: t.id,
      name: t.name ?? "",
      estimatedStudyMinutes: t.estimatedStudyMinutes,
      gatePassPercentage: t.gatePassPercentage,
      status: prog.status ?? t.status ?? "unlocked",
      progressPct: prog.progressPct ?? t.progressPct,
      completedAt: prog.completedAt ?? t.completedAt ?? null,
    },
    chapter: { id: chapter.id ?? "", name: chapter.name ?? "" },
    subject: { id: subject.id ?? "", name: subject.name ?? "" },
    lectures,
    resources,
  };
}

// ─── Topic Progress ────────────────────────────────────────────────────────────

export type TopicStatus = "locked" | "unlocked" | "in_progress" | "completed";

export interface TopicProgress {
  topicId: string;
  status: TopicStatus;
  bestAccuracy: number;
  attemptCount: number;
}

export interface ProgressOverview {
  [topicId: string]: TopicProgress;
}

export async function getProgressOverview(): Promise<TopicProgress[]> {
  const res = await apiClient.get("/assessments/progress/overview");
  return extractData<TopicProgress[]>(res) ?? [];
}

export async function getTopicProgress(topicId: string): Promise<TopicProgress> {
  const res = await apiClient.get(`/assessments/progress/topic/${topicId}`);
  return extractData<TopicProgress>(res);
}

// ─── Lectures (student-facing) ─────────────────────────────────────────────────

export interface StudentLecture {
  id: string;
  title: string;
  description?: string;
  type: "recorded" | "live";
  status: string;
  batchId: string;
  topicId?: string;
  videoUrl?: string;
  liveMeetingUrl?: string;
  videoDurationSeconds?: number;
  thumbnailUrl?: string;
  scheduledAt?: string;
  aiNotesMarkdown?: string;
  aiKeyConcepts?: string[];
  topic?: {
    id: string;
    name: string;
    chapter?: { id: string; name: string; subject?: { id: string; name: string } };
  };
  isLocked?: boolean;
  studentProgress?: {
    watchPercentage: number;
    lastPositionSeconds: number;
    isCompleted: boolean;
    rewindCount: number;
  } | null;
}

export interface LectureProgress {
  lectureId: string;
  watchPercentage: number;
  lastPositionSeconds: number;
  isCompleted: boolean;
  rewindCount: number;
}

function unwrapLectures(res: any): StudentLecture[] {
  const outer = extractData<any>(res);
  // backend returns paginated { data: [...], meta: {} }
  if (outer && !Array.isArray(outer) && Array.isArray(outer.data)) return outer.data;
  return Array.isArray(outer) ? outer : [];
}

export async function getLecturesByBatchAndTopic(batchId: string, topicId?: string): Promise<StudentLecture[]> {
  const q = new URLSearchParams();
  if (batchId) q.set("batchId", batchId);
  if (topicId) q.set("topicId", topicId);
  const res = await apiClient.get(`/content/lectures?${q}`);
  return unwrapLectures(res);
}

export async function getAllBatchLectures(batchId?: string): Promise<StudentLecture[]> {
  const q = new URLSearchParams({ limit: "500" });
  if (batchId) q.set("batchId", batchId);
  const res = await apiClient.get(`/content/lectures?${q}`);
  return unwrapLectures(res);
}

export async function getLectureProgress(lectureId: string): Promise<LectureProgress | null> {
  try {
    const res = await apiClient.get(`/content/lectures/${lectureId}/progress`);
    return extractData<LectureProgress>(res);
  } catch {
    return null;
  }
}

// ─── Assessments ───────────────────────────────────────────────────────────────

export interface MockTestListItem {
  id: string;
  title: string;
  type: string;
  scope?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  batchId?: string;
  questionIds?: string[];
  isPublished: boolean;
  scheduledAt?: string;
  createdAt?: string;
}

export interface QuizOption {
  id: string;
  optionLabel: string;
  content: string;
}

export interface QuizQuestion {
  id: string;
  content: string;
  type: "mcq_single" | "mcq_multi" | "integer" | "descriptive";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect: number;
  marksWrong: number;
  topic?: { id: string; name: string };
  options?: QuizOption[];
}

export interface TestSession {
  id: string;
  mockTestId: string;
  status: "in_progress" | "submitted" | "auto_submitted" | "completed" | "abandoned";
  startedAt: string;
  submittedAt?: string;
  totalScore?: number;
  correctCount?: number;
  wrongCount?: number;
  skippedCount?: number;
  mockTest?: { title: string; durationMinutes: number; totalMarks?: number };
  questions?: QuizQuestion[];
}

export function isSessionCompleted(s: TestSession) {
  return s.status === "submitted" || s.status === "auto_submitted" || s.status === "completed";
}

export interface ErrorBreakdown {
  conceptual: number;
  silly: number;
  time: number;
  guess: number;
  skip: number;
}

export interface SessionResult {
  id: string;
  totalScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  accuracy: number;
  status: string;
  errorBreakdown: ErrorBreakdown;
  attempts: {
    questionId: string;
    isCorrect: boolean;
    marksAwarded: number;
    errorType?: string;
    selectedOptionIds?: string[];
    correctOptionIds?: string[];
    questionContent?: string;
    options?: (QuizOption & { isCorrect: boolean })[];
  }[];
}

export async function getMockTests(params?: {
  batchId?: string;
  topicId?: string;
  isPublished?: boolean;
}): Promise<MockTestListItem[]> {
  const q = new URLSearchParams();
  if (params?.batchId) q.set("batchId", params.batchId);
  if (params?.topicId) q.set("topicId", params.topicId);
  if (params?.isPublished !== undefined) q.set("isPublished", String(params.isPublished));
  const res = await apiClient.get(`/assessments/mock-tests?${q}`);
  const raw = extractData<MockTestListItem[] | { data: MockTestListItem[] }>(res);
  return (Array.isArray(raw) ? raw : (raw as any)?.data) ?? [];
}

export async function getMockTestById(id: string): Promise<MockTestListItem & { questions: QuizQuestion[] }> {
  const res = await apiClient.get(`/assessments/mock-tests/${id}`);
  return extractData(res);
}

export async function getDiagnosticStatus(): Promise<{ completed: boolean }> {
  const res = await apiClient.get("/assessments/diagnostic/status");
  return extractData(res);
}

export async function generateDiagnosticSession(): Promise<{ alreadyCompleted: boolean; session: TestSession | null }> {
  const res = await apiClient.post("/assessments/diagnostic/generate", {});
  return extractData(res);
}

export async function startSession(mockTestId: string): Promise<TestSession> {
  const res = await apiClient.post("/assessments/sessions/start", { mockTestId });
  return extractData<TestSession>(res);
}

export async function submitAnswer(
  sessionId: string,
  payload: {
    questionId: string;
    selectedOptionIds?: string[];
    integerResponse?: string;
    timeTakenSeconds?: number;
  }
): Promise<void> {
  await apiClient.post(`/assessments/sessions/${sessionId}/answer`, payload);
}

export async function submitSession(sessionId: string): Promise<SessionResult> {
  const res = await apiClient.post(`/assessments/sessions/${sessionId}/submit`, {});
  return extractData<SessionResult>(res);
}

export async function getSessionResult(sessionId: string): Promise<SessionResult> {
  const res = await apiClient.get(`/assessments/sessions/${sessionId}/result`);
  return extractData<SessionResult>(res);
}

export async function getActiveSessions(mockTestId?: string): Promise<TestSession[]> {
  const q = mockTestId ? `?mockTestId=${mockTestId}` : "";
  const res = await apiClient.get(`/assessments/sessions${q}`);
  const raw = extractData<TestSession[] | { data: TestSession[] }>(res);
  return (Array.isArray(raw) ? raw : (raw as any)?.data) ?? [];
}

export async function getMockTestSessions(mockTestId: string): Promise<TestSession[]> {
  const res = await apiClient.get(`/assessments/sessions?mockTestId=${mockTestId}&limit=50`);
  const raw = extractData<TestSession[] | { data: TestSession[] }>(res);
  return (Array.isArray(raw) ? raw : (raw as any)?.data) ?? [];
}

// ─── Study Plans ───────────────────────────────────────────────────────────────

export type PlanItemType = "lecture" | "practice" | "mock_test" | "battle" | "revision" | "doubt_session";
export type PlanItemStatus = "pending" | "completed" | "skipped";

export interface StudyPlanItem {
  id: string;
  type: PlanItemType;
  title: string;
  estimatedMinutes: number;
  status: PlanItemStatus;
  refId: string;
  scheduledDate: string;
  xpReward?: number;
}

export async function getTodaysPlan(): Promise<StudyPlanItem[]> {
  const res = await apiClient.get("/study-plans/today");
  return extractData<StudyPlanItem[]>(res) ?? [];
}

export async function getWeeklyPlan(startDate: string, endDate: string): Promise<StudyPlanItem[]> {
  const res = await apiClient.get(`/study-plans?startDate=${startDate}&endDate=${endDate}`);
  // Backend returns items grouped by date: { "2025-01-24": [...], "2025-01-25": [...] }
  const grouped = extractData<Record<string, StudyPlanItem[]>>(res) ?? {};
  if (Array.isArray(grouped)) return grouped;
  return Object.values(grouped).flat();
}

export async function getWeeklyPlanGrouped(startDate: string, endDate: string): Promise<Record<string, StudyPlanItem[]>> {
  const res = await apiClient.get(`/study-plans?startDate=${startDate}&endDate=${endDate}`);
  const data = extractData<Record<string, StudyPlanItem[]> | StudyPlanItem[]>(res) ?? {};
  if (Array.isArray(data)) {
    const today = new Date().toISOString().split("T")[0];
    return data.length ? { [today]: data } : {};
  }
  return data as Record<string, StudyPlanItem[]>;
}

export async function generatePlan(): Promise<{ message: string }> {
  const res = await apiClient.post("/study-plans/generate", {});
  return extractData(res);
}

export async function regeneratePlan(): Promise<{ message: string }> {
  const res = await apiClient.post("/study-plans/regenerate", {});
  return extractData(res);
}

export async function completePlanItem(itemId: string): Promise<StudyPlanItem> {
  const res = await apiClient.patch(`/study-plans/items/${itemId}/complete`, {});
  return extractData<StudyPlanItem>(res);
}

export async function skipPlanItem(itemId: string): Promise<StudyPlanItem> {
  const res = await apiClient.patch(`/study-plans/items/${itemId}/skip`, {});
  return extractData<StudyPlanItem>(res);
}

export async function getNextAction(): Promise<StudyPlanItem | null> {
  try {
    const res = await apiClient.get("/study-plans/next-action");
    return extractData<StudyPlanItem | null>(res) ?? null;
  } catch {
    return null;
  }
}

// ─── Doubts ────────────────────────────────────────────────────────────────────

export type DoubtStatus = "open" | "ai_resolved" | "escalated" | "teacher_resolved";
export type DoubtSource = "manual" | "lecture" | "question" | "battle";
export type ExplanationMode = "short" | "detailed";

export interface StudentDoubt {
  id: string;
  topicId?: string;
  questionText?: string;
  questionImageUrl?: string;
  source: DoubtSource;
  status: DoubtStatus;
  explanationMode?: ExplanationMode;
  aiExplanation?: string;
  aiConceptLinks?: string[];
  teacherResponse?: string;
  isHelpful?: boolean;
  resolvedAt?: string;
  createdAt: string;
  topic?: {
    id: string;
    name: string;
    chapter?: { name: string; subject?: { name: string } };
  };
}

export interface CreateDoubtPayload {
  batchId?: string;
  topicId: string;
  questionText?: string;
  questionImageUrl?: string;
  source?: DoubtSource;
  sourceRefId?: string;
  explanationMode?: ExplanationMode;
  skipAI?: boolean;
}

export async function getMyDoubts(params?: { status?: string; page?: number; limit?: number }): Promise<StudentDoubt[]> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page) q.set("page", String(params.page));
  q.set("limit", String(params?.limit ?? 100));
  const res = await apiClient.get(`/doubts?${q}`);
  const list = extractData<StudentDoubt[]>(res) ?? [];
  // deduplicate by id (guards against accidental duplicate submissions)
  return Array.from(new Map(list.map((d) => [d.id, d])).values());
}

export async function getDoubtById(id: string): Promise<StudentDoubt> {
  const res = await apiClient.get(`/doubts/${id}`);
  return extractData<StudentDoubt>(res);
}

export async function createDoubt(payload: CreateDoubtPayload): Promise<StudentDoubt> {
  const res = await apiClient.post("/doubts", payload);
  return extractData<StudentDoubt>(res);
}

export async function markDoubtHelpful(id: string, isHelpful: boolean): Promise<StudentDoubt> {
  const res = await apiClient.patch(`/doubts/${id}/helpful`, { isHelpful });
  return extractData<StudentDoubt>(res);
}

export async function requestAiForDoubt(id: string): Promise<StudentDoubt> {
  const res = await apiClient.patch(`/doubts/${id}/request-ai`, {});
  return extractData<StudentDoubt>(res);
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface PerformanceProfile {
  overallAccuracy: number;
  estimatedRank?: number;
  totalTestsTaken: number;
  weakTopics: { topicId: string; topicName: string; accuracy: number; severity: string }[];
  strongSubjectIds?: string[];
  subjectAccuracy?: Record<string, number>;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  score: number;
  city?: string;
  eloTier?: string;
  avatarUrl?: string;
}

export interface LeaderboardResult {
  data: LeaderboardEntry[];
  currentStudentRank?: { rank: number; score: number };
}

export async function getMyPerformance(): Promise<PerformanceProfile> {
  const res = await apiClient.get("/analytics/performance");
  // Backend returns { performanceProfile: {...}, weakTopics: [...] } — unwrap it
  const raw = extractData<{ performanceProfile: any; weakTopics: any[] }>(res);
  const profile = raw?.performanceProfile ?? {};
  return {
    overallAccuracy: profile.overallAccuracy ?? 0,
    estimatedRank: profile.estimatedRank ?? undefined,
    totalTestsTaken: profile.totalTestsTaken ?? 0,
    subjectAccuracy: profile.subjectAccuracy ?? {},
    weakTopics: (raw?.weakTopics ?? []).map((wt: any) => ({
      topicId: wt.topicId,
      topicName: wt.topic?.name ?? wt.topicName ?? "Unknown Topic",
      accuracy: wt.accuracy ?? 0,
      severity: wt.severity,
    })),
  };
}

export async function getLeaderboard(params?: {
  scope?: "global" | "state" | "city" | "school" | "subject" | "battle_xp";
  period?: string;
  scopeValue?: string;
}): Promise<LeaderboardResult> {
  const q = new URLSearchParams();
  if (params?.scope) q.set("scope", params.scope);
  if (params?.period) q.set("period", params.period);
  if (params?.scopeValue) q.set("scopeValue", params.scopeValue);
  const res = await apiClient.get(`/analytics/leaderboard?${q}`);
  return extractData<LeaderboardResult>(res);
}

export async function logEngagement(payload: {
  lectureId?: string;
  state: "confused" | "bored" | "engaged" | "thriving" | "frustrated";
  durationSeconds?: number;
  context?: string;
}): Promise<void> {
  await apiClient.post("/analytics/engagement", payload);
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

export interface StudentDashboardData {
  streakDays: number;
  xpPoints: number;
  currentEloTier: string;
  rank?: number;
  weakTopics: { topicId: string; topicName: string; subjectName?: string; accuracy: number; severity: string }[];
  overallAccuracy: number;
  pendingLectures: number;
  testsAttempted: number;
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const res = await apiClient.get("/students/dashboard");
  const raw = extractData<Record<string, unknown>>(res);
  const st = raw.student as Record<string, unknown> | undefined;
  const wt = (raw.weakTopics as unknown[]) ?? [];
  return {
    streakDays: Number(st?.currentStreak ?? raw.currentStreak ?? 0),
    xpPoints: Number(st?.xpTotal ?? raw.xpTotal ?? 0),
    currentEloTier: String(st?.currentEloTier ?? raw.currentEloTier ?? "Iron"),
    rank: (raw.globalRank as number | undefined) ?? undefined,
    weakTopics: wt.map((w: any) => ({
      topicId: String(w.topicId ?? w.topic?.id ?? ""),
      topicName: String(w.topic?.name ?? w.topicName ?? "Topic"),
      subjectName: String(w.topic?.chapter?.subject?.name ?? w.subjectName ?? ""),
      accuracy: Number(w.accuracy ?? 0),
      severity: String(w.severity ?? "medium"),
    })),
    overallAccuracy: Number(raw.overallAccuracy ?? 0),
    pendingLectures: Number(raw.pendingLectures ?? 0),
    testsAttempted: Number(raw.testsAttempted ?? 0),
  };
}

// ─── Battles ──────────────────────────────────────────────────────────────────

export type BattleMode = "quick_duel" | "topic_battle" | "daily" | "bot" | "challenge_friend" | "tournament";

export interface BattleRoom {
  battleId: string;
  roomCode: string;
  status: "waiting" | "in_progress" | "completed";
  mode: BattleMode;
}

export interface DailyBattle {
  id: string;
  scheduledAt: string;
  topicName?: string;
  playerCount?: number;
  status: string;
}

export async function createBattle(mode: BattleMode, topicId?: string): Promise<BattleRoom> {
  const payload: Record<string, string> = { mode };
  if (topicId) payload.topicId = topicId;
  const res = await apiClient.post("/battles/create", payload);
  return extractData<BattleRoom>(res);
}

export async function getBattleRoom(battleId: string): Promise<BattleRoom> {
  const res = await apiClient.get(`/battles/${battleId}`);
  return extractData<BattleRoom>(res);
}

export async function joinBattleByCode(roomCode: string): Promise<BattleRoom> {
  const res = await apiClient.post("/battles/join", { roomCode });
  return extractData<BattleRoom>(res);
}

export async function cancelBattle(battleId: string): Promise<void> {
  await apiClient.delete(`/battles/${battleId}`);
}

export async function getDailyBattle(): Promise<DailyBattle | null> {
  try {
    const res = await apiClient.get("/battles/daily");
    return extractData<DailyBattle>(res);
  } catch {
    return null;
  }
}

export async function getMyBattleHistory(): Promise<BattleRoom[]> {
  try {
    const res = await apiClient.get("/battles/my-history");
    return extractData<BattleRoom[]>(res) ?? [];
  } catch {
    return [];
  }
}

export interface BattleElo {
  eloRating: number;
  tier: string;
  battleXp: number;
  battlesPlayed: number;
  battlesWon: number;
  winStreak: number;
}

export interface BotPracticeQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctId: string | null;
  difficulty: string;
}

export async function getBotPracticeQuestions(
  scope: 'subject' | 'chapter' | 'topic',
  scopeId: string,
  count = 10,
): Promise<BotPracticeQuestion[]> {
  try {
    const res = await apiClient.get('/battles/bot-questions', {
      params: { scope, scopeId, count },
    });
    return extractData<BotPracticeQuestion[]>(res) ?? [];
  } catch {
    return [];
  }
}

export async function getMyBattleElo(): Promise<BattleElo | null> {
  try {
    const res = await apiClient.get("/battles/my-elo");
    return extractData<BattleElo>(res);
  } catch {
    return null;
  }
}

// ─── Auth / Profile ───────────────────────────────────────────────────────────

export interface StudentMe {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  city?: string;
  profilePictureUrl?: string;
  role: string;
  tenantId: string;
  student?: {
    id: string;
    examTarget: string;
    currentClass: string;
    examYear: number;
    batchId?: string;
    diagnosticCompleted: boolean;
    streakDays: number;
    xpPoints: number;
    currentEloTier?: string;
    longestStreak?: number;
    targetCollege?: string;
    dailyStudyHours?: number;
    address?: string;
    careOf?: string;
    alternatePhoneNumber?: string;
    postOffice?: string;
    city?: string;
    landmark?: string;
    state?: string;
    pinCode?: string;
  };
}

export async function getMe(): Promise<StudentMe> {
  const res = await apiClient.get("/auth/me");
  // Backend returns { user: {...}, student: {...} } — flatten into StudentMe shape
  const raw = extractData<{ user: any; student: any; teacherProfile: any }>(res);
  const u = raw?.user ?? {};
  const s = raw?.student;
  return {
    id: u.id,
    fullName: u.fullName,
    phone: u.phoneNumber,
    email: u.email,
    city: u.city,
    profilePictureUrl: u.profilePictureUrl,
    role: u.role,
    tenantId: u.tenantId,
    student: s
      ? {
          id: s.id,
          examTarget: s.examTarget,
          currentClass: s.class ?? s.currentClass,
          examYear: s.examYear,
          batchId: s.batchId,
          diagnosticCompleted: s.diagnosticCompleted ?? false,
          streakDays: s.currentStreak ?? 0,
          xpPoints: s.xpTotal ?? 0,
          currentEloTier: s.currentEloTier ?? "iron",
          longestStreak: s.longestStreak ?? 0,
          targetCollege: s.targetCollege,
          dailyStudyHours: s.dailyStudyHours,
          address: s.address,
          careOf: s.careOf,
          alternatePhoneNumber: s.alternatePhoneNumber,
          postOffice: s.postOffice,
          city: s.city,
          landmark: s.landmark,
          state: s.state,
          pinCode: s.pinCode,
        }
      : undefined,
  };
}

export async function updateProfile(payload: {
  fullName?: string;
  city?: string;
  targetCollege?: string;
  dailyStudyHours?: number;
  preferredLanguage?: string;
  phone?: string;
  email?: string;
  address?: string;
  state?: string;
  pinCode?: string;
  careOf?: string;
  alternatePhoneNumber?: string;
  landmark?: string;
  postOffice?: string;
}): Promise<StudentMe> {
  const res = await apiClient.patch("/auth/profile", payload);
  return extractData<StudentMe>(res);
}

export async function uploadAvatar(file: File): Promise<string> {
  // Step 1 — Upload to S3
  const fileUrl = await uploadToS3(
    {
      type: "profile",
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
    },
    file
  );

  // Step 2 — Confirm with backend
  const res = await apiClient.post("/auth/profile/avatar", { fileUrl });
  const data = extractData<{ avatarUrl: string }>(res);
  return data?.avatarUrl ?? fileUrl;
}


export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post("/auth/logout", { refreshToken });
}

// ─── AI Self-Study ─────────────────────────────────────────────────────────────

export interface AiStudyStatus {
  hasTeacherLecture: boolean;
  hasActiveAiSession: boolean;
  isAiSessionCompleted: boolean;
  aiSessionId?: string;
}

export interface AiConversationMessage {
  role: "student" | "ai";
  message: string;
  timestamp: string;
}

export interface AiPracticeQuestion {
  question: string;
  answer: string;
  explanation: string;
}

export interface AiStudySessionData {
  id: string;
  topicId: string;
  topicName?: string;
  lessonMarkdown: string;
  keyConcepts: string[];
  formulas: string[];
  practiceQuestions: AiPracticeQuestion[];
  commonMistakes: string[];
  conversation: AiConversationMessage[];
  isCompleted: boolean;
  timeSpentSeconds: number;
  completedAt?: string;
}

export interface AiQuestionResponse {
  answer: string;
  conversation: AiConversationMessage[];
}

export interface AiCompleteResponse {
  xpEarned: number;
  newXpTotal: number;
}

export async function getStudyStatus(topicId: string): Promise<AiStudyStatus> {
  const res = await apiClient.get(`/content/topics/${topicId}/study-status`);
  return extractData<AiStudyStatus>(res);
}

export async function getAiStudySession(topicId: string): Promise<AiStudySessionData> {
  const res = await apiClient.get(`/content/topics/${topicId}/ai-study/session`);
  return extractData<AiStudySessionData>(res);
}

export async function startAiStudy(topicId: string): Promise<AiStudySessionData> {
  const res = await apiClient.post(`/content/topics/${topicId}/ai-study/start`);
  return extractData<AiStudySessionData>(res);
}

export async function askAiQuestion(
  topicId: string,
  sessionId: string,
  question: string,
): Promise<AiQuestionResponse> {
  const res = await apiClient.post(`/content/topics/${topicId}/ai-study/${sessionId}/ask`, { question });
  return extractData<AiQuestionResponse>(res);
}

export async function completeAiStudy(
  topicId: string,
  sessionId: string,
  timeSpentSeconds: number,
): Promise<AiCompleteResponse> {
  const res = await apiClient.patch(`/content/topics/${topicId}/ai-study/${sessionId}/complete`, { timeSpentSeconds });
  return extractData<AiCompleteResponse>(res);
}

// ─── AI Quiz (no teacher quiz required) ───────────────────────────────────────

export interface AiQuizOption {
  id: string;
  optionLabel: string;
  content: string;
  isCorrect: boolean;
}

export interface AiQuizQuestion {
  id: string;
  content: string;
  type: "mcq_single";
  difficulty: "easy" | "medium" | "hard";
  marksCorrect: number;
  marksWrong: number;
  explanation: string;
  options: AiQuizOption[];
}

export interface AiQuizData {
  topicId: string;
  topicName: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questions: AiQuizQuestion[];
}

export interface AiQuizResult {
  passed: boolean;
  accuracy: number;
  score: number;
  totalMarks: number;
  xpEarned: number;
  message: string;
}

export async function generateAiQuiz(topicId: string): Promise<AiQuizData> {
  const res = await apiClient.post(`/content/topics/${topicId}/ai-quiz/generate`);
  return extractData<AiQuizData>(res);
}

export async function completeAiQuiz(
  topicId: string,
  payload: { score: number; totalMarks: number; accuracy: number; correctCount: number; wrongCount: number },
): Promise<AiQuizResult> {
  const res = await apiClient.post(`/content/topics/${topicId}/ai-quiz/complete`, payload);
  return extractData<AiQuizResult>(res);
}
// ─── PYQ (Previous Year Questions) ────────────────────────────────────────────

export interface PYQYearBreakdown {
  year: number;
  jee_mains?: { count: number; difficulty: { easy: number; medium: number; hard: number } };
  jee_advanced?: { count: number; difficulty: { easy: number; medium: number; hard: number } };
  neet?: { count: number; difficulty: { easy: number; medium: number; hard: number } };
  [exam: string]: any;
}

export interface PYQOverview {
  topicId: string;
  topicName: string;
  chapterName: string;
  summary: {
    totalQuestions: number;
    yearsAvailable: number[];
    examsAvailable: string[];
    studentAttempted: number;
    studentCorrect: number;
  };
  yearBreakdown: PYQYearBreakdown[];
  studentProgress: { byYear: Record<string, { attempted: number; correct: number }> };
}

export interface PYQOption { id: string; text: string; }

export interface PYQStudentAttempt {
  selectedOptionIds: string[];
  integerResponse: string | null;
  isCorrect: boolean;
  xpAwarded: number;
  attemptedAt: string;
}

export interface PYQQuestion {
  id: string;
  topicId: string;
  questionText: string;
  questionImageUrl: string | null;
  type: "mcq_single" | "integer";
  options: PYQOption[];
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  pyqYear: number;
  pyqExam: string;
  pyqExamLabel: string;
  pyqShift: string | null;
  studentAttempt: PYQStudentAttempt | null;
}

export interface PYQListResponse { total: number; page: number; questions: PYQQuestion[]; }

export interface PYQSubmitResult {
  questionId: string;
  isCorrect: boolean;
  correctOptionIds: string[];
  correctIntegerAnswer: string | null;
  explanation: string;
  xpAwarded: number;
  studentTotalXp: number;
  globalStats: { correctAttemptPct: number; difficultyLabel: string };
}

export interface PYQMyProgress {
  totalAttempted: number;
  totalCorrect: number;
  accuracyPct: number;
  xpEarned: number;
  byYear: { year: number; attempted: number; correct: number; accuracy: number }[];
  byDifficulty: Record<string, { attempted: number; correct: number; accuracy: number }>;
  byExam: Record<string, { attempted: number; correct: number }>;
  wrongQuestions: { questionId: string; questionPreview: string; pyqYear: number; pyqExam: string; difficulty: string }[];
}

export async function getPYQOverview(topicId: string): Promise<PYQOverview> {
  const res = await apiClient.get(`/assessments/topics/${topicId}/pyqs/overview`);
  return extractData<PYQOverview>(res);
}

export async function getPYQs(topicId: string, params: Record<string, any> = {}): Promise<PYQListResponse> {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.set(k, String(v)); });
  const res = await apiClient.get(`/assessments/topics/${topicId}/pyqs?${q}`);
  return extractData<PYQListResponse>(res) ?? { total: 0, page: 1, questions: [] };
}

export async function submitPYQAnswer(
  topicId: string, questionId: string,
  payload: { selectedOptionIds?: string[]; integerResponse?: string; timeTakenSeconds?: number },
): Promise<PYQSubmitResult> {
  const res = await apiClient.post(`/assessments/topics/${topicId}/pyqs/${questionId}/submit`, payload);
  return extractData<PYQSubmitResult>(res);
}

export async function getMyPYQProgress(topicId: string): Promise<PYQMyProgress> {
  const res = await apiClient.get(`/assessments/topics/${topicId}/pyqs/my-progress`);
  return extractData<PYQMyProgress>(res);
}

export interface PYQAlternative { exam: string; examLabel: string; count: number; }

export async function startPYQSession(
  topicId: string,
  payload: { year?: number; startYear?: number; endYear?: number; exam?: string; difficulty?: string; limit?: number },
): Promise<{ sessionRef: string | null; questions: PYQQuestion[]; totalInSession: number; filterApplied: any; alternatives: PYQAlternative[] }> {
  const res = await apiClient.post(`/assessments/topics/${topicId}/pyqs/start-session`, payload);
  return extractData<any>(res);
}

// ─── Progress Report (full subject→chapter→topic tree) ────────────────────────

export interface TopicReportEntry {
  topicId: string;
  topicName: string;
  status: "locked" | "unlocked" | "in_progress" | "completed";
  bestAccuracy: number;
  attemptCount: number;
  gatePassPercentage: number;
  completedAt: string | null;
  lecture: { avgWatchPct: number; anyCompleted: boolean } | null;
  pyq: { attempted: number; correct: number; accuracy: number } | null;
  aiSession: { completed: boolean } | null;
}

export interface ChapterReportEntry {
  chapterId: string;
  chapterName: string;
  topicsTotal: number;
  topicsCompleted: number;
  overallAccuracy: number;
  topics: TopicReportEntry[];
}

export interface SubjectReportEntry {
  subjectId: string;
  subjectName: string;
  examTarget: string | null;
  colorCode: string | null;
  topicsTotal: number;
  topicsCompleted: number;
  overallAccuracy: number;
  chapters: ChapterReportEntry[];
}

export interface ProgressReportSummary {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  lockedTopics: number;
  overallAccuracy: number;
  totalPYQAttempted: number;
  pyqAccuracy: number;
  lecturesCompleted: number;
}

export interface ProgressReport {
  studentId: string;
  summary: ProgressReportSummary;
  subjects: SubjectReportEntry[];
}

export async function getProgressReport(studentId?: string): Promise<ProgressReport> {
  const url = studentId
    ? `/assessments/progress/report/student/${studentId}`
    : `/assessments/progress/report`;
  const res = await apiClient.get(url);
  return extractData<ProgressReport>(res);
}

// ─── Weekly Activity ──────────────────────────────────────────────────────────

export interface DailyActivity {
  date: string;
  xpEarned: number;
  minutesStudied: number;
  tasksCompleted: number;
}

export async function getWeeklyActivity(): Promise<DailyActivity[]> {
  try {
    const res = await apiClient.get("/students/weekly-activity");
    const data = extractData<DailyActivity[]>(res);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Continue Learning ────────────────────────────────────────────────────────

export interface ContinueLearningItem {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterName: string;
  progressPct: number;
  lastStudiedAt?: string;
  estimatedMinutes?: number;
  batchId?: string;
}

export async function getContinueLearning(): Promise<ContinueLearningItem[]> {
  try {
    const res = await apiClient.get("/students/continue-learning");
    return extractData<ContinueLearningItem[]>(res) ?? [];
  } catch {
    return [];
  }
}

// ─── Student Profile ──────────────────────────────────────────────────────────

export interface StudentProfile {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  city?: string;
  profilePictureUrl?: string;
  examTarget?: string;
  currentClass?: string;
  examYear?: number;
  targetCollege?: string;
  dailyStudyHours?: number;
  preferredLanguage?: string;
  streakDays: number;
  xpPoints: number;
  currentEloTier?: string;
  diagnosticCompleted: boolean;
  rank?: number;
}

export interface UpdateStudentProfilePayload {
  fullName?: string;
  city?: string;
  examTarget?: string;
  currentClass?: string;
  examYear?: number;
  targetCollege?: string;
  dailyStudyHours?: number;
  preferredLanguage?: string;
}

export async function getStudentProfile(): Promise<StudentProfile> {
  const res = await apiClient.get("/students/profile");
  return extractData<StudentProfile>(res);
}

export async function updateStudentProfile(payload: UpdateStudentProfilePayload): Promise<StudentProfile> {
  const res = await apiClient.patch("/students/profile", payload);
  return extractData<StudentProfile>(res);
}

// ─── Discover Batches (post-login modal) ─────────────────────────────────────

export interface DiscoverBatchesResult {
  isFirstLogin: boolean;
  studentPreferences: { examTarget: string; class: string };
  availableBatches: PublicBatch[];
}

export async function discoverBatches(): Promise<DiscoverBatchesResult> {
  const res = await apiClient.get("/students/discover-batches");
  return extractData<DiscoverBatchesResult>(res);
}

export async function enrollInBatch(batchId: string): Promise<{ message: string }> {
  const res = await apiClient.post(`/students/enroll/${batchId}`, {});
  return extractData<{ message: string }>(res);
}

// ─── Public Batch Preview (no enrollment required) ────────────────────────────

export interface PreviewTopic {
  id: string;
  name: string;
  estimatedStudyMinutes: number;
  resourceCounts?: Record<string, number>; // e.g. { pdf: 2, dpp: 1, quiz: 3 }
  lectureCount?: number;
}

export interface PreviewChapter {
  id: string;
  name: string;
  jeeWeightage: number;
  neetWeightage: number;
  topics: PreviewTopic[];
}

export interface PreviewSubject {
  id: string;
  name: string;
  icon: string | null;
  colorCode: string | null;
  teacher: { id: string; name: string } | null;
  chapters: PreviewChapter[];
}

export interface BatchPreview {
  id: string;
  name: string;
  examTarget: string;
  class: string;
  thumbnailUrl: string | null;
  isPaid: boolean;
  feeAmount: number | null;
  maxStudents: number;
  startDate: string | null;
  endDate: string | null;
  status: string;
  teacher: { id: string; fullName: string } | null;
  studentCount: number;
  subjectNames: string[];
  isEnrolled: boolean;
  feePaid: number | null;
  curriculum: PreviewSubject[];
  totalTopics: number;
}

export async function getBatchPreview(batchId: string): Promise<BatchPreview> {
  const res = await apiClient.get(`/students/batches/${batchId}`);
  return extractData<BatchPreview>(res);
}
