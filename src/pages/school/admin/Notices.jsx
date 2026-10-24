import React, { useState, useEffect } from 'react';
import { Bell, Clock, Edit2, FileText, Trash2, Users, X } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import NoticeForm from '@/components/school/admin/forms/NoticeForm';
import { useConfirm } from '@/context/ConfirmContext';

const isImageAttachment = (filename, data) => {
  const name = String(filename || '').toLowerCase();
  const value = String(data || '').toLowerCase();
  return (
    value.startsWith('data:image/') ||
    /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/.test(name) ||
    /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/.test(value)
  );
};

// The form only offers LOW / NORMAL / HIGH / URGENT, but older notices can carry "MEDIUM"
// (or a lowercase value). Treat those as the same level so the card and its colour agree.
const normalizePriority = (value) => {
  const key = String(value || 'NORMAL').toUpperCase();
  return key === 'MEDIUM' ? 'NORMAL' : key;
};

const isMaintenanceNotice = (notice) => String(notice?.category || '').toUpperCase() === 'MAINTENANCE';

export default function Notices() {
  const confirm = useConfirm();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      const list = res.data?.data ?? res.data;
      setNotices(Array.isArray(list) ? list.filter((notice) => !isMaintenanceNotice(notice)) : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedNotice(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (notice) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    const isConfirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this notice? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await api.delete(`/notices/${id}`);
        setNotices((prev) => prev.filter((n) => n.id !== id));
      } catch (error) {
        alert('Failed to delete notice');
      }
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedNotice) {
        const res = await api.put(`/notices/${selectedNotice.id}`, formData);
        const updated = res.data?.data ?? res.data;
        setNotices((prev) => isMaintenanceNotice(updated) ? prev.filter((n) => n.id !== selectedNotice.id) : prev.map((n) => (n.id === selectedNotice.id ? updated : n)));
      } else {
        const res = await api.post('/notices', formData);
        const created = res.data?.data ?? res.data;
        setNotices((prev) => isMaintenanceNotice(created) ? prev : [created, ...prev]);
      }
      setIsModalOpen(false);
      setSelectedNotice(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityTones = {
    LOW: { leaf: 'from-sky-500 to-blue-600 shadow-sky-500/30', pill: 'bg-sky-600 text-white', soft: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-900/50', hover: 'hover:border-sky-300 dark:hover:border-sky-800' },
    NORMAL: { leaf: 'from-emerald-500 to-green-600 shadow-emerald-500/30', pill: 'bg-emerald-600 text-white', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-900/50', hover: 'hover:border-emerald-300 dark:hover:border-emerald-800' },
    HIGH: { leaf: 'from-amber-400 to-orange-600 shadow-orange-500/30', pill: 'bg-orange-500 text-white', soft: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-900/50', hover: 'hover:border-orange-300 dark:hover:border-orange-800' },
    URGENT: { leaf: 'from-red-500 to-rose-600 shadow-red-500/30', pill: 'bg-red-600 text-white', soft: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300', border: 'border-red-200 dark:border-red-900/50', hover: 'hover:border-red-300 dark:hover:border-red-800' },
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-950">Public Notice Panel</h1>
          <p className="mt-1 text-xs sm:text-sm text-surface-500">Manage school notices with clean responsive spacing across all devices.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:brightness-110 w-auto self-start sm:self-auto sm:px-4 sm:py-2.5 sm:text-sm"
        >
          Publish Notice
        </button>
      </div>

      <div className="flex w-full flex-col gap-4">
        {notices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Bell className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">No notices published yet</p>
          </div>
        ) : (
          notices.map(notice => {
            const priority = normalizePriority(notice.priority);
            const tone = priorityTones[priority] || priorityTones.NORMAL;
            const posted = new Date(notice.postedDate);
            const hasDate = !Number.isNaN(posted.getTime());
            const attachments = Object.entries(notice.attachments || {});
            const images = attachments.filter(([filename, data]) => isImageAttachment(filename, data));
            const files = attachments.filter(([filename, data]) => !isImageAttachment(filename, data));
            const hasRoles = notice.targetRoles && notice.targetRoles.length > 0;
            const thumbs = images.map(([filename, data]) => (
              <button
                key={filename}
                type="button"
                onClick={() => setPreviewImage({ src: data, filename })}
                title={filename}
                className="size-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition hover:scale-105 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <img src={data} alt={filename} className="size-full object-cover" loading="lazy" />
              </button>
            ));
            return (
              <article
                key={notice.id}
                className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg dark:bg-slate-900 sm:gap-5 sm:p-5 ${tone.border} ${tone.hover}`}
              >
                {/* Date leaf */}
                <div className={`flex h-24 w-[4.5rem] shrink-0 flex-col overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg sm:w-20 ${tone.leaf}`}>
                  {hasDate ? (
                    <>
                      <span className="bg-black/20 py-1 text-center text-[11px] font-black uppercase tracking-[0.2em]">
                        {posted.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="flex flex-1 items-center justify-center text-4xl font-black leading-none">{posted.getDate()}</span>
                      <span className="pb-1.5 text-center text-[10px] font-bold opacity-80">{posted.getFullYear()}</span>
                    </>
                  ) : (
                    <span className="flex flex-1 items-center justify-center"><Bell className="size-7" /></span>
                  )}
                </div>

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${tone.soft}`}>
                          {notice.category || 'General'}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${tone.pill}`}>
                          {priority}
                        </span>
                      </div>
                      <h3 className="break-words font-display text-lg font-bold leading-snug text-slate-950 dark:text-white">{notice.title}</h3>
                    </div>
                  </div>

                  <p className="mt-2 break-words text-sm leading-relaxed text-slate-600 dark:text-slate-300">{notice.content}</p>

                  {(notice.expiryDate || hasRoles) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {notice.expiryDate && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.soft}`}>
                          <Clock className="size-3.5" />
                          Expires: {new Date(notice.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                      {hasRoles && (
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${tone.soft}`}>
                          <Users className="size-3.5" />
                          Audience: {notice.targetRoles.join(', ')}
                        </span>
                      )}
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 lg:hidden">{thumbs}</div>
                  )}

                  {files.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {files.map(([filename, data]) => (
                        <a
                          key={filename}
                          href={data}
                          download={filename}
                          target="_blank"
                          rel="noreferrer"
                          className={`inline-flex max-w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition hover:brightness-95 ${tone.soft}`}
                        >
                          <FileText className="size-3.5 shrink-0" />
                          <span className="min-w-0 truncate">{filename}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Images: right side of the row on large screens */}
                {images.length > 0 && (
                  <div className="hidden shrink-0 self-start lg:flex lg:max-w-[220px] lg:flex-wrap lg:justify-end lg:gap-2">
                    {thumbs}
                  </div>
                )}

                {/* Actions: always at the far right of the row */}
                <div className="flex shrink-0 flex-col gap-1 self-start sm:flex-row">
                  <button
                    onClick={() => handleEditClick(notice)}
                    title="Edit"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(notice.id)}
                    title="Delete"
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <Modal 
        isOpen={isModalOpen}
        title={selectedNotice ? 'Edit Notice' : 'Publish New Notice'}
        onClose={() => setIsModalOpen(false)}
        size="lg"
      >
        <NoticeForm 
          notice={selectedNotice}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-surface-700 shadow-lg hover:bg-white"
              aria-label="Close image preview"
            >
              <X className="size-5" />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.filename}
              className="mx-auto max-h-[86vh] w-full rounded-xl bg-white object-contain"
            />
            <div className="mt-3 flex justify-center">
              <a
                href={previewImage.src}
                download={previewImage.filename}
                className="max-w-full rounded-lg bg-white/95 px-4 py-2 text-sm font-bold text-surface-800 shadow-lg hover:bg-white"
              >
                <span className="block max-w-[80vw] truncate">{previewImage.filename}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
