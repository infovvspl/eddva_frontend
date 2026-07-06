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
      if (url) setRecordingUrl(url);
      toast({ title: 'Recording is ready', description: 'The class recording is now available.' });
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button onClick={() => navigate('/student/lectures')} className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft size={20} />
        </button>
        <Video className="text-blue-400 flex-shrink-0" size={18} />
        <h1 className="font-semibold text-base truncate flex-1">{lectureTitle}</h1>

        {phase === 'live' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black text-white flex-shrink-0 animate-pulse">
            <Radio size={10} /> LIVE
          </span>
        )}
        {phase === 'live' && (
          <span className="rounded-full bg-gray-800 px-2.5 py-0.5 font-mono text-xs font-bold text-gray-200 flex-shrink-0">
            ⏱ {duration}
          </span>
        )}
        {phase === 'live' && <LatencyBadge latency={latency} />}
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
          <Users size={13} /> {viewerCount}
        </span>

        {/* Leave Class — visible always so student can exit */}
        <button
          onClick={() => navigate('/student/lectures')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors flex-shrink-0"
        >
          <LogOut size={13} /> Leave
        </button>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Video area ── */}
        <div className="flex-1 relative bg-black min-h-0 flex flex-col">

          {/* Video element */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            <FloatingReactionLayer items={floatItems} />

            <video
              ref={videoRef}
              className={`w-full h-full object-contain ${phase !== 'live' ? 'hidden' : ''}`}
              playsInline
              autoPlay
              controls
            />

            {/* LIVE badge + fullscreen button inside video */}
            {phase === 'live' && !buffering && (
              <>
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white pointer-events-none">
                  <span className="h-2 w-2 rounded-full bg-white" /> LIVE · auto
                </span>
                <button
                  onClick={fullscreen}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <Maximize size={16} />
                </button>
                {/* Jump to Live — shown when student has seeked >8s behind the live edge */}
                {latency !== null && latency > 8 && (
                  <button
                    onClick={jumpToLive}
                    className="absolute bottom-16 right-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-lg hover:bg-red-700 transition-colors animate-pulse"
                  >
                    <Radio size={11} /> Jump to Live
                  </button>
                )}
              </>
            )}

            {/* Buffering overlay */}
            {phase === 'live' && buffering && (
              <div className="absolute inset-0 grid place-items-center bg-gray-900/80 text-center">
                <div>
                  <Loader2 className="mx-auto mb-3 text-blue-400 animate-spin" size={36} />
                  <p className="text-base font-bold text-white/80">Connecting to live stream…</p>
                  <p className="text-xs text-white/50 mt-1">Buffering the teacher's feed — this takes a few seconds.</p>
                </div>
              </div>
            )}

            {/* Waiting screen */}
            {phase === 'waiting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                  <Video className="text-gray-500" size={28} />
                </div>
                <p className="text-lg font-semibold text-white">{lectureTitle}</p>
                <p className="text-gray-400 text-sm">Waiting for the teacher to start the stream…</p>
                <Loader2 className="text-blue-400 animate-spin" size={22} />
              </div>
            )}

            {/* Ended screen */}
            {phase === 'ended' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-6">
                <Video className="text-gray-500" size={40} />
                <p className="text-lg font-semibold text-white">Class Ended</p>
                {recordingUrl ? (
                  <>
                    <p className="text-gray-400 text-sm">The recording is ready to watch.</p>
                    <a
                      href={recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink size={14} /> Watch Recording
                    </a>
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">Recording will be available soon.</p>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate('/student/lectures')}>
                  Back to Lectures
                </Button>
              </div>
            )}
          </div>

          {/* Bottom controls — reactions + hand raise */}
          {phase === 'live' && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-t border-gray-800 flex-shrink-0">
              <div className="flex gap-1.5">
                {BROADCAST_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="text-xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={toggleHand}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                  handRaised
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Hand size={14} /> {handRaised ? 'Hand Raised ✋' : 'Raise Hand'}
              </button>
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-800 bg-gray-900">

          {/* Panel tabs */}
          <div className="flex border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
            {([
              { key: 'chat' as const, label: 'Chat', Icon: MessageSquare },
              { key: 'polls' as const, label: 'Polls', Icon: null },
            ]).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors relative ${
                  sidePanel === key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {Icon && <Icon size={13} />}
                {label}
                {key === 'polls' && activePoll && (
                  <span className="absolute top-1 right-3 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">

            {/* ── Chat ── */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.length === 0 && (
                    <p className="py-10 text-center text-xs text-gray-600">Be the first to say hi 👋</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/30 text-xs font-bold text-blue-200">
                        {m.userName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-xs font-bold text-blue-300">{m.userName}</span>
                          <span className="shrink-0 text-[10px] text-gray-500">{fmtTime(m.createdAt)}</span>
                        </div>
                        <p className="break-words text-sm text-gray-200 mt-0.5">{m.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-2.5 border-t border-gray-800 flex-shrink-0 flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                    maxLength={300}
                    disabled={cooldown}
                    placeholder={cooldown ? `Wait ${cooldownSec}s…` : 'Type a message…'}
                    className="flex-1 min-w-0 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                  <button
                    onClick={sendChat}
                    disabled={cooldown || !draft.trim()}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Polls ── */}
            {sidePanel === 'polls' && (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Active poll inline */}
                {activePoll && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Active Poll</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-3">{activePoll.question}</p>
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
                            className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              isSelected
                                ? 'bg-blue-700 border-blue-500 text-white'
                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-600'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{opt}</span>
                              {selectedOption && <span className="text-xs text-gray-400">{pct}%</span>}
                            </div>
                            {selectedOption && (
                              <div className="h-1 bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Past polls */}
                {pastPolls.length > 0 && (
                  <>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                      Past Polls ({pastPolls.length})
                    </p>
                    {pastPolls.map((poll) => {
                      const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                      const studentVote = localStorage.getItem(POLL_VOTE_KEY(poll.id));
                      return (
                        <div key={poll.id} className="bg-gray-800 rounded-xl p-3">
                          <p className="text-xs font-bold text-gray-200 mb-2">{poll.question}</p>
                          <div className="space-y-2">
                            {poll.options.map((opt) => {
                              const votes = poll.results?.[opt] ?? 0;
                              const pct = total ? Math.round((votes / total) * 100) : 0;
                              const isCorrect = poll.correctOption === opt;
                              const isYourVote = studentVote === opt;
                              const hasCorrect = !!poll.correctOption;

                              let barColor = 'bg-gray-500';
                              let suffix: React.ReactNode = null;
                              if (hasCorrect) {
                                if (isCorrect) {
                                  barColor = 'bg-green-500';
                                  suffix = <span className="rounded bg-green-900/50 px-1.5 py-0.5 text-[9px] font-black text-green-400">✓ Correct</span>;
                                } else if (isYourVote) {
                                  barColor = 'bg-red-500';
                                  suffix = <span className="rounded bg-red-900/50 px-1.5 py-0.5 text-[9px] font-black text-red-400">✗ Yours</span>;
                                }
                              } else if (isYourVote) {
                                barColor = 'bg-blue-500';
                                suffix = <span className="rounded bg-blue-900/50 px-1.5 py-0.5 text-[9px] font-black text-blue-400">Your choice</span>;
                              }

                              return (
                                <div key={opt} className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] font-bold text-gray-300">
                                    <span className="flex items-center gap-1 truncate pr-1.5">
                                      {opt} {suffix}
                                    </span>
                                    <span className="shrink-0">{votes} ({pct}%)</span>
                                  </div>
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                    <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {!activePoll && pastPolls.length === 0 && (
                  <p className="py-10 text-center text-xs text-gray-600">No polls yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Poll Popup ── */}
      {showPollPopup && activePoll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Poll
              </span>
              <button onClick={() => setShowPollPopup(false)} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            <h4 className="text-base font-black text-gray-900 dark:text-white mb-4">{activePoll.question}</h4>

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

                  let barColor = 'bg-gray-400';
                  let labelSuffix: React.ReactNode = null;
                  if (hasCorrect) {
                    if (isCorrect) {
                      barColor = 'bg-green-500';
                      labelSuffix = <span className="rounded bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 text-[10px] font-black text-green-700 dark:text-green-300">✓ Correct</span>;
                    } else if (isYourVote) {
                      barColor = 'bg-red-500';
                      labelSuffix = <span className="rounded bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 text-[10px] font-black text-red-700 dark:text-red-300">✗ Incorrect</span>;
                    }
                  } else if (isYourVote) {
                    barColor = 'bg-blue-500';
                    labelSuffix = <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">(Your choice)</span>;
                  }

                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-1.5 truncate pr-2">{opt} {labelSuffix}</span>
                        <span className="shrink-0">{votes} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Voting view
              <div className="space-y-2.5">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { votePoll(opt); }}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 py-3 px-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {!selectedOption && (
              <button onClick={() => setShowPollPopup(false)} className="w-full mt-4 text-xs text-gray-400 hover:text-gray-300 text-center">
                Answer later
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
