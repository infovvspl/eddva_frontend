import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, FlaskConical, CheckCircle2 } from "lucide-react";
import type { DailyActivity } from "@/lib/api/student";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}{p.name === "accuracy" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
};

export interface PerformanceChartProps {
  subjectAccuracy?: Record<string, number>;
  totalTestsTaken?: number;
  overallAccuracy?: number;
  weeklyActivity?: DailyActivity[];
}

export default function PerformanceChart({
  subjectAccuracy,
  totalTestsTaken = 0,
  overallAccuracy = 0,
  weeklyActivity = [],
}: PerformanceChartProps) {
  const weeklyData = useMemo(() => {
    const today = new Date();
    const activityMap = new Map(weeklyActivity.map((a) => [a.date, a]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().slice(0, 10);
      const act = activityMap.get(dateStr);
      return { day: DAY_NAMES[d.getDay()], tasks: act?.tasksCompleted ?? 0 };
    });
  }, [weeklyActivity]);

  const subjectData = useMemo(() => {
    return Object.entries(subjectAccuracy ?? {}).map(([subject, acc]) => ({
      subject,
      accuracy: Math.min(100, Math.max(0, Math.round(Number(acc) || 0))),
    }));
  }, [subjectAccuracy]);

  const hasWeeklyData = weeklyData.some((d) => d.tasks > 0);
  const hasSubjectData = subjectData.length > 0;
  const hasAnyData = hasWeeklyData || hasSubjectData;
  const maxTasks = Math.max(...weeklyData.map((d) => d.tasks), 1);

  // No data at all — show a stats summary instead of empty tabs
  if (!hasAnyData) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 py-4 px-2">
            <TrendingUp className="w-5 h-5 text-indigo-500 mb-1" />
            <div className="text-2xl font-bold text-indigo-700">{Math.round(overallAccuracy)}%</div>
            <div className="text-[11px] text-indigo-500 mt-0.5 text-center">Overall Accuracy</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-violet-50 border border-violet-100 py-4 px-2">
            <FlaskConical className="w-5 h-5 text-violet-500 mb-1" />
            <div className="text-2xl font-bold text-violet-700">{totalTestsTaken}</div>
            <div className="text-[11px] text-violet-500 mt-0.5 text-center">Tests Taken</div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 py-4 px-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-1" />
            <div className="text-2xl font-bold text-emerald-700">0</div>
            <div className="text-[11px] text-emerald-500 mt-0.5 text-center">Tasks This Week</div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Complete daily tasks and tests to unlock your weekly progress chart and subject breakdown.
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={hasWeeklyData ? "weekly" : "subject"}>
      <TabsList className="mb-4 h-8">
        <TabsTrigger value="weekly" className="text-xs">Weekly Progress</TabsTrigger>
        <TabsTrigger value="subject" className="text-xs">By Subject</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        {hasWeeklyData ? (
          <>
            <p className="text-[11px] text-muted-foreground mb-2">
              Activities completed per day (lectures + topics + tests).
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tasksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, Math.ceil(maxTasks / 2) * 2 + 2]} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tasks" name="tasks" stroke="#6366f1" strokeWidth={2.5} fill="url(#tasksGrad)" dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No activity this week yet — complete tasks in your daily plan to see the trend.
          </p>
        )}
      </TabsContent>

      <TabsContent value="subject">
        {hasSubjectData ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="accuracy" name="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Subject accuracy will appear after you attempt chapter or mock tests.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
