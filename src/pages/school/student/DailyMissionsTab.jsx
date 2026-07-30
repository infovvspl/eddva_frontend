import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Target, CheckCircle2, Gift, Star, Coins, Award, RefreshCw, Sparkles } from 'lucide-react';

export default function DailyMissionsTab({ onRefresh }) {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gamification/daily-missions');
      const data = res?.data?.data ?? res?.data ?? [];
      setMissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch daily missions:', e);
      setMissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleClaim = async (missionId) => {
    try {
      setClaimingId(missionId);
      await api.post(`/gamification/daily-missions/${missionId}/claim`);
      soundEngine.playLevelUp();
      soundEngine.playCoinDrop();
      await fetchMissions();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error('Failed to claim mission:', e);
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Resets Daily at Midnight
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Personalised Daily Missions</h2>
          <p className="text-xs text-slate-500 font-medium">Complete daily learning goals to earn bonus XP, EDDVA Coins, and exclusive badges!</p>
        </div>
        <button
          onClick={fetchMissions}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 shrink-0 self-start sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Missions List */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : missions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold text-slate-400">All daily missions completed for today! Check back tomorrow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map((m) => {
            const isCompleted = Number(m.current_count || 0) >= Number(m.target_count || 1);
            const isClaimed = m.is_claimed;
            const pct = Math.min(100, Math.round((Number(m.current_count || 0) / Number(m.target_count || 1)) * 100));

            return (
              <div
                key={m.id}
                className={`rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
                  isClaimed
                    ? 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40 opacity-75'
                    : isCompleted
                    ? 'border-amber-300 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {m.activity_type}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">{m.title}</h3>
                    <p className="text-xs text-slate-500 font-medium">{m.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      +{m.reward_xp} XP
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 text-xs font-black text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300">
                      <Coins className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                      +{m.reward_coins}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Progress ({m.current_count} / {m.target_count})</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 flex justify-end">
                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Reward Claimed
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(m.id)}
                      disabled={claimingId === m.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-white shadow hover:bg-amber-600 transition disabled:opacity-50"
                    >
                      {claimingId === m.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Gift className="h-3.5 w-3.5" /> Claim Reward
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-slate-400">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
