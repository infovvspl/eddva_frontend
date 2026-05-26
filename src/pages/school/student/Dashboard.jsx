import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/SchoolAuthContext';
import api from '@/lib/api/school-client';
import { 
  Trophy, TrendingUp, Target, Calendar, 
  PlayCircle, Clock, BookOpen, AlertCircle, 
  ChevronRight, Award, Flame, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [continueLearning, setContinueLearning] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, contRes, actRes] = await Promise.all([
          api.get('/students/dashboard'),
          api.get('/students/continue-learning').catch(() => ({ data: null })),
          api.get('/students/activity/weekly').catch(() => ({ data: null }))
        ]);
        
        setDashboardData(dashRes.data);
        setContinueLearning(contRes.data);
        setActivity(actRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const {
    overallAccuracy = 0,
    currentStreak = 0,
    xpTotal = 0,
    globalRank,
    pendingLectures = 0,
    testsAttempted = 0,
    weakTopics = [],
    recommendations = [],
    todayPlan = []
  } = dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-8 text-white shadow-xl shadow-blue-900/20">
        <div className="relative z-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2">
            <h1 className="text-3xl font-black tracking-tight">Welcome back, {user?.name}! 👋</h1>
            <p className="mt-2 max-w-xl text-blue-100 font-medium leading-relaxed">
              You're on a {currentStreak}-day learning streak. Keep up the momentum! You have {pendingLectures} lectures pending and have attempted {testsAttempted} tests so far.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Current Streak</p>
                  <p className="text-lg font-bold">{currentStreak} Days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
                  <Star size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Total XP</p>
                  <p className="text-lg font-bold">{xpTotal} XP</p>
                </div>
              </div>

              {globalRank && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Global Rank</p>
                    <p className="text-lg font-bold">#{globalRank}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden items-center justify-center md:flex">
            {/* Can add 3D illustration or character here */}
          </div>
        </div>
        
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content Column */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Continue Learning */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Continue Learning</h2>
              <Link to="/school/student/classes" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">View All</Link>
            </div>
            
            {continueLearning ? (
              <div className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-2 shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:w-64 dark:bg-slate-800">
                    {continueLearning.thumbnailUrl ? (
                      <img src={continueLearning.thumbnailUrl} alt={continueLearning.lectureTitle} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-slate-300 dark:text-slate-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                        <PlayCircle className="h-8 w-8 ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 flex-col justify-center p-2 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {continueLearning.subjectName || 'Subject'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 truncate max-w-[150px]">
                        {continueLearning.chapterName || 'Chapter'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 mb-4">
                      {continueLearning.lectureTitle}
                    </h3>
                    
                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500">{continueLearning.watchPercentage}% completed</span>
                        <span className="text-xs font-bold text-slate-500">
                          {Math.floor(continueLearning.resumeAtSeconds / 60)}m left
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div 
                          className="h-full rounded-full bg-blue-600 transition-all duration-1000" 
                          style={{ width: `${continueLearning.watchPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <BookOpen className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to start?</h3>
                <p className="mt-1 text-sm text-slate-500">Pick a subject and begin your learning journey.</p>
                <Link to="/school/student/classes" className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20">
                  Browse Classes
                </Link>
              </div>
            )}
          </section>

          {/* Performance Overview */}
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{overallAccuracy}%</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400">
                  <PlayCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Lectures</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{pendingLectures}</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Action Items / Weak Topics */}
          {weakTopics.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Needs Attention</h2>
              </div>
              <div className="space-y-3">
                {weakTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between rounded-2xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/30 dark:bg-rose-900/10">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{topic.topicName}</p>
                        <p className="text-xs font-semibold text-slate-500">{topic.subjectName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-600 dark:text-rose-400">{topic.accuracy}%</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Study Planner / Today */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Today's Plan</h2>
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            
            {todayPlan && todayPlan.length > 0 ? (
              <div className="space-y-4">
                {todayPlan.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-blue-600" />
                      {index !== todayPlan.length - 1 && <div className="mt-2 h-full w-px bg-slate-100 dark:bg-slate-800" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.type} • {item.durationMinutes} min</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800">
                  <Calendar className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-500">No tasks scheduled for today.</p>
                <Link to="/school/student/planner" className="mt-4 inline-block text-xs font-bold text-blue-600 hover:text-blue-700">Go to Planner →</Link>
              </div>
            )}
          </div>
          
          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm dark:border-blue-900/30 dark:from-blue-950/20 dark:to-slate-900">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">AI Recommendations</h2>
              </div>
              <ul className="space-y-3">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
