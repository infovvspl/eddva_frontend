import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from './PageTransition';
import MaintenanceNotice from '@/components/shared/MaintenanceNotice';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFullWidthPage = [
    '/school/admin/communication',
    '/school/admin/audit-logs',
    '/school/admin/feature-flags',
    '/school/teacher/timetable',
    '/school/teacher/calendar',
    '/school/teacher/assignments',
    '/school/teacher/assessments',
  ].includes(location.pathname);

  return (
    <div className="layout-fixed font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25 dark:from-slate-950 dark:via-slate-900/15 dark:to-indigo-950/10">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-100/20 dark:bg-blue-900/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-blue-200/15 dark:bg-sky-900/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 h-[400px] w-[400px] rounded-full bg-sky-100/10 dark:bg-indigo-900/5 blur-[100px]" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MaintenanceNotice />
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${isFullWidthPage ? 'p-0' : 'p-3 sm:p-5 lg:p-6'}`}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
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
