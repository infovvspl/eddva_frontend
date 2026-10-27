import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX2, Flame, UserX, Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Habitual absentees of a section, for its class teacher.
 *
 * Sample data for now. When a `habitual-absentees` endpoint exists, replace
 * SAMPLE_ABSENTEES with the response (same fields) and nothing else changes.
 */

// A student is "habitual" with this many absent days in the window, or this many in a row.
const MIN_ABSENCES = 3;
const MIN_STREAK = 3;
const WINDOW_DAYS = 30;

export interface Absentee {
  studentId: string;
  name: string;
  rollNo: string | null;
  absences: number;
  totalDays: number;
  percentage: number;
  streak: number;
  lastAbsent: string | null;
  parentId: string | null;
}

const SAMPLE_ABSENTEES: Absentee[] = [
  { studentId: 's1', name: 'Aarav Sharma', rollNo: '04', absences: 9, totalDays: 22, percentage: 59.1, streak: 4, lastAbsent: '2026-10-26', parentId: null },
  { studentId: 's2', name: 'Diya Verma', rollNo: '11', absences: 7, totalDays: 22, percentage: 68.2, streak: 3, lastAbsent: '2026-10-26', parentId: null },
  { studentId: 's3', name: 'Rohan Gupta', rollNo: '17', absences: 6, totalDays: 22, percentage: 72.7, streak: 0, lastAbsent: '2026-10-21', parentId: null },
  { studentId: 's4', name: 'Ananya Singh', rollNo: '02', absences: 5, totalDays: 22, percentage: 77.3, streak: 3, lastAbsent: '2026-10-24', parentId: null },
  { studentId: 's5', name: 'Kabir Mehta', rollNo: '23', absences: 4, totalDays: 22, percentage: 81.8, streak: 0, lastAbsent: '2026-10-17', parentId: null },
  { studentId: 's6', name: 'Ishita Nair', rollNo: '09', absences: 3, totalDays: 22, percentage: 86.4, streak: 0, lastAbsent: '2026-10-14', parentId: null },
];

const formatDay = (value: string | null): string => {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function HabitualAbsentees({ sectionLabel }: { sectionLabel?: string }) {
  const navigate = useNavigate();
  const rows = SAMPLE_ABSENTEES;
  const longest = rows.reduce((m, r) => Math.max(m, r.streak), 0);
  const totalAbsences = rows.reduce((sum, r) => sum + r.absences, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Habitual Absentees</h2>
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {sectionLabel ? `${sectionLabel} • ` : ''}{MIN_ABSENCES}+ absent days or {MIN_STREAK}+ in a row, in the last {WINDOW_DAYS} days
          </p>
        </div>
        {/* <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-[11px] font-bold text-amber-700">Sample data</Badge> */}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Habitual absentees', value: rows.length, icon: Users, tone: 'from-rose-500 to-red-600 shadow-rose-500/30', border: 'border-rose-200 hover:border-rose-400' },
          { label: 'Longest streak', value: `${longest}d`, icon: Flame, tone: 'from-orange-400 to-orange-600 shadow-orange-500/30', border: 'border-orange-200 hover:border-orange-400' },
          { label: 'Absent days (total)', value: totalAbsences, icon: CalendarX2, tone: 'from-violet-500 to-purple-600 shadow-violet-500/30', border: 'border-violet-200 hover:border-violet-400' },
        ].map((item) => (
          <Card key={item.label} className={cn('flex flex-col items-center gap-1.5 rounded-xl bg-white p-2.5 text-center shadow-none transition-colors sm:flex-row sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-left dark:bg-slate-900', item.border)}>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg sm:size-11', item.tone)}>
              <item.icon className="size-4 sm:size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-none text-slate-900 dark:text-white sm:text-2xl">{item.value}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">{item.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-none dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">Student</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">Absent days</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">Attendance</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">In a row</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wide text-slate-500">Last absent</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wide text-slate-500">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-600 text-xs font-bold text-white shadow-md shadow-rose-500/30">
                        {r.name.trim().charAt(0).toUpperCase() || 'S'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
                        {r.rollNo && <p className="text-[11px] font-medium text-slate-500">Roll {r.rollNo}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-xs font-bold text-rose-700">
                      <UserX className="mr-1 size-3" />{r.absences} / {r.totalDays}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn('text-sm font-bold', r.percentage < 75 ? 'text-rose-600' : 'text-amber-600')}>{r.percentage}%</TableCell>
                  <TableCell>
                    {r.streak >= MIN_STREAK ? (
                      <Badge variant="outline" className="border-orange-200 bg-orange-50 text-xs font-bold text-orange-700">
                        <Flame className="mr-1 size-3" />{r.streak} days
                      </Badge>
                    ) : (
                      <span className="text-sm font-medium text-slate-400">{'—'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">{formatDay(r.lastAbsent)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/school/teacher/meetings${r.parentId ? `?parentId=${encodeURIComponent(r.parentId)}` : ''}`)}
                      className="h-8 rounded-lg border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Video className="mr-1.5 size-3.5" /> Meet parent
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
