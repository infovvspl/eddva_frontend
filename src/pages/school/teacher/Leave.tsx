import React, { useEffect, useState } from 'react';
import { CalendarClock, Plus, X, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  getMyLeaveBalances,
  getMyLeaveApplications,
  applyForLeave,
  cancelMyLeave,
  getMyNotifications,
  getLeaveApiErrorMessage,
  type MyLeaveBalance,
  type MyLeaveApplication,
  type MyNotification,
} from '@/lib/api/erpStaffSelf';

const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
};
const STATUS_BAR: Record<string, string> = {
  pending: 'from-amber-400 to-orange-500',
  approved: 'from-emerald-400 to-teal-600',
  rejected: 'from-red-400 to-rose-600',
  cancelled: 'from-slate-300 to-slate-400',
};
const STATUS_DOT: Record<string, string> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-slate-400',
};

// One colour per leave type (by position) for the balance cards.
const BALANCE_TONES = [
  { tile: 'from-blue-500 to-blue-600 shadow-blue-500/30', border: 'border-blue-300 hover:border-blue-400', bar: 'bg-blue-500', text: 'text-blue-600' },
  { tile: 'from-emerald-500 to-teal-600 shadow-emerald-500/30', border: 'border-emerald-300 hover:border-emerald-400', bar: 'bg-emerald-500', text: 'text-emerald-600' },
  { tile: 'from-violet-500 to-purple-600 shadow-violet-500/30', border: 'border-violet-300 hover:border-violet-400', bar: 'bg-violet-500', text: 'text-violet-600' },
  { tile: 'from-orange-400 to-orange-600 shadow-orange-500/30', border: 'border-orange-300 hover:border-orange-400', bar: 'bg-orange-500', text: 'text-orange-600' },
  { tile: 'from-rose-500 to-pink-600 shadow-rose-500/30', border: 'border-rose-300 hover:border-rose-400', bar: 'bg-rose-500', text: 'text-rose-600' },
  { tile: 'from-sky-400 to-cyan-600 shadow-sky-500/30', border: 'border-sky-300 hover:border-sky-400', bar: 'bg-sky-500', text: 'text-sky-600' },
];

const EMPTY_FORM = {
  leave_type_id: '',
  from_date: '',
  to_date: '',
  is_half_day: false,
  half_day_period: 'AM' as 'AM' | 'PM',
  reason: '',
};

