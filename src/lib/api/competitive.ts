import api from './school-client';
import { apiClient } from './client';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface MasterExam {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface MasterSubject {
  id: string;
  exam_id: string;
  exam_name?: string;
  exam_code?: string;
  name: string;
  is_active: boolean;
  chapter_count?: number;
}

export interface MasterChapter {
  id: string;
  master_subject_id: string;
  name: string;
  sort_order: number;
  topic_count?: number;
}

export interface MasterTopic {
  id: string;
  master_chapter_id: string;
  name: string;
  sort_order: number;
  verified_question_count?: number;
}

export interface CompetitiveQuestion {
  id: string;
  master_topic_id: string | null;
  exam_target: string;
  exam_year: number | null;
  difficulty: string | null;
  question_type: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string | null;
  explanation: string | null;
  source: 'pyq' | 'ai_generated' | 'manual';
  is_verified: boolean;
  tags: string[];
  created_at: string;
}

export interface CompetitiveSubject {
  id: string;
  institute_id: string;
  master_subject_id: string;
  master_subject_name: string;
  exam_name: string;
  exam_code: string;
  class_id: string;
  class_name?: string;
  display_name?: string | null;
  is_active: boolean;
  teacher_count: number;
}

export interface CompetitiveTeacherAssignment {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  teacher_email?: string;
  competitive_subject_id: string;
  section_id: string | null;
  section_name?: string | null;
}

export interface GroundingLink {
  id: string;
  competitive_subject_id: string;
  master_topic_id: string;
  master_topic_name?: string;
  school_topic_id: string;
  school_topic_name?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Super Admin — global taxonomy + question bank
// Routes live under /super-admin/school/competitive/* (plain apiClient,
// same convention as the other super-admin-for-school screens).
// ─────────────────────────────────────────────────────────────────────────

const SA_BASE = '/super-admin/school/competitive';

export async function listMasterExams(): Promise<MasterExam[]> {
  const res = await apiClient.get(`${SA_BASE}/exams`);
  return res.data?.data ?? [];
}
export async function createMasterExam(payload: { code: string; name: string }) {
  const res = await apiClient.post(`${SA_BASE}/exams`, payload);
  return res.data;
}
export async function updateMasterExam(id: string, payload: Partial<{ name: string; isActive: boolean }>) {
  const res = await apiClient.put(`${SA_BASE}/exams/${id}`, payload);
  return res.data;
}
export async function deleteMasterExam(id: string) {
  const res = await apiClient.delete(`${SA_BASE}/exams/${id}`);
  return res.data;
}

export async function listMasterSubjects(examId?: string): Promise<MasterSubject[]> {
  const res = await apiClient.get(`${SA_BASE}/subjects`, { params: examId ? { examId } : undefined });
  return res.data?.data ?? [];
}
export async function createMasterSubject(payload: { examId: string; name: string }) {
  const res = await apiClient.post(`${SA_BASE}/subjects`, payload);
  return res.data;
}
export async function updateMasterSubject(id: string, payload: Partial<{ name: string; isActive: boolean }>) {
  const res = await apiClient.put(`${SA_BASE}/subjects/${id}`, payload);
  return res.data;
}
export async function deleteMasterSubject(id: string) {
  const res = await apiClient.delete(`${SA_BASE}/subjects/${id}`);
  return res.data;
}

export async function listMasterChapters(masterSubjectId: string): Promise<MasterChapter[]> {
  const res = await apiClient.get(`${SA_BASE}/chapters`, { params: { masterSubjectId } });
  return res.data?.data ?? [];
}
export async function createMasterChapter(payload: { masterSubjectId: string; name: string; sortOrder?: number }) {
  const res = await apiClient.post(`${SA_BASE}/chapters`, payload);
  return res.data;
}
export async function deleteMasterChapter(id: string) {
  const res = await apiClient.delete(`${SA_BASE}/chapters/${id}`);
  return res.data;
}

export async function listMasterTopics(masterChapterId: string): Promise<MasterTopic[]> {
  const res = await apiClient.get(`${SA_BASE}/topics`, { params: { masterChapterId } });
  return res.data?.data ?? [];
}
export async function createMasterTopic(payload: { masterChapterId: string; name: string; sortOrder?: number }) {
  const res = await apiClient.post(`${SA_BASE}/topics`, payload);
  return res.data;
}
export async function deleteMasterTopic(id: string) {
  const res = await apiClient.delete(`${SA_BASE}/topics/${id}`);
  return res.data;
}

export async function listQuestions(params: { masterTopicId?: string; examTarget?: string; isVerified?: boolean; page?: number; limit?: number }) {
  const res = await apiClient.get(`${SA_BASE}/questions`, {
    params: { ...params, isVerified: params.isVerified === undefined ? undefined : String(params.isVerified) },
  });
  return res.data as { data: CompetitiveQuestion[]; total: number; page: number; limit: number };
}
export async function listVerifyQueue(limit = 50): Promise<CompetitiveQuestion[]> {
  const res = await apiClient.get(`${SA_BASE}/questions/verify-queue`, { params: { limit } });
  return res.data?.data ?? [];
}
export async function createQuestion(payload: Record<string, unknown>) {
  const res = await apiClient.post(`${SA_BASE}/questions`, payload);
  return res.data;
}
export async function verifyQuestion(id: string, payload: { masterTopicId?: string; correctAnswer?: string; explanation?: string }) {
  const res = await apiClient.put(`${SA_BASE}/questions/${id}/verify`, payload);
  return res.data;
}
export async function rejectQuestion(id: string) {
  const res = await apiClient.post(`${SA_BASE}/questions/${id}/reject`);
  return res.data;
}

export interface IngestRun {
  id: string;
  status: 'running' | 'succeeded' | 'failed';
  file_name: string | null;
  source: string;
  master_subject_id: string;
  master_subject_name?: string;
  exam_target: string;
  exam_year: number | null;
  pages_total: number | null;
  pages_done: number;
  stage?: string | null;
  total_extracted: number | null;
  inserted: number | null;
  quality: string | null;
  truncated: boolean;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
}

/**
 * Upload a PYQ / question-bank PDF (+ optional answer-key PDF) — runs as a
 * tracked background job, returns immediately. No `examTarget` here — it's
 * derived server-side from the chosen subject's own exam.
 */
export async function ingestFromPdf(params: {
  file: File;
  answerKeyFile?: File;
  masterSubjectId: string;
  examYear?: number;
  source: 'pyq' | 'question_bank';
}): Promise<{ runId: string }> {
  const form = new FormData();
  form.append('file', params.file);
  if (params.answerKeyFile) form.append('answerKeyFile', params.answerKeyFile);
  form.append('masterSubjectId', params.masterSubjectId);
  if (params.examYear) form.append('examYear', String(params.examYear));
  form.append('source', params.source);

  const res = await apiClient.post(`${SA_BASE}/ingest`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000,
  });
  return res.data;
}

export async function getIngestRunStatus(runId: string): Promise<IngestRun> {
  const res = await apiClient.get(`${SA_BASE}/ingest-runs/${runId}`);
  return res.data;
}

export async function listIngestRuns(limit = 20): Promise<IngestRun[]> {
  const res = await apiClient.get(`${SA_BASE}/ingest-runs`, { params: { limit } });
  return res.data?.data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────
// Institute Admin / Teacher — per-institute offerings + assignments
// Routes live under /school/competitive/* (schoolApi, auto /school prefix).
// ─────────────────────────────────────────────────────────────────────────

export async function listCompetitiveSubjects(): Promise<CompetitiveSubject[]> {
  const res = await api.get('/competitive/subjects');
  return res.data?.data ?? [];
}
export async function createCompetitiveSubject(payload: { masterSubjectId: string; classId: string; displayName?: string }) {
  const res = await api.post('/competitive/subjects', payload);
  return res.data;
}
export async function updateCompetitiveSubject(id: string, payload: Partial<{ displayName: string; isActive: boolean }>) {
  const res = await api.put(`/competitive/subjects/${id}`, payload);
  return res.data;
}

export async function listGroundingLinks(competitiveSubjectId: string): Promise<GroundingLink[]> {
  const res = await api.get(`/competitive/subjects/${competitiveSubjectId}/grounding-links`);
  return res.data?.data ?? [];
}
export async function createGroundingLink(competitiveSubjectId: string, payload: { masterTopicId: string; schoolTopicId: string }) {
  const res = await api.post(`/competitive/subjects/${competitiveSubjectId}/grounding-links`, payload);
  return res.data;
}

export async function listAssignmentsForSubject(competitiveSubjectId: string): Promise<CompetitiveTeacherAssignment[]> {
  const res = await api.get(`/competitive/subjects/${competitiveSubjectId}/assignments`);
  return res.data?.data ?? [];
}
export async function assignTeacher(competitiveSubjectId: string, payload: { teacherId: string; sectionId?: string }) {
  const res = await api.post(`/competitive/subjects/${competitiveSubjectId}/assignments`, payload);
  return res.data;
}
export async function unassignTeacher(competitiveSubjectId: string, assignmentId: string) {
  const res = await api.delete(`/competitive/subjects/${competitiveSubjectId}/assignments/${assignmentId}`);
  return res.data;
}

/** Teacher: their own competitive-subject assignments. */
export async function listMyCompetitiveAssignments() {
  const res = await api.get('/competitive/my-assignments');
  return res.data?.data ?? [];
}

/** Student: competitive subjects active for their own class. */
export interface StudentCompetitiveSubject {
  id: string;
  display_name?: string | null;
  master_subject_name: string;
  exam_name: string;
  exam_code: string;
  teacher_count: number;
}
export async function listCompetitiveSubjectsForStudent(): Promise<StudentCompetitiveSubject[]> {
  const res = await api.get('/competitive/student/subjects');
  return res.data?.data ?? [];
}
