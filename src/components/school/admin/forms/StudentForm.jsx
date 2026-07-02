import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function StudentForm({ student, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enrollmentNo: '',
    rollNo: '',
    dob: '',
    gender: 'MALE',
    primaryContact: 'father',
    fatherName: '',
    fatherPhone: '',
    motherName: '',
    motherPhone: '',
    parentPhone: '',
    parentEmail: '',
    sectionId: '',
    admissionDate: ''
  });
  const [sections, setSections] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (student) {
      const profile = student.studentProfile || {};
      const parents = student.parentDetails || {};
      const primaryContact = parents.primaryContact || 'father';
      setFormData({
        name: student.name || '',
        email: student.email || '',
        password: '',
        enrollmentNo: profile.enrollmentNo || '',
        rollNo: profile.rollNo || '',
        dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
        gender: profile.gender || 'MALE',
        primaryContact,
        fatherName: parents.fatherName || profile.fatherName || '',
        fatherPhone: parents.fatherPhone || (primaryContact === 'father' ? profile.parentPhone : '') || '',
        motherName: parents.motherName || profile.motherName || '',
        motherPhone: parents.motherPhone || (primaryContact === 'mother' ? profile.parentPhone : '') || '',
        parentPhone: profile.parentPhone || parents.whatsappNumber || parents.fatherPhone || parents.motherPhone || '',
        parentEmail: parents.email || profile.parentEmail || '',
        sectionId: profile.sectionId || '',
        admissionDate: profile.admissionDate ? new Date(profile.admissionDate).toISOString().split('T')[0] : ''
      });
    }
    fetchSections();
  }, [student]);

  const fetchSections = async () => {
    try {
      const res = await api.get('/academic/classes');
      const allSections = [];
      (Array.isArray(res.data) ? res.data : []).forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name });
        });
      });
      setSections(allSections);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Student name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!student && !formData.password.trim()) {
      setError('Password is required');
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col max-h-[70vh]">
      <div className="overflow-y-auto pr-2 space-y-4">
        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-4">
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
              placeholder="student@school.com"
            />
          </div>

          {!student && (
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
            <label className="block text-sm font-semibold text-surface-700 mb-2">Enrollment No.</label>
            <input
              type="text"
              name="enrollmentNo"
              value={formData.enrollmentNo}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="ENR001"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Roll No.</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="1"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Gender</label>
            <CustomSelect
              value={formData.gender}
              options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
              name="gender"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Class & Section</label>
            <CustomSelect
              value={formData.sectionId}
              options={[
              { value: "", label: "Select Section" },
              ...sections.map((section) => ({ value: section.id, label: `${section.className} - ${section.name}` })),
            ]}
              name="sectionId"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Admission Date</label>
            <input
              type="date"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="border-t border-surface-200 pt-4">
          <h3 className="font-semibold text-surface-950 mb-4">Parent Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Father's Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="Mother's Name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Father's Phone</label>
              <input
                type="tel"
                name="fatherPhone"
                value={formData.fatherPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Mother's Phone</label>
              <input
                type="tel"
                name="motherPhone"
                value={formData.motherPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Parent Phone</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Parent Email</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                placeholder="parent@email.com"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-surface-200 mt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {student ? 'Update Student' : 'Add Student'}
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
