import React from 'react';
import { BarChart3, TrendingUp, Target, BrainCircuit, Activity, Clock, AlertTriangle } from 'lucide-react';

export default function AnalyticsMobile({
  performance,
  insights,
  loading,
  fetchAnalytics,
}) {
  if (loading && !performance) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Performance Analytics...</p>
        </div>
      </div>
    );
  }

  const hasNoData = (!performance || performance.questionsAttempted === 0);

  return (
    <div className="space-y-6 pb-24">
      {hasNoData ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <Activity className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No analytics available yet</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Attempt some tests first!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <Target className="h-5 w-5 text-blue-500 mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Accuracy</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{performance?.overallAccuracy || 0}%</p>
            </div>
            
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <TrendingUp className="h-5 w-5 text-emerald-500 mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Questions</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{performance?.questionsAttempted || 0}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <Clock className="h-5 w-5 text-amber-500 mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Study Time</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                {Math.floor((performance?.totalTimeSpentSeconds || 0) / 3600)}h
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <Activity className="h-5 w-5 text-rose-500 mb-1" />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Streak</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{performance?.streakDays || 0} Days</p>
            </div>
          </div>

          {/* Subject Mastery Progress Bars */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">Subject Mastery</h3>
            <div className="space-y-4">
              {(performance?.subjectPerformance || []).map((sub, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>{sub.subjectName}</span>
                    <span>{sub.masteryLevel}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/40">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${sub.masteryLevel || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weakness Details list */}
          {insights && insights.weakTopics && insights.weakTopics.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
                <BrainCircuit size={16} className="text-indigo-600" />
                Key Focus Areas
              </h3>
              <div className="space-y-2">
                {insights.weakTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl bg-rose-50/40 p-3 text-xs border border-rose-100/50 dark:bg-rose-950/10 dark:border-rose-900/30"
                  >
                    <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                    <span className="font-bold text-rose-700 dark:text-rose-300 leading-tight">
                      {topic.topicName || topic}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
