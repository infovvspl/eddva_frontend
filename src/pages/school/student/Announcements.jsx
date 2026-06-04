import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { Bell, CalendarDays, ClipboardList, Megaphone, MessageSquare, Search } from 'lucide-react';

const categories = ['All', 'GENERAL', 'EXAM', 'HOLIDAY', 'ACADEMIC'];

function priorityClass(priority) {
  if (priority === 'HIGH') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
  if (priority === 'LOW') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
}

export default function Announcements() {
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const [noticeRes, notificationRes] = await Promise.all([
          api.get('/notices').catch(() => ({ data: { data: [] } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
        ]);
        setNotices(noticeRes.data?.data || noticeRes.data || []);
        setNotifications(notificationRes.data?.data || notificationRes.data || []);
      } catch (error) {
        console.error('Failed to fetch announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const filteredNotices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return notices.filter((notice) => {
      const matchesCategory = category === 'All' || notice.category === category;
      const matchesSearch = !normalized || `${notice.title} ${notice.content}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [notices, category, query]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Institute notices, exam notices, holiday notices, and teacher messages.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Search notices"
            type="search"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">New Notice</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{notices.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="h-6 w-6 text-rose-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Exam Notices</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{notices.filter((n) => n.category === 'EXAM').length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="h-6 w-6 text-emerald-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Holiday Notices</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{notices.filter((n) => n.category === 'HOLIDAY').length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <MessageSquare className="h-6 w-6 text-violet-600" />
          <p className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Messages</p>
          <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{notifications.length}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
              category === item
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No notices found</h2>
              <p className="mt-1 text-sm text-slate-500">School announcements will appear here.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <article key={notice.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-950 dark:text-white">{notice.title}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {notice.postedDate ? new Date(notice.postedDate).toLocaleDateString() : 'Recently posted'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {notice.category || 'GENERAL'}
                    </span>
                    <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${priorityClass(notice.priority)}`}>
                      {notice.priority || 'NORMAL'}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p>
              </article>
            ))
          )}
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Recent Notifications</h2>
            <Bell className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-5 space-y-3">
            {notifications.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
                No unread updates.
              </p>
            ) : (
              notifications.slice(0, 8).map((note) => (
                <div key={note.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{note.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{note.message}</p>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
