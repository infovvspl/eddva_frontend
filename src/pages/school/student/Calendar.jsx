import React from 'react';
import { Calendar as CalendarIcon, Clock, Video } from 'lucide-react';

export default function Calendar() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-blue-600" /> Calendar
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">View your upcoming live classes and deadlines.</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CalendarIcon className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Calendar coming soon</h3>
        <p className="mt-1 text-sm text-slate-500">We are currently syncing your class schedule. Check back later!</p>
      </div>
    </div>
  );
}
