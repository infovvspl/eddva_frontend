import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import TimetableForm from '@/components/school/admin/forms/TimetableForm';

export default function Timetable() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => { fetchTimetables(); }, []);

  const fetchTimetables = async () => {
    try {
      const res = await api.get('/timetable');
      setTimetables(getResponseList(res));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => { setSelectedTimetable(null); setIsModalOpen(true); };
  const handleEditClick = (t) => { setSelectedTimetable(t); setIsModalOpen(true); };
  const handleDeleteClick = async (id) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      setTimetables((prev) => prev.filter((x) => x.id !== id));
    } catch (err) { alert('Failed to delete timetable entry'); }
  };

  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      if (selectedTimetable) {
        const res = await api.put(`/timetable/${selectedTimetable.id}`, formData);
        setTimetables((prev) => prev.map((p) => (p.id === selectedTimetable.id ? (res.data?.data ?? res.data) : p)));
      } else {
        const res = await api.post('/timetable', formData);
        setTimetables((prev) => [...prev, res.data?.data ?? res.data]);
      }
      setIsModalOpen(false);
      setSelectedTimetable(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save timetable');
    } finally { setIsSubmitting(false); }
  };

  const days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

  const formatTeacherName = (t) => {
    if (!t) return null;
    const u = t.user || {};
    if (u.name) return u.name;
    const parts = [u.firstName, u.lastName].filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  };

  const formatClassName = (s) => {
    if (!s) return null;
    if (s.className) return s.className;
    if (s.name) return s.name;
    return null;
  };

  const teachers = Array.from(new Set(timetables.map((t) => formatTeacherName(t.teacher)).filter(Boolean))).sort();
  const classes = Array.from(new Set(timetables.map((t) => formatClassName(t.section)).filter(Boolean))).sort();

  const groupedByDay = {};
  days.forEach((day) => {
    let dayTimetables = timetables.filter((t) => t.dayOfWeek === day);
    if (filterTeacher) dayTimetables = dayTimetables.filter((t) => formatTeacherName(t.teacher) === filterTeacher);
    if (filterClass) dayTimetables = dayTimetables.filter((t) => formatClassName(t.section) === filterClass);
    groupedByDay[day] = dayTimetables;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-surface-950">Timetable</h1>
          <p className="mt-2 text-sm text-surface-500">Manage class schedules and teacher assignments.</p>
        </div>
        <button onClick={handleAddClick} className="rounded-lg bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700">Add Slot</button>
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-surface-200 bg-white p-4 md:flex-row md:items-end md:gap-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-surface-700">Filter by Teacher</label>
          <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (<option key={teacher} value={teacher}>{teacher}</option>))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-surface-700">Filter by Class</label>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100">
            <option value="">All Classes</option>
            {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
          </select>
        </div>

        {(filterTeacher || filterClass) && (
          <button onClick={() => { setFilterTeacher(''); setFilterClass(''); }} className="text-sm font-semibold text-brand-600 hover:text-brand-700">Clear Filters</button>
        )}
      </div>

      <div className="grid gap-6">
        {days.map((day) => (
          <div key={day} className="rounded-lg border border-surface-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-surface-950">{day.replace('_', ' ')}</h2>
            {groupedByDay[day].length === 0 ? (
              <p className="text-sm text-surface-500">No classes scheduled</p>
            ) : (
              <div className="space-y-3">
                {groupedByDay[day].map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-md bg-surface-50 p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-surface-950">{slot.subject?.name} ({slot.startTime} - {slot.endTime})</p>
                      <p className="text-sm text-surface-500">{formatClassName(slot.section)}{slot.section?.name ? ` - ${slot.section?.name}` : ''} | {formatTeacherName(slot.teacher)} | Room: {slot.room || 'N/A'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(slot)} className="rounded p-1 text-surface-500 hover:bg-surface-200 hover:text-brand-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteClick(slot.id)} className="rounded p-1 text-surface-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} title={selectedTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'} onClose={() => setIsModalOpen(false)} size="lg">
        <TimetableForm timetable={selectedTimetable} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isLoading={isSubmitting} />
      </Modal>
    </div>
  );
}
