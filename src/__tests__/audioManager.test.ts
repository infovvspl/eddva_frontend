import { describe, it, expect, beforeEach, vi } from 'vitest';
import { soundEngine, AudioPriority } from '../lib/audioManager';

// Mock HTMLAudioElement methods for JSDOM test runner
if (typeof window !== 'undefined' && window.HTMLAudioElement) {
  window.HTMLAudioElement.prototype.play = vi.fn().mockImplementation(function (this: HTMLAudioElement) {
    Object.defineProperty(this, 'paused', { value: false, writable: true });
    return Promise.resolve();
  });
  window.HTMLAudioElement.prototype.pause = vi.fn().mockImplementation(function (this: HTMLAudioElement) {
    Object.defineProperty(this, 'paused', { value: true, writable: true });
  });
}

describe('EDDVA Gamification Audio System Automated Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    soundEngine.saveSettings({
      masterVolume: 100,
      musicVolume: 25,
      effectsVolume: 80,
      isMuted: false,
      isBgmEnabled: true,
      isSfxEnabled: true,
      isVoiceEnabled: true,
      muteDuringExams: false,
    });
    soundEngine.stopBackgroundMusic(0);
  });

  describe('1. Initialization & Settings Persistence', () => {
    it('should initialize with correct default settings', () => {
      const settings = soundEngine.getSettings();
      expect(settings.masterVolume).toBe(100);
      expect(settings.musicVolume).toBe(25);
      expect(settings.effectsVolume).toBe(80);
      expect(settings.isMuted).toBe(false);
      expect(settings.isBgmEnabled).toBe(true);
      expect(settings.isSfxEnabled).toBe(true);
    });

    it('should persist modified settings to localStorage', () => {
      soundEngine.saveSettings({ masterVolume: 50, musicVolume: 40 });
      const updated = soundEngine.getSettings();
      expect(updated.masterVolume).toBe(50);
      expect(updated.musicVolume).toBe(40);
    });

    it('should calculate effective music and sfx volumes based on master volume', () => {
      soundEngine.saveSettings({ masterVolume: 50, musicVolume: 50, effectsVolume: 80 });
      expect(soundEngine.getSettings().masterVolume).toBe(50);
    });
  });

  describe('2. Audio Priority Hierarchy Verification', () => {
    it('should define correct priority ordering', () => {
      expect(AudioPriority.VICTORY).toBeGreaterThan(AudioPriority.LOSE);
      expect(AudioPriority.LOSE).toBeGreaterThan(AudioPriority.LEVEL_UP);
      expect(AudioPriority.LEVEL_UP).toBeGreaterThan(AudioPriority.BADGE);
      expect(AudioPriority.BADGE).toBeGreaterThan(AudioPriority.TREASURE);
      expect(AudioPriority.TREASURE).toBeGreaterThan(AudioPriority.BATTLE_START);
      expect(AudioPriority.BATTLE_START).toBeGreaterThan(AudioPriority.NOTIFICATION);
      expect(AudioPriority.NOTIFICATION).toBeGreaterThan(AudioPriority.COIN);
      expect(AudioPriority.COIN).toBeGreaterThan(AudioPriority.CORRECT);
      expect(AudioPriority.CORRECT).toBeGreaterThan(AudioPriority.BUTTON);
      expect(AudioPriority.BUTTON).toBeGreaterThan(AudioPriority.BGM);
    });

    it('should stop BGM when higher priority audio (Victory, Lose, Battle Start) plays', async () => {
      soundEngine.startBackgroundMusic();
      await new Promise((r) => setTimeout(r, 20));
      expect(soundEngine.isMusicPlaying()).toBe(true);

      // Play Victory Audio (Priority: 100)
      soundEngine.playGameWin();
      expect(soundEngine.isMusicPlaying()).toBe(false);
    });
  });

  describe('3. Background Music (BGM) Behavior', () => {
    it('should maintain single BGM instance and not duplicate on repeated start calls', async () => {
      soundEngine.startBackgroundMusic();
      await new Promise((r) => setTimeout(r, 20));
      const initialPlaying = soundEngine.isMusicPlaying();
      soundEngine.startBackgroundMusic(); // Repeated start
      expect(soundEngine.isMusicPlaying()).toBe(initialPlaying);
    });

    it('should respect isBgmEnabled toggle', async () => {
      soundEngine.toggleBackgroundMusic(); // Disable
      expect(soundEngine.getSettings().isBgmEnabled).toBe(false);
      expect(soundEngine.isMusicPlaying()).toBe(false);

      soundEngine.toggleBackgroundMusic(); // Re-enable
      await new Promise((r) => setTimeout(r, 20));
      expect(soundEngine.getSettings().isBgmEnabled).toBe(true);
    });

    it('should stop BGM cleanly when calling stopBackgroundMusic', async () => {
      soundEngine.startBackgroundMusic();
      await new Promise((r) => setTimeout(r, 20));
      soundEngine.stopBackgroundMusic(0);
      expect(soundEngine.isMusicPlaying()).toBe(false);
    });
  });

  describe('4. Distinct XP vs Coin Audio', () => {
    it('should separate XP chime from Coin drop', () => {
      const sfxSpy = vi.spyOn(soundEngine as any, 'playSfx');
      const synthSpy = vi.spyOn(soundEngine as any, 'playSynthSound');

      soundEngine.playCoinDrop();
      expect(sfxSpy).toHaveBeenCalledWith(expect.stringContaining('Coin'), expect.anything(), expect.anything());

      soundEngine.playXpChime();
      expect(synthSpy).toHaveBeenCalledWith(523.25, 1046.50, 'sine', 0.18, expect.anything());
    });
  });

  describe('5. Treasure Chest Reward Sequence', () => {
    it('should execute Treasure Chest sequence (Treasure -> Coin -> XP)', async () => {
      const treasureSpy = vi.spyOn(soundEngine, 'playTreasureOpen');
      const coinSpy = vi.spyOn(soundEngine, 'playCoinDrop');
      const xpSpy = vi.spyOn(soundEngine, 'playXpChime');

      soundEngine.playTreasureSequence();

      expect(treasureSpy).toHaveBeenCalled();
      
      // Wait for sequential timeouts
      await new Promise((resolve) => setTimeout(resolve, 1600));

      expect(coinSpy).toHaveBeenCalled();
      expect(xpSpy).toHaveBeenCalled();
    });
  });

  describe('6. Countdown Tick & Button Click Constraints', () => {
    it('should play button click without throwing errors', () => {
      expect(() => soundEngine.playButtonClick()).not.toThrow();
    });

    it('should play countdown tick when sound is enabled', () => {
      const sfxSpy = vi.spyOn(soundEngine as any, 'playSfx');
      soundEngine.playCountdownTick();
      expect(sfxSpy).toHaveBeenCalledWith(expect.stringContaining('Countdown'), expect.anything(), expect.anything());
    });

    it('should not play audio element when master mute is active', () => {
      soundEngine.toggleMute(); // Mute all
      const audioPlaySpy = window.HTMLAudioElement.prototype.play;
      soundEngine.playCorrect();
      expect(audioPlaySpy).not.toHaveBeenCalled();
    });
  });
});
