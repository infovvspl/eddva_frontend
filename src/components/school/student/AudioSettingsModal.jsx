import React, { useState, useEffect } from 'react';
import { soundEngine } from '@/lib/audioManager';
import { Volume2, VolumeX, Music, Bell, Shield, Sparkles, X, Play } from 'lucide-react';

export default function AudioSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState(soundEngine.getSettings());

  useEffect(() => {
    if (isOpen) {
      setSettings(soundEngine.getSettings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    const updated = soundEngine.saveSettings({ [key]: value });
    setSettings(updated);
  };

  const handleTestAudio = () => {
    soundEngine.playLevelUp();
    soundEngine.playCoinDrop();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-sky-200/90 bg-gradient-to-br from-slate-50 via-sky-50/80 to-indigo-50/60 p-6 shadow-2xl shadow-sky-500/10 text-slate-900 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-sky-500/15 p-2.5 text-sky-600 border border-sky-200">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Audio Settings</h3>
              <p className="text-xs text-slate-500 font-medium">Customize music, sound effects, and volume levels</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="rounded-xl p-2 text-slate-400 hover:bg-sky-100/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Master Mute & Volume */}
        <div className="mt-5 space-y-5">
          <div className="rounded-xl bg-white/85 p-4 border border-sky-100 shadow-sm backdrop-blur-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                {settings.isMuted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-emerald-600" />}
                Master Volume ({settings.masterVolume}%)
              </span>
              <button
                onClick={() => handleChange('isMuted', !settings.isMuted)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black uppercase transition ${
                  settings.isMuted
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {settings.isMuted ? 'All Muted' : 'Sound Active'}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => handleChange('masterVolume', Number(e.target.value))}
              disabled={settings.isMuted}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Background Music Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Music className="h-4 w-4 text-sky-600" /> Background Music ({settings.musicVolume}%)
              </label>
              <input
                type="checkbox"
                checked={settings.isBgmEnabled}
                onChange={(e) => handleChange('isBgmEnabled', e.target.checked)}
                className="h-4 w-4 accent-sky-500 cursor-pointer"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => handleChange('musicVolume', Number(e.target.value))}
              disabled={!settings.isBgmEnabled || settings.isMuted}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Sound Effects Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Bell className="h-4 w-4 text-sky-600" /> Sound Effects (SFX) ({settings.effectsVolume}%)
              </label>
              <input
                type="checkbox"
                checked={settings.isSfxEnabled}
                onChange={(e) => handleChange('isSfxEnabled', e.target.checked)}
                className="h-4 w-4 accent-sky-500 cursor-pointer"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.effectsVolume}
              onChange={(e) => handleChange('effectsVolume', Number(e.target.value))}
              disabled={!settings.isSfxEnabled || settings.isMuted}
              className="w-full accent-sky-500 cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Exam Mode Mute Option */}
          <div className="flex items-center justify-between rounded-xl bg-white/85 p-3 border border-sky-100 shadow-sm backdrop-blur-xs">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" /> Mute Audio During Formal Exams
            </span>
            <input
              type="checkbox"
              checked={settings.muteDuringExams}
              onChange={(e) => handleChange('muteDuringExams', e.target.checked)}
              className="h-4 w-4 accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-sky-200/60">
          <button
            type="button"
            onClick={handleTestAudio}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200/80 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white hover:border-sky-300"
          >
            <Play className="h-3.5 w-3.5 text-sky-600" /> Test Sound
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="rounded-xl bg-sky-500 px-5 py-2 text-xs font-black text-white shadow-md shadow-sky-500/20 hover:bg-sky-600 transition"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
