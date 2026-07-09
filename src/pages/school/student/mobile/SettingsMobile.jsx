import React from 'react';
import { Moon, Sun, Bell, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SettingsMobile({
  theme,
  setTheme,
  preferences,
  togglePreference,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Theme Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2.5">
          {theme === 'dark' ? <Moon className="h-5 w-5 text-blue-600" /> : <Sun className="h-5 w-5 text-amber-500" />}
          <h3 className="text-sm font-black text-slate-850 dark:text-white">Appearance</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['light', 'dark'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTheme(option)}
              className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition ${
                theme === option
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
              }`}
            >
              <span className="text-xs font-black capitalize text-slate-700 dark:text-slate-300">{option}</span>
              {theme === option && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center gap-2.5">
          <Bell className="h-5 w-5 text-blue-500" />
          <h3 className="text-sm font-black text-slate-850 dark:text-white">Notifications</h3>
        </div>
        <div className="space-y-3">
          {[
            ['pushNotifications', 'Push Notifications', 'Receive student app updates.'],
            ['examAlerts', 'Exam Alerts', 'Get reminders for tests and final exams.'],
            ['assignmentReminders', 'Assignment Reminders', 'Due date countdowns.'],
            ['offlineNotes', 'Offline Notes', 'Allow notes to be saved offline.'],
          ].map(([key, label, description]) => (
            <button
              key={key}
              type="button"
              onClick={() => togglePreference(key)}
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-100 p-3.5 text-left dark:border-slate-800 dark:bg-slate-900/60"
            >
              <span>
                <span className="block text-xs font-black text-slate-800 dark:text-white">{label}</span>
                <span className="mt-0.5 block text-[10px] font-medium text-slate-400">{description}</span>
              </span>
              <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${preferences[key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <span className={`h-4 w-4 rounded-full bg-white transition ${preferences[key] ? 'translate-x-4' : 'translate-x-0'}`} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
