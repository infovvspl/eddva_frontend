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
import { useIsMobile } from '@/hooks/use-mobile';

const categoryStyles = {
  ACADEMIC: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  EXAM: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  HOLIDAY: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
  VACATION: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  MEETING: 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300',
  LIVE_CLASS: 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300',
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
  return `${y}-${m}-${d}`;
}

export default function Calendar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';
  const isMobile = useIsMobile();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [showExamsSyncModal, setShowExamsSyncModal] = useState(false);
  const [selectedInfoEvent, setSelectedInfoEvent] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

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

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, currentMonth]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events', {
        params: { category: selectedCategory }
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

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <div className="w-full space-y-5 px-3 pb-20 sm:space-y-8 sm:px-6">
      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Institutional Calendar</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Exams, vacations, and academic milestones.</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center justify-between mt-1">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-100 dark:border-slate-800">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
              <div className="px-2 flex items-center font-bold tracking-tight text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowUpcomingModal(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm"
              >
                <Clock className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={() => setShowExamsSyncModal(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Institutional Calendar</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Unified view for exams, vacations, and academic milestones.</p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowUpcomingModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99]"
            >
              <Clock className="h-4 w-4 text-slate-500" />
              Upcoming Agenda
            </button>
            <button
              onClick={() => setShowExamsSyncModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 active:scale-[0.99]"
            >
              <AlertTriangle className="h-4 w-4" />
              Final Exams Sync
            </button>
            <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-100 dark:border-slate-800">
              <button onClick={prevMonth} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
              <div className="px-6 flex items-center font-bold tracking-tight text-xs uppercase tracking-widest text-slate-900 dark:text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={nextMonth} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        {isMobile ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-4">
            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {categoryOptions.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-bold tracking-tight uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedCategory === cat 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400"
                  )}
                >
                  {cat.replace('_', ' ')}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 animate-pulse uppercase tracking-wider">Syncing schedule...</p>
              </div>
            ) : (
              <div>
                {/* 7 columns grid for weekdays */}
                <div className="mb-2 grid grid-cols-7 gap-1.5">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                    <div key={idx} className="text-center text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest pb-1">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="aspect-square rounded-lg bg-slate-50/20 dark:bg-slate-900/10 border border-dashed border-slate-100/50 dark:border-slate-800/20" />;
                    
                    const key = toDateKey(day);
                    const dayEvents = eventsByDate.get(key) || [];
                    const isToday = key === toDateKey(new Date());
                    const isSelected = key === selectedDateKey;
                    
                    return (
                      <div
                        key={key}
                        onClick={() => setSelectedDateKey(key)}
                        className={cn(
                          "aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-center relative cursor-pointer",
                          isSelected 
                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10" 
                            : isToday 
                            ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800 text-blue-600 font-bold" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <span className="text-xs font-black">{day.getDate()}</span>
                        {dayEvents.length > 0 && (
                          <span className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-blue-650 dark:bg-blue-400")} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Events timeline list */}
                <div className="mt-5 border-t border-slate-50 pt-4 dark:border-slate-800/50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    {new Date(selectedDateKey + 'T00:00:00.000Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} schedule
                  </h3>
                  <div className="space-y-2">
                    {(eventsByDate.get(selectedDateKey) || []).length === 0 ? (
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 py-6 text-center bg-slate-50/30 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-100 dark:border-slate-850">
                        No events scheduled.
                      </p>
                    ) : (
                      (eventsByDate.get(selectedDateKey) || []).map(ev => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={(e) => handleEventClick(ev, e)}
                          className="w-full flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3.5 py-2.5 text-left transition hover:bg-white dark:hover:bg-slate-800 group active:scale-[0.99] cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="shrink-0 text-xl">{categoryIcons[ev.category] || '📅'}</span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-slate-950 dark:text-white group-hover:underline">{ev.title}</p>
                              <p className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                {ev.isAllDay ? 'All Day' : `📅 ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                              </p>
                            </div>
                          </div>
                          <span className={cn('ml-2 shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-bold tracking-tight uppercase', categoryStyles[ev.category] || 'bg-slate-50 text-slate-700 border-slate-100')}>
                            {ev.category.replace('_', ' ')}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-premium rounded-lg p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div>
              <div className="flex flex-wrap gap-2 mb-8">
                {categoryOptions.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-tight uppercase tracking-widest transition-all",
                      selectedCategory === cat 
                        ? "bg-slate-900 text-white shadow-xl scale-105" 
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400"
                    )}
                  >
                    {cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-wider">Loading schedule...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                <div className="grid grid-cols-7 gap-4">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest pb-4">{day}</div>
                  ))}
                  
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="min-h-16 lg:min-h-20 xl:min-h-24 rounded-2xl bg-slate-50/30 dark:bg-slate-900/20 border border-dashed border-slate-100 dark:border-slate-800/50" />;
                    
                    const key = toDateKey(day);
                    const dayEvents = eventsByDate.get(key) || [];
                    const isToday = key === toDateKey(new Date());
    
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          "min-h-16 lg:min-h-20 xl:min-h-24 rounded-2xl border p-2 transition-all hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none group",
                          isToday ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" : "bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1.5">
                          <span className={cn(
                            "text-xs font-bold tracking-tight",
                            isToday ? "text-blue-600" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                          )}>{day.getDate()}</span>
                          {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(ev => (
                            <button 
                              key={ev.id}
                              type="button"
                              onClick={(e) => handleEventClick(ev, e)}
                              className={cn(
                                "w-full text-left px-1.5 py-0.5 rounded-lg text-[9px] font-bold border truncate transition-all hover:scale-[1.02] hover:underline cursor-pointer active:scale-[0.99]",
                                categoryStyles[ev.category] || 'bg-slate-50 text-slate-600'
                              )}
                            >
                              {ev.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[9px] font-bold tracking-tight text-slate-400 text-center">+{dayEvents.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
                </div>
              )}
            </div>
          </div>
        )}
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
                  <p className="truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    📅 {new Date(ev.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {ev.isAllDay ? '' : ` • ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
              <span className={cn('ml-2 shrink-0 rounded-md border px-2 py-0.5 text-[8px] font-bold tracking-tight uppercase', categoryStyles[ev.category] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-350')}>
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
        title={selectedInfoEvent?.category?.replace('_', ' ') || 'Event Details'} 
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
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-800"
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
