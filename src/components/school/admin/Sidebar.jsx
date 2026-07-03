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
            "transition-all duration-200 py-1 px-1 bg-transparent flex items-center justify-between group",
            isCollapsed ? "justify-center" : "w-full"
          )}>
            {isCollapsed ? (
              <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xs border border-blue-100 dark:border-blue-900/40 shadow-xs">
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-xs border border-blue-100 dark:border-blue-900/40 shrink-0 shadow-xs">
                    {(user?.name || 'A').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-[13px] font-extrabold leading-tight truncate text-blue-600 dark:text-blue-400 max-w-[140px]">
                      {institute?.name || user?.name || 'Army Public School'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {roleLabel}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 shrink-0 group-hover:text-blue-600 transition-colors" />
              </div>
            )}
          </div>
        ) : (
          isCollapsed ? (
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-blue-50 text-blue-600 dark:bg-slate-900 dark:text-blue-400 font-extrabold text-[10px] select-none" title="Super Admin">
              SA
            </div>
          ) : (
            <div className="py-1 px-1 w-full flex items-center justify-between">
              <p className="text-[13px] font-extrabold text-blue-600 dark:text-blue-400">Super Admin Console</p>
            </div>
          )
        )
      )}
    />
  );
}
