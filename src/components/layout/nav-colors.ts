/** Per-route icon colours shared by the sidebars and the mobile tab bars. */
export type NavColor = { active: string; activeBg: string; inactive: string; inactiveBg: string; bg: string }

export const NAV_ICON_COLORS: Record<string, NavColor> = {
  // === BLUE: DASHBOARDS ===
  '/super-admin': { active: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md', inactive: 'text-blue-400', inactiveBg: 'bg-blue-400 text-white shadow-md', bg: 'bg-blue-50' },
  '/admin': { active: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md', inactive: 'text-blue-400', inactiveBg: 'bg-blue-400 text-white shadow-md', bg: 'bg-blue-50' },
  '/teacher': { active: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md', inactive: 'text-blue-400', inactiveBg: 'bg-blue-400 text-white shadow-md', bg: 'bg-blue-50' },
  '/student': { active: 'text-blue-600', activeBg: 'bg-blue-600 text-white shadow-md', inactive: 'text-blue-400', inactiveBg: 'bg-blue-400 text-white shadow-md', bg: 'bg-blue-50' },

  // === VIOLET: TENANTS & COURSE MATERIAL / CORE ACADEMICS ===
  '/super-admin/tenants': { active: 'text-violet-600', activeBg: 'bg-violet-600 text-white shadow-md', inactive: 'text-violet-400', inactiveBg: 'bg-violet-400 text-white shadow-md', bg: 'bg-violet-50' },
  '/admin/students': { active: 'text-violet-600', activeBg: 'bg-violet-600 text-white shadow-md', inactive: 'text-violet-400', inactiveBg: 'bg-violet-400 text-white shadow-md', bg: 'bg-violet-50' },
  '/student/courses': { active: 'text-violet-600', activeBg: 'bg-violet-600 text-white shadow-md', inactive: 'text-violet-400', inactiveBg: 'bg-violet-400 text-white shadow-md', bg: 'bg-violet-50' },

  // === INDIGO: STAFF / TEACHERS & BATCH STRUCTURES ===
  '/admin/teachers': { active: 'text-indigo-600', activeBg: 'bg-indigo-600 text-white shadow-md', inactive: 'text-indigo-400', inactiveBg: 'bg-indigo-400 text-white shadow-md', bg: 'bg-indigo-50' },
  '/admin/batches': { active: 'text-indigo-600', activeBg: 'bg-indigo-600 text-white shadow-md', inactive: 'text-indigo-400', inactiveBg: 'bg-indigo-400 text-white shadow-md', bg: 'bg-indigo-50' },
  '/teacher/batches': { active: 'text-indigo-600', activeBg: 'bg-indigo-600 text-white shadow-md', inactive: 'text-indigo-400', inactiveBg: 'bg-indigo-400 text-white shadow-md', bg: 'bg-indigo-50' },

  // === ORANGE: COURSE CONTENT / STUDY LIBRARIES ===
  '/admin/content': { active: 'text-orange-600', activeBg: 'bg-orange-600 text-white shadow-md', inactive: 'text-orange-400', inactiveBg: 'bg-orange-400 text-white shadow-md', bg: 'bg-orange-50' },
  '/teacher/content': { active: 'text-orange-600', activeBg: 'bg-orange-600 text-white shadow-md', inactive: 'text-orange-400', inactiveBg: 'bg-orange-400 text-white shadow-md', bg: 'bg-orange-50' },
  '/student/learn': { active: 'text-orange-600', activeBg: 'bg-orange-600 text-white shadow-md', inactive: 'text-orange-400', inactiveBg: 'bg-orange-400 text-white shadow-md', bg: 'bg-orange-50' },
  '/super-admin/feature-flags': { active: 'text-orange-600', activeBg: 'bg-orange-600 text-white shadow-md', inactive: 'text-orange-400', inactiveBg: 'bg-orange-400 text-white shadow-md', bg: 'bg-orange-50' },

  // === EMERALD: LIVE SESSIONS & ANALYTICS ===
  '/teacher/lectures': { active: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md', inactive: 'text-emerald-400', inactiveBg: 'bg-emerald-400 text-white shadow-md', bg: 'bg-emerald-50' },
  '/student/live-classes': { active: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md', inactive: 'text-emerald-400', inactiveBg: 'bg-emerald-400 text-white shadow-md', bg: 'bg-emerald-50' },
  '/teacher/analytics': { active: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md', inactive: 'text-emerald-400', inactiveBg: 'bg-emerald-400 text-white shadow-md', bg: 'bg-emerald-50' },
  '/super-admin/analytics': { active: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md', inactive: 'text-emerald-400', inactiveBg: 'bg-emerald-400 text-white shadow-md', bg: 'bg-emerald-50' },
  '/student/progress': { active: 'text-emerald-600', activeBg: 'bg-emerald-600 text-white shadow-md', inactive: 'text-emerald-400', inactiveBg: 'bg-emerald-400 text-white shadow-md', bg: 'bg-emerald-50' },

  // === RED: RECORDED FOOTAGE & LIVE COMPETITION ===
  '/teacher/recorded-lectures': { active: 'text-red-600', activeBg: 'bg-red-600 text-white shadow-md', inactive: 'text-red-400', inactiveBg: 'bg-red-400 text-white shadow-md', bg: 'bg-red-50' },
  '/admin/lectures': { active: 'text-red-600', activeBg: 'bg-red-600 text-white shadow-md', inactive: 'text-red-400', inactiveBg: 'bg-red-400 text-white shadow-md', bg: 'bg-red-50' },
  '/student/battle': { active: 'text-red-600', activeBg: 'bg-red-600 text-white shadow-md', inactive: 'text-red-400', inactiveBg: 'bg-red-400 text-white shadow-md', bg: 'bg-red-50' },

  // === FUCHSIA: EVALUATION & QUIZZES ===
  '/admin/mock-tests': { active: 'text-fuchsia-600', activeBg: 'bg-fuchsia-600 text-white shadow-md', inactive: 'text-fuchsia-400', inactiveBg: 'bg-fuchsia-400 text-white shadow-md', bg: 'bg-fuchsia-50' },
  '/teacher/quizzes': { active: 'text-fuchsia-600', activeBg: 'bg-fuchsia-600 text-white shadow-md', inactive: 'text-fuchsia-400', inactiveBg: 'bg-fuchsia-400 text-white shadow-md', bg: 'bg-fuchsia-50' },

  // === TEAL: DATA RETRIEVAL / AUDITS / PROGRESS PLANS ===
  '/admin/reports': { active: 'text-teal-600', activeBg: 'bg-teal-600 text-white shadow-md', inactive: 'text-teal-400', inactiveBg: 'bg-teal-400 text-white shadow-md', bg: 'bg-teal-50' },
  '/super-admin/audit-logs': { active: 'text-teal-600', activeBg: 'bg-teal-600 text-white shadow-md', inactive: 'text-teal-400', inactiveBg: 'bg-teal-400 text-white shadow-md', bg: 'bg-teal-50' },
  '/student/study-plan': { active: 'text-teal-600', activeBg: 'bg-teal-600 text-white shadow-md', inactive: 'text-teal-400', inactiveBg: 'bg-teal-400 text-white shadow-md', bg: 'bg-teal-50' },

  // === AMBER: TIME SENSITIVE (CALENDARS, INQUIRIES, DOUBTS) ===
  '/teacher/doubts': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },
  '/student/doubts': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },
  '/super-admin/support-tickets': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },
  '/admin/calendar': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },
  '/teacher/calendar': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },
  '/student/calendar': { active: 'text-amber-600', activeBg: 'bg-amber-600 text-white shadow-md', inactive: 'text-amber-400', inactiveBg: 'bg-amber-400 text-white shadow-md', bg: 'bg-amber-50' },

  // === SKY: GENERAL/USER OPERATIONS & DIRECT SUPPORT CONTACTS ===
  '/admin/support-tickets': { active: 'text-sky-600', activeBg: 'bg-sky-600 text-white shadow-md', inactive: 'text-sky-400', inactiveBg: 'bg-sky-400 text-white shadow-md', bg: 'bg-sky-50' },
  '/teacher/support-tickets': { active: 'text-sky-600', activeBg: 'bg-sky-600 text-white shadow-md', inactive: 'text-sky-400', inactiveBg: 'bg-sky-400 text-white shadow-md', bg: 'bg-sky-50' },
  '/student/support-tickets': { active: 'text-sky-600', activeBg: 'bg-sky-600 text-white shadow-md', inactive: 'text-sky-400', inactiveBg: 'bg-sky-400 text-white shadow-md', bg: 'bg-sky-50' },

  // === ROSE: COMMUNICATIONS ===
  '/super-admin/communication': { active: 'text-rose-500', activeBg: 'bg-rose-500 text-white shadow-md', inactive: 'text-rose-400', inactiveBg: 'bg-rose-400 text-white shadow-md', bg: 'bg-rose-50' },
  '/admin/communication': { active: 'text-rose-500', activeBg: 'bg-rose-500 text-white shadow-md', inactive: 'text-rose-400', inactiveBg: 'bg-rose-400 text-white shadow-md', bg: 'bg-rose-50' },
  '/teacher/communication': { active: 'text-rose-500', activeBg: 'bg-rose-500 text-white shadow-md', inactive: 'text-rose-400', inactiveBg: 'bg-rose-400 text-white shadow-md', bg: 'bg-rose-50' },
  '/student/communication': { active: 'text-rose-500', activeBg: 'bg-rose-500 text-white shadow-md', inactive: 'text-rose-400', inactiveBg: 'bg-rose-400 text-white shadow-md', bg: 'bg-rose-50' },

  // === YELLOW: EVENTS, BADGES & SCORES ===
  '/admin/notifications': { active: 'text-yellow-600', activeBg: 'bg-yellow-600 text-white shadow-md', inactive: 'text-yellow-400', inactiveBg: 'bg-yellow-400 text-white shadow-md', bg: 'bg-yellow-50' },
  '/student/leaderboard': { active: 'text-yellow-600', activeBg: 'bg-yellow-600 text-white shadow-md', inactive: 'text-yellow-400', inactiveBg: 'bg-yellow-400 text-white shadow-md', bg: 'bg-yellow-50' },

  // === SLATE: PROFILE & CONFIGURATION / UTILITIES ===
  '/super-admin/settings': { active: 'text-slate-600', activeBg: 'bg-slate-600 text-white shadow-md', inactive: 'text-slate-400', inactiveBg: 'bg-slate-400 text-white shadow-md', bg: 'bg-slate-50' },
  '/admin/settings': { active: 'text-slate-600', activeBg: 'bg-slate-600 text-white shadow-md', inactive: 'text-slate-400', inactiveBg: 'bg-slate-400 text-white shadow-md', bg: 'bg-slate-50' },
  '/teacher/profile': { active: 'text-slate-600', activeBg: 'bg-slate-600 text-white shadow-md', inactive: 'text-slate-400', inactiveBg: 'bg-slate-400 text-white shadow-md', bg: 'bg-slate-50' },
  '/student/profile': { active: 'text-slate-600', activeBg: 'bg-slate-600 text-white shadow-md', inactive: 'text-slate-400', inactiveBg: 'bg-slate-400 text-white shadow-md', bg: 'bg-slate-50' },

  // === PINK: ARTIFICIAL INTELLIGENCE ===
  '/super-admin/ai-usage': { active: 'text-pink-600', activeBg: 'bg-pink-600 text-white shadow-md', inactive: 'text-pink-400', inactiveBg: 'bg-pink-400 text-white shadow-md', bg: 'bg-pink-50' },
  '/teacher/ai-tools': { active: 'text-pink-600', activeBg: 'bg-pink-600 text-white shadow-md', inactive: 'text-pink-400', inactiveBg: 'bg-pink-400 text-white shadow-md', bg: 'bg-pink-50' },

  // === CYAN: SYSTEM INFRASTRUCTURE / THREAT CONTROL ===
  '/super-admin/security': { active: 'text-cyan-600', activeBg: 'bg-cyan-600 text-white shadow-md', inactive: 'text-cyan-400', inactiveBg: 'bg-cyan-400 text-white shadow-md', bg: 'bg-cyan-50' },
};
export const DEFAULT_NAV_COLOR: NavColor = { active: 'text-indigo-600', activeBg: 'bg-indigo-600 text-white shadow-md', inactive: 'text-indigo-300', inactiveBg: 'bg-indigo-300 text-white shadow-md', bg: 'bg-indigo-50' };
