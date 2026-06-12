import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api/school-client';

const EVENT_INDICATORS = {
  HOLIDAY: { color: 'bg-emerald-500', name: 'Holiday' },
  EXAM: { color: 'bg-amber-400', name: 'Exam' },
  ASSIGNMENT: { color: 'bg-blue-500', name: 'Assignment' },
  LIVE_CLASS: { color: 'bg-violet-500', name: 'Live Class' },
  PARENT_MEETING: { color: 'bg-orange-500', name: 'Parent Meeting' },
  TEACHER_MEETING: { color: 'bg-sky-500', name: 'Teacher Meeting' },
  EMERGENCY_NOTICE: { color: 'bg-rose-600 animate-pulse', name: 'Emergency Notice' },
  ACADEMIC: { color: 'bg-slate-400', name: 'Academic' },
  VACATION: { color: 'bg-emerald-400', name: 'Vacation' }
};

export default function SmartCalendar() {
  const getLocalYYYYMMDD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDateEvents, setSelectedDateEvents] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const fetchEvents = async () => {
    try {
      const monthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const res = await api.get('/calendar/events', { params: { month: monthStr } });
      const data = res.data?.data || res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch calendar events', err);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // JS days: 0=Sun, 1=Mon, ..., 6=Sat
    // We want Mon=1 to Sun=7. So shift index.
    const startPadding = (firstDay.getDay() + 6) % 7; 
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Prev month overflow
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true
      });
    }
    
    // Next month overflow to complete 42 cells (6 rows * 7 cols)
    let nextDays = 42 - days.length;
    for (let d = 1; d <= nextDays; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach(ev => {
      if (!ev.startTime) return;
      const startStr = ev.startTime.split('T')[0];
      const endStr = ev.endTime ? ev.endTime.split('T')[0] : startStr;
      
      let current = new Date(startStr + 'T00:00:00.000Z');
      const end = new Date(endStr + 'T00:00:00.000Z');
      while (current.getTime() <= end.getTime()) {
        const key = current.toISOString().split('T')[0];
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(ev);
        current.setUTCDate(current.getUTCDate() + 1);
      }
    });
    return map;
  }, [events]);

  const todayStr = getLocalYYYYMMDD(new Date());

  const handleDateClick = (dayEvents, date) => {
    if (dayEvents && dayEvents.length > 0) {
      setSelectedDateEvents({ date, events: dayEvents });
      setIsPopupOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 min-h-[160px] relative flex-1">
        {calendarGrid.map((cell, idx) => {
          const dateStr = getLocalYYYYMMDD(cell.date);
          const isToday = dateStr === todayStr;
          const dayEvents = eventsByDate.get(dateStr) || [];
          
          // Deduplicate events by category for the dots
          const uniqueCategories = [...new Set(dayEvents.map(e => e.category))];
          const hasEmergency = uniqueCategories.includes('EMERGENCY_NOTICE');
          
          return (
            <div 
              key={idx}
              onClick={() => handleDateClick(dayEvents, cell.date)}
              className={`relative flex flex-col items-center justify-start py-1.5 rounded-lg cursor-pointer transition-all group
                ${isToday 
                  ? 'font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                  : (cell.isCurrentMonth 
                      ? 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800' 
                      : 'text-slate-300 dark:text-slate-600 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800')
                }
              `}
            >
              <span className="text-[11px] z-10">
                {cell.date.getDate()}
              </span>
              
              {hasEmergency ? (
                <div className="mt-1 flex justify-center">
                  <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Emergency Notice" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5 mt-0.5 h-3">
                  {isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" title="Today" />
                  )}
                  {uniqueCategories.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-0.5 px-1">
                      {uniqueCategories.map(cat => {
                        const ind = EVENT_INDICATORS[cat] || EVENT_INDICATORS.ACADEMIC;
                        return (
                          <div 
                            key={cat} 
                            className={`w-1 h-1 rounded-full ${ind.color}`}
                            title={ind.name}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Hover Tooltip */}
              {dayEvents.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[200px] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  <div className="bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl border border-slate-700">
                    <div className="font-bold mb-1 border-b border-slate-700 pb-1 text-slate-300">
                      {cell.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </div>
                    <ul className="space-y-1 text-left">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <li key={i} className="truncate">• {e.title}</li>
                      ))}
                      {dayEvents.length > 3 && (
                        <li className="text-slate-400 italic">+{dayEvents.length - 3} more...</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile/Click Popup */}
      <AnimatePresence>
        {isPopupOpen && selectedDateEvents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm sm:items-end">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-black text-slate-900 dark:text-white">
                  {selectedDateEvents.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long' })}
                </h3>
                <button 
                  onClick={() => setIsPopupOpen(false)}
                  className="p-1.5 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
                {selectedDateEvents.events.map((ev, i) => {
                  const ind = EVENT_INDICATORS[ev.category] || EVENT_INDICATORS.ACADEMIC;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${ind.color}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{ev.title}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{ind.name}</p>
                        {ev.location && <p className="text-[10px] text-slate-400 mt-1">📍 {ev.location}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
