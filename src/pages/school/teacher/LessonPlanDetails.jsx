// LessonPlanDetails - Dedicated full-page view for one lesson plan / AI brief
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, Calendar, BookOpen } from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import LessonCompletionModal from '@/components/school/teacher/LessonCompletionModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const DETAIL_FIELDS = [
  ['Learning Objectives', 'learning_objectives'],
  ['Previous Knowledge', 'previous_knowledge'],
  ['Teaching Methodology', 'teaching_methodology'],
  ['Teaching Activities', 'teaching_activities'],
  ['Teaching Resources', 'teaching_resources'],
  ['Digital Resources', 'digital_resources'],
  ['Classroom Activities', 'classroom_activities'],
  ['Assessment Method', 'assessment_method'],
  ['Homework', 'homework'],
  ['Expected Learning Outcomes', 'expected_learning_outcomes'],
  ['Teacher Notes', 'teacher_notes'],
];

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
      <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-48" />
        <Card className="space-y-4 rounded-3xl border-slate-200 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Separator />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-md space-y-4 rounded-3xl border-dashed border-slate-200 p-8 text-center shadow-none dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Lesson Plan Not Found</h2>
          <Button
            onClick={() => navigate('/school/teacher/teaching-plan')}
            className="h-auto w-full gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 sm:w-auto"
          >
            <ArrowLeft size={16} /> Back to My Teaching Plan
          </Button>
        </Card>
      </div>
    );
  }

  const isDone = lesson.status === 'COMPLETED';
  const details = DETAIL_FIELDS.filter(([, key]) => lesson[key]);

  return (
    <div className="w-full space-y-6 px-4 py-6 font-poppins sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/school/teacher/teaching-plan')}
        className="h-auto gap-2 p-0 text-xs font-bold text-slate-600 hover:bg-transparent hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
      >
        <ArrowLeft size={15} /> Back to My Teaching Plan
      </Button>

      <Card className="rounded-3xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex-col gap-4 space-y-0 p-4 pb-4 sm:flex-row sm:items-start sm:justify-between sm:p-6 sm:pb-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                {lesson.class_name} {lesson.section_name ? `(${lesson.section_name})` : ''}
              </span>
              <Badge
                variant="outline"
                className={`border-transparent px-2 py-0.5 text-[10px] font-black uppercase ${isDone ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'}`}
              >
                {isDone ? 'Completed' : (lesson.status || 'Scheduled')}
              </Badge>
            </div>
            <CardTitle className="text-xl font-black leading-snug tracking-normal text-slate-900 dark:text-white">
              {lesson.subject_name || 'Subject'}
            </CardTitle>
            {lesson.chapter_name && (
              <p className="text-xs font-semibold text-slate-500">Chapter: <strong className="text-slate-800 dark:text-slate-200">{lesson.chapter_name}</strong></p>
            )}
            {lesson.topic_name && (
              <p className="text-xs font-semibold text-slate-500">Topic: <strong className="text-slate-800 dark:text-slate-200">{lesson.topic_name}</strong></p>
            )}
            <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Calendar size={13} className="shrink-0" />
              {lesson.date ? new Date(lesson.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              {lesson.duration_periods ? ` · ${lesson.duration_periods} period${lesson.duration_periods === 1 ? '' : 's'}` : ''}
            </p>
          </div>

          {!isDone && (
            <Button
              onClick={() => setCompletionModalOpen(true)}
              className="h-auto w-full shrink-0 gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 sm:w-auto"
            >
              <CheckCircle2 size={15} /> Mark Complete
            </Button>
          )}
        </CardHeader>

        <Separator className="bg-slate-100 dark:bg-slate-800" />

        <CardContent className="space-y-4 p-4 pt-4 sm:p-6 sm:pt-5">
          {lesson.ai_brief ? (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Sparkles size={16} className="text-blue-600 dark:text-blue-400" /> AI-Generated Brief
              </h3>
              <Card className="overflow-x-auto rounded-2xl border-slate-200 bg-slate-50 p-4 shadow-none dark:border-slate-800 dark:bg-slate-950 sm:p-5">
                <MarkdownRenderer content={lesson.ai_brief} className="prose prose-sm dark:prose-invert max-w-none" />
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <BookOpen size={16} className="text-emerald-600 dark:text-emerald-400" /> Lesson Details
              </h3>
              {details.length === 0 ? (
                <Card className="rounded-2xl border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400 shadow-none dark:border-slate-800">
                  No lesson details were added for this plan.
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {details.map(([label, key]) => (
                    <Card key={key} className="rounded-2xl border-slate-100 bg-slate-50/60 p-4 shadow-none dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
                      <p className="whitespace-pre-wrap break-words text-xs text-slate-600 dark:text-slate-400">{lesson[key]}</p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
