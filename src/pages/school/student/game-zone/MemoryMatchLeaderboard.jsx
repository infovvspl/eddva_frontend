import React, { useEffect, useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { Trophy, ArrowLeft, Loader2, Star, Brain, Grid } from 'lucide-react';
import { toast } from 'sonner';

export default function MemoryMatchLeaderboard({ onBack }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/school/gamification/memory-match/leaderboard');
        const list = res.data?.data ?? res.data ?? [];
        setRankings(list);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        toast.error('Failed to load leaderboard rankings.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-500">Retrieving leaderboard rankings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Trophy className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Mind Matchers</h1>
        <p className="text-sm font-medium text-slate-500">Top scoreboard rankings for Memory Match decks.</p>
      </div>

      {/* Rankings List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {rankings.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Trophy className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <p className="text-sm font-bold text-slate-500">No memory match scores submitted yet.</p>
            <p className="text-xs text-slate-400 mt-1">Be the first to secure a high score!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {rankings.map((user, idx) => {
              const isTop3 = idx < 3;
              const medalColors = [
                'bg-yellow-500 text-slate-950 shadow-yellow-500/20',
                'bg-slate-300 text-slate-950 shadow-slate-300/20',
                'bg-amber-600 text-white shadow-amber-600/20'
              ];

              const difficultyColor = 
                user.difficulty === 'easy' ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-300' :
                user.difficulty === 'medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300' :
                'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300';

              return (
                <div
                  key={user.rank || idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/40 animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black shadow-sm ${
                      isTop3 ? medalColors[idx] : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{user.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {user.deckCategory}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className={`rounded-full px-1.5 py-0.2 text-[8px] font-black uppercase tracking-wider ${difficultyColor}`}>
                          {user.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-black text-slate-950 dark:text-white flex items-center gap-1 justify-end text-emerald-600 dark:text-emerald-400">
                        <Star className="h-3.5 w-3.5 fill-current" /> {user.score} XP
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                        {user.turnsCount} turns • {user.mismatchesCount} misses
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-black text-slate-505 hover:text-slate-800 dark:hover:text-white transition uppercase tracking-wider"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Game Lobby
        </button>
      </div>
    </div>
  );
}
