/**
 * Chapter lesson plans: a teacher creates one per chapter (AI from the school's
 * textbook, an uploaded PDF read by AI, or by hand), submits it, and the
 * institute admin approves it or sends it back. On the approved plan the teacher
 * records each period taught, per section, and keeps private notes.
 * Backend: /school/lesson-plans.
 */
import api from '@/lib/api/school-client';

export type LessonPlanStatus =
  | 'GENERATING' | 'DRAFT' | 'FAILED' | 'PENDING_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'ARCHIVED';

export interface LessonPlanPeriod {
  id?: string;
  periodNo?: number;
  title: string;
  objectives: string;
  activities: string;
  resources: string;
  assessment: string;
  homework: string;
}

export interface LessonPlanFields {
  title: string;
  learningObjectives: string;
  priorKnowledge: string;
  methodology: string;
  resources: string;
  digitalResources: string;
  assessmentPlan: string;
  homeworkSummary: string;
  expectedOutcomes: string;
}

// ── Schema v2 (structured plan) — mirrors eddva_backend lesson-plan-schema.ts ──
export const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'] as const;
export const PHASES = ['introduction', 'explanation', 'guided_practice', 'independent_practice', 'check', 'conclusion'] as const;
export type Phase = typeof PHASES[number];
export const PHASE_LABELS: Record<Phase, string> = {
  introduction: 'Introduction', explanation: 'Explanation', guided_practice: 'Guided practice',
  independent_practice: 'Independent practice', check: 'Check for understanding', conclusion: 'Conclusion',
};
export interface PlanObjective { id: string; text: string; bloom: string; assessment: string; source: { type: 'textbook' | 'suggestion'; pages: number[] } }
/** `marker`: an untimed closing note (conclusion, last step, 0 minutes); the backend validator enforces this. */
export interface SequenceStep { phase: Phase; minutes: number; teacher: string; students: string; marker?: true }
export interface PlanQuestion { question: string; answer: string; objectiveIds: string[] }
export interface PlanPeriod {
  number: number; topic: string; objectiveIds: string[]; sequence: SequenceStep[]; examples: string[]; resources: string[];
  checks: string[]; questions: PlanQuestion[]; homework: string; exitTicket: string; pages: number[];
}
export interface LessonPlanContent {
  schemaVersion: 2; title: string; objectives: PlanObjective[]; outcomes: string[]; prerequisites: string[];
  keyConcepts: Array<{ term: string; meaning: string; pages: number[] }>; resources: string[];
  misconceptions: Array<{ misconception: string; correction: string }>;
  differentiation: { support: string[]; onLevel: string[]; challenge: string[]; accessibility: string[] };
  groundingNotes: string; periods: PlanPeriod[];
}
export interface QualityIssue { code: string; message: string; period?: number; severity: 'error' | 'warning' }
export const REGENERATABLE_PARTS = ['period', 'objectives', 'outcomes', 'prerequisites', 'keyConcepts', 'resources', 'misconceptions', 'differentiation'] as const;
export type RegeneratablePart = typeof REGENERATABLE_PARTS[number];

