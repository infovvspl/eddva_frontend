import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { EddvaLogo, InstituteLogo, SchoolLogo } from './Brand';
import { isModuleEnabled } from '@/lib/constants/moduleFeatures';
import vvsplLogo from '@/assets/vvspl_logo.png';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  Library,
  LogOut,
  Megaphone,
  MessageSquare,
  MessageSquareWarning,
  CalendarClock,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Ticket,
  ToggleRight,
  Trophy,
  UserCheck,
  Users,
  Video,
  Radio,
} from 'lucide-react';

const superAdminGroups = [
  {
    heading: 'Overview',
    items: [
      { path: '/school/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/school/super-admin/institutes', label: 'Schools', icon: Building2 },
      { path: '/school/super-admin/users', label: 'User Management', icon: Users },
      { path: '/school/super-admin/erp-modules', label: 'ERP Modules', icon: BookOpen },
      { path: '/school/super-admin/competitive-prep', label: 'Competitive Exam Prep', icon: Trophy },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/super-admin/communication', label: 'Communication', icon: Megaphone },
      { path: '/school/super-admin/complaints', label: 'Support Tickets', icon: Ticket },
      { path: '/school/super-admin/grievances', label: 'Grievances', icon: MessageSquareWarning },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { path: '/school/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/school/super-admin/ai-usage', label: 'AI Usage', icon: Sparkles },
      { path: '/school/super-admin/live-usage', label: 'Live Classes', icon: Radio },
      { path: '/school/super-admin/storage', label: 'Storage Usage', icon: HardDrive },
    ],
  },
  {
    heading: 'Governance',
    items: [
      { path: '/school/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { path: '/school/super-admin/security', label: 'Security Center', icon: Shield },
      { path: '/school/super-admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
      { action: 'logout', label: 'Logout', icon: LogOut, path: '' },
    ],
  },
];

// Maps each admin nav item's path to the grantable module key that gates it —
// kept in sync by hand with eddva_frontend/src/lib/constants/adminPermissionModules.ts
// and the backend's admin-permission-modules.ts. Paths not listed here (e.g.
// Dashboard, Administrators) are never restricted by a scoped admin's permissions.
const ADMIN_NAV_PATH_TO_MODULE = {
  '/school/admin/students': 'students',
  '/school/admin/teachers': 'teachers',
  '/school/admin/academics': 'academics',
  '/school/admin/subjects': 'subjects',
  '/school/admin/competitive-subjects': 'competitive_exam_prep',
  '/school/admin/syllabus-planner': 'syllabus_planner',
  '/school/admin/syllabus-tracker': 'syllabus_tracker',
  '/school/admin/attendance': 'attendance',
  '/school/admin/attendance-entry': 'attendance',
  '/school/admin/teacher-attendance': 'attendance',
  '/school/admin/timetable': 'timetable',
  '/school/admin/calendar': 'academic_calendar',
  '/school/admin/notices': 'notices',
  '/school/admin/communications': 'communications',
  '/school/admin/erp': 'erp',
  '/school/admin/users': 'user_management',
  '/school/admin/document-generator': 'document_generator',
  '/school/admin/audit-logs': 'audit_logs',
  '/school/admin/complaints': 'complaints',
};

function filterByAdminPermissions(groups, isPrimaryAdmin, adminPermissions) {
  if (isPrimaryAdmin) return groups;
  const granted = Array.isArray(adminPermissions) ? adminPermissions : [];
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const moduleKey = ADMIN_NAV_PATH_TO_MODULE[item.path];
        if (!moduleKey) return true; // ungated items (Dashboard, Administrators) always show
        return granted.includes(moduleKey);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

function buildInstituteGroups(mods, aiFeats) {
  const chatEnabled = isModuleEnabled(mods, 'chat');
  const calendarEnabled = isModuleEnabled(mods, 'academic_calendar');
  const timetableEnabled = isModuleEnabled(mods, 'timetable');
  const reportsEnabled = isModuleEnabled(mods, 'reports');
  const meetingsEnabled = isModuleEnabled(mods, 'meetings');
  const syllabusPlannerEnabled = isModuleEnabled(mods, 'syllabus') && isModuleEnabled(mods, 'admin_syllabus_planner');
  const syllabusTrackerEnabled = isModuleEnabled(mods, 'syllabus') && isModuleEnabled(mods, 'admin_syllabus_tracker');
  // competitive_exams lives in the AI-features registry (aiEnabled + per-key
  // aiFeatures), not the module-flags one — the whole vertical is AI-driven.
  const competitiveEnabled = aiFeats?.competitive_exams === true;

  return [
    {
      heading: 'Academics',
      items: [
        { path: '/school/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { path: '/school/admin/students', label: 'Students', icon: GraduationCap },
        { path: '/school/admin/teachers', label: 'Teachers', icon: Users },
        { path: '/school/admin/admins', label: 'Administrators', icon: Shield },
        { path: '/school/admin/academics', label: 'Class & Sections', icon: Building2 },
        { path: '/school/admin/subjects', label: 'Subjects', icon: BookOpen },
        competitiveEnabled && { path: '/school/admin/competitive-subjects', label: 'Competitive Exam Prep', icon: Trophy },
        syllabusPlannerEnabled && { path: '/school/admin/syllabus-planner', label: 'Lesson Planner', icon: FileText },
        syllabusTrackerEnabled && { path: '/school/admin/syllabus-tracker', label: 'Lesson Tracker', icon: BarChart3 },
      ].filter(Boolean),
    },
    {
      heading: 'Operations',
      items: [
        { path: '/school/admin/attendance', label: 'Attendance', icon: BarChart3 },
        { path: '/school/admin/attendance-entry', label: 'Mark Attendance', icon: ClipboardCheck },
        { path: '/school/admin/teacher-attendance', label: 'Teacher Attendance', icon: UserCheck },
        timetableEnabled && { path: '/school/admin/timetable', label: 'Timetable and Roster', icon: CalendarDays },
        calendarEnabled && { path: '/school/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
      ].filter(Boolean),
    },
    {
      heading: 'Communication',
      items: [
        { path: '/school/admin/notices', label: 'Notices & Announcements', icon: AlertCircle },
        chatEnabled && { path: '/school/admin/communications', label: 'Messages & Parent Connect', icon: MessageSquare },
      ].filter(Boolean),
    },
    // {
    //   heading: 'Insights',
    //   items: [
    //     { path: '/school/admin/ai-usage', label: 'AI Analytics', icon: Sparkles },
    //   ],
    // },
    {
      heading: 'Administration',
      items: [
        { path: '/school/admin/users', label: 'User Management', icon: Users },
        { path: '/school/admin/document-generator', label: 'Document Generator', icon: FileText },
        { path: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
        { path: '/school/admin/complaints', label: 'Support Tickets', icon: Shield },
        { path: '/school/admin/grievances', label: 'Grievances', icon: MessageSquareWarning },
      ],
    },
  ].filter(group => group.items && group.items.length > 0);
}

function buildTeacherGroups(mods, aiFeats) {
  const liveEnabled = isModuleEnabled(mods, 'live_classes');
  const assessmentsEnabled = isModuleEnabled(mods, 'assessments');
  const assignmentsEnabled = isModuleEnabled(mods, 'assignments');
  const chatEnabled = isModuleEnabled(mods, 'chat');
  const calendarEnabled = isModuleEnabled(mods, 'academic_calendar');
  const timetableEnabled = isModuleEnabled(mods, 'timetable');
  const reportsEnabled = isModuleEnabled(mods, 'reports');
  const meetingsEnabled = isModuleEnabled(mods, 'meetings');
  const doubtsEnabled = aiFeats?.ai_doubt_solver !== false;
  const teachingPlanEnabled = isModuleEnabled(mods, 'syllabus') && isModuleEnabled(mods, 'teacher_teaching_plan');
  const competitiveEnabled = aiFeats?.competitive_exams === true;

  return [
    {
      heading: 'Teaching',
      items: [
        { path: '/school/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
        teachingPlanEnabled && { path: '/school/teacher/teaching-plan', label: 'My Lesson Plan', icon: ClipboardList },
        { path: '/school/teacher/course-content', label: 'Course Content', icon: BookOpen },
        liveEnabled && { path: '/school/teacher/classes', label: 'Live & Recorded Video', icon: Video },
        competitiveEnabled && { path: '/school/teacher/competitive-prep', label: 'Competitive Exam Prep', icon: Trophy },
        { path: '/school/teacher/students', label: 'Students', icon: GraduationCap },
        { path: '/school/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
        timetableEnabled && { path: '/school/teacher/timetable', label: 'Timetable', icon: CalendarDays },
        calendarEnabled && { path: '/school/teacher/calendar', label: 'Academic Calendar', icon: CalendarDays },
      ].filter(Boolean),
    },
    {
      heading: 'Evaluation',
      items: [
        doubtsEnabled && { path: '/school/teacher/doubts', label: 'Student Doubts', icon: MessageSquare },
        assignmentsEnabled && { path: '/school/teacher/assignments', label: 'Assignments', icon: FileText },
        assessmentsEnabled && { path: '/school/teacher/assessments', label: 'Assessments', icon: ClipboardList },
        meetingsEnabled && { path: '/school/teacher/meetings', label: 'Meetings', icon: CalendarDays },
        reportsEnabled && { path: '/school/teacher/reports', label: 'Reports', icon: BarChart3 },
      ].filter(Boolean),
    },
    {
      heading: 'Communication',
      items: [
        { path: '/school/teacher/announcements', label: 'Announcements', icon: Megaphone },
        chatEnabled && { path: '/school/teacher/chat', label: 'Chat', icon: MessageSquare },
      ].filter(Boolean),
    },
    {
      heading: 'Tools',
      items: [
        { path: '/school/teacher/leave', label: 'My Leave', icon: CalendarClock },
        { path: '/school/teacher/grievances', label: 'Grievances', icon: MessageSquareWarning },
      ],
    },
  ];
}

export default function Sidebar({ open, onClose }) {
  const { user, institute, logout } = useAuth();
  const location = useLocation();
  const rawRole = String(user?.rawRole || user?.role || '')
    .toUpperCase()
    .trim();
  const hasSuperAdminRole = rawRole.includes('SUPER_ADMIN') || rawRole.includes('SUPER ADMIN');
  const hasInstituteAdminRole = !hasSuperAdminRole && (
    rawRole.includes('INSTITUTE_ADMIN') ||
    rawRole.includes('INSTITUTE ADMIN') ||
    /\bADMIN\b/.test(rawRole)
  );
  const hasTeacherRole = rawRole.includes('TEACHER');
  const isAdminPath = location.pathname.startsWith('/school/admin');
  const isTeacherPath = location.pathname.startsWith('/school/teacher');
  const isInstitute = user?.role === 'INSTITUTE_ADMIN' || (isAdminPath && hasInstituteAdminRole);
  const isTeacher = !isInstitute && (user?.role === 'TEACHER' || (isTeacherPath && hasTeacherRole));
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || hasSuperAdminRole;
  const useTeacherFallback = !isSuperAdmin && !isInstitute;

  const aiFeats = institute?.aiEnabled ? institute.aiFeatures : { ai_doubt_solver: false };
  const teacherGroups = isTeacher || useTeacherFallback ? buildTeacherGroups(institute?.modulesPermissions, aiFeats) : null;
  const adminGroups = isInstitute
    ? filterByAdminPermissions(buildInstituteGroups(institute?.modulesPermissions, aiFeats), user?.isPrimaryAdmin, user?.adminPermissions)
    : null;

  const groups = isSuperAdmin ? superAdminGroups : isInstitute ? adminGroups : teacherGroups;
  // Open by default; the toggle collapses it to the icon rail.
  const [collapsed, setCollapsed] = useState(false);

  const handleAction = (action) => {
    if (action === 'logout') {
      onClose?.();
      logout();
    }
  };

  return (
    <UnifiedSidebar
      groups={groups}
      activeStyle="dark"
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed((v) => !v)}
      mobileOpen={open}
      onMobileClose={onClose}
      logo={
        !isSuperAdmin ? (
          <SchoolLogo src={institute?.logo} alt={institute?.name} size="navbar" className="h-10 w-auto max-w-full object-contain" />
        ) : (
          <EddvaLogo className="h-8" />
        )
      }
      logoCollapsed={
        !isSuperAdmin ? (
          <div className="flex items-center justify-center p-2">
            <SchoolLogo src={institute?.logo} alt={institute?.name} size="navbar" className="h-9 w-auto max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex items-center justify-center p-2">
            <EddvaLogo compact />
          </div>
        )
      }
      onNavClick={() => onClose?.()}
      onAction={handleAction}
    />
  );
}

