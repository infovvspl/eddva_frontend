import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { BarChart3, TrendingUp, Target, BrainCircuit, Activity, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Analytics() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [performance, setPerformance] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/my-analytics');
      const data = res.data?.data || null;
      setPerformance(data);
      setInsights(data?.insights || null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setPerformance(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !performance) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 px-3 pb-20 sm:space-y-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" /> Performance Analytics
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Track your learning progress and get AI insights.</p>
        </div>
        {performance?.profile && (
          <div className="rounded-lg sm:rounded-xl border border-slate-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 w-fit">
            {[performance.profile.class_name, performance.profile.section_name].filter(Boolean).join(' - ')}
          </div>
        )}
      </div>

      {(!performance || performance.questionsAttempted === 0) && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-[2rem] border border-slate-100 border-dashed bg-white p-8 sm:p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Activity className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">No analytics available</h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Your analytics will appear after your teacher publishes assessment results.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          
          {/* Key Metrics */}
          <div className="md:col-span-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Target className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.overallAccuracy || 0}%</p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <TrendingUp className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-emerald-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Practiced</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.questionsAttempted || 0}</p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Clock className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Study Time</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                {Math.floor((performance?.totalTimeSpentSeconds || 0) / 3600)}h
              </p>
            </div>
            
            <div className="flex flex-col rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Activity className="mb-1.5 h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Streak</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5">{performance?.streakDays || 0} days</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            {/* Subject Mastery */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 sm:mb-6 text-base sm:text-lg font-black text-slate-900 dark:text-white">Subject Mastery</h2>
              
              <div className="space-y-4 sm:space-y-6">
                {performance?.subjectPerformance?.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500">Not enough data to calculate mastery.</p>
                ) : (
                  performance?.subjectPerformance?.map((sub, i) => (
                    <div key={i}>
                      <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm font-bold">
                        <span className="text-slate-700 dark:text-slate-300">{sub.subjectName}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{sub.accuracy}%</span>
                      </div>
                      <div className="h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className="h-full rounded-full bg-indigo-600 transition-all duration-1000" 
                          style={{ width: `${sub.accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* AI Insights */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-6 shadow-sm dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-slate-900">
              <h2 className="mb-3 text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="text-indigo-600 h-5 w-5 sm:h-6 sm:w-6" /> AI Learning Insights
              </h2>
              
              {insights?.summary ? (
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {insights.summary}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500">More data needed to generate personalized AI insights.</p>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Weak Areas */}
            <div className="rounded-2xl sm:rounded-[2rem] border border-slate-100 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3.5 text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500 h-5 w-5 sm:h-6 sm:w-6" /> Focus Areas
              </h2>
              
              <div className="space-y-2.5 sm:space-y-3">
                {performance?.weakTopics?.length === 0 ? (
                  <p className="text-xs sm:text-sm text-slate-500">No weak areas identified yet. Keep up the good work!</p>
                ) : (
                  performance?.weakTopics?.map((topic, i) => (
                    <div key={i} className="rounded-xl border border-rose-100 bg-rose-50 p-2.5 sm:p-3 dark:border-rose-900/30 dark:bg-rose-900/10">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{topic.name}</p>
                      <p className="mt-1 flex items-center justify-between text-[10px] sm:text-xs font-semibold">
                        <span className="text-slate-500">{topic.subjectName}</span>
                        <span className="text-rose-600">{topic.accuracy}% accuracy</span>
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              {performance?.weakTopics?.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/school/student/planner')}
                  className="mt-4 w-full rounded-xl bg-slate-900 py-2.5 text-xs sm:text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Practice Weak Topics
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
