import React, { useEffect, useState } from 'react';
import api from '@/lib/api/school-client';
import { Bot, Swords, Trophy, Users, Star, Flame, Crown, PlayCircle } from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';

export default function BattleArena() {
  const [eloData, setEloData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyBattle, setDailyBattle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eloRes, leaderboardRes, dailyRes, historyRes] = await Promise.all([
          api.get('/battles/my-elo'),
          api.get('/battles/leaderboard'),
          api.get('/battles/daily'),
          api.get('/battles/my-history')
        ]);
        
        setEloData(eloRes.data);
        setLeaderboard(leaderboardRes.data?.rankings || []);
        setDailyBattle(dailyRes.data);
        setHistory(historyRes.data || []);
      } catch (error) {
        console.error('Failed to fetch battle data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Swords className="text-amber-500" /> Battle Arena
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Compete with friends, earn XP, and climb the leaderboard.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Section */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Player Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-6 text-center shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-slate-900">
              <Star className="mb-2 h-6 w-6 text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total XP</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{eloData?.totalXp || 0}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Swords className="mb-2 h-6 w-6 text-blue-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{eloData?.eloRating || 1200}</p>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Flame className="mb-2 h-6 w-6 text-orange-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Win Rate</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {eloData?.matchesPlayed > 0 ? Math.round((eloData.wins / eloData.matchesPlayed) * 100) : 0}%
              </p>
            </div>
            
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Crown className="mb-2 h-6 w-6 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{eloData?.currentRank || 'Bronze'}</p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Swords size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">1v1 Multiplayer</h3>
              <p className="mb-6 mt-2 text-sm text-slate-500 flex-1">Challenge friends or random opponents in real-time topic battles.</p>
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition hover:bg-amber-600">
                  Find Match
                </button>
                <button className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Join Room
                </button>
              </div>
            </div>

            <div className="flex flex-col rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Play with Bot</h3>
              <p className="mb-6 mt-2 text-sm text-slate-500 flex-1">Practice specific topics against our AI bot to improve your speed and accuracy.</p>
              <button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700">
                Start Practice
              </button>
            </div>
          </div>
          
          {/* Daily Challenge */}
          {dailyBattle && (
            <div className="flex items-center justify-between overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white shadow-lg">
              <div>
                <span className="rounded-lg bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                  Daily Challenge
                </span>
                <h3 className="mt-4 text-2xl font-black">{dailyBattle.title}</h3>
                <p className="mt-2 text-sm font-medium text-blue-100">{dailyBattle.participants} students joined today</p>
              </div>
              <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-600 transition hover:bg-blue-50">
                <PlayCircle size={18} /> Join Now
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="text-amber-500" /> Top Players
            </h2>
            
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No rankings available yet.</p>
              ) : (
                leaderboard.map((player, idx) => (
                  <div key={player.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-black",
                        idx === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                        idx === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                        idx === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                        "bg-transparent text-slate-500"
                      )}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{player.name}</p>
                        <p className="text-xs font-semibold text-slate-500">{player.rating} Rating</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{player.xp} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Match History */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-6 text-lg font-black text-slate-900 dark:text-white">Recent Matches</h2>
            
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="text-center text-sm text-slate-500">No matches played yet.</p>
              ) : (
                history.slice(0, 5).map((match) => (
                  <div key={match.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{match.topic}</p>
                      <p className="text-xs text-slate-500">{new Date(match.date).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                      match.result === 'win' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
                      match.result === 'loss' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {match.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
