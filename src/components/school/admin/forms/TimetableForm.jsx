import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api/school-client';
import { getResponseList } from '@/lib/school/apiData';
import { useAuth } from '@/context/SchoolAuthContext';
import { normalizeSubjectName } from '@/lib/utils';

export default function TimetableForm({ timetable, onSubmit, onCancel, isLoading }) {
  const { user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const [formData, setFormData] = useState({
    sectionId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    subjectId: '',
    teacherId: '',
    type: 'offline',
    room: '',
    meetingLink: '',
    periodId: '',
    periodNumber: '1',
    remarks: ''
  });
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (timetable) {
      setFormData({
        sectionId: timetable.sectionId || '',
        dayOfWeek: timetable.dayOfWeek || 'MONDAY',
        startTime: timetable.startTime || '09:00',
        endTime: timetable.endTime || '10:00',
        subjectId: timetable.subjectId || '',
        teacherId: timetable.teacherId || '',
        type: timetable.type || 'offline',
        room: timetable.room || '',
        meetingLink: timetable.meetingLink || '',
        periodId: timetable.periodId || '',
        periodNumber: timetable.periodNumber ? String(timetable.periodNumber) : '1',
        remarks: timetable.remarks || ''
      });
    }
    fetchData();
  }, [timetable]);

  const fetchData = async () => {
    try {
      if (isTeacher) {
        const res = await api.get(`/teachers/${user.id}`);
        const profile = res.data?.data?.teacherProfile;
        setTeacherProfile(profile);
        setFormData(prev => ({ ...prev, teacherId: String(profile?.id || '') }));
      }

      const [secRes, subjRes, teachRes, periodRes] = await Promise.all([
        api.get('/academic/classes'),
        api.get('/academic/subjects?limit=1000'),
        api.get('/teachers?limit=1000'),
        api.get('/academic/periods')
      ]);
      
      const allSections = [];
      getResponseList(secRes).forEach(cls => {
        (cls.sections || []).forEach(section => {
          allSections.push({ ...section, className: cls.name, classId: cls.id });
        });
      });
      
      setSections(allSections);
      setSubjects(getResponseList(subjRes));
      setTeachers(getResponseList(teachRes));
      
      const pList = getResponseList(periodRes);
      setPeriods(pList);
      
      if (timetable && !timetable.periodId && timetable.periodNumber) {
        const matchingPeriod = pList.find(p => String(p.sequenceNo) === String(timetable.periodNumber));
        if (matchingPeriod) {
          setFormData(prev => ({ ...prev, periodId: matchingPeriod.id }));
        }
      }
    } catch (error) {
      console.error('Failed to load timetable data:', error);
    }
  };

  const selectedSection = sections.find(sec => String(sec.id) === String(formData.sectionId));
  const classId = selectedSection?.classId;

  // Filter sections if user is a teacher
  const filteredSections = useMemo(() => {
    if (!isTeacher) return sections;
    const assignments = teacherProfile?.assignments || [];
    const validSectionIds = new Set(assignments.map(a => String(a.sectionId)));
    return sections.filter(sec => validSectionIds.has(String(sec.id)));
  }, [isTeacher, sections, teacherProfile]);

  // Filter subjects based on selected section
  const filteredSubjects = useMemo(() => {
    if (!formData.sectionId) return [];
    if (!isTeacher) {
      return subjects.filter(sub => String(sub.section_id || sub.sectionId || '') === String(formData.sectionId));
    }
    const assignments = teacherProfile?.assignments || [];
    const validSubjectIds = new Set(
      assignments
        .filter(a => String(a.sectionId) === String(formData.sectionId))
        .map(a => String(a.subjectId))
    );
    return subjects.filter(sub => validSubjectIds.has(String(sub.id)));
  }, [isTeacher, subjects, teacherProfile, formData.sectionId]);

  const filteredTeachers = useMemo(() => {
    if (isTeacher) return []; // Teachers don't need this filtering, they are auto-assigned
    if (!formData.sectionId || !formData.subjectId || sections.length === 0 || teachers.length === 0) {
      return [];
    }
    return teachers.filter(teacher => {
      const assignments = teacher.teacherProfile?.assignments || [];
      return assignments.some(a => 
        String(a.classId) === String(classId) &&
        String(a.sectionId) === String(formData.sectionId) &&
        String(a.subjectId) === String(formData.subjectId)
      );
    });
  }, [isTeacher, teachers, formData.sectionId, formData.subjectId, classId, sections.length]);

  useEffect(() => {
    if (isTeacher) return;
    if (sections.length === 0 || teachers.length === 0) return;
    if (formData.sectionId && formData.subjectId) {
      const isValid = filteredTeachers.some(t => String(t.teacherProfile?.id) === String(formData.teacherId));
      if (!isValid && formData.teacherId !== '') {
        setFormData(prev => ({ ...prev, teacherId: '' }));
      }
    } else {
      if (formData.teacherId !== '') {
        setFormData(prev => ({ ...prev, teacherId: '' }));
      }
    }
  }, [isTeacher, formData.sectionId, formData.subjectId, filteredTeachers, sections.length, teachers.length]);

  useEffect(() => {
    if (isTeacher) return;
    if (formData.sectionId && formData.subjectId && filteredTeachers.length === 1) {
      const singleTeacherId = filteredTeachers[0].teacherProfile?.id;
      if (formData.teacherId !== String(singleTeacherId)) {
        setFormData(prev => ({ ...prev, teacherId: String(singleTeacherId) }));
      }
    }
  }, [isTeacher, formData.sectionId, formData.subjectId, filteredTeachers, formData.teacherId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.sectionId) {
      setError('Please select a section');
      return;
    }
    if (!formData.periodId) {
      setError('Please select a period');
      return;
    }
    if (!formData.subjectId) {
      setError('Please select a subject');
      return;
    }
    if (!formData.teacherId) {
      setError('Please select a teacher');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setError('Start time must be before end time');
      return;
    }

    await onSubmit(formData);
  };

  const isSubmitDisabled = isLoading || (!isTeacher && formData.sectionId && formData.subjectId && filteredTeachers.length === 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Section *</label>
            <select
              name="sectionId"
              value={formData.sectionId}
              onChange={(e) => { handleChange(e); if(isTeacher) setFormData(prev => ({...prev, sectionId: e.target.value, subjectId: ''})); }}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select Section</option>
              {filteredSections.map(section => (
                <option key={section.id} value={section.id}>
                  {section.className} - {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Day of Week</label>
            <select
              name="dayOfWeek"
              value={formData.dayOfWeek}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="MONDAY">Monday</option>
              <option value="TUESDAY">Tuesday</option>
              <option value="WEDNESDAY">Wednesday</option>
              <option value="THURSDAY">Thursday</option>
              <option value="FRIDAY">Friday</option>
              <option value="SATURDAY">Saturday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Subject *</label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              disabled={!formData.sectionId}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {normalizeSubjectName(subject.name)}
                </option>
              ))}
            </select>
          </div>

          {!isTeacher && (
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-2">Teacher *</label>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                disabled={!formData.sectionId || !formData.subjectId}
                className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900"
              >
                {!formData.sectionId || !formData.subjectId ? (
                  <option value="">Select Section and Subject first</option>
                ) : filteredTeachers.length === 0 ? (
                  <option value="">No teacher assigned for this subject</option>
                ) : (
                  <>
                    <option value="">Select Teacher</option>
                    {filteredTeachers.map(teacher => (
                      <option key={teacher.teacherProfile?.id} value={teacher.teacherProfile?.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Period *</label>
            <select
              name="periodId"
              value={formData.periodId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const p = periods.find(x => String(x.id) === String(selectedId));
                if (p) {
                  setFormData(prev => ({
                    ...prev,
                    periodId: selectedId,
                    periodNumber: String(p.sequenceNo),
                    startTime: p.startTime,
                    endTime: p.endTime
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    periodId: '',
                  }));
                }
              }}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Select Period</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.periodName} ({p.startTime} - {p.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Start Time</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              readOnly
              className="w-full rounded-lg border border-surface-200 bg-slate-50 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              readOnly
              className="w-full rounded-lg border border-surface-200 bg-slate-50 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Class Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            >
              <option value="offline">Offline / Regular</option>
              <option value="live">Live Virtual</option>
              <option value="lab">Lab Session</option>
              <option value="extra">Extra Class</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Room/Lab</label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="e.g., Room 101"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Meeting Link (Live/Extra)</label>
            <input
              type="url"
              name="meetingLink"
              value={formData.meetingLink}
              onChange={handleChange}
              disabled={formData.type === 'offline' || formData.type === 'lab'}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900"
              placeholder="https://zoom.us/..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-2">Remarks (Optional)</label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="w-full rounded-lg border border-surface-200 px-4 py-2 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              placeholder="Any special notes for this class"
            />
          </div>
        </div>
      </div>

      {!isTeacher && formData.sectionId && formData.subjectId && filteredTeachers.length === 0 && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            No teacher assigned for this subject.
            <p className="text-xs font-normal text-amber-700/80 dark:text-amber-400/80 mt-1">
              Please assign a teacher to this combination under Teachers Directory &rarr; Edit Profile &rarr; Academic Assignments before scheduling this timetable slot.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] px-4 py-2.5 font-bold text-white shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
        >
          {isLoading && <Loader className="h-4 w-4 animate-spin" />}
          {timetable ? 'Update Timetable' : 'Add Timetable'}
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
