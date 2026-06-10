import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Video, MapPin, BookOpen } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function Timetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('weekly');

  useEffect(() => {
    fetchTimetable();
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
    const day = new Date().getDay();
    if (day === 0) return 'MONDAY'; // Show Monday on Sundays
    return DAYS[day - 1] || 'MONDAY';
  }, []);

  const getSortedClasses = (day) => {
    return timetable
      .filter((t) => t.day.toUpperCase() === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const renderClassTableRow = (cls, idx) => {
    const isLive = cls.type === 'live';
    const isLab = cls.room?.toLowerCase().includes('lab') || cls.type === 'lab';

    return (
      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
          {cls.periodNumber || (idx + 1)}
        </td>
        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
          {cls.startTime} - {cls.endTime}
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
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${
              isLive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
              isLab ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
              cls.type === 'extra' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {cls.type || 'OFFLINE'}
            </span>
            {isLive && (
              <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors whitespace-nowrap">
                Join
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (loading) {
    return <div className="p-8 text-sm font-semibold text-slate-500 text-center animate-pulse">Loading timetable...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Period</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Time</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Subject</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Teacher</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Room</th>
                  <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-xs">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {getSortedClasses(currentDay).map((cls, idx) => renderClassTableRow(cls, idx))}
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
        <div className="space-y-8 max-w-4xl mx-auto">
          {DAYS.map(day => {
            const classes = getSortedClasses(day);
            if (classes.length === 0) return null;
            return (
              <div key={day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
                <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">{day}</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-700 px-2 py-1 rounded-md shadow-sm">
                    {classes.length} classes
                  </span>
                </div>
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 hidden sm:table-header-group">
                    <tr>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Period</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Time</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Subject</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Teacher</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Room</th>
                      <th className="px-4 py-2 font-bold text-slate-500 uppercase tracking-wider text-xs">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {classes.map((cls, idx) => renderClassTableRow(cls, idx))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
