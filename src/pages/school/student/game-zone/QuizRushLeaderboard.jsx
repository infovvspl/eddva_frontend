import React, { useEffect, useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { Trophy, ArrowLeft, Loader2, Zap, Clock, Star, Award } from 'lucide-react';
import { toast } from 'sonner';

export default function QuizRushLeaderboard({ onBack }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/games/quiz-rush/leaderboard');
        const list = res.data?.data ?? res.data ?? [];
        setRankings(list);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        toast.error('Failed to load Quiz Rush leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900';
    if (rank === 2) return 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/20 dark:border-slate-800';
    if (rank === 3) return 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900';
    return 'bg-white border-slate-100 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Quiz Rush Leaderboard</h1>
        <p className="text-sm font-medium text-slate-500">Global rankings of top educational champions.</p>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm font-semibold text-slate-500">Loading rankings...</p>
          </div>
        ) : rankings.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-center p-8">
            <Award className="h-10 w-10 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">No entries yet</h3>
            <p className="text-xs text-slate-500 max-w-xs">Be the first to play Quiz Rush and claim the top rank on the board!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Header row */}
            <div className="grid grid-cols-[60px_1fr_120px_120px] items-center px-6 py-3 bg-slate-50 dark:bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
              <span className="text-center">Rank</span>
              <span>Student</span>
              <span className="text-center">Accuracy</span>
              <span className="text-right">Score (XP)</span>
            </div>

            {/* List */}
            {rankings.map((user) => (
              <div
                key={user.studentId}
                className={`grid grid-cols-[60px_1fr_120px_120px] items-center px-6 py-4 border-l-4 border-transparent transition-all hover:bg-slate-50/50 dark:hover:bg-slate-850 ${
                  user.rank <= 3 ? 'font-black border-l-amber-400' : 'font-bold'
                }`}
              >
                {/* Rank Badge */}
                <div className="flex justify-center">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-black ${getRankClass(user.rank)}`}>
                    {getRankBadge(user.rank)}
                  </span>
                </div>

                {/* Student Info */}
                <div className="min-w-0 pr-4">
                  <p className="text-sm text-slate-950 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-semibold">
                    <span className="flex items-center gap-0.5"><Zap className="h-2.5 w-2.5 text-yellow-500 fill-current" /> Streak: {user.maxStreak}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5 text-slate-400" /> Time: {user.timeTakenSeconds}s</span>
                  </p>
                </div>

                {/* Accuracy */}
                <div className="text-center text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-black text-slate-850 dark:text-slate-200">
                    {user.correctAnswers}/{user.totalQuestions}
                  </span>
                  <span className="text-[10px] block font-semibold text-slate-400">
                    {Math.round((user.correctAnswers / user.totalQuestions) * 100)}%
                  </span>
                </div>

                {/* Score */}
                <div className="text-right text-sm text-indigo-600 dark:text-indigo-400 flex items-center justify-end gap-1 font-black">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500 shrink-0" />
                  {user.score}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Game Room
        </button>
      </div>
    </div>
  );
}
