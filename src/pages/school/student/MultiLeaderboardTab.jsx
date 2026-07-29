import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Trophy, Medal, Star, Flame, Shield, ChevronUp, RefreshCw } from 'lucide-react';

export default function MultiLeaderboardTab({ currentProfile }) {
  const [scope, setScope] = useState('GLOBAL');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/gamification/leaderboard?scope=${scope}`);
      setRankings(res?.data ?? []);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [scope]);

  const scopes = [
    { key: 'GLOBAL', label: 'National' },
    { key: 'SCHOOL', label: 'School' },
    { key: 'CLASS', label: 'Class' },
    { key: 'SECTION', label: 'Section' },
    { key: 'SUBJECT', label: 'Subject' },
    { key: 'ARCADE', label: 'Arcade Games' },
    { key: 'BATTLES', label: 'Battle Arena' },
    { key: 'WEEKLY', label: 'Weekly' },
    { key: 'MONTHLY', label: 'Monthly Championship' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-xs font-black uppercase tracking-wider backdrop-blur-md">
              <Shield className="h-3.5 w-3.5 text-amber-300" />
              League Status: {currentProfile?.leagueName || 'Gold League'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-2">Multi-Scope Leaderboards</h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">Climb the ranks across school, subject, games, and national standings!</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/20 shrink-0">
            <ChevronUp className="h-5 w-5 text-emerald-400 animate-bounce" />
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-200">Promotion Zone</p>
              <p className="text-xs font-black text-white">Top 5 advance to Platinum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {scopes.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              soundEngine.playXpChime();
              setScope(s.key);
            }}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
              scope === s.key
                ? 'bg-white text-indigo-600 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Rankings List */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {rankings.map((r) => {
              const isTop3 = r.rank <= 3;

              return (
                <div
                  key={r.userId}
                  className={`flex items-center justify-between py-3.5 px-3 rounded-xl transition ${
                    isTop3 ? 'bg-amber-50/40 dark:bg-amber-950/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-black text-xs ${
                      r.rank === 1 ? 'bg-amber-400 text-slate-900 shadow-md' :
                      r.rank === 2 ? 'bg-slate-300 text-slate-900' :
                      r.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {r.rank === 1 ? '👑' : r.rank}
                    </div>

                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{r.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                        <span>Lvl {r.level}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Flame className="h-3 w-3 text-orange-500" /> {r.streak}d streak</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {r.xp} XP
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{r.tier}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
