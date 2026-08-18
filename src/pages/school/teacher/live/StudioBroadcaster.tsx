import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MonitorUp, Mic, MicOff, Video, VideoOff, Radio, Loader2, ArrowLeft,
  AlertTriangle, PenLine, Presentation, PanelRightClose, PanelRightOpen,
  Circle, Users, PhoneOff, Columns2,
} from 'lucide-react';
import { schoolLive, endLectureBeacon } from '@/lib/api/school-live';
import { useStudioBroadcast, SPLIT_CONTENT_RATIO } from '@/components/school/live/studio/useStudioBroadcast';
import Whiteboard from '@/components/school/live/studio/Whiteboard';
import SlidePresenter from '@/components/school/live/studio/SlidePresenter';
import StudioLivePanel from '@/components/school/live/studio/StudioLivePanel';
import DeviceSettings from '@/components/school/live/studio/DeviceSettings';

function fmt(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function StudioBroadcaster() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [title, setTitle] = useState('Live Class');
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [annotate, setAnnotate] = useState(false);
  const [slideLoaded, setSlideLoaded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [stats, setStats] = useState({ viewers: 0, students: 0 });
  // True when the class is already LIVE on load — i.e. OBS (or another session)
  // is streaming to this key. Going live from the browser too would collide.
  const [externalLive, setExternalLive] = useState(false);
  const [micDeviceId, setMicDeviceId] = useState<string | null>(null);
  const [camDeviceId, setCamDeviceId] = useState<string | null>(null);
  const [quality, setQuality] = useState<'1080p' | '720p'>('1080p');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await schoolLive.getStreamUrl(id);
        if (!active) return;
        setStreamKey(info?.streamKey || null);
        if (info?.title) setTitle(info.title);
        setExternalLive(String(info?.status).toUpperCase() === 'LIVE');
        if (!info?.streamKey) setLoadError('This live class has no stream key.');
      } catch (e: any) {
        if (active) setLoadError(e?.response?.data?.message || 'Failed to load live class');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  const studio = useStudioBroadcast({
    streamKey: streamKey || '',
    canvasRef,
    width: quality === '1080p' ? 1920 : 1280,
    height: quality === '1080p' ? 1080 : 720,
  });

  useEffect(() => {
    if (studio.error) {
      toast.error(studio.error);
      studio.clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.error]);

  useEffect(() => {
    studio.setWhiteboardOverlay(annotate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotate]);

  // Auto-end the class if the teacher closes the tab or leaves the Studio while
  // broadcasting, so it never gets stuck in a LIVE status. A ref avoids stale
  // closures; the listener is attached once.
  const isLiveRef = useRef(false);
  useEffect(() => { isLiveRef.current = studio.isLive; }, [studio.isLive]);
  useEffect(() => {
    const onHide = () => { if (isLiveRef.current) endLectureBeacon(id); };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      if (isLiveRef.current) schoolLive.endLecture(id).catch(() => undefined);
    };
  }, [id]);

  const src = studio.activeSource;
  const isSplit = studio.layout === 'split';
  // In split mode the whiteboard lives on the right; annotate-overlay is single-only.
  const canAnnotate = !isSplit && (src === 'screen' || src === 'slides');
  const showWhiteboard = isSplit || src === 'whiteboard' || (annotate && canAnnotate);
  const canGoLive =
    !!streamKey && (isSplit || studio.screenOn || studio.camOn || src === 'whiteboard' || (src === 'slides' && slideLoaded));

  const toggleSplit = () => {
    if (isSplit) return studio.setLayout('single');
    // Left side needs real content — default to screen if we're on the blank board.
    if (src === 'whiteboard') studio.setActiveSource('screen');
    studio.setLayout('split');
  };
  const wbWidth = isSplit ? Math.round(1920 * (1 - SPLIT_CONTENT_RATIO)) : 1920;

  // Turning off annotate when switching to a source that can't be annotated.
  useEffect(() => {
    if (!canAnnotate && annotate) setAnnotate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const onShareScreen = () => {
    if (!studio.screenOn) return void studio.startScreenShare();
    if (src !== 'screen') return studio.setActiveSource('screen');
    studio.stopScreenShare();
  };

  const handleGoLive = async () => {
    if (!canGoLive) {
      toast.warning('Pick a source first — share your screen, open the whiteboard, or load slides.');
      return;
    }
    if (externalLive && !studio.isLive) {
      const ok = window.confirm(
        'This class already appears to be streaming (from OBS or another window). ' +
        'Going live here as well can break the stream. Stop the other stream first.\n\n' +
        'Go live from the Studio anyway?',
      );
      if (!ok) return;
    }
    await studio.startBroadcast();
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await studio.stopBroadcast();
      await schoolLive.endLecture(id).catch(() => undefined);
      toast.success('Class ended — recording and AI notes will be ready shortly');
      navigate(`/school/teacher/live/${id}/dashboard`, { state: { showSummary: true } });
    } finally {
      setEnding(false);
    }
  };

  const exit = () => {
    if (studio.isLive && !window.confirm('You are live. Leave the Studio? This will stop your broadcast.')) return;
    navigate('/school/teacher/live');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (loadError || !streamKey) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950 p-6">
        <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
          <p className="font-bold text-amber-200">{loadError || 'Live class unavailable'}</p>
          <button onClick={() => navigate('/school/teacher/live')} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={exit} className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10" title="Leave Studio">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black leading-tight">{title}</h1>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Studio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {studio.isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-black">
              <Circle className="h-2.5 w-2.5 animate-pulse fill-white text-white" /> REC · {fmt(studio.elapsedSec)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black text-slate-300">NOT LIVE</span>
          )}
          <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 sm:inline-flex">
            <Users className="h-3.5 w-3.5" /> {stats.viewers}
          </span>
          {/* Quality — locked once live (resolution can't change mid-stream). */}
          <div className="hidden items-center gap-0.5 rounded-full bg-white/10 p-0.5 sm:flex" title={studio.isLive ? 'Quality is locked while live' : 'Broadcast quality'}>
            {(['1080p', '720p'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={studio.isLive}
                className={`rounded-full px-2.5 py-1 text-[11px] font-black transition disabled:opacity-40 ${quality === q ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {q}
              </button>
            ))}
          </div>
          <DeviceSettings
            micDeviceId={micDeviceId}
            camDeviceId={camDeviceId}
            onMicChange={(d) => { setMicDeviceId(d); studio.setMicDeviceId(d); }}
            onCamChange={(d) => { setCamDeviceId(d); studio.setCamDeviceId(d); }}
          />
          <button onClick={() => setPanelOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-xl text-slate-300 hover:bg-white/10" title={panelOpen ? 'Hide panel' : 'Show panel'}>
            {panelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Collision warning — class is marked LIVE (real OBS stream, or a stale
          status from a session that didn't end cleanly). */}
      {externalLive && !studio.isLive && (
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-500/20 bg-amber-500/15 px-4 py-2 text-center text-xs font-bold text-amber-200">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            This class is marked LIVE. If you're streaming from OBS, don't also go live here. If nothing is actually streaming, it's safe to continue.
          </span>
          <button
            onClick={() => setExternalLive(false)}
            className="rounded-lg bg-amber-500/30 px-2.5 py-0.5 font-black text-amber-100 hover:bg-amber-500/50"
          >
            Nothing's streaming — dismiss
          </button>
        </div>
      )}

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Stage + controls */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="grid flex-1 place-items-center overflow-hidden p-2 sm:p-4">
            <div className="relative inline-flex max-h-full max-w-full overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
              <canvas ref={canvasRef} className="block max-h-full max-w-full" style={{ aspectRatio: '16 / 9' }} />

              {/* Whiteboard overlay. Single: fills the stage. Split: right region only. */}
              <div
                className="absolute"
                style={
                  isSplit
                    ? { left: `${SPLIT_CONTENT_RATIO * 100}%`, right: 0, top: 0, bottom: 0, visibility: 'visible' }
                    : ({ inset: 0, visibility: showWhiteboard ? 'visible' : 'hidden' } as React.CSSProperties)
                }
              >
                <Whiteboard key={isSplit ? 'split' : 'single'} width={wbWidth} height={1080} active={showWhiteboard} onReady={(c) => studio.setWhiteboardCanvas(c)} />
              </div>
              {isSplit && !studio.screenOn && src !== 'slides' && (
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center" style={{ width: `${SPLIT_CONTENT_RATIO * 100}%` }}>
                  <p className="w-full px-4 text-center text-sm font-semibold text-slate-400">Share a window/tab or pick Slides for the left side</p>
                </div>
              )}

              {/* Empty states (single layout only — split shows its own left hint) */}
              {!isSplit && src === 'screen' && !studio.screenOn && (
                <StageHint
                  icon={MonitorUp}
                  title="Share a window or a browser tab"
                  sub="Pick a specific app window or tab — NOT your whole screen, or it mirrors the Studio and turns blurry."
                  action={{ label: 'Share screen', onClick: onShareScreen }}
                  footer={
                    <button onClick={() => navigate('/school/teacher/live')} className="text-xs font-semibold text-slate-400 underline decoration-dotted underline-offset-2 hover:text-slate-200">
                      Need razor-sharp text? Use OBS for highest quality →
                    </button>
                  }
                />
              )}
              {!isSplit && src === 'slides' && !slideLoaded && (
                <StageHint icon={Presentation} title="Load slides to present" sub="Upload a PDF in the strip below, then flip through slides live." />
              )}

              {/* Stop-sharing affordance */}
              {src === 'screen' && studio.screenOn && (
                <button onClick={() => studio.stopScreenShare()} className="absolute right-3 top-3 rounded-lg bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur hover:bg-black/70">
                  Stop sharing
                </button>
              )}
            </div>
          </div>

          {/* Slides strip (only when slides source) */}
          {src === 'slides' && (
            <div className="mx-auto w-full max-w-4xl px-3 pb-1">
              <SlidePresenter
                onSlide={(img, w, h) => { studio.setSlideImage(img, w, h); setSlideLoaded(!!img); }}
              />
            </div>
          )}

          {/* ── Floating control bar (Zoom-style) ───────────────────────── */}
          <div className="shrink-0 px-3 pb-3 pt-1">
            {/* Not-broadcasting-yet hint — sharing/whiteboard is only the setup;
                students see nothing until "Go Live" is pressed. */}
            {!studio.isLive && (
              <div className="mx-auto mb-1.5 flex max-w-2xl items-center justify-center">
                <span className={[
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold',
                  canGoLive
                    ? 'bg-red-500/15 text-red-200 ring-1 ring-red-500/30'
                    : 'bg-white/5 text-slate-400 ring-1 ring-white/10',
                ].join(' ')}>
                  <Circle className="h-2.5 w-2.5" />
                  {canGoLive
                    ? 'You are NOT broadcasting yet — click “Go Live” so students can see this.'
                    : 'Pick a source (share screen, whiteboard, or slides), then click “Go Live”.'}
                </span>
              </div>
            )}
            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-slate-900/80 p-2 backdrop-blur">
              {/* What students see */}
              <Ctrl active={!isSplit && src === 'screen'} onClick={onShareScreen} icon={MonitorUp} label={studio.screenOn ? 'Screen' : 'Share'} activeClass="bg-blue-600" />
              <Ctrl active={!isSplit && src === 'whiteboard'} onClick={() => studio.setActiveSource('whiteboard')} icon={PenLine} label="Whiteboard" activeClass="bg-blue-600" disabled={isSplit} title={isSplit ? 'Whiteboard is on the right in split view' : 'Blank whiteboard'} />
              <Ctrl active={!isSplit && src === 'slides'} onClick={() => studio.setActiveSource('slides')} icon={Presentation} label="Slides" activeClass="bg-blue-600" />
              <Ctrl active={isSplit} onClick={toggleSplit} icon={Columns2} label="Split" activeClass="bg-blue-600" title="Screen/slides on the left, whiteboard on the right" />

              <span className="mx-1 h-8 w-px bg-white/10" />

              {/* Devices / overlays */}
              <Ctrl active={studio.camOn} onClick={studio.toggleCam} icon={studio.camOn ? Video : VideoOff} label="Camera" activeClass="bg-emerald-600" />
              <Ctrl active={studio.micOn} onClick={studio.toggleMic} icon={studio.micOn ? Mic : MicOff} label="Mic" activeClass="bg-white/20" disabled={!studio.isLive} title={!studio.isLive ? 'Mic activates when you go live' : 'Toggle mic'} />
              <Ctrl active={annotate && canAnnotate} onClick={() => setAnnotate((a) => !a)} icon={PenLine} label="Annotate" activeClass="bg-amber-500" disabled={!canAnnotate} title={canAnnotate ? 'Draw over the screen/slide' : (isSplit ? 'Use the whiteboard on the right' : "You're already on the whiteboard")} />

              <span className="mx-1 h-8 w-px bg-white/10" />

              {/* Go live / end */}
              {!studio.isLive ? (
                <button onClick={handleGoLive} disabled={studio.status === 'starting' || !canGoLive}
                  className={[
                    'inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40',
                    canGoLive && studio.status === 'idle' ? 'animate-pulse ring-2 ring-red-400/70 ring-offset-2 ring-offset-slate-900' : '',
                  ].join(' ')}>
                  {studio.status === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                  {studio.status === 'starting' ? 'Going live…' : 'Go Live'}
                </button>
              ) : (
                <button onClick={handleEnd} disabled={ending}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-slate-900 transition hover:bg-slate-200 disabled:opacity-60">
                  {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
                  End Class
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        {panelOpen && (
          <aside className="hidden w-80 shrink-0 border-l border-white/10 p-3 md:block">
            <StudioLivePanel lectureId={id} isLive={studio.isLive} onStats={setStats} />
          </aside>
        )}
      </div>
    </div>
  );
}

function StageHint({ icon: Icon, title, sub, action, footer }: { icon: React.ComponentType<{ className?: string }>; title: string; sub: string; action?: { label: string; onClick: () => void }; footer?: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center">
      <div className="pointer-events-auto">
        <Icon className="mx-auto mb-3 h-12 w-12 text-slate-500" />
        <p className="text-base font-black text-slate-100">{title}</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-400">{sub}</p>
        {action && (
          <button onClick={action.onClick} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-700">
            <MonitorUp className="h-4 w-4" /> {action.label}
          </button>
        )}
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </div>
  );
}

function Ctrl({ active, onClick, icon: Icon, label, activeClass, disabled, title }: {
  active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; activeClass: string; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={[
        'inline-flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40',
        active ? `${activeClass} text-white` : 'text-slate-300 hover:bg-white/10',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}
