import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import {
  Award, BookOpen, CheckCircle2, Medal, Star, Target, Trophy, UserCheck,
  Gamepad2, Map, Zap, Grid, Coins, Wallet, Brain, Volume2, VolumeX, Flame,
  Sparkles, Clock, Compass, HelpCircle, Music, Swords, ChevronRight, Settings,
  Crown
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
  const levelTitle = profile?.levelTitle || 'Elite Scholar';
  const coins = Number(profile?.coins || 0);
  const walletInr = Number(((coins || 0) / 10).toFixed(2));
  const currentStreak = Number(profile?.currentStreak || 0);
  const memoryScore = Number(profile?.memoryScore || 75);
  const difficulty = profile?.currentDifficulty || 'Intermediate';
  const levelProgress = Number(profile?.levelProgressPercent ?? 42);

  const navTabs = [
    { key: 'games', label: 'Game Arena', icon: Gamepad2 },
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
      gradient: 'from-violet-50/80 to-indigo-50/50 dark:from-slate-900 dark:to-violet-950/20',
      hoverBorder: 'hover:border-violet-400',
      hoverTitle: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
      icon: Trophy,
      iconColor: 'text-violet-600 dark:text-violet-400',
      btnGradient: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/20'
    },
    {
      title: 'Treasure Hunt',
      desc: 'Brave checkpoints, unlock mysterious maps, and retrieve epic treasure chest rewards.',
      path: '/school/student/game-zone/treasure-hunt',
      badge: 'Adventure',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      gradient: 'from-amber-50/80 to-orange-50/50 dark:from-slate-900 dark:to-amber-950/20',
      hoverBorder: 'hover:border-amber-400',
      hoverTitle: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
      icon: Compass,
      iconColor: 'text-amber-600 dark:text-amber-400',
      btnGradient: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
    },
    {
      title: 'Math Sprint',
      desc: '60-second rapid-fire arithmetic sums. Test your math speed!',
      path: '/school/student/game-zone/math-sprint',
      badge: 'Rapid Fire',
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
      gradient: 'from-rose-50/80 to-pink-50/50 dark:from-slate-900 dark:to-rose-950/20',
      hoverBorder: 'hover:border-rose-400',
      hoverTitle: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
      icon: Zap,
      iconColor: 'text-rose-600 dark:text-rose-400',
      btnGradient: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-rose-500/20'
    },
    {
      title: 'Memory Match',
      desc: 'Match definitions, terms, and NCERT diagrams in the fewest turns possible.',
      path: '/school/student/game-zone/memory-match',
      badge: 'Brain Exercise',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      gradient: 'from-emerald-50/80 to-teal-50/50 dark:from-slate-900 dark:to-emerald-950/20',
      hoverBorder: 'hover:border-emerald-400',
      hoverTitle: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
      icon: Brain,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      btnGradient: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
    },
    {
      title: 'Word Master',
      desc: 'Scrambled definitions puzzles. Unscramble letters to match the academic clue.',
      path: '/school/student/game-zone/word-master',
      badge: 'Vocab Puzzle',
      badgeColor: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-300',
      gradient: 'from-fuchsia-50/80 to-purple-50/50 dark:from-slate-900 dark:to-fuchsia-950/20',
      hoverBorder: 'hover:border-fuchsia-400',
      hoverTitle: 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400',
      icon: BookOpen,
      iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
      btnGradient: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 shadow-fuchsia-500/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
        <p className="text-xs font-bold text-slate-500">Loading EDDVA Gamification Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <AudioSettingsModal isOpen={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} />

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 dark:bg-sky-950/50 px-2.5 py-0.5 text-[10px] font-black uppercase text-sky-800 dark:text-sky-300">
            <Sparkles className="h-3 w-3 text-sky-500" />
            AI Gamified Learning Arena
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Student Gamification & Arcade
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Play educational games, complete daily missions, unlock badges, and earn reward wallet credits!
          </p>
        </div>

        {/* Quick Audio & Settings Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSound}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-xs ${
              isMuted
                ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-red-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound ON'}</span>
          </button>

          <button
            onClick={toggleMusic}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-xs ${
              isMusicOn
                ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
            }`}
            title={isMusicOn ? 'Pause Background Music' : 'Play Background Music'}
          >
            <Music className={`h-4 w-4 ${isMusicOn ? 'text-indigo-600 animate-pulse dark:text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isMusicOn ? 'BGM On' : 'BGM Off'}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              setIsAudioModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            title="Audio Settings"
          >
            <Settings className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {/* Hero Profile & Economy Card (EDDVA Light Blue Theme) */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-200/90 bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50/80 p-4 sm:p-5 shadow-xs dark:border-sky-950 dark:from-slate-900 dark:via-blue-950/40 dark:to-indigo-950 flex">
        {/* EDDVA Brand Left Accent Line */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 via-blue-500 to-indigo-600 rounded-l-2xl" />

        <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-2">
          {/* Left: Avatar & Profile Info */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-xl font-black text-white shadow-md ring-2 ring-sky-300/30">
                {levelTitle[0]}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-black text-sky-300 ring-2 ring-white dark:ring-slate-900">
                {level}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">{levelTitle}</h2>
                <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 text-white px-2 py-0.5 text-[10px] font-black uppercase shadow-xs">
                  <Crown className="h-3 w-3" /> Level {level}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  <Flame className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> {currentStreak} Day Streak
                </span>
                <span>•</span>
                <span className="text-blue-700 dark:text-blue-300 font-black">
                  AI Difficulty: {difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Level Progress */}
          <div className="flex-1 max-w-sm space-y-1.5 bg-white/80 dark:bg-slate-950/60 p-3 rounded-xl border border-sky-100 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" /> Level {level} Progress
              </span>
              <span className="text-sky-600 dark:text-sky-400">{levelProgress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-sky-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 transition-all duration-500" style={{ width: `${levelProgress}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {profile?.estimatedTimeToNextLevel || '30 mins of study'}</span>
              <span className="text-purple-600 dark:text-purple-400 font-black">Memory Score: {memoryScore}%</span>
            </div>
          </div>

          {/* Right: Economy Branded Stat Cards */}
          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="rounded-xl bg-white/80 p-2.5 border border-sky-200/80 dark:bg-sky-950/40 dark:border-sky-900/40 text-center min-w-[88px] shadow-2xs">
              <p className="text-[9px] font-black uppercase text-sky-600 dark:text-sky-300 tracking-wider">XP Points</p>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{xp}</p>
            </div>

            <div className="rounded-xl bg-white/80 p-2.5 border border-blue-200/80 dark:bg-blue-950/40 dark:border-blue-900/40 text-center min-w-[88px] shadow-2xs">
              <p className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-300 tracking-wider">EDDVA Coins</p>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">{coins}</p>
            </div>

            <div className="rounded-xl bg-white/80 p-2.5 border border-teal-200/80 dark:bg-teal-950/40 dark:border-teal-900/40 text-center min-w-[88px] shadow-2xs">
              <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-300 tracking-wider">Reward Wallet</p>
              <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{walletInr.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-sky-50/50 hover:text-sky-600 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black ${
                  isActive ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 animate-fade-in">
          {gamesList.map((game, i) => {
            const GameIcon = game.icon;
            return (
              <div
                key={i}
                className={`group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br p-4 sm:p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${game.gradient} ${game.hoverBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${game.badgeColor}`}>
                      {game.badge}
                    </span>
                    <GameIcon className={`h-5 w-5 ${game.iconColor}`} />
                  </div>

                  <div className="space-y-1">
                    <h3 className={`text-base font-black text-slate-900 dark:text-white transition-colors ${game.hoverTitle}`}>
                      {game.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px]">
                      {game.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Link
                    to={game.path}
                    onClick={() => soundEngine.playXpChime()}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white transition shadow-xs ${game.btnGradient}`}
                  >
                    <span>Enter Game Arena</span>
                    <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
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
