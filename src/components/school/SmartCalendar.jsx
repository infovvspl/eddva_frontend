import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import { toast } from 'sonner';
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
  const [selectedInfoEvent, setSelectedInfoEvent] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'STUDENT';

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    setIsPopupOpen(false);
    
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
    <div className="flex flex-col h-full w-full py-0.5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h4>
        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200" aria-label="Next month">
            <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 min-h-[130px] relative flex-1">
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
              className={`relative flex flex-col items-center justify-start py-1 rounded-lg cursor-pointer transition-all duration-200 group
                ${isToday 
                  ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-900/20 shadow-sm border border-blue-200/50 dark:border-blue-900/30' 
                  : (cell.isCurrentMonth 
                      ? 'text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/60' 
                      : 'text-slate-300 dark:text-slate-650 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40')
                }
              `}
            >
              <span className="text-[12px] z-10 font-bold">
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
                    <button 
                      key={i} 
                      onClick={(e) => handleEventClick(ev, e)}
                      className="w-full text-left flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all hover:scale-[1.01] hover:underline cursor-pointer group"
                    >
                      <div className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${ind.color}`} />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5">{ev.title}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{ind.name}</p>
                        {ev.location && <p className="text-[10px] text-slate-400 mt-1">📍 {ev.location}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fallback Info details modal */}
      <AnimatePresence>
        {infoModalOpen && selectedInfoEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-black tracking-tight uppercase tracking-widest text-slate-400">
                  {EVENT_INDICATORS[selectedInfoEvent.category]?.name || 'Event Details'}
                </span>
                <button 
                  onClick={() => setInfoModalOpen(false)}
                  className="p-1.5 bg-white dark:bg-slate-800 rounded-full hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{selectedInfoEvent.title}</h3>
                {selectedInfoEvent.description && (
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {selectedInfoEvent.description}
                  </p>
                )}
                <div className="grid gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold pt-1">
                  <div>📅 Date: {new Date(selectedInfoEvent.startTime).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'long' })}</div>
                  {!selectedInfoEvent.isAllDay && (
                    <div>⏰ Time: {new Date(selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedInfoEvent.endTime || selectedInfoEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  )}
                  {selectedInfoEvent.location && <div>📍 Location: {selectedInfoEvent.location}</div>}
                  {selectedInfoEvent.priority && <div>⚠️ Priority: <span className="capitalize">{selectedInfoEvent.priority.toLowerCase()}</span></div>}
                </div>
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/10 flex justify-end">
                <button 
                  onClick={() => setInfoModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-850 dark:text-white text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-850"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
