import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Video, MapPin, BookOpen, Coffee } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTimetable();
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/timetables/student/me');
      const data = res.data?.timetable || [];
      setTimetable(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const currentDay = useMemo(() => {
    const day = currentTime.getDay();
    if (day === 0) return 'MONDAY'; // Show Monday on Sundays
    return DAYS[day - 1] || 'MONDAY';
  }, [currentTime]);

  // Extract unique chronological time slots from all classes to form the rows
  const timeSlots = useMemo(() => {
    const slots = new Set();
    timetable.forEach(t => {
      if (t.startTime && t.endTime) {
        slots.add(`${t.startTime}-${t.endTime}`);
      }
    });
    return Array.from(slots).sort((a, b) => {
      const [startA] = a.split('-');
      const [startB] = b.split('-');
      return startA.localeCompare(startB);
    });
  }, [timetable]);

  const getSortedClasses = (day) => {
    return timetable
      .filter((t) => t.day.toUpperCase() === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const isCurrentPeriod = (day, startTime, endTime) => {
    if (day !== currentDay) return false;
    const now = currentTime;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    
    const [endH, endM] = endTime.split(':').map(Number);
    const endMinutes = endH * 60 + endM;

    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  const renderBadge = (type, isLive, isLab) => {
    if (type === 'break') return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">BREAK</span>;
    if (isLive) return <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">LIVE</span>;
    if (isLab) return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">LAB</span>;
    if (type === 'extra') return <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase">EXTRA</span>;
    return <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">OFFLINE</span>;
  };

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-slate-500 text-center animate-pulse">Loading timetable...</div>;
  }

  return (
    <div className="w-full px-4 sm:px-6 pb-20 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900 dark:text-white">My Timetable</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">Unified view of your offline and live classes.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setView('daily')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setView('weekly')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${view === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentDay}</h2>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              {getSortedClasses(currentDay).length} Classes Today
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto w-full max-w-full shadow-sm">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Time</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Subject</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Teacher</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Room</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {getSortedClasses(currentDay).map((cls, idx) => {
                  const isLive = cls.type === 'live';
                  const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';
                  const isActive = isCurrentPeriod(currentDay, cls.startTime, cls.endTime);
                  
                  return (
                    <tr key={idx} className={`transition ${isActive ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isActive && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                          <span className="font-bold text-slate-900 dark:text-white">
                            {cls.periodName || (cls.periodNumber ? `Period ${cls.periodNumber}` : '')}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          {cls.startTime} - {cls.endTime}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {cls.subject}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {cls.teacher}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {cls.room || (isLive ? 'Virtual' : 'TBD')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {renderBadge(cls.type, isLive, isLab)}
                          {isLive && (
                            <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors whitespace-nowrap">
                              Join
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {getSortedClasses(currentDay).length === 0 && (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-500">No classes scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full max-w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr>
                  <th className="p-4 border-b border-r border-slate-200 dark:border-slate-700/50 w-24 text-center font-bold text-slate-500 uppercase tracking-wider text-xs">
                    Period
                  </th>
                  {DAYS.map(day => (
                    <th 
                      key={day} 
                      className={`p-4 border-b border-slate-200 dark:border-slate-700/50 text-center font-bold uppercase tracking-wider text-xs ${
                        day === currentDay ? 'bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b-blue-200 dark:border-b-blue-800' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length === 0 ? (
                  <tr>
                    <td colSpan={DAYS.length + 1} className="p-12 text-center text-slate-500">
                      <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      No timetable data available.
                    </td>
                  </tr>
                ) : (
                  timeSlots.map((slotTime, idx) => {
                    const [startTime, endTime] = slotTime.split('-');
                    const match = timetable.find(t => t.startTime === startTime && t.endTime === endTime);
                    const periodName = match?.periodName || `P${idx + 1}`;
                    return (
                      <tr key={slotTime} className="group">
                        <td className="p-3 border-b border-r border-slate-100 dark:border-slate-800/50 text-center align-middle bg-slate-50/30 dark:bg-slate-800/20">
                          <div className="font-bold text-slate-700 dark:text-slate-300">{periodName}</div>
                          <div className="text-[10px] font-semibold text-slate-500 whitespace-nowrap mt-1">{startTime}-{endTime}</div>
                        </td>
                        {DAYS.map(day => {
                          const cls = timetable.find(t => t.day === day && t.startTime === startTime && t.endTime === endTime);
                          const isActive = cls && isCurrentPeriod(day, startTime, endTime);
                          const isDayActive = day === currentDay;

                          if (!cls) {
                            return (
                              <td 
                                key={`${day}-${slotTime}`} 
                                className={`p-2 border-b border-slate-100 dark:border-slate-800/50 align-top ${
                                  isDayActive ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                                }`}
                              >
                                <div className="h-full min-h-[80px] rounded-lg flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600">
                                  <div className="text-center">
                                    <Coffee className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Break</span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          const isLive = cls.type === 'live';
                          const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';

                          return (
                            <td 
                              key={`${day}-${slotTime}`} 
                              className={`p-2 border-b border-slate-100 dark:border-slate-800/50 align-top relative ${
                                isDayActive ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''
                              }`}
                            >
                              <div className={`p-3 rounded-xl border ${
                                isActive 
                                  ? 'border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] dark:shadow-[0_0_15px_rgba(59,130,246,0.3)] ring-2 ring-blue-400/50' 
                                  : ''
                                } ${
                                  cls.type === 'break'
                                    ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/20 dark:bg-amber-950/10'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                                } h-full flex flex-col gap-2 transition-all duration-300`}
                              >
                                {isActive && (
                                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">
                                    NOW
                                  </div>
                                )}
                                
                                <div>
                                  <div className={`font-bold line-clamp-1 ${cls.type === 'break' ? 'text-amber-800 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`} title={cls.subject}>
                                    {cls.subject}
                                  </div>
                                  {cls.type !== 'break' && (
                                    <div className="text-xs font-semibold text-slate-500 line-clamp-1" title={cls.teacher}>
                                      {cls.teacher}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 truncate">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{cls.room || (isLive ? 'Virtual' : (cls.type === 'break' ? 'Cafeteria' : 'TBD'))}</span>
                                  </div>
                                  {renderBadge(cls.type, isLive, isLab)}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
