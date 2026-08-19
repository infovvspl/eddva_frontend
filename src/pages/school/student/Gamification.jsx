import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { soundEngine } from '@/lib/audioManager';
import {
  Award, BookOpen, Medal, Trophy, Gamepad2, Wallet, Brain, Volume2, VolumeX,
  Flame, Compass, Music, ChevronRight, Settings, ArrowLeft, Coins, Star,
} from 'lucide-react';

// Import sub-components
import RewardWalletTab from './RewardWalletTab';
import AchievementsTab from './AchievementsTab';
import MultiLeaderboardTab from './MultiLeaderboardTab';
import AudioSettingsModal from '@/components/school/student/AudioSettingsModal';

// The lobby shares the arcade's design system rather than inventing a second
// one, so walking from here into Quiz Rush feels like moving between rooms of
// the same building instead of between two products.
import './game-zone/quiz-rush/arena.css';
import { ArenaLabel, ArenaRing } from './game-zone/quiz-rush/ArenaKit';

// Each cabinet gets one accent colour, used for its wash, marquee light and
// call to action. Kept here so a new game is one entry rather than a spread of
// Tailwind classes.
const GAMES = [
  {
    title: 'Quiz Rush',
    desc: 'Rapid-fire NCERT questions. Three lives, thirty seconds each, and it only gets harder.',
    path: '/school/student/game-zone/quiz-rush',
    badge: 'Speed Run',
    icon: Trophy,
    accent: '#22d3ee',
  },
  {
    title: 'Treasure Hunt',
    desc: 'Clear checkpoints, unlock the map and open the chest at the end of the trail.',
    path: '/school/student/game-zone/treasure-hunt',
    badge: 'Adventure',
    icon: Compass,
    accent: '#fbbf24',
  },
  {
    title: 'Memory Match',
    desc: 'Pair up definitions, terms and diagrams in as few turns as you can manage.',
    path: '/school/student/game-zone/memory-match',
    badge: 'Brain Training',
    icon: Brain,
    accent: '#a3e635',
  },
  {
    title: 'Word Master',
    desc: 'Unscramble the letters to match the clue. Academic vocabulary, against the clock.',
    path: '/school/student/game-zone/word-master',
    badge: 'Vocab Puzzle',
    icon: BookOpen,
    accent: '#e879f9',
  },
];

