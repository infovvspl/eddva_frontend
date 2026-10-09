import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

const MotionCard = motion(Card);

const RANK_STYLE = [
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
];

/** Top students by XP within the institute — real gamification data, no mock numbers. */
export default function TopStudentsWidget({ students = [], className }) {
  const navigate = useNavigate();

  return (
    <MotionCard
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.26 }}
      className={cn(
        "border-none shadow-[0_8px_30px_rgb(0,0,0,0.015)] bg-white dark:bg-slate-900 flex min-w-0 flex-col",
        className
      )}
      style={{ padding: 'clamp(0.85rem, 1.2vw, 1.25rem)', borderRadius: 'clamp(1.1rem, 1.6vw, 1.5rem)' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Star Students</h3>
          <p className="text-[11px] font-medium text-slate-400">Top XP earners this term</p>
        </div>
        <Award className="size-4.5 text-amber-500 shrink-0" />
      </div>

      {students.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-xs font-semibold text-slate-400">No XP activity recorded yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {students.map((s, i) => (
            <button
              key={s.userId}
              type="button"
              onClick={() => navigate(`/school/admin/students/${s.userId}`)}
              className="flex items-center gap-2.5 rounded-xl p-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black",
                RANK_STYLE[i] || 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              )}>
                {i + 1}
              </span>
              {s.avatar ? (
                <img src={s.avatar} alt="" className="size-8 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  {(s.name || '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{s.name}</p>
                {(s.className || s.sectionName) && (
                  <p className="truncate text-[10px] text-slate-400">
                    {s.className}{s.className && s.sectionName ? ' - ' : ''}{s.sectionName}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400">{s.xp.toLocaleString()} XP</span>
            </button>
          ))}
        </div>
      )}
    </MotionCard>
  );
}
