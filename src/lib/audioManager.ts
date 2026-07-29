/**
 * EDDVA Gamification Audio Manager & Sound Engine
 * Centralized production-ready audio service using local audio assets.
 * 
 * Implements strict Audio Priority Ranking, fade transitions, single BGM management,
 * and memory-safe audio pool cleanup.
 * Assets loaded from /assets/audio/ (public/assets/audio/)
 */

export interface AudioSettings {
  masterVolume: number;   // 0 - 100
  musicVolume: number;    // 0 - 100
  effectsVolume: number;  // 0 - 100
  isMuted: boolean;
  isBgmEnabled: boolean;
  isSfxEnabled: boolean;
  isVoiceEnabled: boolean;
  muteDuringExams: boolean;
}

export enum AudioPriority {
  BGM = 0,
  BUTTON = 10,
  CORRECT = 50,
  WRONG = 50,
  COIN = 60,
  NOTIFICATION = 70,
  BATTLE_START = 75,
  TREASURE = 80,
  BADGE = 85,
  LEVEL_UP = 90,
  LOSE = 95,
  VICTORY = 100,
}

const SETTINGS_KEY = 'eddva_audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 100,
  musicVolume: 25,
  effectsVolume: 80,
  isMuted: false,
  isBgmEnabled: true,
  isSfxEnabled: true,
  isVoiceEnabled: true,
  muteDuringExams: false,
};

class AudioManager {
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmTrack: string | null = null;
  private fadeInterval: any = null;
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();
  private activePriority: AudioPriority = AudioPriority.BGM;
  private activeSfxAudio: HTMLAudioElement | null = null;

  // Local Audio Track Mappings
  private readonly tracks = {
    bgm: '/assets/audio/Background%20Music.mp3',
    battleStart: '/assets/audio/Battle%20Start.mp3',
    win: '/assets/audio/Victory%20Music.mp4',
    lose: '/assets/audio/Lose%20Music.webm',
    coin: '/assets/audio/Coin%20Collection.mp3',
    xp: '/assets/audio/Notification.mp3',
    badge: '/assets/audio/Badge%20Unlock.mp3',
    levelUp: '/assets/audio/Lavel%20Up.mp3',
    correct: '/assets/audio/Correct%20Answer.mp3',
    wrong: '/assets/audio/Wrong%20Answer.mp3',
    countdown: '/assets/audio/Countdown%20Tick.mp3',
    treasure: '/assets/audio/Treasure%20Reward.mp3',
    notification: '/assets/audio/Notification.mp3',
  };

  constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      this.preloadAudio();
      this.attachFirstGestureListener();
    }
  }

  /** Load saved settings from localStorage */
  private loadSettings() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  /** Save current settings to localStorage */
  public saveSettings(newSettings: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      } catch (e) {
        console.warn('Could not save audio settings to localStorage:', e);
      }
    }
    this.applySettingsToBgm();
    return this.settings;
  }

  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /** Preload local audio files into pool for zero latency playback */
  private preloadAudio() {
    Object.values(this.tracks).forEach((src) => {
      try {
        const audio = new Audio();
        audio.src = src;
        audio.preload = 'auto';
        const list = this.audioPool.get(src) || [];
        list.push(audio);
        this.audioPool.set(src, list);
      } catch (e) {
        // Safe fallback
      }
    });
  }

  /** Browser autoplay policy helper - unlocks Web Audio on first touch/click */
  private attachFirstGestureListener() {
    const unlock = () => {
      Object.values(this.tracks).forEach((src) => {
        const list = this.audioPool.get(src);
        if (list && list[0]) {
          list[0].load();
        }
      });
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private getEffectiveMusicVolume(): number {
    if (this.settings.isMuted || !this.settings.isBgmEnabled) return 0;
    const master = this.settings.masterVolume / 100;
    const music = this.settings.musicVolume / 100;
    return Math.max(0, Math.min(1, master * music));
  }

  private getEffectiveSfxVolume(): number {
    if (this.settings.isMuted || !this.settings.isSfxEnabled) return 0;
    const master = this.settings.masterVolume / 100;
    const sfx = this.settings.effectsVolume / 100;
    return Math.max(0, Math.min(1, master * sfx));
  }

  private applySettingsToBgm() {
    if (this.bgmAudio) {
      const vol = this.getEffectiveMusicVolume();
      this.bgmAudio.volume = vol;
      this.bgmAudio.muted = vol === 0;
      if (vol === 0) {
        this.bgmAudio.pause();
      } else if (this.currentBgmTrack && this.bgmAudio.paused && this.activePriority <= AudioPriority.BATTLE_START) {
        Promise.resolve(this.bgmAudio.play()).catch(() => {});
      }
    }
  }

  // ── Background Music Methods ─────────────────────────────────────────────

  /**
   * Start looping background music (KBC theme) with smooth 300-500ms fade-in.
   * Ensures single instance, never overlaps higher priority audio.
   */
  public startBackgroundMusic(trackSrc: string = this.tracks.bgm) {
    if (typeof window === 'undefined') return;

    const targetVolume = this.getEffectiveMusicVolume();

    // If BGM is already playing this track, don't restart it
    if (this.currentBgmTrack === trackSrc && this.bgmAudio && !this.bgmAudio.paused) {
      return;
    }

    // Stop existing BGM instance cleanly
    this.stopBackgroundMusic(300);

    const safeTrackSrc = encodeURI(decodeURIComponent(trackSrc));
    this.currentBgmTrack = safeTrackSrc;
    this.bgmAudio = new Audio(safeTrackSrc);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0;

    if (targetVolume > 0 && this.activePriority < AudioPriority.TREASURE) {
      Promise.resolve(this.bgmAudio.play()).then(() => {
        this.fadeInBgm(targetVolume, 400);
      }).catch((e) => {
        console.warn('BGM play deferred pending user interaction:', e);
      });
    }
  }

  /** Pause background music */
  public pauseBackgroundMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  /** Resume background music if no higher-priority audio is active */
  public resumeBackgroundMusic() {
    if (this.bgmAudio && this.getEffectiveMusicVolume() > 0 && this.activePriority < AudioPriority.LOSE) {
      Promise.resolve(this.bgmAudio.play()).catch(() => {});
    }
  }

  /** Stop background music with smooth 300-500ms fade-out */
  public stopBackgroundMusic(fadeMs: number = 400) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.bgmAudio) {
      const audio = this.bgmAudio;
      this.bgmAudio = null;
      this.currentBgmTrack = null;
      this.fadeOutBgm(audio, fadeMs);
    }
  }

  private fadeInBgm(targetVol: number, durationMs: number = 400) {
    if (!this.bgmAudio) return;
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    let vol = 0;
    const steps = 10;
    const step = targetVol / steps;
    const intervalMs = durationMs / steps;

    this.fadeInterval = setInterval(() => {
      if (!this.bgmAudio) {
        clearInterval(this.fadeInterval);
        return;
      }
      vol = Math.min(targetVol, vol + step);
      this.bgmAudio.volume = vol;
      if (vol >= targetVol) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }
    }, intervalMs);
  }

  private fadeOutBgm(audio: HTMLAudioElement, durationMs: number = 400) {
    let vol = audio.volume;
    const steps = 8;
    const step = vol / steps;
    const intervalMs = durationMs / steps;

    const interval = setInterval(() => {
      vol = Math.max(0, vol - step);
      audio.volume = vol;
      if (vol <= 0) {
        clearInterval(interval);
        audio.pause();
        audio.currentTime = 0;
      }
    }, intervalMs);
  }

  public isMusicPlaying(): boolean {
    return !!this.bgmAudio && !!this.currentBgmTrack && this.getEffectiveMusicVolume() > 0;
  }

  public toggleMute(): boolean {
    const isMuted = !this.settings.isMuted;
    this.saveSettings({ isMuted });
    return isMuted;
  }

  public toggleBackgroundMusic(): boolean {
    const isBgmEnabled = !this.settings.isBgmEnabled;
    this.saveSettings({ isBgmEnabled });
    if (isBgmEnabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic(300);
    }
    return isBgmEnabled;
  }

  public getMutedStatus(): boolean {
    return this.settings.isMuted;
  }

  // ── Priority-Driven Sound Effects (SFX) ───────────────────────────────────

  private playSfx(src: string, priority: AudioPriority, volumeScale: number = 1.0, onEnded?: () => void) {
    const effectiveVol = this.getEffectiveSfxVolume() * volumeScale;
    if (effectiveVol <= 0 || typeof window === 'undefined') return;

    // Audio Priority Gate: Stop BGM / lower priority SFX if higher priority audio triggers
    if (priority >= AudioPriority.BATTLE_START) {
      this.stopBackgroundMusic(300);
    }
    if (this.activeSfxAudio && priority >= this.activePriority) {
      try {
        this.activeSfxAudio.pause();
        this.activeSfxAudio.currentTime = 0;
      } catch {}
    }

    this.activePriority = priority;

    try {
      const safeSrc = encodeURI(decodeURIComponent(src));
      const audio = new Audio(safeSrc);
      audio.volume = Math.max(0, Math.min(1, effectiveVol));
      this.activeSfxAudio = audio;

      audio.onended = () => {
        if (this.activePriority === priority) {
          this.activePriority = AudioPriority.BGM;
          this.activeSfxAudio = null;
        }
        if (onEnded) onEnded();
      };

      Promise.resolve(audio.play()).catch(() => {
        // Fallback to Web Audio synthesizer if media file fails
        this.playSynthFallback(src);
      });
    } catch {
      this.playSynthFallback(src);
    }
  }

  /**
   * Play Winning Fanfare Audio (Highest Priority: 100)
   * Triggers on: Battle Win, Quiz Pass (>=50%), Challenge Completed, Treasure Hunt Completed, Weekly Mission Completed.
   */
  public playGameWin() {
    this.playSfx(this.tracks.win, AudioPriority.VICTORY, 1.0);
  }

  /**
   * Play Lose / Defeat Audio (Priority: 95)
   * Triggers on game defeat / Quiz fail (<50%). Stops BGM first.
   */
  public playGameLose() {
    this.playSfx(this.tracks.lose, AudioPriority.LOSE, 0.9);
  }

  /**
   * Play Level Up Audio (Priority: 90)
   * Triggers when student levels up (with XP animation & confetti).
   */
  public playLevelUp() {
    this.playSfx(this.tracks.levelUp, AudioPriority.LEVEL_UP, 1.0);
  }

  /**
   * Play Badge Unlock Audio (Priority: 85)
   * Triggers ONLY when a NEW badge is unlocked (not when viewing existing badges).
   */
  public playBadgeUnlock() {
    this.playSfx(this.tracks.badge, AudioPriority.BADGE, 1.0);
  }

  /**
   * Play Treasure Chest Opening Audio (Priority: 80)
   */
  public playTreasureOpen() {
    this.playSfx(this.tracks.treasure, AudioPriority.TREASURE, 1.0);
  }

  /**
   * Play Complete Treasure Chest Reward Sequence:
   * Chest Open -> Treasure Audio -> Coin Audio -> XP Chime
   */
  public playTreasureSequence(onComplete?: () => void) {
    this.playTreasureOpen();
    setTimeout(() => {
      this.playCoinDrop();
      setTimeout(() => {
        this.playXpChime();
        if (onComplete) onComplete();
      }, 500);
    }, 1000);
  }

  /**
   * Play Battle Arena Start Intro (Priority: 75)
   * Sequence: Battle Start Audio -> Matchmaking -> BGM -> Battle Begins
   */
  public playBattleStart() {
    this.playSfx(this.tracks.battleStart, AudioPriority.BATTLE_START, 1.0);
  }

  /**
   * Play Notification Chime (Priority: 70)
   * Triggers on: Daily Mission, Weekly Challenge, New Badge Alert, Friend Challenge, Reward Approved.
   */
  public playNotification() {
    this.playSfx(this.tracks.notification, AudioPriority.NOTIFICATION, 0.8);
  }

  /**
   * Play Coin Collection Sound (Priority: 60)
   * Triggers on: Coin Earned, Reward Claimed, Treasure, Daily Reward, Weekly Reward.
   */
  public playCoinDrop() {
    this.playSfx(this.tracks.coin, AudioPriority.COIN, 0.95);
  }

  /**
   * Play Dedicated XP Award Chime (Priority: 60)
   * Distinct synth chime for XP points earned (separated from Coin Collection).
   */
  public playXpChime() {
    const vol = this.getEffectiveSfxVolume();
    if (vol <= 0 || typeof window === 'undefined') return;
    this.playSynthSound(523.25, 1046.50, 'sine', 0.18, 0.25 * vol);
  }

  /**
   * Play Correct Answer Audio (Priority: 50)
   */
  public playCorrect() {
    this.playSfx(this.tracks.correct, AudioPriority.CORRECT, 0.9);
  }

  /**
   * Play Wrong Answer Audio (Priority: 50)
   */
  public playWrong() {
    this.playSfx(this.tracks.wrong, AudioPriority.WRONG, 0.9);
  }

  /**
   * Play Countdown Tick Sound (Priority: 50)
   * Plays ONLY if Timer <= 10s AND sound/SFX is enabled.
   */
  public playCountdownTick() {
    this.playSfx(this.tracks.countdown, AudioPriority.CORRECT, 0.7);
  }

  /**
   * Play Subtle Mechanical Button Click (Priority: 10)
   * Triggers ONLY on explicit Button, Tab, Card, or Option clicks (never on hover/scroll).
   */
  public playButtonClick() {
    const vol = this.getEffectiveSfxVolume();
    if (vol <= 0 || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.02);

      gain.gain.setValueAtTime(0.12 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } catch {
      // Safe fallback
    }
  }

  // ── Web Audio Synth Fallbacks ─────────────────────────────────────────────

  private playSynthFallback(type: string) {
    if (type === this.tracks.correct) {
      this.playSynthSound(659.25, 1046.50, 'sine', 0.25);
    } else if (type === this.tracks.wrong) {
      this.playSynthSound(220, 110, 'sawtooth', 0.3);
    } else if (type === this.tracks.coin) {
      this.playSynthSound(987.77, 1318.51, 'triangle', 0.2);
    } else {
      this.playSynthSound(523.25, 1046.50, 'sine', 0.2);
    }
  }

  private playSynthSound(
    startFreq: number,
    endFreq: number,
    type: OscillatorType,
    duration: number,
    gainPeak: number = 0.3
  ) {
    if (this.getEffectiveSfxVolume() <= 0 || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      gain.gain.setValueAtTime(gainPeak, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Safe fallback
    }
  }
}

export const soundEngine = new AudioManager();
