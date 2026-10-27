import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BookOpen, CheckCircle2, Clock, Flame, Loader2, Printer, TrendingUp } from "lucide-react";
import { learningReportsApi, type ReportPeriod, type ReportSubject, type TrendGranularity } from "@/lib/api/learning-reports";
import { apiErrorMessage } from "@/lib/api/learning-path";
import { useSetBreadcrumbLabel } from "@/components/school/breadcrumbs/BreadcrumbContext";
import { cn } from "@/lib/utils";
import { classLabel, formatDay, formatDuration, formatImprovement, PERIOD_LABEL, SECTION_LABEL } from "./report-format";
import { Card, LevelChip, PeriodToggle, SectionDonut, StatTile, SubjectBars, TrendChart } from "./ReportParts";

// The trend chart's bar granularity follows the selected period automatically
// (a year of daily bars is unreadable) instead of a second, redundant toggle.
const TREND_FOR_PERIOD: Record<ReportPeriod, TrendGranularity> = { today: "day", week: "day", month: "day", year: "month" };

const PATH_STATUS: Record<string, string> = { active: "In progress", completed: "Completed", needs_teacher: "Needs teacher help", suggested: "Suggested" };

function Chips({ label, items, tone }: { label: string; items: { name: string; mastery: number | null; chapterName?: string | null }[]; tone: "weak" | "atRisk" }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((i, k) => (
          <span key={`${i.name}-${k}`} title={i.chapterName ?? undefined}
            className={cn("rounded-full border px-2 py-0.5 text-xs",
              tone === "weak" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300")}>
            {i.name}{i.mastery !== null && <span className="opacity-70"> · {Math.round(i.mastery)}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function SubjectBlock({ s }: { s: ReportSubject }) {
  const nothingWeak = !s.weakChapters.length && !s.atRiskChapters.length && !s.weakTopics.length && !s.atRiskTopics.length;
  return (
    <Card title={s.name} subtitle={`${formatDuration(s.seconds)} in this period · improvement ${formatImprovement(s.improvement)}`}>
      <div className="space-y-3">
        {nothingWeak ? <p className="text-xs text-emerald-700 dark:text-emerald-300">Nothing weak or at risk in this subject.</p> : (
          <>
            <Chips label="Weak chapters" items={s.weakChapters} tone="weak" />
            <Chips label="At-risk chapters" items={s.atRiskChapters} tone="atRisk" />
            <Chips label="Weak topics" items={s.weakTopics} tone="weak" />
            <Chips label="At-risk topics" items={s.atRiskTopics} tone="atRisk" />
          </>
        )}
        {s.focusAreas.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Focus areas</p>
            <p className="mt-1 text-xs text-foreground">{s.focusAreas.join(" · ")}</p>
          </div>
        )}
        {s.paths.length > 0 && (
          <div className="overflow-x-auto">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Topics studied: time against improvement</p>
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-1.5 pr-2 font-medium">Topic</th>
                  <th className="py-1.5 pr-2 font-medium">Status</th>
                  <th className="py-1.5 pr-2 font-medium">Time</th>
                  <th className="py-1.5 pr-2 font-medium">Before → now</th>
                  <th className="py-1.5 font-medium">Improvement</th>
                </tr>
              </thead>
              <tbody>
                {s.paths.map((p, k) => (
                  <tr key={`${p.topicName}-${k}`} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-2"><span className="font-medium text-foreground">{p.topicName}</span>{p.chapterName && <span className="block text-[11px] text-muted-foreground">{p.chapterName}</span>}</td>
                    <td className="py-1.5 pr-2">{PATH_STATUS[p.status] ?? p.status}{p.round > 1 && <span className="text-muted-foreground"> · round {p.round}</span>}</td>
                    <td className="py-1.5 pr-2">{formatDuration(p.seconds)}</td>
                    <td className="py-1.5 pr-2">{p.baseline !== null ? `${Math.round(p.baseline)}%` : "—"} → {p.latest !== null ? `${Math.round(p.latest)}%` : "—"}</td>
                    <td className={cn("py-1.5", p.improvement !== null && p.improvement > 2 ? "text-emerald-600" : p.improvement !== null ? "text-rose-600" : "text-muted-foreground")}>
                      {formatImprovement(p.improvement)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * One student's study-planner report, for an admin, a teacher (their subjects)
 * or a parent. `embedded`: shown as a tab inside a page that already names the
 * student (admin student profile, teacher student report, parent child report).
 */
export default function StudentStudyReport({ studentId, backHref, backLabel, embedded = false }: { studentId: string; backHref?: string; backLabel?: string; embedded?: boolean }) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const trend = TREND_FOR_PERIOD[period];
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["learning-report", "student", studentId, period, trend],
    queryFn: () => learningReportsApi.student(studentId, { period, trend }),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
    enabled: !!studentId,
  });
  useSetBreadcrumbLabel(embedded ? undefined : data?.student.name);

  const back = !embedded && backHref && (
    <Link to={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground print:hidden">
      <ArrowLeft className="size-4" /> {backLabel ?? "Back"}
    </Link>
  );

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Building the report…</div>;
  }
  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm text-muted-foreground">{apiErrorMessage(error, "This report could not be loaded.")}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => refetch()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
          {back}
        </div>
      </div>
    );
  }

  const s = data.summary;
  return (
    <div className={cn("space-y-4", !embedded && "p-4 sm:p-6")}>
      {back}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {embedded ? (
            <h2 className="text-lg font-bold text-foreground">AI Study Planner</h2>
          ) : (
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{data.student.name}</h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {classLabel(data.student)}{data.student.rollNo && ` · Roll ${data.student.rollNo}`} · Study planner, {PERIOD_LABEL[period].toLowerCase()}
            {isFetching && <Loader2 className="ml-2 inline size-3 animate-spin" />}
          </p>
          {!data.allSubjects && <p className="mt-1 text-xs text-muted-foreground">Showing the subjects you teach this student.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <PeriodToggle value={period} onChange={setPeriod} />
          <button type="button" onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
            <Printer className="size-4" /> Print / save as PDF
          </button>
        </div>
      </header>

      {(s.inactive || s.effortWithoutGain) && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {s.inactive && <>No study in the last 7 days{s.lastActiveDay ? ` (last on ${formatDay(s.lastActiveDay)})` : ""}. </>}
            {s.effortWithoutGain && <>Putting in time ({formatDuration(s.seconds)}) without improving much ({formatImprovement(s.improvement)}): may need help with how to study these topics.</>}
          </p>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6" aria-label="Summary">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Engagement</p>
          <p className="mt-1 text-2xl font-bold leading-none text-foreground">{s.engagementScore}<span className="text-sm font-normal text-muted-foreground"> / 100</span></p>
          <div className="mt-1.5"><LevelChip level={s.engagementLevel} /></div>
        </div>
        <StatTile icon={Clock} label="Study time" value={formatDuration(s.seconds)} hint={`${s.activeDays} active day${s.activeDays === 1 ? "" : "s"}`} />
        <StatTile icon={Flame} label="Streak" value={`${s.streakDays} day${s.streakDays === 1 ? "" : "s"}`} hint={`Last studied: ${formatDay(s.lastActiveDay)}`} />
        <StatTile icon={CheckCircle2} label="Steps finished" value={String(s.stepsDone)} hint="Videos, notes, quizzes, assessments" />
        <StatTile icon={TrendingUp} label="Improvement" value={formatImprovement(s.improvement)} hint="Score after a topic's path vs before" tone={s.improvement === null ? "default" : s.improvement > 2 ? "good" : "warn"} />
        <StatTile icon={BookOpen} label="Topics" value={`${s.topicsCompleted} / ${s.topicsStarted}`} hint="Completed / started" />
      </section>

      <div className="space-y-4">
        <Card title="Usage trend">
          <TrendChart trend={data.trend} granularity={data.granularity} />
        </Card>
        <div className="grid gap-4 md:grid-cols-2 md:items-start lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Card title="Time by section"><SectionDonut rows={data.bySection.map((r) => ({ label: SECTION_LABEL[r.section] ?? r.section, seconds: r.seconds }))} /></Card>
          <Card title="Time by subject"><SubjectBars rows={data.bySubject.map((r) => ({ label: r.name, seconds: r.seconds }))} /></Card>
        </div>
      </div>

      <h2 className="pt-2 text-base font-semibold text-foreground">Weak areas, focus areas and progress by subject</h2>
      {data.subjects.length ? (
        <div className="grid gap-4 xl:grid-cols-2">{data.subjects.map((sub) => <SubjectBlock key={sub.subjectId} s={sub} />)}</div>
      ) : (
        <Card><p className="text-sm text-muted-foreground">No study-planner data yet. Weak areas appear once assessments, assignments or games are marked.</p></Card>
      )}
    </div>
  );
}
