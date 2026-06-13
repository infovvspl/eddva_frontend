import React, { useState, useEffect } from 'react';
import { Bell, Edit2, Trash2, X } from 'lucide-react';
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
      setNotices(Array.isArray(list) ? list : []);
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
        setNotices((prev) => prev.map((n) => (n.id === selectedNotice.id ? updated : n)));
      } else {
        const res = await api.post('/notices', formData);
        const created = res.data?.data ?? res.data;
        setNotices((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
      setSelectedNotice(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors = {
    LOW: 'bg-blue-50 text-blue-700',
    NORMAL: 'bg-surface-100 text-surface-700',
    HIGH: 'bg-orange-50 text-orange-700',
    URGENT: 'bg-red-50 text-red-700'
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold text-surface-950">Public Notice Panel</h1>
          <p className="mt-2 text-sm text-surface-500">Manage school notices with clean responsive spacing across all devices.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-sm hover:brightness-110 sm:w-auto"
        >
          Publish Notice
        </button>
      </div>

      <div className="grid w-full gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        {notices.length === 0 ? (
          <div className="rounded-lg border border-surface-200 bg-white p-8 text-center xl:col-span-2 2xl:col-span-3">
            <Bell className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p className="text-surface-500">No notices published yet</p>
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="min-w-0 break-words font-display text-lg font-bold text-surface-950">{notice.title}</h3>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${priorityColors[notice.priority] || priorityColors.NORMAL}`}>
                      {notice.priority || 'NORMAL'}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500">{notice.category || 'General'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button 
                    onClick={() => handleEditClick(notice)}
                    className="rounded p-1 text-surface-500 hover:bg-surface-100 hover:text-brand-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(notice.id)}
                    className="rounded p-1 text-surface-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="break-words text-sm leading-relaxed text-surface-700">{notice.content}</p>
              <p className="mt-3 text-xs text-surface-400">
                Posted: {new Date(notice.postedDate).toLocaleDateString()}
                {notice.expiryDate && ` · Expires: ${new Date(notice.expiryDate).toLocaleDateString()}`}
                {notice.targetRoles && notice.targetRoles.length > 0 && ` · Audience: ${notice.targetRoles.join(', ')}`}
              </p>
              {notice.attachments && Object.keys(notice.attachments).length > 0 && (
                <div className="mt-4 space-y-3 border-t border-surface-100 pt-4">
                  {Object.entries(notice.attachments).map(([filename, data]) => {
                    const image = isImageAttachment(filename, data);
                    return (
                      <div key={filename} className="min-w-0">
                        {image && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ src: data, filename })}
                            className="mb-2 block w-full overflow-hidden rounded-xl border border-surface-200 bg-surface-50 text-left"
                          >
                            <img
                              src={data}
                              alt={filename}
                              className="h-auto max-h-[420px] w-full object-contain"
                              loading="lazy"
                            />
                          </button>
                        )}
                        <a
                          href={data}
                          download={filename}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-full items-center gap-2 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          <span className="min-w-0 truncate">{filename}</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
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
          <div className="relative max-h-full w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-white/95 p-2 text-surface-700 shadow-lg hover:bg-white"
              aria-label="Close image preview"
            >
              <X className="h-5 w-5" />
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
