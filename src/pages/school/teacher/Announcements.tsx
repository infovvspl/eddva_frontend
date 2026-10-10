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
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'New Notices', value: notices.length, icon: Megaphone, iconTone: 'text-blue-600', card: 'border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20', labelTone: 'text-blue-700 dark:text-blue-300' },
    { label: 'Exam Notices', value: notices.filter((n) => n.category === 'EXAM').length, icon: ClipboardList, iconTone: 'text-rose-600', card: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900', labelTone: 'text-slate-500' },
    { label: 'Holiday Notices', value: notices.filter((n) => n.category === 'HOLIDAY').length, icon: CalendarDays, iconTone: 'text-emerald-600', card: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900', labelTone: 'text-slate-500' },
    { label: 'Notifications', value: notifications.length, icon: MessageSquare, iconTone: 'text-violet-600', card: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900', labelTone: 'text-slate-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Announcements</h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Institute notices, exam notices, holiday notices, and notifications.</p>
        </div>
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-auto w-full rounded-xl border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-bold text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white sm:rounded-lg sm:py-3 sm:pl-10 sm:text-sm"
            placeholder="Search notices..."
            type="search"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((item) => (
          <Card key={item.label} className={cn('rounded-xl p-3.5 shadow-none sm:p-5', item.card)}>
            <item.icon className={cn('size-5 sm:size-6', item.iconTone)} />
            <p className={cn('mt-3 text-[9px] font-black uppercase tracking-widest sm:mt-4 sm:text-[11px]', item.labelTone)}>{item.label}</p>
            <p className="mt-0.5 text-2xl font-black text-slate-950 dark:text-white sm:mt-1 sm:text-3xl">{item.value}</p>
          </Card>
        ))}
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 pb-1">
          {categories.map((item) => (
            <TabsTrigger
              key={item}
              value={item}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-none dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {item === 'All' ? 'All Categories' : item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <Card className="rounded-lg border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
              <Megaphone className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-3 text-sm font-black text-slate-900 dark:text-white">No notices found</h2>
              <p className="mt-1 text-sm text-slate-500">School announcements will appear here.</p>
            </Card>
          ) : (
            filteredNotices.map((notice) => {
              const attachments = getNoticeAttachments(notice.attachments);
              const imageAttachments = attachments.filter(isImageAttachment);
              const fileAttachments = attachments.filter((file) => !isImageAttachment(file));

              return (
                <Card key={notice.id} className="rounded-xl border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className={`flex flex-col gap-4 sm:gap-5 ${imageAttachments.length > 0 ? 'xl:flex-row' : ''}`}>
                    {imageAttachments.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setPreviewImage(imageAttachments[0])}
                        className="group block h-auto w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-0 text-left hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 xl:w-56"
                        aria-label={`Open ${imageAttachments[0].name}`}
                      >
                        <img
                          src={imageAttachments[0].url}
                          alt={imageAttachments[0].name}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-44 xl:h-36"
                        />
                      </Button>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-start">
                        <div>
                          <h2 className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-snug">{notice.title}</h2>
                          <p className="mt-1 text-[10px] sm:text-xs font-semibold text-slate-500">
                            {notice.postedDate ? new Date(notice.postedDate).toLocaleDateString() : 'Recently posted'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-1.5">
                          <Badge variant="outline" className="rounded border-transparent bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {notice.category || 'GENERAL'}
                          </Badge>
                          <Badge variant="outline" className={cn('rounded border-transparent px-2 py-0.5 text-[9px] font-black uppercase tracking-wider', priorityClass(notice.priority))}>
                            {notice.priority || 'NORMAL'}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed sm:leading-6 text-slate-600 dark:text-slate-300">{notice.content}</p>

                      {attachments.length > 0 && (
                        <>
                          <Separator className="mt-4 bg-slate-100 dark:bg-slate-800" />
                          <div className="mt-4 flex flex-wrap gap-2">
                            {imageAttachments.slice(1).map((file) => (
                              <Button
                                key={file.name}
                                asChild
                                variant="ghost"
                                className="h-auto rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 sm:text-xs"
                              >
                                <a
                                  href={file.url}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    setPreviewImage(file);
                                  }}
                                >
                                  <ImageIcon size={12} />
                                  <span className="max-w-[140px] truncate sm:max-w-[180px]">{file.name}</span>
                                  <ExternalLink size={10} />
                                </a>
                              </Button>
                            ))}
                            {fileAttachments.map((file) => (
                              <Button
                                key={file.name}
                                asChild
                                variant="ghost"
                                className="h-auto rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:text-xs"
                              >
                                <a href={file.url} target="_blank" rel="noreferrer" download={file.name}>
                                  <FileText size={12} />
                                  <span className="max-w-[140px] truncate sm:max-w-[180px]">{file.name}</span>
                                </a>
                              </Button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <Card className="h-fit rounded-lg border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-0">
            <CardTitle className="text-base font-black leading-normal tracking-normal text-slate-950 dark:text-white">Recent Notifications</CardTitle>
            <Bell className="size-5 text-blue-600" />
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-5">
            {notifications.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-950/50">
                No unread updates.
              </p>
            ) : (
              notifications.slice(0, 8).map((note) => (
                <Card key={note.id} className="rounded-lg border-slate-200 p-3 shadow-none dark:border-slate-800">
                  <p className="text-sm font-black text-slate-950 dark:text-white">{note.title}</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">{note.message || note.createdAt || note.created_at || ''}</p>
                </Card>
              ))
            )}
          </CardContent>
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
