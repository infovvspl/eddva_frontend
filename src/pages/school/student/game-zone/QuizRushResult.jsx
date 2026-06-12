import React from 'react';
import { Trophy, Star, Coins, Zap, Award, RefreshCw, Milestone, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clearStudentDashboardCache } from '@/lib/school/student-dashboard-cache';

export default function QuizRushResult({ result, onPlayAgain, onViewLeaderboard }) {
  React.useEffect(() => {
    clearStudentDashboardCache();
  }, []);

  const {
    totalQuestions,
    correctAnswers,
    xpEarned,
    coinsEarned,
    isPerfectScore,
    maxStreak,
    speedBonusCount,
    timeTakenSeconds,
    hasLeveledUp,
    newLevel,
    newTitle,
    badgeUnlocked,
    currentXp,
    currentCoins,
    levelProgress,
  } = result;

  const scorePct = Math.round((correctAnswers / totalQuestions) * 100) || 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-500 animate-bounce dark:bg-amber-950/40">
          <Trophy className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          {scorePct >= 80 ? 'Incredible Performance!' : scorePct >= 50 ? 'Well Done!' : 'Good Try!'}
        </h1>
        <p className="text-sm font-medium text-slate-500">
          You answered <strong>{correctAnswers} of {totalQuestions}</strong> questions correctly ({scorePct}% accuracy).
        </p>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* XP Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-amber-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">XP Earned</span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">+{xpEarned}</p>
        </div>

        {/* Coins Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-yellow-500">
            <Coins className="h-4 w-4 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Coins Earned</span>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">+{coinsEarned}</p>
        </div>
      </div>

      {/* Streaks and Speed Stats */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/40 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-yellow-400 fill-current" /> Max Combo Streak</span>
          <span className="font-black text-slate-950 dark:text-white">{maxStreak} streak</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">⚡ Speed Bonuses</span>
          <span className="font-black text-slate-950 dark:text-white">{speedBonusCount} answers under 5s</span>
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1">⏱️ Total Time Taken</span>
          <span className="font-black text-slate-950 dark:text-white">{timeTakenSeconds} seconds</span>
        </div>
      </div>

      {/* Level Up Banner */}
      {hasLeveledUp && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40 text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Rank Promo</p>
          <h2 className="text-xl font-black text-indigo-950 dark:text-white flex items-center justify-center gap-2">
            🎉 LEVEL UP! Level {newLevel} reached!
          </h2>
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            You are now recognized as a <strong>{newTitle}</strong>. Keep running!
          </p>
        </div>
      )}

      {/* Badge Banner */}
      {badgeUnlocked && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40 text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 animate-pulse">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-emerald-950 dark:text-white">
            🏆 New Badge Earned: {badgeUnlocked}!
          </h2>
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Awarded for a perfect score in Quiz Rush. Go display it on your profile!
          </p>
        </div>
      )}

      {/* Level Progress */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <Milestone className="h-4 w-4 text-violet-500" /> Rank Milestones
        </h2>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Level {newLevel} ({newTitle})</span>
          <span>Next: Level {newLevel + 1}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${levelProgress}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 font-semibold text-center">{levelProgress}% progress toward the next level milestone.</p>
      </section>

      {/* Navigation Buttons */}
      <div className="grid gap-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-black text-white shadow transition hover:bg-indigo-700"
        >
          <RefreshCw className="h-4 w-4" /> Play Again
        </button>
        <button
          type="button"
          onClick={onViewLeaderboard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
        >
          <Trophy className="h-4 w-4 text-amber-500" /> View Leaderboard
        </button>
        <Link
          to="/school/student/gamification"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
        >
          <Home className="h-4 w-4 text-slate-400" /> Go to Gamification Center
        </Link>
      </div>
    </div>
  );
}
