import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Filter,
  MapPin,
  Search,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { CustomSelect } from "@/components/ui/CustomSelect";

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
    console.log('Modal Opened - Loading Parents');
    try {
      const res = await api.get('/chat/directory');
      console.log('Parent API Response:', res.data);
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
      console.log('Mapped Parent Options:', nextParents);
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

  const createMeeting = async () => {
    if (!form.parentId || !form.title.trim()) return;
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
      setShowCreate(false);
      setStep(1);
      setForm((prev) => ({
        ...prev,
        description: '',
        meetingLink: '',
        location: '',
      }));
      await loadMeetings();
    } catch (error) {
      console.error('Failed to create teacher meeting', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 px-6 py-8 text-white shadow-[0_30px_80px_-35px_rgba(14,116,144,0.6)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/75">Teacher Workspace</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Meetings</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold text-white/80">
              Review parent meeting requests, confirm schedules, and manage online or offline discussions from one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-cyan-700 shadow-lg transition hover:bg-cyan-50"
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            Schedule Meeting
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Meetings', value: summary.total, icon: CalendarDays, tone: 'text-blue-600 bg-blue-50' },
          { label: 'Pending Actions', value: summary.pending, icon: Clock3, tone: 'text-amber-600 bg-amber-50' },
          { label: 'Incoming Requests', value: summary.incoming, icon: Users, tone: 'text-violet-600 bg-violet-50' },
          { label: 'Scheduled / Done', value: summary.scheduled, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-50' },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search parent, title, date"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-400 focus:bg-white"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <Filter className="h-4 w-4 text-slate-400" />
              <CustomSelect
                value={scopeFilter}
                options={[
                { value: "all", label: "All flow" },
                { value: "incoming", label: "Incoming" },
                { value: "outgoing", label: "Outgoing" },
              ]}
                className="w-full"
              />
            </div>
            <CustomSelect
              value={statusFilter}
              options={[
              { value: "all", label: "All status" },
              { value: "pending", label: "Pending" },
              { value: "accepted", label: "Accepted" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
              { value: "rejected", label: "Rejected" },
              { value: "cancelled", label: "Cancelled" },
            ]}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-400 shadow-sm">
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-black text-slate-800">No meetings found</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Parent requests and your scheduled meetings will appear here.
            </p>
          </div>
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
              <article
                key={meeting.id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{meeting.title || 'Meeting'}</h3>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusTone}`}>
                        {status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                        meeting.isIncoming ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {meeting.isIncoming ? 'Incoming' : 'Outgoing'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                      <span>{meeting.counterpartName || 'Parent'}</span>
                      {meeting.counterpartRole && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          {String(meeting.counterpartRole).replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Date & Time</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {meeting.meetingDate || 'TBD'}{meeting.startTime ? ` • ${meeting.startTime}` : ''}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mode</p>
                        <p className="mt-1 text-sm font-bold capitalize text-slate-800">{meeting.meetingMode || 'online'}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Duration</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {meeting.durationMinutes ? `${meeting.durationMinutes} mins` : 'Not set'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Location / Link</p>
                        <p className="mt-1 truncate text-sm font-bold text-slate-800">
                          {meeting.meetingMode === 'offline'
                            ? meeting.location || 'Campus'
                            : meeting.meetingPlatform || meeting.meetingLink || 'Online'}
                        </p>
                      </div>
                    </div>

                    {meeting.description && (
                      <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                        {meeting.description}
                      </p>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 xl:w-[220px]">
                    {meeting.meetingMode === 'online' && meeting.meetingLink && !['completed', 'cancelled'].includes(status) && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        Join Link
                      </a>
                    )}

                    {meeting.meetingMode === 'offline' && meeting.location && (
                      <div className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                        <MapPin className="mr-2 h-4 w-4" />
                        {meeting.location}
                      </div>
                    )}

                    {status === 'pending' && meeting.isIncoming && (
                      <>
                        <button
                          type="button"
                          disabled={updatingId === meeting.id}
                          onClick={() => void updateStatus(meeting.id, 'accepted')}
                          className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === meeting.id}
                          onClick={() => void updateStatus(meeting.id, 'rejected')}
                          className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {status === 'pending' && meeting.isOutgoing && (
                      <button
                        type="button"
                        disabled={updatingId === meeting.id}
                        onClick={() => void updateStatus(meeting.id, 'cancelled')}
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}

                    {['accepted', 'scheduled'].includes(status) && (
                      <button
                        type="button"
                        disabled={updatingId === meeting.id}
                        onClick={() => void updateStatus(meeting.id, 'completed')}
                        className="rounded-2xl bg-blue-100 px-4 py-3 text-sm font-black text-blue-700 transition hover:bg-blue-200 disabled:opacity-60"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">Schedule Parent Meeting</h2>
                <p className="text-sm font-semibold text-slate-500">Step {step} of 2 &bull; Create a focused meeting request outside the chat flow.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setStep(1);
                }}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {step === 1 && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Parent</label>
                    <CustomSelect
                      value={form.parentId}
                      options={[
                      { value: "", label: loadingParents ? 'Loading parents...' : 'Select parent' },
                      ...parents.map((parent) => ({
                        value: parent.id,
                        label: `${parent.name}${parent.studentName ? ` • ${parent.studentName}` : ''}${parent.className ? ` • ${parent.className}` : ''}${parent.sectionName ? `-${parent.sectionName}` : ''}`
                      })),
                    ]}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Purpose</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-cyan-400 focus:bg-white"
                      placeholder="Discuss attendance, performance, assessments, or classroom follow-up."
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['online', 'offline'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, meetingMode: mode }))}
                          className={`rounded-2xl border px-4 py-3 text-sm font-black capitalize transition ${
                            form.meetingMode === mode
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Date</label>
                    <input
                      type="date"
                      value={form.meetingDate}
                      onChange={(e) => setForm((prev) => ({ ...prev, meetingDate: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Duration</label>
                    <CustomSelect
                      value={form.durationMinutes}
                      options={[
                      { value: "15", label: "15 mins" },
                      { value: "30", label: "30 mins" },
                      { value: "45", label: "45 mins" },
                      { value: "60", label: "60 mins" },
                    ]}
                      className="w-full"
                    />
                  </div>

                  {form.meetingMode === 'online' ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Platform</label>
                        <input
                          value={form.meetingPlatform}
                          onChange={(e) => setForm((prev) => ({ ...prev, meetingPlatform: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Meeting Link</label>
                        <input
                          value={form.meetingLink}
                          onChange={(e) => setForm((prev) => ({ ...prev, meetingLink: e.target.value }))}
                          placeholder="https://meet.google.com/..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Location</label>
                      <input
                        value={form.location}
                        onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="School campus / classroom / office"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-cyan-400 focus:bg-white"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (step === 2) setStep(1);
                  else {
                    setShowCreate(false);
                    setStep(1);
                  }
                }}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                {step === 2 ? 'Back' : 'Cancel'}
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  disabled={!form.parentId}
                  onClick={() => setStep(2)}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={creating || !form.parentId}
                  onClick={() => void createMeeting()}
                  className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:opacity-60"
                >
                  {creating ? 'Scheduling...' : 'Create Meeting'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
