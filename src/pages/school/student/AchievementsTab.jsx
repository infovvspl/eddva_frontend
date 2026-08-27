import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import { Trophy, Award, Lock, CheckCircle2, Sparkles, Filter, RefreshCw, Star, Coins, Gamepad2, Zap, Rocket, Brain, BookOpen, Compass, Info, X } from 'lucide-react';

export default function AchievementsTab() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeTier, setActiveTier] = useState('ALL');
  const [selectedAch, setSelectedAch] = useState(null);

  // Toast notice for locked tab / card interactions
  const [lockedTabNotice, setLockedTabNotice] = useState(null);

  const categories = [
    { key: 'ALL', label: '🎮 All Game Badges' },
    { key: 'QUIZ_RUSH', label: '⚡ Quiz Rush' },
    { key: 'MATH_SPRINT', label: '🚀 Math Sprint' },
    { key: 'MEMORY_MATCH', label: '🧠 Memory Match' },
    { key: 'WORD_MASTER', label: '🔤 Word Master' },
    { key: 'TREASURE_HUNT', label: '🗺️ Treasure Hunt' },
    { key: 'ARCADE_OVERALL', label: '🏆 Arcade Overall' },
  ];

  const tiers = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MYTHIC'];

  const gameNameMap = {
    QUIZ_RUSH: 'Quiz Rush',
    MATH_SPRINT: 'Math Sprint',
    MEMORY_MATCH: 'Memory Match',
    WORD_MASTER: 'Word Master',
    TREASURE_HUNT: 'Treasure Hunt',
    ARCADE_OVERALL: 'Arcade Overall',
  };

  const prevTierNameMap = {
    SILVER: 'BRONZE',
    GOLD: 'SILVER',
    PLATINUM: 'GOLD',
    DIAMOND: 'PLATINUM',
    MYTHIC: 'DIAMOND',
  };

  const validGameCategories = [
    'QUIZ_RUSH', 'MATH_SPRINT', 'MEMORY_MATCH',
    'WORD_MASTER', 'TREASURE_HUNT', 'ARCADE_OVERALL'
  ];

  const fetchAch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gamification/achievements');
      const rawData = res?.data?.data ?? res?.data;

      let items = [];
      if (Array.isArray(rawData)) {
        items = rawData;
      } else if (rawData && typeof rawData === 'object') {
        items = Array.isArray(rawData.achievements) ? rawData.achievements : (Array.isArray(rawData.data) ? rawData.data : []);
      }

      setAchievements(items);
    } catch (e) {
      console.error('Failed to fetch achievements:', e);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAch();
  }, []);

  // Dynamically compute per-game tier unlock status
  // A tier unlocks ONLY IF 100% of achievements in the previous tier for THAT specific game are completed
  const gameTierStatus = useMemo(() => {
    const status = {};
    const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MYTHIC'];

    validGameCategories.forEach((cat) => {
      status[cat] = { BRONZE: true }; // Bronze is always unlocked by default

      for (let i = 1; i < tierOrder.length; i++) {
        const currentTier = tierOrder[i];
        const prevTier = tierOrder[i - 1];

        const isPrevUnlocked = status[cat][prevTier];
        const prevTierItems = achievements.filter((a) => a.category === cat && a.tier === prevTier);

        // Unlock ONLY if prevTierItems.length > 0 AND EVERY SINGLE achievement in prevTier is completed
        const isPrevCompleted = prevTierItems.length > 0 && prevTierItems.every((a) => {
          const target = Number(a.criteriaTarget ?? a.criteria_target ?? 1);
          const current = Number(a.currentValue ?? 0);
          return Boolean(a.isUnlocked || Number(a.progress) >= 100 || current >= target);
        });

        status[cat][currentTier] = Boolean(isPrevUnlocked && isPrevCompleted);
      }
    });

    return status;
  }, [achievements]);

  const getTierBadgeInfo = (tier) => {
    switch (tier) {
      case 'MYTHIC': return { label: '🟣 MYTHIC', style: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300' };
      case 'DIAMOND': return { label: '🔷 DIAMOND', style: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300' };
      case 'PLATINUM': return { label: '💎 PLATINUM', style: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300' };
      case 'GOLD': return { label: '🟡 GOLD', style: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' };
      case 'SILVER': return { label: '⚪ SILVER', style: 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200' };
      default: return { label: '🟤 BRONZE', style: 'bg-amber-900/10 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400' };
    }
  };

  const getGameCategoryIcon = (cat) => {
    switch (cat) {
      case 'QUIZ_RUSH': return '⚡';
      case 'MATH_SPRINT': return '🚀';
      case 'MEMORY_MATCH': return '🧠';
      case 'WORD_MASTER': return '🔤';
      case 'TREASURE_HUNT': return '🗺️';
      case 'ARCADE_OVERALL': return '🏆';
      default: return '🎮';
    }
  };

  const getCardColorStyle = (cat, tier) => {
    switch (cat) {
      case 'QUIZ_RUSH':
        return {
          cardBg: 'border-cyan-400/60 bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 text-cyan-100 shadow-cyan-500/15 hover:border-cyan-300 hover:shadow-cyan-400/30',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
          progressBg: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]',
        };
      case 'MATH_SPRINT':
        return {
          cardBg: 'border-rose-400/60 bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 text-rose-100 shadow-rose-500/15 hover:border-rose-300 hover:shadow-rose-400/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
          progressBg: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]',
        };
      case 'MEMORY_MATCH':
        return {
          cardBg: 'border-lime-400/60 bg-gradient-to-br from-lime-950/80 via-slate-900 to-slate-950 text-lime-100 shadow-lime-500/15 hover:border-lime-300 hover:shadow-lime-400/30',
          badgeBg: 'bg-lime-500/20 text-lime-300 border-lime-400/40',
          progressBg: 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.8)]',
        };
      case 'WORD_MASTER':
        return {
          cardBg: 'border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-950/80 via-slate-900 to-slate-950 text-fuchsia-100 shadow-fuchsia-500/15 hover:border-fuchsia-300 hover:shadow-fuchsia-400/30',
          badgeBg: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/40',
          progressBg: 'bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]',
        };
      case 'TREASURE_HUNT':
        return {
          cardBg: 'border-amber-400/60 bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-950 text-amber-100 shadow-amber-500/15 hover:border-amber-300 hover:shadow-amber-400/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          progressBg: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]',
        };
      case 'ARCADE_OVERALL':
      default:
        return {
          cardBg: 'border-indigo-400/60 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 text-indigo-100 shadow-indigo-500/15 hover:border-indigo-300 hover:shadow-indigo-400/30',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
          progressBg: 'bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]',
        };
    }
  };

  // Determine if a Tier filter tab is unlocked
  const isTierTabUnlocked = (tKey) => {
    if (tKey === 'ALL' || tKey === 'BRONZE') return true;

    if (activeCategory !== 'ALL') {
      return gameTierStatus[activeCategory]?.[tKey] ?? false;
    }

    // When "ALL Game Badges" tab is active, tier tab is unlocked if AT LEAST ONE game has unlocked it
    return validGameCategories.some((cat) => gameTierStatus[cat]?.[tKey] === true);
  };

  const handleTierTabClick = (tKey) => {
    const unlocked = isTierTabUnlocked(tKey);
    soundEngine.playButtonClick();

    if (unlocked) {
      setActiveTier(tKey);
      setLockedTabNotice(null);
    } else {
      const prevTier = prevTierNameMap[tKey] || 'previous';
      const targetGame = activeCategory !== 'ALL' ? gameNameMap[activeCategory] : 'the current game';
      setLockedTabNotice(`🔒 ${tKey} Tier Locked: Complete 100% of all ${prevTier} achievements in ${targetGame} to unlock!`);
      setTimeout(() => setLockedTabNotice(null), 4000);
    }
  };

  const filtered = achievements.filter((a) => {
    if (!validGameCategories.includes(a.category)) return false;
    if (activeCategory !== 'ALL' && a.category !== activeCategory) return false;
    if (activeTier !== 'ALL' && a.tier !== activeTier) return false;
    return true;
  });

  const gameAchievementsOnly = achievements.filter(a => validGameCategories.includes(a.category));

  // Count total unlocked achievements (tier unlocked AND completed)
  const unlockedCount = gameAchievementsOnly.filter(a => {
    const tierUnlocked = gameTierStatus[a.category]?.[a.tier] ?? (a.tier === 'BRONZE');
    const target = Number(a.criteriaTarget ?? a.criteria_target ?? 1);
    const current = Number(a.currentValue ?? 0);
    const isDone = Boolean(a.isUnlocked || Number(a.progress) >= 100 || current >= target);
    return tierUnlocked && isDone;
  }).length;

  const totalGameBadges = gameAchievementsOnly.length || 48;

  const openDetailModal = (ach) => {
    const isTierUnlocked = gameTierStatus[ach.category]?.[ach.tier] ?? (ach.tier === 'BRONZE');
    if (!isTierUnlocked) {
      soundEngine.playButtonClick();
      const prevTier = prevTierNameMap[ach.tier] || 'previous';
      setLockedTabNotice(`🔒 Tier Locked: Complete 100% of all ${prevTier} achievements in ${gameNameMap[ach.category] || 'this game'} to unlock.`);
      setTimeout(() => setLockedTabNotice(null), 4000);
      return;
    }
    soundEngine.playButtonClick();
    setSelectedAch(ach);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice for Locked Tab / Card attempts */}
      {lockedTabNotice && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <Lock className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs font-bold">{lockedTabNotice}</p>
          <button onClick={() => setLockedTabNotice(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
            <Sparkles className="h-3 w-3 text-amber-500" />
            {unlockedCount} / {totalGameBadges} Game Badges Unlocked
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Gamepad2 className="h-6 w-6 text-amber-500" /> Game Achievement Showcase
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Play Quiz Rush, Math Sprint, Memory Match, Word Master, and Treasure Hunt to progress through Bronze ➔ Silver ➔ Gold ➔ Platinum ➔ Diamond ➔ Mythic tiers!
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => {
              soundEngine.playButtonClick();
              setActiveCategory(c.key);
              // Reset tier filter to ALL if current tier is locked for this new category
              if (activeTier !== 'ALL' && activeTier !== 'BRONZE') {
                const isUnlockedForNewCat = c.key === 'ALL'
                  ? validGameCategories.some(cat => gameTierStatus[cat]?.[activeTier] === true)
                  : gameTierStatus[c.key]?.[activeTier] === true;
                if (!isUnlockedForNewCat) {
                  setActiveTier('ALL');
                }
              }
            }}
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

      {/* Tier Filter Tabs with Lock Indicators */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-400 shrink-0">Tier:</span>
        {tiers.map((t) => {
          const unlocked = isTierTabUnlocked(t);
          const isSelected = activeTier === t;

          return (
            <button
              key={t}
              onClick={() => handleTierTabClick(t)}
              title={unlocked ? `${t} Tier` : `Complete all previous tier achievements to unlock ${t}`}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-black uppercase transition border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm'
                  : unlocked
                  ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-900/60 dark:text-slate-600 dark:border-slate-800 cursor-not-allowed opacity-60'
              }`}
            >
              {!unlocked && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
              <span>{t}</span>
            </button>
          );
        })}
      </div>

      {/* Grid Showcase */}
      {loading ? (
        <div className="py-12 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((a) => {
            const isTierUnlocked = gameTierStatus[a.category]?.[a.tier] ?? (a.tier === 'BRONZE');
            const targetVal = Number(a.criteriaTarget ?? a.criteria_target ?? 1);
            const currentVal = Number(a.currentValue ?? 0);
            
            // Strictly enforce: if tier is locked, achievement CANNOT be completed and CANNOT show progress
            const isUnlocked = isTierUnlocked && (a.isUnlocked || Number(a.progress) >= 100 || currentVal >= targetVal);
            const progress = !isTierUnlocked ? 0 : isUnlocked ? 100 : (a.progress ?? (targetVal > 0 ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0));
            const displayVal = !isTierUnlocked ? 0 : currentVal;

            const tierInfo = getTierBadgeInfo(a.tier);
            const gameCategoryIcon = getGameCategoryIcon(a.category);
            const colorStyle = getCardColorStyle(a.category, a.tier);
            const prevTierName = prevTierNameMap[a.tier] || 'previous tier';

            return (
              <div
                key={a.id}
                onClick={() => openDetailModal(a)}
                className={`group relative rounded-2xl border p-4 text-center transition-all duration-300 ${
                  !isTierUnlocked
                    ? 'border-slate-800 bg-slate-950/60 opacity-60 cursor-not-allowed text-slate-400'
                    : isUnlocked
                    ? `${colorStyle.cardBg} cursor-pointer hover:-translate-y-1`
                    : 'border-slate-750 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 opacity-90 cursor-pointer hover:-translate-y-1 hover:border-slate-600'
                }`}
              >
                {/* Top game icon tag */}
                <div className="absolute top-2 left-2.5 text-xs opacity-85" title={gameNameMap[a.category] || a.category}>
                  {gameCategoryIcon}
                </div>

                {/* Lock Overlay Badge if Tier is Locked */}
                {!isTierUnlocked && (
                  <div className="absolute top-2 right-2.5 flex items-center justify-center rounded-full bg-slate-800/90 p-1 border border-slate-700" title={`Complete 100% of all ${prevTierName} achievements in ${gameNameMap[a.category]} to unlock`}>
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                )}

                {/* Achievement main icon */}
                <div className={`text-3.5xl my-1.5 transition-transform duration-300 group-hover:scale-110 ${!isTierUnlocked ? 'grayscale opacity-40' : !isUnlocked ? 'grayscale opacity-75' : ''}`}>
                  {a.icon || '🎮'}
                </div>

                <h3 className="text-xs font-black text-white line-clamp-1">{a.title}</h3>
                <p className="text-[10px] text-slate-300/80 font-medium line-clamp-1 mt-0.5">{a.description}</p>

                {/* Tier & Status */}
                <div className="mt-2.5 flex items-center justify-center gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${tierInfo.style}`}>
                    {tierInfo.label}
                  </span>
                  {!isTierUnlocked ? (
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                  ) : isUnlocked ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </div>

                {/* Locked Tier Message or Progress */}
                {!isTierUnlocked ? (
                  <div className="mt-2 text-[9px] font-bold text-slate-500 line-clamp-2 px-1">
                    Complete 100% of all {prevTierName} achievements in {gameNameMap[a.category]} to unlock.
                  </div>
                ) : (
                  <>
                    {/* Rewards pill */}
                    <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[9.5px] font-bold text-amber-300">
                      <span>+{a.reward_xp || 50} XP</span>
                      <span>•</span>
                      <span>+{a.reward_coins || 10} Coins</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-300">
                        <span>{displayVal} / {targetVal}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? colorStyle.progressBg : 'bg-amber-400'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-center animate-in fade-in zoom-in-95">
            <div className="text-5xl mb-2">{selectedAch.icon || '🎮'}</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm">{getGameCategoryIcon(selectedAch.category)}</span>
              <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-black uppercase border ${getTierBadgeInfo(selectedAch.tier).style}`}>
                {getTierBadgeInfo(selectedAch.tier).label}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedAch.title}</h3>
            <p className="mt-1 text-xs text-slate-500 font-medium">{selectedAch.description}</p>

            {/* Progress stats */}
            <div className="mt-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-left space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Progress:</span>
                <span>
                  {Number(selectedAch.currentValue ?? 0) >= Number(selectedAch.criteriaTarget ?? selectedAch.criteria_target ?? 1)
                    ? 'Completed! (100%)'
                    : `${selectedAch.currentValue || 0} / ${selectedAch.criteriaTarget || selectedAch.criteria_target || 1}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500"
                  style={{ width: `${selectedAch.isUnlocked || Number(selectedAch.currentValue ?? 0) >= Number(selectedAch.criteriaTarget ?? selectedAch.criteria_target ?? 1) ? 100 : selectedAch.progress || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-1 text-xs font-black text-amber-600 dark:text-amber-300">
                <Star className="h-4 w-4 fill-amber-500" /> +{selectedAch.reward_xp || 50} XP
              </div>
              <div className="flex items-center gap-1 text-xs font-black text-yellow-600 dark:text-yellow-300">
                <Coins className="h-4 w-4 fill-yellow-500" /> +{selectedAch.reward_coins || 10} Coins
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
