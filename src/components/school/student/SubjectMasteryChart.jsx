// SubjectMasteryChart.jsx — student subject-wise average score as a bar chart (Analytics → Subject Mastery).
// Data: [{ subjectName, accuracy }] where accuracy is an average percentage (0-100).
// Same chart stack as ScoreTrendChart: Recharts inside the shadcn ChartContainer, hex colours.

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// One colour per subject.
const SUBJECT_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e',
  '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
];

const shorten = (name, max) => {
  const text = String(name || '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

export default function SubjectMasteryChart({ data = [], height = 300, compact = false }) {
  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data.filter((d) => d?.subjectName) : [];
    // Alphabetical position decides the colour, so a subject keeps it whatever order the list arrives in.
    const order = list.map((d) => d.subjectName).sort((a, b) => String(a).localeCompare(String(b)));
    return list.map((d) => ({
      subjectName: d.subjectName,
      accuracy: Math.max(0, Math.min(100, Number(d.accuracy) || 0)),
      fill: SUBJECT_COLORS[order.indexOf(d.subjectName) % SUBJECT_COLORS.length],
    }));
  }, [data]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs sm:text-sm text-slate-500" style={{ height }}>
        Not enough data to calculate mastery.
      </div>
    );
  }

  // Many subjects (or a narrow screen): tilt the labels so they don't collide.
  const crowded = rows.length > (compact ? 3 : 7);
  const config = { accuracy: { label: 'Average score', color: SUBJECT_COLORS[0] } };

  return (
    <ChartContainer config={config} className="w-full aspect-auto" style={{ height }}>
      <BarChart data={rows} margin={{ top: 22, right: 8, left: crowded ? 8 : -12, bottom: crowded ? 40 : 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="subjectName"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={crowded ? -30 : 0}
          textAnchor={crowded ? 'end' : 'middle'}
          tickFormatter={(v) => shorten(v, crowded ? 12 : 16)}
        />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} unit="%" />
        <ChartTooltip
          cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, p) => p?.[0]?.payload?.subjectName || ''}
              formatter={(v) => `${Math.round(Number(v))}% average`}
            />
          }
        />
        <Bar dataKey="accuracy" radius={[10, 10, 0, 0]} maxBarSize={56} isAnimationActive>
          {rows.map((row) => (
            <Cell key={row.subjectName} fill={row.fill} />
          ))}
          <LabelList
            dataKey="accuracy"
            position="top"
            offset={6}
            formatter={(v) => `${Math.round(Number(v))}%`}
            className="fill-slate-700 dark:fill-slate-200"
            style={{ fontSize: 12, fontWeight: 800 }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
