import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function AttendanceForm({ attendance, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT',
    remarks: ''
  });
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (attendance) {
      setFormData({
        studentId: attendance.studentId || '',
        date: attendance.date ? new Date(attendance.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: attendance.status || 'PRESENT',
        remarks: attendance.remarks || ''
      });
    }
    fetchStudents();
  }, [attendance]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(getResponseList(res));
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

    if (!formData.studentId) {
      setError('Please select a student');
      return;
    }

    await onSubmit({ ...formData, userId: formData.studentId });
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
            <label className="block text-sm font-semibold text-surface-700 mb-2">Student *</label>
            <CustomSelect
              value={formData.studentId}
              options={[
              { value: "", label: "Select Student" },
              ...students.map((student) => ({ value: student.id, label: student.name })),
            ]}
              name="studentId"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Status</label>
            <CustomSelect
              value={formData.status}
              options={[
              { value: "PRESENT", label: "Present" },
              { value: "ABSENT", label: "Absent" },
              { value: "LATE", label: "Late" },
              { value: "LEAVE", label: "Leave" },
            ]}
              name="status"
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-2">Remarks</label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            rows="3"
            className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            placeholder="Any remarks..."
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {attendance ? 'Update Attendance' : 'Mark Attendance'}
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
