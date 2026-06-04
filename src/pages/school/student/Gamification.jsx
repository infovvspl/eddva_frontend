import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api/school-client';
import { Award, BookOpen, CheckCircle2, Medal, Star, Target, Trophy, UserCheck } from 'lucide-react';

const levels = ['Beginner', 'Learner', 'Scholar', 'Expert', 'Champion'];

export default function Gamification() {
  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, boardRes] = await Promise.all([
          api.get('/students/dashboard').catch(() => ({ data: null })),
          api.get('/battles/leaderboard').catch(() => ({ data: { rankings: [] } })),
        ]);
        setDashboard(dashRes.data || null);
        setLeaderboard(boardRes.data?.rankings || []);
      } catch (error) {
        console.error('Failed to fetch gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const xp = Number(dashboard?.xpTotal || 0);
  const levelIndex = Math.min(levels.length - 1, Math.floor(xp / 1000));
  const currentLevel = dashboard?.level || levels[levelIndex];
  const nextLevel = levels[Math.min(levels.length - 1, levelIndex + 1)];
  const levelProgress = Math.min(100, Math.round((xp % 1000) / 10));

  const rewards = useMemo(() => [
    { label: 'Class Consistency', detail: 'Attend live classes regularly', icon: UserCheck, earned: xp > 100 },
    { label: 'Homework Finisher', detail: 'Submit assignments before due date', icon: CheckCircle2, earned: xp > 250 },
    { label: 'Test Taker', detail: 'Complete assessments and practice tests', icon: Target, earned: xp > 500 },
    { label: 'Study Champion', detail: 'Maintain a strong weekly learning rhythm', icon: Trophy, earned: xp > 1000 },
  ], [xp]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Gamification Center</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Earn XP from classes, homework, tests, and attendance. Unlock badges, achievements, certificates, and ranks.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {currentLevel}
              </span>
              <span className="text-sm font-bold text-slate-500">Next level: {nextLevel}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{xp} XP</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">{levelProgress}% progress toward the next level.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <Star className="h-5 w-5 text-amber-500" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">XP</p>
              <p className="text-xl font-black text-slate-950 dark:text-white">{xp}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <Trophy className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Rank</p>
              <p className="text-xl font-black text-slate-950 dark:text-white">{dashboard?.globalRank ? `#${dashboard.globalRank}` : '-'}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <Award className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Badges</p>
              <p className="text-xl font-black text-slate-950 dark:text-white">{dashboard?.badges || rewards.filter((r) => r.earned).length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <Medal className="h-5 w-5 text-violet-600" />
              <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Level</p>
              <p className="text-xl font-black text-slate-950 dark:text-white">{levelIndex + 1}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Rewards</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Badges and achievements based on learning behavior.</p>
            </div>
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {rewards.map((reward) => (
              <div key={reward.label} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${reward.earned ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    <reward.icon className="h-5 w-5" />
                  </div>
                  <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-widest ${reward.earned ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                    {reward.earned ? 'Earned' : 'Locked'}
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-black text-slate-950 dark:text-white">{reward.label}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{reward.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Student Levels</h2>
            <div className="mt-5 space-y-3">
              {levels.map((level, index) => (
                <div key={level} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${index <= levelIndex ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                    {index + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{level}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Leaderboards</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Class rank, section rank, and subject rank can share this view.</p>
            <div className="mt-5 space-y-3">
              {leaderboard.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-950/50">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">No rankings yet</p>
                </div>
              ) : (
                leaderboard.slice(0, 6).map((student, index) => (
                  <div key={student.id || student.name} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">#{index + 1}</span>
                      <div>
                        <p className="text-sm font-black text-slate-950 dark:text-white">{student.name}</p>
                        <p className="text-xs font-medium text-slate-500">{student.rating || student.xp || 0} points</p>
                      </div>
                    </div>
                    <Trophy className="h-4 w-4 text-amber-500" />
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
