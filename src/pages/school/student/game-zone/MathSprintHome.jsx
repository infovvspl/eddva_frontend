import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Trophy, ArrowLeft, Loader2, Zap, Flame, ShieldAlert, Sparkles } from 'lucide-react';

export default function MathSprintHome({ onStart, onViewLeaderboard }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStart(difficulty);
    } catch (err) {
      console.error(err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
          <Zap className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Math Sprint</h1>
        <p className="text-sm font-medium text-slate-500">60-second rapid-fire arithmetic sums. Test your math speed!</p>
      </div>

      {/* Rules Board */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-rose-50/50 to-white p-5 dark:border-slate-800 dark:from-slate-900/50 dark:to-slate-950 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
          <Flame className="h-4 w-4 animate-bounce" /> Sprint Mechanics & Rewards
        </h2>
        <ul className="mt-3 space-y-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2">⏱️ <strong>60-Second Blitz</strong>: Answer as many equations as you can before time runs out.</li>
          <li className="flex items-center gap-2">✨ <strong>Base Loot</strong>: +10 XP and +1 Coin per correct answer.</li>
          <li className="flex items-center gap-2">🔥 <strong>Fever Mode (3+ Streak)</strong>: Score is doubled (x2 multiplier / +20 XP per sum)!</li>
          <li className="flex items-center gap-2">⚡ <strong>Supercharge (5+ Streak)</strong>: Score is tripled (x3 multiplier / +30 XP per sum)!</li>
          <li className="flex items-center gap-2">❌ <strong>Striking Out</strong>: A wrong answer immediately resets your multiplier back to 1x.</li>
          <li className="flex items-center gap-2 text-rose-600 dark:text-rose-400">🏆 <strong>Speedster Milestone</strong>: Reach a score of <strong>150+</strong> in a single run to claim the <strong className="font-black">Math Speedster Badge</strong>!</li>
        </ul>
      </section>

      {/* Configuration Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
        {/* Difficulty Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Selected Grade Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[
              { id: 'easy', label: 'Easy (Class 1-3)', desc: 'Simple addition, subtraction, smaller times tables.' },
              { id: 'medium', label: 'Medium (Class 4-5)', desc: 'Double digit sums, decimals, division.' },
              { id: 'hard', label: 'Hard (Class 6-8)', desc: 'Percentages, triple digit sums, simple algebra.' }
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => setDifficulty(diff.id)}
                className={`flex flex-col items-center justify-between p-3.5 rounded-xl border-2 text-center transition ${
                  difficulty === diff.id
                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300'
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-wider">{diff.id}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-2 leading-snug">{diff.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Play Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/10 transition hover:bg-rose-700 disabled:opacity-50"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Seeding sprint arena...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" /> Start Math Sprint
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950 transition"
          >
            <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
          </button>
        </div>
      </div>
      
      <div className="text-center">
        <Link
          to="/school/student/gamification"
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Gamification Center
        </Link>
      </div>
    </div>
  );
}
