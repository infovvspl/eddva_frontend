import React, { useState, useEffect } from 'react';
import {
  X, Sparkles, Save, BookOpen, Calendar, Clock, Layers, CheckCircle2, Loader2, Edit3, RefreshCw
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

export default function LessonPlanFormModal({ open, isOpen, onClose, onSuccess, timetableSlot = null, initialTimetableSlot = null, templateData = null, teacherAssignments = [] }) {
  const isVisible = open ?? isOpen;
  const activeSlot = timetableSlot || initialTimetableSlot;

  const [activeTab, setActiveTab] = useState('ai'); // 'ai' (default — generate a brief) or 'form' (full manual details)
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
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
    status: 'SCHEDULED',
    aiBrief: null
  });

  useEffect(() => {
    if (isVisible) {
      deriveClassesFromAssignments();
      const targetCid = activeSlot?.classId || activeSlot?.class_id || form.classId;
      const targetSecId = activeSlot?.sectionId || activeSlot?.section_id || form.sectionId;
      const rawSubId = activeSlot?.subjectId || activeSlot?.subject_id || form.subjectId;
      const rawSubName = activeSlot?.subjectName || activeSlot?.subject_name || activeSlot?.subject || '';

      if (targetCid) {
        handleClassChange(targetCid).then((fetchedSubList) => {
          let resolvedSubId = rawSubId;
          const subList = Array.isArray(fetchedSubList) ? fetchedSubList : subjects;
          if (!resolvedSubId && rawSubName && subList.length > 0) {
            const matched = subList.find(s => s.name?.toLowerCase() === rawSubName.toLowerCase());
            if (matched) resolvedSubId = matched.id;
          }
          if (resolvedSubId) {
            setForm(prev => ({
              ...prev,
              classId: targetCid,
              sectionId: targetSecId || '',
              subjectId: resolvedSubId,
              timetableId: initialTimetableSlot?.id || null
            }));
            handleSubjectChange(resolvedSubId, targetCid, targetSecId);
          }
        });
      }
      // No activeSlot: leave class/section/subject empty. The teacher picks from their
      // own assigned classes below — never falls back to fetching the whole institute's
      // subjects, which is exactly the "which of my classes is this for?" confusion
      // a teacher with multiple assignments would otherwise hit.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, activeSlot, teacherAssignments]);

  useEffect(() => {
    if (isVisible && templateData) {
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
      toast.success('Template applied — review and edit before saving.');
    }
    // Only re-apply when a fresh template is picked (or the modal is freshly opened with one),
    // not on every keystroke while the teacher edits the pre-filled fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, templateData]);

  // Scoped to this teacher's own assignments — never the whole institute's classes/
  // subjects, so a teacher with several classes/sections/subjects always sees only
  // what they actually teach.
  const deriveClassesFromAssignments = () => {
    const map = new Map();
    (teacherAssignments || []).forEach(a => {
      const id = a.class_id ?? a.classId;
      const name = a.class_name ?? a.className;
      if (id && !map.has(id)) map.set(id, { id, name: name || 'Class' });
    });
    const list = Array.from(map.values()).sort((a, b) => {
      const numA = parseInt((a.name || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.name || '').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return (a.name || '').localeCompare(b.name || '');
    });
    setClasses(list);
    return list;
  };

  const handleClassChange = async (cid) => {
    setForm(prev => ({ ...prev, classId: cid, sectionId: '', subjectId: '', chapterId: '', topicId: '' }));
    setChapters([]);
    setTopics([]);
    if (!cid) {
      setSections([]);
      setSubjects([]);
      return [];
    }
    const secMap = new Map();
    const subMap = new Map();
    (teacherAssignments || []).forEach(a => {
      const aClassId = a.class_id ?? a.classId;
      if (String(aClassId) !== String(cid)) return;
      const secId = a.section_id ?? a.sectionId;
      const secName = a.section_name ?? a.sectionName;
      if (secId && !secMap.has(secId)) secMap.set(secId, { id: secId, name: secName || 'Section' });
      const subId = a.subject_id ?? a.subjectId;
      const subName = a.subject_name ?? a.subjectName;
      if (subId && !subMap.has(subId)) subMap.set(subId, { id: subId, name: subName || 'Subject' });
    });
    const secList = Array.from(secMap.values());
    const subList = Array.from(subMap.values());
    setSections(secList);
    setSubjects(subList);
    return subList;
  };

  const handleSubjectChange = async (sid, overrideClassId, overrideSectionId) => {
    const targetCid = overrideClassId !== undefined ? overrideClassId : form.classId;
    const targetSecId = overrideSectionId !== undefined ? overrideSectionId : form.sectionId;
    setForm(prev => ({ ...prev, subjectId: sid, chapterId: '', topicId: '' }));
    setChapters([]);
    setTopics([]);
    if (!sid) return;

    try {
      const res = await api.get('/topics/chapters', { params: { subjectId: sid, classId: targetCid || undefined, sectionId: targetSecId || undefined } });
      setChapters(unwrapSchoolList(res));
    } catch {
      setChapters([]);
    }
  };

  const handleChapterChange = async (chid) => {
    setForm(prev => ({ ...prev, chapterId: chid, topicId: '' }));
    setTopics([]);
    if (!chid) return;
    try {
      const res = await api.get('/topics', { params: { chapterId: chid } });
      setTopics(unwrapSchoolList(res));
    } catch {
      setTopics([]);
    }
  };

  const handleGenerateAiTemplate = async () => {
    setGeneratingAi(true);
    try {
      const selSubject = subjects.find(s => s.id === form.subjectId)?.name || '';
      const selClass = classes.find(c => c.id === form.classId)?.name || '';
      const selChapter = chapters.find(c => c.id === form.chapterId)?.name || '';
      const selTopic = topics.find(t => t.id === form.topicId)?.name || '';

      const res = await api.post('/syllabus/lessons/ai-template', {
        subjectId: form.subjectId,
        chapterId: form.chapterId,
        topicId: form.topicId,
        subjectName: selSubject,
        chapterName: selChapter,
        className: selClass,
        topicName: selTopic
      });

      const payload = res.data || {};
      if (payload.aiGenerated && payload.data?.brief) {
        // Real AI-generated markdown brief — this is now the primary path.
        setForm(prev => ({ ...prev, aiBrief: payload.data.brief }));
        toast.success(payload.message || 'AI-generated brief ready — review before class.');
      } else if (payload.data) {
        // AI unavailable — fell back to the canned structured template, so hand the
        // teacher over to the full manual form instead of a brief they can't get.
        const templateData = payload.data;
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
        toast(payload.message || 'AI is unavailable right now — using a standard template. Review before saving.');
      }
    } catch (err) {
      console.error('Failed to generate lesson brief:', err);
      toast.error('Failed to generate lesson brief');
    } finally {
      setGeneratingAi(false);
    }
  };

  const saveLessonPlan = async () => {
    if (!form.classId || !form.subjectId) {
      toast.error('Please select Class and Subject');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/syllabus/lessons', form);
      toast.success(form.aiBrief ? 'Lesson brief saved!' : 'Lesson Plan saved & scheduled successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to save lesson plan:', err);
      toast.error(err.response?.data?.message || 'Failed to save lesson plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveLessonPlan();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 my-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">New Lesson Plan</h2>
            <p className="text-xs text-slate-500">Generate a quick AI brief to skim before class, or write out full details yourself.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ai' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}
          >
            <Sparkles size={15} /> Generate Brief
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'form' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            <Edit3 size={15} /> Add Full Details
          </button>
        </div>

        {activeTab === 'ai' ? (
          <div className="space-y-6 py-4">
            {!form.aiBrief && (
              <div className="rounded-2xl bg-blue-50/60 p-5 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-2">
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Sparkles size={18} /> Pre-Class AI Brief
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  A short, skimmable brief — recap, objective, teaching flow, and a quick check —
                  <strong className="text-blue-700 dark:text-blue-300"> ready in seconds, right before you walk into class.</strong>
                </p>
              </div>
            )}

            {activeSlot ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Generating for: {classes.find(c => c.id === form.classId)?.name || activeSlot?.className || activeSlot?.class_name || 'Class'}
                  {form.sectionId ? ` - ${sections.find(s => s.id === form.sectionId)?.name || ''}` : ''}
                  {' · '}{subjects.find(s => s.id === form.subjectId)?.name || activeSlot?.subjectName || activeSlot?.subject_name || 'Subject'}
                </p>
              </div>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                No classes assigned yet — contact your admin to get classes/sections/subjects assigned to you.
              </div>
            ) : (
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                  <select
                    value={form.sectionId}
                    onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                    disabled={!form.classId}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">All / Any Section</option>
                    {sections.map(sec => (
                      <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                  <select
                    value={form.subjectId}
                    onChange={e => handleSubjectChange(e.target.value)}
                    disabled={!form.classId}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(activeSlot || classes.length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chapter *</label>
                  <select
                    value={form.chapterId}
                    onChange={e => handleChapterChange(e.target.value)}
                    disabled={!form.subjectId}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">Select Chapter ({chapters.length} available)</option>
                    {chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                  <select
                    value={form.topicId}
                    onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
                    disabled={!form.chapterId}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">All / Specific Topic ({topics.length} available)</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {!form.aiBrief ? (
              <button
                type="button"
                onClick={handleGenerateAiTemplate}
                disabled={generatingAi || !form.classId || !form.subjectId || !form.chapterId}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {generatingAi ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Generate Brief
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 max-h-[45vh] overflow-y-auto">
                  <MarkdownRenderer content={form.aiBrief} className="prose prose-sm dark:prose-invert max-w-none" />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, aiBrief: null }))}
                    disabled={generatingAi}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                  >
                    <RefreshCw size={14} /> Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={saveLessonPlan}
                    disabled={submitting}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Lesson
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Academic Session</label>
                <select
                  value={form.academicYear}
                  onChange={e => {
                    const yr = e.target.value;
                    setForm(f => ({ ...f, academicYear: yr }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="2026-2027">2026-2027</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2026">2026</option>
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
                    <option key={c.id} value={c.id}>
                      {c.name} {c.academic_year ? `(${c.academic_year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Section</label>
                <select
                  value={form.sectionId}
                  onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))}
                  disabled={!form.classId}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">All / Any Section</option>
                  {sections.map(sec => (
                    <option key={sec.id} value={sec.id}>Section {sec.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject *</label>
                <select
                  value={form.subjectId}
                  onChange={e => handleSubjectChange(e.target.value)}
                  disabled={!form.classId}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Chapter (Subject Curriculum)</label>
                <select
                  value={form.chapterId}
                  onChange={e => handleChapterChange(e.target.value)}
                  disabled={!form.subjectId}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select Chapter ({chapters.length} available)</option>
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                <select
                  value={form.topicId}
                  onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
                  disabled={!form.chapterId}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">All / Specific Topic ({topics.length} available)</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
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
