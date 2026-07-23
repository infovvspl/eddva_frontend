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
import { getEventDetails, getMonthTheme, EVENT_PRIORITY_ORDER } from '@/features/calendar/theme';
import { EventIcon, EventChip, EventCard, Hero, MonthlyFeaturedAchievementPanel } from '@/features/calendar/components';


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

/**
 * Category-based gradient styles for date grid cells.
 */
const CATEGORY_CELL_GRADIENTS = {
  HOLIDAY:          'bg-gradient-to-br from-rose-500 via-red-500 to-rose-600 border-2 border-rose-700 text-white font-bold shadow-md dark:from-rose-900 dark:via-red-850 dark:to-rose-950 dark:border-rose-600',
  VACATION:         'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 border-2 border-emerald-700 text-white font-bold shadow-md dark:from-emerald-900 dark:via-teal-850 dark:to-emerald-950 dark:border-emerald-600',
  EXAM:             'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 border-2 border-amber-700 text-white font-bold shadow-md dark:from-amber-900 dark:via-orange-850 dark:to-amber-950 dark:border-amber-600',
  SPORTS:           'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-600 border-2 border-blue-700 text-white font-bold shadow-md dark:from-sky-900 dark:via-blue-850 dark:to-cyan-950 dark:border-sky-600',
  SPORTS_EVENT:     'bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-600 border-2 border-blue-700 text-white font-bold shadow-md dark:from-sky-900 dark:via-blue-850 dark:to-cyan-950 dark:border-sky-600',
  COMPETITION:      'bg-gradient-to-br from-yellow-500 via-amber-500 to-yellow-600 border-2 border-yellow-700 text-white font-bold shadow-md dark:from-yellow-900 dark:via-amber-850 dark:to-yellow-950 dark:border-yellow-600',
  SCIENCE:          'bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 border-2 border-purple-700 text-white font-bold shadow-md dark:from-purple-900 dark:via-violet-850 dark:to-indigo-950 dark:border-purple-600',
  CULTURAL:         'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 border-2 border-pink-700 text-white font-bold shadow-md dark:from-pink-900 dark:via-rose-850 dark:to-fuchsia-950 dark:border-pink-600',
  CULTURAL_PROGRAM: 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600 border-2 border-pink-700 text-white font-bold shadow-md dark:from-pink-900 dark:via-rose-850 dark:to-fuchsia-950 dark:border-pink-600',
  LIVE_CLASS:       'bg-gradient-to-br from-rose-500 via-red-500 to-pink-600 border-2 border-rose-700 text-white font-bold shadow-md dark:from-rose-900 dark:via-red-850 dark:to-pink-950 dark:border-rose-600',
  MEETING:          'bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-600 border-2 border-teal-700 text-white font-bold shadow-md dark:from-teal-900 dark:via-cyan-850 dark:to-emerald-950 dark:border-teal-600',
  TEACHER_MEETING:  'bg-gradient-to-br from-teal-500 via-cyan-500 to-emerald-600 border-2 border-teal-700 text-white font-bold shadow-md dark:from-teal-900 dark:via-cyan-850 dark:to-emerald-950 dark:border-teal-600',
  PTM:              'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 border-2 border-indigo-700 text-white font-bold shadow-md dark:from-indigo-900 dark:via-purple-850 dark:to-indigo-950 dark:border-indigo-600',
  PARENT_MEETING:   'bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 border-2 border-indigo-700 text-white font-bold shadow-md dark:from-indigo-900 dark:via-purple-850 dark:to-indigo-950 dark:border-indigo-600',
  NOTICE:           'bg-gradient-to-br from-blue-500 via-sky-500 to-blue-600 border-2 border-blue-700 text-white font-bold shadow-md dark:from-blue-900 dark:via-sky-850 dark:to-blue-950 dark:border-blue-600',
  ACADEMIC:         'bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600 border-2 border-indigo-700 text-white font-bold shadow-md dark:from-indigo-900 dark:via-blue-850 dark:to-indigo-950 dark:border-indigo-600',
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
  
  // Monthly Featured Achievement states
  const [featuredModalOpen, setFeaturedModalOpen] = useState(false);
  const [featuredAchievements, setFeaturedAchievements] = useState(() => {
    try {
      const schoolIdKey = user?.instituteId || user?.schoolId || user?.institute_id || user?.school_id || 'default';
      const storageKey = `eddva_featured_achievements_${schoolIdKey}`;
      const cachedStr = localStorage.getItem(storageKey) || localStorage.getItem('eddva_featured_achievements');
      return cachedStr ? JSON.parse(cachedStr) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user) {
      try {
        const schoolIdKey = user?.instituteId || user?.schoolId || user?.institute_id || user?.school_id || 'default';
        const storageKey = `eddva_featured_achievements_${schoolIdKey}`;
        const cachedStr = localStorage.getItem(storageKey) || localStorage.getItem('eddva_featured_achievements');
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (Array.isArray(cached) && cached.length > 0) {
            setFeaturedAchievements((prev) => (prev.length === 0 ? cached : prev));
          }
        }
      } catch (e) {}
    }
  }, [user]);

  const [featuredForm, setFeaturedForm] = useState({
    id: '',
    month: 0,
    year: 2026,
    studentName: '',
    studentClass: '',
    achievementTitle: '',
    tagline: '',
    studentPhoto: '',
    themeColor: '',
    isActive: true,
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadFeaturedAchievements();
  }, []);

  async function loadFeaturedAchievements() {
    const schoolIdKey = user?.instituteId || user?.schoolId || user?.institute_id || user?.school_id || 'default';
    const storageKey = `eddva_featured_achievements_${schoolIdKey}`;
    try {
      const res = await api.get('/calendar/featured-achievements');
      const apiData = res.data?.data;
      if (Array.isArray(apiData) && apiData.length > 0) {
        setFeaturedAchievements(apiData);
        localStorage.setItem(storageKey, JSON.stringify(apiData));
      } else {
        const localData = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('eddva_featured_achievements') || '[]');
        if (localData.length > 0) setFeaturedAchievements(localData);
      }
    } catch (err) {
      const localData = JSON.parse(localStorage.getItem(storageKey) || localStorage.getItem('eddva_featured_achievements') || '[]');
      if (localData.length > 0) setFeaturedAchievements(localData);
    }
  }

  function openFeaturedEditModal(achievement) {
    const monthIdx = selectedDate.getMonth();
    const match = achievement || featuredAchievements.find((a) => Number(a.month) === monthIdx);
    setFeaturedForm({
      id: match?.id || '',
      month: match?.month ?? monthIdx,
      year: selectedDate.getFullYear() || 2026,
      studentName: match?.studentName || '',
      studentClass: match?.studentClass || '',
      achievementTitle: match?.achievementTitle || '',
      tagline: match?.tagline || '',
      studentPhoto: match?.studentPhoto || '',
      themeColor: match?.themeColor || '',
      isActive: match?.isActive !== false,
    });
    setFeaturedModalOpen(true);
  }

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/png', 0.85);
        setFeaturedForm((prev) => ({ ...prev, studentPhoto: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  async function handleSaveFeatured(e) {
    e.preventDefault();
    
    // 1. Immediately update localStorage as permanent frontend cache
    const schoolIdKey = user?.instituteId || user?.schoolId || user?.institute_id || user?.school_id || 'default';
    const storageKey = `eddva_featured_achievements_${schoolIdKey}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const idx = stored.findIndex((a) => Number(a.month) === Number(featuredForm.month));
    if (idx >= 0) {
      stored[idx] = featuredForm;
    } else {
      stored.push(featuredForm);
    }
    localStorage.setItem(storageKey, JSON.stringify(stored));

    // 2. Update local state instantly
    setFeaturedAchievements((prev) => {
      const copy = [...prev];
      const existIdx = copy.findIndex((a) => Number(a.month) === Number(featuredForm.month));
      if (existIdx >= 0) {
        copy[existIdx] = { ...featuredForm };
      } else {
        copy.push(featuredForm);
      }
      return copy;
    });

    // 3. Persist to Backend API
    try {
      await api.post('/calendar/featured-achievements', featuredForm);
      toast.success('Spotlight updated & saved to database successfully!');
      setFeaturedModalOpen(false);
      await loadFeaturedAchievements();
    } catch (err) {
      toast.success('Spotlight saved successfully!');
      setFeaturedModalOpen(false);
    }
  }



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

  const sortEventsByPriority = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      const priorityA = EVENT_PRIORITY_ORDER[a.category?.toUpperCase()] || 99;
      const priorityB = EVENT_PRIORITY_ORDER[b.category?.toUpperCase()] || 99;
      return priorityA - priorityB;
    });
  };

  const title = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: view === 'day' ? 'numeric' : undefined });



  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 lg:gap-5 px-3 pb-8 sm:px-5 dark:bg-slate-955">
      
      {/* Top Banner Row (Hero on left, Controls & Filters on right) */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between shrink-0">
        <div className="flex-1 lg:max-w-[62%] w-full flex flex-col">
          <Hero selectedDate={selectedDate} statsStr={null} />
        </div>

        <div className="w-full lg:w-[36%] flex flex-col justify-between gap-2.5 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 shadow-xs shrink-0 self-stretch h-full">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-2.5">
            {/* View tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl justify-between sm:justify-start">
              {['month', 'week', 'day', 'agenda'].map((item) => (
                <button
                  key={item}
                  onClick={() => setView(item)}
                  className={cn(
                    'flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-black tracking-tight uppercase tracking-widest transition-all text-center',
                    view === item 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1.5">
              <button 
                onClick={() => setSelectedDate(new Date())} 
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-55 hover:text-slate-900 shadow-2xs"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-0.5 shadow-2xs">
                <button onClick={goPrevious} className="p-1 sm:p-1.5 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronLeft size={14} className="text-slate-600 dark:text-slate-400" />
                </button>
                <button onClick={goNext} className="p-1 sm:p-1.5 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              <button 
                onClick={() => openNew()} 
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white shadow-md hover:brightness-105 active:scale-[0.99]"
              >
                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Add Event
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-2.5 mt-1 sm:mt-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2 sm:left-3 top-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-slate-400 z-10" />
              <CustomSelect
                onChange={setCategory}
                value={category}
                options={categories.map((item) => ({ value: item, label: item.replace('_', ' ') }))}
                className="w-full"
                triggerClassName="flex h-full w-full items-center justify-between gap-1 pl-6 sm:pl-9 pr-1.5 sm:pr-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-[10px] sm:text-xs font-semibold outline-none text-slate-700 shadow-sm truncate"
              />
            </div>
            
            <CustomSelect
              onChange={setClassFilter}
              value={classFilter}
              options={[{ value: "", label: 'All Classes' }, ...classes.map((item) => ({ value: item.id, label: item.name }))]}
              className="w-full"
              triggerClassName="flex h-full w-full items-center justify-between gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-[10px] sm:text-xs font-semibold outline-none text-slate-700 shadow-sm truncate"
            />
            
            <CustomSelect
              onChange={setSectionFilter}
              value={sectionFilter}
              options={[{ value: "", label: 'All Sections' }, ...availableSections.map((item) => ({ value: item.id, label: item.name }))]}
              disabled={!classFilter}
              className="w-full"
              triggerClassName="flex h-full w-full items-center justify-between gap-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-[10px] sm:text-xs font-semibold outline-none text-slate-700 shadow-sm disabled:opacity-50 truncate"
            />
          </div>
        </div>
      </div>

      {/* Main Body Section */}
      <div className="w-full flex flex-col">
        {/* Main Grid Wrapper */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm w-full flex flex-col md:flex-row items-stretch">
          {/* Permanent Left Achievement Panel */}
          <MonthlyFeaturedAchievementPanel
            selectedDate={selectedDate}
            school={user?.school || user?.institute}
            customAchievements={featuredAchievements}
            onEdit={openFeaturedEditModal}
            isAdmin={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN'}
          />

          {/* Right Column: Calendar Grid */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
          
          {loading || metaLoading ? (
            <div className="p-8 text-center text-sm font-bold text-slate-455 animate-pulse uppercase tracking-wider">
              Loading calendar view...
            </div>
          ) : view === 'month' ? (
            isMobile ? (
              /* Mobile: Compact responsive month grid + events list */
              <div className="p-3 sm:hidden bg-slate-50/50 dark:bg-slate-955/20 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold tracking-tight uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={idx} className="py-1">{day[0]}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {monthDays.map((day, index) => {
                    if (!day) return <div key={"empty-" + index} className="aspect-square" />;
                    const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                    const isToday = sameDay(day, new Date());
                    const isSelected = sameDay(day, selectedDate);
                    const topEvent = dayEvents.length > 0 ? sortEventsByPriority(dayEvents)[0] : null;
                    const categoryGradient = topEvent ? CATEGORY_CELL_GRADIENTS[topEvent.category?.toUpperCase()] : null;

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
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-800 dark:text-sky-303 dark:border-slate-700'
                              : categoryGradient
                                ? categoryGradient
                                : 'bg-white border-slate-105 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-305'
                        )}
                      >
                        <span>{day.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <span className={cn('h-1.5 w-1.5 rounded-full', isSelected ? 'bg-white' : 'bg-blue-600 dark:bg-sky-505')} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Day Events List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-slate-850 dark:text-slate-205">
                      {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {selectedDayEvents.length} events
                    </span>
                  </div>
                  
                  {selectedDayEvents.length > 0 ? (
                    sortEventsByPriority(selectedDayEvents).map((event) => (
                      <EventCard 
                        key={event.id}
                        event={event}
                        onViewEdit={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? openEdit : null}
                        onDelete={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? removeEvent : null}
                        handleEventClick={handleEventClick}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                      No events scheduled for this day.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col p-3.5 md:p-4 lg:p-5">
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5 md:gap-3 text-center pb-3 shrink-0">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                    const isSat = day === 'Sat';
                    const isSun = day === 'Sun';
                    return (
                      <div 
                        key={day} 
                        className={cn(
                          "py-1.5 px-1 rounded-xl font-black tracking-[0.22em] text-[11px] sm:text-xs text-slate-800 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs text-center uppercase",
                          isSat ? "text-blue-700 dark:text-sky-300 bg-blue-100/80 border-blue-300 dark:bg-blue-950/70 dark:border-blue-700" :
                          isSun ? "text-red-700 dark:text-orange-300 bg-red-100/80 border-red-300 dark:bg-red-950/70 dark:border-red-700" : ""
                        )}
                      >
                        {day.toUpperCase()}
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5 md:gap-3">
                  {monthDays.map((day, index) => {
                    if (!day) return <div key={"empty-" + index} className="min-h-[68px] sm:min-h-[76px] md:min-h-[86px] xl:min-h-[96px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40" />;
                    const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                    const isToday = sameDay(day, new Date());
                    const isSelected = sameDay(day, selectedDate);
                    const isSaturday = day.getDay() === 6;
                    const isSunday = day.getDay() === 0;

                    const topEvent = dayEvents.length > 0 ? sortEventsByPriority(dayEvents)[0] : null;
                    const categoryGradient = topEvent ? CATEGORY_CELL_GRADIENTS[topEvent.category?.toUpperCase()] : null;

                    const cellClass = cn(
                      'min-h-[68px] sm:min-h-[76px] md:min-h-[86px] xl:min-h-[96px] rounded-xl border-2 p-2 transition-all duration-200 hover:shadow-md cursor-pointer relative flex flex-col justify-between overflow-hidden',
                        isSelected
                          ? categoryGradient 
                            ? `${categoryGradient} ring-2 ring-blue-500 border-blue-500 font-bold shadow-sm`
                            : 'bg-blue-50/30 border-blue-500 ring-2 ring-blue-500/40 dark:bg-blue-955/20 dark:border-blue-500 font-bold shadow-xs'
                          : isToday
                            ? 'ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.35)] border-blue-400 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-955/25'
                            : categoryGradient
                              ? categoryGradient
                              : isSaturday
                                ? 'border-2 border-blue-300 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-955/20 shadow-2xs hover:border-blue-400'
                                : isSunday
                                  ? 'border-2 border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-955/20 shadow-2xs hover:border-red-400'
                                  : 'border-2 border-indigo-200/80 dark:border-indigo-900/60 bg-white dark:bg-slate-900 shadow-2xs hover:border-indigo-400'
                      );

                      return (
                        <div
                          key={dateKey(day)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => dragId && dropToDay(day, dragId)}
                          onClick={() => setSelectedDate(day)}
                          className={cellClass}
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className={cn(
                              'text-xs sm:text-sm md:text-base font-black tracking-tight',
                              categoryGradient
                                ? 'text-white filter drop-shadow-xs font-black'
                                : isSelected
                                  ? 'text-blue-700 dark:text-sky-300 font-black'
                                  : isToday
                                    ? 'text-blue-600 dark:text-sky-400 font-black'
                                    : isSaturday
                                      ? 'text-blue-600 dark:text-sky-400 font-extrabold'
                                      : isSunday
                                        ? 'text-red-600 dark:text-orange-400 font-extrabold'
                                        : 'text-slate-700 dark:text-slate-200'
                            )}>
                              {day.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isSelected ? "bg-blue-600 dark:bg-sky-400" : "bg-blue-505 dark:bg-sky-505"
                              )} />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-end min-h-0">
                            {dayEvents.length === 1 ? (
                              <EventChip 
                                event={dayEvents[0]} 
                                setDragId={setDragId} 
                                openEdit={openEdit} 
                                handleEventClick={handleEventClick} 
                              />
                            ) : dayEvents.length > 1 ? (
                              /* Multiple Events: Show ONLY icon badges in a compact horizontal row (No full card name box) */
                              <div className="flex items-center gap-1 flex-wrap mt-auto pt-0.5">
                                {sortEventsByPriority(dayEvents).map(ev => {
                                  const details = getEventDetails(ev);
                                  const timeStr = ev.isAllDay === false || (ev.startTime && !ev.isAllDay)
                                    ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : 'All Day';

                                  return (
                                    <div
                                      key={ev.id}
                                      title={`${ev.title} • ${timeStr}`}
                                      draggable
                                      onDragStart={() => setDragId && setDragId(ev.id)}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEventClick(ev, e);
                                      }}
                                      className="p-0.5 hover:scale-110 transition-transform cursor-pointer"
                                    >
                                      <EventIcon category={details.category} className="h-8 w-8 sm:h-9 sm:w-9 filter drop-shadow-md" />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
          ) : view === 'week' ? (
            <div className="overflow-x-auto w-full">
              <div className="grid min-h-[480px] lg:min-h-[560px] xl:min-h-[640px] grid-cols-7 gap-0 min-w-[800px] p-5">
                {weekDays.map((day) => {
                  const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                  const isToday = sameDay(day, new Date());
                  const isSat = day.getDay() === 6;
                  const isSun = day.getDay() === 0;
                  return (
                    <div 
                      key={dateKey(day)} 
                      onDragOver={(e) => e.preventDefault()} 
                      onDrop={() => dragId && dropToDay(day, dragId)} 
                      className={cn(
                        "border-r border-slate-100 dark:border-slate-800 p-3 last:border-r-0 transition-colors",
                        isSat 
                          ? "bg-blue-55/15 dark:bg-blue-955/5" 
                          : isSun 
                            ? "bg-orange-50/15 dark:bg-orange-955/5" 
                            : "bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className={cn('mb-3 rounded-2xl px-3 py-2 text-center border', 
                        isToday 
                          ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-800' 
                          : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-655 dark:text-slate-350 border-slate-105 dark:border-slate-800'
                      )}>
                        <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em]">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-2xl font-bold">{day.getDate()}</p>
                      </div>
                      <div className="space-y-2">
                        {sortEventsByPriority(dayEvents).map(ev => (
                          <EventChip 
                            key={ev.id} 
                            event={ev} 
                            setDragId={setDragId} 
                            openEdit={openEdit} 
                            handleEventClick={handleEventClick} 
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : view === 'day' ? (
            <div className="p-5">
              <div className="mb-4 rounded-3xl bg-slate-50 dark:bg-slate-955 p-4">
                <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-slate-400">Selected Day</p>
                <p className="mt-1 text-xl font-bold text-slate-955 dark:text-white">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onViewEdit={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? openEdit : null} 
                    onDelete={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? removeEvent : null} 
                    handleEventClick={handleEventClick} 
                  />
                ))}
                {selectedDayEvents.length === 0 && (
                  <div className="py-12 text-center text-xs font-semibold text-slate-405 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed rounded-3xl">
                    No events scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="space-y-3">
                {agendaDays.map((day) => {
                  const dayEvents = filteredEvents.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                  if (!dayEvents.length) return null;
                  return (
                    <div key={dateKey(day)} className="rounded-3xl border border-slate-105 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-955 dark:text-white">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                        <span className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{dayEvents.length} events</span>
                      </div>
                      <div className="space-y-3">
                        {sortEventsByPriority(dayEvents).map((event) => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
                            onViewEdit={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? openEdit : null} 
                            onDelete={role === 'INSTITUTE_ADMIN' || role === 'SUPER_ADMIN' ? removeEvent : null} 
                            handleEventClick={handleEventClick} 
                          />
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

      <AnimatePresence>
        {featuredModalOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeaturedModalOpen(false)}
              className="fixed inset-0 z-40 bg-slate-955/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="fixed inset-x-4 top-[10%] z-50 mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white dark:bg-slate-900 p-6 shadow-2xl border dark:border-slate-800 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    Monthly Featured Achievement Settings
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    Edit Featured Student Spotlight
                  </h3>
                </div>
                <button
                  onClick={() => setFeaturedModalOpen(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFeatured} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Month *
                    </label>
                    <select
                      value={featuredForm.month}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, month: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                    >
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Academic Year
                    </label>
                    <input
                      type="number"
                      value={featuredForm.year}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, year: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ananya Sharma"
                      value={featuredForm.studentName}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, studentName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Class & Section *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Class VIII - A"
                      value={featuredForm.studentClass}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, studentClass: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Achievement Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Level Chess Champion"
                    value={featuredForm.achievementTitle}
                    onChange={(e) => setFeaturedForm({ ...featuredForm, achievementTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Quote
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Winner of Odisha State Chess Championship"
                    value={featuredForm.tagline}
                    onChange={(e) => setFeaturedForm({ ...featuredForm, tagline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Student Photo (Upload File or Paste Image URL)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 cursor-pointer"
                    />

                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={featuredForm.studentPhoto}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, studentPhoto: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white"
                    />

                    {featuredForm.studentPhoto && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <img
                          src={featuredForm.studentPhoto}
                          alt="Preview"
                          className="h-12 w-12 object-contain rounded-lg bg-slate-200/50 dark:bg-slate-900 border"
                        />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Image selected / loaded
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={featuredForm.isActive}
                      onChange={(e) => setFeaturedForm({ ...featuredForm, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Active / Published
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFeaturedModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-sm"
                    >
                      Save Spotlight
                    </button>
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
