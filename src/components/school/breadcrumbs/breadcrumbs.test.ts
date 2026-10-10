import { describe, expect, it } from 'vitest';
import { buildTrail, isTrailHidden } from './trail';
import { ADMIN_PORTAL, SUPER_ADMIN_PORTAL, TEACHER_PORTAL, buildStudentCrumbs, isBreadcrumbHidden, portalForPath } from './portals';
import { isNavItemActive } from '@/components/layout/nav-active';

const student = (path: string, qs = '', override?: string) =>
  buildStudentCrumbs(path, new URLSearchParams(qs), override).map((c) => c.label);
const trail = (cfg: Parameters<typeof buildTrail>[0], path: string, override?: string) =>
  buildTrail(cfg, path, new URLSearchParams(), override).map((c) => c.label);

describe('student breadcrumbs', () => {
  it('builds Study Materials > subject > chapter > topic from the query string', () => {
    expect(student('/school/student/study-materials', 'subject=Computer Science&chapter=GIMP&topic=Advanced GIMP')).toEqual([
      'Dashboard', 'Study Materials', 'Computer Science', 'GIMP', 'Advanced GIMP',
    ]);
  });

  it('puts planner sub-pages under AI Study Planner', () => {
    expect(student('/school/student/quiz')).toEqual(['Dashboard', 'AI Study Planner', 'Quiz']);
    expect(student('/school/student/ai-study/42')).toEqual(['Dashboard', 'AI Study Planner', 'AI Study']);
  });

  it('skips URL plumbing segments and honours a page-provided label', () => {
    expect(student('/school/student/classes/7/topics/9', '', 'Fractions')).toEqual([
      'Dashboard', 'Classes', 'Course', 'Fractions',
    ]);
  });

  it('only the current crumb has no link', () => {
    const crumbs = buildStudentCrumbs('/school/student/assignments', new URLSearchParams());
    expect(crumbs.map((c) => !!c.to)).toEqual([true, false]);
  });

  it('hides the bar on the dashboard and full-screen routes', () => {
    expect(isBreadcrumbHidden('/school/student')).toBe(true);
    expect(isBreadcrumbHidden('/school/student/assessments/3/take')).toBe(true);
    expect(isBreadcrumbHidden('/school/student/analytics')).toBe(false);
  });
});

describe('admin / teacher / super-admin breadcrumbs', () => {
  it('admin multi-level pages', () => {
    expect(trail(ADMIN_PORTAL, '/school/admin/students/12/edit')).toEqual(['Dashboard', 'Students', 'Student', 'Edit']);
    expect(trail(ADMIN_PORTAL, '/school/admin/students/new')).toEqual(['Dashboard', 'Students', 'New Student']);
    expect(trail(ADMIN_PORTAL, '/school/admin/academics/3/sections')).toEqual(['Dashboard', 'Class & Sections', 'Class', 'Sections']);
  });

  it('teacher pages, with the materials list folded into Course Content', () => {
    expect(trail(TEACHER_PORTAL, '/school/teacher/course-content/materials/5', 'Cell Biology')).toEqual(['Dashboard', 'Course Content', 'Cell Biology']);
    expect(trail(TEACHER_PORTAL, '/school/teacher/assessments/9/submissions/4/review')).toEqual(['Dashboard', 'Assessments', 'Assessment', 'Submissions', 'Student', 'Review']);
    expect(isTrailHidden(TEACHER_PORTAL, '/school/teacher/live/3/studio')).toBe(true);
  });

  it('super admin', () => {
    expect(trail(SUPER_ADMIN_PORTAL, '/school/super-admin/institutes/abc/edit')).toEqual(['Dashboard', 'Schools', 'School', 'Edit']);
  });

  it('picks the portal from the path', () => {
    expect(portalForPath('/school/admin/users')).toBe(ADMIN_PORTAL);
    expect(portalForPath('/school/teacher')).toBe(TEACHER_PORTAL);
    expect(portalForPath('/school/administrators')).toBeUndefined();
  });
});

describe('sidebar active matching', () => {
  const planner = { path: '/school/student/planner', matchPaths: ['/school/student/ai-study', '/school/student/quiz'] };
  it('highlights the owning module for related routes', () => {
    expect(isNavItemActive('/school/student/ai-study/5', planner)).toBe(true);
    expect(isNavItemActive('/school/student/quiz', planner)).toBe(true);
    expect(isNavItemActive('/school/student/planner-x', planner)).toBe(false);
  });
  it('dashboard is exact-only', () => {
    expect(isNavItemActive('/school/student/analytics', { path: '/school/student', end: true })).toBe(false);
  });
  it('uses route aliases for pages without their own menu item', () => {
    expect(isNavItemActive('/school/teacher/live/3/dashboard', { path: '/school/teacher/classes' })).toBe(true);
    expect(isNavItemActive('/school/admin/student-promotion', { path: '/school/admin/students' })).toBe(true);
    expect(isNavItemActive('/school/admin/student-promotion', { path: '/school/admin/teachers' })).toBe(false);
  });
});
