import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Plus, Save, Layers, CheckCircle2, 
  Sparkles, Loader2, Filter, AlertCircle, Users, ArrowRight 
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

import { unwrapSchoolList } from '@/lib/api/school-client';

export default function SyllabusPlanner() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [availableYears, setAvailableYears] = useState(['2024-2025', '2025-2026', '2026-2027']);

  const [form, setForm] = useState({
    academicYear: '2025-2026',
    classId: '',
    sectionId: '',
    subjectId: '',
    chapterId: '',
    topicId: '',
    teacherId: '',
    plannedStartDate: new Date().toISOString().split('T')[0],
    plannedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    plannedPeriods: 4,
    priority: 'NORMAL',
    term: 'Term 1'
  });

  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  const [publishedPlans, setPublishedPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Fetch all classes once to discover available academic years
    api.get('/academic/classes').then(res => {
      const allCls = unwrapSchoolList(res);
      const years = new Set(allCls.map(c => c.academic_year).filter(Boolean));
      years.add('2024-2025');
      years.add('2025-2026');
      years.add('2026-2027');
      const sortedYears = Array.from(years).sort().reverse();
      setAvailableYears(sortedYears);
      if (sortedYears.length > 0 && !years.has(form.academicYear)) {
        setForm(f => ({ ...f, academicYear: sortedYears[0] }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [form.academicYear]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [clsRes, tchRes, plansRes] = await Promise.all([
        api.get('/academic/classes', { params: { academicYear: form.academicYear } }).catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] })),
        api.get('/syllabus/plans', { params: { academicYear: form.academicYear } }).catch(() => ({ data: [] }))
      ]);
      let classList = unwrapSchoolList(clsRes);
      if (classList.length === 0) {
        const allClsRes = await api.get('/academic/classes').catch(() => ({ data: [] }));
        classList = unwrapSchoolList(allClsRes);
      }
      classList.sort((a, b) => {
        const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
        const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
        if (numA !== numB) return numA - numB;
        return (a.name || '').localeCompare(b.name || '');
      });
      setClasses(classList);
      setTeachers(unwrapSchoolList(tchRes));
      setPublishedPlans(unwrapSchoolList(plansRes));
    } catch (err) {
      console.error('Failed to load syllabus planner initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (cid) => {
    setForm(prev => ({ ...prev, classId: cid, sectionId: '', subjectId: '', teacherId: '', chapterId: '', topicId: '' }));
    setSections([]);
    setSubjects([]);
    setChapters([]);
    setTopics([]);
    if (!cid) return;
    fetchSubjectsForClass(cid);
    fetchSectionsForClass(cid);
  };

  const fetchSectionsForClass = async (cid) => {
    try {
      const res = await api.get('/academic/sections', { params: { classId: cid } }).catch(() => ({ data: [] }));
      setSections(unwrapSchoolList(res));
    } catch {
      setSections([]);
    }
  };

  const fetchSubjectsForClass = async (cid) => {
    try {
      const res = await api.get('/subjects', { params: { classId: cid, limit: 200 } }).catch(() => ({ data: [] }));
      setSubjects(unwrapSchoolList(res));
    } catch {
      setSubjects([]);
    }
  };

  const handleSectionChange = async (secId) => {
    setForm(prev => ({ ...prev, sectionId: secId, teacherId: '' }));
    if (secId && form.subjectId) {
      lookupAssignedTeacher(secId, form.subjectId);
    }
  };

  const handleSubjectChange = async (sid) => {
    setForm(prev => ({ ...prev, subjectId: sid, teacherId: '', chapterId: '', topicId: '' }));
    if (form.sectionId && sid) {
      lookupAssignedTeacher(form.sectionId, sid);
    } else if (form.classId && sid && sections.length > 0) {
      lookupAssignedTeacher(sections[0].id, sid);
    }
    try {
      const res = await api.get('/topics/chapters', { params: { subjectId: sid } }).catch(() => ({ data: [] }));
      setChapters(unwrapSchoolList(res));
    } catch {
      setChapters([]);
    }
  };

  const lookupAssignedTeacher = async (sectionId, subjectId) => {
    if (!subjectId) {
      setSubjectTeachers([]);
      return;
    }
    try {
      const subTchRes = await api.get('/teachers', { params: { subjectId, limit: 100 } }).catch(() => null);
      let subjectTchs = subTchRes ? unwrapSchoolList(subTchRes) : [];
      if (subjectTchs.length === 0) {
        subjectTchs = teachers.filter(t => {
          const subs = t.subjects || t.teacherProfile?.subjects || [];
          return subs.some(s => s.id === subjectId || s.subjectId === subjectId);
        });
      }

      let assignedTeacherId = null;
      if (sectionId) {
        const secRes = await api.get(`/academic/sections/${sectionId}/teaching-map`).catch(() => null);
        const data = secRes?.data?.data || secRes?.data;
        if (data?.subjects) {
          const found = data.subjects.find(s => s.subjectId === subjectId);
          if (found?.teachers && found.teachers.length > 0) {
            assignedTeacherId = found.teachers[0].userId;
          }
        }
      }

      const displayList = subjectTchs.length > 0 ? subjectTchs : teachers;
      setSubjectTeachers(displayList);

      if (assignedTeacherId) {
        const matched = displayList.find(t => 
          t.id === assignedTeacherId || 
          t.userId === assignedTeacherId || 
          t.user_id === assignedTeacherId ||
          t.teacherProfile?.id === assignedTeacherId ||
          t.profile_id === assignedTeacherId
        );
        if (matched) {
          const targetId = matched.teacherProfile?.id || matched.profile_id || matched.id;
          setForm(prev => ({ ...prev, teacherId: targetId }));
          return;
        }
      }
      
      if (displayList.length > 0) {
        const firstId = displayList[0].teacherProfile?.id || displayList[0].profile_id || displayList[0].id;
        setForm(prev => ({ ...prev, teacherId: firstId }));
      }
    } catch {
      setSubjectTeachers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.subjectId) {
      return toast.error('Please select both Class and Subject');
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        sectionId: form.sectionId === 'ALL_SECTIONS' ? null : form.sectionId
      };
      await api.post('/syllabus/plans', payload);
      toast.success('Annual Syllabus Plan created & published successfully!');
      setForm(prev => ({ ...prev, chapterId: '', topicId: '' }));
      fetchInitialData();
    } catch (err) {
      console.error('Failed to save syllabus plan:', err);
      toast.error(err.response?.data?.message || 'Failed to publish syllabus plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setEditForm({
      teacherId: plan.teacher_id || '',
      term: plan.term || 'Term 1',
      plannedPeriods: plan.planned_periods || 4,
      plannedStartDate: plan.planned_start_date ? new Date(plan.planned_start_date).toISOString().split('T')[0] : '',
      plannedCompletionDate: plan.planned_completion_date ? new Date(plan.planned_completion_date).toISOString().split('T')[0] : '',
      priority: plan.priority || 'NORMAL',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPlan) return;
    try {
      await api.put(`/syllabus/plans/${editingPlan.id}`, editForm);
      toast.success('Syllabus target updated successfully');
      setEditingPlan(null);
      fetchInitialData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update syllabus target');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to remove this allocated syllabus target?')) return;
    try {
      await api.delete(`/syllabus/plans/${id}`);
      toast.success('Target removed successfully');
      fetchInitialData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove target');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const selectedClassObj = classes.find(c => c.id === form.classId);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Annual Syllabus Planner</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Curriculum Setup
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Assign and allocate annual subject targets, term periods, and completion dates to teachers.</p>
        </div>

        {/* Academic Year Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Academic Year:</label>
          <select
            value={form.academicYear}
            onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-sm"
          >
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LEVEL 1: CLASS CARDS GRID (shown when no class selected) */}
      {!form.classId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Select Class</h3>
            <p className="text-xs font-semibold text-slate-500">{classes.length} Classes Available</p>
          </div>

          {classes.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">No classes registered</h3>
              <p className="mt-1 text-xs text-slate-500">Configure academic classes in Academics setup first.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map(cls => {
                const classPlans = publishedPlans.filter(p => p.class_id === cls.id || (p.class_name && p.class_name.toLowerCase() === cls.name.toLowerCase()));
                const totalAllocated = classPlans.length;

                return (
                  <div
                    key={cls.id}
                    onClick={() => handleClassChange(cls.id)}
                    className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          <Layers size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{cls.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">{totalAllocated} Published Syllabus Target{totalAllocated === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                      <span>Status: <strong className={totalAllocated > 0 ? "text-emerald-600" : "text-amber-600"}>{totalAllocated > 0 ? 'Active Targets' : 'Pending Targets'}</strong></span>
                      <span className="text-blue-600 font-bold group-hover:underline">Select Class →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LEVEL 2: SECTION CARDS GRID (shown when class selected, but no section selected) */}
      {form.classId && !form.sectionId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, classId: '', sectionId: '' }))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 text-xs font-bold transition-all"
              >
                ← Back to All Classes
              </button>
              <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                {selectedClassObj?.name} — Select Section
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Session {form.academicYear}</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card for Entire Class / All Sections */}
            <div
              onClick={() => handleSectionChange('ALL_SECTIONS')}
              className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Users size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Entire Class</h3>
                    <p className="text-xs text-slate-500 font-semibold">General Class Targets</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                Configure syllabus plans applicable to all sections of {selectedClassObj?.name}.
              </p>
            </div>

            {/* Individual Section Cards */}
            {sections.map(sec => {
              const secPlans = publishedPlans.filter(p => (p.class_id === form.classId || p.class_name?.toLowerCase() === selectedClassObj?.name.toLowerCase()) && (p.section_id === sec.id || p.section_name?.toLowerCase() === sec.name.toLowerCase()));

              return (
                <div
                  key={sec.id}
                  onClick={() => handleSectionChange(sec.id)}
                  className="group relative cursor-pointer rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Layers size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Section {sec.name}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{secPlans.length} Allocated Target{secPlans.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
                    <span>Active Section Plans</span>
                    <span className="text-blue-600 font-bold group-hover:underline">Configure →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LEVEL 3: TARGET CREATION FORM & ALLOCATED PLANS LIST (shown when class AND section selected) */}
      {form.classId && form.sectionId && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, sectionId: '' }))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 text-xs font-bold transition-all"
              >
                ← Back to Sections
              </button>
              <h3 className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                {selectedClassObj?.name} {form.sectionId === 'ALL_SECTIONS' ? '(Entire Class)' : `(Section ${sections.find(s => s.id === form.sectionId)?.name || ''})`} — Syllabus Target Setup
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Session {form.academicYear}</span>
          </div>

          {/* Form with redundant class and section dropdowns REMOVED */}
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <select
                  required
                  value={form.subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code || 'N/A'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher *</label>
                <select
                  required
                  value={form.teacherId}
                  onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select Teacher</option>
                  {(subjectTeachers.length > 0 ? subjectTeachers : teachers).map(t => {
                    const tid = t.teacherProfile?.id || t.profile_id || t.id;
                    const tName = t.name || t.user?.name || `Teacher (${t.employee_id || 'Staff'})`;
                    return <option key={tid} value={tid}>{tName}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Term Target</label>
                <select
                  value={form.term}
                  onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Term 1">Term 1 / Mid Term</option>
                  <option value="Term 2">Term 2 / Final Exam</option>
                  <option value="Annual">Full Academic Year</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planned Periods</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={form.plannedPeriods}
                  onChange={e => setForm(f => ({ ...f, plannedPeriods: parseInt(e.target.value, 10) || 1 }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planned Start Date</label>
                <input
                  type="date"
                  value={form.plannedStartDate}
                  onChange={e => setForm(f => ({ ...f, plannedStartDate: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planned Completion Date</label>
                <input
                  type="date"
                  value={form.plannedCompletionDate}
                  onChange={e => setForm(f => ({ ...f, plannedCompletionDate: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planning Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent / Exam Core</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Publish Annual Syllabus Plan
              </button>
            </div>
          </form>

          {/* Published Syllabus Allocations Table / Cards */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Allocated Syllabus Targets for {selectedClassObj?.name} {form.sectionId === 'ALL_SECTIONS' ? '(Entire Class)' : `(Section ${sections.find(s => s.id === form.sectionId)?.name || ''})`}
                  </h3>
                  <p className="text-xs text-slate-500">Active target plans published for this section.</p>
                </div>
              </div>
            </div>

            {publishedPlans.filter(p => (p.class_id === form.classId || p.class_name?.toLowerCase() === selectedClassObj?.name.toLowerCase()) && (form.sectionId === 'ALL_SECTIONS' || p.section_id === form.sectionId || p.section_name?.toLowerCase() === sections.find(s => s.id === form.sectionId)?.name.toLowerCase())).length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No syllabus plans published for this section yet. Fill the form above to publish your first target.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {publishedPlans
                  .filter(p => (p.class_id === form.classId || p.class_name?.toLowerCase() === selectedClassObj?.name.toLowerCase()) && (form.sectionId === 'ALL_SECTIONS' || p.section_id === form.sectionId || p.section_name?.toLowerCase() === sections.find(s => s.id === form.sectionId)?.name.toLowerCase()))
                  .map(plan => (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{plan.class_name} {plan.section_name ? `(${plan.section_name})` : ''}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{plan.term || 'Term 1'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{plan.subject_name || 'Subject Plan'}</h4>
                      <p className="text-xs text-slate-500 font-semibold">Teacher: <span className="text-slate-800 dark:text-slate-200 font-bold">{plan.teacher_name || 'Unassigned'}</span></p>
                      
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <span>Periods: <strong className="text-slate-700 dark:text-slate-300">{plan.planned_periods || 1}</strong></span>
                        <span>{plan.planned_start_date ? new Date(plan.planned_start_date).toLocaleDateString() : ''} - {plan.planned_completion_date ? new Date(plan.planned_completion_date).toLocaleDateString() : ''}</span>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(plan)}
                          className="flex-1 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-all text-center"
                        >
                          Edit Target
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlan(plan.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT TARGET MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Syllabus Target</h3>
                <p className="text-xs text-slate-500">{editingPlan.class_name} · {editingPlan.subject_name}</p>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Teacher</label>
                <select
                  value={editForm.teacherId}
                  onChange={e => setEditForm(f => ({ ...f, teacherId: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => {
                    const tid = t.teacherProfile?.id || t.profile_id || t.id;
                    const tName = t.name || t.user?.name || `Teacher (${t.employee_id || 'Staff'})`;
                    return <option key={tid} value={tid}>{tName}</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Term Target</label>
                  <select
                    value={editForm.term}
                    onChange={e => setEditForm(f => ({ ...f, term: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planned Periods</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.plannedPeriods}
                    onChange={e => setEditForm(f => ({ ...f, plannedPeriods: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.plannedStartDate}
                    onChange={e => setEditForm(f => ({ ...f, plannedStartDate: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={editForm.plannedCompletionDate}
                    onChange={e => setEditForm(f => ({ ...f, plannedCompletionDate: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
