import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import {
  BROADCAST_REACTIONS,
  BroadcastChatMessage,
  broadcastHlsUrl,
  createBroadcastSocket,
  getBroadcastToken,
  liveBroadcast,
} from '@/lib/api/live-broadcast';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  BarChart2,
  ExternalLink,
  Hand,
  Loader2,
  LogOut,
  Maximize,
  MessageSquare,
  Radio,
  Send,
  Settings2,
  Users,
  Video,
  X,
  Wifi,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react';

type Phase = 'waiting' | 'live' | 'ended';
type SidePanel = 'chat' | 'polls';

function LatencyBadge({ latency }: { latency: number | null }) {
  if (latency === null) return null;
  const color = latency <= 4 ? 'text-green-300' : latency <= 8 ? 'text-yellow-300' : 'text-red-300';
  return (
    <span className={`rounded-full bg-black/60 px-2.5 py-0.5 font-mono text-xs font-bold flex-shrink-0 ${color}`}>
      ~{latency}s delay
    </span>
  );
}

interface ActivePoll {
  id: string;
  question: string;
  options: string[];
  correctOption?: string;
  results: Record<string, number>;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const CHAT_COOLDOWN_MS = 3_000;

/** Persist the student's poll vote so it survives page refresh. */
const POLL_VOTE_KEY = (pollId: string) => `broadcast_vote_${pollId}`;

export default function StudentLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [viewerCount, setViewerCount] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [volumeMuted, setVolumeMuted] = useState(false);

