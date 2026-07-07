import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import { Hand, Maximize, Send, Wifi, Radio, Users, LogOut, ArrowLeft, X, PlayCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createLiveSocket,
  getLiveToken,
  hlsProxyUrl,
  LIVE_REACTIONS,
  schoolLive,
  type LiveChatMessage,
} from '@/lib/api/school-live';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';

type Phase = 'waiting' | 'live' | 'ended';

export default function StudentLivePlayer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // Refs for stale-closure guards in socket event handlers (BUG-17,18,42)
  const playbackUrlRef = useRef('');
  const activePollRef = useRef<{ id: string; question: string; options: string[]; correctOption?: string } | null>(null);

  const [phase, setPhase] = useState<Phase>('waiting');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [buffering, setBuffering] = useState(false);   // live but stream not yet flowing
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const { items: reactions, push: pushReaction } = useFloatingReactions();
  const [latency, setLatency] = useState<number | null>(null);
  const [activePoll, setActivePoll] = useState<{ id: string; question: string; options: string[]; correctOption?: string } | null>(null);
  const [pollResults, setPollResults] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showPollPopup, setShowPollPopup] = useState(false);
  const [pastPolls, setPastPolls] = useState<any[]>([]);
  const [rightPanel, setRightPanel] = useState<'chat' | 'polls'>('chat');
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingChecking, setRecordingChecking] = useState(false);

  // ── timer hook ─────────────────────────────────────────────────────────────
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
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh ? `${String(hh).padStart(2, '0')}:` : '') + `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, startedAt]);

  // ── load HLS ──────────────────────────────────────────────────────────────
  // useCallback with empty deps so the function identity is stable — prevents
  // accidental re-registration in the socket effect (BUG-38).
  // retryCount is passed explicitly so recursive retries don't loop forever (BUG-14,15).
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
        manifestLoadingMaxRetryTimeout: 30000,
      });
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
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        // Hard limit: give up after 6 total retries to prevent an infinite loop (BUG-14,15).
        if (retryCount >= 6) { setBuffering(false); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // Destroy and recreate — hls.startLoad() only resumes a stopped load,
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
      hlsRef.current = hls;
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

  // ── initial status + socket ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    schoolLive.getStreamUrl(id).then((r) => {
      if (cancelled) return;
      // Play through the same-origin proxy (R2's public domain has no CORS headers).
      const playUrl = r.streamKey ? hlsProxyUrl(r.streamKey) : r.url;
      setPlaybackUrl(playUrl);
      playbackUrlRef.current = playUrl;
      setLectureTitle(r.title || '');
      if (r.startedAt) {
        setStartedAt(new Date(r.startedAt).getTime());
      }
      if (r.status === 'LIVE') { setPhase('live'); setTimeout(() => attach(playUrl), 0); }
      else if (r.status === 'ENDED') setPhase('ended');
    }).catch(() => undefined);
    schoolLive.getChatHistory(id).then((h) => { if (!cancelled) setMessages(h); }).catch(() => undefined);
    schoolLive.getActivePoll(id).then((res) => {
      if (!cancelled && res) {
        activePollRef.current = res.poll;
        setActivePoll(res.poll);
        setPollResults(res.results);
        const savedVote = localStorage.getItem('voted_poll_' + res.poll.id);
        if (savedVote) {
          setSelectedOption(savedVote);
          setShowPollPopup(false);
        } else {
          setSelectedOption('');
          setShowPollPopup(true);
        }
      }
    }).catch(() => undefined);
    schoolLive.listPolls(id).then((res) => {
      if (!cancelled) {
        setPastPolls(res);
      }
    }).catch(() => undefined);

    const socket = createLiveSocket();
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join', { token: getLiveToken(), lectureId: id }));
    socket.on('joined', ({ viewerCount }: { viewerCount?: number }) => {
      if (typeof viewerCount === 'number') setViewerCount(viewerCount);
    });
    socket.on('viewerCount', ({ count }: { count: number }) => setViewerCount(count));
    socket.on('chat', (m: LiveChatMessage) => setMessages((prev) => [...prev.slice(-200), m]));
    socket.on('reaction', ({ emoji }: { emoji: string }) => pushReaction(emoji));
    socket.on('hand-ack', ({ raised }: { raised: boolean }) => setHandRaised(raised));
    socket.on('stream-started', () => {
      setPhase('live');
      setStartedAt(Date.now());
      // Use ref instead of functional-state update — if getStreamUrl hasn't
      // resolved yet, playbackUrl state is still '' and attach would be skipped (BUG-42).
      const url = playbackUrlRef.current;
      if (url) setTimeout(() => attach(url, 0), 300);
    });
    socket.on('stream-ended', () => {
      setPhase('ended');
      hlsRef.current?.destroy();
      hlsRef.current = null;  // prevent stale Hls instance reference (BUG-16)
    });
    socket.on('poll-created', ({ poll }: { poll: any }) => {
      activePollRef.current = poll;
      setActivePoll(poll);
      const initialResults: Record<string, number> = {};
      for (const opt of poll.options) initialResults[opt] = 0;
      setPollResults(initialResults);
      setSelectedOption('');
      setShowPollPopup(true);
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    });
    socket.on('poll-results', ({ pollId, results }: { pollId: string; results: Record<string, number> }) => {
      // Guard: only apply results if they belong to the currently active poll (BUG-17)
      if (activePollRef.current?.id === pollId) setPollResults(results);
    });
    socket.on('poll-ended', ({ pollId }: { pollId?: string }) => {
      // Guard: only clear the poll if the ended pollId matches the active one (BUG-18)
      if (pollId && activePollRef.current?.id !== pollId) return;
      activePollRef.current = null;
      setActivePoll(null);
      setPollResults({});
      setSelectedOption('');
      setShowPollPopup(false);
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    });

    return () => { cancelled = true; socket.disconnect(); hlsRef.current?.destroy(); hlsRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Scroll only within the chat list (block:'nearest' + guard) so an empty chat
  // doesn't scroll the whole page and clip the top of the video.
  useEffect(() => {
    if (messages.length) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Poll for recording availability after class ends (checking every 30s up to 15 min)
  useEffect(() => {
    if (phase !== 'ended' || !id || recordingUrl) return;
    let attempts = 0;
    const maxAttempts = 30;
    const check = async () => {
      try {
        const data = await schoolLive.getRecordingUrl(id);
        if (data?.url) { setRecordingUrl(data.url); return; }
      } catch { /* not ready yet */ }
      attempts++;
      if (attempts < maxAttempts) timer = setTimeout(check, 30_000);
    };
    let timer = setTimeout(check, 15_000);
    return () => clearTimeout(timer);
  }, [phase, id, recordingUrl]);

  const send = () => {
    const text = draft.trim();
    if (!text || cooldown > 0) return;
    socketRef.current?.emit('chat', { text: text.slice(0, 300) });
    setDraft('');
    setCooldown(3);
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

  const toggleHand = () => {
    if (!id) return;
    const next = !handRaised;
    setHandRaised(next);
    socketRef.current?.emit('raise-hand', { raised: next });
    schoolLive.setHandRaised(id, next).catch(() => setHandRaised(!next));
  };

  const submitVote = async (option: string) => {
    if (!id || !activePoll) return;
    try {
      setSelectedOption(option);
      localStorage.setItem('voted_poll_' + activePoll.id, option);
      const res = await schoolLive.votePoll(id, activePoll.id, option);
      if (res && res.results) {
        setPollResults(res.results);
      }
      setTimeout(() => {
        setShowPollPopup(false);
      }, 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit vote');
    }
  };

  return (
    <div className="bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/school/student/live-classes')}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Live Classes
        </button>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          {lectureTitle || 'Live Class'}
        </h1>
      </div>

      {/* Controls & Leave */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${phase === 'live' ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
            <Radio className="h-3.5 w-3.5" /> {phase === 'live' ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
            <Users className="h-3.5 w-3.5 text-blue-500" /> {viewerCount} watching
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">⏱ {duration}</span>
          {phase === 'live' && latency !== null && (
            <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold shadow-sm ${
              latency <= 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : latency <= 8 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              ~{latency}s delay
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/school/student/live-classes')}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
        >
          <LogOut className="h-4 w-4" /> Leave Class
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      {/* Video + interaction (70%) */}
      <div className="flex flex-1 flex-col gap-3 lg:w-[70%]">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-900 lg:aspect-auto lg:h-[72vh]">
          <FloatingReactionLayer items={reactions} />
          <video ref={videoRef} className="h-full w-full object-contain" controls playsInline />
          {phase === 'live' && buffering && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gray-900/70 text-center">
              <div className="text-white/80">
                <Wifi className="mx-auto mb-3 h-9 w-9 animate-pulse text-blue-400" />
                <p className="text-base font-bold">Connecting to live stream…</p>
                <p className="text-xs text-white/50">Buffering the teacher's feed — this can take a few seconds.</p>
              </div>
            </div>
          )}
          {phase !== 'live' && (
            <div className="absolute inset-0 grid place-items-center bg-gray-900 text-center">
              {phase === 'waiting' ? (
                <div className="text-white/80">
                  <Wifi className="mx-auto mb-3 h-10 w-10 animate-pulse text-blue-400" />
                  <p className="text-lg font-bold">Waiting for stream…</p>
                  <p className="text-sm text-white/50">The class will start automatically when the teacher goes live.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-white/80">
                  <p className="text-lg font-bold">Class ended</p>
                  {recordingUrl ? (
                    <a
                      href={recordingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-rose-700"
                    >
                      <PlayCircle className="h-4 w-4" /> Watch Recording
                    </a>
                  ) : (
                    <p className="flex items-center gap-2 text-sm text-white/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Recording will be ready shortly…
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {phase === 'live' && (
            <>
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white"><span className="h-2 w-2 rounded-full bg-white" /> LIVE · auto</span>
              <button onClick={fullscreen} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/40 text-white hover:bg-black/60"><Maximize className="h-4 w-4" /></button>
              {/* Jump to Live — shown when student has seeked >8s behind the live edge */}
              {latency !== null && latency > 8 && (
                <button
                  onClick={jumpToLive}
                  className="absolute bottom-4 right-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow-lg hover:bg-red-700 transition-colors animate-pulse"
                >
                  <Radio className="h-3 w-3" /> Jump to Live
                </button>
              )}
            </>
          )}
        </div>

        {/* Interaction bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={toggleHand}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${handRaised ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}
          >
            <Hand className="h-4 w-4" /> {handRaised ? 'Hand Raised ✋' : 'Raise Hand'}
          </button>
          <div className="ml-auto flex items-center gap-1">
            {LIVE_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => socketRef.current?.emit('reaction', { emoji })}
                className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Chat & Poll tabs */}
      <div className="flex h-[550px] flex-col gap-4 lg:h-[72vh] lg:w-[30%]">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gray-800 dark:border-slate-800">
          
          {/* Tabs header */}
          <div className="flex border-b border-white/10 px-3 py-2 text-sm font-bold text-white bg-gray-900/50 bg-slate-900/40">
            <button
              onClick={() => setRightPanel('chat')}
              className={`flex-1 py-1.5 rounded-lg text-center transition ${rightPanel === 'chat' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setRightPanel('polls')}
              className={`flex-1 py-1.5 rounded-lg text-center transition flex items-center justify-center gap-1.5 ${rightPanel === 'polls' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              Polls
              {activePoll && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>

          {rightPanel === 'chat' ? (
            /* Chat Panel */
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.length === 0 && <p className="py-10 text-center text-sm text-white/40">Be the first to say hi 👋</p>}
                {messages.map((m, i) => (
                  <div key={m.id} className={`flex gap-2 rounded-lg p-2 ${i % 2 ? 'bg-white/5' : ''}`}>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-500/30 text-xs font-bold text-blue-200">{m.userName.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-xs font-bold text-blue-200">{m.userName}</span>
                        <span className="shrink-0 text-[10px] text-white/40">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="break-words text-sm text-white/90">{m.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 p-2.5">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  maxLength={300}
                  placeholder={cooldown > 0 ? `Wait ${cooldown}s…` : 'Type a message…'}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-blue-400"
                />
                <button
                  onClick={send}
                  disabled={cooldown > 0 || !draft.trim()}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Polls Panel */
            <div className="flex-1 overflow-y-auto p-3 text-white">
              {/* Past Polls list */}
              {pastPolls.filter((p) => p.status === 'ENDED').length > 0 ? (
                <div className="space-y-4">
                  <h5 className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
                    Past Polls ({pastPolls.filter((p) => p.status === 'ENDED').length})
                  </h5>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {pastPolls.filter((p) => p.status === 'ENDED').map((p) => {
                      const results = p.results || {};
                      const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                      const studentVote = localStorage.getItem('voted_poll_' + p.id);
                      return (
                        <div key={p.id} className="rounded-xl border border-white/5 bg-white/5 p-3 mb-2 last:mb-0">
                          <h6 className="text-xs font-bold text-slate-200 mb-2">
                            {p.question}
                          </h6>
                          <div className="space-y-2">
                            {p.options.map((opt) => {
                              const count = results[opt] || 0;
                              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                              const isYourVote = studentVote === opt;
                              const isCorrect = p.correctOption === opt;
                              const hasCorrect = !!p.correctOption;

                              let barColor = 'bg-slate-500';
                              let labelSuffix = null;

                              if (hasCorrect) {
                                if (isCorrect) {
                                  barColor = 'bg-emerald-500';
                                  labelSuffix = <span className="inline-flex items-center gap-0.5 rounded bg-emerald-950/40 px-1.5 py-0.2 text-[8px] font-black text-emerald-400">✓ Correct</span>;
                                } else {
                                  barColor = 'bg-red-500';
                                  labelSuffix = (
                                    <span className="inline-flex items-center gap-0.5 rounded bg-red-950/40 px-1.5 py-0.2 text-[8px] font-black text-red-400">
                                      ✗ Incorrect {isYourVote && '(Your choice)'}
                                    </span>
                                  );
                                }
                              } else {
                                if (isYourVote) {
                                  barColor = 'bg-emerald-500';
                                  labelSuffix = <span className="inline-flex items-center gap-0.5 rounded bg-emerald-950/40 px-1.5 py-0.2 text-[8px] font-black text-emerald-400">Your choice</span>;
                                }
                              }

                              return (
                                <div key={opt} className="space-y-0.5">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span className="truncate pr-1.5 flex items-center gap-1">
                                      {opt} {labelSuffix}
                                    </span>
                                    <span className="shrink-0">{count} ({pct}%)</span>
                                  </div>
                                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
                                    <div
                                      className={`h-full ${barColor}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-white/40 text-center py-10">No polls have been completed yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Poll Popup Modal */}
      {activePoll && showPollPopup && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Poll
              </span>
              <button
                onClick={() => setShowPollPopup(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <h4 className="text-base font-black text-slate-900 dark:text-white mb-4">
              {activePoll.question}
            </h4>

            {selectedOption ? (
              <div className="space-y-3">
                {activePoll.options.map((opt) => {
                  const count = pollResults[opt] || 0;
                  const total = Object.values(pollResults).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isYourVote = selectedOption === opt;
                  const hasCorrectOption = !!activePoll.correctOption;
                  const isCorrect = activePoll.correctOption === opt;

                  let barColor = 'bg-slate-400 dark:bg-slate-600';
                  let labelSuffix = null;

                  if (hasCorrectOption) {
                    if (isCorrect) {
                      barColor = 'bg-emerald-500';
                      labelSuffix = (
                        <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ✓ Correct
                        </span>
                      );
                    } else if (isYourVote) {
                      barColor = 'bg-red-500';
                      labelSuffix = (
                        <span className="inline-flex items-center gap-0.5 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-black text-red-700 dark:bg-red-950/40 dark:text-red-300">
                          ✗ Incorrect
                        </span>
                      );
                    } else {
                      barColor = 'bg-slate-200 dark:bg-slate-800';
                    }
                  } else {
                    if (isYourVote) {
                      barColor = 'bg-emerald-500';
                      labelSuffix = (
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          (Your choice)
                        </span>
                      );
                    }
                  }

                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          {opt} {labelSuffix}
                        </span>
                        <span className="shrink-0">{count} {count === 1 ? 'vote' : 'votes'} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => submitVote(opt)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 py-3 px-4 text-left text-sm font-bold text-slate-700 dark:text-slate-200 transition"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
