import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function SectionForm({ sectionData, classes = [], onSubmit, onCancel, isLoading, defaultAcademicYear = '2025-2026' }) {
  const [formData, setFormData] = useState({
    name: '',
    classId: '',
    academicYear: defaultAcademicYear
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (sectionData) {
      setFormData({
        name: sectionData.name || '',
        classId: sectionData.classId || '',
        academicYear: sectionData.academic_year || sectionData.academicYear || defaultAcademicYear
      });
    } else {
      setFormData(prev => ({
        ...prev,
        academicYear: defaultAcademicYear
      }));
    }
  }, [sectionData, defaultAcademicYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) return setError('Section name is required');
    if (!formData.classId) return setError('Please select a class');

    onSubmit(formData);
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Class *</label>
            <select
              name="classId"
              value={formData.classId}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Academic Year *</label>
            <select
              name="academicYear"
              value={formData.academicYear}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Section Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="A, B, C etc."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {sectionData ? 'Update Section' : 'Add Section'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition-all duration-200 text-center"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
