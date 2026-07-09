import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import {
  Hand, Maximize, Send, Wifi, Radio, Users, LogOut, ArrowLeft, X,
  PlayCircle, Loader2, LayoutDashboard, BookOpen, Calendar, UserCheck,
  FileText, Download, Trash2, HelpCircle, MessageSquare, Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
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
  const { user } = useAuthStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  
  // Refs for stale-closure guards in socket event handlers
  const playbackUrlRef = useRef('');
  const activePollRef = useRef<{ id: string; question: string; options: string[]; correctOption?: string } | null>(null);

  const [phase, setPhase] = useState<Phase>('waiting');
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [buffering, setBuffering] = useState(false);
  const [qualities, setQualities] = useState<Array<{ label: string; url: string }>>([]);
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
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
  
  // Right Panel Tabs: chat | notepad | polls
  const [rightPanel, setRightPanel] = useState<'chat' | 'notepad' | 'polls'>('chat');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);

  // Digital Notepad State
  const [notes, setNotes] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [questionText, setQuestionText] = useState('');

  // ── Notepad Persistence ───────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      const savedNotes = localStorage.getItem(`student_notes_${id}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
    }
  }, [id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    if (id) {
      localStorage.setItem(`student_notes_${id}`, value);
    }
  };

  const downloadNotes = () => {
    if (!notes.trim()) {
      toast.warning("Notepad is empty");
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${lectureTitle || 'Class'}_Notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Notes downloaded successfully!");
  };

  const clearNotes = () => {
    if (window.confirm("Are you sure you want to clear your notes?")) {
      setNotes('');
      if (id) {
        localStorage.removeItem(`student_notes_${id}`);
      }
      toast.success("Notes cleared");
    }
  };

  // ── Ask Question Trigger ──────────────────────────────────────────────────
  const askQuestionSubmit = () => {
    const q = questionText.trim();
    if (!q) return;
    // Format question with a visual QA tag
    const formatted = `[Q&A Question] ❓ ${q}`;
    socketRef.current?.emit('chat', { text: formatted.slice(0, 300) });
    setQuestionText('');
    setShowAskModal(false);
    toast.success("Question submitted to live chat!");
  };

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
  const attach = useCallback((url: string, retryCount = 0) => {
    const video = videoRef.current;
    if (!video || !url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    setBuffering(true);
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 3,
        liveDurationInfinity: true,
        backBufferLength: 1,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 2000,
        manifestLoadingMaxRetryTimeout: 30000,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // seekable.end() is reliable at manifest parse; liveSyncPosition isn't yet
        if (video.seekable.length) {
          video.currentTime = video.seekable.end(video.seekable.length - 1);
        }
        video.play().catch(() => undefined);
        setBuffering(false);
      });
      hls.on(Hls.Events.FRAG_CHANGED, () => {
        // Correct drift every segment — liveSyncPosition is stable here
        const live = (hls as any).liveSyncPosition;
        if (typeof live === 'number' && isFinite(live) && live - video.currentTime > 3) {
          video.currentTime = live;
        }
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (retryCount >= 6) { setBuffering(false); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
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
  }, []);

  // ── initial status + socket ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    schoolLive.getStreamUrl(id).then((r) => {
      if (cancelled) return;
      const proxyUrl = r.streamKey ? hlsProxyUrl(r.streamKey) : r.url;
      // Build quality list: Auto always uses the proxy for reliability;
      // 480p/360p use direct CDN URLs (CORS configured on streaming server).
      const quals: Array<{ label: string; url: string }> = r.qualities
        ? r.qualities.map((q) => q.label === 'Auto' ? { ...q, url: proxyUrl } : q)
        : [{ label: 'Auto', url: proxyUrl }];
      setQualities(quals);
      setSelectedQuality('Auto');
      setPlaybackUrl(proxyUrl);
      playbackUrlRef.current = proxyUrl;
      setLectureTitle(r.title || '');
      if (r.startedAt) setStartedAt(new Date(r.startedAt).getTime());
      if (r.status === 'LIVE') { setPhase('live'); setTimeout(() => attach(proxyUrl), 0); }
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
      const url = playbackUrlRef.current;
      if (url) setTimeout(() => attach(url, 0), 300);
    });
    socket.on('stream-ended', () => {
      setPhase('ended');
      hlsRef.current?.destroy();
      hlsRef.current = null;
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
      if (activePollRef.current?.id === pollId) setPollResults(results);
    });
    socket.on('poll-ended', ({ pollId }: { pollId?: string }) => {
      if (pollId && activePollRef.current?.id !== pollId) return;
      activePollRef.current = null;
      setActivePoll(null);
      setPollResults({});
      setSelectedOption('');
      setShowPollPopup(false);
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    });

    return () => { cancelled = true; socket.disconnect(); hlsRef.current?.destroy(); hlsRef.current = null; };
  }, [id]);

  useEffect(() => {
    if (messages.length) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Poll for recording availability after class ends
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

  const selectQuality = (qual: { label: string; url: string }) => {
    setSelectedQuality(qual.label);
    playbackUrlRef.current = qual.url;
    setShowQualityMenu(false);
    if (phase === 'live') attach(qual.url);
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

  const handleNavClick = (path: string) => {
    if (phase === 'live') {
      if (window.confirm("Leaving this page will disconnect you from the live class. Continue?")) {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-slate-800 overflow-hidden font-sans">
        
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 border-b border-slate-200 bg-white px-6 items-center justify-between shrink-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => handleNavClick('/school/student/live-classes')}
              className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[15px] font-black text-slate-900 truncate">{lectureTitle || 'Live Class'}</h2>
              <p className="text-[13px] text-slate-400 font-bold tracking-tight block">
                Instructor Feed · School Live Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 transition-all font-bold text-[13px] active:scale-95 ${
                isRightPanelOpen
                  ? 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100/80 shadow-sm shadow-blue-500/5'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={isRightPanelOpen ? 'Hide Right Panel' : 'Show Right Panel'}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{isRightPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
            </button>

            {phase === 'live' ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/10 text-[13px] font-black uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-600 text-[13px] font-black uppercase tracking-wider">
                OFFLINE
              </span>
            )}
            
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[13px] font-mono font-bold text-slate-700">{viewerCount}</span>
            </div>

            <button
              onClick={() => handleNavClick('/school/student/live-classes')}
              className="rounded-xl border border-rose-200 hover:border-rose-300 bg-rose-50 hover:bg-rose-100/55 px-5 py-2.5 text-[13px] font-black text-rose-600 transition flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" /> Leave
            </button>
          </div>
        </header>

        {/* Mobile Top Header Bar */}
        <header className="flex md:hidden h-16 border-b border-slate-200 bg-white px-4 items-center justify-between shrink-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <button
              onClick={() => handleNavClick('/school/student/live-classes')}
              className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-black text-slate-900 truncate">{lectureTitle || 'Live Class'}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Single Status Badge */}
            {phase === 'live' ? (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-650 text-[11px] font-black uppercase tracking-wider">
                OFFLINE
              </span>
            )}

            {/* Show Panel Button */}
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`h-9 px-3 rounded-xl border flex items-center gap-1.5 transition-all font-bold text-[13px] active:scale-95 whitespace-nowrap ${
                isRightPanelOpen
                  ? 'bg-blue-50 border-blue-100 text-blue-600'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Panel</span>
            </button>

            {/* Leave button - icon-only on mobile */}
            <button
              onClick={() => handleNavClick('/school/student/live-classes')}
              className="h-9 w-9 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition shrink-0"
              title="Leave Class"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Main Stage Grid layout */}
        <div className="flex-1 flex min-h-0">
          
          {/* Main Stage Video Player Panel */}
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto min-w-0">
            
            {/* Live Video player container with shadows */}
            <div className="flex-1 min-h-[350px] relative rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
              <FloatingReactionLayer items={reactions} />
              
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                controls
                playsInline
              />

              {phase === 'live' && buffering && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-slate-950/70 text-center">
                  <div className="text-white/80">
                    <Wifi className="mx-auto mb-3 h-9 w-9 animate-pulse text-blue-400" />
                    <p className="text-[13px] font-bold">Connecting to live feed…</p>
                    <p className="text-[13px] text-white/40">Buffering the teacher's stream — please wait.</p>
                  </div>
                </div>
              )}

              {phase !== 'live' && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950 text-center">
                  {phase === 'waiting' ? (
                    <div className="text-white/85">
                      <Wifi className="mx-auto mb-3 h-10 w-10 animate-pulse text-blue-400" />
                      <p className="text-[13px] font-bold">Waiting for stream…</p>
                      <p className="text-[13px] text-white/40">The class will start automatically when the teacher goes live.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 text-white/80">
                      <p className="text-[13px] font-bold">Class has ended</p>
                      {recordingUrl ? (
                        <a
                          href={recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-black text-white shadow-lg hover:bg-blue-700 transition"
                        >
                          <PlayCircle className="h-4 w-4" /> Watch Recording
                        </a>
                      ) : (
                        <p className="flex items-center gap-2 text-[13px] text-white/40">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Recording is generating…
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {phase === 'live' && (
                <>
                  <button onClick={fullscreen} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition">
                    <Maximize className="h-4 w-4" />
                  </button>

                  {/* Quality selector */}
                  {qualities.length > 1 && (
                    <div className="absolute right-4 top-14" onBlur={() => setTimeout(() => setShowQualityMenu(false), 120)}>
                      <button
                        onClick={() => setShowQualityMenu((v) => !v)}
                        className="h-8 px-2.5 rounded-lg bg-black/40 text-white text-[10px] font-black hover:bg-black/60 backdrop-blur-xs transition flex items-center gap-1"
                      >
                        <Settings2 className="h-3 w-3" />
                        {selectedQuality}
                      </button>
                      {showQualityMenu && (
                        <div className="absolute right-0 top-9 bg-slate-900/95 border border-slate-700 rounded-xl overflow-hidden shadow-2xl min-w-[90px] z-50">
                          {qualities.map((q) => (
                            <button
                              key={q.label}
                              onMouseDown={() => selectQuality(q)}
                              className={`w-full px-3.5 py-2 text-left text-xs font-bold transition-colors ${
                                selectedQuality === q.label
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-200 hover:bg-slate-700'
                              }`}
                            >
                              {q.label === 'Auto' ? 'Auto (HD)' : q.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {latency !== null && latency > 8 && (
                    <button
                      onClick={jumpToLive}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-[13px] font-black text-white shadow-lg hover:bg-blue-700 transition animate-pulse"
                    >
                      <Radio className="h-3 w-3" /> Jump to Live
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Desktop Interactive Control Toggles Bar under Video */}
            <div className="hidden md:flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/60 rounded-2xl p-3 shadow-md shadow-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleHand}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-black transition-all ${
                    handRaised
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                >
                  <Hand className="h-4 w-4" />
                  {handRaised ? 'Hand Raised ✋' : 'Raise Hand'}
                </button>

                <button
                  onClick={() => setShowAskModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-[13px] font-black text-white transition shadow-md shadow-blue-600/10"
                >
                  <HelpCircle className="h-4 w-4" />
                  Ask Question
                </button>
              </div>

              {/* Floating Emojis */}
              <div className="flex items-center gap-1">
                {LIVE_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => socketRef.current?.emit('reaction', { emoji })}
                    className="grid h-10 w-10 place-items-center rounded-xl text-xl transition hover:scale-125 hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Interactive Control Toggles Bar */}
            <div className="flex md:hidden items-center justify-between gap-2 bg-white border border-slate-200/60 rounded-2xl p-2.5 shadow-md shadow-slate-100">
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={toggleHand}
                  className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${
                    handRaised
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                  }`}
                  title={handRaised ? 'Hand Raised ✋' : 'Raise Hand'}
                >
                  <Hand className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setShowAskModal(true)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition shadow-md shadow-blue-600/10"
                  title="Ask Question"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Emojis scrollable row */}
              <div className="flex items-center gap-1 overflow-x-auto min-w-0">
                {LIVE_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => socketRef.current?.emit('reaction', { emoji })}
                    className="grid h-9 w-9 place-items-center rounded-lg text-lg transition active:scale-125 hover:bg-slate-100"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Backdrop overlay for mobile drawer */}
          {isRightPanelOpen && (
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-45 lg:hidden"
              onClick={() => setIsRightPanelOpen(false)}
            />
          )}

          {/* Right tabbed column: Chat & Digital Notepad */}
          {isRightPanelOpen && (
            <div className="fixed lg:relative right-0 top-0 lg:top-0 bottom-0 z-50 w-full sm:w-[380px] lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 h-full lg:h-full overflow-hidden shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-250">
            
            {/* Tab Headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 shrink-0">
              <button
                onClick={() => setRightPanel('chat')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-[13px] font-black transition-all ${
                  rightPanel === 'chat'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setRightPanel('notepad')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-[13px] font-black transition-all ${
                  rightPanel === 'notepad'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Notepad
              </button>
              <button
                onClick={() => setRightPanel('polls')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-[13px] font-black transition-all relative ${
                  rightPanel === 'polls'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Polls
                {activePoll && (
                  <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="lg:hidden h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95 shrink-0"
                title="Close Panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* Chat View */}
              {rightPanel === 'chat' && (
                <div className="flex flex-1 flex-col overflow-hidden min-h-0 bg-slate-50/50">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <p className="py-12 text-center text-[13px] text-slate-400 font-bold">Be the first to say hi 👋</p>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.userId === user?.id;
                        // Basic validation check for QA questions
                        const isQA = m.text.startsWith('[Q&A');
                        
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}
                          >
                            <div className="flex items-center gap-1.5 px-1.5">
                              <span className="text-[13px] font-bold text-slate-500">{m.userName}</span>
                              <span className="text-[13px] text-slate-400">
                                {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] shadow-sm border ${
                              isMe
                                ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none'
                                : isQA
                                  ? 'bg-amber-50 text-amber-900 border-amber-200 rounded-tl-none font-bold'
                                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                            }`}>
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-3 border-t border-slate-100 bg-white">
                    <div className="flex gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        maxLength={300}
                        placeholder={cooldown > 0 ? `Wait ${cooldown}s…` : 'Type a message…'}
                        className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                      <button
                        onClick={send}
                        disabled={cooldown > 0 || !draft.trim()}
                        className="h-10 w-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 active:scale-95 shadow-md"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notepad / Learning Tools */}
              {rightPanel === 'notepad' && (
                <div className="p-4 flex-1 flex flex-col min-h-0 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      Digital Notepad
                    </h4>
                    <span className="text-[13px] font-semibold text-slate-400">Auto-saved</span>
                  </div>

                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="Take notes of the lecture here... Write down formulas, questions, or key takeaways."
                    className="flex-1 w-full rounded-2xl border border-slate-200 bg-white p-4 text-[13px] text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none mb-3"
                  />

                  <div className="flex gap-2 bg-white p-2 border border-slate-200/60 rounded-xl">
                    <button
                      onClick={downloadNotes}
                      className="flex-1 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-[13px] font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                    <button
                      onClick={clearNotes}
                      className="py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[13px] font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Polls Tab */}
              {rightPanel === 'polls' && (
                <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50/50">
                  {pastPolls.filter((p) => p.status === 'ENDED').length > 0 ? (
                    <div className="space-y-4">
                      <h5 className="text-[13px] font-black uppercase tracking-wider text-slate-400">
                        Past Polls ({pastPolls.filter((p) => p.status === 'ENDED').length})
                      </h5>
                      <div className="space-y-3">
                        {pastPolls.filter((p) => p.status === 'ENDED').map((p) => {
                          const results = p.results || {};
                          const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                          const studentVote = localStorage.getItem('voted_poll_' + p.id);
                          return (
                            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
                              <h6 className="text-[13px] font-bold text-slate-800 mb-2.5">
                                {p.question}
                              </h6>
                              <div className="space-y-2">
                                {p.options.map((opt) => {
                                  const count = results[opt] || 0;
                                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                  const isYourVote = studentVote === opt;
                                  const isCorrect = p.correctOption === opt;
                                  const hasCorrect = !!p.correctOption;

                                  let barColor = 'bg-slate-400';
                                  let labelSuffix = null;

                                  if (hasCorrect) {
                                    if (isCorrect) {
                                      barColor = 'bg-emerald-500';
                                      labelSuffix = <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[12px] font-black text-emerald-600">✓ Correct</span>;
                                    } else {
                                      barColor = 'bg-rose-500';
                                      labelSuffix = (
                                        <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.2 text-[12px] font-black text-rose-600">
                                          ✗ Incorrect {isYourVote && '(You)'}
                                        </span>
                                      );
                                    }
                                  } else {
                                    if (isYourVote) {
                                      barColor = 'bg-emerald-500';
                                      labelSuffix = <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[12px] font-black text-emerald-600">Selected</span>;
                                    }
                                  }

                                  return (
                                    <div key={opt} className="space-y-1">
                                      <div className="flex justify-between text-[13px] font-bold text-slate-500">
                                        <span className="truncate pr-1.5 flex items-center gap-1">
                                          {opt} {labelSuffix}
                                        </span>
                                        <span className="shrink-0">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
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
                    <div className="py-12 text-center text-slate-400">
                      <HelpCircle className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-[13px] font-bold">No polls completed yet.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
          )}
        </div>

      {/* Ask Question Popup Modal */}
      {showAskModal && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Ask the Teacher</h3>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-[13px] font-semibold text-slate-400">Your question will be posted directly to the live stream chat for the teacher to view.</p>
            
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Could you explain the difference between scalar and vector quantities again?"
              rows={3}
              className="w-full rounded-2xl border border-slate-200 p-4 text-[13px] text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAskModal(false)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[13px] font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={askQuestionSubmit}
                disabled={!questionText.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-[13px] font-black text-white shadow-md shadow-blue-600/10 disabled:opacity-50 active:scale-95 transition"
              >
                Send Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Poll Popup Modal */}
      {activePoll && showPollPopup && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-black uppercase tracking-wider text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> Live Poll
              </span>
              <button
                onClick={() => setShowPollPopup(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <h4 className="text-[15px] font-bold text-slate-800 mb-4">
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

                  let barColor = 'bg-slate-400';
                  let labelSuffix = null;

                  if (hasCorrectOption) {
                    if (isCorrect) {
                      barColor = 'bg-emerald-500';
                      labelSuffix = (
                        <span className="inline-flex items-center rounded bg-emerald-50 px-1.5 py-0.2 text-[12px] font-black text-emerald-700">
                          ✓ Correct
                        </span>
                      );
                    } else if (isYourVote) {
                      barColor = 'bg-rose-500';
                      labelSuffix = (
                        <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.2 text-[12px] font-black text-rose-700">
                          ✗ Incorrect
                        </span>
                      );
                    } else {
                      barColor = 'bg-slate-200';
                    }
                  } else {
                    if (isYourVote) {
                      barColor = 'bg-emerald-500';
                      labelSuffix = (
                        <span className="text-[13px] font-black text-emerald-600">
                          (Your choice)
                        </span>
                      );
                    }
                  }

                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex justify-between text-[13px] font-bold text-slate-700">
                        <span className="truncate pr-2 flex items-center gap-1.5">
                          {opt} {labelSuffix}
                        </span>
                        <span className="shrink-0">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
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
              <div className="space-y-2">
                {activePoll.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => submitVote(opt)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 py-3 px-4 text-left text-[13px] font-bold text-slate-700 transition active:scale-95"
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
  );
}
