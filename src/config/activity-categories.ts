import type { AppActivityCategory } from "@/lib/api/app-activity";

/**
 * Routes that run their own, more precise tracker directly on the page —
 * real video-playing state (RecordedClassDetails.jsx, StudentLivePlayer.tsx)
 * or a generous reading-idle allowance (MaterialViewPage.tsx) — instead of
 * the generic route-driven one below. Matched before the prefix rules so the
 * central Layout-level tracker stays disabled here and never double-counts
 * alongside them.
 */
const SELF_TRACKED_ROUTES: RegExp[] = [
  /^\/school\/student\/live-classes\/[^/]+\/recording$/,
  /^\/school\/student\/recorded-classes\/[^/]+$/,
  /^\/school\/student\/live\/[^/]+\/watch$/,
  /^\/school\/student\/study-materials\/[^/]+$/,
];

/**
 * Route prefix -> page category, for the app-wide activity tracker
 * (use-app-activity-tracker.ts). `null` means "tracked elsewhere, don't
 * double-count here" — currently only the AI Study Plan (`/planner`, and its
 * old redirect routes `/ai-study`, `/ai-tutor`, `/quiz`), which already runs
 * its own heartbeat via use-activity-tracker.ts on its own pages.
 *
 * Longest matching prefix wins, so order in this list doesn't matter.
 */
const ROUTE_CATEGORY_RULES: ReadonlyArray<{ prefix: string; category: AppActivityCategory | null }> = [
  { prefix: "/school/student/planner", category: null },
  { prefix: "/school/student/ai-study", category: null },
  { prefix: "/school/student/ai-tutor", category: null },
  { prefix: "/school/student/quiz", category: null },

  { prefix: "/school/student/game-zone", category: "games" },
  { prefix: "/school/student/gamification", category: "games" },

  { prefix: "/school/student/battle-arena", category: "battle_arena" },

  { prefix: "/school/student/study-materials", category: "study_materials" },

  { prefix: "/school/student/assignments", category: "assignments" },

  { prefix: "/school/student/assessments", category: "assessments_other" },
  { prefix: "/school/student/competitive-prep", category: "assessments_other" },

  { prefix: "/school/student/doubts", category: "doubts" },

  { prefix: "/school/student/career", category: "career" },
  { prefix: "/school/student/astro-profile", category: "career" },

  { prefix: "/school/student/live-classes", category: "video_lectures" },
  { prefix: "/school/student/live", category: "video_lectures" },
  { prefix: "/school/student/recorded-classes", category: "video_lectures" },
  { prefix: "/school/student/classes", category: "video_lectures" },
];

/** Everything else under the student portal (dashboard, profile, settings, fees,
 *  attendance, calendar, timetable, announcements, syllabus, notifications, chat)
 *  has no genuine-action ground truth to verify against — reported as plain
 *  navigation time, not scored as "engagement". */
const FALLBACK_CATEGORY: AppActivityCategory = "nav";

export function resolveActivityCategory(pathname: string): AppActivityCategory | null {
  if (SELF_TRACKED_ROUTES.some((re) => re.test(pathname))) return null;
  let best: { prefix: string; category: AppActivityCategory | null } | null = null;
  for (const rule of ROUTE_CATEGORY_RULES) {
    const matches = pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`);
    if (matches && (!best || rule.prefix.length > best.prefix.length)) best = rule;
  }
  if (best) return best.category;
  return pathname.startsWith("/school/student") ? FALLBACK_CATEGORY : null;
}

/**
 * Per-category idle allowance overrides for the generic, route-driven
 * tracker. Assignments are the odd one out: a student reading a question on
 * screen and writing the answer on paper produces little or no mouse/keyboard
 * activity, which must not be scored as idle the way it would be on a
 * dashboard or leaderboard page.
 */
const CATEGORY_IDLE_MS: Partial<Record<AppActivityCategory, number>> = {
  assignments: 5 * 60 * 1000,
};

export function resolveActivityIdleMs(category: AppActivityCategory | null): number | undefined {
  return category ? CATEGORY_IDLE_MS[category] : undefined;
}
