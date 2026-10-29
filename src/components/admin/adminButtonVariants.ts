// Coaching institute-admin panel only. A scoped indigo accent for /admin/* pages —
// does NOT touch the shared Button component or --primary CSS var used by school/
// super-admin/teacher/student, so it stays local to this product area.
export const adminButton = {
  primary:
    "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:pointer-events-none",
  secondary:
    "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg bg-white border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:pointer-events-none",
  ghost:
    "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg bg-transparent text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:pointer-events-none",
  destructive:
    "inline-flex items-center justify-center gap-2 min-h-11 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:pointer-events-none",
} as const;
