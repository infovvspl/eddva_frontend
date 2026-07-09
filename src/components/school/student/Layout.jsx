import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarCheck2,
  Clock,
  ClipboardList,
  MoreHorizontal,
  Video,
  BarChart3,
  User,
  Megaphone,
  CalendarDays,
  CircleDollarSign,
  HelpCircle,
  Settings,
  Bell,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from '@/components/school/admin/PageTransition';
import MaintenanceNotice from '@/components/shared/MaintenanceNotice';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/SchoolAuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { logout, user } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const isTakingAssessment = /^\/school\/student\/assessments\/[^/]+\/take\/?$/.test(location.pathname);
  const isFullWidthPage = [
    '/school/student/timetable',
    '/school/student/calendar',
    '/school/student/analytics',
    '/school/student/planner',
  ].includes(location.pathname);

  // Close drawer on route change
  useEffect(() => {
    setMoreDrawerOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', path: '/school/student', icon: LayoutDashboard },
    { label: 'Attendance', path: '/school/student/attendance', icon: CalendarCheck2 },
    { label: 'Timetable', path: '/school/student/timetable', icon: Clock },
    { label: 'Homework', path: '/school/student/assignments', icon: ClipboardList },
  ];

  const moreItems = [
    { label: 'Live Classes', path: '/school/student/live-classes', icon: Video, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { label: 'AI Tutor', path: '/school/student/doubts', icon: HelpCircle, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
    { label: 'Reports', path: '/school/student/analytics', icon: BarChart3, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Calendar', path: '/school/student/calendar', icon: CalendarDays, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Fees Balance', path: '/school/student/fees', icon: CircleDollarSign, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
    { label: 'Announcements', path: '/school/student/announcements', icon: Megaphone, color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
    { label: 'My Profile', path: '/school/student/profile', icon: User, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
    { label: 'Settings', path: '/school/student/settings', icon: Settings, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
  ];

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col bg-slate-50 font-poppins text-slate-800 dark:bg-slate-950 dark:text-slate-200 overflow-hidden">
        {/* Sticky Mobile Top Header */}
        <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-slate-100 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">ED</span>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">EDDVA Student</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/school/student/notifications')}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 relative active:scale-95"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            </button>
            <button
              onClick={() => navigate('/school/student/profile')}
              className="h-8 w-8 rounded-full border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden active:scale-95"
            >
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256'}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        </header>

        <MaintenanceNotice />

        {/* Scrollable Container */}
        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 scrollbar-none">
          <AnimatePresence initial={false} mode="wait">
            <PageTransition key={location.pathname} duration={0.15}>
              <div className="h-full w-full">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>

        {/* Sticky Mobile Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-16 w-full items-center justify-around border-t border-slate-100 bg-white/95 px-2 pb-safe shadow-lg dark:border-slate-800 dark:bg-slate-900/95 backdrop-blur-md">
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
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
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
                      className={`flex items-center gap-3 rounded-2xl border p-3 shadow-xs active:scale-98 transition ${
                        isActive
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
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
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-rose-100 bg-rose-50/50 py-3.5 text-xs font-black text-rose-600 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-400"
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

  // Desktop/Laptop layout (remains untouched)
  return (
    <div className="layout-fixed font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25 dark:from-slate-950 dark:via-slate-900/30 dark:to-indigo-950/20">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-200/10 blur-[120px] dark:bg-indigo-900/5" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-blue-200/10 blur-[120px] dark:bg-blue-900/5" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MaintenanceNotice />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? 'px-0 py-3 sm:py-5 lg:py-6' : 'p-3 sm:p-5 lg:p-6'}`}>
          <AnimatePresence initial={false} mode="wait">
            <PageTransition key={location.pathname} duration={0.2}>
              <div className="h-full w-full">
                <Outlet />
              </div>
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
