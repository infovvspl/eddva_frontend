import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
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

const TILE_TONE = {
  default: { box: "border-border bg-card hover:border-blue-300", icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300" },
  good: { box: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/40", icon: "bg-white/80 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300" },
  warn: { box: "border-amber-200 bg-amber-50 hover:border-amber-300 dark:border-amber-900 dark:bg-amber-950/40", icon: "bg-white/80 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300" },
  bad: { box: "border-rose-200 bg-rose-50 hover:border-rose-300 dark:border-rose-900 dark:bg-rose-950/40", icon: "bg-white/80 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300" },
};

export function StatTile({ label, value, hint, tone = "default", icon: Icon }: { label: string; value: string; hint?: string; tone?: "default" | "good" | "warn" | "bad"; icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className={cn("flex items-start justify-between gap-2 rounded-2xl border p-4 transition-colors", TILE_TONE[tone].box)}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold leading-none text-foreground">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      {Icon && (
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", TILE_TONE[tone].icon)}>
          <Icon className="size-[18px]" />
        </span>
      )}
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

/** Shared tooltip look for every chart on these reports. */
const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 12, border: "1px solid hsl(var(--border))", boxShadow: "0 10px 30px -12px rgba(15,23,42,0.25)" };

/** Minutes studied per day / week / month / year, with how many students studied (when it is a group). */
export function TrendChart({ trend, granularity, showStudents }: { trend: TrendPoint[]; granularity: TrendGranularity; showStudents?: boolean }) {
  const points = trend.map((t) => ({ label: bucketLabel(t.period, granularity), minutes: Math.round(t.seconds / 60), students: t.activeStudents }));
  if (!points.some((p) => p.minutes > 0)) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No study in this time.</p>;
  }
  return (
    <div className="h-56 w-full text-muted-foreground" aria-label="Usage trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="trend-minutes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="trend-students" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" strokeOpacity={0.5} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
          <YAxis tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#6366f1", fillOpacity: 0.07 }}
            formatter={(value: number, name: string) => (name === "minutes" ? [formatDuration(value * 60), "Study time"] : [value, "Students studying"])}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="minutes" fill="url(#trend-minutes)" radius={[6, 6, 0, 0]} maxBarSize={30} />
          {showStudents && <Bar dataKey="students" fill="url(#trend-students)" radius={[6, 6, 0, 0]} maxBarSize={30} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const CHART_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#f59e0b", "#e11d48", "#0891b2", "#4f46e5", "#16a34a"];

/** Time by section as a donut: the total in the middle, each section's share in the legend. */
export function SectionDonut({ rows }: { rows: { label: string; seconds: number }[] }) {
  const data = rows.filter((r) => r.seconds > 0).sort((a, b) => b.seconds - a.seconds);
  const total = data.reduce((n, r) => n + r.seconds, 0);
  if (!total) return <p className="text-xs text-muted-foreground">No study in this period.</p>;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-48 shrink-0" aria-label="Time by section chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="seconds" nameKey="label" innerRadius={64} outerRadius={92} paddingAngle={3} cornerRadius={6} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: number, _n: string, item: { payload?: { label?: string } }) => [formatDuration(v), item.payload?.label ?? ""]} contentStyle={TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none text-foreground">{formatDuration(total)}</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="w-full space-y-1.5">
        {data.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate text-foreground">{r.label}</span>
            <span className="shrink-0 text-muted-foreground">{formatDuration(r.seconds)}</span>
            <span className="w-9 shrink-0 text-right font-semibold text-foreground">{Math.round((r.seconds / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Time by subject as a ranked horizontal bar chart, one colour per subject, with the time at the end of each bar. */
export function SubjectBars({ rows }: { rows: { label: string; seconds: number }[] }) {
  const data = rows.filter((r) => r.seconds > 0).sort((a, b) => b.seconds - a.seconds).map((r) => ({ ...r, minutes: Math.round(r.seconds / 60) }));
  if (!data.length) return <p className="text-xs text-muted-foreground">No study in this period.</p>;
  return (
    <div className="w-full text-muted-foreground" style={{ height: data.length * 40 + 12 }} aria-label="Time by subject chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 56, bottom: 0, left: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false}
            tickFormatter={(v: string) => (v.length > 14 ? `${v.slice(0, 13)}…` : v)} />
          <Tooltip cursor={{ fill: "#6366f1", fillOpacity: 0.07 }} formatter={(v: number) => [formatDuration(v * 60), "Study time"]} contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="minutes" radius={[0, 8, 8, 0]} background={{ fill: "#e2e8f0", fillOpacity: 0.45, radius: 8 }}>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
            <LabelList dataKey="minutes" position="right" formatter={(v: number) => formatDuration(v * 60)} style={{ fontSize: 11, fontWeight: 600, fill: "currentColor" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type TimeVsGainPoint = { name: string; minutes: number; improvement: number; flagged: boolean };

/** Each dot is a student: time studied against improvement. The shaded corner is the "needs help" zone. */
export function TimeVsGainChart({ points }: { points: TimeVsGainPoint[] }) {
  // Round both axes to clean steps (30 min, 5 pts) so the tick labels are readable numbers.
  const maxMinutes = Math.max(...points.map((p) => p.minutes), 60);
  const xMax = Math.ceil((maxMinutes + 10) / 30) * 30;
  const yMin = Math.floor((Math.min(...points.map((p) => p.improvement), 0) - 5) / 5) * 5;
  const yMax = Math.ceil((Math.max(...points.map((p) => p.improvement), 0) + 5) / 5) * 5;
  return (
    <div>
      <div className="h-64 w-full text-muted-foreground" aria-label="Time against improvement chart">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#cbd5e1" strokeOpacity={0.5} />
            <XAxis type="number" dataKey="minutes" name="Study time" unit=" min" domain={[0, xMax]} tickCount={6} allowDecimals={false} tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey="improvement" name="Improvement" unit=" pts" domain={[yMin, yMax]} tickCount={6} allowDecimals={false} tick={{ fontSize: 11, fill: "currentColor" }} tickLine={false} axisLine={false} />
            <ZAxis range={[90, 90]} />
            <ReferenceArea x1={60} x2={xMax} y1={yMin} y2={2} fill="#f43f5e" fillOpacity={0.1} stroke="#f43f5e" strokeOpacity={0.3} strokeDasharray="4 4" ifOverflow="hidden" />
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="5 4" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "#94a3b8" }}
              contentStyle={TOOLTIP_STYLE}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as TimeVsGainPoint | undefined;
                if (!active || !p) return null;
                return (
                  <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="mt-0.5 text-muted-foreground">{formatDuration(p.minutes * 60)} studied</p>
                    <p className={p.improvement > 2 ? "text-emerald-600" : p.improvement < 0 ? "text-rose-600" : "text-amber-600"}>{formatImprovement(p.improvement)}</p>
                  </div>
                );
              }}
            />
            <Scatter data={points.filter((p) => !p.flagged)} fill="#3b82f6" fillOpacity={0.85} stroke="#fff" strokeWidth={2} />
            <Scatter data={points.filter((p) => p.flagged)} fill="#f43f5e" fillOpacity={0.9} stroke="#fff" strokeWidth={2} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-blue-500" /> Studying and improving</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-rose-500" /> Needs help (an hour or more, 2 pts or less)</span>
      </div>
    </div>
  );
}

/** The topics most students are weak or at risk in, as bars (weak in red, at risk in amber). */
export function WeakTopicBars({ items }: { items: { name: string; subjectName: string | null; weakStudents: number; atRiskStudents: number }[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">No weak topics found.</p>;
  const max = Math.max(1, ...items.map((w) => w.weakStudents + w.atRiskStudents));
  return (
    <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
      {items.map((w) => (
        <li key={`${w.subjectName}-${w.name}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{w.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{w.subjectName ?? "—"}</span>
            </span>
            <span className="shrink-0 text-[11px]">
              <span className="font-semibold text-rose-600">{w.weakStudents} weak</span>
              {w.atRiskStudents > 0 && <span className="text-amber-600"> · {w.atRiskStudents} at risk</span>}
            </span>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${w.weakStudents} weak, ${w.atRiskStudents} at risk`}>
            <span className="h-full bg-rose-500" style={{ width: `${(w.weakStudents / max) * 100}%` }} />
            <span className="h-full bg-amber-400" style={{ width: `${(w.atRiskStudents / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const AVATAR_TONES = ["from-blue-500 to-indigo-600", "from-emerald-500 to-teal-600", "from-violet-500 to-purple-600", "from-rose-500 to-pink-600", "from-amber-500 to-orange-600", "from-cyan-500 to-sky-600"];

/** Initials on a colour picked from the name, so the same student always has the same colour. */
export function InitialAvatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const initials = name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white shadow-sm", AVATAR_TONES[hash % AVATAR_TONES.length])}>
      {initials}
    </span>
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
