import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Filter,
  LayoutGrid,
  MapPin,
  Plus,
  Repeat,
  Sparkles,
  Trash2,
  Video,
  BellRing,
  Users,
  X,
} from 'lucide-react';
import Modal from '@/components/school/admin/Modal';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';
import { useConfirm } from '@/context/ConfirmContext';

const categories = [
  'All',
  'ACADEMIC',
  'EXAM',
  'HOLIDAY',
  'VACATION',
  'ASSIGNMENT',
  'PARENT_MEETING',
  'TEACHER_MEETING',
  'LIVE_CLASS',
  'SPORTS_EVENT',
  'CULTURAL_PROGRAM',
];

const categoryStyles = {
  ACADEMIC: 'bg-blue-50 text-blue-700 border-blue-200',
  EXAM: 'bg-amber-50 text-amber-700 border-amber-200',
  HOLIDAY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  VACATION: 'bg-amber-50 text-amber-700 border-amber-200',
  ASSIGNMENT: 'bg-violet-50 text-violet-700 border-violet-200',
  PARENT_MEETING: 'bg-sky-50 text-sky-700 border-sky-200',
  TEACHER_MEETING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  LIVE_CLASS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SPORTS_EVENT: 'bg-orange-50 text-orange-700 border-orange-200',
  CULTURAL_PROGRAM: 'bg-pink-50 text-pink-700 border-pink-200',
};

const defaultForm = {
  title: '',
  description: '',
  category: 'ACADEMIC',
  startTime: '',
  endTime: '',
  priority: 'NORMAL',
  isAllDay: false,
  classId: '',
  sectionId: '',
  subjectId: '',
  teacherId: '',
  meetingUrl: '',
  meetingPlatform: 'Zoom',
  recurrenceRule: '',
  reminderMinutes: 30,
};

function dateKey(date) {
  if (!date) return '';
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return '';
}

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

function sameDay(a, b) {
  return a && b && dateKey(a) === dateKey(b);
}

function isWithinRange(event, date) {
  const target = dateKey(date);
  const start = dateKey(event.startTime);
  const end = dateKey(event.endTime || event.startTime);
  return target >= start && target <= end;
}

