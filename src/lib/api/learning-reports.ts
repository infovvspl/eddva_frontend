/**
 * Study-planner reports (`/school/learning/reports/*`) for administrators,
 * teachers and parents. The server decides which students and subjects the
 * viewer may see.
 */
import schoolApi, { unwrapSchoolData } from "@/lib/api/school-client";

export type ReportPeriod = "today" | "week" | "month" | "year";
export type TrendGranularity = "day" | "week" | "month" | "year";
export type EngagementLevel = "high" | "medium" | "low";

export interface TrendPoint {
  period: string;
  seconds: number;
  activeStudents: number;
}

export interface ReportStudentRow {
  studentId: string;
  userId: string;
  name: string;
  rollNo: string | null;
  className: string | null;
  sectionName: string | null;
  seconds: number;
  activeDays: number;
  stepsDone: number;
  lastActiveDay: string | null;
  engagementScore: number;
  engagementLevel: EngagementLevel;
  inactive: boolean;
  weakTopics: number;
  atRiskTopics: number;
  topicsStarted: number;
  topicsCompleted: number;
  improvement: number | null;
  effortWithoutGain: boolean;
}

export interface ReportListItem {
  studentId: string;
  userId: string;
  name: string;
  className: string | null;
  sectionName: string | null;
  seconds: number;
  engagementScore: number;
  lastActiveDay: string | null;
  improvement: number | null;
}

export interface ReportOverview {
  viewer: "admin" | "teacher" | "parent";
  period: ReportPeriod;
  granularity: TrendGranularity;
  from: string;
  to: string;
  filters: {
    classes: { id: string; name: string; sections: { id: string; name: string }[] }[];
    subjects: { id: string; name: string }[];
  };
  totals: {
    students: number;
    activeStudents: number;
    seconds: number;
    averageSecondsPerActiveStudent: number;
    averageEngagement: number;
    averageImprovement: number | null;
    inactive: number;
    lowEngagement: number;
    effortWithoutGain: number;
  };
  trend: TrendPoint[];
  lists: { inactive: ReportListItem[]; lowEngagement: ReportListItem[]; effortWithoutGain: ReportListItem[] };
  weakTopics: { name: string; subjectName: string | null; weakStudents: number; atRiskStudents: number }[];
  students: ReportStudentRow[];
}

export interface ReportTopicPath {
  topicName: string;
  chapterName: string | null;
  status: "active" | "completed" | "needs_teacher" | "suggested";
  round: number;
  baseline: number | null;
  latest: number | null;
  improvement: number | null;
  seconds: number;
  lastActivityAt: string;
}

export interface ReportSubject {
  subjectId: string;
  name: string;
  seconds: number;
  weakChapters: { name: string; mastery: number | null }[];
  atRiskChapters: { name: string; mastery: number | null }[];
  weakTopics: { name: string; chapterName: string | null; mastery: number | null }[];
  atRiskTopics: { name: string; chapterName: string | null; mastery: number | null }[];
  focusAreas: string[];
  improvement: number | null;
  paths: ReportTopicPath[];
}

export interface StudentReport {
  viewer: "admin" | "teacher" | "parent";
  period: ReportPeriod;
  granularity: TrendGranularity;
  from: string;
  to: string;
  student: { studentId: string; userId: string; name: string; rollNo: string | null; className: string | null; sectionName: string | null };
  allSubjects: boolean;
  summary: {
    seconds: number;
    activeDays: number;
    stepsDone: number;
    engagementScore: number;
    engagementLevel: EngagementLevel;
    inactive: boolean;
    lastActiveDay: string | null;
    streakDays: number;
    improvement: number | null;
    effortWithoutGain: boolean;
    topicsStarted: number;
    topicsCompleted: number;
  };
  trend: TrendPoint[];
  bySection: { section: string; seconds: number }[];
  bySubject: { subjectId: string; name: string; seconds: number }[];
  subjects: ReportSubject[];
}

export interface ReportChild {
  studentId: string;
  userId: string;
  name: string;
  className: string | null;
  sectionName: string | null;
}

export interface ReportParams {
  period?: ReportPeriod;
  trend?: TrendGranularity;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
}

const data = <T,>(res: { data?: unknown }) => unwrapSchoolData<T>(res, undefined as unknown as T);
/** Only the filters that are set, so the server applies its defaults to the rest. */
const clean = (p: ReportParams) => Object.fromEntries(Object.entries(p).filter(([, v]) => !!v));

export const learningReportsApi = {
  overview: async (params: ReportParams) => data<ReportOverview>(await schoolApi.get("/learning/reports/overview", { params: clean(params) })),
  student: async (id: string, params: ReportParams) => data<StudentReport>(await schoolApi.get(`/learning/reports/students/${id}`, { params: clean(params) })),
  children: async () => data<ReportChild[]>(await schoolApi.get("/learning/reports/children")),
};
