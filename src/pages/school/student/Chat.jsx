import React from 'react';
import { Bell, LifeBuoy, Megaphone, MessageSquare, Send, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const conversations = [
  { title: 'Teacher Chat', description: 'Ask subject teachers about homework, lessons, and feedback.', icon: MessageSquare, tone: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
  { title: 'Class Discussion', description: 'Discuss class topics and collaborate with classmates.', icon: Users, tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  { title: 'Announcements', description: 'View institute notices, exam notices, and holiday updates.', icon: Megaphone, tone: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
  { title: 'Support', description: 'Raise a support ticket and track response status.', icon: LifeBuoy, tone: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
];

export default function Chat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Communication Center</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Teacher chat, class discussion, announcements, and support from one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {conversations.map((item) => (
          <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.tone}`}>
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-sm font-black text-slate-950 dark:text-white">{item.title}</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-[520px] flex-col rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 p-5 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Teacher Chat</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Messages will sync here when classroom chat is connected.</p>
          </div>
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <div>
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No active conversation</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Select a teacher or class discussion once messaging data is available.</p>
            </div>
          </div>
          <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                placeholder="Type a message"
              />
              <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-950 dark:text-white">Announcement Links</h2>
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-5 space-y-3">
              <Link to="/school/student/announcements" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Institute Notices
                <Megaphone className="h-4 w-4 text-blue-600" />
              </Link>
              <Link to="/school/student/assessments" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Exam Notices
                <Bell className="h-4 w-4 text-rose-600" />
              </Link>
              <Link to="/school/student/support-tickets" className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-black text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">
                Support Tickets
                <LifeBuoy className="h-4 w-4 text-emerald-600" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
