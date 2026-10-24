import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, Loader2, Rocket, TrendingDown, TrendingUp } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { learningReportsApi, type ReportOverview } from "@/lib/api/learning-reports";
import { cn } from "@/lib/utils";
import { bucketLabel, formatDuration, formatImprovement } from "./report-format";

type Students = ReportOverview["students"];

/**
 * The planner's numbers for the dashboard. Students who never opened the
 * planner are counted as not started (adoption), not as problems: engagement,
 * improvement and "need attention" describe only the students who use it.
 */
export function plannerSnapshot(students: Students) {
  const started = students.filter((s) => s.lastActiveDay !== null || s.topicsStarted > 0);
  const activeNow = started.filter((s) => s.seconds > 0);
  const measured = started.filter((s) => s.improvement !== null);
  const levels = { high: 0, medium: 0, low: 0 };
  for (const s of activeNow) levels[s.engagementLevel] += 1;
  const stopped = started.filter((s) => s.inactive).length;
  const lowEngagement = started.filter((s) => !s.inactive && s.engagementLevel === "low").length;
  const noGain = started.filter((s) => s.effortWithoutGain).length;
  return {
    total: students.length,
    started: started.length,
    activeNow: activeNow.length,
    engagement: activeNow.length ? Math.round(activeNow.reduce((sum, s) => sum + s.engagementScore, 0) / activeNow.length) : null,
    levels,
    improvement: measured.length ? Math.round((measured.reduce((sum, s) => sum + (s.improvement as number), 0) / measured.length) * 10) / 10 : null,
    measured: measured.length,
    attention: { stopped, lowEngagement, noGain, total: started.filter((s) => s.inactive || s.engagementLevel === "low" || s.effortWithoutGain).length },
  };
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
/** "12%", or "<1%" when a few students out of many have started (never a misleading "0%"). */
export const shareLabel = (part: number, whole: number) => (part > 0 && pct(part, whole) === 0 ? "<1%" : `${pct(part, whole)}%`);

function Ring({ value, max, color, children, label }: { value: number; max: number; color: string; children: React.ReactNode; label: string }) {
  return (
    <div className="relative size-20 shrink-0" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="76%" outerRadius="100%" data={[{ value: max ? Math.min(value, max) : 0 }]} startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, Math.max(1, max)]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: "hsl(var(--muted))" }} fill={color} isAnimationActive={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}

