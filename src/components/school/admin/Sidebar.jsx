import React, { useState } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { UnifiedSidebar, SidebarProfileCard } from '@/components/layout/UnifiedSidebar';
import { EddvaLogo } from './Brand';
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
  Heart,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  MessageSquareWarning,
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
      { path: '/super-admin/teachers', label: 'Teachers', icon: GraduationCap },
      { path: '/super-admin/students', label: 'Students', icon: Users },
      { path: '/super-admin/parents', label: 'Parents', icon: Heart },
      { path: '/school/admin/complaints', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/super-admin/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/school/admin/communication', label: 'Communication', icon: Megaphone },
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
      { path: '/super-admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
      { path: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { path: '/school/admin/security', label: 'Security Center', icon: Shield },
      { action: 'logout', label: 'Logout', icon: LogOut, path: '' },
    ],
  },
];

const instituteGroups = [
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
      { path: '/school/admin/timetable', label: 'Timetable & Live Classes', icon: CalendarDays },
      { path: '/school/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/admin/notices', label: 'Notices & Announcements', icon: AlertCircle },
      { path: '/school/admin/communications', label: 'Messages & Parent Connect', icon: MessageSquare },
    ],
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

const teacherGroups = [
  {
    heading: 'Teaching',
    items: [
      { path: '/school/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/school/teacher/course-content', label: 'Course Content', icon: BookOpen },
      { path: '/school/teacher/classes', label: 'My Schedule', icon: Video },
      { path: '/school/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
      { path: '/school/teacher/timetable', label: 'Timetable', icon: CalendarDays },
      { path: '/school/teacher/calendar', label: 'Academic Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Evaluation',
    items: [
      { path: '/school/teacher/doubts', label: 'Student Doubts', icon: MessageSquare },
      { path: '/school/teacher/assignments', label: 'Assignments', icon: FileText },
      { path: '/school/teacher/assessments', label: 'Assessments', icon: ClipboardList },
      { path: '/school/teacher/meetings', label: 'Meetings', icon: CalendarDays },
      { path: '/school/teacher/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/teacher/announcements', label: 'Announcements', icon: Megaphone },
      { path: '/school/teacher/chat', label: 'Chat', icon: MessageSquare },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { path: '/school/teacher/grievances', label: 'Grievances', icon: MessageSquareWarning },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, institute, logout } = useAuth();
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const groups = isTeacher ? teacherGroups : isInstitute ? instituteGroups : superAdminGroups;
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
