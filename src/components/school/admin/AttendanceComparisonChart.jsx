import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users2 } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const MotionCard = motion(Card);

const ROLES = [
  { key: 'Students', color: '#2563EB', dot: 'bg-blue-600' },
  { key: 'Teachers', color: '#8B5CF6', dot: 'bg-violet-600' },
];

/**
 * Today's student vs teacher attendance as concentric radial gauges — same
 * real data as before, just given the visual weight of a chart instead of
 * two flat progress bars.
 */
export default function AttendanceComparisonChart({ studentPct = 0, teacherPct = 0, className }) {
  const data = useMemo(() => {
    const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));
    return [
      { name: 'Teachers', value: clamp(teacherPct), fill: ROLES[1].color },
      { name: 'Students', value: clamp(studentPct), fill: ROLES[0].color },
    ];
  }, [studentPct, teacherPct]);

  const overall = Math.round((data[0].value + data[1].value) / 2);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className={cn(
        "border-none shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-white dark:bg-slate-900 flex min-w-0 flex-col overflow-hidden",
        className
      )}
      style={{
        padding: 'clamp(0.85rem, 1.15vw, 1.1rem)',
        borderRadius: 'clamp(1.25rem, 1.8vw, 1.75rem)',
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h3
            className="font-display font-bold text-slate-800 dark:text-white"
            style={{ fontSize: 'clamp(0.9rem, 1.1vw, 1.05rem)' }}
          >
            Attendance by Role
          </h3>
          <p
            className="font-semibold text-slate-400 dark:text-slate-500"
            style={{ fontSize: 'clamp(9px, 0.7vw, 11px)' }}
          >
            Today · students vs teachers
          </p>
        </div>
        <Users2 className="text-slate-300 dark:text-slate-600 shrink-0" style={{ width: 'clamp(1.1rem, 1.3vw, 1.25rem)', height: 'clamp(1.1rem, 1.3vw, 1.25rem)' }} />
      </div>

      <div className="relative min-w-0 flex-1 min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="55%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            barCategoryGap="18%"
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: 'rgba(148,163,184,0.12)' }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white">{overall}%</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg Today</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-4">
        {ROLES.map((role, i) => (
          <div key={role.key} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', role.dot)} />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{role.key}</span>
            <span className="text-[11px] font-black text-slate-900 dark:text-white">{data.find(d => d.name === role.key)?.value}%</span>
          </div>
        ))}
      </div>
    </MotionCard>
  );
}
