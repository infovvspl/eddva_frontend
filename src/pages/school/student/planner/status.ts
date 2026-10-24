import type { MasteryStatus, StepKind, ThreadStatus } from "@/lib/api/learning-path";

/** How each mastery status looks everywhere in the planner (light and dark). */
export const STATUS_STYLE: Record<MasteryStatus, { label: string; dot: string; chip: string; node: string }> = {
  weak: {
    label: "Weak",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900",
    node: "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40",
  },
  at_risk: {
    label: "At risk",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    node: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40",
  },
  ok: {
    label: "OK",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900",
    node: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30",
  },
  mastered: {
    label: "Mastered",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    node: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
  },
  insufficient_data: {
    label: "Not enough data",
    dot: "bg-slate-400",
    chip: "bg-muted text-muted-foreground border-border",
    node: "border-border bg-card",
  },
  not_assessed: {
    label: "Not tested yet",
    dot: "bg-slate-300 dark:bg-slate-600",
    chip: "bg-muted text-muted-foreground border-border",
    node: "border-dashed border-border bg-card",
  },
};

export const STEP_LABEL: Record<StepKind, string> = {
  videos: "Videos",
  notes: "AI notes",
  quiz: "Quiz",
  assessment: "Formal assessment",
};

export const THREAD_STATUS_LABEL: Record<ThreadStatus, string> = {
  suggested: "Suggested",
  active: "In progress",
  completed: "Completed",
  needs_teacher: "Needs teacher help",
};

export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

export function formatPct(value: number | null | undefined): string {
  return value === null || value === undefined ? "–" : `${Math.round(value)}%`;
}

/** Progress colours, the same on every mind map and on the curved path. */
export const PROGRESS_STYLE: Record<"not_started" | "in_progress" | "completed", { label: string; node: string; swatch: string }> = {
  not_started: {
    label: "Not started",
    node: "border-border bg-card",
    swatch: "border border-border bg-card",
  },
  // Light tints like the weak (red) and at-risk (yellow) nodes; no solid fills.
  in_progress: {
    label: "In progress",
    node: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
    swatch: "border border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
  },
  completed: {
    label: "Completed",
    node: "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
    swatch: "border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40",
  },
};

/** Colour of the travelling light round a box or circle (see .planner-glow in index.css). */
export const GLOW_COLOR = {
  in_progress: "#3b82f6",
  completed: "#10b981",
  weak: "#f43f5e",
  at_risk: "#f59e0b",
  locked: "#94a3b8",
  default: "hsl(var(--primary))",
} as const;

/** Start each light at a different point so neighbouring boxes do not move in step. */
export function glowDelay(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return `${-((Math.abs(h) % 36) / 10)}s`;
}
