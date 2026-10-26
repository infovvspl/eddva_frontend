import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader, Loader2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import { putFileToS3 } from '@/lib/api/upload';
import { CustomSelect } from "@/components/ui/CustomSelect";

const MAX_ATTACHMENT_MB = 20;

const hasAttachments = (attachments) => Boolean(attachments && Object.keys(attachments).length > 0);

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
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file after a failed attempt
    if (!file) return;
    setError('');

    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — attachments must be ${MAX_ATTACHMENT_MB}MB or smaller.`);
      return;
    }

    setUploadingFile(true);
    try {
      const contentType = file.type || 'application/octet-stream';
      const presign = await api.post('/notices/upload-url', {
        fileName: file.name,
        contentType,
        fileSize: file.size,
      });
      const { uploadUrl, fileUrl } = presign.data?.data ?? presign.data;
      await putFileToS3(uploadUrl, file, contentType);
      setFormData(prev => ({
        ...prev,
        attachments: { ...prev.attachments, [file.name]: fileUrl }
      }));
    } catch (err) {
      console.error('Notice attachment upload failed:', err);
      setError(err?.response?.data?.message || `Failed to upload "${file.name}". Please try again.`);
    } finally {
      setUploadingFile(false);
    }
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

    if (!formData.content.trim() && !hasAttachments(formData.attachments)) {
      setError('Add notice content or attach a notice file');
      return;
    }

    await onSubmit({
      ...formData,
      content: formData.content.trim() || 'Please see the attached notice.',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="size-5 flex-shrink-0 text-red-600" />
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
                <CustomSelect
          onChange={handleChange}
                  value={formData.category}
                  options={[
                  { value: "GENERAL", label: "General" },
                  { value: "ACADEMIC", label: "Academic" },
                  { value: "ACHIEVEMENT", label: "Achievement" },
                  { value: "EVENT", label: "Event" },
                  { value: "HOLIDAY", label: "Holiday" },
                  { value: "EXAM", label: "Exam" },
                  { value: "EMERGENCY", label: "Emergency" },
                ]}
                  name="category"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-2">Priority</label>
                <CustomSelect
          onChange={handleChange}
                  value={formData.priority}
                  options={[
                  { value: "LOW", label: "Low" },
                  { value: "NORMAL", label: "Normal" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
                  name="priority"
                  className="w-full"
                />
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
              <label className="block text-sm font-semibold text-surface-700 mb-3">Target Audience (Multi-select)</label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { value: 'TEACHER', label: 'Teachers' },
                  { value: 'STUDENT', label: 'Students' },
                  { value: 'PARENT', label: 'Parents' },
                  { value: 'INSTITUTE_ADMIN', label: 'Admins' },
                ].map((role) => {
                  const isSelected = (formData.targetRoles || []).includes(role.value);
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => {
                          const current = prev.targetRoles || [];
                          const updated = current.includes(role.value)
                            ? current.filter((r) => r !== role.value)
                            : [...current, role.value];
                          return { ...prev, targetRoles: updated };
                        });
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-200 ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm shadow-brand-500/10'
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      {role.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-surface-500 mt-2">Leave all unselected to broadcast to everyone.</p>
            </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Attachments</label>
          <div className="relative">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:opacity-50"
            />
            {uploadingFile && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-brand-600">
                <Loader2 className="size-3.5 animate-spin" /> Uploading...
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-surface-500">Up to {MAX_ATTACHMENT_MB}MB per file.</p>
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
          <React.Fragment key="step-1-actions">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleNextStep(); }}
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
          </React.Fragment>
        ) : (
          <React.Fragment key="step-2-actions">
            <button
              type="submit"
              disabled={isLoading || uploadingFile}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
            >
              {isLoading && <Loader className="size-4 animate-spin" />}
              {notice ? 'Update Notice' : 'Publish Notice'}
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition-all duration-200 text-center"
            >
              Back
            </button>
          </React.Fragment>
        )}
      </div>
    </form>
  );
}
