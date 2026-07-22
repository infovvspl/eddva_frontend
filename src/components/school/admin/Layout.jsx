import React, { useEffect, useState, Suspense } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from './PageTransition';
import MaintenanceNotice from '@/components/shared/MaintenanceNotice';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import {
  LayoutDashboard,
  Building2,
  Megaphone,
  MoreHorizontal,
  LogOut,
  Bell,
  Settings as SettingsIcon,
  Shield,
  ToggleRight,
  FileText,
  BarChart3,
  Sparkles,
  GraduationCap,
  Users,
  User,
  BookOpen,
  AlertCircle,
  MessageSquare,
  X,
  Video,
  ClipboardCheck,
  ClipboardList,
  CalendarDays
} from 'lucide-react';
import logoUrl from '@/assets/eddva-logo.svg';
import { InstituteLogo } from './Brand';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, institute, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const rawRole = String(user?.rawRole || user?.role || '')
    .toUpperCase()
    .trim();
  const hasSuperAdminRole = rawRole.includes('SUPER_ADMIN') || rawRole.includes('SUPER ADMIN');
  const hasTeacherRole = rawRole.includes('TEACHER');
  const hasInstituteAdminRole = !hasSuperAdminRole && (
    rawRole.includes('INSTITUTE_ADMIN') ||
    rawRole.includes('INSTITUTE ADMIN') ||
    /\bADMIN\b/.test(rawRole)
  );
  const isAdminPath = location.pathname.startsWith('/school/admin');
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || hasSuperAdminRole;
  const isInstitute = !isSuperAdmin && (user?.role === 'INSTITUTE_ADMIN' || (isAdminPath && hasInstituteAdminRole));
  const isTeacher = !isSuperAdmin && !(isAdminPath && hasInstituteAdminRole) && user?.role === 'TEACHER';
  const useTeacherFallback = !isSuperAdmin && !isInstitute;

  useEffect(() => {
    if (!isAdminPath || isSuperAdmin || !hasTeacherRole || !hasInstituteAdminRole || !user?.id) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const key = `school-admin-portal-entry:${user.id}:${today}`;
    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, '1');
    api.post('/auth/admin-portal-entry').catch((error) => {
      sessionStorage.removeItem(key);
      console.error('Failed to record admin portal entry:', error);
    });
  }, [isAdminPath, isSuperAdmin, hasTeacherRole, hasInstituteAdminRole, user?.id]);

  const isFullWidthPage = [
    '/communication',
    '/communications',
    '/audit-logs',
    '/feature-flags',
  ].some(p => location.pathname.endsWith(p)) || [
    '/school/teacher/timetable',
    '/school/teacher/calendar',
    '/school/teacher/assignments',
    '/school/teacher/assessments',
  ].includes(location.pathname) || location.pathname.includes('/live/');

  const isFixedPage = [
    '/communication',
    '/communications',
  ].some(p => location.pathname.endsWith(p)) || location.pathname.includes('/live/');

  if (isMobile) {
    const mods = institute?.modulesPermissions;
    const aiFeats = institute?.aiEnabled ? institute.aiFeatures : { ai_doubt_solver: false };

    const liveEnabled = mods ? mods.live_classes !== false : true;
    const assessmentsEnabled = mods ? mods.assessments !== false : true;
    const assignmentsEnabled = mods ? mods.assignments !== false : true;
    const chatEnabled = mods ? mods.chat !== false : true;
    const calendarEnabled = mods ? mods.academic_calendar !== false : true;
    const timetableEnabled = mods ? mods.timetable !== false : true;
    const reportsEnabled = mods ? mods.reports !== false : true;
    const meetingsEnabled = mods ? mods.meetings !== false : true;
    const doubtsEnabled = aiFeats?.ai_doubt_solver !== false;

    const navItems = isSuperAdmin ? [
      { label: 'Dashboard', path: '/school/super-admin', icon: LayoutDashboard },
      { label: 'Schools', path: '/school/super-admin/institutes', icon: Building2 },
      { label: 'Messages', path: '/school/super-admin/communication', icon: Megaphone },
    ] : (isTeacher || useTeacherFallback) ? [
      { label: 'Dashboard', path: '/school/teacher', icon: LayoutDashboard },
      { label: 'Attendance', path: '/school/teacher/attendance', icon: ClipboardCheck },
      timetableEnabled ? { label: 'Timetable', path: '/school/teacher/timetable', icon: CalendarDays } : { label: 'Content', path: '/school/teacher/course-content', icon: BookOpen },
    ] : [
      { label: 'Dashboard', path: '/school/admin', icon: LayoutDashboard },
      { label: 'Students', path: '/school/admin/students', icon: GraduationCap },
      { label: 'Teachers', path: '/school/admin/teachers', icon: Users },
    ];

    const moreItems = isSuperAdmin ? [
      { label: 'Support', path: '/school/super-admin/complaints', icon: Shield, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Analytics', path: '/school/super-admin/analytics', icon: BarChart3, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'AI Usage', path: '/school/super-admin/ai-usage', icon: Sparkles, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
      { label: 'Audit Logs', path: '/school/super-admin/audit-logs', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      { label: 'Security', path: '/school/super-admin/security', icon: Shield, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
      { label: 'Feature Flags', path: '/school/super-admin/feature-flags', icon: ToggleRight, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
      { label: 'Settings', path: '/school/super-admin/settings', icon: SettingsIcon, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
    ] : (isTeacher || useTeacherFallback) ? [
      timetableEnabled && { label: 'Course Content', path: '/school/teacher/course-content', icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
      liveEnabled && { label: 'My Schedule', path: '/school/teacher/classes', icon: Video, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      assignmentsEnabled && { label: 'Assignments', path: '/school/teacher/assignments', icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      assessmentsEnabled && { label: 'Assessments', path: '/school/teacher/assessments', icon: ClipboardList, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
      doubtsEnabled && { label: 'Student Doubts', path: '/school/teacher/doubts', icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
      meetingsEnabled && { label: 'Meetings', path: '/school/teacher/meetings', icon: CalendarDays, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
      reportsEnabled && { label: 'Reports', path: '/school/teacher/reports', icon: BarChart3, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
      calendarEnabled && { label: 'Calendar', path: '/school/teacher/calendar', icon: CalendarDays, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
      { label: 'Announcements', path: '/school/teacher/announcements', icon: Megaphone, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
      chatEnabled && { label: 'Chat', path: '/school/teacher/chat', icon: MessageSquare, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20' },
      { label: 'Grievances', path: '/school/teacher/grievances', icon: AlertCircle, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
      { label: 'Profile', path: '/school/teacher/profile', icon: User, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
      { label: 'Settings', path: '/school/teacher/settings', icon: SettingsIcon, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
    ].filter(Boolean) : [
      { label: 'Curriculum', path: '/school/admin/academics', icon: Building2, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
      { label: 'Subjects', path: '/school/admin/subjects', icon: BookOpen, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      { label: 'Attendance', path: '/school/admin/attendance', icon: BarChart3, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
      { label: 'Notices', path: '/school/admin/notices', icon: AlertCircle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
      { label: 'Messages', path: '/school/admin/communications', icon: MessageSquare, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
      { label: 'AI Analytics', path: '/school/admin/ai-usage', icon: Sparkles, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
      { label: 'Users', path: '/school/admin/users', icon: Users, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
      { label: 'Audit Logs', path: '/school/admin/audit-logs', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
      { label: 'Support', path: '/school/admin/complaints', icon: Shield, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20' },
      { label: 'Profile', path: '/school/admin/institute-profile', icon: User, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
      { label: 'Settings', path: '/school/admin/settings', icon: SettingsIcon, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
    ];

    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 font-poppins text-slate-850 dark:bg-slate-950 dark:text-slate-200 overflow-hidden">
        {/* Sticky Mobile Header */}
        <Navbar />

        <MaintenanceNotice />

        {/* Scrollable Container */}
        <main className={`flex-1 min-h-0 ${isFullWidthPage ? 'p-0' : 'px-4 sm:px-4 pt-4 pb-4'} ${isFixedPage ? 'overflow-y-hidden' : 'overflow-y-auto'} scrollbar-none`}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <div className="h-full w-full">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>

        {/* Sticky Mobile Bottom Navigation Bar */}
        <nav className="relative z-40 flex h-16 w-full shrink-0 items-center justify-around border-t border-slate-100 bg-white/95 px-2 pb-safe shadow-lg dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center w-14 h-full relative"
              >
                <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
                <span className={`text-[9px] font-black uppercase mt-1 tracking-wider ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.label}
                </span>
                {isActive && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-600 dark:bg-blue-400" />}
              </Link>
            );
          })}
          <button
            onClick={() => setMoreDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-14 h-full relative"
          >
            <MoreHorizontal size={18} className={moreDrawerOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
            <span className={`text-[9px] font-black uppercase mt-1 tracking-wider ${moreDrawerOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
              More
            </span>
          </button>
        </nav>

        {/* Slide-up bottom drawer menu */}
        {moreDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMoreDrawerOpen(false)}
          >
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[2.5rem] bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50 dark:border-slate-850">
                <span className="text-sm font-black uppercase tracking-widest text-slate-400">Quick Access</span>
                <button
                  onClick={() => setMoreDrawerOpen(false)}
                  className="rounded-full bg-slate-50 p-2 text-slate-400 dark:bg-slate-800 dark:text-slate-500 active:scale-95"
                  aria-label="Close menu"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Grid of options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setMoreDrawerOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 shadow-xs active:scale-98 transition ${isActive
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-955/20'
                        : 'border-slate-100 bg-white hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900/60'
                        }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="text-[11px] font-black tracking-tight text-slate-700 dark:text-slate-300">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {/* Log out Button inside Drawer */}
              <button
                onClick={() => {
                  logout();
                  setMoreDrawerOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/50 py-3.5 text-xs font-black text-rose-600 dark:border-rose-955/20 dark:bg-rose-955/10 dark:text-rose-450"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="layout-fixed font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25 dark:from-slate-950 dark:via-slate-900/15 dark:to-indigo-950/10">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-100/20 dark:bg-blue-900/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-blue-200/15 dark:bg-sky-900/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-sky-100/10 dark:bg-indigo-900/5 blur-[100px]" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden ${sidebarOpen && isMobile ? 'pointer-events-none' : ''}`}
        inert={sidebarOpen && isMobile ? "" : undefined}
      >
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MaintenanceNotice />
        <main className={`flex-1 relative overflow-x-hidden ${isFullWidthPage ? 'p-0 overflow-y-auto' : 'p-3 sm:p-5 lg:p-6 overflow-y-auto'}`}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <div className="h-full w-full">
                <Suspense fallback={
                  <div className="flex h-[50vh] w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                }>
                  <Outlet />
                </Suspense>
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

