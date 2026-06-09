import api from '@/lib/api/school-client';

// ── Types ───────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  section: string;
  question: string;
  options: { value: string; label: string }[];
}

export interface QuizStatus {
  completed: boolean;
  completedAt: string | null;
  canRetake: boolean;
  canRetakeAfter: string | null;
  hollandCode?: string | null;
}

export interface HollandScores {
  R: number; I: number; A: number; S: number; E: number; C: number;
}

export interface QuizResult {
  hollandCode: string;
  scores: HollandScores;
}

export interface CareerItem {
  careerId: string;
  title: string;
  fitScore: number;
  reasoning: string;
  focusAreas: string[];
  actionPlan: string[];
}

export interface CareerReport {
  topCareers: CareerItem[];
  overallAnalysis: string;
  streamRecommendation: string | null;
  immediateActions: string[];
  encouragement: string;
  generatedAt: string;
  generatedForGrade: number;
}

export interface CareerPath {
  id: string;
  title: string;
  stream: string;
  exams: string[];
  topColleges: string[];
  salaryRange: string;
  description: string;
  hollandMatch?: string[];
  requiredSubjects?: Record<string, number>;
  gradeRelevance?: number[];
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

// Backend wraps payloads as { success, data }. Some nested objects double-wrap.
function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  const p = payload as ApiEnvelope<T>;
  return (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (payload as T));
}

// ── API functions ────────────────────────────────────────────────────────────
export async function getQuizQuestions(): Promise<{ questions: QuizQuestion[]; status: QuizStatus }> {
  const res = await api.get('/career/quiz/questions');
  const data = unwrap<{ questions: QuizQuestion[]; status: ApiEnvelope<QuizStatus> | QuizStatus }>(res.data);
  return {
    questions: data?.questions ?? [],
    status: unwrap<QuizStatus>(data?.status),
  };
}

export async function getQuizStatus(): Promise<QuizStatus> {
  const res = await api.get('/career/quiz/status');
  return unwrap<QuizStatus>(res.data);
}

export async function submitQuiz(answers: { questionId: string; value: string }[]): Promise<QuizResult> {
  const res = await api.post('/career/quiz/submit', { answers });
  return unwrap<QuizResult>(res.data);
}

interface GenerateResponse {
  report: Omit<CareerReport, 'generatedAt' | 'generatedForGrade'> & Partial<Pick<CareerReport, 'generatedForGrade'>>;
  generatedAt?: string;
  validUntil?: string;
}

export async function generateCareerReport(): Promise<{ report: CareerReport }> {
  const res = await api.post('/career/report/generate', {});
  const data = unwrap<GenerateResponse>(res.data);
  return { report: normaliseReport(data) };
}

export async function getCareerReport(): Promise<CareerReport | null> {
  const res = await api.get('/career/report');
  const data = unwrap<GenerateResponse | null>(res.data);
  if (!data || !data.report) return null;
  return normaliseReport(data);
}

function normaliseReport(data: GenerateResponse): CareerReport {
  const r = data.report;
  return {
    topCareers: Array.isArray(r?.topCareers) ? r.topCareers : [],
    overallAnalysis: r?.overallAnalysis ?? '',
    streamRecommendation: r?.streamRecommendation ?? null,
    immediateActions: Array.isArray(r?.immediateActions) ? r.immediateActions : [],
    encouragement: r?.encouragement ?? '',
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    generatedForGrade: r?.generatedForGrade ?? 0,
  };
}

export async function getCareerPaths(): Promise<CareerPath[]> {
  const res = await api.get('/career/explore');
  return unwrap<CareerPath[]>(res.data) ?? [];
}

export async function getCareerDetail(careerId: string): Promise<CareerPath> {
  const res = await api.get(`/career/explore/${careerId}`);
  return unwrap<CareerPath>(res.data);
}

// ── Shared Holland metadata (UI labels) ───────────────────────────────────────
export const HOLLAND_INFO: Record<string, { label: string; desc: string }> = {
  R: { label: 'Realistic', desc: 'You love hands-on, practical, and technical work' },
  I: { label: 'Investigative', desc: 'You love research, analysis, and solving complex problems' },
  A: { label: 'Artistic', desc: 'You love creativity, expression, and imagination' },
  S: { label: 'Social', desc: 'You enjoy helping people and working in teams' },
  E: { label: 'Enterprising', desc: 'You enjoy leading, persuading, and taking initiative' },
  C: { label: 'Conventional', desc: 'You like structure, organising, and attention to detail' },
};

export const hollandLabel = (code: string): string =>
  code.split('').map((l) => HOLLAND_INFO[l]?.label).filter(Boolean).join(' + ');
