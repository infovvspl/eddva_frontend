import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MessageSquareWarning,
  Presentation,
  Sparkles,
  Settings as SettingsIcon,
  Shield,
  Users,
  Video,
  Heart,
  Megaphone,
  Ticket,
  ToggleRight,
  X,
} from 'lucide-react';
import { cn } from './Skeleton';
import { EddvaLogo, InstituteLogo } from './Brand';
import { useAuth } from '@/context/SchoolAuthContext';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

const superAdminGroups = [
  {
    heading: 'Overview',
    items: [
      { to: '/school/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/school/admin/institutes', label: 'Schools', icon: Building2 },
      { to: '/school/admin/teachers', label: 'Teachers', icon: GraduationCap },
      { to: '/school/admin/students', label: 'Students', icon: Users },
      { to: '/school/admin/users?role=PARENT', label: 'Parents', icon: Heart },
      { to: '/school/admin/complaints', label: 'Support Tickets', icon: Ticket },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/school/admin/notices', label: 'Announcements', icon: Megaphone },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { to: '/school/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/school/admin/ai-usage', label: 'AI Usage', icon: Sparkles },
    ],
  },
  {
    heading: 'Governance',
    items: [
      { to: '/super-admin/feature-flags', label: 'Feature Flags', icon: ToggleRight },
      { to: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/school/admin/security', label: 'Security Center', icon: Shield },
      { action: 'logout', label: 'Logout', icon: LogOut },
    ],
  },
];

const instituteGroups = [
  {
    heading: 'Academics',
    items: [
      { to: '/school/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/school/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/school/admin/teachers', label: 'Teachers', icon: Users },
      { to: '/school/admin/academics', label: 'Classes & Curriculum', icon: Building2 },
      { to: '/school/admin/subjects', label: 'Subjects', icon: BookOpen },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/school/admin/attendance', label: 'Attendance', icon: BarChart3 },
      { to: '/school/admin/timetable', label: 'Timetable & Live Classes', icon: CalendarDays },
      { to: '/school/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/school/admin/notices', label: 'Notices & Announcements', icon: AlertCircle },
      { to: '/school/admin/communications', label: 'Messages & Parent Connect', icon: MessageSquare },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { to: '/school/admin/users', label: 'User Management', icon: Users },
      { to: '/school/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/school/admin/complaints', label: 'Support Tickets', icon: Shield },
    ],
  },
];

const teacherGroups = [
  {
    heading: 'Teaching',
    items: [
      { to: '/school/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },

      { to: '/school/teacher/course-content', label: 'Course Content', icon: BookOpen },
      { to: '/school/teacher/classes', label: 'My Schedule', icon: Video },
      { to: '/school/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/school/teacher/timetable', label: 'Timetable', icon: CalendarDays },
      { to: '/school/teacher/calendar', label: 'Academic Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Evaluation',
    items: [
      { to: '/school/teacher/doubts', label: 'Student Doubts', icon: MessageSquare },
      { to: '/school/teacher/assignments', label: 'Assignments', icon: FileText },
      { to: '/school/teacher/assessments', label: 'Assessments', icon: ClipboardList },
      { to: '/school/teacher/meetings', label: 'Meetings', icon: CalendarDays },
      { to: '/school/teacher/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { to: '/school/teacher/grievances', label: 'Grievances', icon: MessageSquareWarning },
      { to: '/school/teacher/chat', label: 'Chat', icon: MessageSquare },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, institute, logout } = useAuth();
  const isInstitute = user?.role === 'INSTITUTE_ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const groups = isTeacher ? teacherGroups : isInstitute ? instituteGroups : superAdminGroups;
  const [collapsed, setCollapsed] = useState(false);
  const canCollapse = true;
  const roleLabel = isTeacher ? 'Teacher Workspace' : isInstitute ? 'Institute Admin' : 'Super Admin';
  const workspaceName = isTeacher ? user?.name || 'Teacher' : isInstitute ? institute?.name || 'Institute' : 'EDDVA HQ';

  return (
    <>
      <aside
        className={cn(
          'flex flex-col fixed inset-y-0 left-0 z-50 w-64 xl:w-72 flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 md:sticky md:top-0 md:h-screen',
          collapsed && canCollapse ? 'md:w-20' : 'md:w-64 xl:md:w-72',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
            <div className={cn('min-w-0 transition-opacity', collapsed && canCollapse && 'md:opacity-0 md:pointer-events-none md:w-0 md:overflow-hidden')}>
              <Link to={isTeacher ? '/school/teacher' : '/school/admin'}>
                <EddvaLogo />
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {canCollapse && (
                <button
                  type="button"
                  onClick={() => setCollapsed((value) => !value)}
                  className="hidden rounded-xl p-2 text-surface-500 hover:bg-surface-100 md:inline-flex"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
                </button>
              )}
              <button onClick={onClose} className="rounded-xl p-2 text-surface-500 hover:bg-surface-100 md:hidden" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 custom-scrollbar">
            {groups.map((group) => (
                <div key={group.heading} className="mb-6">
                  <p
                    className={cn(
                      'mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest tracking-widest text-slate-400 dark:text-slate-500',
                      collapsed && canCollapse && 'md:hidden'
                    )}
                  >
                    {group.heading}
                  </p>
                  <nav className="space-y-1">
                    {group.items.map((item) =>
                      item.action === 'logout' ? (
                        <button
                          key={`${group.heading}-${item.label}`}
                          type="button"
                          onClick={() => {
                            onClose?.();
                            logout();
                          }}
                          title={collapsed && canCollapse ? item.label : undefined}
                          className={cn(
                            'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                          )}
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className={cn('truncate', collapsed && canCollapse && 'md:hidden')}>{item.label}</span>
                        </button>
                      ) : (
                        <NavLink
                          key={`${group.heading}-${item.label}`}
                          to={item.to}
                          end={item.end}
                          title={collapsed && canCollapse ? item.label : undefined}
                          onClick={onClose}
                          className={({ isActive }) =>
                            cn(
                              'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all',
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                            )
                          }
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0" />
                          <span className={cn('truncate', collapsed && canCollapse && 'md:hidden')}>{item.label}</span>
                        </NavLink>
                      )
                    )}
                  </nav>
                </div>
              ))}
          </div>

          <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800">
            {isInstitute || isTeacher ? (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',
                  collapsed && 'md:justify-center md:p-2'
                )}
              >
                <ProfileAvatar
                  src={user?.profileImage ?? null}
                  name={user?.name}
                  className={cn(
                    'h-10 w-10 shrink-0 rounded-xl',
                    isTeacher ? 'bg-emerald-50 border border-emerald-200' : 'bg-blue-50 border border-blue-200'
                  )}
                  fallbackClassName={cn(
                    'text-xs font-bold tracking-tight',
                    isTeacher ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'
                  )}
                />
                <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
                  <p className="truncate text-xs font-bold text-slate-950 dark:text-white">{workspaceName}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-emerald-600">{roleLabel}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-slate-900">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-label="Close menu overlay" />}
    </>
  );
}
