import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  MapPin,
  Search,
  User,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// shadcn Select. An empty-string value (nothing chosen / "all") is mapped to a sentinel, since
// Select items cannot have an empty value.
const NONE_VALUE = '__none__';
function PlainSelect({
  value,
  onChange,
  options,
  placeholder,
  emptyLabel,
  disabled,
  className,
  triggerClassName,
  leading,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  leading?: React.ReactNode;
}) {
  return (
    <Select
      value={value === '' ? (emptyLabel ? NONE_VALUE : undefined) : value}
      onValueChange={(v) => onChange(v === NONE_VALUE ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className, triggerClassName)}>
        {leading}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {emptyLabel && <SelectItem value={NONE_VALUE}>{emptyLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const FIELD_LABEL = 'text-[10px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] text-slate-400';
const FIELD_INPUT = 'h-auto rounded-xl sm:rounded-2xl border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-slate-800 focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0';
const FIELD_SELECT = 'h-auto rounded-xl sm:rounded-2xl border-slate-200 bg-white px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm';

type MeetingRow = {
  id: string;
  title: string;
  description?: string | null;
  meetingMode?: 'online' | 'offline' | string;
  meetingDate?: string | null;
  startTime?: string | null;
  durationMinutes?: number | null;
  meetingLink?: string | null;
  meetingPlatform?: string | null;
  location?: string | null;
  status?: string | null;
  counterpartName?: string | null;
  counterpartRole?: string | null;
  isIncoming?: boolean;
  isOutgoing?: boolean;
};

type ParentOption = {
  id: string;
  name: string;
  studentName?: string;
  className?: string;
  sectionName?: string;
};

const unwrapList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export default function TeacherMeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'scheduled' | 'completed'>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [parents, setParents] = useState<ParentOption[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [form, setForm] = useState({
    parentId: '',
    title: 'Parent Meeting',
    description: '',
    meetingDate: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    durationMinutes: '30',
    meetingMode: 'online' as 'online' | 'offline',
    meetingPlatform: 'Google Meet',
    meetingLink: '',
    location: '',
  });
  const [step, setStep] = useState(1);
  const [titleTouched, setTitleTouched] = useState(false);
  const [step2Error, setStep2Error] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const selectedParent = useMemo(
    () => parents.find((p) => p.id === form.parentId) || null,
    [parents, form.parentId],
  );

  // Classes/sections come straight off the loaded parent directory — every
  // parent row already carries its student's className/sectionName — so these
  // filters need no extra API call, just a narrower view of the same list.
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    parents.forEach((p) => { if (p.className) set.add(p.className); });
    return [...set].sort();
  }, [parents]);

  const sectionOptions = useMemo(() => {
    const set = new Set<string>();
    parents.forEach((p) => {
      if (classFilter && p.className !== classFilter) return;
      if (p.sectionName) set.add(p.sectionName);
    });
    return [...set].sort();
  }, [parents, classFilter]);

  const filteredParents = useMemo(() => {
    return parents.filter((p) => {
      if (classFilter && p.className !== classFilter) return false;
      if (sectionFilter && p.sectionName !== sectionFilter) return false;
      return true;
    });
  }, [parents, classFilter, sectionFilter]);

  // If a filter narrows the list past the currently-picked parent, drop the
  // stale selection rather than leaving it selected-but-hidden.
  useEffect(() => {
    if (form.parentId && !filteredParents.some((p) => p.id === form.parentId)) {
      setForm((prev) => ({ ...prev, parentId: '' }));
    }
  }, [filteredParents, form.parentId]);

  const parentIdFromQuery = useMemo(
    () => new URLSearchParams(window.location.search).get('parentId') || '',
    [],
  );

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings');
      setMeetings(unwrapList(res.data));
    } catch (error) {
      console.error('Failed to load teacher meetings', error);
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadParents = useCallback(async () => {
    setLoadingParents(true);
    try {
      const res = await api.get('/chat/directory');
      const rows = unwrapList(res.data);
      const unique = new Map<string, ParentOption>();
      rows.forEach((row: any) => {
        const parentId = String(row.parent_id || '').trim();
        if (!parentId || unique.has(parentId)) return;
        unique.set(parentId, {
          id: parentId,
          name: row.parent_name_user || row.parent_name || row.father_name || row.mother_name || 'Parent',
          studentName: row.student_name || undefined,
          className: row.class_name || undefined,
          sectionName: row.section_name || undefined,
        });
      });
      const nextParents = [...unique.values()];
      setParents(nextParents);
    } catch (error) {
      console.error('Failed to load parent options', error);
      setParents([]);
    } finally {
      setLoadingParents(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
    void loadParents();
  }, [loadMeetings, loadParents]);

  useEffect(() => {
    if (!parentIdFromQuery) return;
    setForm((prev) => ({ ...prev, parentId: parentIdFromQuery }));
    setStep(1);
    setShowCreate(true);
  }, [parentIdFromQuery]);

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const status = String(meeting.status || '').toLowerCase();
      const haystack = [
        meeting.title,
        meeting.description,
        meeting.counterpartName,
        meeting.counterpartRole,
        meeting.meetingDate,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (scopeFilter === 'incoming' && !meeting.isIncoming) return false;
      if (scopeFilter === 'outgoing' && !meeting.isOutgoing) return false;
      if (search.trim() && !haystack.includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [meetings, scopeFilter, search, statusFilter]);

  const summary = useMemo(() => {
    const pending = meetings.filter((m) => String(m.status).toLowerCase() === 'pending').length;
    const incoming = meetings.filter((m) => m.isIncoming).length;
    const scheduled = meetings.filter((m) =>
      ['accepted', 'scheduled', 'completed'].includes(String(m.status).toLowerCase()),
    ).length;
    return { total: meetings.length, pending, incoming, scheduled };
  }, [meetings]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/meetings/${id}/status`, { status });
      await loadMeetings();
    } catch (error) {
      console.error('Failed to update meeting status', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const resetCreateForm = () => {
    setShowCreate(false);
    setStep(1);
    setTitleTouched(false);
    setStep2Error('');
    setClassFilter('');
    setSectionFilter('');
  };

  const createMeeting = async () => {
    if (!form.parentId || !form.title.trim()) return;
    if (form.meetingMode === 'online' && !form.meetingLink.trim()) {
      setStep2Error('Add a meeting link so the parent knows where to join.');
      return;
    }
    if (form.meetingMode === 'offline' && !form.location.trim()) {
      setStep2Error('Add a location so the parent knows where to come.');
      return;
    }
    setStep2Error('');
    setCreating(true);
    try {
      await api.post('/meetings', {
        parentId: form.parentId,
        title: form.title.trim(),
        description: form.description.trim(),
        meetingDate: form.meetingDate,
        startTime: form.startTime,
        durationMinutes: Number(form.durationMinutes) || 30,
        meetingMode: form.meetingMode,
        meetingPlatform: form.meetingMode === 'online' ? form.meetingPlatform.trim() || null : null,
        meetingLink: form.meetingMode === 'online' ? form.meetingLink.trim() || null : null,
        location: form.meetingMode === 'offline' ? form.location.trim() || null : null,
      });
      resetCreateForm();
      setForm((prev) => ({
        ...prev,
        parentId: '',
        title: 'Parent Meeting',
        description: '',
        meetingLink: '',
        location: '',
      }));
      await loadMeetings();
    } catch (error) {
      console.error('Failed to create teacher meeting', error);
      setStep2Error('Could not schedule the meeting. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="rounded-2xl sm:rounded-[28px] border-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 px-4 py-4 sm:px-6 sm:py-8 text-white shadow-[0_30px_80px_-35px_rgba(14,116,144,0.6)]">
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75 hidden sm:block">Teacher Workspace</p>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight sm:mt-3">Meetings</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-white/80 hidden sm:block">
              Review parent meeting requests, confirm schedules, and manage online or offline discussions from one place.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setStep(1);
              setTitleTouched(false);
              setStep2Error('');
              setClassFilter('');
              setSectionFilter('');
              setShowCreate(true);
            }}
            className="h-auto shrink-0 rounded-xl bg-white px-3 py-2 text-[11px] font-black text-cyan-700 shadow-lg hover:bg-cyan-50 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
          >
            <CalendarDays className="mr-1.5 size-3.5 shrink-0 sm:mr-2 sm:size-4" />
            <span>Schedule Meeting</span>
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-4 gap-1.5 sm:gap-4">
        {[
          { label: 'Total Meetings', value: summary.total, icon: CalendarDays, tone: 'text-blue-600 bg-blue-50', bgMobile: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40', textTone: 'text-blue-800 dark:text-blue-300', valTone: 'text-blue-900 dark:text-blue-100' },
          { label: 'Pending Actions', value: summary.pending, icon: Clock3, tone: 'text-amber-600 bg-amber-50', bgMobile: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40', textTone: 'text-amber-800 dark:text-amber-300', valTone: 'text-amber-900 dark:text-amber-100' },
          { label: 'Incoming Requests', value: summary.incoming, icon: Users, tone: 'text-violet-600 bg-violet-50', bgMobile: 'bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900/40', textTone: 'text-violet-800 dark:text-violet-300', valTone: 'text-violet-900 dark:text-violet-100' },
          { label: 'Scheduled / Done', value: summary.scheduled, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50', bgMobile: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40', textTone: 'text-emerald-800 dark:text-emerald-300', valTone: 'text-emerald-900 dark:text-emerald-100' },
        ].map((item) => (
          <Card key={item.label} className={`rounded-xl sm:rounded-3xl p-2 sm:p-5 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left ${item.bgMobile} sm:bg-white sm:border-slate-200 dark:sm:bg-slate-900 dark:sm:border-slate-800`}>
            <div className={`mb-2 sm:mb-4 flex size-7 sm:size-12 items-center justify-center rounded-lg sm:rounded-2xl ${item.tone}`}>
              <item.icon className="size-3.5 sm:size-5" />
            </div>
            <p className={`text-[8px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] leading-tight sm:leading-normal ${item.textTone} sm:text-slate-400`}>
              {item.label.split(' ')[0]} <span className="hidden sm:inline">{item.label.split(' ').slice(1).join(' ')}</span>
            </p>
            <p className={`mt-1 text-base sm:text-3xl font-black ${item.valTone} sm:text-slate-900 dark:sm:text-white`}>{item.value}</p>
          </Card>
        ))}
      </section>

      <Card className="rounded-2xl sm:rounded-[28px] border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 sm:left-4 top-1/2 size-3.5 sm:size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parent, title, date"
              className="h-auto w-full rounded-xl border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 sm:rounded-2xl sm:py-3 sm:pl-11"
            />
          </div>
          <div className="grid w-full grid-cols-2 gap-2 lg:flex lg:w-auto">
            <PlainSelect
              value={scopeFilter}
              onChange={(v) => setScopeFilter(v as 'all' | 'incoming' | 'outgoing')}
              options={[
                { value: 'all', label: 'All flow' },
                { value: 'incoming', label: 'Incoming' },
                { value: 'outgoing', label: 'Outgoing' },
              ]}
              leading={<Filter className="size-3.5 shrink-0 text-slate-400" />}
              className="lg:w-[150px]"
              triggerClassName="h-auto gap-1.5 rounded-xl border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 sm:py-2.5 sm:text-sm"
            />
            <PlainSelect
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={[
                { value: 'all', label: 'All status' },
                { value: 'pending', label: 'Pending' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              className="lg:w-[150px]"
              triggerClassName="h-auto rounded-xl border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm sm:px-4 sm:py-2.5 sm:text-sm"
            />
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        {loading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="rounded-xl border-slate-200 p-4 shadow-sm sm:rounded-[28px] sm:p-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-1/4" />
                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                  <Skeleton className="h-12 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card className="rounded-[28px] border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-12">
            <CalendarDays className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-black text-slate-800">No meetings found</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Parent requests and your scheduled meetings will appear here.
            </p>
          </Card>
        ) : (
          filteredMeetings.map((meeting) => {
            const status = String(meeting.status || 'pending').toLowerCase();
            const statusTone =
              status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : ['accepted', 'scheduled', 'completed'].includes(status)
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700';

            return (
              <Card
                key={meeting.id}
                className="rounded-xl sm:rounded-[28px] border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-3.5 sm:gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="text-sm sm:text-lg font-black text-slate-900">{meeting.title || 'Meeting'}</h3>
                      <Badge variant="outline" className={`border-transparent px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] ${statusTone}`}>
                        {status}
                      </Badge>
                      <Badge variant="outline" className={`border-transparent px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-[0.2em] ${
                        meeting.isIncoming ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {meeting.isIncoming ? 'Incoming' : 'Outgoing'}
                      </Badge>
                    </div>

                    <div className="mt-2 sm:mt-3 flex flex-wrap gap-2 text-xs sm:text-sm font-semibold text-slate-500">
                      <span>{meeting.counterpartName || 'Parent'}</span>
                      {meeting.counterpartRole && (
                        <Badge variant="outline" className="rounded border-transparent bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.16em] text-slate-500">
                          {String(meeting.counterpartRole).replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <Card className="rounded-xl border-0 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 shadow-none">
                        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] text-slate-400">Date & Time</p>
                        <p className="mt-0.5 text-[11px] sm:text-sm font-bold text-slate-800">
                          {meeting.meetingDate || 'TBD'}{meeting.startTime ? ` • ${meeting.startTime}` : ''}
                        </p>
                      </Card>
                      <Card className="rounded-xl border-0 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 shadow-none">
                        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] text-slate-400">Mode</p>
                        <p className="mt-0.5 text-[11px] sm:text-sm font-bold capitalize text-slate-800">{meeting.meetingMode || 'online'}</p>
                      </Card>
                      <Card className="rounded-xl border-0 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 shadow-none">
                        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] text-slate-400">Duration</p>
                        <p className="mt-0.5 text-[11px] sm:text-sm font-bold text-slate-800">
                          {meeting.durationMinutes ? `${meeting.durationMinutes} mins` : 'Not set'}
                        </p>
                      </Card>
                      <Card className="rounded-xl border-0 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 shadow-none">
                        <p className="text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-[0.18em] text-slate-400">Location / Link</p>
                        <p className="mt-0.5 truncate text-[11px] sm:text-sm font-bold text-slate-800">
                          {meeting.meetingMode === 'offline'
                            ? meeting.location || 'Campus'
                            : meeting.meetingPlatform || meeting.meetingLink || 'Online'}
                        </p>
                      </Card>
                    </div>

                    {meeting.description && (
                      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs sm:text-sm font-medium text-slate-600">
                        {meeting.description}
                      </p>
                    )}
                  </div>

                  <div className="flex w-full flex-row flex-wrap gap-2 xl:flex-col xl:w-[220px]">
                    {meeting.meetingMode === 'online' && meeting.meetingLink && !['completed', 'cancelled'].includes(status) && (
                      <Button
                        asChild
                        className="h-auto flex-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                      >
                        <a href={meeting.meetingLink} target="_blank" rel="noreferrer">
                          <Video className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                          Join Link
                        </a>
                      </Button>
                    )}

                    {meeting.meetingMode === 'offline' && meeting.location && (
                      <Card className="flex-1 inline-flex items-center justify-center rounded-xl sm:rounded-2xl border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-slate-700 shadow-none">
                        <MapPin className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" />
                        {meeting.location}
                      </Card>
                    )}

                    {status === 'pending' && meeting.isIncoming && (
                      <>
                        <Button
                          type="button"
                          disabled={updatingId === meeting.id}
                          onClick={() => void updateStatus(meeting.id, 'accepted')}
                          className="h-auto flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white shadow-none hover:bg-emerald-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={updatingId === meeting.id}
                          onClick={() => void updateStatus(meeting.id, 'rejected')}
                          className="h-auto flex-1 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 hover:bg-rose-100 hover:text-rose-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {status === 'pending' && meeting.isOutgoing && (
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={updatingId === meeting.id}
                        onClick={() => void updateStatus(meeting.id, 'cancelled')}
                        className="h-auto flex-1 rounded-xl border-0 bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                      >
                        Cancel
                      </Button>
                    )}

                    {['accepted', 'scheduled'].includes(status) && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={updatingId === meeting.id}
                        onClick={() => void updateStatus(meeting.id, 'completed')}
                        className="h-auto flex-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-black text-blue-700 hover:bg-blue-200 hover:text-blue-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </section>

      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) resetCreateForm(); }}>
        <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:rounded-[30px] sm:p-6">
          <DialogHeader className="mb-1 text-left sm:mb-2">
            <DialogTitle className="text-base font-black leading-normal tracking-normal text-slate-900 sm:text-xl">Schedule Parent Meeting</DialogTitle>
            <DialogDescription className="sr-only">Pick a parent, then choose when and where to meet.</DialogDescription>
          </DialogHeader>

            {/* Step indicator */}
            <div className="mb-4 sm:mb-6 flex items-center gap-2">
              {[
                { n: 1, label: 'Who & what' },
                { n: 2, label: 'When & where' },
              ].map((s, i) => (
                <React.Fragment key={s.n}>
                  {i > 0 && <div className={`h-0.5 flex-1 rounded-full ${step > 1 ? 'bg-cyan-500' : 'bg-slate-200'}`} />}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`flex size-5 sm:size-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-black ${
                        step === s.n
                          ? 'bg-cyan-600 text-white'
                          : step > s.n
                            ? 'bg-cyan-100 text-cyan-700'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step > s.n ? <Check className="size-3" /> : s.n}
                    </span>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider ${step === s.n ? 'text-slate-800' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {selectedParent && (
              <Card className="mb-3 sm:mb-4 flex items-center gap-2.5 rounded-xl sm:rounded-2xl border-cyan-100 bg-cyan-50/60 px-3 py-2 sm:px-4 sm:py-2.5 shadow-none">
                <span className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
                  <User className="size-3.5 sm:size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs sm:text-sm font-black text-slate-800">{selectedParent.name}</p>
                  <p className="truncate text-[10px] sm:text-xs font-semibold text-slate-500">
                    {[
                      selectedParent.studentName ? `Parent of ${selectedParent.studentName}` : null,
                      selectedParent.className ? `${selectedParent.className}${selectedParent.sectionName ? `-${selectedParent.sectionName}` : ''}` : null,
                    ].filter(Boolean).join(' • ') || 'Meeting contact'}
                  </p>
                </div>
              </Card>
            )}

            <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
              {step === 1 && (
                <>
                  {classOptions.length > 1 && (
                    <>
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className={FIELD_LABEL}>Class</Label>
                        <PlainSelect
                          onChange={(val) => {
                            setClassFilter(val);
                            setSectionFilter('');
                          }}
                          value={classFilter}
                          placeholder="All classes"
                          emptyLabel="All classes"
                          options={classOptions.map((c) => ({ value: c, label: c }))}
                          triggerClassName={FIELD_SELECT}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className={FIELD_LABEL}>Section</Label>
                        <PlainSelect
                          onChange={setSectionFilter}
                          value={sectionFilter}
                          disabled={sectionOptions.length === 0}
                          placeholder="All sections"
                          emptyLabel="All sections"
                          options={sectionOptions.map((s) => ({ value: s, label: `Section ${s}` }))}
                          triggerClassName={FIELD_SELECT}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                    <Label className={FIELD_LABEL}>Parent</Label>
                    <CustomSelect
                      onChange={(val) => {
                        const parent = parents.find((p) => p.id === val);
                        setForm((prev) => ({
                          ...prev,
                          parentId: val,
                          title: !titleTouched && parent
                            ? (parent.studentName ? `Meeting: ${parent.studentName} (parent)` : `Meeting with ${parent.name}`)
                            : prev.title,
                        }));
                      }}
                      value={form.parentId}
                      disabled={loadingParents}
                      placeholder={loadingParents ? 'Loading parents...' : 'Select parent'}
                      searchable
                      searchPlaceholder="Search by parent or student name..."
                      noResultsText="No parent matches that search"
                      options={filteredParents.map((parent) => ({
                        value: parent.id,
                        label: `${parent.name}${parent.studentName ? ` • ${parent.studentName}` : ''}${parent.className ? ` • ${parent.className}` : ''}${parent.sectionName ? `-${parent.sectionName}` : ''}`
                      }))}
                      className="w-full"
                      triggerClassName="flex size-full items-center justify-between gap-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 shadow-sm"
                    />
                    {!loadingParents && parents.length === 0 && (
                      <p className="flex items-start gap-1.5 pt-1 text-[11px] font-semibold text-amber-600">
                        <AlertCircle className="mt-0.5 size-3 shrink-0" />
                        No parents found for your assigned classes yet. Ask your admin to check class/section assignments.
                      </p>
                    )}
                    {!loadingParents && parents.length > 0 && filteredParents.length === 0 && (
                      <p className="flex items-start gap-1.5 pt-1 text-[11px] font-semibold text-amber-600">
                        <AlertCircle className="mt-0.5 size-3 shrink-0" />
                        No parents in {[classFilter, sectionFilter && `Section ${sectionFilter}`].filter(Boolean).join(' ')}. Try a different class or section.
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                    <Label className={FIELD_LABEL}>Title</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => {
                        setTitleTouched(true);
                        setForm((prev) => ({ ...prev, title: e.target.value }));
                      }}
                      className={FIELD_INPUT}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                    <Label className={FIELD_LABEL}>Purpose</Label>
                    <Textarea
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="min-h-0 resize-none rounded-xl border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus-visible:border-cyan-400 focus-visible:bg-white focus-visible:ring-0 focus-visible:ring-offset-0 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                      placeholder="Discuss attendance, performance, assessments, or classroom follow-up."
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                    <Label className={FIELD_LABEL}>Mode</Label>
                    <ToggleGroup
                      type="single"
                      value={form.meetingMode}
                      onValueChange={(mode) => {
                        if (!mode) return;
                        setStep2Error('');
                        setForm((prev) => ({ ...prev, meetingMode: mode as 'online' | 'offline' }));
                      }}
                      className="grid grid-cols-2 gap-2"
                    >
                      {(['online', 'offline'] as const).map((mode) => (
                        <ToggleGroupItem
                          key={mode}
                          value={mode}
                          className="h-auto gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black capitalize text-slate-500 data-[state=on]:border-cyan-500 data-[state=on]:bg-cyan-50 data-[state=on]:text-cyan-700 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                        >
                          {mode === 'online' ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}
                          {mode}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className={FIELD_LABEL}>Date</Label>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={form.meetingDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, meetingDate: e.target.value }))}
                      className={FIELD_INPUT}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <Label className={FIELD_LABEL}>Time</Label>
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      className={FIELD_INPUT}
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                    <Label className={FIELD_LABEL}>Duration</Label>
                    <PlainSelect
                      onChange={(val) => setForm(prev => ({ ...prev, durationMinutes: val }))}
                      value={form.durationMinutes}
                      options={[
                        { value: '15', label: '15 mins' },
                        { value: '30', label: '30 mins' },
                        { value: '45', label: '45 mins' },
                        { value: '60', label: '60 mins' },
                      ]}
                      triggerClassName={FIELD_SELECT}
                    />
                  </div>

                  {form.meetingMode === 'online' ? (
                    <>
                      <div className="space-y-1 sm:space-y-1.5">
                        <Label className={FIELD_LABEL}>Platform</Label>
                        <Input
                          value={form.meetingPlatform}
                          onChange={(e) => setForm((prev) => ({ ...prev, meetingPlatform: e.target.value }))}
                          className={FIELD_INPUT}
                        />
                      </div>
                      <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                        <Label className={FIELD_LABEL}>Meeting Link</Label>
                        <Input
                          value={form.meetingLink}
                          onChange={(e) => {
                            setStep2Error('');
                            setForm((prev) => ({ ...prev, meetingLink: e.target.value }));
                          }}
                          placeholder="https://meet.google.com/..."
                          className={FIELD_INPUT}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1 sm:space-y-1.5 md:col-span-2">
                      <Label className={FIELD_LABEL}>Location</Label>
                      <Input
                        value={form.location}
                        onChange={(e) => {
                          setStep2Error('');
                          setForm((prev) => ({ ...prev, location: e.target.value }));
                        }}
                        placeholder="School campus / classroom / office"
                        className={FIELD_INPUT}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {step2Error && (
              <Alert className="mt-3 flex items-start gap-1.5 rounded-xl border-0 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 sm:text-xs [&>svg]:static [&>svg]:text-current [&>svg~*]:pl-0">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {step2Error}
              </Alert>
            )}

            <DialogFooter className="mt-4 flex-row justify-end gap-2 sm:mt-6 sm:gap-3 sm:space-x-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (step === 2) setStep(1);
                  else resetCreateForm();
                }}
                className="h-auto flex-1 rounded-xl border-0 bg-slate-100 px-4 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 sm:flex-initial sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
              >
                {step === 2 ? 'Back' : 'Cancel'}
              </Button>
              {step === 1 ? (
                <Button
                  type="button"
                  disabled={!form.parentId || !form.title.trim()}
                  onClick={() => setStep(2)}
                  className="h-auto flex-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-none hover:bg-cyan-700 sm:flex-initial sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={creating || !form.parentId}
                  onClick={() => void createMeeting()}
                  className="h-auto flex-1 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-black text-white shadow-none hover:bg-cyan-700 sm:flex-initial sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm"
                >
                  {creating ? 'Scheduling...' : 'Create Meeting'}
                </Button>
              )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
