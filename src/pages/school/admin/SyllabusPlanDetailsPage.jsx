// SyllabusPlanDetailsPage - Dedicated Full Page View for Annual Subject Syllabus Plan
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Calendar, Clock, User, Layers, 
  Sparkles, CheckCircle2, AlertCircle, Edit3, Shield, ListTree, ChevronRight, Plus, Loader2
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function SyllabusPlanDetailsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const [updatingTopic, setUpdatingTopic] = useState(null);
  const [topicProgressForm, setTopicProgressForm] = useState({
    status: 'in_progress',
    progress: 50,
    actualPeriods: 2,
    remarks: '',
    delayReason: '',
    carryForwardDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    completionDate: ''
  });

  const [addingTopicChapter, setAddingTopicChapter] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicPeriods, setNewTopicPeriods] = useState(2);
  const [submittingTopic, setSubmittingTopic] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/syllabus/plans');
      const allPlans = unwrapSchoolList(res);
      const found = allPlans.find(p => String(p.id) === String(planId));
      if (found) {
        let allocs = Array.isArray(found.chapter_allocations) ? found.chapter_allocations : [];
        
        allocs = await Promise.all(allocs.map(async (c) => {
          let topList = Array.isArray(c.topics) ? [...c.topics] : [];
          if (c.chapterId) {
            try {
              const topRes = await api.get('/topics', { params: { chapterId: c.chapterId } }).catch(() => ({ data: [] }));
              const dbTopics = unwrapSchoolList(topRes);
              dbTopics.forEach(dbt => {
                const existing = topList.find(t => String(t.topicId || t.id) === String(dbt.id) || (t.topicName || t.name || '').toLowerCase().trim() === (dbt.name || '').toLowerCase().trim());
                if (!existing) {
                  topList.push({ topicId: dbt.id, topicName: dbt.name, status: 'pending', progress: 0 });
                } else {
                  if (!existing.topicId) existing.topicId = dbt.id;
                  if (!existing.topicName) existing.topicName = dbt.name;
                }
              });
            } catch {}
          }
          return { ...c, topics: topList };
        }));

        found.chapter_allocations = allocs;
        setPlan(found);
      } else {
        toast.error('Syllabus plan not found');
      }
    } catch (err) {
      console.error('Failed to load plan details:', err);
      toast.error('Error loading syllabus plan');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm font-bold text-slate-400">Loading syllabus plan & topics…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Syllabus Plan Not Found</h2>
        <button
          onClick={() => navigate('/school/admin/syllabus-planner')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700"
        >
          <ArrowLeft size={16} /> Back to Syllabus Planner
        </button>
      </div>
    );
  }

  const allocs = Array.isArray(plan.chapter_allocations) ? plan.chapter_allocations : [];
  // Case/whitespace-insensitive: an exact-string match here silently dropped
  // any chapter whose stored term didn't precisely equal one of these four
  // literals (different casing, a stray space, or a term that was simply
  // never set) from every section instead of showing it anywhere — the plan
  // and its total chapter count still showed, but nothing appeared under
  // any of the four unit/term headings. normTerm below also catches those
  // into an "Other" section so a mismatch is visible, not silently dropped.
  const normTerm = (t) => String(t || '').trim().toLowerCase();
  const unit1Chs = allocs.filter(a => normTerm(a.term) === 'unit 1');
  const term1Chs = allocs.filter(a => normTerm(a.term) === 'term 1');
  const unit2Chs = allocs.filter(a => normTerm(a.term) === 'unit 2');
  const term2Chs = allocs.filter(a => normTerm(a.term) === 'term 2');
  const otherChs = allocs.filter(a => !['unit 1', 'term 1', 'unit 2', 'term 2'].includes(normTerm(a.term)));

  const totalTopicsCount = allocs.reduce((acc, c) => acc + (Array.isArray(c.topics) ? c.topics.length : 0), 0);

  const handleOpenTopicModal = (t, plannedPeriodsForTopic = 2) => {
    const currentStatus = t.status || 'pending';
    setUpdatingTopic({ ...t, plannedPeriodsForTopic });
    setTopicProgressForm({
      status: currentStatus,
      progress: t.progress ?? (currentStatus === 'completed' ? 100 : 0),
      actualPeriods: t.actualPeriods ?? (currentStatus === 'pending' ? 0 : (t.periods || 1)),
      remarks: t.remarks || '',
      delayReason: t.delayReason || '',
      carryForwardDate: t.carryForwardDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      startDate: t.startDate || new Date().toISOString().split('T')[0],
      completionDate: t.completionDate || (currentStatus === 'completed' ? new Date().toISOString().split('T')[0] : '')
    });
  };

  const handleAddTopicToChapter = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || !addingTopicChapter) return;
    setSubmittingTopic(true);
    try {
      await api.patch(`/syllabus/plans/${planId}/progress`, {
        chapterId: addingTopicChapter.chapterId || addingTopicChapter.chapterName,
        newTopicName: newTopicName.trim(),
        periods: parseInt(newTopicPeriods, 10) || 2
      });
      toast.success('New topic added to syllabus plan successfully!');
      setAddingTopicChapter(null);
      setNewTopicName('');
      setNewTopicPeriods(2);
      fetchPlan();
    } catch (err) {
      console.error('Failed to add topic to chapter:', err);
      toast.error('Failed to add topic to plan');
    } finally {
      setSubmittingTopic(false);
    }
  };

  const handleSaveTopicProgress = async () => {
    if (!updatingTopic) return;
    try {
      const topicIdToUpdate = updatingTopic.topicId || updatingTopic.id;
      const topicNameToUpdate = (updatingTopic.topicName || updatingTopic.name || '').trim().toLowerCase();
      const updatedStatus = topicProgressForm.status;
      const updatedProgress = parseInt(topicProgressForm.progress, 10) || 0;
      const updatedActualPeriods = parseInt(topicProgressForm.actualPeriods, 10) || 1;

      await api.patch(`/syllabus/plans/${planId}/progress`, {
        topicId: topicIdToUpdate,
        topicName: updatingTopic.topicName || updatingTopic.name,
        chapterId: updatingTopic.chapterId,
        chapterName: updatingTopic.chapterName,
        status: updatedStatus,
        progress: updatedProgress,
        actualPeriods: updatedActualPeriods,
        remarks: topicProgressForm.remarks,
        delayReason: updatedStatus !== 'completed' ? topicProgressForm.delayReason : null,
        carryForwardDate: updatedStatus !== 'completed' ? topicProgressForm.carryForwardDate : null,
        startDate: topicProgressForm.startDate,
        completionDate: updatedStatus === 'completed' ? (topicProgressForm.completionDate || new Date().toISOString().split('T')[0]) : null
      });

      // Optimistically update local plan state so UI reflects changes immediately without relying solely on refetching
      if (plan && Array.isArray(plan.chapter_allocations)) {
        const updatedAllocations = plan.chapter_allocations.map((ch) => {
          const topics = Array.isArray(ch.topics) ? ch.topics : [];
          const updatedTopics = topics.map((t) => {
            const tId = String(t.topicId || t.id || '').trim();
            const tName = String(t.topicName || t.name || '').trim().toLowerCase();
            const isMatch = (tId && String(topicIdToUpdate) === tId) || (tName && topicNameToUpdate && tName === topicNameToUpdate);
            if (isMatch) {
              return {
                ...t,
                status: updatedStatus,
                progress: updatedProgress,
                actualPeriods: updatedActualPeriods,
                remarks: topicProgressForm.remarks,
                delayReason: updatedStatus !== 'completed' ? topicProgressForm.delayReason : null,
                carryForwardDate: updatedStatus !== 'completed' ? topicProgressForm.carryForwardDate : null
              };
            }
            return t;
          });
          return { ...ch, topics: updatedTopics };
        });
        setPlan({ ...plan, chapter_allocations: updatedAllocations });
      }

      toast.success(
        updatedStatus === 'completed' 
          ? 'Topic marked as completed!' 
          : 'Topic set as In Progress / Partial and carried forward as pending.'
      );
      setUpdatingTopic(null);
      fetchPlan(true);
    } catch (err) {
      console.error('Failed to update topic progress:', err);
      toast.error('Failed to update topic progress');
    }
  };

  const isTeacherView = typeof window !== 'undefined' && window.location.pathname.includes('/school/teacher');

  const renderChapterCard = (c, i, accentColor) => {
    const topics = Array.isArray(c.topics) ? c.topics : [];
    const chapterPeriods = c.periods || c.plannedPeriods || (topics.length > 0 ? topics.length * 2 : 4);
    const plannedPeriodsPerTopic = Math.max(1, Math.ceil(chapterPeriods / Math.max(1, topics.length)));
    const completedTopicsCount = topics.filter(t => t.status === 'completed' || t.progress >= 100).length;
    const isChapterFullyCompleted = topics.length > 0 && completedTopicsCount === topics.length;

    return (
      <div key={c.chapterId || i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Chapter {i + 1}: {c.chapterName}
            </h4>
            {isChapterFullyCompleted && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Completed
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isTeacherView && (
              <button
                type="button"
                onClick={() => {
                  setAddingTopicChapter(c);
                  setNewTopicName('');
                  setNewTopicPeriods(2);
                }}
                className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1 shadow-xs"
              >
                <Plus size={11} /> Add Topic
              </button>
            )}
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
              <Clock size={11} /> {chapterPeriods} Periods
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {topics.length > 0 ? `${completedTopicsCount}/${topics.length} Done` : 'All Topics Included'}
            </span>
          </div>
        </div>

        {topics.length > 0 ? (
          <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-800">
            {topics.map((t, tIdx) => {
              const isTopicDone = t.status === 'completed' || t.progress >= 100;
              const isPending = !t.status || t.status === 'pending';
              const topicProg = t.progress ?? (isTopicDone ? 100 : 0);
              const actualP = t.actualPeriods ?? (isPending ? 0 : (t.periods || 0));

              return (
                <div key={t.topicId || tIdx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-850 gap-2">
                  <div className="space-y-1">
                    <span className="flex items-center gap-2">
                      <span className={isTopicDone ? "text-emerald-500 font-bold" : "text-blue-500 font-bold"}>•</span>
                      <span className={isTopicDone ? "line-through text-slate-400 font-bold" : "font-bold text-slate-900 dark:text-white"}>
                        Topic {tIdx + 1}: {t.topicName || t.name}
                      </span>
                    </span>
                    {(t.remarks || t.actualPeriods || t.progress !== undefined || t.delayReason) && (
                      <div className="flex flex-wrap items-center gap-2 pl-4 text-[10px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-extrabold text-blue-600 dark:text-blue-400">
                          Progress: {topicProg}%
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold">
                          Spent: {actualP} Periods
                        </span>
                        {!isTopicDone && topicProg > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-extrabold border border-amber-200">
                            Carried Forward (Pending Execution)
                          </span>
                        )}
                        {t.delayReason && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold italic">
                            Reason: {t.delayReason}
                          </span>
                        )}
                        {t.remarks && <span className="italic text-slate-400">"{t.remarks}"</span>}
                      </div>
                    )}
                  </div>

                  {isTeacherView ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTopicModal({ ...t, chapterId: c.chapterId, chapterName: c.chapterName }, plannedPeriodsPerTopic)}
                        className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition-all flex items-center gap-1"
                      >
                        <Edit3 size={13} /> Update Progress & Details
                      </button>

                      {!isTopicDone && (
                        <button
                          type="button"
                          onClick={() => {
                            setTopicProgressForm({
                              status: 'completed',
                              progress: 100,
                              actualPeriods: t.actualPeriods || 2,
                              remarks: 'Finished topic coverage',
                              startDate: new Date().toISOString().split('T')[0],
                              completionDate: new Date().toISOString().split('T')[0]
                            });
                            setUpdatingTopic(t);
                          }}
                          className="text-[11px] font-black px-3 py-1.5 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all flex items-center gap-1"
                        >
                          <CheckCircle2 size={13} /> Mark Done
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-end gap-1 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">{topicProg}% Completed</span>
                        <span className="font-bold text-slate-500">({actualP} Periods Spent)</span>
                        {/* Overrun badge: shown when actual periods exceed per-topic planned share */}
                        {typeof actualP === 'number' && actualP > plannedPeriodsPerTopic && (
                          <span className="font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                            <AlertCircle size={10} /> Overrun: +{actualP - plannedPeriodsPerTopic} Periods
                          </span>
                        )}
                        <span className={`font-black px-2.5 py-1 rounded-lg ${isTopicDone ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : (t.status === 'in_progress' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300')}`}>
                          {isTopicDone ? 'Completed' : t.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      {!isTopicDone && topicProg > 0 && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          ⚡ Carried forward as pending execution
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic pl-4 border-l-2 border-slate-200 dark:border-slate-800">
            All curriculum sub-topics covered in this milestone.
          </p>
        )}
      </div>
    );
  };

  const totalAllocatedPeriods = allocs.reduce((acc, c) => acc + (parseInt(c.periods || c.plannedPeriods, 10) || 4), 0);
  const displayTotalPeriods = totalAllocatedPeriods > 0 ? totalAllocatedPeriods : (plan.planned_periods || 1);

  return (
    <div className="space-y-6 font-poppins pb-12">
      {/* Header & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <div className="space-y-2">
          <button
            onClick={() => isTeacherView ? navigate('/school/teacher/teaching-plan') : navigate('/school/admin/syllabus-planner')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors mb-1"
          >
            <ArrowLeft size={15} /> {isTeacherView ? 'Back to My Teaching Plan' : 'Back to Syllabus Planner'}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600 text-white">
              {plan.class_name} {plan.section_name ? `(${plan.section_name})` : ''}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Session {plan.academic_year || '2025-2026'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-950 dark:text-white">
            {plan.subject_name} — Annual Syllabus Plan
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Assigned Teacher: <span className="font-bold text-slate-800 dark:text-slate-200">{plan.teacher_name || 'Unassigned'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {!isTeacherView ? (
            <button
              onClick={() => navigate(`/school/admin/syllabus-planner?editId=${plan.id}`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-all"
            >
              <Edit3 size={15} /> Edit Targets
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
              <Shield size={14} /> Official Admin Plan
            </span>
          )}
        </div>
      </div>

      {/* Overview Stat Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <BookOpen size={16} className="text-blue-500" /> Total Chapters
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white">{allocs.length} Chapters</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <ListTree size={16} className="text-emerald-500" /> Total Topics
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{totalTopicsCount} Topics</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Clock size={16} className="text-indigo-500" /> Planned Periods
          </div>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{displayTotalPeriods} Periods</span>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Calendar size={16} className="text-amber-500" /> Target Schedule
          </div>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
            {plan.planned_start_date ? new Date(plan.planned_start_date).toLocaleDateString() : 'N/A'} - {plan.planned_completion_date ? new Date(plan.planned_completion_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>

      {/* Complete Exam Milestones Breakdown with Chapters and Topics */}
      <div className="space-y-6">
        {/* Unit 1 */}
        <div className="rounded-3xl border border-blue-200 bg-white p-6 dark:border-blue-950 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-600" />
              <h2 className="text-base font-black uppercase text-blue-900 dark:text-blue-100">
                Unit 1 (Periodic Test 1)
              </h2>
            </div>
            <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
              {unit1Chs.length} Chapters Mapped
            </span>
          </div>

          {unit1Chs.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic">No chapters assigned to Unit 1 yet.</p>
          ) : (
            <div className="grid gap-4">
              {unit1Chs.map((c, i) => renderChapterCard(c, i, 'bg-blue-600'))}
            </div>
          )}
        </div>

        {/* Term 1 */}
        <div className="rounded-3xl border border-indigo-200 bg-white p-6 dark:border-indigo-950 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
              <h2 className="text-base font-black uppercase text-indigo-900 dark:text-indigo-100">
                Term 1 (Half Yearly / Mid Term)
              </h2>
            </div>
            <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
              {term1Chs.length} Chapters Mapped
            </span>
          </div>

          {term1Chs.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic">No chapters assigned to Term 1 yet.</p>
          ) : (
            <div className="grid gap-4">
              {term1Chs.map((c, i) => renderChapterCard(c, i, 'bg-indigo-600'))}
            </div>
          )}
        </div>

        {/* Unit 2 */}
        <div className="rounded-3xl border border-purple-200 bg-white p-6 dark:border-purple-950 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-purple-600" />
              <h2 className="text-base font-black uppercase text-purple-900 dark:text-purple-100">
                Unit 2 (Periodic Test 2)
              </h2>
            </div>
            <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-3 py-1 rounded-full">
              {unit2Chs.length} Chapters Mapped
            </span>
          </div>

          {unit2Chs.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic">No chapters assigned to Unit 2 yet.</p>
          ) : (
            <div className="grid gap-4">
              {unit2Chs.map((c, i) => renderChapterCard(c, i, 'bg-purple-600'))}
            </div>
          )}
        </div>

        {/* Term 2 */}
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 dark:border-emerald-950 dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-600" />
              <h2 className="text-base font-black uppercase text-emerald-900 dark:text-emerald-100">
                Term 2 (Final Examination)
              </h2>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full">
              {term2Chs.length} Chapters Mapped
            </span>
          </div>

          {term2Chs.length === 0 ? (
            <p className="text-xs font-semibold text-slate-400 italic">No chapters assigned to Term 2 yet.</p>
          ) : (
            <div className="grid gap-4">
              {term2Chs.map((c, i) => renderChapterCard(c, i, 'bg-emerald-600'))}
            </div>
          )}
        </div>

        {/* Other — chapters whose stored term doesn't match any of the four
            standard buckets above. Shown rather than silently dropped, since
            that silent-drop is exactly what made a plan with chapters look
            like it had none. */}
        {otherChs.length > 0 && (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 dark:border-amber-950 dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-600" />
                <h2 className="text-base font-black uppercase text-amber-900 dark:text-amber-100">
                  Other / Unassigned Term
                </h2>
              </div>
              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full">
                {otherChs.length} Chapters Mapped
              </span>
            </div>
            <div className="grid gap-4">
              {otherChs.map((c, i) => renderChapterCard(c, i, 'bg-amber-600'))}
            </div>
          </div>
        )}
      </div>

      {/* UPDATE TOPIC PROGRESS & DETAILS MODAL FOR TEACHER */}
      {updatingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 font-poppins">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Update Topic Execution & Progress</h3>
                <p className="text-xs text-slate-500">{updatingTopic.topicName || updatingTopic.name}</p>
              </div>
              <button
                onClick={() => setUpdatingTopic(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Execution Status *</label>
                <select
                  value={topicProgressForm.status}
                  onChange={e => {
                    const st = e.target.value;
                    setTopicProgressForm(f => ({
                      ...f,
                      status: st,
                      progress: st === 'completed' ? 100 : (st === 'pending' ? 0 : (f.progress || 50)),
                      actualPeriods: st === 'pending' ? 0 : (f.actualPeriods || 1)
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="pending">Pending / Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed (Mark Done)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Completion Progress (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={topicProgressForm.progress}
                    onChange={e => setTopicProgressForm(f => ({ ...f, progress: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Actual Periods Spent *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={topicProgressForm.actualPeriods}
                    onChange={e => setTopicProgressForm(f => ({ ...f, actualPeriods: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              {/* Overrun warning — shown live as teacher types */}
              {updatingTopic && topicProgressForm.actualPeriods > (updatingTopic.plannedPeriodsForTopic || 2) && (
                <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-extrabold">Exceeds planned periods</p>
                    <p className="text-[11px] font-semibold mt-0.5">
                      Planned: <strong>{updatingTopic.plannedPeriodsForTopic || 2} periods</strong> — you are spending <strong>{topicProgressForm.actualPeriods} periods</strong>, which is <strong>+{topicProgressForm.actualPeriods - (updatingTopic.plannedPeriodsForTopic || 2)}</strong> over budget. This will be flagged to the admin.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Execution Remarks & Class Notes</label>
                <textarea
                  rows="2"
                  value={topicProgressForm.remarks}
                  onChange={e => setTopicProgressForm(f => ({ ...f, remarks: e.target.value }))}
                  placeholder="e.g. Completed theory & solved exercise problems with students..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Carry Forward & Delay Reason fields if topic is not fully completed */}
              {topicProgressForm.status !== 'completed' && topicProgressForm.progress < 100 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-3">
                  <div className="flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-200 text-xs">
                    <AlertCircle size={15} /> Carry Forward & Delay Reason
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 text-[11px] mb-1">Reason for Non-Completion / Partial Progress *</label>
                    <input
                      type="text"
                      value={topicProgressForm.delayReason}
                      onChange={e => setTopicProgressForm(f => ({ ...f, delayReason: e.target.value }))}
                      placeholder="e.g. Doubts clarification took extra time, sports assembly delay..."
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-900 dark:text-amber-300 text-[11px] mb-1">Carried Forward Rescheduled Date</label>
                    <input
                      type="date"
                      value={topicProgressForm.carryForwardDate}
                      onChange={e => setTopicProgressForm(f => ({ ...f, carryForwardDate: e.target.value }))}
                      className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold outline-none dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setUpdatingTopic(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTopicProgress}
                className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Save & Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD NEW TOPIC TO CHAPTER MODAL FOR TEACHER */}
      {addingTopicChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleAddTopicToChapter} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4 font-poppins">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Add Topic to Syllabus Plan</h3>
                <p className="text-xs text-slate-500">Chapter: {addingTopicChapter.chapterName}</p>
              </div>
              <button
                type="button"
                onClick={() => setAddingTopicChapter(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="e.g. Sub-topic 3: Practice Problem Solving"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Allocated Periods *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTopicPeriods}
                  onChange={e => setNewTopicPeriods(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 font-semibold outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAddingTopicChapter(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingTopic}
                className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingTopic ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Topic to Plan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