export default function TeacherLeavePage() {
  const [balances, setBalances] = useState<MyLeaveBalance[]>([]);
  const [applications, setApplications] = useState<MyLeaveApplication[]>([]);
  const [notifications, setNotifications] = useState<MyNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([getMyLeaveBalances(), getMyLeaveApplications(), getMyNotifications(10)])
      .then(([b, a, n]) => {
        setBalances(b);
        setApplications(a);
        setNotifications(n);
      })
      .catch((err) => setError(getLeaveApiErrorMessage(err, 'Failed to load leave data')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type_id || !form.from_date || !form.to_date) {
      setFormError('Leave type, from date and to date are required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await applyForLeave({
        leave_type_id: Number(form.leave_type_id),
        from_date: form.from_date,
        to_date: form.to_date,
        is_half_day: form.is_half_day,
        half_day_period: form.is_half_day ? form.half_day_period : undefined,
        reason: form.reason || undefined,
      });
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(getLeaveApiErrorMessage(err, 'Failed to file leave application'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelMyLeave(id);
      load();
    } catch (err) {
      setError(getLeaveApiErrorMessage(err, 'Failed to cancel leave application'));
    }
  };

  const sameDay = form.from_date && form.to_date && form.from_date === form.to_date;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 sm:size-12">
            <CalendarClock className="size-5 sm:size-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Leave</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">View your leave balance and apply for time off</p>
          </div>
        </div>
        <Button onClick={openModal} className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-600/25 hover:brightness-110">
          <Plus className="h-4 w-4 mr-1" /> Apply for Leave
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <Card className="rounded-2xl border-slate-300 shadow-none dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30"><Bell className="h-4 w-4" /></span>
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div key={n.notification_id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50/60 p-3 transition-colors hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                  <p className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    {n.message}
                  </p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200 whitespace-nowrap dark:bg-slate-800 dark:ring-slate-700">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-300 shadow-none dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold">Leave Balance ({new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-slate-500">No leave balance allocated yet — contact your admin.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {balances.map((b, i) => {
                const allocated = Number(b.allocated_days);
                const used = Number(b.used_days);
                const remaining = allocated - used;
                const tone = BALANCE_TONES[i % BALANCE_TONES.length];
                const leftPct = allocated > 0 ? Math.max(0, Math.min(100, (remaining / allocated) * 100)) : 0;
                return (
                  <div key={b.balance_id} className={cn('rounded-xl border bg-white p-3 transition-colors dark:bg-slate-900', tone.border)}>
                    <div className="flex items-center gap-2.5">
                      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-extrabold uppercase text-white shadow-lg', tone.tile)}>
                        {String(b.leave_type.code || b.leave_type.name).slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{b.leave_type.code}</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.leave_type.name}</p>
                      </div>
                    </div>
                    <p className={cn('mt-2.5 text-xl font-extrabold leading-none', tone.text)}>
                      {remaining} <span className="text-xs font-medium text-slate-400">/ {allocated} days left</span>
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className={cn('h-full rounded-full', tone.bar)} style={{ width: `${leftPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-300 shadow-none dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-bold">My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-500">You haven't applied for any leave yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a.application_id} className="relative flex items-center justify-between gap-4 overflow-hidden rounded-xl border border-slate-300 bg-white p-3 pl-5 transition-all hover:border-slate-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <span className={cn('absolute inset-y-0 left-0 w-1 bg-gradient-to-b', STATUS_BAR[a.status] || STATUS_BAR.cancelled)} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{a.leave_type.name}</span>
                      <Badge variant="outline" className={cn('gap-1.5 rounded-full border-transparent text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset', STATUS_TONE[a.status])}>
                        <span className={cn('size-1.5 rounded-full', STATUS_DOT[a.status] || STATUS_DOT.cancelled)} />
                        {a.status}
                      </Badge>
                      {a.is_half_day && (
                        <Badge variant="outline" className="rounded-full border-transparent bg-blue-50 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-200">
                          Half day ({a.half_day_period})
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {a.from_date.slice(0, 10)} {a.to_date.slice(0, 10) !== a.from_date.slice(0, 10) ? `to ${a.to_date.slice(0, 10)}` : ''} · {a.days_count} day(s)
                    </p>
                    {a.reason && <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>}
                    {a.status === 'rejected' && a.decision_reason && (
                      <p className="text-xs text-red-600 mt-0.5">Reason: {a.decision_reason}</p>
                    )}
                  </div>
                  {(a.status === 'pending' || a.status === 'approved') && (
                    <Button variant="outline" size="sm" onClick={() => handleCancel(a.application_id)} className="shrink-0 rounded-lg border-rose-300 font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"><CalendarClock className="size-5" /></span>
              <div className="text-left">
                <DialogTitle>Apply for Leave</DialogTitle>
                <DialogDescription>Checked against your remaining leave balance</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}

            <div>
              <Label>Leave Type *</Label>
              <Select value={form.leave_type_id} onValueChange={(v) => setForm({ ...form, leave_type_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((b) => (
                    <SelectItem key={b.leave_type_id} value={String(b.leave_type_id)}>
                      {b.leave_type.name} ({Number(b.allocated_days) - Number(b.used_days)} days left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From *</Label>
                <Input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value, is_half_day: e.target.value === form.to_date ? form.is_half_day : false })} required />
              </div>
              <div>
                <Label>To *</Label>
                <Input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value, is_half_day: e.target.value === form.from_date ? form.is_half_day : false })} required />
              </div>
            </div>

            {sameDay && (
              <div className="flex items-center justify-between rounded-lg border border-slate-300 dark:border-slate-800 p-3">
                <div>
                  <Label className="mb-0">Half day</Label>
                  <p className="text-xs text-slate-500">Counts as 0.5 day instead of 1</p>
                </div>
                <div className="flex items-center gap-3">
                  {form.is_half_day && (
                    <Select value={form.half_day_period} onValueChange={(v) => setForm({ ...form, half_day_period: v as 'AM' | 'PM' })}>
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Switch checked={form.is_half_day} onCheckedChange={(v) => setForm({ ...form, is_half_day: v })} />
                </div>
              </div>
            )}

            <div>
              <Label>Reason</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-md shadow-blue-600/25 hover:brightness-110">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