export default function Gamification() {
  const navigate = useNavigate();
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
  const levelProgress = Number(profile?.levelProgressPercent ?? 42);

  const navTabs = [
    { key: 'games', label: 'Game Arena', icon: Gamepad2 },
    { key: 'wallet', label: 'Reward Wallet', icon: Wallet, badge: `₹${walletInr.toFixed(0)}` },
    { key: 'achievements', label: 'Achievements', icon: Award },
    { key: 'leaderboards', label: 'Leaderboards', icon: Medal },
  ];

  if (loading) {
    return (
      <div className="qr-arena relative overflow-hidden rounded-3xl">
        <div className="qr-backdrop qr-backdrop--inset" aria-hidden="true">
          <div className="qr-aurora qr-aurora--a" />
          <div className="qr-aurora qr-aurora--b" />
          <div className="qr-vignette" />
        </div>
        <div className="relative z-10 flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="qr-float qr-display text-3xl font-bold tracking-[0.3em] text-cyan-300 qr-neon">
            ARCADE
          </div>
          <ArenaLabel tone="cyan">Loading your player profile</ArenaLabel>
        </div>
      </div>
    );
  }

  const iconBtn =
    'qr-chip inline-flex items-center gap-1.5 border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition';

  return (
    <div className="qr-arena relative overflow-hidden rounded-3xl pb-8">
      {/* Contained atmosphere — the dashboard sidebar stays visible beside it. */}
      <div className="qr-backdrop qr-backdrop--inset" aria-hidden="true">
        <div className="qr-aurora qr-aurora--a" />
        <div className="qr-aurora qr-aurora--b" />
        <div className="qr-aurora qr-aurora--c" />
        <div className="qr-floor" />
        <div className="qr-scanlines" />
        <div className="qr-grain" />
        <div className="qr-vignette" />
      </div>

      <AudioSettingsModal isOpen={isAudioModalOpen} onClose={() => setIsAudioModalOpen(false)} />

      <div className="relative z-10 space-y-6 p-5 sm:p-7">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="qr-display text-[11px] font-bold uppercase tracking-[0.4em] text-fuchsia-300/80">
              Player HQ
            </p>
            <h1 className="qr-display relative mt-1.5 text-3xl font-bold uppercase tracking-[0.06em] text-white sm:text-4xl">
              <span aria-hidden="true" className="absolute inset-0 translate-x-[2px] text-fuchsia-500/60 blur-[1px]">
                Game Arcade
              </span>
              <span aria-hidden="true" className="absolute inset-0 -translate-x-[2px] text-cyan-400/60 blur-[1px]">
                Game Arcade
              </span>
              <span className="relative">Game Arcade</span>
            </h1>
            <p className="qr-read mt-2 max-w-md text-xs font-medium text-slate-400">
              Play, climb the boards, unlock badges and turn what you learn into
              reward credits.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className={`${iconBtn} ${
                isMuted
                  ? 'border-rose-400/35 bg-rose-500/10 text-rose-300'
                  : 'border-lime-400/30 bg-lime-400/10 text-lime-300'
              }`}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
            </button>

            <button
              onClick={toggleMusic}
              title={isMusicOn ? 'Pause Background Music' : 'Play Background Music'}
              className={`${iconBtn} ${
                isMusicOn
                  ? 'border-fuchsia-400/35 bg-fuchsia-500/10 text-fuchsia-300'
                  : 'border-white/10 bg-white/[0.03] text-slate-400'
              }`}
            >
              <Music className={`h-4 w-4 ${isMusicOn ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isMusicOn ? 'BGM On' : 'BGM Off'}</span>
            </button>

            <button
              onClick={() => { soundEngine.playButtonClick(); setIsAudioModalOpen(true); }}
              title="Audio Settings"
              className={`${iconBtn} border-white/10 bg-white/[0.03] text-slate-300 hover:border-cyan-400/30`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => { soundEngine.playButtonClick(); navigate('/school/student'); }}
              title="Exit to dashboard"
              className={`${iconBtn} border-white/10 bg-white/[0.03] text-slate-300 hover:border-rose-400/35 hover:text-rose-300`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>

        {/* ── Player card ─────────────────────────────────────────────────── */}
        <section className="qr-panel qr-rise flex flex-col items-center gap-6 p-5 sm:flex-row sm:p-6">
          {/* Level ring — progress toward the next level, read at a glance. */}
          <ArenaRing percent={levelProgress} size={104}>
            <span className="qr-display text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Level
            </span>
            <span className="qr-display text-3xl font-bold leading-none text-cyan-300 qr-neon">
              {level}
            </span>
            <span className="qr-display text-[9px] font-bold text-slate-500">
              {levelProgress}%
            </span>
          </ArenaRing>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <ArenaLabel tone="muted">Current rank</ArenaLabel>
            <h2 className="qr-display mt-1 truncate text-2xl font-bold uppercase tracking-wider text-white">
              {levelTitle}
            </h2>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="qr-chip qr-flicker inline-flex items-center gap-1.5 border border-orange-400/35 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-300">
                <Flame className="h-3.5 w-3.5 fill-current" />
                {currentStreak} day streak
              </span>
              <span className="qr-read text-[11px] font-medium text-slate-500">
                {levelProgress}% toward level {level + 1}
              </span>
            </div>
          </div>

          {/* Economy */}
          <div className="grid w-full grid-cols-3 gap-2.5 sm:w-auto">
            {[
              { label: 'XP', value: xp.toLocaleString(), icon: Star, tone: 'text-amber-300', glow: 'qr-neon--amber' },
              { label: 'Coins', value: coins.toLocaleString(), icon: Coins, tone: 'text-fuchsia-300', glow: 'qr-neon--magenta' },
              { label: 'Wallet', value: `₹${walletInr.toFixed(0)}`, icon: Wallet, tone: 'text-lime-300', glow: '' },
            ].map((s) => (
              <div key={s.label} className="qr-chip border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center sm:min-w-[92px]">
                <s.icon className={`mx-auto h-3.5 w-3.5 ${s.tone}`} />
                <p className={`qr-display mt-1.5 text-lg font-bold tabular-nums leading-none ${s.tone} ${s.glow}`}>
                  {s.value}
                </p>
                <ArenaLabel tone="muted" className="mt-1 block">{s.label}</ArenaLabel>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { soundEngine.playButtonClick(); setActiveTab(tab.key); }}
                className={`qr-chip qr-display flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  isActive
                    ? 'border-cyan-400/60 bg-cyan-400/15 text-cyan-200 qr-glow-cyan'
                    : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-cyan-400/30 hover:text-cyan-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                    isActive ? 'bg-cyan-400/20 text-cyan-100' : 'bg-white/10 text-slate-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Cabinets ────────────────────────────────────────────────────── */}
        {activeTab === 'games' && (
          <div className="qr-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {GAMES.map((game) => {
              const GameIcon = game.icon;
              return (
                <Link
                  key={game.title}
                  to={game.path}
                  onClick={() => soundEngine.playXpChime()}
                  style={{ '--cab': game.accent }}
                  className="qr-cab group flex flex-col justify-between border border-white/10 bg-slate-950/60 p-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="qr-chip qr-display border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em]"
                        style={{ borderColor: `${game.accent}55`, color: game.accent, background: `${game.accent}14` }}
                      >
                        {game.badge}
                      </span>
                      <GameIcon
                        className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: game.accent }}
                      />
                    </div>

                    <h3 className="qr-display text-lg font-bold uppercase tracking-wide text-white">
                      {game.title}
                    </h3>
                    <p className="qr-read min-h-[52px] text-[11px] font-medium leading-relaxed text-slate-400">
                      {game.desc}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="qr-display text-[10px] font-bold uppercase tracking-[0.2em] transition-opacity"
                      style={{ color: game.accent }}
                    >
                      Insert coin
                    </span>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full border transition-transform duration-300 group-hover:translate-x-1"
                      style={{ borderColor: `${game.accent}55`, color: game.accent, background: `${game.accent}14` }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* The other tabs render their existing light components. Framing them
            as an inset screen keeps them looking deliberate against the dark
            cabinet rather than like an unstyled panel. */}
        {activeTab !== 'games' && (
          <div className="qr-inset qr-rise rounded-2xl p-4 sm:p-5">
            {activeTab === 'wallet' && <RewardWalletTab profile={profile} onRefresh={fetchProfile} />}
            {activeTab === 'achievements' && <AchievementsTab />}
            {activeTab === 'leaderboards' && <MultiLeaderboardTab currentProfile={profile} />}
          </div>
        )}
      </div>
    </div>
  );
}
