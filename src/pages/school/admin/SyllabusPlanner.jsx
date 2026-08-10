import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Plus, Save, Layers, CheckCircle2, 
  Sparkles, Loader2, Filter, AlertCircle, Users, ArrowRight 
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function SyllabusPlanner() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    academicYear: String(new Date().getFullYear()),
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [clsRes, tchRes] = await Promise.all([
        api.get('/academic/classes').catch(() => ({ data: [] })),
        api.get('/teachers').catch(() => ({ data: [] }))
      ]);
      setClasses(Array.isArray(clsRes.data) ? clsRes.data : []);
      setTeachers(Array.isArray(tchRes.data) ? tchRes.data : []);
    } catch (err) {
      console.error('Failed to load syllabus planner initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (cid) => {
    setForm(prev => ({ ...prev, classId: cid, subjectId: '', chapterId: '', topicId: '' }));
    const selectedCls = classes.find(c => c.id === cid);
    if (selectedCls?.subjects) {
      setSubjects(selectedCls.subjects);
    } else {
      fetchSubjectsForClass(cid);
    }
  };

  const fetchSubjectsForClass = async (cid) => {
    try {
      const res = await api.get(`/academic/classes/${cid}/subjects`);
      setSubjects(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSubjects([]);
    }
  };

  const handleSubjectChange = async (sid) => {
    setForm(prev => ({ ...prev, subjectId: sid, chapterId: '', topicId: '' }));
    try {
      const res = await api.get(`/subjects/${sid}/chapters`).catch(() => ({ data: [] }));
      setChapters(Array.isArray(res.data) ? res.data : []);
    } catch {
      setChapters([]);
    }
  };

  const handleChapterChange = async (chid) => {
    setForm(prev => ({ ...prev, chapterId: chid, topicId: '' }));
    try {
      const res = await api.get(`/chapters/${chid}/topics`).catch(() => ({ data: [] }));
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTopics([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.subjectId) {
      return toast.error('Please select both Class and Subject');
    }
    setSubmitting(true);
    try {
      await api.post('/syllabus/plans', form);
      toast.success('Annual Syllabus Plan created & published successfully!');
      setForm(prev => ({ ...prev, chapterId: '', topicId: '' }));
    } catch (err) {
      console.error('Failed to save syllabus plan:', err);
      toast.error(err.response?.data?.message || 'Failed to publish syllabus plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Annual Syllabus Planner</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Admin Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configure academic timelines, periods, and target completion dates for chapters and topics.</p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
            <BookOpen size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Curriculum & Allocation Setup</h3>
            <p className="text-xs text-slate-500">Link target topics with subject teachers and teaching periods.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Session</label>
            <input
              type="text"
              value={form.academicYear}
              onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Term / Unit</label>
            <select
              value={form.term}
              onChange={e => setForm(f => ({ ...f, term: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="Term 1">Term 1 (Apr - Sep)</option>
              <option value="Term 2">Term 2 (Oct - Mar)</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Class *</label>
            <select
              value={form.classId}
              onChange={e => handleClassChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
            <select
              value={form.subjectId}
              onChange={e => handleSubjectChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Subject Teacher</label>
            <select
              value={form.teacherId}
              onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Planned Teaching Periods</label>
            <input
              type="number"
              min="1"
              max="50"
              value={form.plannedPeriods}
              onChange={e => setForm(f => ({ ...f, plannedPeriods: parseInt(e.target.value) || 1 }))}
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
    </div>
  );
}
