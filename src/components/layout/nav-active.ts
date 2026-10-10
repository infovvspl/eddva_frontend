/**
 * Decides whether a sidebar / bottom-nav item should be highlighted for the
 * current URL. Shared by every portal's desktop sidebar and mobile bottom bar
 * so they stay in sync when a user arrives through a card, a breadcrumb or a
 * deep link.
 *
 * - `end`        exact match only (e.g. the dashboard).
 * - `path`       the item itself and anything nested under it.
 * - `matchPaths` extra route prefixes that belong to the item even though they
 *                live outside its own path (e.g. a quiz opened from the planner).
 * - ROUTE_ALIASES the same idea for pages that have no menu entry of their own,
 *                declared once instead of on every nav item.
 */
export interface NavActiveTarget {
  path: string;
  end?: boolean;
  matchPaths?: string[];
}

/** Route prefix -> path of the menu item it should highlight. */
const ROUTE_ALIASES: Record<string, string> = {
  // Admin
  '/school/admin/student-promotion': '/school/admin/students',
  '/school/admin/roles': '/school/admin/users',
  '/school/admin/notifications': '/school/admin/notices',
  '/school/admin/announcements': '/school/admin/notices',
  '/school/admin/message-logs': '/school/admin/communications',
  '/school/admin/syllabus-analytics': '/school/admin/syllabus-tracker',
  '/school/admin/textbook-coverage': '/school/admin/subjects',
  // Teacher
  '/school/teacher/live': '/school/teacher/classes',
  '/school/teacher/recorded-classes': '/school/teacher/classes',
  '/school/teacher/topics': '/school/teacher/teaching-plan',
  '/school/teacher/lesson-plans': '/school/teacher/teaching-plan',
  '/school/teacher/syllabus-planner': '/school/teacher/teaching-plan',
  '/school/teacher/textbook-coverage': '/school/teacher/course-content',
};

const under = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export function isNavItemActive(pathname: string, item: NavActiveTarget): boolean {
  if (item.end) return pathname === item.path;
  if (under(pathname, item.path)) return true;
  if ((item.matchPaths ?? []).some((prefix) => under(pathname, prefix))) return true;
  return Object.entries(ROUTE_ALIASES).some(
    ([prefix, owner]) => owner === item.path && under(pathname, prefix),
  );
}
