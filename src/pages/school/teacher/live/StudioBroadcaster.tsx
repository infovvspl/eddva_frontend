import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  MonitorUp, MonitorOff, Mic, MicOff, Video, VideoOff, Radio, Loader2,
  ArrowLeft, ExternalLink, AlertTriangle, ScreenShare, PenLine, Presentation,
} from 'lucide-react';
import { schoolLive } from '@/lib/api/school-live';
import { useStudioBroadcast, type StudioSource } from '@/components/school/live/studio/useStudioBroadcast';
import Whiteboard from '@/components/school/live/studio/Whiteboard';
import SlidePresenter from '@/components/school/live/studio/SlidePresenter';
import StudioLivePanel from '@/components/school/live/studio/StudioLivePanel';

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

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const info = await schoolLive.getStreamUrl(id);
        if (!active) return;
        setStreamKey(info?.streamKey || null);
        if (info?.title) setTitle(info.title);
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
  });

  // Surface engine errors as toasts.
  useEffect(() => {
    if (studio.error) {
      toast.error(studio.error);
      studio.clearError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studio.error]);

  // Keep the compositor's overlay flag in sync with the annotate toggle.
  useEffect(() => {
    studio.setWhiteboardOverlay(annotate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotate]);

  // Annotate only makes sense over screen/camera/slides — not on the blank board.
  const canAnnotate = studio.activeSource !== 'whiteboard';
  const showWhiteboard = studio.activeSource === 'whiteboard' || (annotate && canAnnotate);

  const canGoLive =
    !!streamKey &&
    (studio.screenOn || studio.camOn || studio.activeSource === 'whiteboard' ||
      (studio.activeSource === 'slides' && slideLoaded));

  const handleGoLive = async () => {
    if (!canGoLive) {
      toast.warning('Share your screen or turn on your camera first');
      return;
    }
    await studio.startBroadcast();
  };

  const handleEnd = async () => {
    setEnding(true);
    try {
      await studio.stopBroadcast();
      // Finalize the lecture the same way the OBS dashboard does.
      await schoolLive.endLecture(id).catch(() => undefined);
      toast.success('Class ended — recording and AI notes will be ready shortly');
      navigate(`/school/teacher/live/${id}/dashboard`, { state: { showSummary: true } });
    } finally {
      setEnding(false);
    }
  };

  const sources = useMemo(
    () => [
      { key: 'screen' as StudioSource, label: 'Screen', icon: ScreenShare, enabled: studio.screenOn },
      { key: 'camera' as StudioSource, label: 'Camera', icon: Video, enabled: studio.camOn },
      { key: 'whiteboard' as StudioSource, label: 'Whiteboard', icon: PenLine, enabled: true },
      { key: 'slides' as StudioSource, label: 'Slides', icon: Presentation, enabled: true },
    ],
    [studio.screenOn, studio.camOn],
  );

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (loadError || !streamKey) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <p className="font-bold text-amber-800 dark:text-amber-200">{loadError || 'Live class unavailable'}</p>
          <button
            onClick={() => navigate('/school/teacher/live')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white dark:bg-white dark:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-5">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/school/teacher/live')}
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">{title}</h1>
            <p className="text-xs text-slate-500">Broadcast from your browser — no OBS needed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {studio.isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              LIVE · {fmt(studio.elapsedSec)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              OFFLINE
            </span>
          )}
          <a
            href={`/school/teacher/live/${id}/dashboard`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Open chat, polls & hand-raises in a new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Class panel
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Left: broadcast area */}
        <div className="min-w-0 flex-1">
      {/* Preview */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm dark:border-slate-700">
        <div className="relative aspect-video w-full">
          <canvas ref={canvasRef} className="h-full w-full object-contain" />
          {/* Whiteboard overlay — always mounted so the compositor keeps its canvas;
              visible & interactive only when it's the source or annotate is on. */}
          <div className="pointer-events-none absolute inset-0" style={{ visibility: showWhiteboard ? 'visible' : 'hidden' }}>
            <Whiteboard active={showWhiteboard} onReady={(c) => studio.setWhiteboardCanvas(c)} />
          </div>
          {!studio.screenOn && studio.activeSource === 'screen' && !studio.isLive && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div className="px-6">
                <MonitorUp className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                <p className="text-sm font-bold text-slate-200">Share your screen to begin</p>
                <p className="mt-1 text-xs text-slate-400">Present slides, a browser tab, or an app — students see it live.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {sources.map((s) => {
          const Icon = s.icon;
          const active = studio.activeSource === s.key;
          return (
            <button
              key={s.key}
              onClick={() => studio.setActiveSource(s.key)}
              disabled={!s.enabled}
              className={[
                'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition',
                active
                  ? 'bg-blue-600 text-white shadow'
                  : s.enabled
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                  : 'cursor-not-allowed border border-dashed border-slate-200 text-slate-300 dark:border-slate-800 dark:text-slate-600',
              ].join(' ')}
              title={s.enabled ? `Show ${s.label}` : `Turn on ${s.label} first`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* Slides panel — kept mounted so slides persist; shown only for the slides source. */}
      <div className={`mt-3 ${studio.activeSource === 'slides' ? '' : 'hidden'}`}>
        <SlidePresenter
          onSlide={(img, w, h) => {
            studio.setSlideImage(img, w, h);
            setSlideLoaded(!!img);
          }}
        />
      </div>

      {/* Control bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <ControlBtn
          active={studio.screenOn}
          onClick={() => (studio.screenOn ? studio.stopScreenShare() : studio.startScreenShare())}
          onIcon={MonitorUp}
          offIcon={MonitorOff}
          label={studio.screenOn ? 'Stop share' : 'Share screen'}
          activeClass="bg-blue-600 text-white"
        />
        <ControlBtn
          active={studio.camOn}
          onClick={studio.toggleCam}
          onIcon={Video}
          offIcon={VideoOff}
          label={studio.camOn ? 'Camera on' : 'Camera'}
          activeClass="bg-emerald-600 text-white"
        />
        <ControlBtn
          active={studio.micOn}
          onClick={studio.toggleMic}
          onIcon={Mic}
          offIcon={MicOff}
          label={studio.micOn ? 'Mic on' : 'Mic off'}
          activeClass="bg-slate-800 text-white dark:bg-slate-700"
          disabled={!studio.isLive}
          title={!studio.isLive ? 'Mic activates when you go live' : undefined}
        />
        <ControlBtn
          active={annotate && canAnnotate}
          onClick={() => setAnnotate((a) => !a)}
          onIcon={PenLine}
          offIcon={PenLine}
          label="Annotate"
          activeClass="bg-amber-500 text-white"
          disabled={!canAnnotate}
          title={canAnnotate ? 'Draw over the screen/slide' : 'Already on the whiteboard'}
        />

        <div className="ml-auto flex items-center gap-2">
          {!studio.isLive ? (
            <button
              onClick={handleGoLive}
              disabled={studio.status === 'starting' || !canGoLive}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {studio.status === 'starting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
              {studio.status === 'starting' ? 'Going live…' : 'Go Live'}
            </button>
          ) : (
            <button
              onClick={handleEnd}
              disabled={ending}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {ending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorOff className="h-4 w-4" />}
              End Class
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        Tip: for best quality use Chrome or Edge on a laptop. Students watch with a few seconds of delay (HLS).
      </p>
        </div>

        {/* Right: live interactions */}
        <div className="h-[70vh] shrink-0 lg:h-auto lg:w-80">
          <StudioLivePanel lectureId={id} isLive={studio.isLive} />
        </div>
      </div>
    </div>
  );
}

function ControlBtn({
  active, onClick, onIcon: OnIcon, offIcon: OffIcon, label, activeClass, disabled, title,
}: {
  active: boolean;
  onClick: () => void;
  onIcon: React.ComponentType<{ className?: string }>;
  offIcon: React.ComponentType<{ className?: string }>;
  label: string;
  activeClass: string;
  disabled?: boolean;
  title?: string;
}) {
  const Icon = active ? OnIcon : OffIcon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className={[
        'inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40',
        active ? activeClass : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
