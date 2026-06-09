import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { PageTransition } from '@/components/school/admin/PageTransition';
import { ConfirmProvider } from '@/context/ConfirmContext';

export default function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
<<<<<<< HEAD
  const isTakingAssessment = /^\/school\/student\/assessments\/[^/]+\/take\/?$/.test(location.pathname);
=======
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);
>>>>>>> ea436ebcd76593c147cdba8cacbd6858e5e98586

  return (
    <ConfirmProvider>
      <div className="font-poppins relative flex h-screen w-full overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/15 to-indigo-50/25 dark:from-slate-950 dark:via-slate-900/30 dark:to-indigo-950/20">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-200/10 blur-[120px] dark:bg-indigo-900/5" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-[600px] w-[600px] rounded-full bg-blue-200/10 blur-[120px] dark:bg-blue-900/5" />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
<<<<<<< HEAD
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
            {isTakingAssessment ? (
              <div className="mx-auto min-h-full max-w-[1680px]">
                <Outlet />
              </div>
            ) : (
              <AnimatePresence initial={false} mode="sync">
                <PageTransition key={location.pathname} duration={0.2}>
                  <div className="mx-auto min-h-full max-w-[1680px]">
                    <Outlet />
                  </div>
                </PageTransition>
              </AnimatePresence>
            )}
=======
          <main ref={mainRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-5 lg:p-6">
            <AnimatePresence initial={false} mode="wait">
              <PageTransition key={location.pathname} duration={0.2}>
                <div className="mx-auto min-h-full max-w-[1680px]">
                  <Outlet />
                </div>
              </PageTransition>
            </AnimatePresence>
>>>>>>> ea436ebcd76593c147cdba8cacbd6858e5e98586
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
