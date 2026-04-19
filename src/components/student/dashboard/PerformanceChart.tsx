import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-bold">
            {p.value}
            {p.name === "score" || p.name === "accuracy" ? "%" : ""}
          </span>
        </p>
      ))}
    </div>
  );
};

export interface PerformanceChartProps {
  subjectAccuracy?: Record<string, number>;
  totalTestsTaken?: number;
  overallAccuracy?: number;
}

export default function PerformanceChart({
  subjectAccuracy,
  totalTestsTaken = 0,
  overallAccuracy = 0,
}: PerformanceChartProps) {
  const weeklyData = useMemo(() => {
    const s = Math.min(100, Math.max(0, Math.round(overallAccuracy)));
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({ day, score: s, questions: totalTestsTaken }));
  }, [overallAccuracy, totalTestsTaken]);

  const subjectData = useMemo(() => {
    const entries = Object.entries(subjectAccuracy ?? {});
    if (!entries.length) return [];
    return entries.map(([subject, acc]) => ({
      subject,
      accuracy: Math.min(100, Math.max(0, Math.round(Number(acc) || 0))),
      attempted: totalTestsTaken,
    }));
  }, [subjectAccuracy, totalTestsTaken]);

  return (
    <Tabs defaultValue="weekly">
      <TabsList className="mb-4 h-8">
        <TabsTrigger value="weekly" className="text-xs">Weekly Progress</TabsTrigger>
        <TabsTrigger value="subject" className="text-xs">By Subject</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <p className="text-[11px] text-muted-foreground mb-2">
          Overall accuracy trend (updates as your profile refreshes). Finer weekly breakdown can be added from test history later.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="score" name="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </TabsContent>

      <TabsContent value="subject">
        {subjectData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Subject-wise accuracy will show here after you attempt chapter tests and mock tests.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="accuracy" name="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="attempted" name="attempted" fill="#a5b4fc" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </TabsContent>
    </Tabs>
  );
}
