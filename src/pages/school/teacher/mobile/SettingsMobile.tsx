import React from 'react';
import { Bell, CheckCircle2, KeyRound, Monitor, Moon, Sun } from 'lucide-react';

export default function SettingsMobile({
  theme,
  setTheme,
  settings,
  toggleSetting,
}) {
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white">Settings</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Preferences & Security</p>
      </div>

      {/* Theme Settings Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-2">
          {theme === 'dark' ? <Moon size={15} className="text-blue-500" /> : <Sun size={15} className="text-amber-500" />}
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Appearance</h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {['light', 'dark'].map((option) => (
            <button
              key={option}
              onClick={() => setTheme(option)}
              className={`rounded-xl border p-3.5 text-center transition-all ${
                theme === option
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-100 dark:border-slate-800'
              }`}
            >
              <span className="text-xs font-black capitalize text-slate-700 dark:text-slate-350">{option}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Preferences Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-850 dark:bg-slate-900 space-y-3.5">
        <div className="flex items-center gap-2 border-b border-slate-50 dark:border-slate-800/80 pb-2">
          <Bell size={15} className="text-blue-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white">Notification Preferences</h3>
        </div>

        <div className="space-y-3.5">
          {[
            ['desktopNotificationsEnabled', 'Desktop Notifications'],
            ['chatNotificationsEnabled', 'Chat Notifications'],
            ['announcementAlerts', 'Announcement Alerts'],
            ['assignmentAlerts', 'Assignment Alerts'],
            ['attendanceAlerts', 'Attendance Alerts'],
            ['soundEnabled', 'Notification Sounds'],
          ].map(([key, label]) => {
            const isEnabled = settings[key];
            return (
              <div
                key={key}
                onClick={() => toggleSetting(key)}
                className="flex items-center justify-between border border-slate-50 dark:border-slate-850 p-3 rounded-xl hover:bg-slate-50/40 cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
                <span className={`flex h-5 w-10 items-center rounded-full p-0.5 transition ${isEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <span className={`h-4 w-4 rounded-full bg-white transition ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
