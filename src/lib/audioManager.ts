/**
 * EDDVA Studio Audio & Background Music Engine
 * Plays high-quality studio audio MP3 tracks for dashboard, quizzes, battles, win victory, and defeat
 */

class AudioManager {
  private isMuted: boolean = false;
  private isBgmEnabled: boolean = false;
  private bgmAudio: HTMLAudioElement | null = null;
  private currentTrack: 'dashboard' | 'quiz' | 'battle' = 'dashboard';

  // High quality studio royalty-free MP3 audio tracks
  private bgmTracks = {
    dashboard: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
    quiz: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=arcade-game-10680.mp3',
    battle: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=battle-epic-18427.mp3',
    win: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_bb630cc098.mp3?filename=success-fanfare-trumpets-6000.mp3',
    lose: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=game-over-arcade-6435.mp3',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.bgmAudio = new Audio(this.bgmTracks.dashboard);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.35;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.bgmAudio) {
      this.bgmAudio.muted = this.isMuted;
    }
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else if (this.isBgmEnabled) {
      this.startBackgroundMusic(this.currentTrack);
    }
    return this.isMuted;
  }

  public toggleBackgroundMusic(): boolean {
    this.isBgmEnabled = !this.isBgmEnabled;
    if (this.isBgmEnabled && !this.isMuted) {
      this.startBackgroundMusic(this.currentTrack);
    } else {
      this.stopBackgroundMusic();
    }
    return this.isBgmEnabled;
  }

  public startBackgroundMusic(trackType: 'dashboard' | 'quiz' | 'battle' = 'dashboard') {
    this.isBgmEnabled = true;
    this.currentTrack = trackType;

    if (this.isMuted || typeof window === 'undefined') return;

    if (!this.bgmAudio) {
      this.bgmAudio = new Audio();
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.35;
    }

    const targetSrc = this.bgmTracks[trackType] || this.bgmTracks.dashboard;
    if (this.bgmAudio.src !== targetSrc) {
      this.bgmAudio.src = targetSrc;
    }

    this.bgmAudio.play().catch((e) => {
      console.warn('Audio playback waiting for user click:', e);
    });
  }

  public stopBackgroundMusic() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public isMusicPlaying(): boolean {
    return this.isBgmEnabled && !this.isMuted && !!this.bgmAudio && !this.bgmAudio.paused;
  }

  public getMutedStatus(): boolean {
    return this.isMuted;
  }

  /**
   * Play Studio Game Victory Win MP3 Audio
   */
  public playGameWin() {
    if (this.isMuted || typeof window === 'undefined') return;
    try {
      const winAudio = new Audio(this.bgmTracks.win);
      winAudio.volume = 0.7;
      winAudio.play().catch(() => {});
    } catch (e) {
      this.playLevelUp();
    }
  }

  /**
   * Play Studio Game Defeat Lose MP3 Audio
   */
  public playGameLose() {
    if (this.isMuted || typeof window === 'undefined') return;
    try {
      const loseAudio = new Audio(this.bgmTracks.lose);
      loseAudio.volume = 0.6;
      loseAudio.play().catch(() => {});
    } catch (e) {
      this.playWrong();
    }
  }

  // Sound Effects (SFX)
  public playXpChime() {
    this.playSynthSound(523.25, 1046.50, 'sine', 0.2);
  }

  public playCoinDrop() {
    this.playSynthSound(987.77, 1318.51, 'triangle', 0.25);
  }

  public playCorrect() {
    this.playSynthSound(659.25, 1046.50, 'sine', 0.3);
  }

  public playWrong() {
    this.playSynthSound(220, 110, 'sawtooth', 0.3);
  }

  public playLevelUp() {
    this.playSynthSound(440, 1318.51, 'triangle', 0.5);
  }

  private playSynthSound(startFreq: number, endFreq: number, type: OscillatorType, duration: number) {
    if (this.isMuted) return;
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

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }
}

export const soundEngine = new AudioManager();
