import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { EngagementLevel, ReportListItem, ReportPeriod, TrendGranularity, TrendPoint } from "@/lib/api/learning-reports";
import { cn } from "@/lib/utils";
import { bucketLabel, classLabel, formatDay, formatDuration, formatImprovement, LEVEL_STYLE, PERIOD_LABEL, TREND_LABEL } from "./report-format";

export function Card({ title, subtitle, action, children, className }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 break-inside-avoid", className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  return (
    <div className={cn(
      "rounded-2xl border p-4",
      tone === "default" && "border-border bg-card",
      tone === "good" && "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40",
      tone === "warn" && "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
      tone === "bad" && "border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40",
    )}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-none text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Toggle<T extends string>({ label, value, options, labels, onChange }: { label: string; value: T; options: T[]; labels: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl border border-border p-0.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          className={cn("rounded-lg px-2.5 py-1 text-xs font-medium", value === o ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
          {labels[o]}
        </button>
      ))}
    </div>
  );
}

export function PeriodToggle({ value, onChange }: { value: ReportPeriod; onChange: (v: ReportPeriod) => void }) {
  return <Toggle label="Period" value={value} options={["today", "week", "month", "year"]} labels={PERIOD_LABEL} onChange={onChange} />;
}

export function TrendToggle({ value, onChange }: { value: TrendGranularity; onChange: (v: TrendGranularity) => void }) {
  return <Toggle label="Usage trend" value={value} options={["day", "week", "month", "year"]} labels={TREND_LABEL} onChange={onChange} />;
}

/** Minutes studied per day / week / month / year, with how many students studied (when it is a group). */
export function TrendChart({ trend, granularity, showStudents }: { trend: TrendPoint[]; granularity: TrendGranularity; showStudents?: boolean }) {
  const points = trend.map((t) => ({ label: bucketLabel(t.period, granularity), minutes: Math.round(t.seconds / 60), students: t.activeStudents }));
  if (!points.some((p) => p.minutes > 0)) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No study in this time.</p>;
  }
  return (
    <div className="h-56 w-full" aria-label="Usage trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: number, name: string) => (name === "minutes" ? [formatDuration(value * 60), "Study time"] : [value, "Students studying"])}
            contentStyle={{ fontSize: 12, borderRadius: 12 }}
          />
          <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          {showStudents && <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LevelChip({ level, score }: { level: EngagementLevel; score?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", LEVEL_STYLE[level].chip)}>
      {LEVEL_STYLE[level].label}{score !== undefined && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

/** A short list of students (inactive, low engagement, effort without gain), each opening their report. */
export function StudentList({ items, studentHref, empty, detail }: { items: ReportListItem[]; studentHref: (userId: string) => string; empty: string; detail: (i: ReportListItem) => string }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
      {items.map((i) => (
        <li key={i.studentId}>
          <Link to={studentHref(i.userId)} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{i.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{classLabel(i)}</span>
            </span>
            <span className="shrink-0 text-right text-[11px] text-muted-foreground">{detail(i)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export const lastSeen = (i: { lastActiveDay: string | null }) => (i.lastActiveDay ? `Last studied ${formatDay(i.lastActiveDay)}` : "Never studied");
export const timeAndGain = (i: { seconds: number; improvement: number | null }) => `${formatDuration(i.seconds)} · ${formatImprovement(i.improvement)}`;
