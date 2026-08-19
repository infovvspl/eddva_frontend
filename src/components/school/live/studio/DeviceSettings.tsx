import { useEffect, useRef, useState } from 'react';
import { Settings, Mic, Video, X, RefreshCw } from 'lucide-react';

/**
 * DeviceSettings — a small popover that lets the teacher pick which microphone
 * and camera the Studio uses, and shows whether any are detected. Device labels
 * only populate after mic/camera permission has been granted at least once, so
 * we request a throwaway permission on open to reveal friendly names.
 */

export interface DeviceSettingsProps {
  micDeviceId: string | null;
  camDeviceId: string | null;
  onMicChange: (id: string | null) => void;
  onCamChange: (id: string | null) => void;
}

export default function DeviceSettings({ micDeviceId, camDeviceId, onMicChange, onCamChange }: DeviceSettingsProps) {
  const [open, setOpen] = useState(false);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cams, setCams] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const enumerate = async (requestPermission = false) => {
    setLoading(true);
    try {
      // Labels are hidden until a getUserMedia permission has been granted.
      if (requestPermission) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          s.getTracks().forEach((t) => t.stop());
        } catch { /* no devices / denied — still enumerate what we can */ }
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMics(devices.filter((d) => d.kind === 'audioinput'));
      setCams(devices.filter((d) => d.kind === 'videoinput'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) void enumerate(true);
  }, [open]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10"
        title="Microphone & camera settings"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-white/10 bg-slate-900 p-3 text-slate-200 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Devices</span>
            <div className="flex items-center gap-1">
              <button onClick={() => void enumerate(true)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10" title="Refresh">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Microphone */}
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300"><Mic className="h-3.5 w-3.5" /> Microphone</label>
          {mics.length === 0 ? (
            <p className="mb-3 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-semibold text-amber-200">No microphone detected — you'll broadcast without audio.</p>
          ) : (
            <select
              value={micDeviceId ?? ''}
              onChange={(e) => onMicChange(e.target.value || null)}
              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Default microphone</option>
              {mics.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Microphone ${i + 1}`}</option>
              ))}
            </select>
          )}

          {/* Camera */}
          <label className="mb-1 flex items-center gap-1.5 text-xs font-bold text-slate-300"><Video className="h-3.5 w-3.5" /> Camera</label>
          {cams.length === 0 ? (
            <p className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-400">No camera detected.</p>
          ) : (
            <select
              value={camDeviceId ?? ''}
              onChange={(e) => onCamChange(e.target.value || null)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">Default camera</option>
              {cams.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Camera ${i + 1}`}</option>
              ))}
            </select>
          )}

          <p className="mt-2 text-[11px] text-slate-500">Mic choice applies when you go live; camera switches immediately.</p>
        </div>
      )}
    </div>
  );
}
