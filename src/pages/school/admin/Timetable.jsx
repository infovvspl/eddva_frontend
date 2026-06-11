import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import TimetableForm from '@/components/school/admin/forms/TimetableForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { useAuth } from '@/context/SchoolAuthContext';

export default function Timetable() {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const [timetables, setTimetables] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [activeDay, setActiveDay] = useState('MONDAY');

  const confirm = useConfirm();

  useEffect(() => { fetchTimetables(); }, []);

  const fetchTimetables = async () => {
    try {
      if (isTeacher) {
        const pRes = await api.get(`/teachers/${user.id}`);
        setTeacherProfile(pRes.data?.data?.teacherProfile);
      }
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
    const ok = await confirm({
      title: 'Delete Timetable Slot',
      message: 'Are you sure you want to delete this timetable entry?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });
    if (!ok) return;
    try {
      await api.delete(`/timetable/${id}`);
      setTimetables((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      handleApiError(err, 'Failed to delete timetable entry');
    }
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
      handleApiError(err, 'Failed to save timetable');
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

  const validSectionIds = isTeacher && teacherProfile ? new Set((teacherProfile.assignments || []).map(a => String(a.sectionId))) : null;

  const groupedByDay = {};
  days.forEach((day) => {
    let dayTimetables = timetables.filter((t) => t.dayOfWeek === day);
    if (isTeacher && validSectionIds) {
      dayTimetables = dayTimetables.filter(t => validSectionIds.has(String(t.sectionId)));
    }
    if (filterTeacher) dayTimetables = dayTimetables.filter((t) => formatTeacherName(t.teacher) === filterTeacher);
    if (filterClass) dayTimetables = dayTimetables.filter((t) => formatClassName(t.section) === filterClass);
    groupedByDay[day] = dayTimetables;
  });

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-4 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">Timetable</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage class schedules and teacher assignments.</p>
        </div>
        <button
          onClick={handleAddClick}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
        >
          <Plus className="h-5 w-5" />
          Add Slot
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Classes</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{timetables.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Teachers</p>
          <p className="text-2xl font-black text-blue-600">{teachers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Offline</p>
          <p className="text-2xl font-black text-emerald-600">{timetables.filter(t => t.type === 'offline').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Live</p>
          <p className="text-2xl font-black text-rose-600">{timetables.filter(t => t.type === 'live').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Lab Sessions</p>
          <p className="text-2xl font-black text-purple-600">{timetables.filter(t => t.type === 'lab').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Extra Classes</p>
          <p className="text-2xl font-black text-amber-600">{timetables.filter(t => t.type === 'extra').length}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:flex-row md:items-end shadow-sm">
        <div className="flex-1">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter by Teacher</label>
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
          >
            <option value="">All Teachers</option>
            {teachers.map((teacher) => (<option key={teacher} value={teacher}>{teacher}</option>))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter by Class</label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
          </select>
        </div>

        {(filterTeacher || filterClass) && (
          <button
            onClick={() => { setFilterTeacher(''); setFilterClass(''); }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className="mb-6 flex overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-1 min-w-[100px] text-center rounded-xl py-3 text-xs font-bold tracking-wider uppercase transition ${
              activeDay === day
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {day.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groupedByDay[activeDay].length === 0 ? (
          <div className="col-span-full rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-white dark:bg-slate-900">
            <Clock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled</h3>
            <p className="mt-1 text-xs text-slate-400">Enjoy your day or schedule a new slot above!</p>
          </div>
        ) : (
          groupedByDay[activeDay].map((slot) => {
            const teacherName = formatTeacherName(slot.teacher) || 'Unnamed Teacher';
            const initials = teacherName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div
                key={slot.id}
                className="relative overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition hover:shadow-md hover:scale-[1.01] duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex rounded-lg bg-blue-50 dark:bg-slate-850 border border-blue-100 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-sky-300">
                      {slot.subject?.name || 'Subject'}
                    </span>
                    <div className="flex gap-1">
                      {(!isTeacher || (slot.teacher?.user?.id === user?.id)) && (
                        <>
                          <button
                            onClick={() => handleEditClick(slot)}
                            className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(slot.id)}
                            className="rounded-lg border border-red-100 dark:border-rose-950/40 bg-white dark:bg-slate-900 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-950 dark:text-white mt-3">
                    {formatClassName(slot.section)}{slot.section?.name ? ` - ${slot.section?.name}` : ''}
                  </h3>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-850 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-350">
                      {initials}
                    </div>
                    <span className="text-xs font-semibold text-slate-650 dark:text-slate-400">{teacherName}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-450">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      {slot.periodName || `Period ${slot.periodNumber || 1}`} • {slot.startTime} - {slot.endTime}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 uppercase">
                        {slot.type || 'OFFLINE'}
                      </span>
                      {slot.room && (
                        <span className="rounded bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5">
                          Room {slot.room}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal isOpen={isModalOpen} title={selectedTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'} onClose={() => setIsModalOpen(false)} size="lg">
        <TimetableForm timetable={selectedTimetable} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isLoading={isSubmitting} />
      </Modal>
    </div>
  );
}
