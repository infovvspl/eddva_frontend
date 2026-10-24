import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownUp, LayoutDashboard, Loader2, Printer, Search, Users } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { learningReportsApi, type ReportPeriod, type ReportStudentRow, type TrendGranularity } from "@/lib/api/learning-reports";
import { apiErrorMessage } from "@/lib/api/learning-path";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { cn } from "@/lib/utils";
import { classLabel, formatDuration, formatImprovement, PERIOD_LABEL } from "./report-format";
import { Card, LevelChip, lastSeen, PeriodToggle, StatTile, StudentList, timeAndGain, TrendChart, TrendToggle } from "./ReportParts";

type SortKey = "name" | "time" | "engagement" | "improvement" | "weak";

const SORTS: Record<SortKey, { label: string; compare: (a: ReportStudentRow, b: ReportStudentRow) => number }> = {
  name: { label: "Name", compare: (a, b) => a.name.localeCompare(b.name) },
  time: { label: "Study time", compare: (a, b) => b.seconds - a.seconds },
  engagement: { label: "Engagement", compare: (a, b) => b.engagementScore - a.engagementScore },
  improvement: { label: "Improvement", compare: (a, b) => (b.improvement ?? -999) - (a.improvement ?? -999) },
  weak: { label: "Weak topics", compare: (a, b) => b.weakTopics + b.atRiskTopics - (a.weakTopics + a.atRiskTopics) },
};

const DEFAULT_PAGE_SIZE = 10;

/**
 * The study-planner report for a group of students: the sections and subjects
 * a teacher teaches (a tab of the teacher's Reports page). `studentHref` opens
 * a student's own page, given their user id. `embedded`: inside a page that
 * has its own title.
 */
