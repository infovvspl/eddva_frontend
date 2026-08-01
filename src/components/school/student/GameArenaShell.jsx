import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Gamepad2 } from 'lucide-react';

// Full-screen shell for the student "Gaming Arena" (Gamification hub + game-zone
// games). These routes are mounted as siblings to SchoolStudentLayout in App.tsx
// (not nested under it), so the dashboard sidebar/navbar never renders here —
// this shell is the only chrome, and Exit is the only way back to the dashboard.
export default function GameArenaShell({ children }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50 font-poppins dark:bg-slate-950">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Gamepad2 className="h-5 w-5 text-amber-500" />
          <span>Gaming Arena</span>
        </div>
        <button
          onClick={() => navigate('/school/student/gamification')}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
        >
          <X className="h-4 w-4" />
          Exit
        </button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}
