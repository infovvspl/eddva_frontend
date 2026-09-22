// LessonPlanDetails - Dedicated full-page view for one lesson plan / AI brief
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, Loader2, Calendar, BookOpen } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import LessonCompletionModal from '@/components/school/teacher/LessonCompletionModal';

export default function LessonPlanDetails() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);

  useEffect(() => {
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/syllabus/lessons/${lessonId}`);
      const data = res.data?.data ?? res.data;
      setLesson(data || null);
    } catch (err) {
      console.error('Failed to load lesson plan:', err);
      toast.error('Failed to load lesson plan');
      setLesson(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-400">Loading lesson plan…</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Lesson Plan Not Found</h2>
        <button
          onClick={() => navigate('/school/teacher/teaching-plan')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-md hover:bg-blue-700"
        >
          <ArrowLeft size={16} /> Back to My Teaching Plan
        </button>
      </div>
    );
  }

  const isDone = lesson.status === 'COMPLETED';

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6 font-poppins">
      <button
        onClick={() => navigate('/school/teacher/teaching-plan')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} /> Back to My Teaching Plan
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                {lesson.class_name} {lesson.section_name ? `(${lesson.section_name})` : ''}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${isDone ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}>
                {isDone ? 'Completed' : (lesson.status || 'Scheduled')}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">{lesson.subject_name || 'Subject'}</h1>
            {lesson.chapter_name && (
              <p className="text-xs text-slate-500 font-semibold">Chapter: <strong className="text-slate-800 dark:text-slate-200">{lesson.chapter_name}</strong></p>
            )}
            {lesson.topic_name && (
              <p className="text-xs text-slate-500 font-semibold">Topic: <strong className="text-slate-800 dark:text-slate-200">{lesson.topic_name}</strong></p>
            )}
            <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Calendar size={13} /> {lesson.date ? new Date(lesson.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              {lesson.duration_periods ? ` · ${lesson.duration_periods} period${lesson.duration_periods === 1 ? '' : 's'}` : ''}
            </p>
          </div>

          {!isDone && (
            <button
              onClick={() => setCompletionModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all"
            >
              <CheckCircle2 size={15} /> Mark Complete
            </button>
          )}
        </div>

        {lesson.ai_brief ? (
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" /> AI-Generated Brief
            </h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
              <MarkdownRenderer content={lesson.ai_brief} className="prose prose-sm dark:prose-invert max-w-none" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" /> Lesson Details
            </h3>
            {[
              ['Learning Objectives', lesson.learning_objectives],
              ['Previous Knowledge', lesson.previous_knowledge],
              ['Teaching Methodology', lesson.teaching_methodology],
              ['Teaching Activities', lesson.teaching_activities],
              ['Teaching Resources', lesson.teaching_resources],
              ['Digital Resources', lesson.digital_resources],
              ['Classroom Activities', lesson.classroom_activities],
              ['Assessment Method', lesson.assessment_method],
              ['Homework', lesson.homework],
              ['Expected Learning Outcomes', lesson.expected_learning_outcomes],
              ['Teacher Notes', lesson.teacher_notes],
            ].filter(([, value]) => value).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {completionModalOpen && (
        <LessonCompletionModal
          open={completionModalOpen}
          onClose={() => setCompletionModalOpen(false)}
          onSuccess={fetchLesson}
          lesson={lesson}
        />
      )}
    </div>
  );
}