  // Sync volume state to actual HTMLVideoElement
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = volumeMuted;
    }
  }, [volumeMuted]);
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [qualities, setQualities] = useState<Array<{ label: string; url: string }>>([]);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Duration timer
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const [messages, setMessages] = useState<BroadcastChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);

  const [latency, setLatency] = useState<number | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPollPopup, setShowPollPopup] = useState(false);
  const [pastPolls, setPastPolls] = useState<ActivePoll[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamStartDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { items: floatItems, push: pushReaction } = useFloatingReactions();

  // ── Duration timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Live latency tracker ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') { setLatency(null); return; }
    const t = setInterval(() => {
      const hls = hlsRef.current;
      const video = videoRef.current;
      if (!hls || !video) return;
      const syncPos = (hls as any).liveSyncPosition;
      const lat = typeof syncPos === 'number' && isFinite(syncPos)
        ? Math.max(0, Math.round(syncPos - video.currentTime))
        : null;
      setLatency(lat);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  const duration = useMemo(() => {
    if (!startedAt) return '00:00';
    const s = Math.max(0, Math.floor((now - startedAt) / 1000));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return (hh ? `${String(hh).padStart(2, '0')}:` : '') +
      `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, startedAt]);

  // ── HLS attach ─────────────────────────────────────────────────────────────
  // retryCount prevents an infinite rebuild loop on unrecoverable errors (BUG-14,15).
  const attach = useCallback((url: string, retryCount = 0) => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setBuffering(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        backBufferLength: 2,
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 2000,
        manifestLoadingMaxRetryTimeout: 30_000,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      const jumpToLive = () => {
        const live = (hls as any).liveSyncPosition;
        if (typeof live === 'number' && isFinite(live)) {
          if (video.currentTime < live - 1) video.currentTime = live;
        } else if (video.seekable.length) {
          video.currentTime = video.seekable.end(video.seekable.length - 1);
        }
      };

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setBuffering(false);
        jumpToLive();
        video.play().catch(() => undefined);
      });

      hls.on(Hls.Events.LEVEL_UPDATED, () => {
        const live = (hls as any).liveSyncPosition;
        if (typeof live === 'number' && isFinite(live) && live - video.currentTime > 5) {
          video.currentTime = live;
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) return;
        if (retryCount >= 6) { setBuffering(false); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Recreate the instance — hls.startLoad() only resumes a stopped load,
          // it cannot recover a dead connection (BUG-15).
          try { hls.destroy(); } catch { /* noop */ }
          hlsRef.current = null;
          setBuffering(true);
          setTimeout(() => attach(url, retryCount + 1), 3000);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { hls.recoverMediaError(); } catch {
            try { hls.destroy(); } catch { /* noop */ }
            hlsRef.current = null;
            setTimeout(() => attach(url, retryCount + 1), 4000);
          }
        } else {
          try { hls.destroy(); } catch { /* noop */ }
          hlsRef.current = null;
          setTimeout(() => attach(url, retryCount + 1), 4000);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setBuffering(false);
        if (video.seekable.length) video.currentTime = video.seekable.end(video.seekable.length - 1);
        video.play().catch(() => undefined);
      }, { once: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; };
  }, []);

  // ── Load initial state ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    liveBroadcast.getStreamUrl(id).then((info) => {
      if (cancelled) return;
      if (info?.title) setLectureTitle(info.title);
      if (info?.startedAt) setStartedAt(new Date(info.startedAt).getTime());
      if (info?.streamKey) {
        const proxyUrl = broadcastHlsUrl(info.streamKey);
        const quals: Array<{ label: string; url: string }> = info.qualities
          ? info.qualities.map((q) => q.label === 'Auto' ? { ...q, url: proxyUrl } : q)
          : [{ label: 'Auto', url: proxyUrl }];
        setQualities(quals);
        setSelectedQuality('Auto');
      }
      if (info?.status === 'LIVE') {
        setPhase('live');
        if (info.streamKey) setTimeout(() => attach(broadcastHlsUrl(info.streamKey!), 0), 0);
      } else if (info?.status && ['ENDED', 'PROCESSED'].includes(info.status)) {
        setPhase('ended');
      }
    }).catch(() => undefined);

    liveBroadcast.getChatHistory(id).then((h) => { if (!cancelled) setMessages(h); }).catch(() => undefined);

    liveBroadcast.getActivePoll(id).then((res) => {
      if (cancelled || !res?.poll) return;
      const poll: ActivePoll = { ...res.poll, results: res.results || {} };
      setActivePoll(poll);
      const saved = localStorage.getItem(POLL_VOTE_KEY(poll.id));
      if (saved) { setSelectedOption(saved); setShowPollPopup(false); }
      else { setSelectedOption(null); setShowPollPopup(true); }
    }).catch(() => undefined);

    liveBroadcast.listPolls(id).then((polls) => {
      if (cancelled) return;
      setPastPolls(
        polls
          .filter((p: any) => p.status === 'ENDED')
          .map((p: any) => ({ id: p.id, question: p.question, options: p.options, correctOption: p.correctOption, results: p.results || {} })),
      );
    }).catch(() => undefined);

    return () => { cancelled = true; };
  }, [id, attach]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = createBroadcastSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', { token: getBroadcastToken(), lectureId: id });
    });

    socket.on('joined', ({ viewerCount: vc }) => setViewerCount(vc ?? 0));

    socket.on('stream-started', () => {
      setPhase('live');
      setStartedAt(Date.now());
      if (streamStartDebounce.current) clearTimeout(streamStartDebounce.current);
      streamStartDebounce.current = setTimeout(async () => {
        try {
          const info = await liveBroadcast.getStreamUrl(id);
          if (!info?.streamKey) return;
          const proxyUrl = broadcastHlsUrl(info.streamKey);
          const quals: Array<{ label: string; url: string }> = info.qualities
            ? info.qualities.map((q) => q.label === 'Auto' ? { ...q, url: proxyUrl } : q)
            : [{ label: 'Auto', url: proxyUrl }];
          setQualities(quals);
          // Re-attach with whatever quality the student currently has selected
          setSelectedQuality((cur) => {
            const chosen = quals.find((q) => q.label === cur) ?? quals[0];
            attach(chosen.url, 0);
            return chosen.label;
          });
        } catch { /* noop */ }
      }, 500);
    });

    socket.on('stream-ended', () => {
      setPhase('ended');
      hlsRef.current?.destroy();
      hlsRef.current = null;
    });

    socket.on('recording-ready', ({ url }: { url?: string }) => {
      toast({ title: 'Recording is ready', description: 'The class recording is now available.' });
      if (url) { setRecordingUrl(url); return; }
      // Processor only publishes { lectureId } — fetch signed URL from API
      if (id) {
        liveBroadcast.getRecordingUrl(id)
          .then((data) => { if (data?.url) setRecordingUrl(data.url); })
          .catch(() => undefined);
      }
    });

    socket.on('viewerCount', ({ count }) => setViewerCount(count ?? 0));

    socket.on('chat', (msg: BroadcastChatMessage) => {
      setMessages((prev) => [...prev.slice(-200), msg]);
    });

    socket.on('chat-rate-limited', ({ retryInSeconds }) => {
      const secs = retryInSeconds || 10;
      setCooldown(true);
      setCooldownSec(secs);
      const tick = setInterval(() => {
        setCooldownSec((s) => {
          if (s <= 1) { clearInterval(tick); setCooldown(false); return 0; }
          return s - 1;
        });
      }, 1000);
    });

    socket.on('hand-ack', ({ raised }) => setHandRaised(raised));
    socket.on('reaction', ({ emoji }) => pushReaction(emoji));

    socket.on('poll-created', ({ poll }) => {
      const newPoll: ActivePoll = {
        id: poll.id, question: poll.question,
        options: poll.options, correctOption: poll.correctOption, results: {},
      };
      setActivePoll(newPoll);
      setSelectedOption(null);
      setShowPollPopup(true);
      // Refresh past polls list in case server keeps full history
      liveBroadcast.listPolls(id).then((polls) => {
        setPastPolls(
          polls.filter((p: any) => p.status === 'ENDED')
            .map((p: any) => ({ id: p.id, question: p.question, options: p.options, correctOption: p.correctOption, results: p.results || {} })),
        );
      }).catch(() => undefined);
    });

    socket.on('poll-results', ({ pollId, results }) => {
      setActivePoll((prev) => (prev?.id === pollId ? { ...prev, results } : prev));
    });

    socket.on('poll-ended', ({ pollId }) => {
      setActivePoll((prev) => {
        if (prev?.id === pollId) {
          setPastPolls((p) => [...p, { ...prev }]);
          return null;
        }
        return prev;
      });
      setShowPollPopup(false);
      // Refresh to get server results
      liveBroadcast.listPolls(id).then((polls) => {
        setPastPolls(
          polls.filter((p: any) => p.status === 'ENDED')
            .map((p: any) => ({ id: p.id, question: p.question, options: p.options, correctOption: p.correctOption, results: p.results || {} })),
        );
      }).catch(() => undefined);
    });

    socket.on('stream-error', ({ message }) => {
      toast({ title: 'Connection error', description: message, variant: 'destructive' });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [id, attach]);

  // Auto-scroll chat
  useEffect(() => {
    if (messages.length) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const sendChat = () => {
    const text = draft.trim();
    if (!text || !socketRef.current || cooldown) return;
    socketRef.current.emit('chat', { text: text.slice(0, 300) });
    setDraft('');
    setCooldown(true);
    setCooldownSec(3);
    if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    cooldownTimer.current = setTimeout(() => setCooldown(false), CHAT_COOLDOWN_MS);
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit('raise-hand', { raised: next });
    if (id) liveBroadcast.setHandRaised(id, next).catch(() => setHandRaised(!next));
  };

  const sendReaction = (emoji: string) => socketRef.current?.emit('reaction', { emoji });

  const votePoll = async (option: string) => {
    if (!activePoll || !id) return;
    setSelectedOption(option);
    // Persist so refresh restores the selection
    localStorage.setItem(POLL_VOTE_KEY(activePoll.id), option);
    try {
      const res = await liveBroadcast.votePoll(id, activePoll.id, option);
      if (res?.results) {
        setActivePoll((prev) => (prev ? { ...prev, results: res.results } : prev));
      }
    } catch {
      toast({ title: 'Failed to submit vote', variant: 'destructive' });
    }
  };

  const selectQuality = (qual: { label: string; url: string }) => {
    setSelectedQuality(qual.label);
    setShowQualityMenu(false);
    if (phase === 'live') attach(qual.url);
  };

  const fullscreen = () => videoRef.current?.requestFullscreen?.().catch(() => undefined);

  const jumpToLive = () => {
    const hls = hlsRef.current;
    const video = videoRef.current;
    if (!hls || !video) return;
    const syncPos = (hls as any).liveSyncPosition;
    if (typeof syncPos === 'number' && isFinite(syncPos)) {
      video.currentTime = syncPos;
    } else if (video.seekable.length) {
      video.currentTime = video.seekable.end(video.seekable.length - 1);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f1115] text-slate-200 flex flex-col font-sans h-screen overflow-hidden select-none">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0f1115]/90 backdrop-blur-xl flex-shrink-0 z-10 sticky top-0 shadow-lg">
        {/* Left: Course Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/student/lectures')}
            className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 shrink-0 border border-white/5"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-400 shrink-0 border border-blue-500/20">
              <Video size={18} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-sm font-bold text-slate-200 truncate leading-tight tracking-tight max-w-[200px] sm:max-w-[300px]">{lectureTitle}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coaching Live Class</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Class Controls & Metadata */}
        <div className="flex items-center gap-3">
          {phase === 'live' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">LIVE</span>
            </div>
          )}

          {phase === 'live' && (
            <div className="flex items-center px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 shrink-0">
              <span className="font-mono text-[11px] font-bold text-slate-300">⏱ {duration}</span>
            </div>
          )}

          {/* Own connection wifi icon (purely visual) */}
          <div className="relative group">
            <div className="flex items-center px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 shrink-0 cursor-pointer text-emerald-400">
              <Wifi size={14} />
            </div>
            <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-xl p-2 hidden group-hover:block z-50 text-[10px] text-slate-400 text-center font-bold">
              Connection: Stable
            </div>
          </div>

          {/* Participant count icon */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 shrink-0">
            <Users size={14} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-300">{viewerCount}</span>
          </div>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <button
            onClick={() => navigate('/student/lectures')}
            className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border border-transparent px-4 py-2 text-xs font-bold transition-all duration-200 shrink-0 shadow-lg shadow-rose-950/20"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 min-h-0">
        {/* Left Area (Video Feed) */}
        <div className="flex-1 relative min-h-0 flex flex-col rounded-3xl bg-[#14171f]/60 border border-white/5 p-4 sm:p-5 overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01),transparent_70%)] pointer-events-none" />

          {/* Video Container */}
          <div className="relative flex-1 rounded-2xl overflow-hidden bg-black/60 shadow-inner border border-white/5 flex items-center justify-center">
            {/* Reaction float layer */}
            <FloatingReactionLayer items={floatItems} />

            {/* Pinned Teacher badge */}
            <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Pinned: Teacher's Screen
            </div>

            {/* Closed Captions Overlay */}
            {ccEnabled && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 max-w-xl text-center bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs sm:text-sm text-slate-100 font-medium tracking-wide">
                  <span className="text-blue-400 font-bold uppercase text-[10px] mr-1.5">CC [Local Auto]</span> Welcome to today's live lecture. Please ensure your notebooks are ready as we cover the core syllabus.
                </p>
              </div>
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-contain relative z-10 ${phase !== 'live' ? 'hidden' : ''}`}
              playsInline
              autoPlay
            />

            {/* Controls overlay */}
            {phase === 'live' && !buffering && (
              <>
                {/* LIVE badge top-left */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white pointer-events-none z-20">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  LIVE · {selectedQuality === 'Auto' ? 'auto' : selectedQuality}
                </span>

                {/* Quality selector top-right */}
                {qualities.length > 1 && (
                  <div className="absolute right-3 top-3 z-20" onBlur={() => setTimeout(() => setShowQualityMenu(false), 120)}>
                    <button
                      onClick={() => setShowQualityMenu((v) => !v)}
                      className="h-9 px-2.5 rounded-xl bg-black/60 text-white text-[10px] font-black hover:bg-black/80 backdrop-blur-md transition-all border border-white/5 flex items-center gap-1"
                    >
                      <Settings2 size={12} />
                      {selectedQuality}
                    </button>
                    {showQualityMenu && (
                      <div className="absolute right-0 top-10 bg-gray-900/95 border border-gray-700 rounded-xl overflow-hidden shadow-2xl min-w-[90px] z-50">
                        {qualities.map((q) => (
                          <button
                            key={q.label}
                            onMouseDown={() => selectQuality(q)}
                            className={`w-full px-3.5 py-2 text-left text-xs font-bold transition-colors ${
                              selectedQuality === q.label
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-200 hover:bg-gray-700'
                            }`}
                          >
                            {q.label === 'Auto' ? 'Auto (HD)' : q.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Volume + Fullscreen bottom-right */}
                <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => setVolumeMuted(!volumeMuted)}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/5"
                    title={volumeMuted ? 'Unmute' : 'Mute'}
                  >
                    {volumeMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                  <button
                    onClick={fullscreen}
                    className="grid h-9 w-9 place-items-center rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all border border-white/5"
                    title="Fullscreen"
                  >
                    <Maximize size={15} />
                  </button>
                </div>

                {/* Jump to Live */}
                {latency !== null && latency > 8 && (
                  <button
                    onClick={jumpToLive}
                    className="absolute bottom-16 right-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-lg hover:bg-red-700 transition-colors animate-pulse z-20"
                  >
                    <Radio size={11} /> Jump to Live
                  </button>
                )}
              </>
            )}

            {/* Buffering/Loading Screen */}
            {phase === 'live' && buffering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm z-30 animate-in fade-in duration-300">
                <div className="text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 animate-pulse">
                    <Loader2 className="text-blue-400 animate-spin" size={28} />
                  </div>
                  <p className="text-lg font-bold text-white">Connecting to live stream…</p>
                  <p className="text-sm text-slate-400 mt-1">Buffering the teacher's feed.</p>
                </div>
              </div>
            )}

            {/* Waiting Screen */}
            {phase === 'waiting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 z-20 animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin opacity-40"></div>
                  <Video className="text-slate-400" size={36} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-2">{lectureTitle}</p>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Waiting for the teacher to start the class. This screen will update automatically.</p>
                </div>
              </div>
            )}

            {/* Ended Screen */}
            {phase === 'ended' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 z-20 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-xl">
                  <Video className="text-slate-500" size={32} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Class Ended</p>
                  {recordingUrl ? (
                    <p className="text-slate-400 text-sm mt-2">The recording is ready to watch.</p>
                  ) : (
                    <p className="text-slate-400 text-sm mt-2">Recording will be available soon.</p>
                  )}
                </div>
                {recordingUrl ? (
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all hover:scale-105 shadow-xl shadow-blue-900/20 mt-2"
                  >
                    <ExternalLink size={16} /> Watch Recording
                  </a>
                ) : (
                  <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/5 mt-2 text-white" onClick={() => navigate('/student/lectures')}>
                    Back to Lectures
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Dock (Reactions & Raise Hand) */}
          {phase === 'live' && (
            <div className="mt-4 flex justify-center w-full z-20 relative">
              <div className="inline-flex items-center gap-3 p-2 rounded-2xl bg-[#0f1115]/95 border border-white/10 backdrop-blur-xl shadow-2xl">
                {/* CC Toggle at bottom-left of control dock */}
                <button
                  onClick={() => setCcEnabled(!ccEnabled)}
                  className={`h-11 px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${ccEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                  title="Closed Captions"
                >
                  <Subtitles size={18} />
                  <span>CC</span>
                </button>

                <div className="w-px h-6 bg-white/10" />

                {/* Reactions */}
                <div className="flex items-center gap-1">
                  {BROADCAST_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => sendReaction(emoji)}
                      className="h-10 w-10 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-all duration-150 hover:-translate-y-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <div className="w-px h-6 bg-white/10" />

                {/* Hand Raised Chip & Raise Hand Button */}
                <div className="relative flex items-center">
                  {handRaised && (
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg border border-amber-400/20 animate-bounce whitespace-nowrap">
                      ✋ Hand Raised
                    </div>
                  )}
                  <button
                    onClick={toggleHand}
                    className={`inline-flex items-center gap-2 rounded-xl h-11 px-5 text-xs font-bold transition-all duration-200 ${handRaised
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 border border-amber-400'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                      }`}
                  >
                    <Hand size={14} />
                    <span>{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Area (Sidebar - Chat / Polls only) */}
        <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col rounded-3xl border border-white/5 bg-[#14171f]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Tabs header */}
          <div className="flex p-1.5 bg-white/[0.02] mx-3 mt-3 rounded-2xl border border-white/5 flex-shrink-0">
            {([
              { key: 'chat' as const, label: 'Chat', Icon: MessageSquare },
              { key: 'polls' as const, label: 'Polls', Icon: BarChart2 },
            ]).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200 rounded-xl relative ${sidePanel === key ? 'bg-white/10 text-slate-200 shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
              >
                <Icon size={14} />
                <span>{label}</span>
                {key === 'polls' && activePoll && (
                  <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                )}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
            {/* Chat list */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 flex items-center justify-center mb-4 text-4xl bg-white/5 rounded-full border border-white/5 shadow-inner">
                        💬
                      </div>
                      <p className="text-sm font-bold text-slate-200 mb-1">Start the conversation</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Ask a doubt, say hello, or participate in today's class chat.</p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                        {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="truncate text-xs font-bold text-slate-200">{m.userName || 'User'}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                        </div>
                        <div className="inline-block bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[90%] shadow-sm">
                          <p className="break-words text-[13px] text-slate-200 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input box */}
                <div className="p-3 bg-[#0f1115]/50 border-t border-white/5 flex-shrink-0">
                  <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-200">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      maxLength={300}
                      disabled={cooldown}
                      placeholder={cooldown ? `Cooldown (${cooldownSec}s)` : 'Type a message…'}
                      className="flex-1 min-w-0 bg-transparent px-3 text-[13px] text-slate-200 placeholder-slate-400 outline-none disabled:opacity-50 h-10"
                    />
                    <button
                      onClick={sendChat}
                      disabled={cooldown || !draft.trim()}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 disabled:opacity-30 disabled:hover:bg-blue-600/10 disabled:hover:text-blue-400 hover:-translate-y-0.5 border border-transparent shadow-sm"
                    >
                      <Send size={15} className="-ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Polls tab */}
            {sidePanel === 'polls' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {activePoll && (
                  <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active Poll</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-4 leading-relaxed">{activePoll.question}</p>
                    <div className="space-y-2.5">
                      {activePoll.options.map((opt) => {
                        const votes = activePoll.results?.[opt] ?? 0;
                        const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                        const pct = total ? Math.round((votes / total) * 100) : 0;
                        const isSelected = selectedOption === opt;
                        const isCorrect = activePoll.correctOption === opt;
                        return (
                          <button
                            key={opt}
                            onClick={() => { votePoll(opt); setShowPollPopup(false); }}
                            className={`w-full text-left relative overflow-hidden rounded-xl border text-xs transition-all duration-200 ${isSelected
                              ? 'bg-blue-600/20 border-blue-500/50'
                              : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-white/5'
                              }`}
                          >
                            {selectedOption && (
                              <div
                                className={`absolute inset-y-0 left-0 opacity-20 ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                              />
                            )}
                            <div className="relative z-10 px-4 py-3 flex justify-between items-center">
                              <span className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>{opt}</span>
                              {selectedOption && <span className="text-xs font-bold text-slate-400 ml-3">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past Polls list */}
                {pastPolls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      Past Polls <span className="px-1.5 py-0.5 rounded bg-white/5">{pastPolls.length}</span>
                    </p>
                    {pastPolls.map((poll) => {
                      const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                      const studentVote = localStorage.getItem(POLL_VOTE_KEY(poll.id));
                      return (
                        <div key={poll.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 shadow-sm hover:border-white/10 transition-colors">
                          <p className="text-xs font-bold text-slate-200 mb-3">{poll.question}</p>
                          <div className="space-y-3">
                            {poll.options.map((opt) => {
                              const votes = poll.results?.[opt] ?? 0;
                              const pct = total ? Math.round((votes / total) * 100) : 0;
                              const isCorrect = poll.correctOption === opt;
                              const isYourVote = studentVote === opt;
                              const hasCorrect = !!poll.correctOption;

                              let barColor = 'bg-slate-600';
                              let suffix: React.ReactNode = null;
                              if (hasCorrect) {
                                if (isCorrect) {
                                  barColor = 'bg-emerald-500';
                                  suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>;
                                } else if (isYourVote) {
                                  barColor = 'bg-rose-500';
                                  suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[8px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20">✗ Yours</span>;
                                }
                              } else if (isYourVote) {
                                barColor = 'bg-blue-500';
                                suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20">Your choice</span>;
                              }

                              return (
                                <div key={opt} className="space-y-1.5 relative">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span className="flex items-center truncate pr-2">
                                      {opt} {suffix}
                                    </span>
                                    <span className="shrink-0">{votes} ({pct}%)</span>
                                  </div>
                                  <div className="h-1 w-full overflow-hidden rounded-full bg-black/40">
                                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%`, transition: 'width 1s ease-out' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!activePoll && pastPolls.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
                    <div className="w-16 h-16 flex items-center justify-center mb-4 text-4xl bg-white/5 rounded-full border border-white/5">
                      📊
                    </div>
                    <p className="text-sm font-bold text-slate-200 mb-1">No active polls</p>
                    <p className="text-xs text-slate-400 leading-relaxed">When the instructor starts a poll, it will appear here instantly.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Poll Popup */}
      {showPollPopup && activePoll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Live Poll
              </span>
              <button onClick={() => setShowPollPopup(false)} className="rounded-full p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
                <X size={16} />
              </button>
            </div>

            <h4 className="text-base sm:text-lg font-bold text-white mb-5 leading-snug">{activePoll.question}</h4>

            {selectedOption ? (
              <div className="space-y-3">
                {activePoll.options.map((opt) => {
                  const votes = activePoll.results?.[opt] ?? 0;
                  const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((votes / total) * 100) : 0;
                  const isYourVote = selectedOption === opt;
                  const hasCorrect = !!activePoll.correctOption;
                  const isCorrect = activePoll.correctOption === opt;

                  let barColor = 'bg-slate-600';
                  let labelSuffix: React.ReactNode = null;
                  if (hasCorrect) {
                    if (isCorrect) {
                      barColor = 'bg-emerald-500';
                      labelSuffix = <span className="rounded px-1.5 py-0.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>;
                    } else if (isYourVote) {
                      barColor = 'bg-rose-500';
                      labelSuffix = <span className="rounded px-1.5 py-0.5 text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20">✗ Incorrect</span>;
                    }
                  } else if (isYourVote) {
                    barColor = 'bg-blue-500';
                    labelSuffix = <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">(Your choice)</span>;
                  }

                  return (
                    <div key={opt} className="space-y-1.5 relative p-3 rounded-xl border border-white/5 bg-white/5">
                      <div className="flex justify-between text-xs font-bold text-slate-300 relative z-10">
                        <span className="flex items-center gap-2 truncate pr-2">{opt} {labelSuffix}</span>
                        <span className="shrink-0 font-mono">{votes} ({pct})%</span>
                      </div>
                      <div className="absolute inset-0 rounded-xl overflow-hidden opacity-20 pointer-events-none">
                        <div className={`h-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { votePoll(opt); }}
                    className="w-full rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-3 px-4 text-left text-xs sm:text-sm font-bold text-slate-200 transition-all hover:scale-[1.01] hover:border-blue-500/50 shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {!selectedOption && (
              <button onClick={() => setShowPollPopup(false)} className="w-full mt-4 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors text-center py-2">
                Answer later
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
