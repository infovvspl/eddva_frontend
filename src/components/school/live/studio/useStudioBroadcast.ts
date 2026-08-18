import { useCallback, useEffect, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { createBroadcastRelaySocket, getLiveToken } from '@/lib/api/school-live';

/**
 * useStudioBroadcast — the in-browser "Studio" engine for school live classes.
 *
 * Composites the active source (screen share / whiteboard / slides) plus an
 * optional teacher-camera picture-in-picture onto a single output canvas, mixes
 * in mic audio, and streams the result as WebM chunks to the `/school-broadcast`
 * relay (→ ffmpeg → RTMP → HLS). No OBS required.
 *
 * The compositor is layer-based so Phase 2 (whiteboard) and Phase 3 (slides) only
 * need to feed it a source canvas/image via `setWhiteboardCanvas` / `setSlideImage`
 * and flip `activeSource` — the render loop already handles them.
 */

export type StudioSource = 'screen' | 'whiteboard' | 'slides' | 'camera';
export type StudioStatus = 'idle' | 'starting' | 'live' | 'stopping' | 'error';

export interface UseStudioBroadcastOptions {
  streamKey: string;
  /** Visible canvas that doubles as the WYSIWYG preview and the capture source. */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  width?: number;
  height?: number;
  fps?: number;
  onStatusChange?: (status: StudioStatus) => void;
}

const PIP_MARGIN = 24;

function pickMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ];
  if (typeof MediaRecorder === 'undefined') return 'video/webm';
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) || 'video/webm';
}

