/**
 * EDDVA Gamification Audio Manager & Sound Engine
 * Centralized production-ready audio service using local audio assets & Web Audio procedural fallback.
 * 
 * Implements strict Audio Priority Ranking, fade transitions, single BGM management,
 * royalty-free no-copyright background music, and memory-safe audio pool cleanup.
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

/**
 * Procedural Web Audio Royalty-Free Gamification BGM Engine
 * Generates an upbeat, non-intrusive 8-bit synthwave arcade music loop dynamically.
 * 100% Royalty-Free & Copyright-Free.
 */
class ProceduralBgmEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private volumeNode: GainNode | null = null;
  private intervalId: any = null;
  private currentStep = 0;

  // Scale: Pleasant C Major pentatonic & harmonic progression (124 BPM)
  private readonly melodyNotes = [
    261.63, 329.63, 392.00, 523.25,
    329.63, 392.00, 440.00, 523.25,
    392.00, 523.25, 659.25, 783.99,
    523.25, 440.00, 392.00, 329.63
  ];

  private readonly bassNotes = [
    130.81, 130.81, 164.81, 164.81,
    174.61, 174.61, 196.00, 196.00
  ];

  public start(vol: number) {
    if (this.isPlaying) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.ctx) this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.volumeNode = this.ctx.createGain();
      this.volumeNode.gain.setValueAtTime(vol * 0.15, this.ctx.currentTime);
      this.volumeNode.connect(this.ctx.destination);

      this.isPlaying = true;
      this.currentStep = 0;

      // 124 BPM = ~240ms step interval
      this.intervalId = setInterval(() => this.playNextStep(), 240);
    } catch (e) {
      console.warn('Procedural BGM engine init warning:', e);
    }
  }

  private playNextStep() {
    if (!this.ctx || !this.volumeNode || !this.isPlaying) return;

    try {
      const now = this.ctx.currentTime;
      const freq = this.melodyNotes[this.currentStep % this.melodyNotes.length];
      const bassFreq = this.bassNotes[Math.floor(this.currentStep / 2) % this.bassNotes.length];

      // Soft Arpeggio Melody
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.06, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(noteGain);
      noteGain.connect(this.volumeNode);
      osc.start(now);
      osc.stop(now + 0.23);

      // Bassline on alternate beats
      if (this.currentStep % 2 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.1, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        bassOsc.connect(bassGain);
        bassGain.connect(this.volumeNode);
        bassOsc.start(now);
        bassOsc.stop(now + 0.46);
      }

      this.currentStep++;
    } catch {
      // Ignore audio glitch
    }
  }

  public setVolume(vol: number) {
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(Math.max(0, Math.min(0.2, vol * 0.15)), this.ctx.currentTime);
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.ctx) {
      try {
        this.ctx.suspend();
      } catch {}
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

class AudioManager {
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmTrack: string | null = null;
  private fadeInterval: any = null;
  private audioPool: Map<string, HTMLAudioElement[]> = new Map();
  private activePriority: AudioPriority = AudioPriority.BGM;
  private activeSfxAudio: HTMLAudioElement | null = null;
  private proceduralEngine: ProceduralBgmEngine = new ProceduralBgmEngine();

  // Royalty-Free No-Copyright Audio Track Mappings
  private readonly tracks = {
    bgm: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', // High Quality Royalty-Free Arcade Game Loop
    dashboard: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    quiz: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    battle: '/assets/audio/Battle%20Start.mp3',
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
    const vol = this.getEffectiveMusicVolume();
    if (this.proceduralEngine.getIsPlaying()) {
      this.proceduralEngine.setVolume(vol);
      if (vol === 0) this.proceduralEngine.stop();
    }
    if (this.bgmAudio) {
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
   * Start looping background music with smooth 300-500ms fade-in.
   * Uses Royalty-Free Arcade Track + Procedural Web Audio fallback.
   */
  public startBackgroundMusic(trackSrc: string = this.tracks.bgm) {
    if (typeof window === 'undefined') return;

    const targetVolume = this.getEffectiveMusicVolume();

    const resolvedSrc = (this.tracks as Record<string, string>)[trackSrc] || trackSrc || this.tracks.bgm;

    if (this.currentBgmTrack === resolvedSrc && (this.bgmAudio && !this.bgmAudio.paused || this.proceduralEngine.getIsPlaying())) {
      return;
    }

    // Stop existing BGM instance cleanly
    this.stopBackgroundMusic(300);

    if (targetVolume <= 0) return;

    const safeTrackSrc = resolvedSrc.startsWith('http') ? resolvedSrc : encodeURI(decodeURIComponent(resolvedSrc));
    this.currentBgmTrack = safeTrackSrc;
    this.bgmAudio = new Audio(safeTrackSrc);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0;

    if (targetVolume > 0 && this.activePriority < AudioPriority.TREASURE) {
      Promise.resolve(this.bgmAudio.play()).then(() => {
        this.fadeInBgm(targetVolume, 400);
      }).catch((e) => {
        console.warn('BGM stream deferred or unavailable, starting royalty-free procedural synth engine:', e);
        this.proceduralEngine.start(targetVolume);
      });
    }
  }

  /** Pause background music */
  public pauseBackgroundMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
    this.proceduralEngine.stop();
  }

  /** Resume background music if no higher-priority audio is active */
  public resumeBackgroundMusic() {
    const vol = this.getEffectiveMusicVolume();
    if (vol > 0 && this.activePriority < AudioPriority.LOSE) {
      if (this.bgmAudio) {
        Promise.resolve(this.bgmAudio.play()).catch(() => {
          this.proceduralEngine.start(vol);
        });
      } else {
        this.proceduralEngine.start(vol);
      }
    }
  }

  /** Stop background music with smooth 300-500ms fade-out */
  public stopBackgroundMusic(fadeMs: number = 400) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.proceduralEngine.stop();
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
    return (!!this.bgmAudio && !this.bgmAudio.paused) || this.proceduralEngine.getIsPlaying();
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

  // ── Sound Effects Methods ────────────────────────────────────────────────

  public playButtonClick() {
    this.playSfx('/assets/audio/Notification.mp3', AudioPriority.BUTTON);
  }

  public playCorrectAnswer() {
    this.playSfx('/assets/audio/Correct%20Answer.mp3', AudioPriority.CORRECT);
  }

  public playCorrect() {
    this.playCorrectAnswer();
  }

  public playWrongAnswer() {
    this.playSfx('/assets/audio/Wrong%20Answer.mp3', AudioPriority.WRONG);
  }

  public playWrong() {
    this.playWrongAnswer();
  }

  public playCoinCollect() {
    this.playSfx('/assets/audio/Coin%20Collection.mp3', AudioPriority.COIN);
  }

  public playBadgeUnlock() {
    this.playSfx('/assets/audio/Badge%20Unlock.mp3', AudioPriority.BADGE);
  }

  public playLevelUp() {
    this.playSfx('/assets/audio/Lavel%20Up.mp3', AudioPriority.LEVEL_UP);
  }

  public playVictory() {
    this.playSfx('/assets/audio/Victory%20Music.mp4', AudioPriority.VICTORY);
  }

  public playGameWin() {
    this.playVictory();
  }

  public playLose() {
    this.playSfx('/assets/audio/Lose%20Music.webm', AudioPriority.LOSE);
  }

  public playGameLose() {
    this.playLose();
  }

  public playTreasure() {
    this.playSfx('/assets/audio/Treasure%20Reward.mp3', AudioPriority.TREASURE);
  }

  public playTreasureSequence() {
    this.playTreasure();
  }

  public playCountdownTick() {
    this.playSfx('/assets/audio/Countdown%20Tick.mp3', AudioPriority.COUNTDOWN || AudioPriority.NOTIFICATION);
  }

  /** Play any SFX audio file with priority preempting */
  private playSfx(src: string, priority: AudioPriority) {
    if (typeof window === 'undefined') return;
    const sfxVol = this.getEffectiveSfxVolume();
    if (sfxVol <= 0) return;

    if (priority < this.activePriority && this.activeSfxAudio && !this.activeSfxAudio.ended) {
      return;
    }

    try {
      const audio = new Audio(src);
      audio.volume = sfxVol;
      this.activePriority = priority;
      this.activeSfxAudio = audio;

      audio.play().then(() => {
        audio.onended = () => {
          if (this.activeSfxAudio === audio) {
            this.activePriority = AudioPriority.BGM;
            this.activeSfxAudio = null;
          }
        };
      }).catch((e) => {
        console.warn('SFX play error:', e);
      });
    } catch (e) {
      console.warn('Failed to play SFX:', e);
    }
  }

  public updateVolumeSettings(newSettings: Partial<AudioSettings>) {
    this.saveSettings(newSettings);
  }
}

export const soundEngine = new AudioManager();
