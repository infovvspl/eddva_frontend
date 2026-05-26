import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/admin/Modal';
import NoticeForm from '@/components/school/admin/forms/NoticeForm';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (confirm('Are you sure you want to delete this notice?')) {
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
    <div className="mx-auto max-w-6xl px-2 sm:px-4">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold text-surface-950">Public Notice Panel</h1>
          <p className="mt-2 text-sm text-surface-500">Manage school notices with clean responsive spacing across all devices.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-bold text-white shadow-sm hover:brightness-110 sm:w-auto"
        >
          Publish Notice
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {notices.length === 0 ? (
          <div className="rounded-lg border border-surface-200 bg-white p-8 text-center lg:col-span-2">
            <Bell className="mx-auto mb-3 h-10 w-10 text-surface-300" />
            <p className="text-surface-500">No notices published yet</p>
          </div>
        ) : (
          notices.map(notice => (
            <div key={notice.id} className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-surface-950">{notice.title}</h3>
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
              <p className="text-sm text-surface-700 leading-relaxed">{notice.content}</p>
              <p className="mt-3 text-xs text-surface-400">
                Posted: {new Date(notice.postedDate).toLocaleDateString()}
                {notice.expiryDate && ` · Expires: ${new Date(notice.expiryDate).toLocaleDateString()}`}
                {notice.targetRoles && notice.targetRoles.length > 0 && ` · Audience: ${notice.targetRoles.join(', ')}`}
              </p>
              {notice.attachments && Object.keys(notice.attachments).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-surface-100 pt-4">
                  {Object.entries(notice.attachments).map(([filename, data]) => (
                    <a key={filename} href={data} download={filename} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors">
                      <span className="max-w-[220px] truncate">{filename}</span>
                    </a>
                  ))}
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
    </div>
  );
}
