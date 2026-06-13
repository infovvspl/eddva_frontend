import React, { useMemo, useState, useEffect } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Filter, 
  Clock, MapPin, AlertTriangle
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';

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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Institutional Calendar</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Unified view for exams, vacations, and academic milestones.</p>
        </div>
        <div className="flex gap-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
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
                          <div 
                            key={ev.id}
                            className={cn(
                              "px-1.5 py-0.5 rounded-lg text-[9px] font-bold border truncate",
                              categoryStyles[ev.category] || 'bg-slate-50 text-slate-600'
                            )}
                          >
                            {ev.title}
                          </div>
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

        <div className="space-y-4">
          <button className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-br from-slate-950 to-slate-800 dark:from-slate-900 dark:to-slate-950 p-4 shadow-lg ring-1 ring-slate-900/5 dark:ring-white/10 text-left transition hover:shadow-xl hover:scale-[1.02] group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] bg-amber-400/10 text-amber-400 transition-colors group-hover:bg-amber-400/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">Final Exams Sync</h3>
                <p className="text-[10px] font-semibold text-slate-400 truncate">Automated exam scheduling is active.</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-colors group-hover:text-amber-400" />
          </button>

          <div className="rounded-2xl bg-white dark:bg-slate-950 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[11px] font-bold tracking-tight uppercase tracking-[0.24em] text-slate-400">Upcoming Agenda</h3>
              <Clock className="h-4 w-4 text-slate-300" />
            </div>

            <div className="space-y-2">
              {events.slice(0, 5).map(ev => (
                <div key={ev.id} className="w-full flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left transition hover:bg-white dark:hover:bg-slate-800 group">
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
                </div>
              ))}
              {events.length === 0 && !loading && (
                <div className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">
                  No events scheduled for this period.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
