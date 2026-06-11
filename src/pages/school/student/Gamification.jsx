import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { unwrapSchoolData } from '@/lib/api/school-client';
import { Award, BookOpen, CheckCircle2, Medal, Star, Target, Trophy, UserCheck, Gamepad2, Map, Zap, Grid, Coins } from 'lucide-react';

const getLevelTitle = (level) => {
  if (level >= 5) return 'Champion';
  if (level >= 4) return 'Expert';
  if (level >= 3) return 'Scholar';
  if (level >= 2) return 'Learner';
  return 'Beginner';
};

const getNextLevelTitle = (level) => {
  if (level < 2) return 'Learner (Lvl 2)';
  if (level < 3) return 'Scholar (Lvl 3)';
  if (level < 4) return 'Expert (Lvl 4)';
  if (level < 5) return 'Champion (Lvl 5)';
  return 'Max Level Reached';
};

const getLevelThresholds = (level) => {
  if (level >= 5) return { min: 1000, next: 1000 };
  if (level === 4) return { min: 500, next: 1000 };
  if (level === 3) return { min: 250, next: 500 };
  if (level === 2) return { min: 100, next: 250 };
  return { min: 0, next: 100 };
};

export default function Gamification() {
  const [dashboard, setDashboard] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes] = await Promise.all([
          api.get('/students/dashboard').catch(() => ({ data: null })),
        ]);
        setDashboard(unwrapSchoolData(dashRes, null));
        setLeaderboard([]);
      } catch (error) {
        console.error('Failed to fetch gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const xp = Number(dashboard?.xpTotal || 0);
  const level = dashboard?.student?.currentLevel || 1;
  const currentLevel = getLevelTitle(level);
  const nextLevel = getNextLevelTitle(level);
  
  const thresholds = getLevelThresholds(level);
  let levelProgress = 100;
  if (level < 5) {
    levelProgress = Math.min(100, Math.max(0, Math.round(((xp - thresholds.min) / (thresholds.next - thresholds.min)) * 100)));
  }
  const coins = dashboard?.student?.eddvaCoins || 0;
  const unlockedBadgesList = dashboard?.student?.unlockedBadges || [];

  const baseRewards = useMemo(() => [
    { label: 'Class Consistency', detail: 'Attend live classes regularly', icon: UserCheck, earned: xp > 100 },
    { label: 'Homework Finisher', detail: 'Submit assignments before due date', icon: CheckCircle2, earned: xp > 250 },
    { label: 'Test Taker', detail: 'Complete assessments and practice tests', icon: Target, earned: xp > 500 },
    { label: 'Study Champion', detail: 'Maintain a strong weekly learning rhythm', icon: Trophy, earned: xp > 1000 },
  ], [xp]);

  const gameBadges = useMemo(() => {
    return unlockedBadgesList.map((badgeName) => ({
      label: badgeName,
      detail: `Earned through ${badgeName === 'Quiz Master' ? 'Quiz Rush' : 'Learning Arcade'} game`,
      icon: Award,
      earned: true,
    }));
  }, [unlockedBadgesList]);

  const allBadges = useMemo(() => {
    return [...baseRewards, ...gameBadges];
  }, [baseRewards, gameBadges]);

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
        <p className="mt-1 text-sm font-medium text-slate-500">Earn XP and EDDVA Coins from classes, homework, tests, and arcade games. Unlock badges and ranks.</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {currentLevel} (Level {level})
              </span>
              <span className="text-sm font-bold text-slate-500">Next rank milestone: {nextLevel}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black text-slate-950 dark:text-white">{xp} XP</h2>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-amber-500 animate-pulse" style={{ width: `${levelProgress}%` }} />
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500">{levelProgress}% progress toward Level {level + 1}.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
              <Star className="h-5 w-5 text-amber-500" />
              <div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">XP</p>
                <p className="text-xl font-black text-slate-950 dark:text-white">{xp}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Coins</p>
                <p className="text-xl font-black text-slate-950 dark:text-white">{coins}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
              <Trophy className="h-5 w-5 text-blue-600" />
              <div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Rank</p>
                <p className="text-xl font-black text-slate-950 dark:text-white">{dashboard?.globalRank ? `#${dashboard.globalRank}` : '-'}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
              <Award className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Badges</p>
                <p className="text-xl font-black text-slate-950 dark:text-white">{allBadges.filter((b) => b.earned).length}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
              <Medal className="h-5 w-5 text-violet-600" />
              <div>
                <p className="mt-3 text-[11px] font-black uppercase tracking-widest text-slate-500">Level</p>
                <p className="text-xl font-black text-slate-950 dark:text-white">{level}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Arcade Section */}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">EDDVA Learning Arcade</h2>
            <p className="text-sm font-medium text-slate-500">Play NCERT-aligned games to boost your grades, earn XP, and collect EDDVA Coins!</p>
          </div>
          <Gamepad2 className="h-6 w-6 text-indigo-500 animate-bounce" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Game 1: Quiz Rush */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Gamepad2 className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300">
                  Quiz Rush
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">Quiz Rush</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                Fast-paced NCERT quizzes inspired by Kahoot and Blooket. Test your speed and accuracy to trigger combos and streaking bonuses!
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/school/student/game-zone/quiz-rush"
                className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-indigo-700"
              >
                Play Now
              </Link>
            </div>
          </div>

          {/* Game 2: Treasure Hunt */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Map className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
                  Treasure Hunt
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">Treasure Hunt</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                Explore maps, unlock chests, and solve NCERT mysteries checkpoint-by-checkpoint. Win rare badges and special coins!
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/school/student/game-zone/treasure-hunt"
                className="inline-flex w-full items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-amber-700"
              >
                Play Now
              </Link>
            </div>
          </div>

          {/* Game 3: Math Sprint */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-rose-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:bg-rose-950/20 dark:text-rose-300">
                  Math Sprint
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">Math Sprint</h3>
              <p className="mt-2 text-xs font-medium text-slate-505 leading-relaxed">
                60-second rapid-fire arithmetic challenges. Build correct streaks to trigger Fever (x2) and Supercharge (x3) multipliers!
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/school/student/game-zone/math-sprint"
                className="inline-flex w-full items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-rose-700"
              >
                Play Now
              </Link>
            </div>
          </div>

          {/* Game 4: Memory Match */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Grid className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                  Memory Match
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">Memory Match</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                Flip cards and match pairs like state/capitals, term/definition, planet/fact, or historical achievement!
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/school/student/game-zone/memory-match"
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-emerald-700"
              >
                Play Now
              </Link>
            </div>
          </div>

          {/* Game 5: Word Master */}
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm transition hover:shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-violet-700 dark:bg-violet-950/20 dark:text-violet-300">
                  Word Master
                </span>
              </div>
              <h3 className="mt-4 text-base font-black text-slate-950 dark:text-white">Word Master</h3>
              <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                Spelling bee, word scrambles, synonyms, and antonyms. Master your vocabulary and rule the language chart!
              </p>
            </div>
            <div className="mt-5">
              <Link
                to="/school/student/game-zone/word-master"
                className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-xs font-black text-white shadow transition hover:bg-violet-700"
              >
                Play Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">Rewards & Badges</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Badges and achievements unlocked through learning behavior and games.</p>
            </div>
            <Award className="h-6 w-6 text-amber-500" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {allBadges.map((reward) => (
              <div key={reward.label} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800 flex flex-col justify-between">
                <div>
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
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-black text-slate-950 dark:text-white">Student Levels</h2>
            <div className="mt-5 space-y-3">
              {[
                { name: 'Beginner', lvl: 1 },
                { name: 'Learner', lvl: 2 },
                { name: 'Scholar', lvl: 3 },
                { name: 'Expert', lvl: 4 },
                { name: 'Champion', lvl: 5 },
              ].map((milestone) => (
                <div key={milestone.name} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${level >= milestone.lvl ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-300'}`}>
                    Lvl {milestone.lvl}
                  </div>
                  <span className={`text-sm font-bold ${level >= milestone.lvl ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-600'}`}>
                    {milestone.name}
                  </span>
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
