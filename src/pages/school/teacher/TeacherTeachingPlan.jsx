import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Plus, Sparkles, 
  Layers, BookOpen, Loader2, ArrowRight, Play 
} from 'lucide-react';
import api from '@/lib/api/school-client';
import { toast } from 'sonner';
import LessonPlanFormModal from '@/components/school/teacher/LessonPlanFormModal';
import LessonCompletionModal from '@/components/school/teacher/LessonCompletionModal';
import LessonTemplatesModal from '@/components/school/teacher/LessonTemplatesModal';

export default function TeacherTeachingPlan() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false);

  const [selectedTimetableSlot, setSelectedTimetableSlot] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
    fetchTeachingPlan();
  }, []);

  const fetchTeachingPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get('/syllabus/teaching-plan');
      const resData = res.data?.data ?? res.data;
      if (resData) {
        setData(resData);
      }
    } catch (err) {
      console.error('Failed to load teaching plan:', err);
      toast.error('Failed to load teaching plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const summary = data?.summary || { totalLessons: 0, completedLessons: 0, pendingLessons: 0, completionPercentage: 0 };
  const timetable = data?.todayTimetable || [];
  const lessons = data?.lessons || [];

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Teaching Plan & Execution</h1>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-xs font-black border border-blue-200 dark:border-blue-800">
              Teacher Portal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Manage today's timetable sessions, draft lesson plans, and log classroom completion.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTemplatesModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all"
          >
            <Layers size={15} /> Templates
          </button>
          <button
            onClick={() => {
              setSelectedTimetableSlot(null);
              setCreateModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:brightness-110 transition-all"
          >
            <Plus size={15} /> Create Lesson Plan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Lesson Plans</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{summary.totalLessons}</p>
          <p className="text-xs text-slate-500 mt-2">Planned & scheduled sessions</p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Completed Sessions</p>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{summary.completedLessons}</p>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-2">{summary.completionPercentage}% Completion Rate</p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm dark:border-amber-900/30 dark:bg-amber-950/20">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending / Upcoming</p>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">{summary.pendingLessons}</p>
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-2">Awaiting classroom execution</p>
        </div>
      </div>

      {/* Today's Timetable Sessions */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Today's Scheduled Classes</h3>
              <p className="text-xs text-slate-500">Attach or launch lesson plans for today's timetable slots.</p>
            </div>
          </div>
        </div>

        {timetable.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No class periods scheduled for today.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {timetable.map(slot => (
              <div key={slot.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{slot.class_name} ({slot.section_name})</span>
                  <span className="text-[10px] font-bold text-slate-400">{slot.start_time} - {slot.end_time}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{slot.subject_name || 'Subject Period'}</h4>
                <button
                  onClick={() => {
                    setSelectedTimetableSlot(slot);
                    setCreateModalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus size={14} /> Attach / Edit Lesson Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Plans List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">All Lesson Plans</h3>
        {lessons.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No lesson plans created yet. Click "Create Lesson Plan" above to get started.</p>
        ) : (
          <div className="space-y-3">
            {lessons.map(l => (
              <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">{l.class_name} ({l.section_name})</span>
                    <span>•</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{l.subject_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${l.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{l.learning_objectives || 'No objectives specified'}</p>
                </div>

                {l.status !== 'COMPLETED' && (
                  <button
                    onClick={() => {
                      setSelectedLesson(l);
                      setCompletionModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0"
                  >
                    <CheckCircle2 size={14} /> Mark Completed
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <LessonPlanFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchTeachingPlan}
        initialTimetableSlot={selectedTimetableSlot}
      />

      <LessonCompletionModal
        isOpen={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        lesson={selectedLesson}
        onSuccess={fetchTeachingPlan}
      />

      <LessonTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
      />
    </div>
  );
}
