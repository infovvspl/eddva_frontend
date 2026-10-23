import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { Bell, CalendarDays, ClipboardList, ExternalLink, FileText, Image as ImageIcon, Megaphone, MessageSquare, Paperclip, Search, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const categories = ['All', 'GENERAL', 'EXAM', 'HOLIDAY', 'ACADEMIC'];
const isMaintenanceNotice = (notice) => String(notice?.category || '').toUpperCase() === 'MAINTENANCE';

// Category colours for the date block and the label (full class names so Tailwind keeps them).
const CATEGORY_COLOR = {
  GENERAL: { block: 'bg-blue-600', label: 'text-blue-600 dark:text-blue-300' },
  EXAM: { block: 'bg-rose-600', label: 'text-rose-600 dark:text-rose-300' },
  HOLIDAY: { block: 'bg-emerald-600', label: 'text-emerald-600 dark:text-emerald-300' },
  ACADEMIC: { block: 'bg-violet-600', label: 'text-violet-600 dark:text-violet-300' },
};
const getColor = (category) => CATEGORY_COLOR[String(category || '').toUpperCase()] || CATEGORY_COLOR.GENERAL;

function priorityClass(priority) {
  if (priority === 'HIGH') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
  if (priority === 'LOW') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300';
}

function getNoticeAttachments(attachments) {
  if (!attachments || typeof attachments !== 'object') return [];
  return Object.entries(attachments)
    .filter(([, url]) => typeof url === 'string' && url.trim())
    .map(([name, url]) => ({ name, url }));
}

function isImageAttachment(file) {
  const name = String(file?.name || '').toLowerCase();
  const url = String(file?.url || '').toLowerCase();
  return url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(name) || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url);
}

// Calendar-style date block: big day number over the short month.
function DateBlock({ value, colorClass }) {
  const date = value ? new Date(value) : null;
  const valid = date && !Number.isNaN(date.getTime());
  return (
    <div className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm sm:size-16 ${colorClass}`}>
      {valid ? (
        <>
          <span className="text-xl font-black leading-none sm:text-2xl">{date.getDate()}</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-90">
            {date.toLocaleDateString([], { month: 'short' })}
          </span>
        </>
      ) : (
        <Megaphone className="size-6" />
      )}
    </div>
  );
}

export default function Announcements() {
  const isMobile = useIsMobile();
  const [notices, setNotices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const [noticeRes, notificationRes] = await Promise.all([
          api.get('/notices').catch(() => ({ data: { data: [] } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
        ]);
        const nextNotices = noticeRes.data?.data || noticeRes.data || [];
        setNotices(Array.isArray(nextNotices) ? nextNotices.filter((notice) => !isMaintenanceNotice(notice)) : []);
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
        <div className="size-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const countOf = (item) => (item === 'All' ? notices.length : notices.filter((n) => n.category === item).length);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="!text-2xl font-black tracking-tight text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Institute notices, exam notices, holiday notices, and teacher messages.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            placeholder="Search notices"
            type="search"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { label: 'All notices', value: notices.length, icon: Megaphone, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' },
          { label: 'Exam', value: notices.filter((n) => n.category === 'EXAM').length, icon: ClipboardList, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
          { label: 'Holiday', value: notices.filter((n) => n.category === 'HOLIDAY').length, icon: CalendarDays, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
          { label: 'Messages', value: notifications.length, icon: MessageSquare, tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' },
        ].map(({ label, value, icon: Icon, tile }) => (
          <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:gap-4 sm:p-5">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl sm:size-12 ${tile}`}>
              <Icon className="size-5 sm:size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-[11px]">{label}</p>
              <p className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Underline tabs. */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {categories.map((item) => {
          const active = category === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-black uppercase tracking-widest transition ${active
                ? 'border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {item}
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {countOf(item)}
              </span>
            </button>
          );
        })}
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Megaphone className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No notices found</h2>
              <p className="mt-1 text-sm text-slate-500">School announcements will appear here.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const attachments = getNoticeAttachments(notice.attachments);
              const imageAttachments = attachments.filter(isImageAttachment);
              const fileAttachments = attachments.filter((file) => !isImageAttachment(file));
              const color = getColor(notice.category);

              return (
                <article key={notice.id} className="flex gap-3 sm:gap-4">
                  <DateBlock value={notice.postedDate} colorClass={color.block} />
                  <div className="min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                      <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className={`text-[11px] font-black uppercase tracking-widest ${color.label}`}>{notice.category || 'GENERAL'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${priorityClass(notice.priority)}`}>
                          {notice.priority || 'NORMAL'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {notice.postedDate ? new Date(notice.postedDate).toLocaleDateString() : 'Recently posted'}
                        </span>
                      </div>
                      <h2 className="mt-2 break-words !text-base font-black leading-snug text-slate-950 dark:text-white">{notice.title}</h2>
                      <p className="mt-2 whitespace-pre-line break-words text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p>

                      {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                          <Paperclip className="size-4 text-slate-400" />
                          {imageAttachments.slice(1).map((file) => (
                            <a
                              key={file.name}
                              href={file.url}
                              onClick={(event) => {
                                event.preventDefault();
                                setPreviewImage(file);
                              }}
                              className="inline-flex max-w-full items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              <ImageIcon size={14} className="shrink-0" />
                              <span className="max-w-[160px] truncate">{file.name}</span>
                              <ExternalLink size={12} className="shrink-0" />
                            </a>
                          ))}
                          {fileAttachments.map((file) => (
                            <a
                              key={file.name}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              download={file.name}
                              className="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <FileText size={14} className="shrink-0" />
                              <span className="max-w-[160px] truncate">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      </div>
                      {imageAttachments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(imageAttachments[0])}
                          className="group block w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950 md:w-48 lg:w-52"
                          aria-label={`Open ${imageAttachments[0].name}`}
                        >
                          <img
                            src={imageAttachments[0].url}
                            alt={imageAttachments[0].name}
                            className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] md:h-36"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Notifications as a simple feed with a dotted rail. */}
        <aside className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <h2 className="!text-base font-black text-slate-950 dark:text-white">Recent Notifications</h2>
            <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Bell className="size-3.5" />
              {notifications.length}
            </span>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
              No unread updates.
            </p>
          ) : (
            <ol className="mt-5 space-y-4 border-l-2 border-slate-100 pl-5 dark:border-slate-800">
              {notifications.slice(0, 8).map((note) => (
                <li key={note.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                  <p className="break-words text-sm font-black text-slate-950 dark:text-white">{note.title}</p>
                  <p className="mt-0.5 break-words text-xs font-medium leading-5 text-slate-500">{note.message}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </section>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{previewImage.name}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-58px)] overflow-auto bg-slate-50 p-3 dark:bg-slate-900">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="mx-auto max-h-[calc(92vh-88px)] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
