import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function ClassForm({ classData, onSubmit, onCancel, isLoading, defaultAcademicYear = '2025-2026' }) {
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    section: '',
    building: '',
    academicYear: defaultAcademicYear
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name || '',
        level: classData.level?.toString() || '',
        section: (classData.sections || []).map(s => s.name).join(', ') || '',
        building: classData.building || '',
        academicYear: classData.academic_year || classData.academicYear || defaultAcademicYear
      });
    } else {
      setFormData(prev => ({
        ...prev,
        academicYear: defaultAcademicYear
      }));
    }
  }, [classData, defaultAcademicYear]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Class name is required');
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
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-surface-700 mb-1.5">Class Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-xs sm:text-sm"
              placeholder="Class 10-A"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-surface-700 mb-1.5">Academic Year *</label>
            <CustomSelect
              onChange={handleChange}
              value={formData.academicYear}
              options={[
                { value: "2024-2025", label: "2024-2025" },
                { value: "2025-2026", label: "2025-2026" },
                { value: "2026-2027", label: "2026-2027" },
              ]}
              name="academicYear"
              className="w-full text-xs sm:text-sm"
              triggerClassName="text-xs sm:text-sm"
            />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-surface-700 mb-1.5">Level</label>
            <input
              type="number"
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-xs sm:text-sm"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-surface-700 mb-1.5">Section(s)</label>
            <input
              type="text"
              name="section"
              value={formData.section}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-xs sm:text-sm"
              placeholder="A, B, C etc."
            />
            <p className="mt-1 text-[9px] text-surface-500 italic">Separate multiple sections with commas</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-semibold text-surface-700 mb-1.5">Building/Block</label>
            <input
              type="text"
              name="building"
              value={formData.building}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 text-xs sm:text-sm"
              placeholder="Main Building, Block A"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 text-xs sm:text-sm"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {classData ? 'Update Class' : 'Add Class'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-surface-200 px-4 py-2.5 font-semibold text-surface-700 hover:bg-surface-50 active:scale-[0.98] transition-all duration-200 text-center text-xs sm:text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
