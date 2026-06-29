import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from '@/components/school/admin/PageTransition';
import MaintenanceNotice from '@/components/shared/MaintenanceNotice';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTakingAssessment = /^\/school\/student\/assessments\/[^/]+\/take\/?$/.test(location.pathname);
  const isFullWidthPage = [
    '/school/student/timetable',
    '/school/student/calendar',
    '/school/student/analytics',
    '/school/student/planner',
  ].includes(location.pathname);

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
