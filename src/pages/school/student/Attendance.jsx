import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, UserCheck, XCircle } from 'lucide-react';

function pct(value) {
  if (!value) return 0;
  return Math.round(value);
}

function statusTone(status) {
  if (status === 'present') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300';
  if (status === 'late') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300';
  return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
}

export default function Attendance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const userId = user?.id || user?.userId;
      if (!userId) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      try {
        const res = await api.get('/attendance', {
          params: { userId, startDate, endDate },
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setRecords(data);
      } catch (error) {
        console.error('Failed to fetch attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [user]);

  const stats = useMemo(() => {
    const present = records.filter((item) => item.status === 'present').length;
    const absent = records.filter((item) => item.status === 'absent').length;
    const late = records.filter((item) => item.status === 'late').length;
    const total = records.length;
    return {
      present,
      absent,
      late,
      total,
      percentage: total ? pct((present / total) * 100) : 0,
    };
  }, [records]);

  const weeklyTrend = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0];
    records.forEach((item) => {
      const date = new Date(item.date);
      const week = Math.min(4, Math.floor((date.getDate() - 1) / 7));
      counts[week] += 1;
      if (item.status === 'present') weeks[week] += 1;
    });
    return weeks.map((present, index) => ({
      label: `Week ${index + 1}`,
      value: counts[index] ? pct((present / counts[index]) * 100) : 0,
    }));
  }, [records]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Attendance Center</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Present days, absent days, monthly attendance, subject trends, and warnings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-5 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <UserCheck className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">Monthly Attendance</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{stats.percentage}%</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Present Days</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{stats.present}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <XCircle className="h-6 w-6 text-rose-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Absent Days</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{stats.absent}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Clock className="h-6 w-6 text-amber-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Late Marks</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{stats.late}</p>
        </div>
      </div>

      {stats.total > 0 && stats.percentage < 75 && (
        <div className="flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <h2 className="text-sm font-black text-rose-800 dark:text-rose-200">Attendance warning</h2>
            <p className="mt-1 text-sm font-medium text-rose-700 dark:text-rose-300">Your monthly attendance is below 75%. Review absences and speak with your class teacher if needed.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Monthly Trend</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Week-by-week attendance percentage for this month.</p>
            </div>
            <CalendarDays className="h-6 w-6 text-blue-600" />
          </div>
          <div className="mt-6 space-y-4">
            {weeklyTrend.map((week) => (
              <div key={week.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{week.label}</span>
                  <span className="text-slate-950 dark:text-white">{week.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: `${week.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-black text-slate-950 dark:text-white">Recent Records</h2>
          <div className="mt-5 space-y-3">
            {records.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950/50">
                <UserCheck className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No attendance records yet</p>
                <p className="mt-1 text-xs font-medium text-slate-500">Your marked attendance will appear here.</p>
              </div>
            ) : (
              records.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.remarks || 'Class day'}</p>
                  </div>
                  <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
