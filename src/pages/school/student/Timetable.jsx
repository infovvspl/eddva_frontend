import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Video, MapPin, BookOpen, Coffee } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { SLOT_TYPE_STYLES, getSlotPalette } from '@/lib/school/timetablePalette';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Timetable() {
  const isMobile = useIsMobile();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(isMobile ? 'daily' : 'weekly');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileSelectedDay, setMobileSelectedDay] = useState(() => {
    const day = new Date().getDay();
    if (day === 0) return 'MONDAY';
    return DAYS[day - 1] || 'MONDAY';
  });

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

  const paletteFor = (cls) => getSlotPalette(cls.type === 'break');
  const initialsOf = (name) =>
    String(name || '').split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '—';

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
    const kind = type === 'break' ? 'break' : isLive ? 'live' : isLab ? 'lab' : type === 'extra' ? 'extra' : 'offline';
    return (
      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase ${SLOT_TYPE_STYLES[kind]}`}>
        {kind}
      </span>
    );
  };

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-slate-500 text-center animate-pulse">Loading timetable...</div>;
  }

  return (
    <div className="w-full px-3 sm:px-6 pb-20 space-y-5 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display text-slate-900 dark:text-white">My Timetable</h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">Unified view of your offline and live classes.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <button 
            onClick={() => setView('daily')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${view === 'daily' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            Today
          </button>
          <button 
            onClick={() => setView('weekly')}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${view === 'weekly' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white'}`}
          >
            Weekly
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <div className="max-w-4xl mx-auto space-y-4">
          {isMobile ? (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setMobileSelectedDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      mobileSelectedDay === day
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'border border-slate-100 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                    }`}
                  >
                    {day.toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {getSortedClasses(mobileSelectedDay).length === 0 ? (
                  <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <BookOpen className="size-10 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-500 text-xs">No classes scheduled.</p>
                  </div>
                ) : (
                  getSortedClasses(mobileSelectedDay).map((cls, idx) => {
                    const isLive = cls.type === 'live';
                    const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';
                    const isActive = isCurrentPeriod(mobileSelectedDay, cls.startTime, cls.endTime);
                    const palette = paletteFor(cls);

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-4 pl-5 shadow-sm transition-all",
                          cls.type === 'break' ? "bg-amber-50 dark:bg-amber-950/20" : "bg-white dark:bg-slate-900",
                          isActive
                            ? "border-emerald-300 ring-2 ring-emerald-200/70 dark:border-emerald-700 dark:ring-emerald-900/50"
                            : cls.type === 'break' ? "border-amber-300 dark:border-amber-800" : "border-slate-100 dark:border-slate-800"
                        )}
                      >
                        <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${palette.bar}`} />
                        <span aria-hidden className={`pointer-events-none absolute -right-8 -top-8 size-28 rounded-full ${palette.glow}`} />
                        {isActive && (
                          <span className="absolute top-3.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                            <span className="size-1.5 animate-pulse rounded-full bg-white" />
                            Now
                          </span>
                        )}
                        
                        <div className="flex items-start justify-between min-w-0 pr-16">
                          <div className="min-w-0">
                            <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black ${palette.badge}`}>
                              <span className={`size-1.5 shrink-0 rounded-full ${palette.bar}`} />
                              <span className="truncate">{cls.subject}</span>
                            </span>
                            {cls.type !== 'break' && (
                              <div className="mt-2.5 flex items-center gap-2">
                                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${palette.avatar}`}>
                                  {initialsOf(cls.teacher)}
                                </span>
                                <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{cls.teacher}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="-mx-4 -mb-4 mt-0.5 flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 pl-5 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
                          <div className="flex flex-col gap-0.5 text-[11px] sm:text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="size-3.5 text-slate-400 shrink-0" />
                              <span>{cls.startTime} - {cls.endTime} ({cls.periodName || `P${cls.periodNumber || (idx + 1)}`})</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MapPin className="size-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{cls.room || (isLive ? 'Virtual' : (cls.type === 'break' ? 'Cafeteria' : 'TBD'))}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {renderBadge(cls.type, isLive, isLab)}
                            {isLive && (
                              <button className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-colors whitespace-nowrap">
                                Join
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentDay}</h2>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  {getSortedClasses(currentDay).length} Classes Today
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto w-full max-w-full shadow-md">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900">
                    <tr>
                      <th className="px-4 py-4 font-black text-slate-200 uppercase tracking-wider text-xs">Time</th>
                      <th className="px-4 py-4 font-black text-slate-200 uppercase tracking-wider text-xs">Subject</th>
                      <th className="px-4 py-4 font-black text-slate-200 uppercase tracking-wider text-xs">Teacher</th>
                      <th className="px-4 py-4 font-black text-slate-200 uppercase tracking-wider text-xs">Room</th>
                      <th className="px-4 py-4 font-black text-slate-200 uppercase tracking-wider text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getSortedClasses(currentDay).map((cls, idx) => {
                      const isLive = cls.type === 'live';
                      const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';
                      const isActive = isCurrentPeriod(currentDay, cls.startTime, cls.endTime);
                      
                      return (
                        <tr key={idx} className={`transition ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/20' : cls.type === 'break' ? 'bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/20' : idx % 2 === 1 ? 'bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isActive && <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />}
                              <span className="font-bold text-slate-900 dark:text-white">
                                {cls.periodName || (cls.periodNumber ? `Period ${cls.periodNumber}` : '')}
                              </span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
                              {cls.startTime} - {cls.endTime}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-black ${paletteFor(cls).badge}`}>
                              <span className={`size-1.5 shrink-0 rounded-full ${paletteFor(cls).bar}`} />
                              <span className="truncate">{cls.subject}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${paletteFor(cls).avatar}`}>
                                {cls.type === 'break' ? <Coffee className="size-3.5" /> : initialsOf(cls.teacher)}
                              </span>
                              <span className="font-semibold">{cls.teacher}</span>
                            </div>
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
                    <BookOpen className="size-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-bold text-slate-500">No classes scheduled for today.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {isMobile && (
            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest animate-pulse">
              ← Swipe table horizontally to see full week →
            </p>
          )}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden flex flex-col">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900">
                    <th className="p-4 border-r border-white/10 w-24 text-center font-black text-slate-300 uppercase tracking-wider text-xs sticky left-0 z-20 bg-slate-900">
                      Period
                    </th>
                    {DAYS.map(day => (
                      <th 
                        key={day} 
                        className={`p-4 border-l border-white/10 text-center font-black uppercase tracking-wider text-xs ${
                          day === currentDay ? 'bg-blue-500/30 text-white' : 'text-slate-200'
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
                        <BookOpen className="size-12 mx-auto text-slate-300 mb-3" />
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
                          <td className="p-3 border-b border-white/10 text-center align-middle bg-slate-900 sticky left-0 z-10">
                            <div className="text-xs font-black uppercase tracking-wider text-white">{periodName}</div>
                            <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-300 whitespace-nowrap"><Clock className="size-3" />{startTime}-{endTime}</div>
                          </td>
                          {DAYS.map(day => {
                            const cls = timetable.find(t => t.day === day && t.startTime === startTime && t.endTime === endTime);
                            const isActive = cls && isCurrentPeriod(day, startTime, endTime);
                            const isDayActive = day === currentDay;
  
                            if (!cls) {
                              return (
                                <td 
                                  key={`${day}-${slotTime}`} 
                                  className={`p-2 border-b border-l border-dashed border-slate-200 dark:border-slate-800 align-top ${
                                    isDayActive ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''
                                  }`}
                                >
                                  <div className="h-full min-h-[104px] rounded-xl flex flex-col items-center justify-center gap-1 border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/10">
                                    <Coffee className="size-5 text-amber-500" />
                                    <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">Break</span>
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{startTime} - {endTime}</span>
                                  </div>
                                </td>
                              );
                            }
  
                            const isLive = cls.type === 'live';
                            const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';
  
                            return (
                              <td 
                                key={`${day}-${slotTime}`} 
                                className={`p-2 border-b border-l border-dashed border-slate-200 dark:border-slate-800 align-top relative ${
                                  isDayActive ? 'bg-blue-50/70 dark:bg-blue-950/20' : ''
                                }`}
                              >
                                {(() => {
                                  const palette = paletteFor(cls);
                                  const isBreak = cls.type === 'break';
                                  return (
                                    <div className={`flex h-full min-h-[104px] flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                      isBreak ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/10' : 'bg-white dark:bg-slate-900'
                                    } ${
                                      isActive
                                        ? 'border-emerald-300 ring-2 ring-emerald-200/70 dark:border-emerald-700 dark:ring-emerald-900/50'
                                        : isBreak ? 'border-amber-300 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'
                                    }`}>
                                      <div className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 text-white ${palette.bar}`}>
                                        <span className="line-clamp-1 text-xs font-black" title={cls.subject}>{cls.subject}</span>
                                        <span className="shrink-0 rounded-md bg-white/25 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                          {isBreak ? 'break' : isLive ? 'live' : isLab ? 'lab' : cls.type === 'extra' ? 'extra' : 'offline'}
                                        </span>
                                      </div>
                                      <div className="flex flex-1 flex-col justify-between gap-2 p-2.5">
                                        <div className="flex items-center gap-2">
                                          <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${palette.avatar}`}>
                                            {isBreak ? <Coffee className="size-3" /> : initialsOf(cls.teacher)}
                                          </span>
                                          <span className="line-clamp-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300" title={cls.teacher}>
                                            {isBreak ? 'No teacher' : cls.teacher}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                            <MapPin className={`size-3 shrink-0 ${palette.icon}`} />
                                            <span className="truncate">{cls.room || (isLive ? 'Virtual' : (isBreak ? 'Cafeteria' : 'TBD'))}</span>
                                          </span>
                                          {isActive && (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">
                                              <span className="size-1.5 animate-pulse rounded-full bg-white" />
                                              Now
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
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
        </div>
      )}
    </div>
  );
}
