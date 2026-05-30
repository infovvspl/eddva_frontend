import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  AlertCircle,
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
  Wallet,
  Landmark,
  X,
} from 'lucide-react';
import { cn } from './Skeleton';
import { EddvaLogo, InstituteLogo } from './Brand';
import { useAuth } from '@/context/SchoolAuthContext';

const superAdminGroups = [
  {
    heading: 'Overview',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/institutes', label: 'Institutes', icon: Building2 },
      { to: '/admin/users', label: 'Registered Users', icon: Users },
      { to: '/admin/complaints', label: 'Tickets', icon: AlertCircle },
    ],
  },
  {
    heading: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/finance', label: 'Subscriptions', icon: Wallet },
      { to: '/admin/reports', label: 'Report & Analytics', icon: Sparkles },
    ],
  },
  {
    heading: 'Governance',
    items: [
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/admin/security', label: 'Security Center', icon: Shield },
      { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
      { action: 'logout', label: 'Logout', icon: LogOut },
    ],
  },
];

const instituteGroups = [
  {
    heading: 'Academics',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/students', label: 'Students', icon: GraduationCap },
      { to: '/admin/teachers', label: 'Teachers', icon: Users },
      { to: '/admin/academics', label: 'Classes & Curriculum', icon: Building2 },
      { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
      { to: '/admin/assignments', label: 'Assignments & Homework', icon: ClipboardList },
      { to: '/admin/study-materials', label: 'Study Materials', icon: BookOpen },
      { to: '/admin/syllabus', label: 'Syllabus Tracking', icon: GraduationCap },
    ],
  },
  {
    heading: 'Examinations',
    items: [
      { to: '/admin/exams', label: 'Exams', icon: FileText },
      { to: '/admin/question-bank', label: 'Question Bank', icon: ClipboardList },
      { to: '/admin/marks-entry', label: 'Marks Entry', icon: FileText },
      { to: '/admin/results', label: 'Results', icon: Sparkles },
      { to: '/admin/report-cards', label: 'Report Cards', icon: FileText },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { to: '/admin/attendance', label: 'Attendance', icon: BarChart3 },
      { to: '/admin/timetable', label: 'Timetable & Live Classes', icon: CalendarDays },
      { to: '/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { to: '/admin/fees', label: 'Fees Management', icon: Wallet },
      { to: '/admin/payment-collection', label: 'Payment Collection', icon: Landmark },
      { to: '/admin/payment-history', label: 'Payment History', icon: FileText },
      { to: '/admin/fee-defaulters', label: 'Fee Defaulters', icon: AlertCircle },
      { to: '/admin/finance', label: 'Finance & Analytics', icon: Landmark },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/admin/notices', label: 'Notices & Announcements', icon: AlertCircle },
      { to: '/admin/communications', label: 'Messages & Parent Connect', icon: MessageSquare },
      { to: '/admin/notifications-center', label: 'Notifications', icon: Bell },
      { to: '/admin/sms-center', label: 'SMS Center', icon: MessageSquare },
      { to: '/admin/email-center', label: 'Email Center', icon: MessageSquare },
    ],
  },
  {
    heading: 'AI & Analytics',
    items: [
      { to: '/admin/ai-insights', label: 'AI Insights', icon: Sparkles },
      { to: '/admin/student-performance', label: 'Student Performance Analytics', icon: BarChart3 },
      { to: '/admin/attendance-analytics', label: 'Attendance Analytics', icon: BarChart3 },
      { to: '/admin/custom-reports', label: 'Custom Reports', icon: FileText },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
      { to: '/admin/complaints', label: 'Support Tickets', icon: Shield },
      { to: '/admin/settings', label: 'Settings & Security', icon: SettingsIcon },
    ],
  },
];

const teacherGroups = [
  {
    heading: 'Teaching',
    items: [
      { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/teacher/topics', label: 'Course Content', icon: BookOpen },
      { to: '/teacher/classes', label: 'My Schedule', icon: Video },
      { to: '/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
    ],
  },
  {
    heading: 'Evaluation',
    items: [
      { to: '/teacher/assignments', label: 'Assignments', icon: FileText },
      { to: '/teacher/assessments', label: 'Assessments', icon: ClipboardList },
      { to: '/teacher/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    heading: 'Tools',
    items: [
      { to: '/teacher/creator', label: 'PPT & Mind Maps', icon: Presentation },
      { to: '/teacher/grievances', label: 'Grievances', icon: MessageSquareWarning },
      { to: '/teacher/chat', label: 'Chat', icon: MessageSquare },
      { to: '/teacher/profile', label: 'Profile', icon: SettingsIcon },
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
          'fixed inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 md:static',
          collapsed && canCollapse ? 'md:w-[80px]' : 'md:w-[280px]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
            <div className={cn('min-w-0 transition-opacity', collapsed && canCollapse && 'md:opacity-0 md:pointer-events-none md:w-0 md:overflow-hidden')}>
              <EddvaLogo />
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

          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            {groups.map((group) => (
                <div key={group.heading} className="mb-6">
                  <p
                    className={cn(
                      'mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500',
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

          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            {isInstitute || isTeacher ? (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',
                  collapsed && 'md:justify-center md:p-2'
                )}
              >
                {isInstitute ? (
                  <InstituteLogo institute={institute} size="sm" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-xs font-black text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {(user?.name || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
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
