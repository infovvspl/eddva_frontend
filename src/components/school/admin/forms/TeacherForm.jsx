import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';

export default function TeacherForm({ teacher, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    department: '',
    joiningDate: '',
    qualifications: '',
    subjectIds: [],
    sectionIds: []
  });
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        email: teacher.email || '',
        password: '', // Don't pre-fill password on edit
        employeeId: teacher.teacherProfile?.employeeId || '',
        department: teacher.teacherProfile?.department || '',
        joiningDate: teacher.teacherProfile?.joiningDate ? new Date(teacher.teacherProfile.joiningDate).toISOString().split('T')[0] : '',
        qualifications: teacher.teacherProfile?.qualifications || '',
        subjectIds: teacher.teacherProfile?.subjects?.map(s => s.id) || [],
        sectionIds: teacher.teacherProfile?.classSections?.map(s => s.id) || []
      });
    }
    fetchSubjects();
    fetchSections();
  }, [teacher]);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academic/classes');
      const all = [];
      (res.data || []).forEach(cls => {
        (cls.sections || []).forEach(sec => {
          all.push({ ...sec, className: cls.name });
        });
      });
      setSections(all);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/academic/subjects');
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(subjectId)
        ? prev.subjectIds.filter(id => id !== subjectId)
        : [...prev.subjectIds, subjectId]
    }));
  };

  const handleSectionToggle = (sectionId) => {
    setFormData(prev => ({
      ...prev,
      sectionIds: prev.sectionIds.includes(sectionId)
        ? prev.sectionIds.filter(id => id !== sectionId)
        : [...prev.sectionIds, sectionId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Teacher name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!teacher && !formData.password.trim()) {
      setError('Password is required');
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="teacher@school.com"
          />
        </div>

        {!teacher && (
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Employee ID</label>
          <input
            type="text"
            name="employeeId"
            value={formData.employeeId}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="EMP001"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="Science"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-2">Qualifications</label>
          <textarea
            name="qualifications"
            value={formData.qualifications}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="B.Sc., M.Ed., etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-3">Subjects</label>
          <div className="grid gap-2 md:grid-cols-2">
            {subjects.map(subject => (
              <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.subjectIds.includes(subject.id)}
                  onChange={() => handleSubjectToggle(subject.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{subject.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-surface-700 mb-3">Lead Sections (Class Teacher)</label>
          <div className="grid gap-2 md:grid-cols-2">
            {sections.map(section => (
              <label key={section.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sectionIds.includes(section.id)}
                  onChange={() => handleSectionToggle(section.id)}
                  className="h-4 w-4 rounded border-surface-300 accent-brand-600"
                />
                <span className="text-sm text-surface-700">{section.className} - {section.name}</span>
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
          {teacher ? 'Update Teacher' : 'Add Teacher'}
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
