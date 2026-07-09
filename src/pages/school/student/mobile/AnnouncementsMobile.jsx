import React from 'react';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Search,
  X,
} from 'lucide-react';

const categories = ['All', 'GENERAL', 'EXAM', 'HOLIDAY', 'ACADEMIC'];

export default function AnnouncementsMobile({
  notices,
  category,
  setCategory,
  query,
  setQuery,
  loading,
  previewImage,
  setPreviewImage,
  filteredNotices,
  priorityClass,
  getNoticeAttachments,
  isImageAttachment,
}) {
  if (loading && notices.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-bold text-slate-900 outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          placeholder="Search announcements..."
          type="search"
        />
      </div>

      {/* Category Tab Selector (Horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-4 px-4">
        {categories.map((cat) => {
          const isSelected = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* List of Notices */}
      <div className="space-y-3.5">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
          Announcements ({filteredNotices.length})
        </h2>
        {filteredNotices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <Megaphone className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No announcements match filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotices.map((notice) => {
              const atts = getNoticeAttachments(notice.attachments);

              return (
                <div
                  key={notice.id}
                  className={`rounded-2xl border bg-white p-4 shadow-xs dark:bg-slate-900 ${
                    notice.priority === 'HIGH'
                      ? 'border-rose-100 dark:border-rose-950/40 bg-rose-50/10'
                      : 'border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${priorityClass(notice.priority)}`}>
                      {notice.priority || 'NORMAL'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CalendarDays size={11} />
                      {notice.date ? new Date(notice.date).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {notice.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {notice.content}
                  </p>

                  {/* Notice Attachments (Horizontal Cards) */}
                  {atts.length > 0 && (
                    <div className="mt-4 border-t border-slate-100 dark:border-slate-800/80 pt-3.5 space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Attachments</p>
                      <div className="flex flex-col gap-2">
                        {atts.map((file, fidx) => {
                          const isImg = isImageAttachment(file);
                          return (
                            <div
                              key={fidx}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/30 p-2.5 dark:border-slate-800 dark:bg-slate-900/45"
                            >
                              <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                {isImg ? <ImageIcon size={14} className="text-blue-500" /> : <FileText size={14} className="text-slate-500" />}
                                <span className="truncate max-w-[180px]">{file.name}</span>
                              </span>
                              <div className="flex gap-2">
                                {isImg && (
                                  <button
                                    onClick={() => setPreviewImage(file.url)}
                                    className="rounded-lg bg-blue-50 p-1.5 text-blue-600 hover:bg-blue-100/60"
                                  >
                                    <ImageIcon size={13} />
                                  </button>
                                )}
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-300"
                                >
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/85 p-4 animate-fade-in">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-slate-900 shadow-2xl">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex max-h-[80vh] items-center justify-center p-4">
              <img src={previewImage} alt="Attachment Preview" className="h-auto max-h-[70vh] w-auto max-w-full object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
