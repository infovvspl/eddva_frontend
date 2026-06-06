import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, KeyRound, Lock, Monitor, Moon, ShieldCheck, Smartphone, Sun } from 'lucide-react';
import { useAuth } from '@/context/SchoolAuthContext';
import { useSchoolNotification } from '@/context/SchoolNotificationContext';

export default function Settings() {
  const { user } = useAuth();
  const { settings, toggleSetting } = useSchoolNotification();
  const [theme, setTheme] = useState(() => localStorage.getItem('eddva-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('eddva-theme', theme);
  }, [theme]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Manage account settings, preferences, and security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-6 w-6 text-blue-600" /> : <Sun className="h-6 w-6 text-amber-500" />}
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Appearance</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Switch between dark and light theme.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {['light', 'dark'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  className={`flex items-center justify-between rounded-lg border p-4 text-left transition ${
                    theme === option
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-sm font-black capitalize text-slate-900 dark:text-white">{option}</span>
                  {theme === option && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Notification Preferences</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Control browser, email, and desktop alerts.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['desktopNotificationsEnabled', 'Desktop Notifications', 'Receive real-time desktop notifications.'],
                ['chatNotificationsEnabled', 'Chat Notifications', 'Get alerts when a parent/student sends you a message.'],
                ['announcementAlerts', 'Announcement Alerts', 'Get alerts for new announcements/notices.'],
                ['assignmentAlerts', 'Assignment Alerts', 'Deadlines and grading reminders.'],
                ['attendanceAlerts', 'Attendance Alerts', 'Attendance status notifications.'],
                ['soundEnabled', 'Notification Sounds', 'Play a sound alert when a message arrives.'],
                ['doNotDisturb', 'Do Not Disturb Mode', 'Mute all system and desktop notifications.'],
              ].map(([key, label, description]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSetting(key as any)}
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-slate-200 p-4 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <span>
                    <span className="block text-sm font-black text-slate-950 dark:text-white">{label}</span>
                    <span className="mt-1 block text-xs font-medium text-slate-500">{description}</span>
                  </span>
                  <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${settings[key as keyof typeof settings] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <span className={`h-4 w-4 rounded-full bg-white transition ${settings[key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Security</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Password and account protection.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                <KeyRound className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-black text-slate-950 dark:text-white">Change Password</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                <Lock className="h-5 w-5 text-rose-600" />
                <span className="text-sm font-black text-slate-950 dark:text-white">Two-Factor Authentication</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Monitor className="h-6 w-6 text-violet-600" />
              <div>
                <h2 className="text-base font-black text-slate-950 dark:text-white">Device Sessions</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">Current browser and active sessions.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-black text-slate-950 dark:text-white">Current Browser</p>
                    <p className="text-xs font-medium text-slate-500">Active now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
