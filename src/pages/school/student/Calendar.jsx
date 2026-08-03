import React, { useMemo, useState, useEffect } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Filter, 
  Clock, MapPin, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';
import Modal from '@/components/school/admin/Modal';
import { getEventDetails, getMonthTheme, EVENT_PRIORITY_ORDER } from '@/features/calendar/theme';
import { EventIcon, EventChip, EventCard, Hero, MonthlyFeaturedAchievementPanel } from '@/features/calendar/components';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useIsMobile } from '@/hooks/use-mobile';

const categoryStyles = {
  ACADEMIC: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  EXAM: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  HOLIDAY: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
  VACATION: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  MEETING: 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300',
  LIVE_CLASS: 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300',
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

const categoryOptions = ['ACADEMIC', 'EXAM', 'HOLIDAY', 'VACATION', 'MEETING', 'LIVE_CLASS', 'All'];

const categoryIcons = {
  ACADEMIC: '📚',
  EXAM: '📝',
  HOLIDAY: '🏖️',
  VACATION: '✈️',
  MEETING: '👨‍👩‍👧',
  LIVE_CLASS: '🎥',
  All: '📅',
};

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-\/${m}-\/${d}`.replace(/\//g, '-');
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

function sameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(event, day) {
  if (!event.startTime || !event.endTime) return false;
  const start = new Date(event.startTime);
  start.setHours(0, 0, 0, 0);
  const end = new Date(event.endTime);
  end.setHours(23, 59, 59, 999);
  const current = new Date(day);
  current.setHours(12, 0, 0, 0);
  return current >= start && current <= end;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const isMobile = useIsMobile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showExamsSyncModal, setShowExamsSyncModal] = useState(false);
  const [selectedInfoEvent, setSelectedInfoEvent] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
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

  useEffect(() => {
    async function loadFeatured() {
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
    loadFeatured();
  }, []);

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    
    const category = event.category?.toUpperCase() || '';
    const title = event.title || '';
    const linkedId = event.linkedId;

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
      if (event.assessmentStatus === 'completed') {
        navigate(`/school/student/assessments/${linkedId}`);
      } else {
        navigate(`/school/student/assessments/${linkedId}/view`);
      }
      return;
    }

    if (isLiveClass) {
      if (!linkedId) {
        toast.error('No details available');
        return;
      }
      navigate(`/school/student/live/${linkedId}/watch`);
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

  const sortEventsByPriority = (eventsList) => {
    return [...eventsList].sort((a, b) => {
      const priorityA = EVENT_PRIORITY_ORDER[a.category?.toUpperCase()] || 99;
      const priorityB = EVENT_PRIORITY_ORDER[b.category?.toUpperCase()] || 99;
      return priorityA - priorityB;
    });
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, currentMonth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events', {
        params: selectedCategory === 'All' ? undefined : { category: selectedCategory }
      });
      const data = res.data?.data ?? res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to sync calendar');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const cells = [];

    for (let i = 0; i < startPadding; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    
    return cells;
  }, [currentMonth]);

  const selectedDayEvents = useMemo(() => {
    if (!selectedDateKey) return [];
    const targetDate = new Date(selectedDateKey + 'T00:00:00.000Z');
    return events.filter((event) => sameDay(event.startTime, targetDate) || isWithinRange(event, targetDate));
  }, [events, selectedDateKey]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(events)) return map;
    events.forEach((event) => {
      if (!event.startTime) return;
      const startStr = event.startTime.split('T')[0];
      const endStr = event.endTime ? event.endTime.split('T')[0] : startStr;
      
      let current = new Date(startStr + 'T00:00:00.000Z');
      const end = new Date(endStr + 'T00:00:00.000Z');
      while (current.getTime() <= end.getTime()) {
        const key = current.toISOString().split('T')[0];
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(event);
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });
    return map;
  }, [events]);

  function goPrevious() {
    if (view === 'month') return setCurrentMonth((current) => addMonths(current, -1));
    if (view === 'week') return setCurrentMonth((current) => addDays(current, -7));
    if (view === 'agenda') return setCurrentMonth((current) => addDays(current, -14));
    return setCurrentMonth((current) => addDays(current, -1));
  }

  function goNext() {
    if (view === 'month') return setCurrentMonth((current) => addMonths(current, 1));
    if (view === 'week') return setCurrentMonth((current) => addDays(current, 7));
    if (view === 'agenda') return setCurrentMonth((current) => addDays(current, 14));
    return setCurrentMonth((current) => addDays(current, 1));
  }

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentMonth);
    const cells = [];
    for (let i = 0; i < 7; i += 1) cells.push(addDays(start, i));
    return cells;
  }, [currentMonth]);

  const agendaDays = useMemo(() => {
    const cells = [];
    for (let i = 0; i < 30; i += 1) cells.push(addDays(currentMonth, i));
    return cells;
  }, [currentMonth]);

  return (
    <div className="flex flex-col gap-3.5 sm:gap-4 lg:gap-5 px-3 pb-8 sm:px-5 dark:bg-slate-955">
      
      {/* Top Banner Row (Hero on left, Controls & Filters on right) */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch justify-between shrink-0">
        <div className="flex-1 lg:max-w-[62%] w-full flex flex-col">
          <Hero selectedDate={currentMonth} statsStr={null} />
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
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-355'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-1.5">
              <button 
                onClick={() => {
                  setCurrentMonth(new Date());
                  setSelectedDateKey(toDateKey(new Date()));
                }} 
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-55 hover:text-slate-900 shadow-2xs"
              >
                Today
              </button>
              <div className="flex items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-0.5 shadow-2xs">
                <button onClick={goPrevious} className="p-1 sm:p-2 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronLeft size={14} className="text-slate-600 dark:text-slate-400" />
                </button>
                <button onClick={goNext} className="p-1 sm:p-2 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg transition-all">
                  <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:gap-2.5 mt-1 sm:mt-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 z-10" />
              <CustomSelect
                onChange={setSelectedCategory}
                value={selectedCategory}
                options={categoryOptions.map((item) => ({ value: item, label: item.replace('_', ' ') }))}
                className="w-full"
                triggerClassName="flex h-full w-full items-center justify-between gap-1 pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white text-[10px] sm:text-xs font-semibold outline-none text-slate-700 shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Section */}
      <div className="w-full flex flex-col">
        {/* Main Grid Wrapper */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm w-full flex flex-col md:flex-row items-stretch">
          {/* Permanent Left Achievement Panel */}
          <MonthlyFeaturedAchievementPanel
            selectedDate={currentMonth}
            school={user?.school || user?.institute}
            customAchievements={featuredAchievements}
            isAdmin={false}
          />

          {/* Right Column: Calendar Grid */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
          
          {loading ? (
            <div className="p-8 text-center text-sm font-bold text-slate-455 animate-pulse uppercase tracking-wider">
              Loading calendar view...
            </div>
          ) : view === 'month' ? (
            isMobile ? (
              /* Mobile: Compact responsive month grid + events list */
              <div className="p-4 sm:hidden bg-slate-50/50 dark:bg-slate-955/20 rounded-[2rem] border border-slate-105 dark:border-slate-800">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold tracking-tight uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div key={idx} className="py-1">{day[0]}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {monthDays.map((day, index) => {
                    if (!day) return <div key={"empty-" + index} className="aspect-square" />;
                    const key = toDateKey(day);
                    const dayEvents = eventsByDate.get(key) || [];
                    const isToday = key === toDateKey(new Date());
                    const isSelected = key === selectedDateKey;
                    const topEvent = dayEvents.length > 0 ? sortEventsByPriority(dayEvents)[0] : null;
                    const categoryGradient = topEvent ? CATEGORY_CELL_GRADIENTS[topEvent.category?.toUpperCase()] : null;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDateKey(key)}
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
                    <h3 className="text-sm font-bold text-slate-805 dark:text-slate-202">
                      {new Date(selectedDateKey + 'T00:00:00.000Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
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
                        handleEventClick={handleEventClick}
                      />
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs font-semibold text-slate-405 dark:text-slate-500">
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
                  {calendarDays.map((day, index) => {
                    if (!day) return <div key={"empty-" + index} className="min-h-[68px] sm:min-h-[76px] md:min-h-[86px] xl:min-h-[96px] rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40" />;
                    const key = toDateKey(day);
                    const dayEvents = events.filter((event) => sameDay(event.startTime, day) || isWithinRange(event, day));
                    const isToday = key === toDateKey(new Date());
                    const isSelected = key === selectedDateKey;
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
                          key={key}
                          onClick={() => {
                            setSelectedDateKey(key);
                          }}
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
                                isSelected ? "bg-blue-600 dark:bg-sky-400" : "bg-blue-500 dark:bg-sky-505"
                              )} />
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-end min-h-0">
                            {dayEvents.length === 1 ? (
                              <EventChip 
                                event={dayEvents[0]} 
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
                  const key = toDateKey(day);
                  const dayEvents = eventsByDate.get(key) || [];
                  const isToday = key === toDateKey(new Date());
                  const isSat = day.getDay() === 6;
                  const isSun = day.getDay() === 0;
                  return (
                    <div 
                      key={key} 
                      className={cn(
                        "border-r border-slate-100 dark:border-slate-800 p-3 last:border-r-0 transition-colors",
                        isSat 
                          ? "bg-blue-50/15 dark:bg-blue-955/5" 
                          : isSun 
                            ? "bg-orange-50/15 dark:bg-orange-955/5" 
                            : "bg-white dark:bg-slate-900"
                      )}
                    >
                      <div className={cn('mb-3 rounded-2xl px-3 py-2 text-center border', 
                        isToday 
                          ? 'bg-blue-50 dark:bg-blue-955/40 text-blue-700 dark:text-sky-300 border-blue-200 dark:border-blue-800' 
                          : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-655 dark:text-slate-350 border-slate-100 dark:border-slate-800'
                      )}>
                        <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em]">{day.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-2xl font-bold">{day.getDate()}</p>
                      </div>
                      <div className="space-y-2">
                        {sortEventsByPriority(dayEvents).map(ev => (
                          <EventChip 
                            key={ev.id} 
                            event={ev} 
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
                <p className="text-[10px] font-bold tracking-tight uppercase tracking-[0.25em] text-slate-455">Selected Day</p>
                <p className="mt-1 text-xl font-bold text-slate-955 dark:text-white">{new Date(selectedDateKey + 'T00:00:00.000Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    handleEventClick={handleEventClick} 
                  />
                ))}
                {selectedDayEvents.length === 0 && (
                  <div className="py-12 text-center text-xs font-semibold text-slate-455 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/40 border border-dashed rounded-3xl">
                    No events scheduled for this day.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="space-y-3">
                {agendaDays.map((day) => {
                  const key = toDateKey(day);
                  const dayEvents = eventsByDate.get(key) || [];
                  if (!dayEvents.length) return null;
                  return (
                    <div key={key} className="rounded-3xl border border-slate-105 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-955 dark:text-white">{day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                        <span className="text-[10px] font-bold tracking-tight uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">{dayEvents.length} events</span>
                      </div>
                      <div className="space-y-3">
                        {sortEventsByPriority(dayEvents).map((event) => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
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


      <Modal isOpen={showUpcomingModal} title="Upcoming Agenda" onClose={() => setShowUpcomingModal(false)} size="md">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 py-2">
          {events.slice(0, 5).map(ev => (
            <button 
              key={ev.id} 
              onClick={(e) => {
                setShowUpcomingModal(false);
                handleEventClick(ev, e);
              }}
              className="w-full flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left transition hover:bg-white dark:hover:bg-slate-800 group hover:scale-[1.01] hover:underline cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="shrink-0 text-[22px] opacity-90 transition-opacity group-hover:opacity-100">{categoryIcons[ev.category] || '📅'}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950 dark:text-white">{ev.title}</p>
                  <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                    📅 {new Date(ev.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {ev.isAllDay ? '' : ` • ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
              <span className={cn('ml-2 shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-tight uppercase', categoryStyles[ev.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350')}>
                {ev.category.replace('_', ' ')}
              </span>
            </button>
          ))}
          {events.length === 0 && !loading && (
            <div className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
              No events scheduled for this period.
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={showExamsSyncModal} title="Final Exams Sync" onClose={() => setShowExamsSyncModal(false)} size="md">
        <div className="p-2">
          <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-[10px] font-bold tracking-tight uppercase tracking-widest text-amber-500">Academic Focus</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Final Exams Sync</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Automated exam scheduling is active. Ensure all academic tasks are completed before the deadline.</p>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold tracking-tight uppercase tracking-widest border border-white/10 transition-all">View Exam Rules</button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={infoModalOpen} 
        title={
          selectedInfoEvent ? (
            <span className={cn('inline-flex rounded-full border px-3 py-1 text-[10px] font-bold tracking-tight uppercase', categoryStyles[selectedInfoEvent.category] || 'bg-slate-50 text-slate-700 border-slate-100')}>
              {selectedInfoEvent.category?.replace('_', ' ') || 'Event'}
            </span>
          ) : 'Event Details'
        } 
        onClose={() => setInfoModalOpen(false)} 
        size="md"
      >
        {selectedInfoEvent && (
          <div className="space-y-4 p-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedInfoEvent.title}</h3>
            {selectedInfoEvent.description && (
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100/50 dark:border-slate-850">
                {selectedInfoEvent.description}
              </p>
            )}
            <div className="grid gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">📅 Date:</span>
                <span>
                  {selectedInfoEvent.isAllDay 
                    ? `${new Date(selectedInfoEvent.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} (All Day)`
                    : `${new Date(selectedInfoEvent.startTime).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} • ${new Date(selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(selectedInfoEvent.endTime || selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  }
                </span>
              </div>
              {selectedInfoEvent.location && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📍 Location:</span>
                  <span>{selectedInfoEvent.location}</span>
                </div>
              )}
              {selectedInfoEvent.priority && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">⚠️ Priority:</span>
                  <span className="capitalize">{selectedInfoEvent.priority.toLowerCase()}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setInfoModalOpen(false)} 
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border hover:brightness-95 dark:hover:brightness-110",
                  categoryStyles[selectedInfoEvent.category] || 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200'
                )}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
