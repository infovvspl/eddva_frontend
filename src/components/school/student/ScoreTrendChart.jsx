// ScoreTrendChart.jsx — student score-over-time area chart (Improvement Metrics).
// Data: `scoreTrend` from GET /reports/my-analytics → [{ date, score, assessmentTitle, subjectName }]
// Colours follow the school-tenant chart convention (hex values, as in pages/school/admin/Analytics.jsx).

import React, { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const formatShort = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Change between the first and last point, e.g. +8 — null when there are fewer than two points. */
export function scoreTrendDelta(data) {
  if (!Array.isArray(data) || data.length < 2) return null;
  return Math.round(data[data.length - 1].score - data[0].score);
}

export default function ScoreTrendChart({ data = [], height = 260 }) {
  const points = useMemo(() => (Array.isArray(data) ? data.filter((p) => p?.date) : []), [data]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs sm:text-sm text-slate-500" style={{ height }}>
        Your score trend will appear after your results are published.
      </div>
    );
  }

  const config = { score: { label: 'Score', color: 'hsl(var(--primary))' } };

  return (
    <ChartContainer config={config} className="w-full aspect-auto" style={{ height }}>
      <LineChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShort} tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={(_, p) => (p?.[0]?.payload?.assessmentTitle ? `${p[0].payload.assessmentTitle} · ${formatShort(p[0].payload.date)}` : '')} formatter={(v) => `${Math.round(Number(v))}%`} />}
        />
        <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--color-score)' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ChartContainer>
  );
}
