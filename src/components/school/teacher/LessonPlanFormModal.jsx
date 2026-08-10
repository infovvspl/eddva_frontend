import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Save, BookOpen, Calendar, Clock, Layers, CheckCircle2, Loader2, Edit3 
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function LessonPlanFormModal({ isOpen, onClose, onSuccess, initialTimetableSlot = null }) {
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'ai'
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    academicYear: String(new Date().getFullYear()),
    classId: '',
    sectionId: '',
    subjectId: '',
    chapterId: '',
    topicId: '',
    date: new Date().toISOString().split('T')[0],
    durationPeriods: 1,
    learningObjectives: '',
    previousKnowledge: '',
    teachingMethodology: 'Interactive Explanation & Demonstration',
    teachingActivities: '',
    teachingResources: 'Textbook, Whiteboard',
    digitalResources: '',
    classroomActivities: '',
    assessmentMethod: 'Q&A Check',
    homework: '',
    expectedLearningOutcomes: '',
    teacherNotes: '',
    timetableId: null,
    status: 'SCHEDULED'
  });

  useEffect(() => {
    if (isOpen) {
      fetchClasses();
      if (initialTimetableSlot) {
        setForm(prev => ({
          ...prev,
          classId: initialTimetableSlot.classId || '',
          sectionId: initialTimetableSlot.sectionId || '',
          subjectId: initialTimetableSlot.subjectId || '',
          timetableId: initialTimetableSlot.id || null
        }));
      }
    }
  }, [isOpen, initialTimetableSlot]);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/academic/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassChange = async (cid) => {
    setForm(prev => ({ ...prev, classId: cid, subjectId: '', chapterId: '', topicId: '' }));
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
      const res = await api.get(`/subjects/${sid}/chapters`);
      setChapters(Array.isArray(res.data) ? res.data : []);
    } catch {
      setChapters([]);
    }
  };

  const handleChapterChange = async (chid) => {
    setForm(prev => ({ ...prev, chapterId: chid, topicId: '' }));
    try {
      const res = await api.get(`/chapters/${chid}/topics`);
      setTopics(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTopics([]);
    }
  };

  const handleGenerateAiTemplate = async () => {
    setGeneratingAi(true);
    try {
      const selSubject = subjects.find(s => s.id === form.subjectId)?.name || 'Subject';
      const selClass = classes.find(c => c.id === form.classId)?.name || 'Class';
      const selTopic = topics.find(t => t.id === form.topicId)?.name || 'Core Topic';

      const res = await api.post('/syllabus/lessons/ai-template', {
        subjectName: selSubject,
        className: selClass,
        topicName: selTopic
      });

      const templateData = res.data?.data ?? res.data;
      if (templateData) {
        setForm(prev => ({
          ...prev,
          learningObjectives: templateData.learningObjectives || prev.learningObjectives,
          previousKnowledge: templateData.previousKnowledge || prev.previousKnowledge,
          teachingMethodology: templateData.teachingMethodology || prev.teachingMethodology,
          teachingActivities: templateData.teachingActivities || prev.teachingActivities,
          teachingResources: templateData.teachingResources || prev.teachingResources,
          digitalResources: templateData.digitalResources || prev.digitalResources,
          classroomActivities: templateData.classroomActivities || prev.classroomActivities,
          assessmentMethod: templateData.assessmentMethod || prev.assessmentMethod,
          homework: templateData.homework || prev.homework,
          expectedLearningOutcomes: templateData.expectedLearningOutcomes || prev.expectedLearningOutcomes,
          teacherNotes: templateData.teacherNotes || prev.teacherNotes
        }));
        setActiveTab('form');
        toast.success('AI Starter Template generated! You can now review and edit the fields.');
      }
    } catch (err) {
      console.error('Failed to generate AI template:', err);
      toast.error('Failed to generate AI template');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.classId || !form.subjectId) {
      return toast.error('Please select Class and Subject');
    }
    setSubmitting(true);
    try {
      await api.post('/syllabus/lessons', form);
      toast.success('Lesson Plan saved & scheduled successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save lesson plan:', err);
      toast.error(err.response?.data?.message || 'Failed to save lesson plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Create / Schedule Lesson Plan</h2>
            <p className="text-xs text-slate-500">Draft, edit, or generate an AI starter template for your teaching session.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            <Edit3 size={15} /> Lesson Plan Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ai' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}
          >
            <Sparkles size={15} /> AI Starter Template Generator
          </button>
        </div>

        {activeTab === 'ai' ? (
          <div className="space-y-6 py-4">
            <div className="rounded-2xl bg-blue-50/60 p-5 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-2">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <Sparkles size={18} /> AI Starter Draft Generator
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Generates a suggested starter template containing learning objectives, teaching activities, questions, and homework. 
                <strong className="text-blue-700 dark:text-blue-300"> You can review and edit all fields before saving or scheduling.</strong>
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Class</label>
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
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
            </div>

            <button
              type="button"
              onClick={handleGenerateAiTemplate}
              disabled={generatingAi}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {generatingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generate Draft Template for Editing
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Learning Objectives</label>
              <textarea
                rows="3"
                value={form.learningObjectives}
                onChange={e => setForm(f => ({ ...f, learningObjectives: e.target.value }))}
                placeholder="Key concepts & goals for this session…"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Teaching Activities & Flow</label>
              <textarea
                rows="3"
                value={form.teachingActivities}
                onChange={e => setForm(f => ({ ...f, teachingActivities: e.target.value }))}
                placeholder="Classroom flow, introduction, explanation, board work…"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Assessment & Quick Check</label>
                <input
                  type="text"
                  value={form.assessmentMethod}
                  onChange={e => setForm(f => ({ ...f, assessmentMethod: e.target.value }))}
                  placeholder="e.g. Q&A, Short 3-question quiz"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Homework Assigned</label>
                <input
                  type="text"
                  value={form.homework}
                  onChange={e => setForm(f => ({ ...f, homework: e.target.value }))}
                  placeholder="e.g. Exercise 1 to 5"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save & Schedule Lesson
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
