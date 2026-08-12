// SyllabusPlanDetailsPage - Dedicated Full Page View for Annual Subject Syllabus Plan
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Calendar, Clock, User, Layers, 
  Sparkles, CheckCircle2, AlertCircle, Edit3, Shield, ListTree, ChevronRight
} from 'lucide-react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { toast } from 'sonner';

export default function SyllabusPlanDetailsPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/plans');
      const allPlans = unwrapSchoolList(res);
      const found = allPlans.find(p => String(p.id) === String(planId));
      if (found) {
        let allocs = Array.isArray(found.chapter_allocations) ? found.chapter_allocations : [];
        
        // Fetch exact topics for each chapter and deduplicate by topic name
        allocs = await Promise.all(allocs.map(async (c) => {
          let topList = Array.isArray(c.topics) ? c.topics : [];
          if (c.chapterId) {
            try {
              const topRes = await api.get('/topics', { params: { chapterId: c.chapterId } }).catch(() => ({ data: [] }));
              topList = unwrapSchoolList(topRes).map(t => ({ topicId: t.id, topicName: t.name }));
            } catch {}
          }
          // Unique topics by name
          const uniqueMap = new Map();
          topList.forEach(t => {
            const name = (t.topicName || t.name || '').trim();
            if (name && !uniqueMap.has(name.toLowerCase())) {
              uniqueMap.set(name.toLowerCase(), { topicId: t.topicId || t.id, topicName: name });
            }
          });
          return { ...c, topics: Array.from(uniqueMap.values()) };
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
      setLoading(false);
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
  const unit1Chs = allocs.filter(a => a.term === 'Unit 1');
  const term1Chs = allocs.filter(a => a.term === 'Term 1');
  const unit2Chs = allocs.filter(a => a.term === 'Unit 2');
  const term2Chs = allocs.filter(a => a.term === 'Term 2');

  const totalTopicsCount = allocs.reduce((acc, c) => acc + (Array.isArray(c.topics) ? c.topics.length : 0), 0);

  const renderChapterCard = (c, i, accentColor) => {
    const rawTopics = Array.isArray(c.topics) ? c.topics : [];
    const uniqueMap = new Map();
    rawTopics.forEach(t => {
      const name = (t.topicName || t.name || '').trim();
      if (name && !uniqueMap.has(name.toLowerCase())) {
        uniqueMap.set(name.toLowerCase(), t);
      }
    });
    const topics = Array.from(uniqueMap.values());
    return (
      <div key={c.chapterId || i} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Chapter {i + 1}: {c.chapterName}
            </h4>
          </div>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            {topics.length > 0 ? `${topics.length} Topics` : 'All Topics Included'}
          </span>
        </div>

        {topics.length > 0 ? (
          <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-800">
            {topics.map((t, tIdx) => (
              <div key={t.topicId || tIdx} className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="flex items-center gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  Topic {tIdx + 1}: {t.topicName || t.name}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Included in Plan</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic pl-4 border-l-2 border-slate-200 dark:border-slate-800">
            All curriculum sub-topics covered in this milestone.
          </p>
        )}
      </div>
    );
  };

  const isTeacherView = window.location.pathname.includes('/school/teacher');

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
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{plan.planned_periods || 1} Periods</span>
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
      </div>
    </div>
  );
}