/** Draw a source (video/image/canvas) into `ctx` preserving aspect ratio ("contain"). */
function drawContain(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
) {
  if (!srcW || !srcH) return;
  const scale = Math.min(destW / srcW, destH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  const x = (destW - w) / 2;
  const y = (destH - h) / 2;
  ctx.drawImage(src, x, y, w, h);
}

export function useStudioBroadcast(opts: UseStudioBroadcastOptions) {
  // 1080p output — screen shares are detail-heavy (small text/code), so 720p
  // looked blurry. Higher res + bitrate keeps shared screens legible.
  const { streamKey, canvasRef, width = 1920, height = 1080, fps = 30, onStatusChange } = opts;

  const [status, setStatus] = useState<StudioStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSourceState] = useState<StudioSource>('screen');
  const [screenOn, setScreenOn] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // ── Media element refs (detached, not mounted in the DOM) ──────────────────
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micTrackRef = useRef<MediaStreamTrack | null>(null);
  // Selected input devices (null = system default).
  const micDeviceIdRef = useRef<string | null>(null);
  const camDeviceIdRef = useRef<string | null>(null);

  // ── External layer sources fed by later phases ─────────────────────────────
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const whiteboardOverlayRef = useRef<boolean>(false); // draw strokes over screen/slides too
  const slideImageRef = useRef<CanvasImageSource | null>(null);
  const slideSizeRef = useRef<{ w: number; h: number }>({ w: width, h: height });

  // ── Compositor / capture / relay refs ──────────────────────────────────────
  const rafRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSourceRef = useRef<StudioSource>('screen');
  const camOnRef = useRef(false);

  const updateStatus = useCallback(
    (s: StudioStatus) => {
      setStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange],
  );

  const setActiveSource = useCallback((s: StudioSource) => {
    activeSourceRef.current = s;
    setActiveSourceState(s);
  }, []);

  // Keep camOnRef in sync for the RAF loop (which reads refs, not state).
  useEffect(() => {
    camOnRef.current = camOn;
  }, [camOn]);

  // ── Render loop: composite the active source + PiP each frame ──────────────
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      rafRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    // Background
    const source = activeSourceRef.current;
    if (source === 'whiteboard') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#0f172a'; // slate-900 letterbox
      ctx.fillRect(0, 0, width, height);
    }

    if (source === 'screen') {
      const v = screenVideoRef.current;
      if (v && v.readyState >= 2) drawContain(ctx, v, v.videoWidth, v.videoHeight, width, height);
    } else if (source === 'camera') {
      const v = cameraVideoRef.current;
      if (v && v.readyState >= 2) drawContain(ctx, v, v.videoWidth, v.videoHeight, width, height);
    } else if (source === 'slides') {
      const img = slideImageRef.current;
      if (img) drawContain(ctx, img, slideSizeRef.current.w, slideSizeRef.current.h, width, height);
    }

    // Whiteboard: either the primary source or an overlay on top of screen/slides
    const wb = whiteboardCanvasRef.current;
    if (wb && (source === 'whiteboard' || whiteboardOverlayRef.current)) {
      ctx.drawImage(wb, 0, 0, width, height);
    }

    // Teacher camera PiP (skip when camera IS the full-screen source)
    if (camOnRef.current && source !== 'camera') {
      const cam = cameraVideoRef.current;
      if (cam && cam.readyState >= 2) {
        const pipW = Math.round(width * 0.22);
        const pipH = Math.round((pipW * cam.videoHeight) / (cam.videoWidth || 1)) || Math.round(pipW * 0.5625);
        const x = width - pipW - PIP_MARGIN;
        const y = height - pipH - PIP_MARGIN;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#000';
        ctx.fillRect(x - 2, y - 2, pipW + 4, pipH + 4);
        ctx.restore();
        ctx.drawImage(cam, x, y, pipW, pipH);
      }
    }

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [canvasRef, width, height]);

  // Start the render loop as soon as the hook mounts so the preview is live
  // before going on-air.
  useEffect(() => {
    rafRef.current = requestAnimationFrame(renderFrame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [renderFrame]);

  // ── Screen share ───────────────────────────────────────────────────────────
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: fps, max: 30 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      screenStreamRef.current = stream;
      let v = screenVideoRef.current;
      if (!v) {
        v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        screenVideoRef.current = v;
      }
      v.srcObject = stream;
      await v.play().catch(() => undefined);
      setScreenOn(true);
      setActiveSource('screen');
      // Auto-clean when the user stops sharing from the browser UI.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stream.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setScreenOn(false);
      });
    } catch (e: any) {
      if (e?.name !== 'NotAllowedError') setError(e?.message || 'Screen share failed');
    }
  }, [fps, setActiveSource]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;
    setScreenOn(false);
  }, []);

  // ── Camera (PiP) ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640, height: 360, frameRate: fps,
          ...(camDeviceIdRef.current ? { deviceId: { exact: camDeviceIdRef.current } } : {}),
        },
        audio: false,
      });
      cameraStreamRef.current = stream;
      let v = cameraVideoRef.current;
      if (!v) {
        v = document.createElement('video');
        v.muted = true;
        v.playsInline = true;
        cameraVideoRef.current = v;
      }
      v.srcObject = stream;
      await v.play().catch(() => undefined);
      setCamOn(true);
    } catch (e: any) {
      if (e?.name !== 'NotAllowedError') setError(e?.message || 'Camera failed');
    }
  }, [fps]);

  const stopCamera = useCallback(() => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  const toggleCam = useCallback(() => {
    if (camOnRef.current) stopCamera();
    else void startCamera();
  }, [startCamera, stopCamera]);

  // ── Mic ──────────────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const track = micTrackRef.current;
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }, []);

  // ── Device selection ────────────────────────────────────────────────────────
  // Mic selection applies at Go Live; camera selection restarts the camera live.
  const setMicDeviceId = useCallback((id: string | null) => {
    micDeviceIdRef.current = id;
  }, []);
  const setCamDeviceId = useCallback((id: string | null) => {
    camDeviceIdRef.current = id;
    if (camOnRef.current) { stopCamera(); void startCamera(); }
  }, [stopCamera, startCamera]);

  // ── Layer feeders for later phases ─────────────────────────────────────────
  const setWhiteboardCanvas = useCallback((c: HTMLCanvasElement | null) => {
    whiteboardCanvasRef.current = c;
  }, []);
  const setWhiteboardOverlay = useCallback((on: boolean) => {
    whiteboardOverlayRef.current = on;
  }, []);
  const setSlideImage = useCallback((img: CanvasImageSource | null, w?: number, h?: number) => {
    slideImageRef.current = img;
    if (w && h) slideSizeRef.current = { w, h };
  }, []);

  // ── Go live ────────────────────────────────────────────────────────────────
  const startBroadcast = useCallback(async () => {
    if (status === 'live' || status === 'starting') return;
    setError(null);
    updateStatus('starting');
    try {
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('Your browser does not support in-browser broadcasting. Use Chrome or Edge.');
      }
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Studio canvas not ready');

      // Mic audio — OPTIONAL. Machines without a microphone (or with mic
      // permission denied) should still be able to broadcast video-only,
      // otherwise a "Requested device not found" error blocks going live.
      let audioTrack: MediaStreamTrack | null = null;
      try {
        const audioConstraint: MediaTrackConstraints | boolean =
          micDeviceIdRef.current ? { deviceId: { exact: micDeviceIdRef.current } } : true;
        const mic = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false });
        micStreamRef.current = mic;
        audioTrack = mic.getAudioTracks()[0] || null;
        micTrackRef.current = audioTrack;
        if (audioTrack) audioTrack.enabled = micOn;
      } catch (micErr: any) {
        micTrackRef.current = null;
        setMicOn(false);
        const name = micErr?.name || '';
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          toast.warning('Microphone blocked — going live without audio. Allow mic access to be heard.');
        } else {
          toast.warning('No microphone found — going live without audio. Students won’t hear you.');
        }
      }

      // Canvas video track + (optional) mic → one stream
      const canvasStream = canvas.captureStream(fps);
      captureStreamRef.current = canvasStream;
      const videoTrack = canvasStream.getVideoTracks()[0];
      const combined = new MediaStream();
      if (videoTrack) combined.addTrack(videoTrack);
      if (audioTrack) combined.addTrack(audioTrack);

      // Relay socket
      const socket = createBroadcastRelaySocket();
      socketRef.current = socket;
      const sessionId = `${streamKey}-${Date.now()}`;
      // Tell the relay our resolution so ffmpeg encodes to match (no upscaling).
      const startPayload = { token: getLiveToken(), sessionId, streamKey, width, height };

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Relay did not start (timeout)')), 15000);
        socket.on('broadcast:started', () => {
          clearTimeout(timeout);
          resolve();
        });
        socket.on('broadcast:relay-error', (p: { message?: string }) => {
          clearTimeout(timeout);
          reject(new Error(p?.message || 'Relay error'));
        });
        socket.on('connect', () => {
          socket.emit('broadcast:start', { ...startPayload, token: getLiveToken() });
        });
        if (socket.connected) {
          socket.emit('broadcast:start', startPayload);
        }
      });

      // ffmpeg on the RTMP side can drop the stream mid-session.
      socket.on('broadcast:relay-ended', () => {
        setError('The stream ended unexpectedly. Please go live again.');
        void stopBroadcastInternal(false);
      });

      // Start recording → chunks
      const mimeType = pickMimeType();
      // Scale bitrate to resolution: 1080p needs ~6Mbps for crisp text, 720p ~3Mbps.
      const videoBitsPerSecond = height >= 1080 ? 6_000_000 : 3_000_000;
      const recorder = new MediaRecorder(combined, { mimeType, videoBitsPerSecond });
      recorderRef.current = recorder;
      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0 && socket.connected) {
          ev.data.arrayBuffer().then((ab) => socket.emit('broadcast:chunk', ab)).catch(() => undefined);
        }
      };
      recorder.start(1000); // 1s chunks

      // Elapsed timer
      setElapsedSec(0);
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);

      updateStatus('live');
    } catch (e: any) {
      setError(e?.message || 'Failed to go live');
      updateStatus('error');
      await stopBroadcastInternal(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, streamKey, fps, micOn, canvasRef, updateStatus]);

  // Internal stop that optionally sends broadcast:stop (skip when relay already ended).
  const stopBroadcastInternal = useCallback(
    async (graceful: boolean) => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try { recorderRef.current.stop(); } catch {}
      }
      recorderRef.current = null;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const socket = socketRef.current;
      if (socket) {
        if (graceful && socket.connected) socket.emit('broadcast:stop');
        socket.disconnect();
        socketRef.current = null;
      }

      captureStreamRef.current?.getTracks().forEach((t) => t.stop());
      captureStreamRef.current = null;
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
      micTrackRef.current = null;

      if (status !== 'error') updateStatus('idle');
    },
    [status, updateStatus],
  );

  const stopBroadcast = useCallback(async () => {
    updateStatus('stopping');
    await stopBroadcastInternal(true);
  }, [stopBroadcastInternal, updateStatus]);

  // ── Unmount cleanup ──────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      captureStreamRef.current?.getTracks().forEach((t) => t.stop());
      try { recorderRef.current?.stop(); } catch {}
      socketRef.current?.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    // state
    status,
    error,
    activeSource,
    screenOn,
    micOn,
    camOn,
    elapsedSec,
    isLive: status === 'live',
    // actions
    startBroadcast,
    stopBroadcast,
    startScreenShare,
    stopScreenShare,
    toggleCam,
    toggleMic,
    setActiveSource,
    setMicDeviceId,
    setCamDeviceId,
    // layer feeders (Phase 2 / 3)
    setWhiteboardCanvas,
    setWhiteboardOverlay,
    setSlideImage,
    clearError: () => setError(null),
  };
}
