import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/gamification/my-profile').catch(() => ({ data: null }));
        const data = res?.data?.data ?? res?.data ?? null;
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch gamification data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const xp = Number(profile?.xp || 0);
  const level = Number(profile?.level || 1);
  const coins = Number(profile?.coins || 0);
  const unlockedBadgesList = Array.isArray(profile?.badges) ? profile.badges : [];

  const currentLevel = getLevelTitle(level);
  const nextLevel = getNextLevelTitle(level);
  const thresholds = getLevelThresholds(level);
  let levelProgress = 100;
  if (level < 5) {
    levelProgress = Math.min(100, Math.max(0, Math.round(((xp - thresholds.min) / (thresholds.next - thresholds.min)) * 100)));
  }

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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Level & Progress */}
        <div className="flex-1 flex flex-col justify-center min-w-[200px] max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
              {currentLevel} (Level {level})
            </span>
            <span className="text-[11px] font-bold text-slate-500">Next: {nextLevel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${levelProgress}%` }} />
            </div>
            <span className="text-[10px] font-black text-slate-500 w-8">{levelProgress}%</span>
          </div>
        </div>

        {/* Right: Compact Stat Pills */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">XP</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{xp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">
            <Coins className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Coins</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{coins}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">
            <Trophy className="h-4 w-4 text-blue-500 fill-blue-500/20" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rank</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">-</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700 shadow-sm transition hover:shadow-md">
            <Award className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Badges</p>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{allBadges.filter((b) => b.earned).length}</p>
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

    </div>
  );
}
