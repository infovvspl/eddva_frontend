// AttendanceEntry — gives admin the same class/section/period/subject ->
// roster -> mark present/absent -> submit flow teachers use, but reachable
// for any class in the institute (the backend's teacher_academic_assignments
// scoping already bypasses for admin/principal roles). Re-exports the
// teacher component as-is: it already fetches classes from the institute-wide
// /academic/classes endpoint (not a teacher-scoped list), so nothing in it is
// actually teacher-specific.
export { default } from '../teacher/AttendanceSystem';
