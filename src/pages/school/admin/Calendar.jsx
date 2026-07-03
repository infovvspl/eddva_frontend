import React, { useMemo, useState, useEffect } from 'react';
import { 
  CalendarDays, ChevronLeft, ChevronRight, Filter, Plus, Trash2, 
  Clock, MapPin, AlertTriangle, CheckCircle2, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '@/components/school/admin/Modal';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { cn } from '@/components/school/admin/Skeleton';
import { useConfirm } from '@/context/ConfirmContext';
import { CustomSelect } from "@/components/ui/CustomSelect";

const categoryStyles = {
  ACADEMIC: 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
  EXAM: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  HOLIDAY: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300',
  VACATION: 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300',
  MEETING: 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300',
  LIVE_CLASS: 'border-violet-200 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300',
};

const categoryOptions = ['ACADEMIC', 'EXAM', 'HOLIDAY', 'VACATION', 'MEETING', 'LIVE_CLASS', 'All'];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Calendar() {
  const confirm = useConfirm();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    startTime: toDateKey(new Date()) + 'T09:00',
    endTime: toDateKey(new Date()) + 'T10:00',
    category: 'ACADEMIC',
    description: '',
    location: '',
    priority: 'NORMAL'
  });

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

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      toast.success('Event scheduled successfully');
      setIsModalOpen(false);
      fetchEvents();
      setFormData({
        title: '',
        startTime: toDateKey(new Date()) + 'T09:00',
        endTime: toDateKey(new Date()) + 'T10:00',
        category: 'ACADEMIC',
        description: '',
        location: '',
        priority: 'NORMAL'
      });
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const handleDeleteEvent = async (id) => {
    const isConfirmed = await confirm({
      title: 'Cancel Event',
      message: 'Are you sure you want to cancel this event? This action cannot be undone.',
      confirmLabel: 'Cancel Event',
      cancelLabel: 'Keep Event',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event removed');
      fetchEvents();
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <div className="w-full space-y-8 px-4 sm:px-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tracking-tight">Institutional Calendar</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Unified view for exams, meetings, and academic milestones.</p>
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Schedule Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="glass-premium rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Upcoming Agenda</h3>
              <Clock className="text-slate-300" size={16} />
            </div>

            <div className="space-y-6">
              {events.slice(0, 5).map(ev => (
                <div key={ev.id} className="relative pl-6 group">
                  <div className={cn(
                    "absolute left-0 top-1 w-1.5 h-full rounded-full",
                    ev.priority === 'HIGH' ? "bg-rose-500" : "bg-blue-500"
                  )} />
                  <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">
                    {new Date(ev.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {ev.endTime && ev.endTime.split('T')[0] !== ev.startTime.split('T')[0] ? ` - ${new Date(ev.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    {ev.isAllDay ? '' : ` · ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                  <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{ev.title}</h4>
                  <div className="mt-2 flex items-center gap-3">
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <MapPin size={12} />
                        {ev.location}
                      </div>
                    )}
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase",
                      categoryStyles[ev.category]
                    )}>{ev.category}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12">
                  <CalendarDays size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-400 italic">No events scheduled for this period.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-[10px] font-bold tracking-tight uppercase tracking-widest text-amber-500">Academic Focus</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Final Exams Sync</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Automated exam scheduling is active. Ensure all faculty meetings are cleared before the 24th.</p>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold tracking-tight uppercase tracking-widest border border-white/10 transition-all">View Exam Rules</button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Event" size="md">
        <form onSubmit={handleAddEvent} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Event Title</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Annual Sports Meet 2026"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Start Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">End Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
                />
              </div>
          <p className="text-sm font-bold text-slate-500 mt-1">Unified view for exams, meetings, and academic milestones.</p>
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Schedule Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div className="glass-premium rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-bold tracking-tight text-slate-400 uppercase tracking-widest">Upcoming Agenda</h3>
              <Clock className="text-slate-300" size={16} />
            </div>

            <div className="space-y-6">
              {events.slice(0, 5).map(ev => (
                <div key={ev.id} className="relative pl-6 group">
                  <div className={cn(
                    "absolute left-0 top-1 w-1.5 h-full rounded-full",
                    ev.priority === 'HIGH' ? "bg-rose-500" : "bg-blue-500"
                  )} />
                  <p className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest mb-1">
                    {new Date(ev.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {ev.endTime && ev.endTime.split('T')[0] !== ev.startTime.split('T')[0] ? ` - ${new Date(ev.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    {ev.isAllDay ? '' : ` · ${new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                  <h4 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{ev.title}</h4>
                  <div className="mt-2 flex items-center gap-3">
                    {ev.location && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <MapPin size={12} />
                        {ev.location}
                      </div>
                    )}
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase",
                      categoryStyles[ev.category]
                    )}>{ev.category}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-12">
                  <CalendarDays size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-xs font-bold text-slate-400 italic">No events scheduled for this period.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-amber-500" />
                <span className="text-[10px] font-bold tracking-tight uppercase tracking-widest text-amber-500">Academic Focus</span>
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-2">Final Exams Sync</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">Automated exam scheduling is active. Ensure all faculty meetings are cleared before the 24th.</p>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold tracking-tight uppercase tracking-widest border border-white/10 transition-all">View Exam Rules</button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Event" size="md">
        <form onSubmit={handleAddEvent} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Event Title</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Annual Sports Meet 2026"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Start Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">End Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={formData.endTime}
                  onChange={e => setFormData({...formData, endTime: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Category</label>
                <CustomSelect 
                  value={formData.category}
                  onChange={val => setFormData({...formData, category: val})}
                  options={categoryOptions.filter(o => o !== 'All').map(o => ({ value: o, label: o.replace('_', ' ') }))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Priority</label>
                <CustomSelect
          onChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                  value={formData.priority}
                  options={[
                  { value: "LOW", label: "Low" },
                  { value: "NORMAL", label: "Normal" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Location</label>
              <input 
                type="text"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="Main Hall, Ground, etc."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-tight text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Details</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-400 h-24"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold tracking-tight text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" className="flex-[2] px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold tracking-tight text-xs uppercase tracking-widest shadow-xl transition-all hover:brightness-110 active:scale-95">Save Event</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
