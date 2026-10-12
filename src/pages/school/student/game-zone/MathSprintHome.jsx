import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolFeature } from '@/hooks/use-school-feature';
import { Play, Trophy, ArrowLeft, Loader2, Zap, Flame } from 'lucide-react';

export default function MathSprintHome({ onStart, onViewLeaderboard }) {
  const hasGameQuizzes = useSchoolFeature('ai', 'ai_game_quizzes');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!hasGameQuizzes) return;
    setStarting(true);
    try {
      await onStart();
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
      <div className="flex justify-start">
        <Link
          to="/school/student/gamification"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="size-3" /> Back to Gamification Center
        </Link>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <Zap className="size-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Math Sprint</h1>
        <p className="text-sm font-medium text-slate-500">Rapid-fire arithmetic sums. Keep answering correctly to survive and increase difficulty!</p>
      </div>
 
      {/* Rules Board */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-rose-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <Flame className="size-4 animate-bounce" /> Sprint Mechanics & Rewards
        </h2>
        <ul className="mt-3 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">⏱️ <strong>15-Second Limit</strong>: Answer each equation before time runs out.</li>
          <li className="flex items-center gap-2">⚡ <strong>Survival Mode</strong>: The sprint keeps running with increasing difficulty as long as you are correct!</li>
          <li className="flex items-center gap-2">❌ <strong>Sudden Death</strong>: A single wrong answer or running out of time ends the run immediately.</li>
          <li className="flex items-center gap-2">✨ <strong>Base Loot</strong>: +10 XP and +1 Coin per correct answer.</li>
          <li className="flex items-center gap-2">🔥 <strong>Fever Mode (3+ Streak)</strong>: Score is doubled (x2 multiplier / +20 XP per sum)!</li>
          <li className="flex items-center gap-2">⚡ <strong>Supercharge (5+ Streak)</strong>: Score is tripled (x3 multiplier / +30 XP per sum)!</li>
          <li className="flex items-center gap-2 text-rose-600 dark:text-rose-400">🏆 <strong>Speedster Milestone</strong>: Reach a score of <strong>150+</strong> in a single run to claim the <strong className="font-black">Math Speedster Badge</strong>!</li>
        </ul>
      </section>

      {/* Configuration Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {/* Play Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting || !hasGameQuizzes}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/10 transition hover:bg-rose-700 disabled:opacity-50"
          >
            {starting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Seeding sprint arena...
              </>
            ) : !hasGameQuizzes ? (
              <>Locked (AI disabled)</>
            ) : (
              <>
                <Play className="size-4 fill-current" /> Start Math Sprint
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
          >
            <Trophy className="size-4 text-amber-500" /> Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}
