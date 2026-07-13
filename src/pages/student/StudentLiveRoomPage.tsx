import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import {
  BROADCAST_REACTIONS,
  BroadcastChatMessage,
  broadcastHlsUrl,
  broadcastHls480Url,
  broadcastHls360Url,
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
  HelpCircle,
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
  PlayCircle,
  Wifi,
  Subtitles,
  Volume2,
  VolumeX,
  Smile,
  Crown,
  Monitor,
  FileText,
  Download,
  Trash2,
} from 'lucide-react';

type Phase = 'waiting' | 'live' | 'ended';
type SidePanel = 'chat' | 'questions' | 'notepad' | 'polls';

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



export default function StudentLiveRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [phase, setPhase] = useState<Phase>('waiting');
  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [hostName, setHostName] = useState('Teacher');
  const [viewerCount, setViewerCount] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [volumeMuted, setVolumeMuted] = useState(true);
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

  // Q&A State
  const [questionsActive, setQuestionsActive] = useState(false);
  const [questions, setQuestions] = useState<Array<{ id: string; userId: string; userName: string; text: string; answer: string | null; createdAt: string }>>([]);
  const [questionText, setQuestionText] = useState('');

  // Notepad State
  const [notes, setNotes] = useState('');
  const saveTimerRef = useRef<any>(null);

  // Load notepad from local cache immediately, then sync with DB like school live classes.
  useEffect(() => {
    if (!id) return;
    const savedNotes = localStorage.getItem(`coaching_student_notes_${id}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
    liveBroadcast.getStudentNotes(id)
      .then((data) => {
        if (data?.notes) {
          setNotes(data.notes);
          localStorage.setItem(`coaching_student_notes_${id}`, data.notes);
        }
      })
      .catch(() => undefined);
  }, [id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    if (id) {
      localStorage.setItem(`coaching_student_notes_${id}`, value);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        liveBroadcast.saveStudentNotes(id, value).catch(() => undefined);
      }, 1000);
    }
  };

  const downloadNotes = () => {
    if (!notes.trim()) {
      toast({ title: 'Notepad is empty', variant: 'destructive' });
      return;
    }
    const element = document.createElement("a");
    const file = new Blob([notes], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${lectureTitle || 'Class'}_Notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast({ title: 'Notes downloaded successfully!' });
  };

  const clearNotes = () => {
    if (window.confirm("Are you sure you want to clear your notes?")) {
      setNotes('');
      if (id) {
        localStorage.removeItem(`coaching_student_notes_${id}`);
        liveBroadcast.saveStudentNotes(id, '').catch(() => undefined);
      }
      toast({ title: 'Notes cleared' });
    }
  };


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
        startPosition: -1,
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 3,
        liveDurationInfinity: true,
        backBufferLength: 1,
        maxBufferLength: 4,
        maxMaxBufferLength: 8,
        manifestLoadingMaxRetry: 8,
        manifestLoadingRetryDelay: 2000,
        manifestLoadingMaxRetryTimeout: 30_000,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setBuffering(false)).catch(() => setBuffering(false));
      });

      const onVisibility = () => {
        if (!document.hidden && video.paused) video.play().catch(() => undefined);
      };
      const onStall = () => { if (video.paused) video.play().catch(() => undefined); };
      document.addEventListener('visibilitychange', onVisibility);
      video.addEventListener('stalled', onStall);
      hls.once(Hls.Events.DESTROYING, () => {
        document.removeEventListener('visibilitychange', onVisibility);
        video.removeEventListener('stalled', onStall);
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
      const hostId = info?.teacherId ?? (info as any)?.hostId ?? null;
      if (hostId) hostIdRef.current = hostId;
      if (info?.teacherName) setHostName(info.teacherName);
      if (info?.title) setLectureTitle(info.title);
      if (info?.startedAt) setStartedAt(new Date(info.startedAt).getTime());
      if (info?.streamKey) {
        const key = info.streamKey;
        const quals: Array<{ label: string; url: string }> = info.qualities
          ? info.qualities.map((q) => {
            if (q.label === 'Auto') return { ...q, url: broadcastHlsUrl(key) };
            if (q.label === '480p') return { ...q, url: broadcastHls480Url(key) };
            if (q.label === '360p') return { ...q, url: broadcastHls360Url(key) };
            return q;
          })
          : [{ label: 'Auto', url: broadcastHlsUrl(key) }];
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

    socket.on('joined', ({ viewerCount: vc, students: s, questionsActive = false, questions = [] }) => {
      setViewerCount(vc ?? 0);
      setQuestionsActive(questionsActive);
      setQuestions(questions);
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
          const key = info.streamKey;
          const quals: Array<{ label: string; url: string }> = info.qualities
            ? info.qualities.map((q) => {
              if (q.label === 'Auto') return { ...q, url: broadcastHlsUrl(key) };
              if (q.label === '480p') return { ...q, url: broadcastHls480Url(key) };
              if (q.label === '360p') return { ...q, url: broadcastHls360Url(key) };
              return q;
            })
            : [{ label: 'Auto', url: broadcastHlsUrl(key) }];
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

    socket.on('questions-toggled', ({ active }) => {
      setQuestionsActive(active);
    });

    socket.on('question-added', (q) => {
      setQuestions((prev) => [...prev, q]);
    });

    socket.on('question-answered', ({ questionId, answer }) => {
      setQuestions((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, answer } : item))
      );
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
    if (phase === 'live' && qualityRef.current) {
      // In live view, notify layout/HLS
      if (qual.label === 'Auto') {
        if (hlsRef.current) hlsRef.current.currentLevel = -1;
      } else {
        if (hlsRef.current) {
          const lvl = hlsRef.current.levels.findIndex((l) => l.name === qual.label || l.height === parseInt(qual.label));
          if (lvl !== -1) hlsRef.current.currentLevel = lvl;
        }
      }
    }
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
    <div ref={pageContainerRef} className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-poppins lg:h-screen lg:overflow-hidden select-none transition-colors duration-300">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between px-4 lg:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200 flex-shrink-0 z-10 shadow-sm">
        {/* Left Side: Page Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700 border border-blue-100 uppercase tracking-widest shrink-0 select-none">
            Coaching
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm md:text-base font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
              {lectureTitle}
            </span>
            {phase === 'live' && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 tracking-wider uppercase shrink-0 select-none animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                LIVE
              </span>
            )}
          </div>
        </div>

        {/* Right Side: View modes & Hand controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 select-none">
          <div className="relative" ref={participantsDropdownRef}>
            <button
              onClick={() => setParticipantsOpen(!participantsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all select-none hover:scale-[1.02] active:scale-[0.98]"
              title="View participants"
            >
              <Users size={13} className="text-slate-400" />
              <span>{viewerCount}</span>
            </button>

            {participantsOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 backdrop-blur-md z-[100] animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Participants ({viewerCount + 1})</span>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {/* Host Row */}
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1b2234] to-[#121622] flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/10">
                        {getInitials(hostName)}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{hostName}</span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-black text-amber-500 uppercase tracking-wide">
                      <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
                    </span>
                  </div>

                  {/* Students List */}
                  {joinedStudents.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-4">No students joined yet</p>
                  ) : (
                    joinedStudents.map((student) => (
                      <div key={student.userId} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                            {student.initials}
                          </div>
                          <span className="text-xs font-medium text-slate-700 truncate">{student.name}</span>
                        </div>
                        {student.handRaised && (
                          <span className="inline-flex items-center rounded-md bg-amber-500 px-1 py-0.5 text-[8px] font-black text-black">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
            title="Fullscreen class view"
          >
            {isPageFullscreen ? <Minimize size={13} className="text-slate-400" /> : <Maximize size={13} className="text-slate-400" />}
            <span className="hidden sm:inline">Fullscreen</span>
          </button>

          {phase === 'live' && (
            handRaised ? (
              <button
                onClick={toggleHand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/10 border border-amber-400/20 animate-in zoom-in-95 duration-150"
              >
                <Hand size={13} fill="black" />
                <span>Lower Hand</span>
              </button>
            ) : (
              <button
                onClick={toggleHand}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Hand size={13} className="text-slate-400" />
                <span>Raise Hand</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden p-3 lg:p-4 gap-3 lg:gap-4 min-h-0 pb-24 lg:pb-0">
        {/* Left Area (Video Feed & Bottom Participant Avatars) */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 lg:gap-4 h-auto lg:h-full">
          {/* Video / Slide Stage */}
          <div className="aspect-video lg:aspect-auto lg:flex-1 relative min-h-0 rounded-2xl bg-[#0f121a] border border-white/[0.06] overflow-hidden group shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-center">
            {/* Reaction float layer */}
            <FloatingReactionLayer items={floatItems} />

            {/* Centered screen share notification badge */}
            {phase === 'live' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-955 text-xs font-black shadow-lg shadow-emerald-950/20 border border-emerald-400/20 animate-in slide-in-from-top-3">
                <Monitor size={13} />
                <span>{hostName} is sharing screen</span>
              </div>
            )}

            {/* Hand Raised badge on the right */}
            {handRaised && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-955 text-xs font-black shadow-lg border border-amber-400/20 animate-in slide-in-from-right-3">
                <Hand size={13} fill="black" />
                <span>Your hand is raised</span>
              </div>
            )}

            {/* Closed Captions Overlay */}
            {ccEnabled && (
              <div className="absolute bottom-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 z-20 max-w-xl text-center bg-[#090b11]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs sm:text-sm text-slate-200 font-medium tracking-wide">
                  <span className="text-blue-400 font-black uppercase text-[10px] mr-1.5 tracking-wider">CC [Auto]</span> Welcome to today's live lecture. Please ensure your notebooks are ready as we cover the core syllabus.
                </p>
              </div>
            )}

            {/* Video element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-contain relative z-10 ${phase !== 'live' ? 'hidden' : ''}`}
              playsInline
              autoPlay
              muted
            />

            {/* Tap-to-unmute prompt — always visible until user unmutes (mobile-friendly) */}
            {phase === 'live' && !buffering && volumeMuted && (
              <button
                onClick={() => setVolumeMuted(false)}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm hover:bg-black/90 transition"
              >
                <VolumeX size={16} /> Tap to unmute
              </button>
            )}

            {/* Controls overlay */}
            {phase === 'live' && !buffering && (
              <>
                {/* LIVE badge top-left */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-rose-600/90 border border-rose-500/20 px-2.5 py-1 text-[10px] font-black text-white pointer-events-none z-20 select-none shadow-md shadow-rose-900/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  LIVE · {selectedQuality === 'Auto' ? 'auto' : selectedQuality}
                </span>

                {/* Quality selector top-right */}
                {qualities.length > 1 && (
                  <div className="absolute right-3 top-3 z-20" onBlur={() => setTimeout(() => setShowQualityMenu(false), 120)}>
                    <button
                      onClick={() => setShowQualityMenu((v) => !v)}
                      className="h-8 px-2.5 rounded-xl bg-black/60 hover:bg-black/75 text-white text-[10px] font-black backdrop-blur-md transition-all border border-white/5 flex items-center gap-1"
                    >
                      <Settings2 size={11} />
                      {selectedQuality}
                    </button>
                    {showQualityMenu && (
                      <div className="absolute right-0 top-9 bg-[#0e1117] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl min-w-[90px] z-50">
                        {qualities.map((q) => (
                          <button
                            key={q.label}
                            onMouseDown={() => selectQuality(q)}
                            className={`w-full px-3.5 py-2 text-left text-xs font-bold transition-colors ${selectedQuality === q.label
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-white/[0.04]'
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
                <div className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => setVolumeMuted(!volumeMuted)}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-black/60 hover:bg-black/75 text-white backdrop-blur-md transition-all border border-white/5 hover:scale-[1.05] active:scale-[0.95]"
                    title={volumeMuted ? 'Unmute' : 'Mute'}
                  >
                    {volumeMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                  <button
                    onClick={fullscreen}
                    className="grid h-8 w-8 place-items-center rounded-xl bg-black/60 hover:bg-black/75 text-white backdrop-blur-md transition-all border border-white/5 hover:scale-[1.05] active:scale-[0.95]"
                    title="Fullscreen"
                  >
                    <Maximize size={14} />
                  </button>
                </div>

                {/* Jump to Live */}
                {latency !== null && latency > 8 && (
                  <button
                    onClick={jumpToLive}
                    className="absolute bottom-16 right-3 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-[10px] font-black text-white shadow-lg hover:bg-rose-700 transition-colors animate-pulse z-20"
                  >
                    <Radio size={11} /> Jump to Live
                  </button>
                )}
              </>
            )}

            {/* Bottom Row elements inside the stage (Option A: Merged Teacher Camera/Avatar Card) */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-end pointer-events-none">
              {/* Bottom-right Teacher Video/Avatar card */}
              <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl bg-gradient-to-br from-[#1b2234] to-[#121622] flex items-center justify-center border border-white/[0.12] shadow-2xl relative pointer-events-auto shrink-0 transition-transform duration-300">
                <span className="text-2xl font-black text-white/10 select-none tracking-widest">{getInitials(hostName)}</span>
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-black/65 backdrop-blur-sm border border-white/[0.06] flex items-center gap-1 min-w-0">
                  <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-100 truncate flex-1 leading-none">{hostName}</span>
                </div>
              </div>
            </div>

            {/* Buffering/Loading Screen */}
            {phase === 'live' && buffering && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-30 animate-in fade-in duration-300">
                <div className="text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3 animate-pulse">
                    <Loader2 className="text-blue-400 animate-spin" size={24} />
                  </div>
                  <p className="text-base font-bold text-white">Connecting to stream…</p>
                  <p className="text-xs text-slate-400 mt-1">Buffering video stream.</p>
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
                  <p className="text-xl font-bold text-white mb-2">{lectureTitle}</p>
                  <p className="text-slate-400 text-xs max-w-xs mx-auto px-4 leading-relaxed">Waiting for the teacher to start the class. This screen will update automatically.</p>
                </div>
              </div>
            )}

            {/* Ended Screen */}
            {phase === 'ended' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 z-20 animate-in fade-in duration-500 bg-[#0c0e14]">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 shadow-xl">
                  <Video className="text-slate-550" size={26} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">Class Ended</p>
                  {recordingUrl ? (
                    <p className="text-slate-400 text-xs mt-1.5">The recording is ready to watch.</p>
                  ) : (
                    <p className="text-slate-400 text-xs mt-1.5">Recording will be available soon.</p>
                  )}
                </div>
                {recordingUrl ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/student/live-classes/${id}/recording`)}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all hover:scale-105 shadow-xl shadow-blue-900/20 mt-2"
                  >
                    <PlayCircle size={16} /> Watch Recording
                  </button>
                ) : (
                  <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 mt-2 text-white text-xs px-5 py-2" onClick={() => navigate('/student/lectures')}>
                    Back to Lectures
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Participant Avatars Row */}
          <div className="hidden lg:flex gap-2.5 h-20 shrink-0 overflow-x-auto py-1 items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {joinedStudents.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 w-20 sm:w-24 shrink-0 h-[68px] bg-white/[0.02] hover:bg-white/[0.04] border ${p.active
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-md shadow-blue-500/5'
                  : 'border-white/[0.05]'
                  } px-2 py-1.5`}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] bg-gradient-to-br from-[#1b2234] to-[#121622] border border-white/[0.08] shrink-0">
                  {p.initials}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 mt-1 truncate w-full text-center">
                  {p.name}
                </span>
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
                {p.handRaised && (
                  <div className="absolute -top-1 -right-1 bg-amber-500 text-black rounded-full p-0.5 border border-[#080b11] shadow-lg animate-in zoom-in-75" title="Hand Raised">
                    <Hand size={8} fill="black" />
                  </div>
                )}
              </div>
            ))}</div>
        </div>

        {/* Right Area (Sidebar - Chat / Polls only) */}
        {sidePanel && (
          <div className="w-full lg:w-96 h-[60vh] lg:h-full max-h-[520px] lg:max-h-none flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden animate-in slide-in-from-right-3 duration-200">
            {/* Tabs header */}
            <div className="flex p-1 bg-slate-50 mx-3 mt-3 rounded-xl border border-slate-200 flex-shrink-0">
              {([
                { key: 'chat' as const, label: 'Chat', Icon: MessageSquare },
                { key: 'questions' as const, label: 'Q&A', Icon: HelpCircle },
                { key: 'notepad' as const, label: 'Notepad', Icon: FileText },
                { key: 'polls' as const, label: 'Polls', Icon: BarChart2 },
              ]).map(({ key, label, Icon }) => {
                const count = key === 'questions' ? questions.filter(q => !q.answer).length : 0;
                return (
                  <button
                    key={key}
                    onClick={() => setSidePanel(key)}
                    className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 rounded-lg relative whitespace-nowrap ${sidePanel === key
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                      }`}
                  >
                    <Icon size={12} className="shrink-0" />
                    <span>{label}</span>
                    {key === 'polls' && activePoll && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                    )}
                    {count > 0 && (
                      <span className="px-1 py-0.5 text-[8px] bg-amber-500 text-black font-black rounded-full leading-none shrink-0 animate-pulse">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content panel */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
              {/* Chat list */}
              {sidePanel === 'chat' && (
                <div className="flex flex-col h-full animate-in fade-in duration-200">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                    {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 animate-in fade-in duration-300">
                        <div className="w-12 h-12 flex items-center justify-center mb-3 rounded-full bg-slate-50 border border-slate-200 text-slate-400">
                          <MessageSquare size={20} />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-700 mb-1">Start the conversation</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto">Ask a doubt, say hello, or participate in today's class chat.</p>
                      </div>
                    )}
                    {messages.map((m) => {
                      const { isQuestion, text: body } = parseChatText(m.text);
                      return (
                        <div key={m.id} className="flex gap-2.5 group animate-in fade-in slide-in-from-bottom-1">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                            {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className="truncate text-xs font-bold text-slate-700">{m.userName || 'User'}</span>
                              {isQuestion && (
                                <span className="inline-flex items-center gap-0.5 shrink-0 rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 text-[8px] font-black text-amber-500 tracking-wide uppercase">
                                  <HelpCircle size={8} className="shrink-0" /> Doubt
                                </span>
                              )}
                              <span className="shrink-0 text-[9px] font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                            </div>
                            <div className={`inline-block rounded-xl rounded-tl-none px-3 py-1.5 max-w-[90%] shadow-sm ${isQuestion
                              ? 'bg-amber-500/[0.05] border border-amber-500/20 border-l-2 border-l-amber-500'
                              : 'bg-slate-50 border border-slate-100'
                              }`}>
                              <p className="break-words text-xs text-slate-700 leading-normal">{body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Active Poll inside chat view to match mockup */}
                    {activePoll && (
                      <div className="bg-gradient-to-br from-blue-950/15 to-indigo-950/20 border border-blue-500/15 rounded-xl p-3.5 shadow-lg mt-3 animate-in slide-in-from-bottom-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Active Poll</span>
                        </div>
                        <p className="text-xs font-bold text-white mb-2.5 leading-snug">{activePoll.question}</p>
                        <div className="space-y-1.5">
                          {activePoll.options.map((opt) => {
                            const votes = activePoll.results?.[opt] ?? 0;
                            const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                            const pct = total ? Math.round((votes / total) * 100) : 0;
                            const isSelected = selectedOption === opt;
                            const hasCorrect = !!activePoll.correctOption;
                            const isCorrect = activePoll.correctOption === opt;
                            let barColor = 'bg-blue-600';
                            let badge: React.ReactNode = null;
                            if (selectedOption && hasCorrect) {
                              if (isCorrect) {
                                barColor = 'bg-emerald-600';
                                badge = <span className="ml-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wide">Correct</span>;
                              } else if (isSelected) {
                                barColor = 'bg-rose-600';
                                badge = <span className="ml-1.5 rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 text-[8px] font-black text-rose-400 uppercase tracking-wide">Incorrect</span>;
                              }
                            }
                            return (
                              <button
                                key={opt}
                                onClick={() => { votePoll(opt); }}
                                className={`w-full text-left relative overflow-hidden rounded-lg border text-xs transition-all duration-200 ${isSelected
                                  ? 'bg-blue-600/10 border-blue-500/30'
                                  : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                                  }`}
                              >
                                {selectedOption && (
                                  <div
                                    className={`absolute inset-y-0 left-0 opacity-15 ${barColor}`}
                                    style={{ width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                  />
                                )}
                                <div className="relative z-10 px-3 py-1.5 flex justify-between items-center min-w-0">
                                  <span className={`font-semibold truncate flex-1 ${isSelected ? 'text-blue-300 font-bold' : 'text-slate-200'}`}>{opt}{badge}</span>
                                  {selectedOption && <span className="text-[10px] font-bold text-slate-400 font-mono ml-2">{pct}%</span>}
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
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex-shrink-0">
                    {chatMuted && (
                      <div className="mb-2 flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[10px] font-bold text-rose-400">
                        <VolumeX size={12} /> Chat is muted by host
                      </div>
                    )}
                    <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-xl focus-within:border-blue-500/40 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200">
                      <input
                        ref={chatInputRef}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                        maxLength={300}
                        disabled={cooldown || chatMuted}
                        placeholder={chatMuted ? 'Chat is muted by host' : cooldown ? `Cooldown (${cooldownSec}s)` : 'Type a message…'}
                        className="flex-1 min-w-0 bg-transparent px-2 text-xs text-slate-700 placeholder-slate-400 outline-none disabled:opacity-50 h-9"
                      />
                      <button
                        onClick={() => (draft.trim() ? sendChat(true) : chatInputRef.current?.focus())}
                        disabled={cooldown || chatMuted}
                        title="Ask a question"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 active:bg-amber-500/30 border border-amber-500/20 transition-all duration-200 disabled:opacity-30"
                      >
                        <HelpCircle size={14} />
                      </button>
                      <button
                        onClick={() => sendChat()}
                        disabled={cooldown || chatMuted || !draft.trim()}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 disabled:opacity-30 shadow-lg shadow-blue-600/10"
                      >
                        <Send size={13} className="-ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions / Q&A tab */}
              {sidePanel === 'questions' && (
                <div className="flex-grow flex flex-col min-h-0 bg-white animate-in fade-in duration-200">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class Q&A</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${questionsActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-white text-slate-400 border border-slate-200'}`}>
                      {questionsActive ? 'Session Active' : 'Session Closed'}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {questionsActive && (
                      <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-xl mb-1 flex-shrink-0">
                        <input
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          placeholder="Ask the instructor a question..."
                          maxLength={200}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = questionText.trim();
                              if (val && socketRef.current) {
                                socketRef.current.emit('submit-question', { text: val });
                                setQuestionText('');
                                toast({ title: 'Question submitted!' });
                              }
                            }
                          }}
                          className="flex-1 bg-transparent px-3 text-xs text-slate-700 outline-none h-9 placeholder:text-slate-400"
                        />
                        <button
                          onClick={() => {
                            const val = questionText.trim();
                            if (val && socketRef.current) {
                              socketRef.current.emit('submit-question', { text: val });
                              setQuestionText('');
                              toast({ title: 'Question submitted!' });
                            }
                          }}
                          disabled={!questionText.trim()}
                          className="h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all shrink-0"
                        >
                          Send
                        </button>
                      </div>
                    )}

                    {questions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                        <HelpCircle size={32} className="text-slate-400 mb-3" />
                        <p className="text-xs font-bold text-slate-700">No questions yet</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {questionsActive ? 'Ask a question above!' : 'Instructor has not enabled Q&A yet.'}
                        </p>
                      </div>
                    ) : (
                      questions.map((q) => (
                        <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-xs shadow-sm">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-slate-700 truncate">{q.userName}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${q.answer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {q.answer ? 'Answered' : 'Unanswered'}
                            </span>
                          </div>

                          <p className="text-slate-700 font-semibold break-words leading-normal">{q.text}</p>

                          {q.answer && (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-slate-700 leading-normal font-semibold">
                              <span className="text-[9px] font-black text-blue-600 block mb-0.5">Teacher's Answer:</span>
                              {q.answer}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Notepad tab */}
              {sidePanel === 'notepad' && (
                <div className="flex-grow flex flex-col min-h-0 bg-white animate-in fade-in duration-200 p-4">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class Notepad</span>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadNotes}
                        className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                        title="Download Notes"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={clearNotes}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 transition"
                        title="Clear Notes"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative">
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder="Write your study notes here..."
                      className="w-full h-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none resize-none font-semibold leading-relaxed placeholder-slate-400 focus:border-blue-500/50"
                    />
                  </div>
                </div>
              )}

              {/* Polls tab */}
              {sidePanel === 'polls' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-5 animate-in fade-in duration-200">
                  {activePoll && (
                    <div className="bg-gradient-to-br from-blue-950/15 to-indigo-950/20 border border-blue-500/15 rounded-xl p-4 shadow-lg animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Active Poll</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-3.5 leading-snug">{activePoll.question}</p>
                      <div className="space-y-2">
                        {activePoll.options.map((opt) => {
                          const votes = activePoll.results?.[opt] ?? 0;
                          const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                          const pct = total ? Math.round((votes / total) * 100) : 0;
                          const isSelected = selectedOption === opt;
                          const hasCorrect = !!activePoll.correctOption;
                          const isCorrect = activePoll.correctOption === opt;
                          let barColor = 'bg-blue-600';
                          let badge: React.ReactNode = null;
                          if (selectedOption && hasCorrect) {
                            if (isCorrect) {
                              barColor = 'bg-emerald-600';
                              badge = <span className="ml-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wide">Correct</span>;
                            } else if (isSelected) {
                              barColor = 'bg-rose-600';
                              badge = <span className="ml-1.5 rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 text-[8px] font-black text-rose-400 uppercase tracking-wide">Incorrect</span>;
                            }
                          }
                          return (
                            <button
                              key={opt}
                              onClick={() => { votePoll(opt); setShowPollPopup(false); }}
                              className={`w-full text-left relative overflow-hidden rounded-lg border text-xs transition-all duration-200 ${isSelected
                                ? 'bg-blue-600/10 border-blue-500/30'
                                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                                }`}
                            >
                              {selectedOption && (
                                <div
                                  className={`absolute inset-y-0 left-0 opacity-15 ${barColor}`}
                                  style={{ width: `${pct}%`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                                />
                              )}
                              <div className="relative z-10 px-3 py-2 flex justify-between items-center min-w-0">
                                <span className={`font-semibold truncate flex-1 ${isSelected ? 'text-blue-300 font-bold' : 'text-slate-200'}`}>{opt}{badge}</span>
                                {selectedOption && <span className="text-[10px] font-bold text-slate-400 font-mono ml-2">{pct}%</span>}
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
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5 select-none">
                        Past Polls <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">{pastPolls.length}</span>
                      </p>
                      {pastPolls.map((poll) => {
                        const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                        const studentVote = localStorage.getItem(POLL_VOTE_KEY(poll.id));
                        return (
                          <div key={poll.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 shadow-sm hover:border-white/[0.08] transition-all duration-200">
                            <p className="text-xs font-bold text-slate-200 mb-3 leading-snug">{poll.question}</p>
                            <div className="space-y-2.5">
                              {poll.options.map((opt) => {
                                const votes = poll.results?.[opt] ?? 0;
                                const pct = total ? Math.round((votes / total) * 100) : 0;
                                const isCorrect = poll.correctOption === opt;
                                const isYourVote = studentVote === opt;
                                const hasCorrect = !!poll.correctOption;

                                let barColor = 'bg-slate-700';
                                let suffix: React.ReactNode = null;
                                if (hasCorrect) {
                                  if (isCorrect) {
                                    barColor = 'bg-emerald-600';
                                    suffix = <span className="ml-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wide">Correct</span>;
                                  } else if (isYourVote) {
                                    barColor = 'bg-rose-600';
                                    suffix = <span className="ml-1.5 rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 text-[8px] font-black text-rose-400 uppercase tracking-wide">Yours</span>;
                                  }
                                } else if (isYourVote) {
                                  barColor = 'bg-blue-600';
                                  suffix = <span className="ml-1.5 rounded bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 text-[8px] font-black text-blue-400 uppercase tracking-wide">Your choice</span>;
                                }

                                return (
                                  <div key={opt} className="space-y-1 relative">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                                      <span className="flex items-center truncate pr-2">
                                        {opt} {suffix}
                                      </span>
                                      <span className="shrink-0 font-mono text-[9px] text-slate-500">{votes} ({pct}%)</span>
                                    </div>
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%`, transition: 'width 0.8s ease-out' }} />
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
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 animate-in fade-in duration-300">
                      <div className="w-12 h-12 flex items-center justify-center mb-3 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400">
                        <BarChart2 size={20} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-slate-200 mb-1">No active polls</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto">When the instructor starts a poll, it will appear here instantly.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="shrink-0 h-16 border-t border-white/[0.06] bg-[#0a0d14] px-6 flex items-center justify-between z-20">
        {/* Left Area: Live Connection & Latency */}
        <div className="w-1/4 flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-slate-400">
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Connected</span>
          </div>
          {phase === 'live' && latency !== null && (
            <div className="hidden sm:block">
              <LatencyBadge latency={latency} />
            </div>
          )}
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
            <Subtitles size={15} />
            <span>CC</span>
          </button>

          {/* Reactions trigger */}
          <div className="relative">
            <button
              onClick={() => setReactionPickerOpen(!reactionPickerOpen)}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all bg-white/[0.06] hover:bg-white/[0.12] text-slate-300`}
              title="React"
            >
              <Smile size={16} />
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

          {/* Sidebar Panel Toggles */}
          <button
            onClick={() => setSidePanel(sidePanel === 'chat' ? null : 'chat')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'chat' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <MessageSquare size={15} />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setSidePanel(sidePanel === 'questions' ? null : 'questions')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'questions' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <HelpCircle size={15} />
            <span>Q&A</span>
          </button>

          <button
            onClick={() => setSidePanel(sidePanel === 'notepad' ? null : 'notepad')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'notepad' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <FileText size={15} />
            <span>Notepad</span>
          </button>

          <button
            onClick={() => setSidePanel(sidePanel === 'polls' ? null : 'polls')}
            className={`h-10 px-3.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 ${sidePanel === 'polls' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
          >
            <BarChart2 size={15} />
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
          <span className="text-xs font-semibold text-slate-400 font-mono hidden sm:inline select-none">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Active Poll Popup */}
      {showPollPopup && activePoll && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-white/[0.08] p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Live Poll
              </span>
              <button onClick={() => setShowPollPopup(false)} className="rounded-xl p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5">
                <X size={15} />
              </button>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white mb-4 leading-snug">{activePoll.question}</h4>

            {selectedOption ? (
              <div className="space-y-2">
                {activePoll.options.map((opt) => {
                  const votes = activePoll.results?.[opt] ?? 0;
                  const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                  const pct = total ? Math.round((votes / total) * 100) : 0;
                  const isYourVote = selectedOption === opt;
                  const hasCorrect = !!activePoll.correctOption;
                  const isCorrect = activePoll.correctOption === opt;

                  let barColor = 'bg-slate-700';
                  let labelSuffix: React.ReactNode = null;
                  if (hasCorrect) {
                    if (isCorrect) {
                      barColor = 'bg-emerald-600';
                      labelSuffix = <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-wide">Correct</span>;
                    } else if (isYourVote) {
                      barColor = 'bg-rose-600';
                      labelSuffix = <span className="rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0.5 text-[8px] font-black text-rose-400 uppercase tracking-wide">Incorrect</span>;
                    }
                  } else if (isYourVote) {
                    barColor = 'bg-blue-600';
                    labelSuffix = <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 text-[8px] font-black text-blue-400 uppercase tracking-wide">Your choice</span>;
                  }

                  return (
                    <div key={opt} className="space-y-1 relative p-3 rounded-lg border border-white/[0.04] bg-white/[0.02]">
                      <div className="flex justify-between text-xs font-bold text-slate-400 relative z-10">
                        <span className="flex items-center gap-1.5 truncate pr-2">{opt} {labelSuffix}</span>
                        <span className="shrink-0 font-mono text-[10px] text-slate-400">{votes} ({pct}%)</span>
                      </div>
                      <div className="absolute inset-0 rounded-lg overflow-hidden opacity-15 pointer-events-none">
                        <div className={`h-full ${barColor} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
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
                    onClick={() => { votePoll(opt); }}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] py-2.5 px-3.5 text-left text-xs font-bold text-slate-200 transition-all hover:scale-[1.005] hover:border-blue-500/30 shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {!selectedOption && (
              <button onClick={() => setShowPollPopup(false)} className="w-full mt-3 text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors text-center py-1">
                Answer later
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
