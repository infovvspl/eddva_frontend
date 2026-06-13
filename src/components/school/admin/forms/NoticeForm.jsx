import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function NoticeForm({ notice, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    priority: 'NORMAL',
    postedDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    targetRoles: [],
    attachments: {}
  });
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    setStep(1);
    if (notice) {
      setFormData({
        title: notice.title || '',
        content: notice.content || '',
        category: notice.category || 'GENERAL',
        priority: notice.priority || 'NORMAL',
        postedDate: notice.postedDate ? new Date(notice.postedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: notice.expiryDate ? new Date(notice.expiryDate).toISOString().split('T')[0] : '',
        targetRoles: notice.targetRoles || [],
        attachments: notice.attachments || {}
      });
    }
  }, [notice]);

  const handleChange = (e) => {
    const { name, value, options } = e.target;
    if (name === 'targetRoles') {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setFormData(prev => ({ ...prev, [name]: selected }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        attachments: { ...prev.attachments, [file.name]: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleNextStep = () => {
    setError('');
    if (!formData.title.trim()) {
      setError('Notice title is required');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.content.trim()) {
      setError('Notice content is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Notice Title"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="GENERAL">General</option>
                  <option value="ACADEMIC">Academic</option>
                  <option value="EVENT">Event</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="EXAM">Exam</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Posted Date</label>
                <input
                  type="date"
                  name="postedDate"
                  value={formData.postedDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Target Audience (Multi-select)</label>
            <select
              name="targetRoles"
              multiple
              value={formData.targetRoles}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 h-24"
            >
              <option value="TEACHER">Teachers</option>
              <option value="STUDENT">Students</option>
              <option value="PARENT">Parents</option>
              <option value="INSTITUTE_ADMIN">Admins</option>
            </select>
            <p className="text-xs text-surface-500 mt-1">Leave unselected to broadcast to everyone.</p>
          </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Attachments</label>
          <input
            type="file"
            onChange={handleFileUpload}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
          {Object.keys(formData.attachments).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.keys(formData.attachments).map(filename => (
                <span key={filename} className="inline-flex items-center gap-1 px-3 py-1 bg-surface-100 text-surface-700 rounded-full text-xs font-bold">
                  {filename}
                  <button type="button" onClick={() => {
                    const newAtt = { ...formData.attachments };
                    delete newAtt[filename];
                    setFormData(prev => ({ ...prev, attachments: newAtt }));
                  }} className="text-red-500 hover:text-red-700 ml-1">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Content *</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows="6"
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Notice content..."
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 transition-all duration-200"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition-all duration-200 text-center"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
            >
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              {notice ? 'Update Notice' : 'Publish Notice'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition-all duration-200 text-center"
            >
              Back
            </button>
          </>
        )}
      </div>
    </form>
  );
}
