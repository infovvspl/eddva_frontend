import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { ChevronLeft, Trophy, Target, AlertTriangle, CheckCircle2, Clock, BarChart3, TrendingUp, XCircle } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function SessionResult() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/assessments/sessions/${id}/result`);
        setResult(res.data);
      } catch (error) {
        console.error('Failed to fetch session result:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Result not found</h2>
        <Link to="/school/student/assessments" className="mt-4 text-sm font-bold text-blue-600 hover:underline">Back to Assessments</Link>
      </div>
    );
  }

  const { session, analysis } = result;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link to="/school/student/assessments" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
          <ChevronLeft size={16} />
          Back to Assessments
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Assessment Result</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">{session.mockTest?.title}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 dark:bg-slate-800">
            <Clock size={16} />
            {Math.floor((session.durationSeconds || 0)/60)} mins taken
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* KPI Cards */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Score</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{session.totalScore || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{session.accuracy || 0}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Correct</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{session.correctCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Incorrect</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{session.incorrectCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Detailed Analysis */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="text-blue-600" /> Subject-wise Performance
            </h2>
            
            <div className="space-y-6">
              {analysis?.subjectPerformance?.map((sub, i) => (
                <div key={i}>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{sub.subjectName}</span>
                    <span className="text-blue-600">{sub.accuracy}% Accuracy</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div 
                      className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${sub.accuracy}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-4 text-xs font-semibold text-slate-500">
                    <span>{sub.correct} Correct</span>
                    <span>{sub.incorrect} Incorrect</span>
                    <span>{sub.unanswered} Unanswered</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:to-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-black text-slate-900 dark:text-white">AI Recommendations</h2>
            </div>
            
            {analysis?.weakTopics?.length > 0 ? (
              <ul className="space-y-4">
                {analysis.weakTopics.map((topic, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                      !
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">Review {topic.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{topic.accuracy}% accuracy in this test.</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-slate-500">Great job! You performed well across all topics in this test.</p>
            )}
            
            <button className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
              Generate Practice Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
