import React from 'react';
import { Trophy, Coins, Star, RefreshCw, Medal, Award, ArrowLeft, ArrowUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clearStudentDashboardCache } from '@/lib/school/student-dashboard-cache';

export default function WordMasterResult({ result, onPlayAgain, onViewLeaderboard }) {
  React.useEffect(() => {
    clearStudentDashboardCache();
  }, []);

  const {
    wordsAttempted,
    correctAnswers,
    score,
    xpEarned,
    coinsEarned,
    maxStreak,
    badgeUnlocked,
    hasLeveledUp,
    newLevel,
    newTitle,
  } = result;

  const total = wordsAttempted || 1;
  const accuracy = Math.round((correctAnswers / total) * 100);

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8 animate-fade-in">
      {/* Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-500/20 shadow-xl">
          <Medal className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Deck Completed!</h1>
        <p className="text-sm font-semibold text-slate-500">You completed the unscramble challenge. Here is your scorecard:</p>
      </div>

      {/* Level Up Celebration */}
      {hasLeveledUp && (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-5 dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-bounce">
          <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
            <ArrowUp className="h-7 w-7 stroke-[3] animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Level Milestone</span>
            <h3 className="text-base font-black text-slate-950 dark:text-white">🎉 Leveled Up to Level {newLevel}!</h3>
            <p className="text-xs font-semibold text-slate-500">New Rank Title: {newTitle}</p>
          </div>
        </div>
      )}

      {/* Badge Unlocked Celebration */}
      {badgeUnlocked && (
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/20 dark:to-slate-950 shadow-md flex items-center gap-4 animate-pulse">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Award className="h-7 w-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Badge Acquired</span>
            <h3 className="text-base font-black text-slate-950 dark:text-white">🏆 Badge Unlocked: Vocab Wizard</h3>
            <p className="text-xs font-semibold text-slate-500">Congratulations on completing a Hard Word Master deck with 100% accuracy!</p>
          </div>
        </div>
      )}

      {/* Score and Currency Loot Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex flex-col items-center justify-center">
            <Star className="h-6 w-6 text-violet-500 fill-current mb-1.5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">XP Gained</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">+{xpEarned} XP</span>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50 flex flex-col items-center justify-center">
            <Coins className="h-6 w-6 text-yellow-500 mb-1.5" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coins Gained</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">+{coinsEarned} Coins</span>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between text-sm font-black">
            <span className="text-slate-400">Total words attempted</span>
            <span className="text-slate-800 dark:text-white font-mono">{wordsAttempted} words</span>
          </div>

          <div className="flex items-center justify-between text-sm font-black">
            <span className="text-slate-400">Correct answers</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">{correctAnswers} solved</span>
          </div>

          <div className="flex items-center justify-between text-sm font-black">
            <span className="text-slate-400">Max word streak</span>
            <span className="text-violet-600 dark:text-violet-400 font-mono flex items-center gap-1">
              <Zap className="h-4 w-4 fill-current animate-pulse" /> {maxStreak} streak
            </span>
          </div>

          <div className="flex items-center justify-between text-sm font-black">
            <span className="text-slate-400">Word accuracy</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-black font-mono ${
              accuracy >= 80 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' :
              accuracy >= 50 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300' :
              'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300'
            }`}>{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid gap-2">
        <button
          onClick={onPlayAgain}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-700 shadow-md transition"
        >
          <RefreshCw className="h-4 w-4" /> Play Another Deck
        </button>

        <button
          onClick={onViewLeaderboard}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 transition"
        >
          <Trophy className="h-4 w-4 text-amber-500" /> View Score rankings
        </button>
      </div>

      <div className="text-center">
        <Link
          to="/school/student/gamification"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Gamification Center
        </Link>
      </div>
    </div>
  );
}