export const PROGRESS_STATUSES = ['TAUGHT', 'PARTIAL', 'SKIPPED'] as const;
export type ProgressStatus = typeof PROGRESS_STATUSES[number];
export const PROGRESS_META: Record<ProgressStatus, { label: string; className: string }> = {
  TAUGHT: { label: 'Taught', className: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200' },
  PARTIAL: { label: 'Partly', className: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200' },
  SKIPPED: { label: 'Skipped', className: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};
export interface ProgressRecord { periodNo: number; sectionId: string; status: ProgressStatus; taughtOn: string | null; note: string | null }
export interface ProgressSummary { sectionId: string; sectionName: string; total: number; taught: number; partial: number; skipped: number; done: number }
/** PDF only for now; the backend refuses anything else with a reason. */
export const UPLOAD_MAX_MB = 10;

export interface ChapterLessonPlan extends LessonPlanFields {
  id: string;
  status: LessonPlanStatus;
  version: number;
  totalPeriods: number;
  source: 'AI' | 'UPLOAD' | 'MANUAL';
  grounded: boolean;
  groundedPages: number[] | null;
  classId: string;
  subjectId: string;
  chapterId: string;
  className: string;
  subjectName: string;
  chapterName: string;
  sectionNames: string | null;
  teacherUserId: string;
  teacherName: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  error: string | null;
  updatedAt: string;
  schemaVersion: number;
  content: LessonPlanContent | null;
  qualityWarnings: QualityIssue[];
  periodMinutes: number | null;
  revision: number;
  generationMs: number | null;
  sourceFileUrl?: string | null;
  sourceFileName?: string | null;
  /** List views: (period, section) records done (taught or skipped) out of periods × sections. */
  progressDone?: number;
  progressTotal?: number;
  /** Detail views. */
  sections?: Array<{ id: string; name: string }>;
  progress?: ProgressRecord[];
  progressSummary?: ProgressSummary[];
  /** Teacher only: their private notes. */
  notes?: { note: string; updatedAt: string | null };
  /** Right after an upload. */
  upload?: { pages: number; characters: number; truncated: boolean };
  periods?: LessonPlanPeriod[];
  history?: Array<{ id: string; version: number; status: LessonPlanStatus; submittedAt: string | null; reviewedAt: string | null; reviewComment: string | null }>;
}

export interface TeachingAssignment {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  sectionNames: string | null;
}

export const PLAN_FIELD_LABELS: Array<[keyof LessonPlanFields, string]> = [
  ['learningObjectives', 'Learning objectives'],
  ['priorKnowledge', 'Prior knowledge'],
  ['methodology', 'Teaching methodology'],
  ['resources', 'Resources'],
  ['digitalResources', 'Digital resources'],
  ['assessmentPlan', 'Assessment plan'],
  ['homeworkSummary', 'Homework'],
  ['expectedOutcomes', 'Expected learning outcomes'],
];

export const PERIOD_FIELD_LABELS: Array<[keyof Omit<LessonPlanPeriod, 'id' | 'periodNo' | 'title'>, string]> = [
  ['objectives', 'Objectives'],
  ['activities', 'Activities'],
  ['resources', 'Resources'],
  ['assessment', 'Assessment'],
  ['homework', 'Homework'],
];

export const STATUS_META: Record<LessonPlanStatus, { label: string; className: string }> = {
  GENERATING: { label: 'Generating…', className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' },
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  FAILED: { label: 'Generation failed', className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900' },
  PENDING_APPROVAL: { label: 'Waiting for approval', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900' },
  CHANGES_REQUESTED: { label: 'Changes requested', className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-900' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900' },
  ARCHIVED: { label: 'Replaced', className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800' },
};

const data = <T,>(r: any): T => (r?.data?.data ?? r?.data) as T;

export const lessonPlans = {
  // Teacher
  mine: () => api.get('/lesson-plans/my').then((r) => data<{ assignments: TeachingAssignment[]; plans: ChapterLessonPlan[]; minutesPerPeriod: number }>(r)),
  /** The admin's annual syllabus plans for my class-subjects, with live topic progress (the page's backbone). */
  annualPlans: () => api.get('/syllabus/teaching-plan/annual-plans').then((r) => { const d = data<any>(r); return (Array.isArray(d) ? d : []) as any[]; }),
  chapters: (classId: string, subjectId: string) =>
    api.get('/lesson-plans/my/chapters', { params: { classId, subjectId } }).then((r) => data<Array<{ id: string; name: string }>>(r) ?? []),
  generate: (body: { classId: string; subjectId: string; chapterIds?: string[]; allChapters?: boolean; periods?: number; minutesPerPeriod?: number; regenerate?: boolean }) =>
    api.post('/lesson-plans/generate', body).then((r) => data<{ queued: any[]; skipped: any[]; minutesPerPeriod: number }>(r)),
  createManual: (body: { classId: string; subjectId: string; chapterId: string; periods?: number; minutesPerPeriod?: number }) =>
    api.post('/lesson-plans', body).then((r) => data<ChapterLessonPlan>(r)),
  get: (id: string) => api.get(`/lesson-plans/my/${id}`).then((r) => data<ChapterLessonPlan>(r)),
  /** Saves from `revision` (the copy on screen); a newer save elsewhere makes this 409. */
  update: (id: string, body: { revision: number; content?: LessonPlanContent } & Partial<LessonPlanFields> & { periods?: LessonPlanPeriod[] }) =>
    api.put(`/lesson-plans/my/${id}`, body).then((r) => data<ChapterLessonPlan>(r)),
  submit: (id: string, revision: number) => api.post(`/lesson-plans/my/${id}/submit`, { revision }).then((r) => data<ChapterLessonPlan>(r)),
  regenerate: (id: string, body: { revision: number; part: RegeneratablePart; periodNumber?: number; instruction?: string }) =>
    api.post(`/lesson-plans/my/${id}/regenerate`, body, { timeout: 240_000 }).then((r) => data<ChapterLessonPlan>(r)),
  retry: (id: string) => api.post(`/lesson-plans/my/${id}/retry`).then((r) => data<ChapterLessonPlan>(r)),
  newVersion: (id: string) => api.post(`/lesson-plans/my/${id}/new-version`).then((r) => data<ChapterLessonPlan>(r)),
  /** Upload a PDF plan; the AI reads it into a draft (queued, like a generation). */
  importUpload: (body: { classId: string; subjectId: string; chapterId: string; minutesPerPeriod?: number }, file: File) => {
    const form = new FormData();
    form.append('file', file);
    Object.entries(body).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') form.append(k, String(v)); });
    return api.post('/lesson-plans/import', form, { timeout: 120_000 }).then((r) => data<ChapterLessonPlan>(r));
  },
  /** Approved plans: how one period went in one section. NOT_STARTED clears it. */
  recordProgress: (id: string, body: { periodNo: number; sectionId: string; status: ProgressStatus | 'NOT_STARTED'; taughtOn?: string; note?: string }) =>
    api.post(`/lesson-plans/my/${id}/progress`, body).then((r) => data<ChapterLessonPlan>(r)),
  saveNotes: (id: string, note: string) =>
    api.put(`/lesson-plans/my/${id}/notes`, { note }).then((r) => data<{ note: string; updatedAt: string | null }>(r)),
  discard: (id: string) => api.delete(`/lesson-plans/my/${id}`),

  // Admin
  reviewList: (params: { status?: string; teacherUserId?: string; classId?: string; subjectId?: string } = {}) =>
    api.get('/lesson-plans/review', { params }).then((r) => data<{ plans: ChapterLessonPlan[]; pending: number }>(r)),
  reviewGet: (id: string) => api.get(`/lesson-plans/review/${id}`).then((r) => data<ChapterLessonPlan>(r)),
  approve: (id: string) => api.post(`/lesson-plans/review/${id}/approve`).then((r) => data<ChapterLessonPlan>(r)),
  sendBack: (id: string, comment: string) =>
    api.post(`/lesson-plans/review/${id}/send-back`, { comment }).then((r) => data<ChapterLessonPlan>(r)),
};

/** The API's error message, for toasts. */
export const isConflict = (err: any): boolean => err?.response?.status === 409;

export const apiError = (err: any, fallback: string): string => {
  const m = err?.response?.data?.message;
  return (Array.isArray(m) ? m.join(', ') : m) || fallback;
};
