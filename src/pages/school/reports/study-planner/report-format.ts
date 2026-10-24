import type { EngagementLevel, ReportPeriod, TrendGranularity } from "@/lib/api/learning-reports";

export const PERIOD_LABEL: Record<ReportPeriod, string> = { today: "Today", week: "Last 7 days", month: "Last 30 days", year: "Last 12 months" };
export const TREND_LABEL: Record<TrendGranularity, string> = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" };

export const LEVEL_STYLE: Record<EngagementLevel, { label: string; chip: string }> = {
  high: { label: "High", chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" },
  medium: { label: "Medium", chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" },
  low: { label: "Low", chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300" },
};

export const SECTION_LABEL: Record<string, string> = {
  home: "Roadmap",
  videos: "Videos",
  notes: "AI notes",
  quiz: "Quizzes",
  assessment: "Assessments",
  chat: "AI Tutor chat",
};

/** 0 → "0m", 300 → "5m", 7500 → "2h 05m". */
export function formatDuration(seconds: number): string {
  const minutes = Math.round((seconds || 0) / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/** +12.5 → "+12.5 pts", -3 → "−3 pts", null → "Not measured yet". */
export function formatImprovement(points: number | null): string {
  if (points === null || points === undefined) return "Not measured yet";
  const rounded = Math.round(points * 10) / 10;
  if (rounded > 0) return `+${rounded} pts`;
  if (rounded < 0) return `−${Math.abs(rounded)} pts`;
  return "0 pts";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A trend bucket's label: "24 Oct" (day or week start), "Oct 2026" (month), "2026" (year). */
export function bucketLabel(period: string, granularity: TrendGranularity): string {
  const [y, m, d] = period.split("-").map(Number);
  if (granularity === "year") return String(y);
  if (granularity === "month") return `${MONTHS[m - 1]} ${y}`;
  return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-10-24" → "24 Oct 2026"; null → "Never". */
export function formatDay(day: string | null): string {
  if (!day) return "Never";
  const [y, m, d] = day.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export const classLabel = (s: { className: string | null; sectionName: string | null }) =>
  [s.className, s.sectionName].filter(Boolean).join(" · ") || "—";
