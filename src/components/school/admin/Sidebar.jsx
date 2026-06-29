import React, { useState } from 'react';
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
  ChevronDown,
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
      { path: '/school/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { path: '/school/super-admin/institutes', label: 'Schools', icon: Building2 },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { path: '/school/super-admin/communication', label: 'Communication', icon: Megaphone },
      { path: '/school/super-admin/complaints', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { path: '/school/super-admin/analytics', label: 'Analytics', icon: BarChart3 },
      { path: '/school/super-admin/ai-usage', label: 'AI Usage', icon: Sparkles },
    ],
  },
  {
    heading: 'Governance',
    items: [
      { path: '/school/super-admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { path: '/school/super-admin/security', label: 'Security Center', icon: Shield },
      { path: '/school/super-admin/settings', label: 'Settings', icon: SettingsIcon },
      { path: '/school/super-admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
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
      logo={
        isInstitute || isTeacher ? (
          <div className="flex flex-row items-center gap-3 w-full px-4 pt-4 pb-1 text-left">
            <SchoolLogo src={institute?.logo} alt={institute?.name} size="navbar" className="w-[42px] h-[42px] shrink-0" />
            <div className="flex flex-col min-w-0">
              <h2 className="text-xs font-black tracking-tight text-slate-800 dark:text-white uppercase leading-tight line-clamp-2">
                {institute?.name || 'Army Public School'}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 truncate">
                {institute?.location || 'Happy Valley'}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-2 pt-2">
            <EddvaLogo />
          </div>
        )
      }
      logoCollapsed={
        isInstitute || isTeacher ? (
          <div className="flex items-center justify-center p-2">
            <SchoolLogo src={institute?.logo} alt={institute?.name} size="navbar" className="w-[36px] max-h-[36px]" />
          </div>
        ) : (
          <div className="flex items-center justify-center p-2">
            <EddvaLogo compact />
          </div>
        )
      }
      onNavClick={() => onClose?.()}
      onAction={handleAction}
      profileCard={(isCollapsed) => (
        isInstitute || isTeacher ? (
          <div className={cn(
            "transition-all duration-300 rounded-t-[1.5rem] bg-gradient-to-r from-blue-700 to-blue-600 dark:from-slate-900 dark:to-slate-850 text-white p-4 -m-3 border-t border-blue-500/20 dark:border-slate-800",
            isCollapsed ? "flex justify-center rounded-[1rem] p-2 m-0 bg-blue-700 dark:bg-slate-900" : "flex items-center justify-between"
          )}>
            {isCollapsed ? (
              <div className="h-8 w-8 rounded-full bg-white/20 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-white dark:bg-slate-850 text-blue-700 dark:text-blue-400 flex items-center justify-center font-extrabold text-sm border border-blue-200 dark:border-slate-700 shadow-sm">
                    {(user?.name || 'A').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold leading-tight truncate text-white max-w-[130px]">{institute?.name || 'Army Public School'}</p>
                    <p className="text-[9px] font-semibold text-blue-200 dark:text-slate-400 mt-0.5">{roleLabel}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-blue-200 dark:text-slate-450 shrink-0" />
              </div>
            )}
          </div>
        ) : (
          isCollapsed ? (
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-50 text-blue-700 dark:bg-slate-900 dark:text-blue-300 font-black text-[10px] select-none" title="Super Admin">
              SA
            </div>
          ) : (
            <div className="rounded-xl bg-blue-50 p-3 dark:bg-slate-900 w-full text-center">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Super Admin</p>
            </div>
          )
        )
      )}
    />
  );
}
