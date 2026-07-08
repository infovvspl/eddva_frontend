import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
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
  Minimize,
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
  Lock,
  Smile,
  Crown,
  Monitor,
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

// Questions are tagged inline in the message text (the only field that reliably
// survives the chat server round-trip). Detected + stripped at render.
const QUESTION_PREFIX = '[❓] ';
function parseChatText(text: string): { isQuestion: boolean; text: string } {
  if (text?.startsWith(QUESTION_PREFIX)) {
    return { isQuestion: true, text: text.slice(QUESTION_PREFIX.length) };
  }
  return { isQuestion: false, text: text ?? '' };
}

// Chat-mute is relayed as a hidden control message over the `chat` channel
// (which the server reliably re-broadcasts), since a dedicated `chat-muted`
// event is not relayed. These markers are intercepted and never rendered.
const CHATMUTE_ON = '[[CHATMUTE:1]]';
const CHATMUTE_OFF = '[[CHATMUTE:0]]';
function parseMuteControl(text: string): boolean | null {
  if (text === CHATMUTE_ON) return true;
  if (text === CHATMUTE_OFF) return false;
  return null;
}

/** Persist the student's poll vote so it survives page refresh. */
const POLL_VOTE_KEY = (pollId: string) => `broadcast_vote_${pollId}`;

const DEFAULT_HOST_NAME = 'Krishna Das';

