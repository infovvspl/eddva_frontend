import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Edit2, Trash2, MapPin, Users } from 'lucide-react';
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
  const [allTeachers, setAllTeachers] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [activeDay, setActiveDay] = useState('MONDAY');
  const [now, setNow] = useState(() => new Date());

  const confirm = useConfirm();

  useEffect(() => { fetchTimetables(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { setFilterPeriod(''); }, [activeDay]);

  const fetchTimetables = async () => {
    try {
      if (isTeacher) {
        const pRes = await api.get(`/teachers/${user.id}`);
        setTeacherProfile(pRes.data?.data?.teacherProfile);
      }
      const res = await api.get('/timetable');
      setTimetables(getResponseList(res));
      if (!isTeacher) {
        const teachersRes = await api.get('/teachers?limit=500');
        setAllTeachers(getResponseList(teachersRes));
      }
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
  const dayNames = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

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

  const assignmentClassName = (assignment) => {
    if (!assignment) return null;
    return assignment.className || assignment.class?.name || assignment.section?.className || assignment.section?.class?.name || null;
  };

  const getTeacherName = (teacher) => {
    if (!teacher) return null;
    return teacher.name || formatTeacherName(teacher) || formatTeacherName(teacher.teacher) || null;
  };

  const getTeacherKey = (teacher) => {
    if (!teacher) return null;
    return String(teacher.teacherProfile?.id || teacher.teacherId || teacher.id || teacher.teacher?.id || teacher.user?.id || '');
  };

  const getSlotTeacherKey = (slot) => String(slot.teacherId || slot.teacher?.id || slot.teacher?.teacherProfile?.id || slot.teacher?.user?.id || '');

  const getPeriodKey = (slot) => String(slot.periodId || slot.periodNumber || `${slot.startTime}-${slot.endTime}`);

  const normalize = (value) => String(value || '').toLowerCase().replace(/\s+/g, '');

  const isClass10SectionA = (slot) => {
    const className = normalize(slot.section?.className || slot.section?.class?.name);
    const sectionName = normalize(slot.section?.name);
    return className === 'class10' && (sectionName === 'sectiona' || sectionName === 'a');
  };

  const minutesFromTime = (time) => {
    const [hours = '0', minutes = '0'] = String(time || '00:00').split(':');
    return Number(hours) * 60 + Number(minutes);
  };

  const currentDay = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isCurrentTeacherSlot = (slot) => {
    if (!isTeacher) return true;
    const teacherProfileId = teacherProfile?.id;
    return (
      (teacherProfileId && String(slot.teacherId || '') === String(teacherProfileId)) ||
      (teacherProfileId && String(slot.teacher?.id || '') === String(teacherProfileId)) ||
      (teacherProfileId && String(slot.teacher?.teacherProfile?.id || '') === String(teacherProfileId)) ||
      (user?.id && String(slot.teacher?.user?.id || '') === String(user.id))
    );
  };

  const visibleTimetables = useMemo(
    () => (isTeacher ? timetables.filter(isCurrentTeacherSlot) : timetables),
    [isTeacher, timetables, teacherProfile, user?.id]
  );

  const timetableTeachers = useMemo(() => {
    const map = new Map();
    visibleTimetables.forEach((slot) => {
      const key = getSlotTeacherKey(slot);
      const name = formatTeacherName(slot.teacher);
      if (key && name && !map.has(key)) map.set(key, { id: key, name });
    });
    return Array.from(map.values());
  }, [visibleTimetables]);

  const schoolTeachers = useMemo(() => {
    const source = allTeachers.length ? allTeachers : timetableTeachers;
    const map = new Map();
    source.forEach((teacher) => {
      const key = getTeacherKey(teacher);
      const name = getTeacherName(teacher);
      if (key && name && !map.has(key)) {
        map.set(key, {
          id: key,
          name,
          profileId: teacher.teacherProfile?.id,
          userId: teacher.id,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allTeachers, timetableTeachers]);

  const teachers = schoolTeachers.map((teacher) => teacher.name);
  const assignedClasses = Array.from(
    new Set((teacherProfile?.assignments || []).map(assignmentClassName).filter(Boolean))
  ).sort();
  const timetableClasses = Array.from(new Set(visibleTimetables.map((t) => formatClassName(t.section)).filter(Boolean))).sort();
  const classes = isTeacher && assignedClasses.length ? assignedClasses : timetableClasses;
  const subjects = Array.from(new Set(visibleTimetables.map((t) => t.subject?.name).filter(Boolean))).sort();
  const types = Array.from(new Set(visibleTimetables.map((t) => t.type || 'offline').filter(Boolean))).sort();
  const periodOptions = useMemo(() => {
    const map = new Map();
    visibleTimetables
      .filter((slot) => slot.dayOfWeek === activeDay)
      .forEach((slot) => {
        const key = getPeriodKey(slot);
        if (!map.has(key)) {
          map.set(key, {
            key,
            periodNumber: slot.periodNumber,
            label: `${slot.periodName || `Period ${slot.periodNumber || map.size + 1}`} (${slot.startTime} - ${slot.endTime})`,
            startTime: slot.startTime,
          });
        }
      });
    return Array.from(map.values()).sort((a, b) => {
      const aPeriod = Number(a.periodNumber || 999);
      const bPeriod = Number(b.periodNumber || 999);
      if (aPeriod !== bPeriod) return aPeriod - bPeriod;
      return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
    });
  }, [activeDay, visibleTimetables]);

  const validSectionIds = isTeacher && teacherProfile ? new Set((teacherProfile.assignments || []).map(a => String(a.sectionId))) : null;

  const class10AStatus = useMemo(() => {
    const slots = visibleTimetables
      .filter(isClass10SectionA)
      .sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
        return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
      });

    const teacherMap = new Map();
    slots.forEach((slot) => {
      const teacherName = formatTeacherName(slot.teacher) || 'Unassigned Teacher';
      const teacherKey = slot.teacherId || slot.teacher?.id || teacherName;
      const start = minutesFromTime(slot.startTime);
      const end = minutesFromTime(slot.endTime);
      const isToday = slot.dayOfWeek === currentDay;
      const isActive = isToday && currentMinutes >= start && currentMinutes < end;
      const existing = teacherMap.get(teacherKey) || {
        key: teacherKey,
        teacherName,
        activeSlot: null,
        nextSlot: null,
        totalSlots: 0,
      };

      existing.totalSlots += 1;
      if (isActive) {
        existing.activeSlot = slot;
      }
      if (isToday && start >= currentMinutes && (!existing.nextSlot || start < minutesFromTime(existing.nextSlot.startTime))) {
        existing.nextSlot = slot;
      }
      teacherMap.set(teacherKey, existing);
    });

    return {
      slots,
      teachers: Array.from(teacherMap.values()),
      activeCount: Array.from(teacherMap.values()).filter((item) => item.activeSlot).length,
    };
  }, [visibleTimetables, currentDay, currentMinutes]);

  const periodWiseStatus = useMemo(() => {
    const daySlots = visibleTimetables.filter((slot) => slot.dayOfWeek === activeDay);
    const periods = new Map();

    daySlots.forEach((slot) => {
      const periodKey = getPeriodKey(slot);
      if (filterPeriod && String(periodKey) !== String(filterPeriod)) return;
      const existing = periods.get(periodKey) || {
        key: String(periodKey),
        periodNumber: slot.periodNumber,
        periodName: slot.periodName || `Period ${slot.periodNumber || periods.size + 1}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slots: [],
      };
      existing.slots.push(slot);
      if (minutesFromTime(slot.startTime) < minutesFromTime(existing.startTime)) existing.startTime = slot.startTime;
      if (minutesFromTime(slot.endTime) > minutesFromTime(existing.endTime)) existing.endTime = slot.endTime;
      periods.set(periodKey, existing);
    });

    const slotMatchesFilters = (slot) => {
      if (filterTeacher && formatTeacherName(slot.teacher) !== filterTeacher) return false;
      if (filterClass && formatClassName(slot.section) !== filterClass) return false;
      if (filterType && (slot.type || 'offline') !== filterType) return false;
      if (filterSubject && slot.subject?.name !== filterSubject) return false;
      return true;
    };

    return Array.from(periods.values())
      .sort((a, b) => {
        const aPeriod = Number(a.periodNumber || 999);
        const bPeriod = Number(b.periodNumber || 999);
        if (aPeriod !== bPeriod) return aPeriod - bPeriod;
        return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
      })
      .map((period) => {
        const engagedKeys = new Set(period.slots.map(getSlotTeacherKey).filter(Boolean));
        const engaged = period.slots
          .filter((slot) => getSlotTeacherKey(slot))
          .filter(slotMatchesFilters)
          .map((slot) => ({
            key: `${slot.id}-${getSlotTeacherKey(slot)}`,
            teacherName: formatTeacherName(slot.teacher) || 'Unnamed Teacher',
            className: formatClassName(slot.section) || 'Class',
            sectionName: slot.section?.name || '',
            subjectName: slot.subject?.name || 'Subject',
            room: slot.room || '',
            type: slot.type || 'offline',
          }));
        const idle = schoolTeachers
          .filter((teacher) => !engagedKeys.has(String(teacher.id)))
          .filter((teacher) => !filterTeacher || teacher.name === filterTeacher);
        const start = minutesFromTime(period.startTime);
        const end = minutesFromTime(period.endTime);
        const isCurrentPeriod = activeDay === currentDay && currentMinutes >= start && currentMinutes < end;
        return { ...period, engaged, idle, isCurrentPeriod };
      })
      .filter((period) => {
        if (filterStatus === 'engaged') return period.engaged.length > 0;
        if (filterStatus === 'idle') return period.idle.length > 0;
        if (filterTeacher || filterClass || filterType || filterSubject) {
          return period.engaged.length > 0 || period.idle.length > 0;
        }
        return true;
      });
  }, [activeDay, currentDay, currentMinutes, filterClass, filterPeriod, filterStatus, filterSubject, filterTeacher, filterType, schoolTeachers, visibleTimetables]);

  const groupedByDay = {};
  days.forEach((day) => {
    let dayTimetables = visibleTimetables.filter((t) => t.dayOfWeek === day);
    if (!isTeacher && filterTeacher) dayTimetables = dayTimetables.filter((t) => formatTeacherName(t.teacher) === filterTeacher);
    if (filterClass) dayTimetables = dayTimetables.filter((t) => formatClassName(t.section) === filterClass);
    groupedByDay[day] = dayTimetables.sort((a, b) => {
      const aPeriod = Number(a.periodNumber || 999);
      const bPeriod = Number(b.periodNumber || 999);
      if (aPeriod !== bPeriod) return aPeriod - bPeriod;
      return minutesFromTime(a.startTime) - minutesFromTime(b.startTime);
    });
  });

  if (loading) return <div className="p-8 text-sm font-semibold text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="w-full px-3 sm:px-5 lg:px-8 xl:px-10 dark:bg-slate-950 min-h-screen">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">Timetable</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage class schedules and teacher assignments.</p>
        </div>
        {!isTeacher && (
          <button
            onClick={handleAddClick}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            <Plus className="h-5 w-5" />
            Add Slot
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Classes</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{visibleTimetables.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Teachers</p>
          <p className="text-2xl font-black text-blue-600">{teachers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Offline</p>
          <p className="text-2xl font-black text-emerald-600">{visibleTimetables.filter(t => t.type === 'offline').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Live</p>
          <p className="text-2xl font-black text-rose-600">{visibleTimetables.filter(t => t.type === 'live').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Lab Sessions</p>
          <p className="text-2xl font-black text-purple-600">{visibleTimetables.filter(t => t.type === 'lab').length}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-slate-500 uppercase">Extra Classes</p>
          <p className="text-2xl font-black text-amber-600">{visibleTimetables.filter(t => t.type === 'extra').length}</p>
        </div>
      </div>

      {isTeacher && (
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">My Week</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Teaching Schedule</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Your assigned classes grouped period-wise for each day.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right dark:bg-slate-850">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{currentDay}</p>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto w-full max-w-full">
            <div className="flex min-w-max gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-wider transition ${
                    activeDay === day
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-slate-500 hover:bg-white hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {groupedByDay[activeDay].length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center dark:border-slate-800 dark:bg-slate-950">
                <Clock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled for {activeDay}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-400">Your assigned timetable slots will appear here.</p>
              </div>
            ) : (
              groupedByDay[activeDay].map((slot) => {
                const isCurrentPeriod = slot.dayOfWeek === currentDay
                  && currentMinutes >= minutesFromTime(slot.startTime)
                  && currentMinutes < minutesFromTime(slot.endTime);

                return (
                  <article
                    key={slot.id}
                    className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                      isCurrentPeriod
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                        {slot.periodName || `Period ${slot.periodNumber || '-'}`}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                        isCurrentPeriod
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {isCurrentPeriod ? 'Now' : slot.type || 'Offline'}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950 dark:text-white">
                      {formatClassName(slot.section) || 'Class'}{slot.section?.name ? ` - ${slot.section.name}` : ''}
                    </h3>
                    <p className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">{slot.subject?.name || 'Subject'}</p>

                    <div className="mt-4 grid gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                      <span className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        {slot.room ? `Room ${slot.room}` : 'Room not assigned'}
                      </span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {!isTeacher && (
        <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Live Teacher Status</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Class 10 - Section A</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Shows who is teaching now and who is free in the staff room.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Now</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {currentDay} {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
              </p>
            </div>
          </div>

          {class10AStatus.teachers.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No timetable slots found for Class 10 - Section A. Add a slot for this section to start tracking teacher status.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
              {class10AStatus.teachers.map((item) => {
                const activeSlot = item.activeSlot;
                const nextSlot = item.nextSlot;
                const isEngaged = Boolean(activeSlot);
                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl border p-4 ${
                      isEngaged
                        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          isEngaged ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-blue-600 dark:bg-slate-900'
                        }`}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">{item.teacherName}</p>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.totalSlots} Class 10 A slot{item.totalSlots === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                        isEngaged
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                      }`}>
                        {isEngaged ? 'Engaged' : 'Free'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-350">
                      {isEngaged ? (
                        <>
                          <p>{activeSlot.subject?.name || 'Subject'} - {activeSlot.startTime} to {activeSlot.endTime}</p>
                          <p className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {activeSlot.room ? `Classroom ${activeSlot.room}` : 'Class 10 - Section A'}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            Staff Room
                          </p>
                          <p>
                            {nextSlot
                              ? `Next: ${nextSlot.subject?.name || 'Subject'} at ${nextSlot.startTime}`
                              : 'No more Class 10 A periods today'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!isTeacher && (
        <div className="mb-6 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Period-wise Teacher Map</p>
              <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">{activeDay} timetable status</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Each period shows which teachers are in class and which teachers are idle in the staff room.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-850 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Teachers</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{schoolTeachers.length} total</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Day</label>
              <select
                value={activeDay}
                onChange={(e) => setActiveDay(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                {days.map((day) => (<option key={day} value={day}>{day}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Period</label>
              <select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Periods</option>
                {periodOptions.map((period) => (<option key={period.key} value={period.key}>{period.label}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Teacher</label>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Teachers</option>
                {teachers.map((teacher) => (<option key={teacher} value={teacher}>{teacher}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Class</label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (<option key={cls} value={cls}>{cls}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject) => (<option key={subject} value={subject}>{subject}</option>))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">Engaged + Idle</option>
                <option value="engaged">Engaged Only</option>
                <option value="idle">Idle Only</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400"
              >
                <option value="">All Types</option>
                {types.map((type) => (<option key={type} value={type}>{type.toUpperCase()}</option>))}
              </select>
            </div>
          </div>

          {(filterPeriod || filterTeacher || filterClass || filterSubject || filterStatus || filterType) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setFilterPeriod('');
                  setFilterTeacher('');
                  setFilterClass('');
                  setFilterSubject('');
                  setFilterStatus('');
                  setFilterType('');
                }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Clear Map Filters
              </button>
            </div>
          )}

          {periodWiseStatus.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-5 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No periods are created for {activeDay}. Add timetable slots to see engaged and idle teachers.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto w-full max-w-full rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="min-w-[1000px]">
                <div className="hidden md:grid grid-cols-12 bg-slate-50 dark:bg-slate-850 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500">
                  <div className="col-span-2">Period</div>
                  <div className="col-span-5">Engaged in Class</div>
                  <div className="col-span-5">Idle / Staff Room</div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {periodWiseStatus.map((period) => (
                    <div
                      key={period.key}
                      className={`grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-12 md:gap-3 ${
                        period.isCurrentPeriod ? 'bg-emerald-50/80 dark:bg-emerald-950/20' : 'bg-white dark:bg-slate-900'
                      }`}
                    >
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                          period.isCurrentPeriod ? 'bg-emerald-600 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        }`}>
                          {period.periodNumber || '-'}
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-950 dark:text-white">{period.periodName}</p>
                          <p className="text-xs font-semibold text-slate-500">{period.startTime} - {period.endTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 md:hidden">Engaged in Class</p>
                      {period.engaged.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 dark:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-500">
                          No teacher assigned in this period
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {period.engaged.map((item) => (
                            <div key={item.key} className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                              <p className="text-sm font-black text-slate-950 dark:text-white">{item.teacherName}</p>
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-350">
                                {item.className}{item.sectionName ? ` - ${item.sectionName}` : ''} - {item.subjectName}
                                {item.room ? ` - Room ${item.room}` : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-5">
                      <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400 md:hidden">Idle / Staff Room</p>
                      {period.idle.length === 0 ? (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                          All teachers are engaged in this period
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {period.idle.map((teacher) => (
                            <span
                              key={`${period.key}-${teacher.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:border-blue-950/50 dark:bg-blue-950/30 dark:text-blue-300"
                            >
                              <MapPin className="h-3 w-3" />
                              {teacher.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {false && (
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
                      {(!isTeacher || isCurrentTeacherSlot(slot)) && (
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
      )}

      <Modal isOpen={isModalOpen} title={selectedTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'} onClose={() => setIsModalOpen(false)} size="lg">
        <TimetableForm timetable={selectedTimetable} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isLoading={isSubmitting} />
      </Modal>
    </div>
  );
}
