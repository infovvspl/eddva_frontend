import {
  AlertCircle, BarChart3, BookOpen, Building2, CalendarDays, FileText,
  GraduationCap, MessageSquare, Shield, Trophy, Users,
} from 'lucide-react';

// Grantable admin-panel module keys — keep in sync by hand with
// eddva_backend/src/modules/school/common/admin-permission-modules.ts.
// "Dashboard" is always visible and not gated; "Administrators" is
// deliberately excluded — managing admin access is permanently
// primary-admin/SUPER_ADMIN-only, never delegable.
export const ADMIN_PERMISSION_MODULES = [
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'teachers', label: 'Teachers', icon: Users },
  { key: 'academics', label: 'Class & Sections', icon: Building2 },
  { key: 'subjects', label: 'Subjects', icon: BookOpen },
  { key: 'competitive_exam_prep', label: 'Competitive Exam Prep', icon: Trophy },
  { key: 'syllabus_planner', label: 'Syllabus Planner', icon: FileText },
  { key: 'syllabus_tracker', label: 'Syllabus Tracker', icon: BarChart3 },
  { key: 'attendance', label: 'Attendance', icon: BarChart3 },
  { key: 'timetable', label: 'Timetable and Roster', icon: CalendarDays },
  { key: 'academic_calendar', label: 'Academic Calendar', icon: CalendarDays },
  { key: 'notices', label: 'Notices & Announcements', icon: AlertCircle },
  { key: 'communications', label: 'Messages & Parent Connect', icon: MessageSquare },
  { key: 'erp', label: 'ERP Dashboard', icon: BarChart3 },
  { key: 'user_management', label: 'User Management', icon: Users },
  { key: 'document_generator', label: 'Document Generator', icon: FileText },
  { key: 'audit_logs', label: 'Audit Logs', icon: FileText },
  { key: 'complaints', label: 'Support Tickets', icon: Shield },
];

export const ADMIN_PERMISSION_MODULE_KEYS = ADMIN_PERMISSION_MODULES.map((m) => m.key);

export function adminModuleLabel(key) {
  return ADMIN_PERMISSION_MODULES.find((m) => m.key === key)?.label || key;
}
