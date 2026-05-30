import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Eye } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import AttendanceForm from '@/components/school/admin/forms/AttendanceForm';

export default function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('daily');
  const [teacherName, setTeacherName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentClassId, setStudentClassId] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [filterDate, filterType]);

  const fetchAttendance = async () => {
    try {
      let params = {};
      if (filterType === 'daily') {
        params.date = filterDate;
      } else if (filterType === 'weekly') {
        const startDate = new Date(filterDate);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        params.startDate = startDate.toISOString().split('T')[0];
        params.endDate = filterDate;
      } else if (filterType === 'monthly') {
        const date = new Date(filterDate);
        params.startDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
        params.endDate = filterDate;
      }
      const res = await api.get('/attendance', { params });
      setAttendance(getResponseList(res));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedAttendance(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (record) => {
    setSelectedAttendance(record);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      try {
        setAttendance(attendance.filter(a => a.id !== id));
      } catch (error) {
        alert('Failed to delete attendance record');
      }
    }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/attendance', formData);
      await fetchAttendance();
      setIsModalOpen(false);
      setSelectedAttendance(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    PRESENT: 'bg-emerald-50 text-emerald-700',
    ABSENT: 'bg-red-50 text-red-700',
    LATE: 'bg-amber-50 text-amber-700',
    LEAVE: 'bg-blue-50 text-blue-700'
  };

  const classOptions = useMemo(() => {
    const classes = attendance
      .map((record) => record.user?.studentProfile?.section?.class)
      .filter(Boolean);
    const uniqueClasses = new Map();
    classes.forEach((classItem) => {
      uniqueClasses.set(classItem.id, classItem);
    });
    return Array.from(uniqueClasses.values());
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const name = record.user?.name || '';
      const role = record.user?.role;
      const classId = record.user?.studentProfile?.section?.class?.id;

      const matchesTeacher = !teacherName || (role === 'TEACHER' && name.toLowerCase().includes(teacherName.toLowerCase()));
      const matchesStudentName = !studentName || (role === 'STUDENT' && name.toLowerCase().includes(studentName.toLowerCase()));
      const matchesStudentClass = !studentClassId || (role === 'STUDENT' && classId === studentClassId);

      return matchesTeacher && matchesStudentName && matchesStudentClass;
    });
  }, [attendance, teacherName, studentName, studentClassId]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-surface-950">Attendance</h1>
          <p className="mt-2 text-sm text-surface-500">Track student and teacher attendance.</p>
        </div>
        <button 
          onClick={handleAddClick}
          className="rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
        >
          Mark Attendance
        </button>
      </div>

      <div className="mb-6 rounded-lg border border-surface-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Type</label>
            <div className="flex items-center gap-2">
              {[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'monthly', label: 'Monthly' }].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilterType(option.value)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                    filterType === option.value ? 'bg-brand-600 text-white' : 'border border-surface-200 text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Teacher</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="Teacher"
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Student</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Student"
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-surface-700">Class</label>
            <select
              value={studentClassId}
              onChange={(e) => setStudentClassId(e.target.value)}
              className="rounded-lg border border-surface-200 px-3 py-1 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All</option>
              {classOptions.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <button
              onClick={() => { setTeacherName(''); setStudentName(''); setStudentClassId(''); setFilterType('daily'); }}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-surface-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-50 text-surface-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Remarks</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {filteredAttendance.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-surface-500">
                  No attendance records match the current filters
                </td>
              </tr>
            ) : (
              filteredAttendance.map(record => (
                <tr key={record.id}>
                  <td className="px-6 py-4 font-semibold text-surface-950">{record.user?.name || '-'}</td>
                  <td className="px-6 py-4">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${statusColors[record.status] || statusColors.PRESENT}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-surface-600">
                    {record.user?.role === 'STUDENT' && record.user?.studentProfile?.section?.class ? (
                      <span>
                        {record.user.studentProfile.section.class.name}
                        {record.user.studentProfile.section.name ? ` - ${record.user.studentProfile.section.name}` : ''}
                      </span>
                    ) : (
                      record.remarks || '-'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {record.user?.id ? (
                        <Link
                          to={record.user.role === 'STUDENT' ? `/admin/students/${record.user.id}` : `/admin/teachers/${record.user.id}`}
                          className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 rounded bg-surface-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">View</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-surface-50 text-surface-300"
                          aria-label="No linked user"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(record)}
                        className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition-all hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 rounded bg-surface-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(record.id)}
                        className="group relative flex h-8 w-8 items-center justify-center rounded-lg border border-surface-200 bg-white text-surface-500 transition-all hover:border-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 rounded bg-surface-900 px-2 py-1 text-[10px] font-bold text-white transition-all group-hover:scale-100">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen}
        title={selectedAttendance ? 'Edit Attendance' : 'Mark Attendance'}
        onClose={() => setIsModalOpen(false)}
        size="md"
      >
        <AttendanceForm 
          attendance={selectedAttendance}
          onSubmit={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>
    </div>
  );
}

