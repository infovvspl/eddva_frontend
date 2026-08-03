import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Search,
  X
} from 'lucide-react';

interface Notice {
  id: string | number;
  title: string;
  content: string;
  category: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  postedDate?: string;
  attachments?: Record<string, string>;
}

interface DBNotification {
  id: string | number;
  title: string;
  message: string;
  createdAt?: string;
  created_at?: string;
  time?: string;
}

interface Attachment {
  name: string;
  url: string;
}

const categories = ['All', 'GENERAL', 'EXAM', 'HOLIDAY', 'ACADEMIC'];
const isMaintenanceNotice = (notice: Notice) => String(notice?.category || '').toUpperCase() === 'MAINTENANCE';

function priorityClass(priority: 'HIGH' | 'NORMAL' | 'LOW') {
  if (priority === 'HIGH') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
  if (priority === 'LOW') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300';
}

function getNoticeAttachments(attachments: any): Attachment[] {
  if (!attachments || typeof attachments !== 'object') return [];
  return Object.entries(attachments)
    .filter(([, url]) => typeof url === 'string' && url.trim())
    .map(([name, url]) => ({ name, url: url as string }));
}

function isImageAttachment(file: Attachment) {
  const name = String(file?.name || '').toLowerCase();
  const url = String(file?.url || '').toLowerCase();
  return url.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(name) || /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(url);
}

export default function Announcements() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const [noticeRes, notificationRes] = await Promise.all([
          api.get('/notices').catch(() => ({ data: { data: [] } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
        ]);
        const nextNotices = noticeRes.data?.data || noticeRes.data || [];
        setNotices(Array.isArray(nextNotices) ? nextNotices.filter((notice: Notice) => !isMaintenanceNotice(notice)) : []);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Institute notices, exam notices, holiday notices, and notifications.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-lg sm:py-3 sm:pl-10 sm:text-sm"
            placeholder="Search notices..."
            type="search"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3.5 sm:p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">New Notices</p>
          <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{notices.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
          <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Exam Notices</p>
          <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{notices.filter((n) => n.category === 'EXAM').length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
          <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Holiday Notices</p>
          <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{notices.filter((n) => n.category === 'HOLIDAY').length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600" />
          <p className="mt-3 sm:mt-4 text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500">Notifications</p>
          <p className="mt-0.5 sm:mt-1 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{notifications.length}</p>
        </div>
      </div>

      {isMobile ? (
        <CustomSelect
          value={category}
          onChange={(val) => setCategory(val)}
          options={categories.map((c) => ({ value: c, label: c === 'All' ? 'All Categories' : c }))}
          className="w-full"
          triggerClassName="flex h-full w-full items-center justify-between gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold outline-none text-slate-700 shadow-sm"
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition ${category === item
                ? 'bg-blue-600 text-white dark:bg-blue-600 dark:text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No notices found</h2>
              <p className="mt-1 text-sm text-slate-500">School announcements will appear here.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const attachments = getNoticeAttachments(notice.attachments);
              const imageAttachments = attachments.filter(isImageAttachment);
              const fileAttachments = attachments.filter((file) => !isImageAttachment(file));

              return (
                <article key={notice.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className={`flex flex-col gap-4 sm:gap-5 ${imageAttachments.length > 0 ? 'xl:flex-row' : ''}`}>
                    {imageAttachments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(imageAttachments[0])}
                        className="group block w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950 xl:w-56"
                        aria-label={`Open ${imageAttachments[0].name}`}
                      >
                        <img
                          src={imageAttachments[0].url}
                          alt={imageAttachments[0].name}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-44 xl:h-36"
                        />
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                        <div>
                          <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-snug">{notice.title}</h2>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-500">
                            {notice.postedDate ? new Date(notice.postedDate).toLocaleDateString() : 'Recently posted'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 shrink-0">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {notice.category || 'GENERAL'}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${priorityClass(notice.priority)}`}>
                            {notice.priority || 'NORMAL'}
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed sm:leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p>

                      {attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                          {imageAttachments.slice(1).map((file) => (
                            <a
                              key={file.name}
                              href={file.url}
                              onClick={(event) => {
                                event.preventDefault();
                                setPreviewImage(file);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              <ImageIcon size={12} />
                              <span className="max-w-[140px] sm:max-w-[180px] truncate">{file.name}</span>
                              <ExternalLink size={10} />
                            </a>
                          ))}
                          {fileAttachments.map((file) => (
                            <a
                              key={file.name}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              download={file.name}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <FileText size={12} />
                              <span className="max-w-[140px] sm:max-w-[180px] truncate">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
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
                  <p className="mt-1 text-xs font-medium text-slate-500">{note.message || note.createdAt || note.created_at || ''}</p>
                </div>
              ))
            )}
          </div>
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
                className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
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
