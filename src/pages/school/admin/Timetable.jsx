import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Edit2, Trash2, MapPin, Users, Settings, AlertCircle } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import Modal from '@/components/school/admin/Modal';
import TimetableForm from '@/components/school/admin/forms/TimetableForm';
import { useConfirm } from '@/context/ConfirmContext';
import { handleApiError } from '@/lib/school/errorHandler';
import { useAuth } from '@/context/SchoolAuthContext';
import { PeriodSettings } from '@/pages/school/admin/AdminSettings';

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
  const [showPeriodsModal, setShowPeriodsModal] = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [activeDay, setActiveDay] = useState('MONDAY');
  const [now, setNow] = useState(() => new Date());

  const [sections, setSections] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allPeriods, setAllPeriods] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [gridDraft, setGridDraft] = useState({});
  const [bulkErrors, setBulkErrors] = useState([]);
  const [isCopyClassModalOpen, setIsCopyClassModalOpen] = useState(false);
  const [targetClassSectionId, setTargetClassSectionId] = useState('');

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
      
      const [res, secRes, subjRes, periodRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/academic/classes'),
        api.get('/academic/subjects?limit=1000'),
        api.get('/academic/periods')
      ]);

      setTimetables(getResponseList(res));

      const allSections = [];
      getResponseList(secRes).forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name, classId: cls.id });
        });
      });
      setSections(allSections);
      setAllSubjects(getResponseList(subjRes));
      setAllPeriods(getResponseList(periodRes));

      if (!isTeacher) {
        const teachersRes = await api.get('/teachers?limit=1000');
        setAllTeachers(getResponseList(teachersRes));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startBulkEdit = () => {
    const draft = {};
    timetables.forEach(slot => {
      if (String(slot.sectionId || slot.section?.id) === String(selectedSectionId)) {
        const key = `${slot.dayOfWeek}_${slot.periodId}`;
        draft[key] = {
          id: slot.id,
          subjectId: slot.subjectId || slot.subject?.id || '',
          teacherId: slot.teacherId || slot.teacher?.id || '',
          room: slot.room || '',
          type: slot.type || 'offline',
          meetingLink: slot.meetingLink || '',
          remarks: slot.remarks || '',
          periodId: slot.periodId,
          dayOfWeek: slot.dayOfWeek,
        };
      }
    });
    setGridDraft(draft);
    setBulkErrors([]);
    setIsBulkEditMode(true);
  };

  const getSlotForGrid = (day, periodId) => {
    if (isBulkEditMode) {
      return gridDraft[`${day}_${periodId}`];
    }
    return timetables.find(t => 
      String(t.sectionId || t.section?.id) === String(selectedSectionId) &&
      t.dayOfWeek === day &&
      String(t.periodId) === String(periodId)
    );
  };

  const handleCellChange = (day, periodId, field, value) => {
    const key = `${day}_${periodId}`;
    setGridDraft(prev => {
      const current = prev[key] || { dayOfWeek: day, periodId, type: 'offline' };
      const updated = { ...current, [field]: value };
      
      if (field === 'type' && value === 'break') {
        updated.subjectId = '';
        updated.teacherId = '';
        if (!updated.remarks) {
          updated.remarks = 'Break';
        }
      } else if (field === 'subjectId' && !value) {
        // If subject is cleared, clear teacher too
        updated.teacherId = '';
        updated.room = '';
        if (updated.type !== 'break') {
          updated.type = 'offline';
        }
      }

      return {
        ...prev,
        [key]: updated
      };
    });
  };

  const handleCopyDay = (fromDay, toDay) => {
    if (fromDay === toDay) return;
    setGridDraft(prev => {
      const updated = { ...prev };
      sortedPeriods.forEach(period => {
        const sourceKey = `${fromDay}_${period.id}`;
        const targetKey = `${toDay}_${period.id}`;
        const sourceSlot = prev[sourceKey];
        if (sourceSlot && ((sourceSlot.subjectId && sourceSlot.teacherId) || sourceSlot.type === 'break')) {
          updated[targetKey] = {
            ...sourceSlot,
            id: prev[targetKey]?.id || null,
            dayOfWeek: toDay,
            periodId: period.id
          };
        } else {
          updated[targetKey] = {
            dayOfWeek: toDay,
            periodId: period.id,
            subjectId: '',
            teacherId: '',
            room: '',
            type: 'offline',
            remarks: '',
            id: prev[targetKey]?.id || null
          };
        }
      });
      return updated;
    });
  };

  const handleBulkSave = async () => {
    setIsSubmitting(true);
    setBulkErrors([]);
    try {
      const slotsToSubmit = [];
      Object.keys(gridDraft).forEach(key => {
        const slot = gridDraft[key];
        const isBreak = slot?.type === 'break';
        if (slot && ((slot.subjectId && slot.teacherId) || isBreak)) {
          slotsToSubmit.push({
            id: slot.id || undefined,
            periodId: slot.periodId,
            dayOfWeek: slot.dayOfWeek,
            subjectId: isBreak ? null : slot.subjectId,
            teacherId: isBreak ? null : slot.teacherId,
            room: slot.room || null,
            type: slot.type || 'offline',
            meetingLink: isBreak ? null : (slot.meetingLink || null),
            remarks: slot.remarks || null
          });
        }
      });

      const res = await api.put('/timetable/bulk/update', {
        sectionId: selectedSectionId,
        slots: slotsToSubmit
      });

      if (res.data?.success) {
        setIsBulkEditMode(false);
        const updatedRes = await api.get('/timetable');
        setTimetables(getResponseList(updatedRes));
      } else if (res.data?.errors) {
        setBulkErrors(res.data.errors);
      } else {
        setBulkErrors([res.data?.message || 'An unknown error occurred while saving.']);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setBulkErrors([err.response.data.message]);
      } else {
        setBulkErrors(['Failed to save bulk updates. Please verify schedules and try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyClass = async () => {
    if (!targetClassSectionId) return;
    setIsSubmitting(true);
    setBulkErrors([]);
    try {
      const currentSlots = timetables.filter(t => 
        String(t.sectionId || t.section?.id) === String(selectedSectionId)
      );

      const slotsToSubmit = currentSlots.map(slot => ({
        periodId: slot.periodId,
        dayOfWeek: slot.dayOfWeek,
        subjectId: slot.subjectId || slot.subject?.id,
        teacherId: slot.teacherId || slot.teacher?.id,
        room: slot.room || null,
        type: slot.type || 'offline',
        meetingLink: slot.meetingLink || null,
        remarks: slot.remarks || null
      }));

      const res = await api.put('/timetable/bulk/update', {
        sectionId: targetClassSectionId,
        slots: slotsToSubmit
      });

      if (res.data?.success) {
        setIsCopyClassModalOpen(false);
        setTargetClassSectionId('');
        const updatedRes = await api.get('/timetable');
        setTimetables(getResponseList(updatedRes));
      } else if (res.data?.errors) {
        setBulkErrors(res.data.errors);
      } else {
        setBulkErrors([res.data?.message || 'An unknown error occurred while copying timetable.']);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setBulkErrors([err.response.data.message]);
      } else {
        setBulkErrors(['Failed to copy timetable to selected class.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e, day, periodId) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ day, periodId }));
  };

  const handleDrop = (e, targetDay, targetPeriodId) => {
    e.preventDefault();
    try {
      const source = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (!source || !source.day || !source.periodId) return;
      
      const sourceKey = `${source.day}_${source.periodId}`;
      const targetKey = `${targetDay}_${targetPeriodId}`;
      
      if (sourceKey === targetKey) return;

      setGridDraft(prev => {
        const sourceSlot = prev[sourceKey] || { dayOfWeek: source.day, periodId: source.periodId };
        const targetSlot = prev[targetKey] || { dayOfWeek: targetDay, periodId: targetPeriodId };

        const newSourceSlot = {
          ...targetSlot,
          id: sourceSlot.id || null,
          dayOfWeek: source.day,
          periodId: source.periodId
        };

        const newTargetSlot = {
          ...sourceSlot,
          id: targetSlot.id || null,
          dayOfWeek: targetDay,
          periodId: targetPeriodId
        };

        return {
          ...prev,
          [sourceKey]: newSourceSlot,
          [targetKey]: newTargetSlot
        };
      });
    } catch (err) {
      console.error('Failed to parse drag-drop payload:', err);
    }
  };

  const sortedPeriods = useMemo(() => {
    return [...allPeriods].sort((a, b) => {
      const aSeq = Number(a.sequenceNo || a.sequence_no || 0);
      const bSeq = Number(b.sequenceNo || b.sequence_no || 0);
      if (aSeq !== bSeq) return aSeq - bSeq;
      return String(a.startTime || '').localeCompare(String(b.startTime || ''));
    });
  }, [allPeriods]);

  const getSubjectsForSection = (sectionId) => {
    return allSubjects.filter(sub => String(sub.section_id || sub.sectionId || '') === String(sectionId));
  };

  const getTeachersForSubject = (sectionId, subjectId) => {
    const sec = sections.find(s => String(s.id) === String(sectionId));
    if (!sec || !subjectId) return [];
    const classId = sec.classId;
    return allTeachers.filter(t => {
      const assignments = t.teacherProfile?.assignments || [];
      return assignments.some(a => 
        String(a.classId) === String(classId) &&
        String(a.sectionId) === String(sectionId) &&
        String(a.subjectId) === String(subjectId)
      );
    });
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPeriodsModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 active:scale-[0.99]"
            >
              <Settings className="h-4 w-4" />
              Manage Periods
            </button>
            <button
              onClick={handleAddClick}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 active:scale-[0.99]"
            >
              <Plus className="h-5 w-5" />
              Add Slot
            </button>
          </div>
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

      {/* Class & Section Selection Grid Card */}
      {!isTeacher && (
        <div className="mb-8 rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Weekly Class Timetable</h2>
                <p className="text-xs font-semibold text-slate-500">Select a class section to view and edit schedule</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedSectionId}
                onChange={(e) => {
                  setSelectedSectionId(e.target.value);
                  setIsBulkEditMode(false);
                  setBulkErrors([]);
                }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-400 min-w-[200px]"
              >
                <option value="">Select Class & Section</option>
                {sections.map(sec => (
                  <option key={sec.id} value={sec.id}>
                    {sec.className} - {sec.name}
                  </option>
                ))}
              </select>

              {selectedSectionId && (
                <>
                  {!isBulkEditMode ? (
                    <button
                      onClick={startBulkEdit}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.99] transition"
                    >
                      <Edit2 className="h-4 w-4" />
                      Bulk Edit Timetable
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkSave}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white px-5 py-3 text-sm font-bold shadow-md hover:bg-emerald-500 disabled:opacity-50 active:scale-[0.99] transition"
                      >
                        Save All Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsBulkEditMode(false);
                          setBulkErrors([]);
                        }}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.99] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setIsCopyClassModalOpen(true)}
                    disabled={isBulkEditMode}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-5 py-3 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition"
                  >
                    Copy Class Timetable
                  </button>
                </>
              )}
            </div>
          </div>

          {bulkErrors.length > 0 && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-950/20">
              <div className="flex gap-2 text-red-800 dark:text-red-300 font-bold text-sm mb-2">
                <AlertCircle className="h-5 w-5 text-red-650" />
                Timetable Conflict(s) Detected
              </div>
              <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-400 space-y-1 pl-2">
                {bulkErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timetable Grid Render */}
          {selectedSectionId ? (
            <div className="mt-6">
              {/* Copy Day Row (visible in Bulk Edit Mode) */}
              {isBulkEditMode && (
                <div className="mb-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
                  <span className="text-xs font-black uppercase text-slate-500">Copy Day Schedule:</span>
                  <div className="flex items-center gap-2">
                    <select
                      id="copyFromDay"
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-250 outline-none"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <span className="text-xs text-slate-400">&rarr;</span>
                    <select
                      id="copyToDay"
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-250 outline-none"
                    >
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const from = document.getElementById('copyFromDay').value;
                        const to = document.getElementById('copyToDay').value;
                        handleCopyDay(from, to);
                      }}
                      className="bg-blue-600 text-white rounded-xl px-4 py-1.5 text-xs font-bold hover:bg-blue-500 transition active:scale-95"
                    >
                      Copy Day
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Note: Changes will only be persisted after clicking "Save All Changes". You can also Drag & Drop slots to swap periods.
                  </span>
                </div>
              )}

              {/* Grid Table */}
              <div className="overflow-x-auto w-full max-w-full rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850">
                      <th className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500 border-r border-slate-100 dark:border-slate-800 w-[120px]">
                        Day
                      </th>
                      {sortedPeriods.map(period => (
                        <th key={period.id} className="px-4 py-4 text-xs font-black uppercase tracking-wider text-slate-500 border-r border-slate-100 dark:border-slate-800 min-w-[200px]">
                          <div>{period.periodName || `Period ${period.sequenceNo}`}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{period.startTime} - {period.endTime}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {days.map(day => (
                      <tr key={day} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                        <td className="px-4 py-4 text-xs font-black uppercase text-slate-700 dark:text-slate-350 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                          {day}
                        </td>
                        {sortedPeriods.map(period => {
                          const slot = getSlotForGrid(day, period.id);
                          return (
                            <td
                              key={period.id}
                              className="px-3 py-3 border-r border-slate-100 dark:border-slate-800 align-top relative group"
                              onDragOver={(e) => { if (isBulkEditMode) e.preventDefault(); }}
                              onDrop={(e) => { if (isBulkEditMode) handleDrop(e, day, period.id); }}
                            >
                              {isBulkEditMode ? (
                                <div
                                  draggable={!!(slot?.subjectId && slot?.teacherId)}
                                  onDragStart={(e) => { if (isBulkEditMode) handleDragStart(e, day, period.id); }}
                                  className={`space-y-2 p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                    slot?.subjectId && slot?.teacherId
                                      ? 'border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/20'
                                      : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20'
                                  }`}
                                >
                                  {/* Type Dropdown */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Type</label>
                                    <select
                                      value={slot?.type || 'offline'}
                                      onChange={(e) => {
                                        const newType = e.target.value;
                                        handleCellChange(day, period.id, 'type', newType);
                                        if (newType === 'break') {
                                          handleCellChange(day, period.id, 'subjectId', '');
                                          handleCellChange(day, period.id, 'teacherId', '');
                                          if (!slot?.remarks) {
                                            handleCellChange(day, period.id, 'remarks', 'Break');
                                          }
                                        }
                                      }}
                                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none"
                                    >
                                      <option value="offline">Offline</option>
                                      <option value="live">Live</option>
                                      <option value="lab">Lab</option>
                                      <option value="extra">Extra</option>
                                      <option value="break">Break</option>
                                    </select>
                                  </div>

                                  {slot?.type === 'break' ? (
                                    <>
                                      {/* Remarks/Name input for Break */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Break Title</label>
                                        <input
                                          type="text"
                                          value={slot?.remarks || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'remarks', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="e.g. Lunch Break"
                                        />
                                      </div>
                                      {/* Room input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Room (Opt)</label>
                                        <input
                                          type="text"
                                          value={slot?.room || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'room', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="e.g. Playground"
                                        />
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      {/* Subject Dropdown */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Subject</label>
                                        <select
                                          value={slot?.subjectId || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'subjectId', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none"
                                        >
                                          <option value="">-- Clear --</option>
                                          {getSubjectsForSection(selectedSectionId).map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                              {sub.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Teacher Dropdown */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Teacher</label>
                                        <select
                                          value={slot?.teacherId || ''}
                                          disabled={!slot?.subjectId}
                                          onChange={(e) => handleCellChange(day, period.id, 'teacherId', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-750 dark:text-slate-205 outline-none disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-950"
                                        >
                                          <option value="">-- Select --</option>
                                          {getTeachersForSubject(selectedSectionId, slot?.subjectId).map(t => (
                                            <option key={t.teacherProfile?.id} value={t.teacherProfile?.id}>
                                              {t.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Room input */}
                                      <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Room</label>
                                        <input
                                          type="text"
                                          value={slot?.room || ''}
                                          onChange={(e) => handleCellChange(day, period.id, 'room', e.target.value)}
                                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold outline-none"
                                          placeholder="101"
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              ) : (
                                // Read-only view
                                slot ? (
                                  slot.type === 'break' ? (
                                    <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50/30 dark:border-amber-950/20 dark:bg-amber-950/10 flex flex-col justify-between h-full min-h-[90px] transition duration-200 hover:shadow-sm">
                                      <div>
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="text-xs font-black text-amber-900 dark:text-amber-300 line-clamp-1">
                                            {slot.remarks || 'Break'}
                                          </span>
                                          <span className="rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-350 px-1.5 py-0.5 text-[9px] font-black uppercase">
                                            BREAK
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-1">
                                          No Teacher
                                        </div>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                        <span>{slot.room ? `Room ${slot.room}` : 'No Room'}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                                          <button
                                            onClick={() => handleEditClick(slot)}
                                            className="text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded p-1"
                                            title="Edit Slot"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteClick(slot.id)}
                                            className="text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/40 rounded p-1"
                                            title="Delete Slot"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`p-2.5 rounded-xl border flex flex-col justify-between h-full min-h-[90px] transition duration-200 hover:shadow-sm ${
                                      slot.type === 'live'
                                        ? 'border-rose-100 bg-rose-50/30 dark:border-rose-950/20 dark:bg-rose-950/10'
                                        : slot.type === 'lab'
                                        ? 'border-purple-100 bg-purple-50/30 dark:border-purple-950/20 dark:bg-purple-950/10'
                                        : slot.type === 'extra'
                                        ? 'border-amber-100 bg-amber-50/30 dark:border-amber-950/20 dark:bg-amber-950/10'
                                        : 'border-blue-100 bg-blue-50/30 dark:border-blue-950/25 dark:bg-blue-950/10'
                                    }`}>
                                      <div>
                                        <div className="flex items-center justify-between gap-1.5">
                                          <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                                            {slot.subject?.name || allSubjects.find(s => s.id === slot.subjectId)?.name || 'Subject'}
                                          </span>
                                          <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                            slot.type === 'live'
                                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-350'
                                              : slot.type === 'lab'
                                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-350'
                                              : slot.type === 'extra'
                                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-350'
                                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-350'
                                          }`}>
                                            {slot.type || 'offline'}
                                          </span>
                                        </div>
                                        <div className="text-[11px] font-semibold text-slate-500 mt-1 line-clamp-1">
                                          {formatTeacherName(slot.teacher) || allTeachers.find(t => t.teacherProfile?.id === slot.teacherId)?.name || 'Teacher'}
                                        </div>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                        <span>{slot.room ? `Room ${slot.room}` : 'No Room'}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition flex gap-1">
                                          <button
                                            onClick={() => handleEditClick(slot)}
                                            className="text-slate-500 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded p-1"
                                            title="Edit Slot"
                                          >
                                            <Edit2 className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteClick(slot.id)}
                                            className="text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/40 rounded p-1"
                                            title="Delete Slot"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                ) : (period.periodType === 'Break' || (period.periodName && period.periodName.toLowerCase().includes('break'))) ? (
                                  <div className="h-full min-h-[90px] border border-amber-100 bg-amber-50/30 dark:border-amber-950/20 dark:bg-amber-950/10 rounded-xl flex flex-col items-center justify-center p-2.5">
                                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                                      {period.periodName || 'Break'}
                                    </span>
                                    <span className="text-[10px] text-amber-500 font-bold mt-1">
                                      {period.startTime} - {period.endTime}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[90px] border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center bg-slate-50/10 dark:bg-slate-900/10">
                                    <span className="text-[10px] font-bold text-slate-400">Empty</span>
                                  </div>
                                )
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50 dark:bg-slate-950">
              <Clock className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 animate-pulse" />
              <h3 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-350">Select a Class & Section</h3>
              <p className="mt-1 text-sm text-slate-400">Choose a class and section from the dropdown above to view or bulk-edit the weekly timetable.</p>
            </div>
          )}
        </div>
      )}

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
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                          isCurrentPeriod
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isCurrentPeriod ? 'Now' : slot.type || 'Offline'}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditClick(slot)}
                            className="rounded-lg border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                            title="Edit Slot"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(slot.id)}
                            className="rounded-lg border border-red-100 dark:border-rose-950/40 bg-white dark:bg-slate-900 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                            title="Delete Slot"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
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

      {!isTeacher && (
        <section className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-1 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">Daily Slots</p>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Scheduled Timetable Slots ({activeDay})</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              List of all timetable entries for the selected day.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedByDay[activeDay].length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-slate-50 dark:bg-slate-950">
                <Clock className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-700" />
                <h3 className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">No classes scheduled for {activeDay}</h3>
                <p className="mt-1 text-xs text-slate-400">Create a new slot using the button at the top.</p>
              </div>
            ) : (
              groupedByDay[activeDay].map((slot) => {
                const teacherName = formatTeacherName(slot.teacher) || 'Unnamed Teacher';
                const initials = teacherName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div
                    key={slot.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:shadow-md duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <span className="inline-flex rounded-lg bg-blue-50 dark:bg-slate-850 border border-blue-100 dark:border-slate-800 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-sky-300">
                          {slot.subject?.name || 'Subject'}
                        </span>
                        <div className="flex gap-1">
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
                            <span className="rounded bg-slate-50 dark:bg-slate-850 px-1.5 py-0.5">
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
        </section>
      )}

      <Modal isOpen={isModalOpen} title={selectedTimetable ? 'Edit Timetable Slot' : 'Add Timetable Slot'} onClose={() => setIsModalOpen(false)} size="lg">
        <TimetableForm timetable={selectedTimetable} onSubmit={handleSubmit} onCancel={() => setIsModalOpen(false)} isLoading={isSubmitting} />
      </Modal>

      <Modal isOpen={showPeriodsModal} title="Manage Periods" onClose={() => setShowPeriodsModal(false)} size="lg">
        <PeriodSettings />
      </Modal>

      <Modal isOpen={isCopyClassModalOpen} title="Copy Timetable to Class" onClose={() => { setIsCopyClassModalOpen(false); setTargetClassSectionId(''); }} size="md">
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Select the target Class & Section to copy the current timetable schedule to. Any existing slots in the target class will be deleted and overwritten.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Target Class & Section</label>
            <select
              value={targetClassSectionId}
              onChange={(e) => setTargetClassSectionId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 outline-none focus:border-blue-400 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select Target Class & Section</option>
              {sections.filter(sec => String(sec.id) !== String(selectedSectionId)).map(sec => (
                <option key={sec.id} value={sec.id}>
                  {sec.className} - {sec.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCopyClass}
              disabled={isSubmitting || !targetClassSectionId}
              className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md disabled:opacity-50 transition-all duration-200"
            >
              Copy Timetable
            </button>
            <button
              onClick={() => {
                setIsCopyClassModalOpen(false);
                setTargetClassSectionId('');
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