export default function AcademicCalendar({
  calendarLabel = 'Academic Calendar',
  calendarDescription = 'Month, week, day and agenda planning for academic events, exams, holidays and live classes.',
  quickTitle = 'Live Class + Zoom / Meet',
  quickDescription = 'Plan live classes, attach meeting links, assign teachers and subjects, and keep upcoming events synced with dashboard widgets.',
  quickActionLabel = 'Schedule Live Class',
}) {
  const confirm = useConfirm();
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [category, setCategory] = useState('All');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [form, setForm] = useState(defaultForm);

  function dispatchChanged() {
    window.dispatchEvent(new CustomEvent('eddva:data-changed', { detail: { resource: 'calendar' } }));
  }

  async function loadEvents() {
    try {
      setLoading(true);
      const res = await api.get('/events', { params: category === 'All' ? undefined : { category } });
      const data = res.data?.data ?? res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to sync calendar');
    } finally {
      setLoading(false);
    }
  }

  async function loadClasses() {
    try {
      const res = await api.get('/academic/classes');
      setClasses(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load class list');
    }
  }

  async function loadTeachers() {
    try {
      const res = await api.get('/teachers');
      setTeachers(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load teacher list');
    }
  }

  async function loadSubjects() {
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load subject list');
    }
  }

  useEffect(() => {
    let isMounted = true;
    setMetaLoading(true);
    Promise.allSettled([loadClasses(), loadTeachers(), loadSubjects()]).finally(() => {
      if (isMounted) setMetaLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadEvents();
    const onChanged = () => loadEvents();
    window.addEventListener('eddva:data-changed', onChanged);
    const interval = setInterval(loadEvents, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('eddva:data-changed', onChanged);
    };
  }, [category]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (category !== 'All' && event.category !== category) return false;
      if (classFilter && String(event.classId || '').toLowerCase() !== classFilter.toLowerCase()) return false;
      if (sectionFilter && String(event.sectionId || '').toLowerCase() !== sectionFilter.toLowerCase()) return false;
      return true;
    });
  }, [events, category, classFilter, sectionFilter]);

  const activeClass = useMemo(() => classes.find((item) => item.id === classFilter) || null, [classes, classFilter]);
  const availableSections = useMemo(() => {
    if (!activeClass?.sections) return [];
    return Array.isArray(activeClass.sections) ? activeClass.sections : [];
  }, [activeClass]);

  const formClass = useMemo(() => classes.find((item) => item.id === form.classId) || null, [classes, form.classId]);
  const formSections = useMemo(() => {
    if (!formClass?.sections) return [];
    return Array.isArray(formClass.sections) ? formClass.sections : [];
  }, [formClass]);

  const teacherLabel = (teacher) => teacher?.name || teacher?.teacherProfile?.employeeId || 'Unnamed Teacher';
  const subjectLabel = (subject) => subject?.name || subject?.code || 'Unnamed Subject';
  const classLabel = (item) => item?.name || 'Unnamed Class';
  const sectionLabel = (item) => item?.name || 'Unnamed Section';

  function goPrevious() {
    if (view === 'month') return setSelectedDate((current) => addMonths(current, -1));
    if (view === 'week') return setSelectedDate((current) => addDays(current, -7));
    if (view === 'agenda') return setSelectedDate((current) => addDays(current, -14));
    return setSelectedDate((current) => addDays(current, -1));
  }

  function goNext() {
    if (view === 'month') return setSelectedDate((current) => addMonths(current, 1));
    if (view === 'week') return setSelectedDate((current) => addDays(current, 7));
    if (view === 'agenda') return setSelectedDate((current) => addDays(current, 14));
    return setSelectedDate((current) => addDays(current, 1));
  }

  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPadding = (first.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < startPadding; i += 1) cells.push(null);
    for (let day = 1; day <= last.getDate(); day += 1) cells.push(new Date(year, month, day));
    return cells;
  }, [selectedDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [selectedDate]);

  const agendaDays = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 14 }, (_, index) => addDays(start, index));
  }, [selectedDate]);

  const selectedDayEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => sameDay(event.startTime, selectedDate) || isWithinRange(event, selectedDate))
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [filteredEvents, selectedDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...filteredEvents]
      .filter((event) => new Date(event.startTime) >= now)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, 6);
  }, [filteredEvents]);

  const summary = useMemo(() => {
    const counts = categories.filter((item) => item !== 'All').reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
    filteredEvents.forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
  }, [filteredEvents]);

  function openNew(date = selectedDate) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    const end = new Date(date);
    end.setHours(10, 0, 0, 0);
    setEditingEvent(null);
    setForm({ ...defaultForm, startTime: localDateTime(start), endTime: localDateTime(end) });
    setModalOpen(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'ACADEMIC',
      startTime: localDateTime(event.startTime),
      endTime: localDateTime(event.endTime),
      priority: event.priority || 'NORMAL',
      isAllDay: Boolean(event.isAllDay),
      classId: event.classId || '',
      sectionId: event.sectionId || '',
      subjectId: event.subjectId || '',
      teacherId: event.teacherId || '',
      meetingUrl: event.meetingUrl || '',
      meetingPlatform: event.meetingPlatform || 'Zoom',
      recurrenceRule: event.recurrenceRule || '',
      reminderMinutes: event.reminderMinutes ?? 30,
    });
    setModalOpen(true);
  }

  async function saveEvent(e) {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: form.category,
        startTime: form.startTime,
        endTime: form.endTime,
        priority: form.priority,
        isAllDay: form.isAllDay,
        classId: form.classId || null,
        sectionId: form.sectionId || null,
        subjectId: form.subjectId || null,
        teacherId: form.teacherId || null,
        meetingUrl: form.meetingUrl || null,
        meetingPlatform: form.meetingPlatform || null,
        recurrenceRule: form.recurrenceRule || null,
        reminderMinutes: Number(form.reminderMinutes || 30),
      };

      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, payload);
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', payload);
        toast.success('Event scheduled successfully');
      }

      setModalOpen(false);
      setEditingEvent(null);
      setForm(defaultForm);
      dispatchChanged();
      await loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  }

  async function removeEvent(id) {
    const confirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this event? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event removed');
      dispatchChanged();
      await loadEvents();
    } catch {
      toast.error('Deletion failed');
    }
  }

  async function dropToDay(date, eventId) {
    const ev = filteredEvents.find((item) => item.id === eventId);
    if (!ev) return;
    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const newStart = new Date(date);
    newStart.setHours(start.getHours(), start.getMinutes(), 0, 0);
    const duration = end.getTime() - start.getTime();
    const newEnd = new Date(newStart.getTime() + Math.max(duration, 60 * 60 * 1000));
    try {
      await api.put(`/events/${ev.id}`, {
        ...ev,
        startTime: localDateTime(newStart),
        endTime: localDateTime(newEnd),
      });
      toast.success('Event rescheduled');
      dispatchChanged();
      await loadEvents();
    } catch {
      toast.error('Could not move event');
    }
  }

  function renderEventChip(event) {
    return (
      <button
        key={event.id}
        type="button"
        draggable
        onDragStart={() => setDragId(event.id)}
        onClick={() => openEdit(event)}
        className={cn(
          'group flex w-full items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-xs font-bold shadow-sm transition hover:shadow-sm ring-1 ring-slate-100',
          categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100'
        )}
      >
        <span className="min-w-0 flex-1 truncate">{event.title}</span>
        <Edit3 className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
      </button>
    );
  }

  const title = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: view === 'day' ? 'numeric' : undefined });

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1600px] flex-col lg:flex-row gap-6 px-4 pb-10 sm:px-6 dark:bg-slate-950">
      <div className="flex-1 space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-white via-sky-50/20 to-white dark:from-slate-900 dark:via-slate-800/40 dark:to-slate-900 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-blue-700 dark:text-sky-300"><Sparkles className="h-3.5 w-3.5" /> {calendarLabel}</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{calendarDescription}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                {['month', 'week', 'day', 'agenda'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setView(item)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] transition',
                      view === item ? 'bg-slate-950 text-white dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    {item === 'month' && <LayoutGrid className="h-4 w-4" />}
                    {item === 'week' && <CalendarRange className="h-4 w-4" />}
                    {item === 'day' && <CalendarClock className="h-4 w-4" />}
                    {item === 'agenda' && <CalendarDays className="h-4 w-4" />}
                    {item}
                  </button>
                ))}
              </div>

              <button onClick={() => setSelectedDate(new Date())} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                Today
              </button>

              <button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">
                <Plus className="h-4 w-4" />
                Add Event
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-100 dark:border-slate-800 p-5 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
                {categories.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
              </select>
            </div>
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setSectionFilter(''); }} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
              <option value="">All Classes</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none">
              <option value="">All Sections</option>
              {availableSections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tracking-tight uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <button type="button" onClick={goPrevious} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">Prev</button>
              <button type="button" onClick={goNext} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
            <div className="border-b border-slate-100 dark:border-slate-800 lg:border-b-0 lg:border-r lg:border-slate-100 lg:dark:border-slate-800">
              {loading || metaLoading ? (
                <div className="p-8 text-sm text-slate-500 dark:text-slate-450">Loading calendar...</div>
              ) : view === 'month' ? (
                <div className="overflow-x-auto w-full">
                  <div className="min-w-[800px] p-5">
                    <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                      {monthDays.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} className="min-h-40 rounded-3xl border border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40" />;
                        const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                        const isToday = sameDay(day, new Date());
                        return (
                          <div
                            key={dateKey(day)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => dragId && dropToDay(day, dragId)}
                            onClick={() => setSelectedDate(day)}
                            className={cn('min-h-40 rounded-3xl border p-3 transition hover:shadow-lg', isToday ? 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <span className={cn('text-xs font-bold tracking-tight', isToday ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500')}>{day.getDate()}</span>
                              {dayEvents.length > 0 && <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-sky-500" />}
                            </div>
                            <div className="space-y-2">
                              {dayEvents.slice(0, 3).map(renderEventChip)}
                              {dayEvents.length > 3 && <p className="text-center text-[10px] font-bold tracking-tight text-slate-400 dark:text-slate-500">+{dayEvents.length - 3} more</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : view === 'week' ? (
                <div className="overflow-x-auto w-full">
                  <div className="grid min-h-[760px] grid-cols-7 gap-0 min-w-[800px]">
                    {weekDays.map((day) => {
                      const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                      const isToday = sameDay(day, new Date());
                      return (
                        <div key={dateKey(day)} onDragOver={(e) => e.preventDefault()} onDrop={() => dragId && dropToDay(day, dragId)} className="border-r border-slate-100 dark:border-slate-800 p-3 last:border-r-0 bg-white dark:bg-slate-900">
                          <div className={cn('mb-3 rounded-2xl px-3 py-2 text-center', isToday ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-sky-300' : 'bg-slate-50 dark:bg-slate-950/50 text-slate-600 dark:text-slate-300')}>
                            <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em]">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <p className="text-2xl font-bold">{day.getDate()}</p>
                          </div>
                          <div className="space-y-2">
                            {dayEvents.map(renderEventChip)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : view === 'day' ? (
                <div className="p-5">
                  <div className="mb-4 rounded-3xl bg-slate-50 dark:bg-slate-950 p-4">
                    <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-slate-400">Selected Day</p>
                    <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="space-y-3">
                    {selectedDayEvents.map((event) => (
                      <div key={event.id} draggable onDragStart={() => setDragId(event.id)} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.2em]', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-750')}>
                              {event.category.replace('_', ' ')}
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{event.title}</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.description || 'No description'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(event)} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => removeEvent(event.id)} className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-3 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-red-950/20"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>}
                          {event.meetingPlatform && <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" /> {event.meetingPlatform}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="space-y-3">
                    {agendaDays.map((day) => {
                      const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                      if (!dayEvents.length) return null;
                      return (
                        <div key={dateKey(day)} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-950 dark:text-white">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                            <span className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{dayEvents.length} events</span>
                          </div>
                          <div className="space-y-2">
                            {dayEvents.map((event) => (
                              <button key={event.id} draggable onDragStart={() => setDragId(event.id)} onClick={() => openEdit(event)} className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left">
                                <div>
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">{event.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'No location'}</p>
                                </div>
                                <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100')}>{event.category.replace('_', ' ')}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4 bg-slate-50/50 dark:bg-slate-900/50 p-5">
              <div className="rounded-[2rem] bg-white dark:bg-slate-950 p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400">Upcoming Events</h3>
                  <BellRing className="h-4 w-4 text-slate-300" />
                </div>
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <button key={event.id} onClick={() => openEdit(event)} className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 text-left transition hover:bg-white dark:hover:bg-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950 dark:text-white">{event.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(event.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <span className={cn('rounded-full border px-2 py-1 text-[9px] font-bold tracking-tight uppercase', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350')}>{event.category.replace('_', ' ')}</span>
                      </div>
                    </button>
                  ))}
                  {!upcomingEvents.length && <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No upcoming events.</p>}
                </div>
              </div>

              <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-xl">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-[10px] font-bold tracking-tight uppercase tracking-[0.24em]">Quick Actions</span>
                </div>
                <h3 className="mt-3 text-lg font-bold">{quickTitle}</h3>
                <p className="mt-2 text-sm text-slate-300">{quickDescription}</p>
                <button onClick={() => openNew()} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.2em] text-slate-950 hover:bg-slate-100">{quickActionLabel}</button>
              </div>

              <div className="rounded-[2rem] bg-white dark:bg-slate-950 p-5 shadow-sm">
                <h3 className="text-[11px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400">Summary</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {categories.filter((item) => item !== 'All').map((item) => (
                    <div key={item} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                      <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.replace('_', ' ')}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">{summary[item] || 0}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed inset-x-4 top-6 z-50 mx-auto max-h-[calc(100vh-3rem)] max-w-3xl overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5">
                <div>
                  <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Academic Event</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-2xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <form onSubmit={saveEvent} className="space-y-5 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400" />
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none">
                    {categories.filter((item) => item !== 'All').map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}
                  </select>
                  <input type="datetime-local" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                  <input type="datetime-local" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none">
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <select
                    value={form.classId}
                    onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: '' })}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none"
                  >
                    <option value="">Select class</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>{classLabel(item)}</option>
                    ))}
                  </select>
                  <select
                    value={form.sectionId}
                    onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                    disabled={!form.classId || !formSections.length}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800"
                  >
                    <option value="">{form.classId ? 'Select section' : 'Select class first'}</option>
                    {formSections.map((section) => (
                      <option key={section.id} value={section.id}>{sectionLabel(section)}</option>
                    ))}
                  </select>
                  <select
                    value={form.subjectId}
                    onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subjectLabel(subject)}</option>
                    ))}
                  </select>
                  <select
                    value={form.teacherId}
                    onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                    className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none"
                  >
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.teacherProfile?.id || teacher.id} value={teacher.teacherProfile?.id || teacher.id}>
                        {teacherLabel(teacher)}
                      </option>
                    ))}
                  </select>
                  <input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="Zoom / Meet link" className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                  <input value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })} placeholder="Meeting platform" className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                  <input value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value })} placeholder="Recurrence rule" className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                  <input type="number" min="0" value={form.reminderMinutes} onChange={(e) => setForm({ ...form, reminderMinutes: e.target.value })} placeholder="Reminder minutes" className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={form.isAllDay} onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })} />
                  All day event
                </label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" className="h-28 w-full rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-3 text-sm font-semibold outline-none" />
                <div className="flex gap-3">
                  {editingEvent && (
                    <button type="button" onClick={() => { removeEvent(editingEvent.id); setModalOpen(false); }} className="rounded-2xl border border-red-200 dark:border-rose-900 px-5 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.2em] text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-red-950/20">
                      Delete
                    </button>
                  )}
                  <div className="ml-auto flex gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">Cancel</button>
                    <button type="submit" className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">{editingEvent ? 'Update Event' : 'Save Event'}</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
