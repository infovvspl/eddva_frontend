import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Video, MapPin, BookOpen, Coffee, Plus } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { SLOT_TYPE_STYLES, getSlotPalette } from '@/lib/school/timetablePalette';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_SHORT = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat' };

// Solid chip colour per weekday for the Weekly Class Timetable's top row.
const DAY_CHIP_COLORS = {
  MONDAY: 'bg-amber-800 shadow-amber-800/30',
  TUESDAY: 'bg-emerald-600 shadow-emerald-600/30',
  WEDNESDAY: 'bg-orange-600 shadow-orange-600/30',
  THURSDAY: 'bg-amber-500 shadow-amber-500/30',
  FRIDAY: 'bg-rose-600 shadow-rose-600/30',
  SATURDAY: 'bg-pink-500 shadow-pink-500/30',
};

// Class type text colour in the weekly grid cells.
const SLOT_TYPE_TEXT = {
  offline: 'text-blue-600 dark:text-blue-400',
  live: 'text-rose-600 dark:text-rose-400',
  lab: 'text-purple-600 dark:text-purple-400',
  extra: 'text-amber-600 dark:text-amber-400',
  break: 'text-slate-500 dark:text-slate-400',
};

/** The teacher's profile photo, or their initials when there is none or it fails to load. */
function TeacherAvatar({ src, name, className, children }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || 'Teacher'}
        title={name || undefined}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(className, 'object-cover ring-2 ring-white dark:ring-slate-800')}
      />
    );
  }
  return <span className={className}>{children}</span>;
}

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
                                <TeacherAvatar src={cls.teacherImage} name={cls.teacher} className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${palette.avatar}`}>
                                  {initialsOf(cls.teacher)}
                                </TeacherAvatar>
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
                              <TeacherAvatar src={cls.type === 'break' ? null : cls.teacherImage} name={cls.teacher} className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${paletteFor(cls).avatar}`}>
                                {cls.type === 'break' ? <Coffee className="size-3.5" /> : initialsOf(cls.teacher)}
                              </TeacherAvatar>
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
          <div className="overflow-x-auto w-full max-w-full rounded-2xl border border-slate-400 shadow-md dark:border-slate-600">
            <table className="w-full table-fixed border-collapse text-left" style={{ minWidth: 1170 }}>
              <thead>
                <tr className="border-b border-slate-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
                  <th className="sticky left-0 top-0 z-40 w-[150px] bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-4 text-xs font-black uppercase tracking-wider text-white">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      Period
                    </span>
                  </th>
                  {DAYS.map((day) => {
                    const isToday = day === currentDay;
                    return (
                      <th key={day} className={`min-w-[170px] border-l border-slate-400 px-4 py-3 text-center dark:border-slate-600 ${isToday ? 'bg-white/70 dark:bg-blue-950/30' : ''}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`flex h-8 min-w-[2.75rem] items-center justify-center rounded-lg px-2 text-[11px] font-black text-white shadow-md ${DAY_CHIP_COLORS[day]} ${isToday ? 'ring-4 ring-blue-200 dark:ring-blue-900/60' : ''}`}>
                            {DAY_SHORT[day]}
                          </span>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white">{day.charAt(0) + day.slice(1).toLowerCase()}</p>
                          {isToday && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-300">
                              <span className="size-1.5 animate-pulse rounded-full bg-blue-500" />
                              Today
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
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
                    const rowClasses = timetable.filter(t => t.startTime === startTime && t.endTime === endTime);
                    const periodName = rowClasses.find(t => t.periodName)?.periodName || `Period ${idx + 1}`;
                    const periodNumber = rowClasses.find(t => t.periodNumber)?.periodNumber || idx + 1;
                    const brk = /break/i.test(periodName) || (rowClasses.length > 0 && rowClasses.every(t => t.type === 'break'));
                    const rowTone = brk
                      ? 'bg-amber-50/60 dark:bg-amber-950/10'
                      : idx % 2 === 1 ? 'bg-slate-50/70 dark:bg-slate-950/40' : 'bg-white dark:bg-slate-900';

                    return (
                      <tr key={slotTime} className={`group border-b border-slate-400 dark:border-slate-600 ${rowTone}`}>
                        <td className={`sticky left-0 z-20 w-[150px] border-r border-slate-300 px-4 py-3 dark:border-slate-700 ${brk ? 'bg-gradient-to-r from-amber-100 to-amber-50 dark:from-slate-900 dark:to-slate-900' : 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-slate-900 dark:to-slate-900'}`}>
                          <div className="flex items-center gap-2.5">
                            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${brk ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/30'}`}>
                              {brk ? <Coffee className="size-4" /> : periodNumber}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">{periodName}</p>
                              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                <Clock className="size-3" />
                                {startTime} - {endTime}
                              </p>
                            </div>
                          </div>
                        </td>
                        {DAYS.map(day => {
                          const cls = timetable.find(t => t.day === day && t.startTime === startTime && t.endTime === endTime);
                          const isActive = cls && isCurrentPeriod(day, startTime, endTime);
                          const isBreak = cls?.type === 'break';
                          const kind = !cls ? 'offline' : isBreak ? 'break' : cls.type === 'live' ? 'live' : cls.type === 'extra' ? 'extra' : (cls.type === 'lab' || cls.room?.toLowerCase().includes('lab')) ? 'lab' : 'offline';

                          return (
                            <td
                              key={`${day}-${slotTime}`}
                              className={`relative align-top border-l border-slate-400 p-2 dark:border-slate-700 ${day === currentDay ? 'bg-blue-50/50 dark:bg-blue-950/10' : ''}`}
                            >
                              {cls && !isBreak ? (
                                <div className="flex h-[80px] flex-col justify-center gap-1 overflow-hidden px-0.5 py-1">
                                  <p
                                    title={cls.subject}
                                    className={`flex min-w-0 items-center gap-1.5 text-sm font-black ${isBreak ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-700 dark:text-indigo-300'}`}
                                  >
                                    {isBreak && <Coffee className="size-3.5 shrink-0" />}
                                    <span className="min-w-0 truncate">{cls.subject}</span>
                                    {isActive && (
                                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                                        <span className="size-1.5 animate-pulse rounded-full bg-white" />
                                        Now
                                      </span>
                                    )}
                                  </p>
                                  <p className="truncate text-[11px] font-bold">
                                    <span className="text-emerald-600 dark:text-emerald-400">{cls.room ? `Room ${cls.room}` : (kind === 'live' ? 'Virtual' : 'No room')}</span>
                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">•</span>
                                    <span className={`capitalize ${SLOT_TYPE_TEXT[kind]}`}>{kind}</span>
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <TeacherAvatar
                                      src={isBreak ? null : cls.teacherImage}
                                      name={cls.teacher}
                                      className={`flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-black ${paletteFor(cls).avatar}`}
                                    >
                                      {isBreak ? <Coffee className="size-3" /> : initialsOf(cls.teacher)}
                                    </TeacherAvatar>
                                    <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                                      {isBreak ? 'No teacher' : cls.teacher}
                                    </span>
                                  </div>
                                </div>
                              ) : (brk || isBreak) ? (
                                <div className="relative flex h-[80px] flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-orange-50 p-2.5 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-orange-950/10">
                                  <Coffee className="size-5 text-amber-500" />
                                  <span className="text-xs font-black text-amber-800 dark:text-amber-300">{cls?.subject || periodName}</span>
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{startTime} - {endTime}</span>
                                </div>
                              ) : (
                                <div className="flex h-[80px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-400">
                                  <Plus className="size-4" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">Free</span>
                                </div>
                              )}
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
