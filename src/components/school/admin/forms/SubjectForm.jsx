import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function SubjectForm({ subject, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classIds: []
  });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        code: subject.code || '',
        classIds: subject.classes?.map(c => c.id) || []
      });
    }
    fetchClasses();
  }, [subject]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassToggle = (classId) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Subject name is required');
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
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="Mathematics"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="MATH-101"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-3">Assign to Classes</label>
          <div className="grid gap-2 md:grid-cols-2">
            {classes.map(cls => (
              <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.classIds.includes(cls.id)}
                  onChange={() => handleClassToggle(cls.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{cls.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {subject ? 'Update Subject' : 'Add Subject'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-surface-200 px-4 py-2 font-semibold text-surface-700 hover:bg-surface-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
