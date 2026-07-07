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
  Users,
  Video,
  X,
} from 'lucide-react';

type Phase = 'waiting' | 'live' | 'ended';
type SidePanel = 'chat' | 'polls';

function LatencyBadge({ latency }: { latency: number | null }) {
  if (latency === null) return null;
  const color = latency <= 4 ? 'text-emerald-600' : latency <= 8 ? 'text-amber-600' : 'text-red-600';
  return (
    <span className={`rounded-lg bg-gray-100 border border-[#E8EAF0] px-2.5 py-1 font-mono text-xs font-medium flex-shrink-0 ${color}`}>
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
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

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
      // Debounce: OBS can emit multiple on_publish events during a quick reconnect;
      // firing a separate API call for each wastes requests and races on setState (BUG-29).
      if (streamStartDebounce.current) clearTimeout(streamStartDebounce.current);
      streamStartDebounce.current = setTimeout(async () => {
        try {
          const info = await liveBroadcast.getStreamUrl(id);
          if (info?.streamKey) attach(broadcastHlsUrl(info.streamKey), 0);
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
      if (res?.results) setActivePoll((prev) => prev ? { ...prev, results: res.results } : prev);
    } catch {
      toast({ title: 'Failed to submit vote', variant: 'destructive' });
    }
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
    <div className="min-h-screen bg-[#F7F8FA] text-gray-900 flex flex-col">

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-[#E8EAF0] flex-shrink-0 z-10 sticky top-0 shadow-sm">
        {/* Left: Back + Course Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/student/lectures')} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors duration-150 shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold text-gray-900 truncate leading-tight">{lectureTitle}</h1>
            <p className="text-xs text-gray-500 truncate">Coaching Live Class</p>
          </div>
        </div>

        {/* Right: Status Pills */}
        <div className="flex items-center gap-2">
          {phase === 'live' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 shrink-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700">LIVE</span>
            </div>
          )}
          
          {phase === 'live' && (
            <div className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-gray-100 border border-[#E8EAF0] shrink-0">
              <span className="font-mono text-xs font-medium text-gray-600">⏱ {duration}</span>
            </div>
          )}
          
          {phase === 'live' && latency !== null && (
            <div className={`hidden md:flex items-center px-2.5 py-1 rounded-lg bg-gray-100 border border-[#E8EAF0] shrink-0 font-mono text-xs font-medium ${latency <= 4 ? 'text-emerald-600' : latency <= 8 ? 'text-amber-600' : 'text-red-600'}`}>
              ~{latency}s delay
            </div>
          )}
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 border border-[#E8EAF0] shrink-0">
            <Users size={14} className="text-gray-500" />
            <span className="text-xs font-medium text-gray-700">{viewerCount}</span>
          </div>

          <div className="w-px h-5 bg-[#E8EAF0] mx-0.5" />

          <button
            onClick={() => navigate('/student/lectures')}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 border border-[#E8EAF0] transition-colors duration-150 shrink-0"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      {/* Main body */}
      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row p-3 lg:p-4 gap-3 lg:gap-4 max-w-[1600px] mx-auto w-full">

        {/* ── Video area ── */}
        <div className="md:flex-1 md:min-h-0 flex flex-col bg-white rounded-xl border border-[#E8EAF0] shadow-sm overflow-hidden">

          {/* Video element */}
          <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center min-h-[240px] md:min-h-0 group">
            <FloatingReactionLayer items={floatItems} />

            <video
              ref={videoRef}
              className={`w-full h-full object-contain relative z-10 ${phase !== 'live' ? 'hidden' : ''}`}
              playsInline
              autoPlay
              controls
            />

            {/* LIVE badge + fullscreen button inside video */}
            {phase === 'live' && !buffering && (
              <>
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> LIVE
                </div>
                <button
                  onClick={fullscreen}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors duration-150 z-20 opacity-0 group-hover:opacity-100"
                >
                  <Maximize size={18} />
                </button>
                {/* Jump to Live — shown when student has seeked >8s behind the live edge */}
                {latency !== null && latency > 8 && (
                  <button
                    onClick={jumpToLive}
                    className="absolute bottom-20 right-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-red-700 transition-colors duration-150 animate-pulse z-20"
                  >
                    <Radio size={14} /> Jump to Live
                  </button>
                )}
              </>
            )}

            {/* Buffering overlay */}
            {phase === 'live' && buffering && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 backdrop-blur-sm z-30">
                <div className="text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
                    <Loader2 className="text-blue-400 animate-spin" size={32} />
                  </div>
                  <p className="text-lg font-bold text-white">Connecting to live stream…</p>
                  <p className="text-sm text-slate-400 mt-1">Buffering the teacher's feed.</p>
                </div>
              </div>
            )}

            {/* Waiting screen */}
            {phase === 'waiting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 z-20 bg-gray-900">
                <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-blue-400 animate-spin opacity-50"></div>
                  <Video className="text-gray-400" size={32} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white mb-1">{lectureTitle}</p>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">Waiting for the teacher to start the class.</p>
                </div>
              </div>
            )}

            {/* Ended screen */}
            {phase === 'ended' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 z-20 bg-gray-900">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Video className="text-gray-400" size={32} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Class Ended</p>
                  {recordingUrl ? (
                    <p className="text-gray-400 text-sm mt-1">The recording is ready to watch.</p>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">Recording will be available soon.</p>
                  )}
                </div>
                {recordingUrl ? (
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors duration-150 shadow-sm mt-3"
                  >
                    <ExternalLink size={16} /> Watch Recording
                  </a>
                ) : (
                  <Button variant="outline" className="rounded-lg border-white/20 hover:bg-white/10 mt-3 text-white" onClick={() => navigate('/student/lectures')}>
                    Back to Lectures
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Controls bar */}
          {phase === 'live' && (
            <div className="flex items-center justify-center gap-1 px-3 py-2 border-t border-[#E8EAF0] bg-[#F7F8FA]">
              {BROADCAST_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="h-9 w-9 rounded-lg hover:bg-gray-200 flex items-center justify-center text-lg transition-colors duration-150"
                >
                  {emoji}
                </button>
              ))}
              <div className="w-px h-5 bg-[#E8EAF0] mx-1" />
              <button
                onClick={toggleHand}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  handRaised
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'hover:bg-gray-200 text-gray-600 border border-transparent'
                }`}
              >
                <Hand size={15} /> {handRaised ? 'Hand Raised' : 'Raise Hand'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-full md:w-[320px] lg:w-[360px] xl:w-[400px] md:flex-shrink-0 flex flex-col bg-white rounded-xl border border-[#E8EAF0] shadow-sm overflow-hidden">

          {/* Panel tabs */}
          <div className="flex p-1 bg-gray-100 mx-3 mt-3 rounded-lg flex-shrink-0">
            {([
              { key: 'chat' as const, label: 'Chat' },
              { key: 'polls' as const, label: 'Polls' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors duration-150 rounded-md relative ${
                  sidePanel === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                {key === 'polls' && activePoll && (
                  <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">

            {/* ── Chat ── */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4">
                      <div className="w-12 h-12 flex items-center justify-center mb-2 text-3xl">
                        💬
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">Start the conversation</p>
                      <p className="text-xs text-gray-500">Ask a doubt or say hello.</p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {m.userName.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="truncate text-sm font-bold text-gray-900">{m.userName}</span>
                          <span className="shrink-0 text-xs text-gray-400">{fmtTime(m.createdAt)}</span>
                        </div>
                        <div className="inline-block bg-gray-100 rounded-xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
                          <p className="break-words text-[13px] text-gray-800 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-3 border-t border-[#E8EAF0] flex-shrink-0 bg-white">
                  <div className="flex gap-2 bg-white border border-[#E8EAF0] rounded-xl p-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all duration-150">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      maxLength={300}
                      disabled={cooldown}
                      placeholder={cooldown ? `Wait ${cooldownSec}s…` : 'Type a message…'}
                      className="flex-1 min-w-0 bg-transparent px-3 text-[13px] text-gray-900 placeholder-gray-400 outline-none disabled:opacity-50 h-11"
                    />
                    <button
                      onClick={sendChat}
                      disabled={cooldown || !draft.trim()}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150 disabled:opacity-40"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Polls ── */}
            {sidePanel === 'polls' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Active poll inline */}
                {activePoll && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-200 rounded-md">Active Poll</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-3 leading-tight">{activePoll.question}</p>
                    <div className="space-y-2">
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
                            className={`w-full text-left relative overflow-hidden rounded-lg border text-sm transition-colors duration-150 ${
                              isSelected
                                ? 'bg-blue-50 border-blue-300'
                                : 'bg-white border-[#E8EAF0] hover:border-blue-300'
                            }`}
                          >
                            {selectedOption && (
                              <div
                                className={`absolute inset-y-0 left-0 opacity-15 ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                              />
                            )}
                            <div className="relative z-10 px-3 py-2.5 flex justify-between items-center">
                              <span className={`font-medium text-[11px] ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{opt}</span>
                              {selectedOption && <span className="text-[11px] font-medium text-gray-500 ml-3">{pct}%</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past polls */}
                {pastPolls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      Past Polls <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{pastPolls.length}</span>
                    </p>
                    {pastPolls.map((poll) => {
                      const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                      const studentVote = localStorage.getItem(POLL_VOTE_KEY(poll.id));
                      return (
                        <div key={poll.id} className="bg-white border border-[#E8EAF0] rounded-xl p-4 hover:border-gray-300 transition-colors duration-150">
                          <p className="text-sm font-semibold text-gray-900 mb-3">{poll.question}</p>
                          <div className="space-y-3">
                            {poll.options.map((opt) => {
                              const votes = poll.results?.[opt] ?? 0;
                              const pct = total ? Math.round((votes / total) * 100) : 0;
                              const isCorrect = poll.correctOption === opt;
                              const isYourVote = studentVote === opt;
                              const hasCorrect = !!poll.correctOption;

                              let barColor = 'bg-gray-400';
                              let suffix: React.ReactNode = null;
                              if (hasCorrect) {
                                if (isCorrect) {
                                  barColor = 'bg-emerald-400';
                                  suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200">✓ Correct</span>;
                                } else if (isYourVote) {
                                  barColor = 'bg-rose-400';
                                  suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-semibold text-rose-600 bg-rose-50 border border-rose-200">✗ Yours</span>;
                                }
                              } else if (isYourVote) {
                                barColor = 'bg-blue-400';
                                suffix = <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200">Your choice</span>;
                              }

                              return (
                                <div key={opt} className="space-y-1.5 relative py-1.5">
                                  <div className="flex justify-between text-[11px] font-medium text-gray-600">
                                    <span className="flex items-center truncate pr-2">
                                      {opt} {suffix}
                                    </span>
                                    <span className="shrink-0">{votes} ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
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
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-12 h-12 flex items-center justify-center mb-3 text-3xl">
                      📊
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">No active polls</p>
                    <p className="text-xs text-gray-500 leading-relaxed">When the instructor starts a poll, it will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Poll Popup ── */}
      {showPollPopup && activePoll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E8EAF0] p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Poll
              </span>
              <button onClick={() => setShowPollPopup(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-150">
                <X size={16} />
              </button>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mb-4 leading-snug">{activePoll.question}</h4>

            {selectedOption ? (
              // Results view after voting
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
                      labelSuffix = <span className="rounded px-1.5 py-0.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>;
                    } else if (isYourVote) {
                      barColor = 'bg-rose-500';
                      labelSuffix = <span className="rounded px-1.5 py-0.5 text-[10px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20">✗ Incorrect</span>;
                    }
                  } else if (isYourVote) {
                    barColor = 'bg-blue-500';
                    labelSuffix = <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">(Your choice)</span>;
                  }

                  return (
                    <div key={opt} className="space-y-1.5 relative p-3 rounded-lg border border-[#E8EAF0] bg-gray-50">
                      <div className="flex justify-between text-xs font-medium text-gray-700 relative z-10">
                        <span className="flex items-center gap-2 truncate pr-2">{opt} {labelSuffix}</span>
                        <span className="shrink-0 font-mono">{votes} ({pct}%)</span>
                      </div>
                      <div className="absolute inset-0 rounded-lg overflow-hidden opacity-15 pointer-events-none">
                         <div className={`h-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Voting view
              <div className="space-y-2">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { votePoll(opt); }}
                    className="w-full rounded-lg border border-[#E8EAF0] bg-white hover:bg-gray-50 py-3 px-4 text-left text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-blue-400"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {!selectedOption && (
              <button onClick={() => setShowPollPopup(false)} className="w-full mt-3 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors duration-150 text-center py-2">
                Answer later
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
