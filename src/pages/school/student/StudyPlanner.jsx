import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';
import { Calendar as CalendarIcon, CheckCircle2, Clock, PlayCircle, BookOpen, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function StudyPlanner() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [todayTasks, setTodayTasks] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchPlanData(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/study-plans/courses');
      setCourses(res.data || []);
      if (res.data?.length > 0) {
        setSelectedCourse(res.data[0].batchId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch study planner courses:', error);
      setLoading(false);
    }
  };

  const fetchPlanData = async (batchId) => {
    setLoading(true);
    try {
      const [todayRes, nextRes] = await Promise.all([
        api.get(`/study-plans/today?batchId=${batchId}`),
        api.get(`/study-plans/next-action?batchId=${batchId}`)
      ]);
      setTodayTasks(todayRes.data?.items || []);
      setNextAction(nextRes.data || null);
    } catch (error) {
      console.error('Failed to fetch plan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!selectedCourse) return;
    setGenerating(true);
    try {
      await api.post('/study-plans/generate', {
        batchId: selectedCourse,
        examTarget: 'General',
        dailyHours: 2,
        examYear: new Date().getFullYear() + 1
      });
      fetchPlanData(selectedCourse);
    } catch (error) {
      console.error('Failed to generate study plan:', error);
      alert('Could not generate plan. Please try again later.');
    } finally {
      setGenerating(false);
    }
  };

  const markItemComplete = async (itemId) => {
    try {
      await api.patch(`/study-plans/items/${itemId}/complete`);
      fetchPlanData(selectedCourse);
    } catch (error) {
      console.error('Failed to complete item:', error);
    }
  };

  const skipItem = async (itemId) => {
    try {
      await api.patch(`/study-plans/items/${itemId}/skip`);
      fetchPlanData(selectedCourse);
    } catch (error) {
      console.error('Failed to skip item:', error);
    }
  };

  if (loading && !courses.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const currentCourse = courses.find(c => c.batchId === selectedCourse);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" /> AI Study Planner
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Your personalized path to mastering the curriculum.</p>
        </div>
        
        {courses.length > 0 && (
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-xl border-slate-200 bg-white py-2 pl-4 pr-10 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            {courses.map(course => (
              <option key={course.batchId} value={course.batchId}>
                {course.batchName}
              </option>
            ))}
          </select>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No active courses</h3>
          <p className="mt-1 text-sm text-slate-500">Enroll in a course to generate a personalized study plan.</p>
        </div>
      ) : !currentCourse?.hasActivePlan ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-12 text-center shadow-sm dark:border-indigo-900/30 dark:from-slate-900 dark:to-slate-900">
          <CalendarIcon className="mb-6 h-16 w-16 text-indigo-600" />
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Generate Your Study Plan</h3>
          <p className="mt-2 max-w-md text-sm font-medium text-slate-500">
            Let our AI analyze your curriculum and create a personalized daily study schedule tailored to your pace.
          </p>
          <button 
            onClick={generatePlan}
            disabled={generating}
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20 disabled:opacity-50"
          >
            {generating ? <RefreshCw className="animate-spin" size={20} /> : <PlayCircle size={20} />}
            {generating ? 'Generating Plan...' : 'Generate AI Plan'}
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Area: Next Action & Today's Tasks */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Next Action Focus */}
            {nextAction && (
              <div className="rounded-[2rem] border border-indigo-200 bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white shadow-lg">
                <span className="rounded-lg bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  Up Next
                </span>
                <h3 className="mt-4 text-2xl font-black">{nextAction.title}</h3>
                <p className="mt-2 text-sm font-medium text-indigo-100">
                  {nextAction.type === 'lecture' ? 'Watch Lecture' : 
                   nextAction.type === 'practice' ? 'Practice Questions' : 'Review Topic'} 
                  - {nextAction.durationMinutes} mins
                </p>
                <div className="mt-6 flex gap-3">
                  <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-50">
                    <PlayCircle size={18} /> Start Learning
                  </button>
                </div>
              </div>
            )}

            {/* Today's Tasks */}
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="text-slate-400" /> Today's Schedule
              </h2>
              
              <div className="space-y-4">
                {todayTasks.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 py-4">You've completed all tasks for today. Great job!</p>
                ) : (
                  todayTasks.map(task => (
                    <div key={task.id} className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/50">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          task.status === 'completed' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" :
                          "bg-white text-indigo-600 shadow-sm dark:bg-slate-800"
                        )}>
                          {task.status === 'completed' ? <CheckCircle2 size={20} /> : <BookOpen size={20} />}
                        </div>
                        <div>
                          <h4 className={cn(
                            "text-sm font-bold",
                            task.status === 'completed' ? "text-slate-500 line-through dark:text-slate-500" : "text-slate-900 dark:text-white"
                          )}>
                            {task.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-slate-500">
                            <span className="uppercase tracking-wider">{task.type}</span>
                            <span>-</span>
                            <span>{task.durationMinutes} mins</span>
                            {task.xpReward > 0 && (
                              <>
                                <span>-</span>
                                <span className="text-amber-500">+{task.xpReward} XP</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {task.status !== 'completed' && (
                        <div className="flex shrink-0 gap-2 sm:flex-col lg:flex-row">
                          <button 
                            onClick={() => markItemComplete(task.id)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                          >
                            <CheckCircle2 size={14} /> Done
                          </button>
                          <button 
                            onClick={() => skipItem(task.id)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Plan Overview */}
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white">Plan Overview</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Overall Progress</span>
                    <span className="text-indigo-600">{currentCourse.progressPercent || 0}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div 
                      className="h-full rounded-full bg-indigo-600" 
                      style={{ width: `${currentCourse.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
                
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-amber-500" size={20} />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">You're on track!</p>
                      <p className="text-xs font-semibold text-slate-500">Keep up the momentum to finish the syllabus by target date.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
