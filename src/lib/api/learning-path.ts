/**
 * School AI learning path API (`/school/learning/*`): home summary and mind
 * map, per-topic chats with their curved path, notes, quizzes/assessments and
 * engagement heartbeats.
 */
import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";
import { getApiBaseUrl } from "@/lib/api-config";
import { tokenStorage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth-store";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MasteryStatus = "weak" | "at_risk" | "ok" | "mastered" | "insufficient_data" | "not_assessed";
export type StepKind = "videos" | "notes" | "quiz" | "assessment";
export type StepStatus = "locked" | "active" | "done" | "skipped";
export type ThreadStatus = "suggested" | "active" | "completed" | "needs_teacher";
export type ActivitySection = "home" | "videos" | "notes" | "quiz" | "assessment" | "chat";

export interface SubtopicNode {
  name: string;
  order: number;
  status: MasteryStatus;
  accuracy: number | null;
  answered: number;
  /** The student opened the topic's path from this subtopic. */
  opened?: boolean;
}

export interface ThreadRef {
  id: string;
  status: ThreadStatus;
  round: number;
  /** Steps finished on the path; 0 means the chat was opened but nothing done yet. */
  stepsDone?: number;
}

export interface TopicNode {
  topicId: string;
  name: string;
  order: number | null;
  status: MasteryStatus;
  mastery: number | null;
  estMinutes: number;
  roadmapState: "ready" | "pending";
  thread: ThreadRef | null;
  subtopics: SubtopicNode[];
  children: { threadId: string; topicId: string; name: string; status: ThreadStatus; stepsDone?: number }[];
}

export interface ChapterNode {
  chapterId: string;
  name: string;
  status: MasteryStatus;
  mastery: number | null;
  estMinutes: number;
  expanded: boolean;
  roadmapState: "ready" | "pending" | null;
  topics: TopicNode[];
}

export interface SubjectNode {
  subjectId: string;
  name: string;
  weakChapters: number;
  atRiskChapters: number;
  chapters: ChapterNode[];
  hiddenChapters: number;
}

export interface LearningHome {
  summary: {
    /** Counts of what the mind map shows: chapters shown as chapters, and topics shown on their own. */
    weakTopics: number;
    atRiskTopics: number;
    weakChapters: number;
    atRiskChapters: number;
    studyMinutes: number;
    detectedFrom: Record<string, number>;
    updatedAt: string | null;
  };
  mindMap: SubjectNode[];
  roadmapsPending: boolean;
}

export interface ThreadSummary {
  id: string;
  scope: "topic" | "general";
  status: ThreadStatus;
  origin: "mind_map" | "prerequisite" | "general";
  parentThreadId: string | null;
  topicId: string | null;
  topicName: string | null;
  chapterId: string | null;
  chapterName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  round: number;
  currentStepId: string | null;
  currentStepKind?: StepKind | null;
  baselineMastery: number | null;
  latestMastery: number | null;
  lastActivityAt: string;
}

export interface ThreadStep {
  id: string;
  kind: StepKind;
  status: StepStatus;
  refId: string | null;
  completedAt: string | null;
  watchedCount: number;
  /** The student has opened this step (its video, notes or questions). */
  opened?: boolean;
}

export interface ThreadRound {
  round: number;
  focusConcepts: string[];
  steps: ThreadStep[];
}

/** A practice question the AI tutor asks in a topic's chat. */
export interface ChatQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface ChatQuizResult {
  answers: number[];
  score: number;
  total: number;
  completedAt: string;
}

export interface ThreadMessage {
  id: string;
  role: "student" | "ai" | "system";
  kind: string;
  stepId: string | null;
  round: number | null;
  content: Record<string, any>;
  createdAt: string;
}

export interface ThreadView {
  thread: ThreadSummary & { weakConcepts: string[] };
  rounds: ThreadRound[];
  messages: ThreadMessage[];
  nextCursor: string | null;
  resume: { stepId: string; kind: StepKind; refId: string | null } | null;
  assessmentInProgress: boolean;
  focusSubtopic?: string | null;
}

export interface StepVideo {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnailUrl: string;
}

export interface NotesView {
  sessionId: string;
  topicId: string;
  threadId: string | null;
  round: number;
  focusConcepts: string[];
  lessonMarkdown: string;
  keyConcepts: string[];
  formulas: string[];
  practiceQuestions: { question: string; answer: string; explanation: string; options?: string[] }[];
  commonMistakes: string[];
  highlights: { text: string; color: string }[];
  inlineComments: { id: string; text: string; quote: string; top: number; left?: number }[];
  lastAnchor: { headingId?: string; offsetPct?: number } | null;
  timeSpentSeconds: number;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizInProgress {
  instanceId: string;
  kind: "quiz" | "assessment";
  status: "in_progress";
  round: number;
  topicId: string;
  questions: { id: string; text: string; options: QuizOption[]; conceptTag: string | null }[];
  draftAnswers: Record<string, string>;
  startedAt: string;
  expiresAt: string | null;
  remainingSeconds: number | null;
}

export interface QuizResult {
  instanceId: string;
  kind: "quiz" | "assessment";
  status: "submitted" | "auto_submitted";
  round: number;
  topicId: string;
  submittedAt: string;
  score: number;
  total: number;
  accuracy: number;
  weakConcepts: { conceptTag: string; correct: number; total: number; accuracy: number }[];
  questions: {
    id: string;
    text: string;
    options: QuizOption[];
    conceptTag: string | null;
    yourAnswer: string | null;
    correctOptionId: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export type QuizView = QuizInProgress | QuizResult;
export const isQuizResult = (q: QuizView): q is QuizResult => q.status !== "in_progress";

export type OpenStepResult =
  | { stepId: string; kind: "videos"; videos: StepVideo[]; watched: string[] }
  | { stepId: string; kind: "notes"; notes: NotesView }
  | { stepId: string; kind: "quiz" | "assessment"; quiz: QuizView };

export interface MyEngagement {
  todaySeconds: number;
  weekSeconds: number;
  byDay: { day: string; seconds: number }[];
  bySubject: { subjectId: string | null; subjectName: string; seconds: number }[];
  bySection: { section: ActivitySection; seconds: number }[];
  streakDays: number;
}

// ─── Calls ───────────────────────────────────────────────────────────────────

const data = <T,>(res: { data?: unknown }) => unwrapSchoolData<T>(res, undefined as unknown as T);

export const learningApi = {
  home: async () => data<LearningHome>(await schoolApi.get("/learning/home")),
  threads: async () => data<ThreadSummary[]>(await schoolApi.get("/learning/threads")),
  openThread: async (body: { topicId?: string; general?: boolean; focusSubtopic?: string }) =>
    data<ThreadView>(await schoolApi.post("/learning/threads", body)),
  thread: async (id: string, before?: string) =>
    data<ThreadView>(await schoolApi.get(`/learning/threads/${id}`, { params: before ? { before } : undefined })),
  /** mode "quiz" asks the AI tutor for practice questions answered by tapping an option. */
  postMessage: async (id: string, text: string, mode: "chat" | "quiz" = "chat") =>
    data<{ studentMessage: ThreadMessage; aiMessage: ThreadMessage }>(
      await schoolApi.post(`/learning/threads/${id}/messages`, mode === "quiz" ? { text, mode } : { text }),
    ),
  saveChatQuizResult: async (id: string, messageId: string, answers: number[]) =>
    data<{ quizResult: ChatQuizResult }>(await schoolApi.post(`/learning/threads/${id}/messages/${messageId}/quiz-result`, { answers })),
  openStep: async (id: string, stepId: string, retake = false) =>
    data<OpenStepResult>(await schoolApi.post(`/learning/threads/${id}/steps/${stepId}/open`, retake ? { retake } : {})),
  stepProgress: async (id: string, stepId: string, body: { watchedVideoIds?: string[]; videosDone?: boolean; notesDone?: boolean }) =>
    data<{ stepId: string; status: StepStatus; watched?: string[]; unlocked?: string | null }>(
      await schoolApi.patch(`/learning/threads/${id}/steps/${stepId}/progress`, body),
    ),
  quiz: async (instanceId: string) => data<QuizView>(await schoolApi.get(`/learning/quiz-instances/${instanceId}`)),
  saveDraft: async (instanceId: string, answers: Record<string, string>) =>
    data<{ saved: boolean; answered: number; savedAt: string } | QuizResult>(
      await schoolApi.patch(`/learning/quiz-instances/${instanceId}/draft`, { answers }),
    ),
  submitQuiz: async (instanceId: string, answers: Record<string, string>) =>
    data<QuizResult>(await schoolApi.post(`/learning/quiz-instances/${instanceId}/submit`, { answers })),
  saveNotes: async (
    sessionId: string,
    body: { highlights?: NotesView["highlights"]; inlineComments?: NotesView["inlineComments"]; lastAnchor?: NotesView["lastAnchor"] },
  ) => data<{ saved: boolean }>(await schoolApi.patch(`/learning/notes/${sessionId}`, body)),
  myEngagement: async () => data<MyEngagement>(await schoolApi.get("/learning/engagement/me")),
  heartbeat: (body: { section: ActivitySection; threadId?: string; stepId?: string; beats: number[] }) =>
    schoolApi.post("/learning/activity/heartbeat", { ...body, device: deviceKind() }),
};

/**
 * The last heartbeat when the page is hidden or closed. `fetch` with
 * keepalive survives the unload and, unlike sendBeacon, can send the auth
 * header the endpoint needs.
 */
export function sendFinalHeartbeat(body: { section: ActivitySection; threadId?: string; stepId?: string; beats: number[] }) {
  const token = tokenStorage.getAccess();
  if (!token) return;
  const { user, tenantType } = useAuthStore.getState() as any;
  const instituteId = user?.instituteId || (tenantType === "school" ? user?.tenantId : null);
  try {
    void fetch(`${getApiBaseUrl()}/school/learning/activity/heartbeat`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(instituteId ? { "X-Institute-Id": instituteId } : {}),
      },
      body: JSON.stringify({ ...body, device: deviceKind() }),
    });
  } catch {
    /* best effort: at most one heartbeat (≤ 15 s) is lost */
  }
}

function deviceKind(): "web" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "web";
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "web";
}

/** A user-facing message from an API error (the backend's message, else a fallback). */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const res = (err as any)?.response?.data;
  const msg = res?.message;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (Array.isArray(msg) && msg.length) return String(msg[0]);
  return fallback;
}

/** The machine-readable code the backend's exception filter passes through as `error` (e.g. ASSESSMENT_IN_PROGRESS). */
export function apiErrorCode(err: unknown): string | null {
  const res = (err as any)?.response?.data;
  return typeof res?.error === "string" ? res.error : null;
}
