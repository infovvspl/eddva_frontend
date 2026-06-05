const CACHE_KEY = 'school_student_dashboard_cache_v1';

export type StudentDashboardCache = {
  dashboardData: unknown;
  assignments: unknown[];
  mockTests: unknown[];
  notices: unknown[];
  courses: unknown[];
  weekEvents: unknown[];
  savedAt: number;
};

let memory: StudentDashboardCache | null = null;

export function readStudentDashboardCache(): StudentDashboardCache | null {
  if (memory) return memory;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    memory = JSON.parse(raw) as StudentDashboardCache;
    return memory;
  } catch {
    return null;
  }
}

export function writeStudentDashboardCache(payload: Omit<StudentDashboardCache, 'savedAt'>) {
  memory = { ...payload, savedAt: Date.now() };
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(memory));
  } catch {
    /* quota or private mode */
  }
}

export function clearStudentDashboardCache() {
  memory = null;
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
