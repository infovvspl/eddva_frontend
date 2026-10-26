import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Megaphone,
  MessageSquare,
  Paperclip,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

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

const categories = ['All', 'GENERAL', 'ACHIEVEMENT', 'EXAM', 'HOLIDAY', 'ACADEMIC', 'EVENT'];
const isMaintenanceNotice = (notice: Notice) => String(notice?.category || '').toUpperCase() === 'MAINTENANCE';

// Category colours for the date block and the label (full class names so Tailwind keeps them).
const CATEGORY_COLOR: Record<string, { block: string; label: string }> = {
  GENERAL: { block: 'bg-blue-600', label: 'text-blue-600 dark:text-blue-300' },
  EXAM: { block: 'bg-rose-600', label: 'text-rose-600 dark:text-rose-300' },
  HOLIDAY: { block: 'bg-emerald-600', label: 'text-emerald-600 dark:text-emerald-300' },
  ACADEMIC: { block: 'bg-violet-600', label: 'text-violet-600 dark:text-violet-300' },
};
const getColor = (category?: string) => CATEGORY_COLOR[String(category || '').toUpperCase()] || CATEGORY_COLOR.GENERAL;

function priorityClass(priority: 'HIGH' | 'NORMAL' | 'LOW') {
  if (priority === 'HIGH') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300';
  if (priority === 'LOW') return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300';
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

// Calendar-style date block: big day number over the short month.
function DateBlock({ value, colorClass }: { value?: string; colorClass: string }) {
  const date = value ? new Date(value) : null;
  const valid = !!date && !Number.isNaN(date.getTime());
  return (
    <div className={cn('flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-sm sm:size-16', colorClass)}>
      {valid && date ? (
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
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<Attachment | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const [noticeRes, notificationRes] = await Promise.all([
          api.get('/notices').catch(() => ({ data: { data: [] } })),
          api.get('/notifications').catch(() => ({ data: { data: [] } })),
        ]);
        const nextNotices = noticeRes.data?.data || noticeRes.data || [];
        setNotices(Array.isArray(nextNotices) ? nextNotices.filter((notice: Notice) => !isMaintenanceNotice(notice)) : []);
        const nextNotifications = notificationRes.data?.data || notificationRes.data || [];
        setNotifications(Array.isArray(nextNotifications) ? nextNotifications : []);
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
      <div className="space-y-6 py-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl sm:h-24" />
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const countOf = (item: string) => (item === 'All' ? notices.length : notices.filter((n) => n.category === item).length);

  const stats = [
    { label: 'All notices', value: notices.length, icon: Megaphone, border: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/60 dark:border-blue-900/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/20', tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' },
    { label: 'Exam', value: notices.filter((n) => n.category === 'EXAM').length, icon: ClipboardList, border: 'border-rose-200 hover:border-rose-300 hover:bg-rose-50/60 dark:border-rose-900/60 dark:hover:border-rose-800 dark:hover:bg-rose-950/20', tile: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300' },
    { label: 'Holiday', value: notices.filter((n) => n.category === 'HOLIDAY').length, icon: CalendarDays, border: 'border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-emerald-900/60 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20', tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' },
    { label: 'Notifications', value: notifications.length, icon: MessageSquare, border: 'border-violet-200 hover:border-violet-300 hover:bg-violet-50/60 dark:border-violet-900/60 dark:hover:border-violet-800 dark:hover:bg-violet-950/20', tile: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300' },
  ];

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Institute notices, exam notices, holiday notices, and notifications.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-full border-indigo-200 bg-white pl-11 pr-11 text-base font-semibold text-slate-900 placeholder:font-medium placeholder:text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            placeholder="Search notices"
            aria-label="Search notices"
            type="search"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 size-7 -translate-y-1/2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tile, border }) => (
          <Card
            key={label}
            className={cn('flex min-w-0 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 shadow-none transition-colors duration-200 dark:bg-slate-900 sm:gap-4 sm:p-5', border)}
          >
            <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl sm:size-12', tile)}>
              <Icon className="size-5 sm:size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-[11px]">{label}</p>
              <p className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Separate bordered chips; the active one fills with its category colour. */}
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 py-1">
        {categories.map((item) => {
          const active = category === item;
          const fill = item === 'All' ? 'bg-slate-900 dark:bg-white' : getColor(item).block;
          return (
            <Button
              key={item}
              type="button"
              variant="outline"
              onClick={() => setCategory(item)}
              className={cn(
                'h-auto shrink-0 gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all',
                active
                  ? cn(fill, 'border-transparent text-white shadow-md hover:text-white dark:text-white', item === 'All' ? 'hover:bg-slate-900 dark:!text-slate-900 dark:hover:bg-white' : '', item !== 'All' ? 'hover:brightness-110' : '')
                  : 'border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700',
              )}
            >
              {item}
              <span className={cn('min-w-5 rounded-md px-1.5 py-0.5 text-center text-[10px] leading-none', active ? 'bg-white/25 text-inherit' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400')}>
                {countOf(item)}
              </span>
            </Button>
          );
        })}
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-4">
          {filteredNotices.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Megaphone className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No notices found</h2>
              <p className="mt-1 text-sm text-slate-500">School announcements will appear here.</p>
            </Card>
          ) : (
            filteredNotices.map((notice) => {
              const attachments = getNoticeAttachments(notice.attachments);
              const imageAttachments = attachments.filter(isImageAttachment);
              const fileAttachments = attachments.filter((file) => !isImageAttachment(file));
              const color = getColor(notice.category);

              return (
                <article key={notice.id} className="flex gap-3 sm:gap-4">
                  <DateBlock value={notice.postedDate} colorClass={color.block} />
                  <Card className="min-w-0 flex-1 rounded-2xl border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className={cn('text-[11px] font-black uppercase tracking-widest', color.label)}>{notice.category || 'GENERAL'}</span>
                          <Badge variant="outline" className={cn('rounded-full border-transparent px-2 py-0.5 text-[10px] font-black uppercase tracking-widest', priorityClass(notice.priority))}>
                            {notice.priority || 'NORMAL'}
                          </Badge>
                          <span className="text-xs font-semibold text-slate-400">
                            {notice.postedDate ? new Date(notice.postedDate).toLocaleDateString() : 'Recently posted'}
                          </span>
                        </div>
                        <h2 className="mt-2 break-words text-base font-black leading-snug text-slate-950 dark:text-white">{notice.title}</h2>
                        <p className="mt-2 whitespace-pre-line break-words text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p>

                        {attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <Paperclip className="size-4 text-slate-400" />
                            {imageAttachments.slice(1).map((file) => (
                              <Button
                                key={file.name}
                                asChild
                                variant="ghost"
                                className="h-auto max-w-full gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/30 dark:text-blue-300"
                              >
                                <a
                                  href={file.url}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setPreviewImage(file);
                                  }}
                                >
                                  <ImageIcon size={14} className="shrink-0" />
                                  <span className="max-w-[160px] truncate">{file.name}</span>
                                  <ExternalLink size={12} className="shrink-0" />
                                </a>
                              </Button>
                            ))}
                            {fileAttachments.map((file) => (
                              <Button
                                key={file.name}
                                asChild
                                variant="ghost"
                                className="h-auto max-w-full gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                <a href={file.url} target="_blank" rel="noreferrer" download={file.name}>
                                  <FileText size={14} className="shrink-0" />
                                  <span className="max-w-[160px] truncate">{file.name}</span>
                                </a>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      {imageAttachments.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setPreviewImage(imageAttachments[0])}
                          className="group block h-auto w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-0 text-left hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 md:w-48 lg:w-52"
                          aria-label={`Open ${imageAttachments[0].name}`}
                        >
                          <img
                            src={imageAttachments[0].url}
                            alt={imageAttachments[0].name}
                            className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.03] md:h-36"
                          />
                        </Button>
                      )}
                    </div>
                  </Card>
                </article>
              );
            })
          )}
        </div>

        {/* Notifications as a simple feed with a dotted rail. */}
        <Card className="rounded-2xl border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Recent Notifications</h2>
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
                  <p className="mt-0.5 break-words text-xs font-medium leading-5 text-slate-500">{note.message || note.createdAt || note.created_at || ''}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) setPreviewImage(null); }}>
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 shadow-2xl dark:bg-slate-950 sm:rounded-2xl">
          {previewImage && (
            <>
              <DialogHeader className="border-b border-slate-100 px-4 py-3 pr-12 text-left dark:border-slate-800">
                <DialogTitle className="truncate text-sm font-bold leading-normal tracking-normal text-slate-900 dark:text-white">{previewImage.name}</DialogTitle>
                <DialogDescription className="sr-only">Image preview</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3 dark:bg-slate-900">
                <img
                  src={previewImage.url}
                  alt={previewImage.name}
                  className="mx-auto max-h-[calc(92vh-88px)] w-auto max-w-full rounded-xl object-contain"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