export default function StudyPlannerOverview({ studentHref, embedded = false }: { studentHref: (userId: string) => string; embedded?: boolean }) {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [trend, setTrend] = useState<TrendGranularity>("day");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = { period, trend, classId, sectionId, subjectId };
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["learning-report", "overview", params],
    queryFn: () => learningReportsApi.overview(params),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const sections = useMemo(() => {
    const classes = data?.filters.classes ?? [];
    return (classId ? classes.filter((c) => c.id === classId) : classes).flatMap((c) => c.sections.map((s) => ({ ...s, className: c.name })));
  }, [data, classId]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.students ?? [])
      .filter((s) => !q || s.name.toLowerCase().includes(q) || (s.rollNo ?? "").toLowerCase().includes(q))
      .sort(SORTS[sort].compare);
  }, [data, search, sort]);

  // Back to page 1 whenever the roster being paged through changes shape.
  useEffect(() => {
    setStudentPage(1);
  }, [search, sort, studentPageSize, data]);

  const totalPages = Math.max(1, Math.ceil(rows.length / studentPageSize));
  const pagedRows = useMemo(
    () => rows.slice((studentPage - 1) * studentPageSize, studentPage * studentPageSize),
    [rows, studentPage, studentPageSize],
  );

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Building the report…</div>;
  }
  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="size-6 text-amber-500" />
        <p className="text-sm text-muted-foreground">{apiErrorMessage(error, "The report could not be loaded.")}</p>
        <button type="button" onClick={() => refetch()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
      </div>
    );
  }

  const t = data.totals;
  const scatter = data.students
    .filter((s) => s.improvement !== null && s.seconds > 0)
    .map((s) => ({ name: s.name, minutes: Math.round(s.seconds / 60), improvement: s.improvement as number, flagged: s.effortWithoutGain }));

  return (
    <div className={cn("space-y-4", !embedded && "p-4 sm:p-6")}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {embedded ? (
            <h2 className="text-lg font-bold text-foreground">AI Study Planner</h2>
          ) : (
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">Study planner report</h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {data.viewer === "teacher" ? "Your students and subjects. " : ""}
            {PERIOD_LABEL[period]}{data.from !== data.to && <> · {data.from} to {data.to}</>}
            {isFetching && <Loader2 className="ml-2 inline size-3 animate-spin" />}
          </p>
        </div>
        <button type="button" onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted print:hidden">
          <Printer className="size-4" /> Print / save as PDF
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <select aria-label="Class" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All classes</option>
          {data.filters.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All sections</option>
          {sections.map((s) => <option key={s.id} value={s.id}>{classId ? s.name : `${s.className} · ${s.name}`}</option>)}
        </select>
        <select aria-label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All subjects</option>
          {data.filters.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="print:hidden">
          <TabsTrigger value="overview" className="gap-1.5"><LayoutDashboard className="size-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="students" className="gap-1.5"><Users className="size-3.5" /> Students ({rows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6" aria-label="Summary">
            <StatTile label="Students" value={String(t.students)} hint={`${t.activeStudents} studied in this period`} />
            <StatTile label="Total study time" value={formatDuration(t.seconds)} hint={`${formatDuration(t.averageSecondsPerActiveStudent)} per active student`} />
            <StatTile label="Average engagement" value={`${t.averageEngagement} / 100`} tone={t.averageEngagement >= 70 ? "good" : t.averageEngagement >= 40 ? "warn" : "bad"} />
            <StatTile label="Average improvement" value={formatImprovement(t.averageImprovement)} hint="Score after a topic's path vs before" tone={t.averageImprovement === null ? "default" : t.averageImprovement > 2 ? "good" : "warn"} />
            <StatTile label="Inactive" value={String(t.inactive)} hint="No study in the last 7 days" tone={t.inactive ? "bad" : "good"} />
            <StatTile label="Time without improvement" value={String(t.effortWithoutGain)} hint="An hour or more, 2 pts or less" tone={t.effortWithoutGain ? "warn" : "good"} />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Usage trend" subtitle="Study time, and how many students studied" action={<span className="print:hidden"><TrendToggle value={trend} onChange={setTrend} /></span>}>
              <TrendChart trend={data.trend} granularity={data.granularity} showStudents />
            </Card>
            <Card title="Time against improvement" subtitle="Each dot is a student whose improvement has been measured. Lots of time with little improvement (bottom right) needs help.">
              {scatter.length ? (
                <div className="h-56 w-full" aria-label="Time against improvement chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 4, right: 12, bottom: 4, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" dataKey="minutes" name="Study time" unit=" min" tick={{ fontSize: 11 }} />
                      <YAxis type="number" dataKey="improvement" name="Improvement" unit=" pts" tick={{ fontSize: 11 }} />
                      <ZAxis range={[60, 60]} />
                      <ReferenceLine y={0} className="stroke-muted-foreground" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ fontSize: 12, borderRadius: 12 }}
                        formatter={(v: number, n: string) => (n === "Study time" ? [formatDuration(v * 60), n] : [formatImprovement(v), n])}
                        labelFormatter={() => ""} />
                      <Scatter data={scatter.filter((s) => !s.flagged)} fill="hsl(var(--primary))" />
                      <Scatter data={scatter.filter((s) => s.flagged)} fill="#f43f5e" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No student has finished a topic's assessment yet, so improvement has not been measured.</p>
              )}
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card title={`Inactive (${data.lists.inactive.length})`} subtitle="No study in the last 7 days">
              <StudentList items={data.lists.inactive} studentHref={studentHref} empty="Everyone has studied this week." detail={lastSeen} />
            </Card>
            <Card title={`Low engagement (${data.lists.lowEngagement.length})`} subtitle="Studying, but an engagement score under 40">
              <StudentList items={data.lists.lowEngagement} studentHref={studentHref} empty="No one with low engagement." detail={(i) => `Score ${i.engagementScore}`} />
            </Card>
            <Card title={`Time without improvement (${data.lists.effortWithoutGain.length})`} subtitle="An hour or more, but 2 pts or less better">
              <StudentList items={data.lists.effortWithoutGain} studentHref={studentHref} empty="No one is stuck right now." detail={timeAndGain} />
            </Card>
            <Card title="Most common weak topics" subtitle="Students weak or at risk in each">
              {data.weakTopics.length ? (
                <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
                  {data.weakTopics.map((w) => (
                    <li key={`${w.subjectName}-${w.name}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{w.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{w.subjectName ?? "—"}</span>
                      </span>
                      <span className="shrink-0 text-right text-[11px]">
                        <span className="font-semibold text-rose-600">{w.weakStudents} weak</span>
                        {w.atRiskStudents > 0 && <span className="text-amber-600"> · {w.atRiskStudents} at risk</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-muted-foreground">No weak topics found.</p>}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students">
          <Card title={`Students (${rows.length})`}
            action={
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <label className="flex h-8 items-center gap-1.5 rounded-xl border border-border px-2">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or roll no" aria-label="Search students"
                    className="w-40 bg-transparent text-xs focus:outline-none" />
                </label>
                <label className="flex h-8 items-center gap-1.5 rounded-xl border border-border px-2 text-xs">
                  <ArrowDownUp className="size-3.5 text-muted-foreground" />
                  <select aria-label="Sort students" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="bg-transparent focus:outline-none">
                    {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k].label}</option>)}
                  </select>
                </label>
              </div>
            }>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Student</th>
                    <th className="py-2 pr-3 font-medium">Class</th>
                    <th className="py-2 pr-3 font-medium">Study time</th>
                    <th className="py-2 pr-3 font-medium">Active days</th>
                    <th className="py-2 pr-3 font-medium">Engagement</th>
                    <th className="py-2 pr-3 font-medium">Weak / at risk</th>
                    <th className="py-2 pr-3 font-medium">Improvement</th>
                    <th className="py-2 font-medium">Last studied</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((s) => (
                    <tr key={s.studentId} className="border-b border-border/60 last:border-0 hover:bg-muted/50">
                      <td className="py-2 pr-3">
                        <Link to={studentHref(s.userId)} className="font-medium text-primary hover:underline">{s.name}</Link>
                        {s.rollNo && <span className="ml-1 text-[11px] text-muted-foreground">#{s.rollNo}</span>}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{classLabel(s)}</td>
                      <td className="py-2 pr-3">{formatDuration(s.seconds)}</td>
                      <td className="py-2 pr-3">{s.activeDays}</td>
                      <td className="py-2 pr-3"><LevelChip level={s.engagementLevel} score={s.engagementScore} /></td>
                      <td className="py-2 pr-3">
                        <span className={cn(s.weakTopics && "font-semibold text-rose-600")}>{s.weakTopics}</span>
                        <span className="text-muted-foreground"> / </span>
                        <span className={cn(s.atRiskTopics && "text-amber-600")}>{s.atRiskTopics}</span>
                      </td>
                      <td className={cn("py-2 pr-3", s.effortWithoutGain && "font-semibold text-rose-600")}>
                        {formatImprovement(s.improvement)}
                      </td>
                      <td className={cn("py-2", s.inactive && "text-rose-600")}>{s.lastActiveDay ?? "Never"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!rows.length && <p className="py-6 text-center text-sm text-muted-foreground">No students match.</p>}
            </div>
            {rows.length > 0 && (
              <div className="print:hidden">
                <DataTablePagination page={studentPage} limit={studentPageSize} total={rows.length} totalPages={totalPages}
                  onPageChange={setStudentPage} onLimitChange={setStudentPageSize} />
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