export default function StudentLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [viewerCount, setViewerCount] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [volumeMuted, setVolumeMuted] = useState(false);
  const [students, setStudents] = useState<any[]>([]);


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
  const [chatMuted, setChatMuted] = useState(false);

  const [latency, setLatency] = useState<number | null>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showPollPopup, setShowPollPopup] = useState(false);
  const [pastPolls, setPastPolls] = useState<ActivePoll[]>([]);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isPageFullscreen, setIsPageFullscreen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const participantsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (participantsDropdownRef.current && !participantsDropdownRef.current.contains(event.target as Node)) {
        setParticipantsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsPageFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePageFullscreen = () => {
    if (!document.fullscreenElement) {
      pageContainerRef.current?.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);


  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const hostIdRef = useRef<string | null>(null);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const streamStartDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { items: floatItems, push: pushReaction } = useFloatingReactions();

  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);


  useEffect(() => {
    if (user && students.length === 0) {
      setStudents([{
        userId: user.id,
        userName: user.name,
        handRaised: handRaised
      }]);
    }
  }, [user]);

  const getInitials = (name?: string) => {
    if (!name) return 'ME';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const joinedStudents = useMemo(() => {
    if (students.length === 0 && user) {
      return [
        {
          userId: user.id,
          name: `${user.name} (You)`,
          initials: getInitials(user.name),
          active: true,
          handRaised: handRaised
        }
      ];
    }
    return students.map(s => {
      const isMe = s.userId === user?.id;
      return {
        userId: s.userId,
        name: isMe ? `${s.userName || user?.name || 'You'} (You)` : (s.userName || 'Student'),
        initials: getInitials(s.userName || (isMe ? user?.name : 'ST')),
        active: isMe,
        handRaised: isMe ? handRaised : !!s.handRaised
      };
    });
  }, [students, user, handRaised]);

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
      // Host/teacher id — used to verify mute-control messages really come from the host.
      const hostId = (info as any)?.teacherId ?? (info as any)?.hostId ?? null;
      if (hostId) hostIdRef.current = hostId;
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
    }).catch(() => undefined).then(() => {
      // Load chat history only after the host id has resolved above, so the
      // late-join mute derivation can verify markers actually came from the host.
      if (cancelled) return;
      return liveBroadcast.getChatHistory(id).then((h) => {
        if (cancelled) return;
        // Late-join: derive mute from the last HOST-authored control marker (ignore
        // any student who typed the marker); strip all markers so none render.
        let muted = false;
        for (const m of h) {
          const v = parseMuteControl(m.text);
          if (v !== null && (!hostIdRef.current || m.userId === hostIdRef.current)) muted = v;
        }
        setChatMuted(muted);
        setMessages(h.filter((m) => parseMuteControl(m.text) === null));
      }).catch(() => undefined);
    });

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

    socket.on('joined', ({ viewerCount: vc, students: s }) => {
      setViewerCount(vc ?? 0);
      // Seed the roster from the join ack so a student entering a room that
      // already has participants sees their cards — the `participants` event
      // only fires on subsequent join/leave changes. Mirrors the teacher's
      // `teacher-joined` handler.
      if (Array.isArray(s) && s.length) setStudents(s);
    });
    socket.on('participants', ({ students: s }) => {
      if (Array.isArray(s)) setStudents(s);
    });


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
      // Hidden mute-control message — only honor it from the host, never from a
      // student who typed the marker literally. Swallow all markers from render.
      const mute = parseMuteControl(msg.text);
      if (mute !== null) {
        const fromHost = !hostIdRef.current || msg.userId === hostIdRef.current;
        if (fromHost) {
          console.log('[chat-muted][student] control from host, muted =', mute, '| hostId known =', !!hostIdRef.current);
          setChatMuted(mute);
        } else {
          console.log('[chat-muted][student] IGNORED non-host mute control from', msg.userId);
        }
        return;
      }
      setMessages((prev) => [...prev.slice(-200), msg]);
    });

    // Host muted/unmuted class chat (broadcast to the whole room).
    socket.on('chat-muted', ({ muted }: { muted?: boolean }) => {
      // TEMP diagnostic (remove after debugging) — proves the event reached this browser.
      console.log('[chat-muted][student] event RECEIVED, muted =', muted);
      setChatMuted(!!muted);
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
  const sendChat = (asQuestion = false) => {
    const text = draft.trim();
    if (!text || !socketRef.current || cooldown || chatMuted) return;
    const outgoing = (asQuestion ? QUESTION_PREFIX + text : text).slice(0, 300);
    socketRef.current.emit('chat', { text: outgoing });
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
    <div ref={pageContainerRef} className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans h-screen overflow-hidden select-none">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between px-6 py-3  bg-[#0f172a] border-b-2 border-slate-800 flex-shrink-0 z-10 shadow-md">
        {/* Left Side: Encryption indicator and Page Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 rounded-xl">
            <Lock size={12} className="text-emerald-500" />
            <span className="hidden sm:inline">End-to-end encrypted</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold text-slate-200 truncate max-w-[200px] sm:max-w-none">
              EDDVA • {lectureTitle} — Coaching Live Class
            </span>
            {phase === 'live' && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] font-black text-red-500 uppercase tracking-widest shrink-0 animate-pulse">
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Right Side: View modes & Hand controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative" ref={participantsDropdownRef}>
            <button
              onClick={() => setParticipantsOpen(!participantsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/[0.18] border border-white/[0.08] text-xs sm:text-sm font-bold text-white/90 transition-all select-none"
              title="View participants"
            >
              <Users size={14} />
              <span>{viewerCount}</span>
            </button>

            {participantsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 backdrop-blur-md z-[100] animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Participants ({viewerCount + 1})</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {/* Host Row */}
                  <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/10">
                        {getInitials(DEFAULT_HOST_NAME)}
                      </div>
                      <span className="text-xs font-bold text-slate-200 truncate">{DEFAULT_HOST_NAME}</span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 text-[9px] font-black text-amber-500 uppercase tracking-wide">
                      <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
                    </span>
                  </div>

                  {/* Students List */}
                  {joinedStudents.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">No students joined yet</p>
                  ) : (
                    joinedStudents.map((student) => (
                      <div key={student.userId} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-800/25 transition-all">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-slate-700">
                            {student.initials}
                          </div>
                          <span className="text-xs font-medium text-slate-300 truncate">{student.name}</span>
                        </div>
                        {student.handRaised && (
                          <span className="inline-flex items-center rounded bg-amber-500 px-1 py-0.5 text-[8px] font-black text-black">
                            <Hand size={8} fill="black" />
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={togglePageFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs sm:text-sm font-bold text-white/90 transition-all"
            title="Fullscreen class view"
          >
            {isPageFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          {phase === 'live' && (
            handRaised ? (
              <button
                onClick={toggleHand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e69f00] hover:bg-[#cca300] text-black text-xs sm:text-sm font-black transition-all shadow-lg shadow-amber-500/10"
              >
                <Hand size={14} fill="black" />
                <span>Lower Hand</span>
              </button>
            ) : (
              <button
                onClick={toggleHand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs sm:text-sm font-bold text-slate-300 transition-all"
              >
                <Hand size={14} />
                <span>Raise Hand</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4 min-h-0">
        {/* Left Area (Video Feed & Bottom Participant Avatars) */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Video / Slide Stage */}
          <div className="flex-1 relative min-h-0 rounded-3xl bg-[#1e293b] border-2 border-slate-700 overflow-hidden group shadow-[0_0_35px_rgba(59,130,246,0.1)] flex items-center justify-center">
            {/* Reaction float layer */}
            <FloatingReactionLayer items={floatItems} />

            {/* Centered screen share notification badge */}
            {phase === 'live' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-950/20">
                <Monitor size={14} />
                <span>{DEFAULT_HOST_NAME} is sharing screen</span>
              </div>
            )}

            {/* Hand Raised badge on the right */}
            {handRaised && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-lg animate-in slide-in-from-right-3">
                <Hand size={14} fill="black" />
                <span>Your hand is raised</span>
              </div>
            )}

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

<<<<<<< HEAD
            {/* Fullscreen and Volume controls inside video (top-left, clear of hand badge, host tag, and avatar card) */}
            {phase === 'live' && !buffering && (
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
=======
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
>>>>>>> b3dd18eb54bb6d2410bd4c110c74afa95fd5b005
            )}

            {/* Bottom Row elements inside the stage */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
              {/* Bottom-left Host Name Tag */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 pointer-events-auto shadow-lg">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs sm:text-sm font-semibold text-white">{DEFAULT_HOST_NAME} (Host)</span>
              </div>

              {/* Bottom-right Teacher Video/Avatar card */}
              <div className="w-36 h-24 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center border border-white/25 shadow-2xl relative pointer-events-auto shrink-0">
                <span className="text-xl font-black text-white">{getInitials(DEFAULT_HOST_NAME)}</span>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md">
                  <span className="text-[10px] font-semibold text-white">{DEFAULT_HOST_NAME} (Host)</span>
                </div>
              </div>
            </div>

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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 z-20 animate-in fade-in duration-500 bg-[#1e293b]">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 z-20 animate-in fade-in duration-500 bg-[#1e293b]">
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

          {/* Bottom Participant Avatars Row */}
          <div className="flex gap-3 h-20 shrink-0 overflow-x-auto py-1 items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {joinedStudents.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col items-center justify-center rounded-xl bg-[#334155] border ${p.active ? 'border-2 border-blue-500 shadow-md shadow-blue-500/15' : 'border-[1.5px] border-slate-600/60'
                  } px-2 py-1.5 transition-all w-20 sm:w-24 shrink-0 h-[68px]`}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
                  {p.initials}
                </div>
                <span className="text-[10px] font-bold text-slate-300 mt-1 truncate w-full text-center">
                  {p.name}
                </span>
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                {p.handRaised && (
                  <div className="absolute -top-1 -right-1 bg-[#e69f00] text-black rounded-full p-0.5 border border-slate-800" title="Hand Raised">
                    <Hand size={8} fill="black" />
                  </div>
                )}
              </div>
            ))}</div>
        </div>

        {/* Right Area (Sidebar - Chat / Polls only) */}
        {sidePanel && (
          <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col rounded-3xl border-2 border-slate-700 bg-[#1e293b] shadow-2xl overflow-hidden animate-in slide-in-from-right-3 duration-250">
            {/* Tabs header */}
            <div className="flex p-1.5 bg-[#161920] mx-3 mt-3 rounded-2xl border border-white/5 flex-shrink-0">
              {([
                { key: 'chat' as const, label: 'Chat', Icon: MessageSquare },
                { key: 'polls' as const, label: 'Polls', Icon: BarChart2 },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setSidePanel(key)}
                  className={`flex-1 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 rounded-xl relative ${sidePanel === key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
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
                <div className="flex flex-col h-full animate-in fade-in duration-200">
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
                    {messages.map((m) => {
                      const { isQuestion, text: body } = parseChatText(m.text);
                      return (
                      <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                          {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="truncate text-xs sm:text-sm font-bold text-slate-200">{m.userName || 'User'}</span>
                            {isQuestion && <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30">❓ Question</span>}
                            <span className="shrink-0 text-[10px] sm:text-xs font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                          </div>
                          <div className={`inline-block rounded-2xl rounded-tl-none px-3.5 py-2 max-w-[90%] shadow-sm ${isQuestion ? 'bg-amber-500/10 border-l-2 border border-amber-500/40' : 'bg-[#334155]/55 border border-slate-600/30'}`}>
                            <p className="break-words text-xs sm:text-sm text-slate-200 leading-relaxed">{body}</p>
                          </div>
                        </div>
                      </div>
                      );
                    })}

                    {/* Active Poll inside chat view to match mockup */}
                    {activePoll && (
                      <div className="bg-gradient-to-br from-blue-950/40 to-indigo-950/40 border border-blue-500/20 rounded-2xl p-4 shadow-lg mt-4 animate-in slide-in-from-bottom-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">ACTIVE POLL</span>
                        </div>
                        <p className="text-xs font-bold text-white mb-3">{activePoll.question}</p>
                        <div className="space-y-2">
                          {activePoll.options.map((opt) => {
                            const votes = activePoll.results?.[opt] ?? 0;
                            const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                            const pct = total ? Math.round((votes / total) * 100) : 0;
                            const isSelected = selectedOption === opt;
                            const hasCorrect = !!activePoll.correctOption;
                            const isCorrect = activePoll.correctOption === opt;
                            // Reveal right/wrong only after the student has voted; skip
                            // entirely for polls with no correct answer set.
                            let barColor = 'bg-blue-500';
                            let badge: React.ReactNode = null;
                            if (selectedOption && hasCorrect) {
                              if (isCorrect) {
                                barColor = 'bg-emerald-500';
                                badge = <span className="ml-1.5 rounded px-1 py-0.5 text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>;
                              } else if (isSelected) {
                                barColor = 'bg-rose-500';
                                badge = <span className="ml-1.5 rounded px-1 py-0.5 text-[8px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20">✗ Incorrect</span>;
                              }
                            }
                            return (
                              <button
                                key={opt}
                                onClick={() => { votePoll(opt); }}
                                className={`w-full text-left relative overflow-hidden rounded-xl border text-[11px] transition-all duration-200 ${isSelected
                                  ? 'bg-blue-600/20 border-blue-500/50'
                                  : 'bg-black/20 border-white/20'
                                  }`}
                              >
                                {selectedOption && (
                                  <div
                                    className={`absolute inset-y-0 left-0 opacity-20 ${barColor}`}
                                    style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                  />
                                )}
                                <div className="relative z-10 px-3 py-2 flex justify-between items-center">
                                  <span className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>{opt}{badge}</span>
                                  {selectedOption && <span className="text-[10px] font-bold text-slate-400">{pct}%</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input box */}
                  <div className="p-3 bg-[#0a0b0d] border-t border-white/[0.06] flex-shrink-0">
                    {chatMuted && (
                      <div className="mb-2 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] font-bold text-rose-400">
                        <VolumeX size={13} /> Chat is muted by host
                      </div>
                    )}
                    <div className="flex gap-2 p-1.5 bg-[#161920] border border-white/20 rounded-2xl focus-within:ring-1 focus-within:ring-blue-500/50 focus-within:border-blue-500/50 transition-all duration-200">
                      <input
                        ref={chatInputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                        maxLength={300}
                        disabled={cooldown || chatMuted}
                        placeholder={chatMuted ? 'Chat is muted by host' : cooldown ? `Cooldown (${cooldownSec}s)` : 'Type a message…'}
                        className="flex-1 min-w-0 bg-transparent px-3 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none disabled:opacity-50 h-10"
                      />
                      <button
                        onClick={() => (draft.trim() ? sendChat(true) : chatInputRef.current?.focus())}
                        disabled={cooldown || chatMuted}
                        title="Ask a question"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-all duration-200 disabled:opacity-30"
                      >
                        <span className="text-sm leading-none">❓</span>
                      </button>
                      <button
                        onClick={() => sendChat()}
                        disabled={cooldown || chatMuted || !draft.trim()}
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-200 disabled:opacity-30 shadow-md"
                      >
                        <Send size={15} className="-ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Polls tab */}
              {sidePanel === 'polls' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5 animate-in fade-in duration-200">
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
                          const hasCorrect = !!activePoll.correctOption;
                          const isCorrect = activePoll.correctOption === opt;
                          // Reveal right/wrong only after the student has voted; skip
                          // entirely for polls with no correct answer set.
                          let barColor = 'bg-blue-500';
                          let badge: React.ReactNode = null;
                          if (selectedOption && hasCorrect) {
                            if (isCorrect) {
                              barColor = 'bg-emerald-500';
                              badge = <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>;
                            } else if (isSelected) {
                              barColor = 'bg-rose-500';
                              badge = <span className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20">✗ Incorrect</span>;
                            }
                          }
                          return (
                            <button
                              key={opt}
                              onClick={() => { votePoll(opt); setShowPollPopup(false); }}
                              className={`w-full text-left relative overflow-hidden rounded-xl border text-xs transition-all duration-200 ${isSelected
                                ? 'bg-blue-600/20 border-blue-500/50'
                                : 'bg-black/20 border-white/30 hover:border-white/5'
                                }`}
                            >
                              {selectedOption && (
                                <div
                                  className={`absolute inset-y-0 left-0 opacity-20 ${barColor}`}
                                  style={{ width: `${pct}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                />
                              )}
                              <div className="relative z-10 px-4 py-3 flex justify-between items-center">
                                <span className={`font-semibold ${isSelected ? 'text-blue-300' : 'text-slate-200'}`}>{opt}{badge}</span>
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
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="shrink-0 h-16 border-t-2 border-slate-800 bg-[#0f172a] px-6 flex items-center justify-between z-20">
        {/* Left Area (Optional spacing or metadata) */}
        <div className="w-1/4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-300">{viewerCount}</span>
          </div>
        </div>

        {/* Center: Controller Buttons */}
        <div className="flex items-center gap-3">
          {/* CC Toggle */}
          <button
            onClick={() => setCcEnabled(!ccEnabled)}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all duration-200 ${ccEnabled ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
            title="Closed Captions"
          >
            <Subtitles size={16} />
            <span>CC</span>
          </button>

          {/* Reactions trigger */}
          <div className="relative">
            <button
              onClick={() => setReactionPickerOpen(!reactionPickerOpen)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all bg-white/[0.06] hover:bg-white/[0.12] text-slate-300`}
              title="React"
            >
              <Smile size={18} />
            </button>
            {reactionPickerOpen && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl bg-[#0f1115] border border-white/10 shadow-2xl flex items-center gap-1.5 z-50">
                {BROADCAST_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setReactionPickerOpen(false);
                    }}
                    className="h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-base transition-all hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Sidebar Chat & Polls Toggle Toggles */}
          <button
            onClick={() => setSidePanel(sidePanel === 'chat' ? null : 'chat')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <MessageSquare size={16} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setSidePanel(sidePanel === 'polls' ? null : 'polls')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'polls' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <BarChart2 size={16} />
            <span>Polls</span>
          </button>
        </div>

        {/* Right Area (Leave & Clock) */}
        <div className="w-1/4 flex items-center justify-end gap-4">
          <button
            onClick={() => navigate('/student/lectures')}
            className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-lg shadow-red-950/20"
          >
            Leave
          </button>
          <span className="text-xs font-semibold text-slate-400 font-mono hidden sm:inline">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
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
