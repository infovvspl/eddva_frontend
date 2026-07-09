import React, { useState } from 'react';
import { Clock, Video, MapPin, BookOpen, Coffee } from 'lucide-react';

export default function TimetableMobile({
  DAYS,
  timetable,
  loading,
  currentTime,
  currentDay: defaultDay,
  getSortedClasses,
  isCurrentPeriod,
  renderBadge,
}) {
  const [activeDay, setActiveDay] = useState(defaultDay || 'MONDAY');

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Timetable...</p>
        </div>
      </div>
    );
  }

  const classesForDay = getSortedClasses(activeDay);

  return (
    <div className="space-y-6 pb-24">
      {/* Day Selector (Horizontal Scroll Container) */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-4 px-4">
        {DAYS.map((day) => {
          const isSelected = activeDay === day;
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all snap-start shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/15'
                  : 'bg-white text-slate-500 border border-slate-100 hover:text-slate-700 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Schedule Stack */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          {activeDay}'s Schedule
        </h2>
        {classesForDay.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <Coffee className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No classes scheduled</p>
          </div>
        ) : (
          <div className="space-y-3">
            {classesForDay.map((cls, idx) => {
              const isCurrent = isCurrentPeriod(activeDay, cls.startTime, cls.endTime);
              const isBreak = cls.type === 'break';

              return (
                <div
                  key={idx}
                  className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-md'
                      : isBreak
                        ? 'border-amber-100 bg-amber-50/20 dark:border-amber-950/40 dark:bg-amber-950/10'
                        : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-600" />
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {renderBadge(cls.type, cls.isLive, cls.isLab)}
                        {isCurrent && (
                          <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
                            Ongoing
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white pt-1">
                        {cls.subject || 'Break'}
                      </h3>
                      {!isBreak && (
                        <p className="text-xs font-semibold text-slate-500">
                          {cls.teacher || 'Instructor'}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-slate-800 dark:text-white flex items-center justify-end gap-1">
                        <Clock size={11} className="text-slate-400" />
                        {cls.startTime}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">to {cls.endTime}</p>
                    </div>
                  </div>

                  {!isBreak && (cls.roomNo || cls.meetingLink) && (
                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 text-xs">
                      {cls.roomNo && (
                        <span className="flex items-center gap-1 text-slate-500 font-semibold">
                          <MapPin size={12} className="text-slate-400" />
                          Room {cls.roomNo}
                        </span>
                      )}
                      {cls.meetingLink && (
                        <a
                          href={cls.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"
                        >
                          <Video size={12} />
                          Join Class
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
