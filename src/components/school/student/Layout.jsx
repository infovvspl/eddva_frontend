import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from '@/components/school/admin/PageTransition';
import MaintenanceNotice from '@/components/shared/MaintenanceNotice';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  LayoutDashboard,
  Video,
  Radio,
  MonitorPlay,
  FileText,
  BookOpen,
  BrainCircuit,
  ClipboardList,
  UserCheck,
  BarChart3,
  HelpCircle,
  Compass,
  Trophy,
  CalendarDays,
  Megaphone,
  MoreHorizontal,
  X,
  LogOut
} from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const hasLiveClasses = useSchoolFeature('module', 'live_classes');
  const hasAssignments = useSchoolFeature('module', 'assignments');
  const hasAssessments = useSchoolFeature('module', 'assessments');
  const hasReports = useSchoolFeature('module', 'reports');
  const hasTimetable = useSchoolFeature('module', 'timetable');
  const hasCalendar = useSchoolFeature('module', 'academic_calendar');
  const hasPlanner = useSchoolFeature('ai', 'ai_study_planner');
  const hasDoubts = useSchoolFeature('ai', 'ai_doubt_solver');
  const hasCareer = useSchoolFeature('ai', 'ai_career_guidance');

  const isTakingAssessment = /^\/school\/student\/assessments\/[^/]+\/take\/?$/.test(location.pathname);

  const isFullWidthPage = [
    '/school/student/timetable',
    '/school/student/calendar',
    '/school/student/analytics',
    '/school/student/planner',
  ].includes(location.pathname);

  const isFixedPage = [
    '/school/student/chat',
  ].includes(location.pathname) || location.pathname.includes('/live/');

  // Construct bottom navigation items dynamically
  const navItems = [
    { label: 'Dashboard', path: '/school/student', icon: LayoutDashboard },
    hasLiveClasses
      ? { label: 'Live', path: '/school/student/live-classes', icon: MonitorPlay }
      : { label: 'Recorded Classes', path: '/school/student/recorded-classes', icon: Video },
    hasAssignments
      ? { label: 'Assignments', path: '/school/student/assignments', icon: FileText }
      : { label: 'Study Materials', path: '/school/student/study-materials', icon: BookOpen }
  ];

  // All possible more items mapped
  const allPossibleMoreItems = [
    { label: 'Live Classes', path: '/school/student/live-classes', icon: MonitorPlay, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20', enabled: hasLiveClasses },
    { label: 'Recorded Classes', path: '/school/student/recorded-classes', icon: Video, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20', enabled: true },
    { label: 'Study Materials', path: '/school/student/study-materials', icon: BookOpen, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20', enabled: true },
    { label: 'AI Planner', path: '/school/student/planner', icon: BrainCircuit, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20', enabled: hasPlanner },
    { label: 'Assignments', path: '/school/student/assignments', icon: FileText, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20', enabled: hasAssignments },
    { label: 'Assessments', path: '/school/student/assessments', icon: ClipboardList, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20', enabled: hasAssessments },
    { label: 'Attendance', path: '/school/student/attendance', icon: UserCheck, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20', enabled: true },
    { label: 'Analytics', path: '/school/student/analytics', icon: BarChart3, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20', enabled: hasReports },
    { label: 'My Doubts', path: '/school/student/doubts', icon: HelpCircle, color: 'text-pink-500 bg-pink-50 dark:bg-pink-950/20', enabled: hasDoubts },
    { label: 'Career Guidance', path: '/school/student/career', icon: Compass, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/20', enabled: hasCareer },
    { label: 'Gamification', path: '/school/student/gamification', icon: Trophy, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20', enabled: true },
    { label: 'Timetable', path: '/school/student/timetable', icon: CalendarDays, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20', enabled: hasTimetable },
    { label: 'Calendar', path: '/school/student/calendar', icon: CalendarDays, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20', enabled: hasCalendar },
    { label: 'Announcements', path: '/school/student/announcements', icon: Megaphone, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20', enabled: true },
  ];

  const moreItems = allPossibleMoreItems.filter(item => {
    if (!item.enabled) return false;
    return !navItems.some(navItem => navItem.path === item.path);
  });

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 font-poppins text-slate-850 dark:bg-slate-950 dark:text-slate-200 overflow-hidden">
        {/* Sticky Mobile Header via Navbar (no hamburger menu triggers passed) */}
        <Navbar />

        <MaintenanceNotice />

        {/* Scrollable Container */}
        <main className={`flex-1 min-h-0 ${isFullWidthPage ? 'p-0' : 'px-4 pt-4 pb-4'} ${isFixedPage ? 'overflow-y-hidden' : 'overflow-y-auto'} scrollbar-none`}>
          <AnimatePresence initial={false} mode="wait">
            <PageTransition key={location.pathname} duration={0.2}>
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
    <div className="layout-fixed font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25 dark:from-slate-950 dark:via-slate-900/30 dark:to-indigo-950/20">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-200/10 blur-[120px] dark:bg-indigo-900/5" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-blue-200/10 blur-[120px] dark:bg-blue-900/5" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden ${sidebarOpen && isMobile ? 'pointer-events-none' : ''}`}
        inert={sidebarOpen && isMobile ? "" : undefined}
      >
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MaintenanceNotice />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? 'px-0 py-3 sm:py-5 lg:py-6' : 'p-3 sm:p-5 lg:p-6'}`}>
          <AnimatePresence initial={false} mode="wait">
            <PageTransition key={location.pathname} duration={0.2}>
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
