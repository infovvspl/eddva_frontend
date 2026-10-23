// TeacherAttendance — manual MVP ahead of the biometric staff-attendance
// system: admin marks each teacher present/absent/late/leave for a day and
// sees who's in right now, with the time it was marked.
import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, Clock3, CalendarClock, Users, Save, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/school/LoadingSpinner';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: CheckCircle2, on: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'absent', label: 'Absent', icon: XCircle, on: 'bg-rose-500 text-white border-rose-500' },
  { value: 'late', label: 'Late', icon: Clock3, on: 'bg-amber-500 text-white border-amber-500' },
  { value: 'leave', label: 'Leave', icon: CalendarClock, on: 'bg-slate-500 text-white border-slate-500' },
];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn('mt-1 text-2xl font-black', tone)}>{value}</p>
    </div>
  );
}

export default function TeacherAttendance() {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, notMarked: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState({}); // userId -> { status, remarks }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher-attendance', { params: { date } });
      const body = res?.data || {};
      setRows(body.data || []);
      setSummary(body.summary || { total: 0, present: 0, absent: 0, notMarked: 0 });
      setDirty({});
    } catch (err) {
      console.error(err);
      toast.error('Failed to load teacher attendance');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const effectiveStatus = (row) => dirty[row.userId]?.status ?? row.status ?? null;
  const effectiveRemarks = (row) => dirty[row.userId]?.remarks ?? row.remarks ?? '';

  const setStatus = (userId, status) => {
    setDirty((d) => ({ ...d, [userId]: { ...d[userId], status, remarks: d[userId]?.remarks ?? rows.find(r => r.userId === userId)?.remarks ?? '' } }));
  };
  const setRemarks = (userId, remarks) => {
    setDirty((d) => ({ ...d, [userId]: { ...d[userId], remarks, status: d[userId]?.status ?? rows.find(r => r.userId === userId)?.status ?? 'present' } }));
  };

  const markAllPresent = () => {
    const next = {};
    for (const r of rows) next[r.userId] = { status: 'present', remarks: effectiveRemarks(r) };
    setDirty(next);
  };

  const saveAll = async () => {
    const entries = Object.entries(dirty).map(([teacherUserId, v]) => ({ teacherUserId, status: v.status, remarks: v.remarks || null }));
    if (!entries.length) { toast.info('Nothing to save'); return; }
    setSaving(true);
    try {
      await api.post('/teacher-attendance/bulk', { date, entries });
      toast.success(`Saved attendance for ${entries.length} teacher${entries.length > 1 ? 's' : ''}`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full space-y-6 font-poppins">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Teacher Attendance</h1>
          <p className="text-sm text-slate-500">Mark each teacher's attendance and see who's in today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          <Button variant="outline" onClick={() => setDate(todayStr())}>Today</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Teachers" value={summary.total} tone="text-slate-900 dark:text-white" />
        <StatCard label="Present" value={summary.present} tone="text-emerald-600" />
        <StatCard label="Absent" value={summary.absent} tone="text-rose-600" />
        <StatCard label="Not Marked" value={summary.notMarked} tone="text-amber-600" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-2">
          <UserCheck size={15} /> Mark All Present
        </Button>
        <Button size="sm" onClick={saveAll} disabled={saving || !Object.keys(dirty).length} className="gap-2">
          <Save size={15} /> {saving ? 'Saving…' : `Save${Object.keys(dirty).length ? ` (${Object.keys(dirty).length})` : ''}`}
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Marked At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-slate-500">
                <Users className="mx-auto mb-2 opacity-40" size={28} /> No teachers found.
              </TableCell></TableRow>
            )}
            {rows.map((row) => {
              const status = effectiveStatus(row);
              const isDirty = !!dirty[row.userId];
              return (
                <TableRow key={row.userId} className={cn(isDirty && 'bg-blue-50/60 dark:bg-blue-950/20')}>
                  <TableCell>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email}{row.employeeId ? ` · ${row.employeeId}` : ''}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-300">{row.department || '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {STATUS_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setStatus(row.userId, opt.value)}
                            className={cn(
                              'flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors',
                              active ? opt.on : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700',
                            )}
                            title={opt.label}
                          >
                            <Icon size={12} /> {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={effectiveRemarks(row)}
                      onChange={(e) => setRemarks(row.userId, e.target.value)}
                      placeholder="Optional remark"
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {row.markedAt ? new Date(row.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
