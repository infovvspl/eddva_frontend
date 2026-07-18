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
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import Modal from '@/components/school/admin/Modal';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';
import { useConfirm } from '@/context/ConfirmContext';
import { CustomSelect } from "@/components/ui/CustomSelect";


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

const categoryIcons = {
  ACADEMIC: '📚',
  EXAM: '📝',
  HOLIDAY: '🏖️',
  VACATION: '✈️',
  ASSIGNMENT: '📄',
  PARENT_MEETING: '👨‍👩‍👧',
  TEACHER_MEETING: '👩‍🏫',
  LIVE_CLASS: '🎥',
  SPORTS_EVENT: '⚽',
  CULTURAL_PROGRAM: '🎭',
};


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
  classId: 'ALL',
  sectionId: 'ALL',
  subjectId: 'ALL',
  teacherId: 'ALL',
  meetingUrl: '',
  meetingPlatform: 'Zoom',
  recurrenceRule: '',
  reminderMinutes: 30,
  linkedId: '',
};

const ALL_TARGET = 'ALL';

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'TEACHER';
  
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
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedInfoEvent, setSelectedInfoEvent] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const handleMobileAddEvent = async ({ title, date, type }) => {
    try {
      const payload = {
        title,
        description: '',
        category: type,
        startTime: new Date(date).toISOString(),
        endTime: new Date(date).toISOString(),
        priority: 'NORMAL',
        isAllDay: true,
        reminderMinutes: 30,
      };
      await api.post('/events', payload);
      toast.success('Event scheduled successfully');
      loadEvents();
    } catch {
      toast.error('Failed to schedule event');
    }
  };


  const handleEventClick = (event, e) => {
    e.stopPropagation();
    
    const category = event.category?.toUpperCase() || '';
    const title = event.title || '';
    const linkedId = event.linkedId;

    const isAdmin = role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN';
    if (isAdmin) {
      setSelectedInfoEvent(event);
      setInfoModalOpen(true);
      return;
    }

    const isExam = category === 'EXAM' || title.toLowerCase().includes('unit test');
    const isHoliday = category === 'HOLIDAY' || category === 'VACATION';
    const isLiveClass = category === 'LIVE_CLASS';
    const isActivity = category === 'SPORTS_EVENT' || category === 'CULTURAL_PROGRAM' || title.toLowerCase().includes('sports day') || title.toLowerCase().includes('activity');

    if (isHoliday) {
      setSelectedInfoEvent(event);
      setInfoModalOpen(true);
      return;
    }

    if (isExam) {
      if (!linkedId) {
        toast.error('No details available');
        return;
      }
      if (role === 'TEACHER' || role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN') {
        if (event.assessmentStatus === 'completed') {
          navigate(`/school/teacher/assessments/${linkedId}`, { state: { activeTabId: 'submissions' } });
        } else {
          navigate(`/school/teacher/assessments/${linkedId}`);
        }
      } else {
        if (event.assessmentStatus === 'completed') {
          navigate(`/school/student/assessments/${linkedId}`);
        } else {
          navigate(`/school/student/assessments/${linkedId}/view`);
        }
      }
      return;
    }

    if (isLiveClass) {
      if (!linkedId) {
        toast.error('No details available');
        return;
      }
      if (role === 'TEACHER' || role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN') {
        navigate(`/school/teacher/live/${linkedId}/dashboard`);
      } else {
        navigate(`/school/student/live/${linkedId}/watch`);
      }
      return;
    }

    if (isActivity) {
      if (!linkedId) {
        setSelectedInfoEvent(event);
        setInfoModalOpen(true);
      } else {
        navigate(`/events/${linkedId}`);
      }
      return;
    }

    setSelectedInfoEvent(event);
    setInfoModalOpen(true);
  };

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
      classId: event.classId || ALL_TARGET,
      sectionId: event.sectionId || ALL_TARGET,
      subjectId: event.subjectId || ALL_TARGET,
      teacherId: event.teacherId || ALL_TARGET,
      meetingUrl: event.meetingUrl || '',
      meetingPlatform: event.meetingPlatform || 'Zoom',
      recurrenceRule: event.recurrenceRule || '',
      reminderMinutes: event.reminderMinutes ?? 30,
      linkedId: event.linkedId || '',
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
        classId: form.classId === ALL_TARGET ? null : form.classId || null,
        sectionId: form.sectionId === ALL_TARGET ? null : form.sectionId || null,
        subjectId: form.subjectId === ALL_TARGET ? null : form.subjectId || null,
        teacherId: form.teacherId === ALL_TARGET ? null : form.teacherId || null,
        meetingUrl: form.meetingUrl || null,
        meetingPlatform: form.meetingPlatform || null,
        recurrenceRule: form.recurrenceRule || null,
        reminderMinutes: Number(form.reminderMinutes || 30),
        linkedId: form.linkedId || null,
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
      <div
        key={event.id}
        draggable
        onDragStart={() => setDragId(event.id)}
        onClick={(e) => handleEventClick(event, e)}
        className={cn(
          'group flex w-full items-center justify-between gap-1.5 rounded-xl border px-2 py-1 text-left text-[10px] font-bold shadow-sm transition hover:shadow-md hover:scale-[1.02] hover:underline cursor-pointer active:scale-[0.99] ring-1 ring-slate-100',
          categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100'
        )}
      >
        <span className="min-w-0 flex-1 truncate">{event.title}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openEdit(event);
          }}
          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
        >
          <Edit3 className="h-3 w-3 opacity-50 hover:opacity-100 text-current" />
        </button>
      </div>
    );
  }

  const title = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: view === 'day' ? 'numeric' : undefined });



  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-6 px-4 pb-10 sm:px-6 dark:bg-slate-950">
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-white via-sky-50/20 to-white dark:from-slate-900 dark:via-slate-800/40 dark:to-slate-900 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-blue-50 dark:bg-slate-800 px-3 py-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-blue-700 dark:text-sky-300"><Sparkles className="h-3.5 w-3.5" /> {calendarLabel}</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950 dark:text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{calendarDescription}</p>
            </div>

            {isMobile ? (
              <div className="flex flex-col gap-2.5 w-full">
                <CustomSelect
                  value={view}
                  onChange={(val) => setView(val)}
                  options={[
                    { value: 'month', label: 'Month View' },
                    { value: 'week', label: 'Week View' },
                    { value: 'day', label: 'Day View' },
                    { value: 'agenda', label: 'Agenda View' },
                  ]}
                  className="w-full"
                  triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
                />
                <div className="flex flex-wrap gap-2 w-full">
                  <button onClick={() => setSelectedDate(new Date())} className="flex-1 text-center rounded-xl border border-slate-150 bg-white px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-750 hover:bg-slate-50">
                    Today
                  </button>
                  <button onClick={() => setSummaryModalOpen(true)} className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-150 bg-white px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-750 hover:bg-slate-50">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Summary
                  </button>
                  <button onClick={() => {
                    const now = new Date();
                    const start = new Date(now);
                    start.setHours(9, 0, 0, 0);
                    const end = new Date(now);
                    end.setHours(10, 0, 0, 0);
                    setEditingEvent(null);
                    setForm({ ...defaultForm, category: 'LIVE_CLASS', startTime: localDateTime(start), endTime: localDateTime(end) });
                    setModalOpen(true);
                  }} className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-amber-250 bg-amber-50 px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-100">
                    <Video className="h-3.5 w-3.5" />
                    Live
                  </button>
                  <button onClick={() => openNew()} className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:brightness-105 active:scale-[0.99]">
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  {['month', 'week', 'day', 'agenda'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setView(item)}
                      className={cn(
                        'inline-flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] transition',
                        view === item ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white' : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800'
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

                <button onClick={() => setSummaryModalOpen(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <LayoutGrid className="h-4 w-4" />
                  Summary
                </button>

                <button onClick={() => {
                  const now = new Date();
                  const start = new Date(now);
                  start.setHours(9, 0, 0, 0);
                  const end = new Date(now);
                  end.setHours(10, 0, 0, 0);
                  setEditingEvent(null);
                  setForm({ ...defaultForm, category: 'LIVE_CLASS', startTime: localDateTime(start), endTime: localDateTime(end) });
                  setModalOpen(true);
                }} className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40">
                  <Video className="h-4 w-4" />
                  Live Class
                </button>

                <button onClick={() => openNew()} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs font-bold tracking-tight uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]">
                  <Plus className="h-4 w-4" />
                  Add Event
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] gap-2.5 border-b border-slate-100 dark:border-slate-800 p-4 lg:p-5">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
              <CustomSelect
                onChange={setCategory}
                value={category}
                options={categories.map((item) => ({ value: item, label: item.replace('_', ' ') }))}
                className="w-full"
                triggerClassName="flex h-full w-full items-center justify-between gap-1 pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:contents">
              <CustomSelect
                onChange={setClassFilter}
                value={classFilter}
                options={[
                  { value: "", label: "All Classes" },
                  ...classes.map((item) => ({ value: item.id, label: item.name })),
                ]}
                className="w-full"
                triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
              />
              <CustomSelect
                onChange={setSectionFilter}
                value={sectionFilter}
                options={[
                  { value: "", label: "All Sections" },
                  ...availableSections.map((section) => ({ value: section.id, label: section.name })),
                ]}
                className="w-full"
                triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold tracking-tight uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              <button type="button" onClick={goPrevious} className="rounded-xl border border-slate-100 bg-white px-4 py-2 hover:bg-slate-50">Prev</button>
              <button type="button" onClick={goNext} className="rounded-xl border border-slate-100 bg-white px-4 py-2 hover:bg-slate-50">Next</button>
            </div>
          </div>

          <div className="grid gap-0">
            <div>
              {loading || metaLoading ? (
                <div className="p-8 text-sm text-slate-500 dark:text-slate-450">Loading calendar...</div>
              ) : view === 'month' ? (
                isMobile ? (
                  /* Mobile: Compact responsive month grid + events list */
                  <div className="p-4 sm:hidden bg-slate-50/50 dark:bg-slate-950/20 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold tracking-tight uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-2">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                        <div key={idx} className="py-1">{day[0]}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {monthDays.map((day, index) => {
                        if (!day) return <div key={`empty-${index}`} className="aspect-square" />;
                        const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                        const isToday = sameDay(day, new Date());
                        const isSelected = sameDay(day, selectedDate);
                        return (
                          <button
                            key={dateKey(day)}
                            type="button"
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              'aspect-square flex flex-col items-center justify-between p-1 rounded-xl border text-xs font-semibold relative transition',
                              isSelected 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : isToday
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700'
                                  : 'bg-white border-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            )}
                          >
                            <span>{day.getDate()}</span>
                            {dayEvents.length > 0 && (
                              <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-blue-600 dark:bg-sky-500')} />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Day Events List */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {selectedDayEvents.length} events
                        </span>
                      </div>
                      
                      {selectedDayEvents.length > 0 ? (
                        selectedDayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => handleEventClick(event, e)}
                            className="flex flex-col gap-2 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-sm active:scale-[0.99] transition cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350')}>
                                  {event.category.replace('_', ' ')}
                                </span>
                                <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white leading-snug">{event.title}</h4>
                              </div>
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openEdit(event)}
                                  className="p-1 rounded-lg border border-slate-150 bg-slate-50 dark:border-slate-750 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {event.location}</span>}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                          No events scheduled for this day.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <div className="min-w-[800px] p-5">
                      <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day} className="py-2">{day}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-3">
                        {monthDays.map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="min-h-16 lg:min-h-20 xl:min-h-24 rounded-[1.5rem] border border-dashed border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40" />;
                          const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                          const isToday = sameDay(day, new Date());
                          return (
                            <div
                              key={dateKey(day)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={() => dragId && dropToDay(day, dragId)}
                              onClick={() => setSelectedDate(day)}
                              className={cn('min-h-16 lg:min-h-20 xl:min-h-24 rounded-[1.5rem] border p-2 transition hover:shadow-lg', isToday ? 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900')}
                            >
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className={cn('text-xs font-bold tracking-tight', isToday ? 'text-blue-700 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500')}>{day.getDate()}</span>
                                {dayEvents.length > 0 && <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-sky-500" />}
                              </div>
                              <div className="space-y-1">
                                {dayEvents.slice(0, 3).map(renderEventChip)}
                                {dayEvents.length > 3 && <p className="text-center text-[9px] font-bold tracking-tight text-slate-400 dark:text-slate-500">+{dayEvents.length - 3} more</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )
              ) : view === 'week' ? (
                <div className="overflow-x-auto w-full">
                  <div className="grid min-h-[480px] lg:min-h-[560px] xl:min-h-[640px] grid-cols-7 gap-0 min-w-[800px]">
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
                      <div 
                        key={event.id} 
                        draggable 
                        onDragStart={() => setDragId(event.id)} 
                        onClick={(e) => handleEventClick(event, e)}
                        className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:shadow-lg hover:scale-[1.01] hover:underline cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase tracking-[0.2em]', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-750')}>
                              {event.category.replace('_', ' ')}
                            </div>
                            <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{event.title}</h3>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{event.description || 'No description'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(event);
                              }} 
                              className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeEvent(event.id);
                              }} 
                              className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-3 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
                              <div 
                                key={event.id} 
                                draggable 
                                onDragStart={() => setDragId(event.id)} 
                                onClick={(e) => handleEventClick(event, e)}
                                className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-left hover:shadow-md hover:scale-[1.01] hover:underline cursor-pointer transition-all duration-150"
                              >
                                <div>
                                  <p className="text-sm font-bold text-slate-950 dark:text-white">{event.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location || 'No location'}</p>
                                </div>
                                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                                  <span className={cn('rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100')}>
                                    {event.category.replace('_', ' ')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEdit(event);
                                    }}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>
      </div>

      <AnimatePresence>
        {summaryModalOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSummaryModalOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed inset-x-3 sm:inset-x-4 top-[8%] sm:top-[10%] z-50 mx-auto max-h-[85vh] w-[calc(100%-1.5rem)] sm:w-full max-w-3xl overflow-y-auto rounded-2xl sm:rounded-[2rem] bg-slate-50 dark:bg-slate-950 shadow-2xl border dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5 bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-slate-950 dark:text-white">Calendar Summary & Events</h2>
                </div>
                <button onClick={() => setSummaryModalOpen(false)} className="rounded-2xl p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 sm:h-5 w-4 sm:w-5" /></button>
              </div>
              <div className="p-3 sm:p-5 grid gap-4 sm:gap-6 md:grid-cols-2">
                <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                  <h3 className="mb-3 sm:mb-4 text-[10px] sm:text-[11px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400">Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter((item) => item !== 'All').map((item) => (
                      <div key={item} className="flex flex-col items-center justify-center rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-2 sm:py-3 px-1 text-center transition hover:border-slate-200 dark:hover:border-slate-700">
                        <span className="text-base sm:text-xl mb-0.5 sm:mb-1">{categoryIcons[item] || '📅'}</span>
                        <p className="text-sm sm:text-lg font-black text-slate-950 dark:text-white leading-none">{summary[item] || 0}</p>
                        <p className="mt-1 w-full truncate text-[7px] sm:text-[8px] font-bold tracking-tight uppercase text-slate-400 dark:text-slate-500">{item.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 p-3 sm:p-5 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col max-h-[400px] sm:max-h-[500px]">
                  <div className="mb-3 sm:mb-4 flex items-center justify-between shrink-0">
                    <h3 className="text-[10px] sm:text-[11px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400">Upcoming Events</h3>
                    <BellRing className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                  <div className="space-y-2 overflow-y-auto pr-1 pb-1">
                    {upcomingEvents.map((event) => (
                      <button key={event.id} onClick={(e) => { setSummaryModalOpen(false); handleEventClick(event, e); }} className="w-full flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-left transition hover:bg-white dark:hover:bg-slate-800 group hover:scale-[1.01] hover:underline cursor-pointer">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="shrink-0 text-lg sm:text-[22px] opacity-90 transition-opacity group-hover:opacity-100">{categoryIcons[event.category] || '📅'}</span>
                          <div className="min-w-0">
                            <p className="truncate text-xs sm:text-sm font-bold text-slate-950 dark:text-white">{event.title}</p>
                            <p className="truncate text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              📅 {new Date(event.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className={cn('ml-2 shrink-0 rounded-md border px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold tracking-tight uppercase', categoryStyles[event.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350')}>
                          {event.category.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                    {!upcomingEvents.length && <p className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">No upcoming events.</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setModalOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed inset-x-3 sm:inset-x-4 top-4 sm:top-6 z-50 mx-auto max-h-[calc(100vh-2rem)] w-[calc(100%-1.5rem)] sm:w-full max-w-3xl overflow-y-auto rounded-2xl sm:rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-4 sm:p-5">
                <div>
                  <p className="text-[9px] sm:text-[10px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Academic Event</p>
                  <h2 className="mt-1 text-base sm:text-xl font-bold text-slate-950 dark:text-white">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="rounded-2xl p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 sm:h-5 w-4 sm:w-5" /></button>
              </div>
              <form onSubmit={saveEvent} className="space-y-3.5 sm:space-y-5 p-4 sm:p-5">
                <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
                  <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <CustomSelect
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    options={[
                      { value: "HOLIDAY", label: "Holiday" },
                      { value: "EXAM", label: "Exam" },
                      { value: "EVENT", label: "Event" },
                      { value: "TERM", label: "Term Start/End" }
                    ]}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
                  />
                  <input type="datetime-local" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <input type="datetime-local" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <CustomSelect
                    onChange={(val) => setForm(prev => ({ ...prev, priority: val }))}
                    value={form.priority}
                    options={[
                      { value: "LOW", label: "Low" },
                      { value: "NORMAL", label: "Normal" },
                      { value: "HIGH", label: "High" },
                      { value: "URGENT", label: "Urgent" },
                    ]}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
                  />
                </div>
                <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CustomSelect
                    onChange={(val) => setForm(prev => ({ ...prev, classId: val }))}
                    value={form.classId}
                    options={[
                      { value: ALL_TARGET, label: "All classes" },
                      ...classes.map((item) => ({ value: item.id, label: classLabel(item) })),
                    ]}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
                  />
                  <CustomSelect
                    onChange={(val) => setForm(prev => ({ ...prev, sectionId: val }))}
                    value={form.sectionId}
                    options={[
                      { value: ALL_TARGET, label: form.classId === ALL_TARGET ? 'All sections' : 'All sections in class' },
                      ...formSections.map((section) => ({ value: section.id, label: sectionLabel(section) })),
                    ]}
                    disabled={form.classId === ALL_TARGET || !formSections.length}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <CustomSelect
                    onChange={(val) => setForm(prev => ({ ...prev, subjectId: val }))}
                    value={form.subjectId}
                    options={[
                      { value: ALL_TARGET, label: "All subjects" },
                      ...subjects.map((subject) => ({ value: subject.id, label: subjectLabel(subject) })),
                    ]}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
                  />
                  <CustomSelect
                    onChange={(val) => setForm(prev => ({ ...prev, teacherId: val }))}
                    value={form.teacherId}
                    options={[
                      { value: ALL_TARGET, label: "All teachers" },
                      ...teachers.map((teacher) => ({ value: teacher.teacherProfile?.id || teacher.id, label: teacherLabel(teacher) })),
                    ]}
                    className="w-full"
                    triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold outline-none text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
                  />
                  <input value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} placeholder="Zoom / Meet link" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <input value={form.meetingPlatform} onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })} placeholder="Meeting platform" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <input value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value })} placeholder="Recurrence rule" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <input value={form.linkedId} onChange={(e) => setForm({ ...form, linkedId: e.target.value })} placeholder="Linked ID (e.g. Exam/Live Class ID)" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                  <input type="number" min="0" value={form.reminderMinutes} onChange={(e) => setForm({ ...form, reminderMinutes: e.target.value })} placeholder="Reminder minutes" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm" />
                </div>
                <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 dark:border-slate-800 sm:rounded-2xl sm:px-4 sm:py-3">
                  <input type="checkbox" checked={form.isAllDay} onChange={(e) => setForm({ ...form, isAllDay: e.target.checked })} />
                  All day event
                </label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Event description" className="h-20 sm:h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-3xl sm:px-4 sm:py-3 sm:text-sm" />
                <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                  {editingEvent && (
                    <button type="button" onClick={() => { removeEvent(editingEvent.id); setModalOpen(false); }} className="rounded-xl border border-red-200 px-4 py-2 font-bold tracking-tight uppercase text-red-600 hover:bg-red-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-red-950/20 sm:rounded-2xl sm:px-5 sm:py-3">
                      Delete
                    </button>
                  )}
                  <div className="ml-auto flex gap-2 sm:gap-3">
                    <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 font-bold tracking-tight uppercase text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 sm:rounded-2xl sm:px-5 sm:py-3">Cancel</button>
                    <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-bold tracking-tight uppercase text-white shadow-md hover:brightness-110 active:scale-[0.99] sm:rounded-2xl sm:px-6 sm:py-3">{editingEvent ? 'Update' : 'Save'}</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {infoModalOpen && selectedInfoEvent && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfoModalOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} className="fixed inset-x-4 top-[20%] z-50 mx-auto max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 p-5 sticky top-0 z-10 bg-white dark:bg-slate-900">
                <div>
                  <span className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase', categoryStyles[selectedInfoEvent.category] || 'bg-slate-50 text-slate-700 border-slate-100')}>
                    {selectedInfoEvent.category?.replace('_', ' ') || 'Event'}
                  </span>
                </div>
                <button onClick={() => setInfoModalOpen(false)} className="rounded-2xl p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-slate-950 dark:text-white">{selectedInfoEvent.title}</h3>
                {selectedInfoEvent.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50/55 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100/50 dark:border-slate-850">
                    {selectedInfoEvent.description}
                  </p>
                )}
                <div className="grid gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400 pt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>
                      {selectedInfoEvent.isAllDay 
                        ? `${new Date(selectedInfoEvent.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} (All Day)`
                        : `${new Date(selectedInfoEvent.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} • ${new Date(selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedInfoEvent.endTime || selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      }
                    </span>
                  </div>
                  {selectedInfoEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{selectedInfoEvent.location}</span>
                    </div>
                  )}
                  {selectedInfoEvent.priority && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="capitalize">Priority: {selectedInfoEvent.priority.toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end">
                <button
                  onClick={() => setInfoModalOpen(false)}
                  className={cn(
                    "rounded-2xl px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all border hover:brightness-95 dark:hover:brightness-110",
                    categoryStyles[selectedInfoEvent.category] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200'
                  )}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
