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
  pending: 'bg-amber-500/10 text-amber-700',
  approved: 'bg-emerald-500/10 text-emerald-700',
  rejected: 'bg-red-500/10 text-red-700',
  cancelled: 'bg-slate-500/10 text-slate-600',
};

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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="h-6 w-6" /> My Leave
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View your leave balance and apply for time off</p>
        </div>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4 mr-1" /> Apply for Leave
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
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
                <div key={n.notification_id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300">{n.message}</p>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Balance ({new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : balances.length === 0 ? (
            <p className="text-sm text-slate-500">No leave balance allocated yet — contact your admin.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {balances.map((b) => {
                const allocated = Number(b.allocated_days);
                const used = Number(b.used_days);
                const remaining = allocated - used;
                return (
                  <div key={b.balance_id} className="rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{b.leave_type.code}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{b.leave_type.name}</p>
                    <p className="mt-1 text-lg font-bold text-blue-600 dark:text-blue-400">
                      {remaining} <span className="text-xs font-medium text-slate-400">/ {allocated} days left</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-500">You haven't applied for any leave yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((a) => (
                <div key={a.application_id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{a.leave_type.name}</span>
                      <Badge variant="outline" className={cn('border-transparent', STATUS_TONE[a.status])}>
                        {a.status}
                      </Badge>
                      {a.is_half_day && (
                        <Badge variant="outline" className="border-transparent bg-blue-500/10 text-blue-700">
                          Half day ({a.half_day_period})
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {a.from_date.slice(0, 10)} {a.to_date.slice(0, 10) !== a.from_date.slice(0, 10) ? `to ${a.to_date.slice(0, 10)}` : ''} · {a.days_count} day(s)
                    </p>
                    {a.reason && <p className="text-xs text-slate-500 mt-0.5">{a.reason}</p>}
                    {a.status === 'rejected' && a.decision_reason && (
                      <p className="text-xs text-red-600 mt-0.5">Reason: {a.decision_reason}</p>
                    )}
                  </div>
                  {(a.status === 'pending' || a.status === 'approved') && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(a.application_id)}>
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
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Checked against your remaining leave balance</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}

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
              <div className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-3">
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
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
