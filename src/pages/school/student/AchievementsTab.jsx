import React, { useState, useEffect } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Trophy, Award, Lock, CheckCircle2, Sparkles, Filter, RefreshCw, Star, Coins } from 'lucide-react';

export default function AchievementsTab() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeTier, setActiveTier] = useState('ALL');
  const [selectedAch, setSelectedAch] = useState(null);

  useEffect(() => {
    const fetchAch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/gamification/achievements');
        const data = res?.data?.data ?? res?.data ?? [];
        setAchievements(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to fetch achievements:', e);
        setAchievements([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAch();
  }, []);

  const categories = [
    { key: 'ALL', label: 'All 100+' },
    { key: 'LEARNING', label: 'Learning' },
    { key: 'ATTENDANCE', label: 'Attendance & Streaks' },
    { key: 'GAMES', label: 'Arcade Games' },
    { key: 'BATTLES', label: 'Battle Arena' },
    { key: 'REVISION', label: 'AI Revision' },
    { key: 'ASSIGNMENTS', label: 'Assignments' },
    { key: 'COMPETITIONS', label: 'Competitions' },
  ];

  const tiers = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MYTHIC'];

  const filtered = achievements.filter((a) => {
    if (activeCategory !== 'ALL' && a.category !== activeCategory) return false;
    if (activeTier !== 'ALL' && a.tier !== activeTier) return false;
    return true;
  });

  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'MYTHIC': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300';
      case 'DIAMOND': return 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300';
      case 'PLATINUM': return 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300';
      case 'GOLD': return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300';
      case 'SILVER': return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200';
      default: return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300'; // BRONZE
    }
  };

  const openDetailModal = (ach) => {
    soundEngine.playButtonClick();
    setSelectedAch(ach);
  };

  return (
    <div className="space-y-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
            <Sparkles className="h-3 w-3 text-amber-500" />
            100+ Unique Achievements
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">Achievement Showcase</h2>
          <p className="text-xs text-slate-500 font-medium">Unlock badges across learning, attendance, battles, and competitions!</p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === c.key
                ? 'bg-white text-amber-600 shadow dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Tier Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 shrink-0">Tier:</span>
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTier(t)}
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase transition border ${
              activeTier === t
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Grid Showcase */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((a) => {
            const isUnlocked = a.isUnlocked;

            return (
              <div
                key={a.id}
                onClick={() => openDetailModal(a)}
                className={`group relative cursor-pointer rounded-2xl border p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isUnlocked
                    ? 'border-amber-200 bg-gradient-to-b from-amber-50/50 to-white dark:border-amber-900/40 dark:from-amber-950/20 dark:to-slate-900'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50 grayscale opacity-60'
                }`}
              >
                <div className="text-3xl mb-2">{a.icon || '🏆'}</div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{a.title}</h3>
                <p className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">{a.description}</p>

                <div className="mt-2.5 flex items-center justify-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${getTierBadgeStyle(a.tier)}`}>
                    {a.tier}
                  </span>
                  {isUnlocked ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center animate-in fade-in zoom-in-95">
            <div className="text-5xl mb-3">{selectedAch.icon}</div>
            <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-black uppercase border mb-2 ${getTierBadgeStyle(selectedAch.tier)}`}>
              {selectedAch.tier} TIER
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedAch.title}</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">{selectedAch.description}</p>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <div className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-300">
                <Star className="h-4 w-4 fill-amber-500" /> +{selectedAch.reward_xp} XP
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-yellow-600 dark:text-yellow-300">
                <Coins className="h-4 w-4 fill-yellow-500" /> +{selectedAch.reward_coins} Coins
              </div>
            </div>

            <button
              onClick={() => setSelectedAch(null)}
              className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
