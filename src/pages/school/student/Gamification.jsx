import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import {
  Award, BookOpen, CheckCircle2, Medal, Star, Target, Trophy, UserCheck,
  Gamepad2, Map, Zap, Grid, Coins, Wallet, Brain, Volume2, VolumeX, Flame,
  Sparkles, Clock, Compass, HelpCircle, Music, Swords, ChevronRight, Settings
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Import sub-components
import RewardWalletTab from './RewardWalletTab';
import AiMemorizationHubTab from './AiMemorizationHubTab';
import AchievementsTab from './AchievementsTab';
import MultiLeaderboardTab from './MultiLeaderboardTab';
import AudioSettingsModal from '@/components/school/student/AudioSettingsModal';

export default function Gamification() {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('games');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(soundEngine.getMutedStatus());
  const [isMusicOn, setIsMusicOn] = useState(soundEngine.isMusicPlaying());
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gamification/my-profile').catch(() => ({ data: null }));
      const data = res?.data?.data ?? res?.data ?? null;
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch gamification profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) soundEngine.playButtonClick();
  };

  const toggleMusic = () => {
    const musicOn = soundEngine.toggleBackgroundMusic();
    setIsMusicOn(musicOn);
    if (musicOn) soundEngine.playButtonClick();
  };

  const xp = Number(profile?.xp || 0);
  const level = Number(profile?.level || 1);
  const levelTitle = profile?.levelTitle || 'Learner';
  const coins = Number(profile?.coins || 0);
  const walletInr = Number(profile?.rewardBalanceInr ?? (xp / 100).toFixed(2));
  const currentStreak = Number(profile?.currentStreak || 0);
  const memoryScore = Number(profile?.memoryScore || 75);
  const difficulty = profile?.currentDifficulty || 'Intermediate';
  const levelProgress = Number(profile?.levelProgressPercent ?? 50);

  const navTabs = [
    { key: 'games', label: 'Games', icon: Gamepad2 },
    { key: 'wallet', label: 'Reward Wallet', icon: Wallet, badge: `₹${walletInr.toFixed(0)}` },
    { key: 'memorization', label: 'AI Memorization', icon: Brain },
    { key: 'achievements', label: 'Achievements', icon: Award },
    { key: 'leaderboards', label: 'Leaderboards', icon: Medal },
  ];

  const gamesList = [
    {
      title: 'Quiz Rush',
      desc: 'Rapid-fire NCERT quiz. Climb the leaderboards with speed and correct answers.',
      path: '/school/student/game-zone/quiz-rush',
      badge: 'Speed Run',
      badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
      gradient: 'from-violet-500/20 to-fuchsia-500/20 hover:border-violet-500',
      icon: Trophy,
      iconColor: 'text-violet-500'
    },
    {
      title: 'Treasure Hunt',
      desc: 'Brave checkpoints, unlock mysterious maps, and retrieve epic treasure chest rewards.',
      path: '/school/student/game-zone/treasure-hunt',
      badge: 'Adventure',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      gradient: 'from-amber-500/20 to-orange-500/20 hover:border-amber-500',
      icon: Compass,
      iconColor: 'text-amber-500'
    },
    {
      title: 'Math Sprint',
      desc: '60-second rapid-fire arithmetic sums. Test your math speed!',
      path: '/school/student/game-zone/math-sprint',
      badge: 'Rapid Fire',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      gradient: 'from-rose-500/20 to-pink-500/20 hover:border-rose-500',
      icon: Zap,
      iconColor: 'text-rose-500'
    },
    {
      title: 'Memory Match',
      desc: 'Match definitions, terms, and NCERT diagrams in the fewest turns possible.',
      path: '/school/student/game-zone/memory-match',
      badge: 'Brain Exercise',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      gradient: 'from-emerald-50/50 to-white hover:border-emerald-500 dark:from-slate-900 dark:to-slate-950',
      icon: Brain,
      iconColor: 'text-emerald-500'
    },
    {
      title: 'Word Master',
      desc: 'Scrambled definitions puzzles. Unscramble the letters to match the academic clue.',
      path: '/school/student/game-zone/word-master',
      badge: 'Vocab Puzzle',
      badgeColor: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
      gradient: 'from-fuchsia-500/20 to-rose-500/20 hover:border-fuchsia-500',
      icon: BookOpen,
      iconColor: 'text-fuchsia-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading EDDVA Gamification Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AudioSettingsModal isOpen={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gamification Center</h1>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              PROD READY
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
            Earn XP, Coins, and ₹ Real Reward Credits (100 XP = ₹1) through learning, games, and quizzes.
          </p>
        </div>

        {/* Audio Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            <span>{isMuted ? 'SFX Muted' : 'SFX On'}</span>
          </button>

          <button
            onClick={toggleMusic}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold shadow-sm transition ${isMusicOn
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
              }`}
          >
            <Music className={`h-4 w-4 ${isMusicOn ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isMusicOn ? 'BGM Playing' : 'BGM Off'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setIsAudioModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            title="Audio Settings"
          >
            <Settings className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Hero Profile & AI Progress Bar Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Avatar & Basic Stats */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl font-black text-white shadow-lg">
                {levelTitle[0]}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-amber-400 ring-2 ring-white dark:ring-slate-900">
                {level}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">{levelTitle}</h2>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  Level {level}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-3 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                  <Flame className="h-3.5 w-3.5 fill-orange-500" /> {currentStreak} Day Streak
                </span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">
                  AI Difficulty: {difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Center: AI Progress Bar & Next Level Predictor */}
          <div className="flex-1 max-w-md space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Level {level} Progress
              </span>
              <span className="text-slate-900 dark:text-white font-black">{levelProgress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {profile?.estimatedTimeToNextLevel || '30 mins to Level Up'}</span>
              <span className="text-purple-600 dark:text-purple-400">Memory Score: {memoryScore}%</span>
            </div>
          </div>

          {/* Right: Quick Economy Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40 text-center min-w-[95px]">
              <p className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400">XP Points</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{xp}</p>
            </div>
            <div className="rounded-xl bg-yellow-50/60 p-3 border border-yellow-100 dark:bg-yellow-950/20 dark:border-yellow-900/40 text-center min-w-[95px]">
              <p className="text-[9px] font-black uppercase text-yellow-600 dark:text-yellow-400">EDDVA Coins</p>
              <p className="text-base font-black text-slate-900 dark:text-white">{coins}</p>
            </div>
            <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-center min-w-[95px] col-span-2 sm:col-span-1">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">Reward Wallet</p>
              <p className="text-base font-black text-emerald-700 dark:text-emerald-300">₹{walletInr.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scrollable Sub-Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                soundEngine.playButtonClick();
                setActiveTab(tab.key);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shrink-0 ${isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'games' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in pt-2">
          {gamesList.map((game, i) => {
            const GameIcon = game.icon;
            return (
              <div
                key={i}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${game.gradient}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                    <GameIcon className={`h-6 w-6 ${game.iconColor}`} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed min-h-[48px]">
                      {game.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <Link
                    to={game.path}
                    onClick={() => soundEngine.playXpChime()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-750 transition shadow"
                  >
                    Enter Game Arena
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {activeTab === 'wallet' && <RewardWalletTab profile={profile} onRefresh={fetchProfile} />}
      {activeTab === 'memorization' && <AiMemorizationHubTab />}
      {activeTab === 'achievements' && <AchievementsTab />}
      {activeTab === 'leaderboards' && <MultiLeaderboardTab currentProfile={profile} />}
    </div>
  );
}
