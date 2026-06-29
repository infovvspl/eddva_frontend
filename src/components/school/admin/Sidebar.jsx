import React, { useState } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { UnifiedSidebar, SidebarProfileCard } from '@/components/layout/UnifiedSidebar';
import { EddvaLogo } from './Brand';
import { isModuleEnabled } from '@/lib/constants/moduleFeatures';
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
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  MessageSquareWarning,
  Settings as SettingsIcon,
  Shield,
  Sparkles,
  Ticket,
  ToggleRight,
  Users,
  Video,
} from 'lucide-react';

const superAdminGroups = [
  {
    heading: 'Overview',
    items: [
      { path: '/school/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/school/admin/institutes', label: 'Schools', icon: Building2 },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/admin/communication', label: 'Communication', icon: Megaphone },
      { path: '/school/admin/complaints', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { path: '/school/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/school/admin/ai-usage', label: 'AI Usage', icon: Sparkles },
    ],
  },
  {
    heading: 'Governance',
    items: [
      { path: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { path: '/school/admin/security', label: 'Security Center', icon: Shield },
      { path: '/school/admin/settings', label: 'Settings', icon: SettingsIcon },
      { path: '/school/admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
      { action: 'logout', label: 'Logout', icon: LogOut, path: '' },
    ],
  },
];

function buildInstituteGroups(mods) {
  const chatEnabled = isModuleEnabled(mods, 'chat');
  const liveEnabled = isModuleEnabled(mods, 'live_classes');
  const calendarEnabled = isModuleEnabled(mods, 'academic_calendar');
  const timetableEnabled = isModuleEnabled(mods, 'timetable');
  const reportsEnabled = isModuleEnabled(mods, 'reports');
  const meetingsEnabled = isModuleEnabled(mods, 'meetings');

  return [
    {
      heading: 'Academics',
      items: [
        { path: '/school/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { path: '/school/admin/students', label: 'Students', icon: GraduationCap },
        { path: '/school/admin/teachers', label: 'Teachers', icon: Users },
        { path: '/school/admin/academics', label: 'Classes & Curriculum', icon: Building2 },
        { path: '/school/admin/subjects', label: 'Subjects', icon: BookOpen },
      ],
    },
    {
      heading: 'Operations',
      items: [
        { path: '/school/admin/attendance', label: 'Attendance', icon: BarChart3 },
        timetableEnabled && { path: '/school/admin/timetable', label: liveEnabled ? 'Timetable & Live Classes' : 'Timetable', icon: CalendarDays },
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
    {
      heading: 'Administration',
      items: [
        { path: '/school/admin/users', label: 'User Management', icon: Users },
        { path: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
        { path: '/school/admin/complaints', label: 'Support Tickets', icon: Shield },
      ],
    },
  ];
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

  return [
    {
      heading: 'Teaching',
      items: [
        { path: '/school/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { path: '/school/teacher/course-content', label: 'Course Content', icon: BookOpen },
        liveEnabled && { path: '/school/teacher/classes', label: 'My Schedule', icon: Video },
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
        { path: '/school/teacher/grievances', label: 'Grievances', icon: MessageSquareWarning },
      ],
    },
  ];
}

export default function Sidebar({ open, onClose }) {
  const { user, institute, logout } = useAuth();
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  
  const aiFeats = institute?.aiEnabled ? institute.aiFeatures : { ai_doubt_solver: false };
  const teacherGroups = isTeacher ? buildTeacherGroups(institute?.modulesPermissions, aiFeats) : null;
  const adminGroups = isInstitute ? buildInstituteGroups(institute?.modulesPermissions) : null;
  
  const groups = isTeacher ? teacherGroups : isInstitute ? adminGroups : superAdminGroups;
  const [collapsed, setCollapsed] = useState(false);
  const roleLabel = isTeacher ? 'Teacher Workspace' : isInstitute ? 'Institute Admin' : 'Super Admin';
  const workspaceName = isTeacher ? user?.name || 'Teacher' : isInstitute ? institute?.name || 'Institute' : 'EDDVA HQ';

  const handleAction = (action) => {
    if (action === 'logout') {
      onClose?.();
      logout();
    }
  };

  return (
    <UnifiedSidebar
      groups={groups}
      collapsed={collapsed}
      onToggleCollapse={() => setCollapsed((v) => !v)}
      mobileOpen={open}
      onMobileClose={onClose}
      logo={<EddvaLogo />}
      onNavClick={() => onClose?.()}
      onAction={handleAction}
      profileCard={(isCollapsed) => (
        isInstitute || isTeacher ? (
          <SidebarProfileCard
            collapsed={isCollapsed}
            avatar={
              <ProfileAvatar
                src={user?.profileImage ?? null}
                name={user?.name}
                className={`h-full w-full rounded-xl ${isTeacher ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'}`}
                fallbackClassName={`text-xs font-bold tracking-tight ${isTeacher ? 'text-emerald-700' : 'text-blue-700'}`}
              />
            }
            name={workspaceName}
            roleLabel={roleLabel}
          />
        ) : (
          <div className="rounded-xl bg-blue-50 p-3 dark:bg-slate-900">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Super Admin</p>
          </div>
        )
      )}
    />
  );
}
