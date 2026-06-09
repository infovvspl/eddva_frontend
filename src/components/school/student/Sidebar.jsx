import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  Compass,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  MessageSquare,
  Radio,
  Settings as SettingsIcon,
  Trophy,
  UserCheck,
  UserCircle,
  Video,
  X,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { EddvaLogo } from '@/components/school/admin/Brand';
import { useAuth } from '@/context/SchoolAuthContext';

const studentGroups = [
  {
    heading: 'Home',
    items: [
      { to: '/school/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ],
  },
  {
    heading: 'My Learning',
    items: [
      { to: '/school/student/live-classes', label: 'Live Classes', icon: Radio },
      { to: '/school/student/recorded-classes', label: 'Recorded Classes', icon: Video },
      { to: '/school/student/study-materials', label: 'Study Materials', icon: BookOpen },
    ],
  },
  {
    heading: 'Academic Work',
    items: [
      { to: '/school/student/assignments', label: 'Assignments', icon: FileText },
      { to: '/school/student/assessments', label: 'Assessments', icon: ClipboardList },
      { to: '/school/student/attendance', label: 'Attendance', icon: UserCheck },
      { to: '/school/student/analytics', label: 'Performance Analytics', icon: BarChart3 },
    ],
  },
  {
    heading: 'Growth',
    items: [
      { to: '/school/student/doubts', label: 'My Doubts', icon: HelpCircle },
      { to: '/school/student/career', label: 'Career Guidance', icon: Compass, badge: 'New' },
      { to: '/school/student/gamification', label: 'Gamification', icon: Trophy },
      { to: '/school/student/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { to: '/school/student/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const canCollapse = true;

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex-shrink-0 border-r border-slate-100 bg-white transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 md:sticky md:top-0 md:h-screen',
          collapsed && canCollapse ? 'md:w-[80px]' : 'md:w-[280px]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
            <div className={cn('min-w-0 transition-opacity', collapsed && canCollapse && 'md:opacity-0 md:pointer-events-none md:w-0 md:overflow-hidden')}>
              <Link to="/school/student">
                <EddvaLogo />
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {canCollapse && (
                <button
                  type="button"
                  onClick={() => setCollapsed((value) => !value)}
                  className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 md:inline-flex"
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                  <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 md:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
            {studentGroups.map((group) => (
              <div key={group.heading} className="mb-6">
                <p
                  className={cn(
                    'mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500',
                    collapsed && canCollapse && 'md:hidden'
                  )}
                >
                  {group.heading}
                </p>
                <nav className="space-y-1">
                  {group.items.map((item) => (
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
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                        )
                      }
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className={cn('truncate', collapsed && canCollapse && 'md:hidden')}>{item.label}</span>
                      {item.badge && (
                        <span className={cn('ml-auto rounded-full bg-emerald-500 px-1.5 py-0.5 text-[9px] font-black uppercase text-white', collapsed && canCollapse && 'md:hidden')}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900',
                collapsed && 'md:justify-center md:p-2'
              )}
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt="Student Avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="grid h-full w-full place-items-center rounded-xl bg-blue-100 text-xs font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
                    }}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src="/images/student_avatar.png"
                    alt="Student Avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = `<div class="grid h-full w-full place-items-center rounded-xl bg-blue-100 text-xs font-bold tracking-tight text-blue-700 dark:bg-blue-900 dark:text-blue-300">${(user?.name || 'S').charAt(0).toUpperCase()}</div>`;
                    }}
                    className="h-full w-full object-cover object-top scale-125 animate-float mix-blend-multiply dark:mix-blend-normal"
                  />
                )}
              </div>
              <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
                <p className="truncate text-xs font-bold text-slate-950 dark:text-white">{user?.name || 'Student'}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">Student Portal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden" onClick={onClose} aria-label="Close menu overlay" />}
    </>
  );
}