function Tile({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/70 bg-background/60 p-4", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** A thin bar split into coloured parts, with a legend underneath. */
function SplitBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        {total > 0 && parts.filter((p) => p.value > 0).map((p) => <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {parts.map((p) => (
          <li key={p.label} className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full" style={{ background: p.color }} />{p.label} <span className="font-semibold text-foreground">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The admin dashboard's study-planner snapshot: charts and headline figures
 * only, over the last 30 days with a 12-week activity trend. Each student's
 * detail is in Students → a student → Study Planner.
 */
export default function StudyPlannerDashboardCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["learning-report", "dashboard"],
    queryFn: () => learningReportsApi.overview({ period: "month", trend: "week" }),
    staleTime: 5 * 60_000,
  });

  if (isError) return null; // the dashboard stays clean if the report is unavailable

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm" aria-label="AI Study Planner overview">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary"><BrainCircuit className="size-5" /></span>
          <div>
            <h2 className="text-base font-semibold text-foreground">AI Study Planner</h2>
            <p className="text-xs text-muted-foreground">How students are using it across the school</p>
          </div>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Last 30 days</span>
      </header>

      {isLoading || !data ? (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</div>
      ) : (
        <Snapshot data={data} />
      )}
    </section>
  );
}

function Snapshot({ data }: { data: ReportOverview }) {
  const s = plannerSnapshot(data.students);

  if (!s.started) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-muted/40 p-5 text-sm text-muted-foreground">
        <Rocket className="size-5 shrink-0 text-primary" />
        No student has started the AI Study Planner yet. Activity, engagement and improvement appear here once they do.
      </div>
    );
  }

  const adoption = shareLabel(s.started, s.total);
  const engagementColor = s.engagement === null ? "#94a3b8" : s.engagement >= 70 ? "#10b981" : s.engagement >= 40 ? "#f59e0b" : "#f43f5e";
  const trend = data.trend.map((p) => ({ label: bucketLabel(p.period, data.granularity), minutes: Math.round(p.seconds / 60), students: p.activeStudents }));
  const weak = data.weakTopics.slice(0, 5);
  const weakMax = Math.max(1, ...weak.map((w) => w.weakStudents + w.atRiskStudents));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile title="Adoption">
          <div className="flex items-center gap-3">
            <Ring value={s.started} max={s.total} color="hsl(var(--primary))" label={`${adoption} of students have started`}>
              <span className="text-lg font-bold text-foreground">{adoption}</span>
            </Ring>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none text-foreground">{s.started}<span className="text-sm font-normal text-muted-foreground"> / {s.total}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">students have started</p>
              <p className="mt-1 text-xs"><span className="font-semibold text-foreground">{s.activeNow}</span> <span className="text-muted-foreground">studied this month</span></p>
            </div>
          </div>
        </Tile>

        <Tile title="Engagement">
          <div className="flex items-center gap-3">
            <Ring value={s.engagement ?? 0} max={100} color={engagementColor} label={`Average engagement ${s.engagement ?? "not available"}`}>
              <span className="text-lg font-bold text-foreground">{s.engagement ?? "—"}</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">average score of students who studied this month</p>
              <div className="mt-2">
                <SplitBar parts={[
                  { label: "High", value: s.levels.high, color: "#10b981" },
                  { label: "Medium", value: s.levels.medium, color: "#f59e0b" },
                  { label: "Low", value: s.levels.low, color: "#f43f5e" },
                ]} />
              </div>
            </div>
          </div>
        </Tile>

        <Tile title="Improvement">
          <div className="flex items-center gap-3">
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl",
              s.improvement === null ? "bg-muted text-muted-foreground" : s.improvement > 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}>
              {s.improvement !== null && s.improvement <= 0 ? <TrendingDown className="size-6" /> : <TrendingUp className="size-6" />}
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none text-foreground">{s.improvement === null ? "—" : formatImprovement(s.improvement)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.measured ? `average, across ${s.measured} student${s.measured === 1 ? "" : "s"} measured` : "measured after a topic's assessment"}
              </p>
            </div>
          </div>
        </Tile>

        <Tile title="Need attention">
          <div className="flex items-center gap-3">
            <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", s.attention.total ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600")}>
              <AlertTriangle className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold leading-none text-foreground">{s.attention.total}<span className="text-sm font-normal text-muted-foreground"> of {s.started} started</span></p>
              <div className="mt-2">
                <SplitBar parts={[
                  { label: "Stopped", value: s.attention.stopped, color: "#94a3b8" },
                  { label: "Low engagement", value: s.attention.lowEngagement, color: "#f43f5e" },
                  { label: "No gain", value: s.attention.noGain, color: "#f59e0b" },
                ]} />
              </div>
            </div>
          </div>
        </Tile>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Tile title="Weekly activity" className="lg:col-span-2">
          <div className="h-52" aria-label="Weekly activity chart">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={16} tickLine={false} axisLine={false} />
                <YAxis yAxisId="minutes" tick={{ fontSize: 10 }} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis yAxisId="students" orientation="right" hide allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }}
                  formatter={(v: number, n: string) => (n === "minutes" ? [formatDuration(v * 60), "Study time"] : [v, "Students active"])} />
                <Bar yAxisId="minutes" dataKey="minutes" fill="hsl(var(--primary))" fillOpacity={0.85} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Line yAxisId="students" dataKey="students" type="monotone" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
            <li className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-primary" />Study time</li>
            <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-emerald-500" />Students active</li>
          </ul>
        </Tile>

        <Tile title="Most common weak topics">
          {weak.length ? (
            <ol className="space-y-3">
              {weak.map((w, i) => {
                const n = w.weakStudents + w.atRiskStudents;
                return (
                  <li key={`${w.subjectName}-${w.name}`}>
                    <div className="flex items-start justify-between gap-2 text-xs">
                      <span className="min-w-0">
                        <span className="mr-1 font-semibold text-muted-foreground">{i + 1}.</span>
                        <span className="font-medium text-foreground">{w.name}</span>
                        {w.subjectName && <span className="block pl-4 text-[11px] text-muted-foreground">{w.subjectName}</span>}
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">{n} <span className="font-normal text-muted-foreground">student{n === 1 ? "" : "s"}</span></span>
                    </div>
                    <div className="ml-4 mt-1 h-1.5 rounded-full bg-muted">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${Math.max(8, (n / weakMax) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : <p className="text-xs text-muted-foreground">No weak topics found.</p>}
        </Tile>
      </div>
    </div>
  );
}
