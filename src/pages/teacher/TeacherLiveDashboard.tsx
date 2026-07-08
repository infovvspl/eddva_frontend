import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import {
  BROADCAST_REACTIONS,
  BroadcastChatMessage,
  BroadcastParticipant,
  BroadcastStats,
  createBroadcastSocket,
  getBroadcastToken,
  liveBroadcast,
} from '@/lib/api/live-broadcast';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  AlertTriangle,
  BarChart2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Hand,
  MessageSquare,
  Plus,
  Send,
  StopCircle,
  Trash2,
  Users,
  Video,
  X,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  Smile,
  CircleDot,
  Subtitles,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type SidePanel = 'chat' | 'participants' | 'hands' | 'polls';
type LectureStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'PROCESSED' | 'PROCESSING_FAILED' | null;

interface PollOption {
  text: string;
  correct: boolean;
}

interface ActivePoll {
  id: string;
  question: string;
  options: string[];
  correctOption?: string;
  results: Record<string, number>;
}

interface PastPoll {
  id: string;
  question: string;
  options: string[];
  correctOption?: string;
  status: string;
  results: Record<string, number>;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Post-class summary ────────────────────────────────────────────────────────

function PostClassSummary({ stats, onDone }: { stats: BroadcastStats; onDone: () => void }) {
  const [tab, setTab] = useState<'overview' | 'participants' | 'polls' | 'chat'>('overview');
  const [chat, setChat] = useState<BroadcastChatMessage[]>([]);
  const { id } = stats;

  useEffect(() => {
    liveBroadcast.getChatHistory(id).then(setChat).catch(() => undefined);
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top_center,rgba(255,255,255,0.03),transparent_50%)] text-slate-200 flex flex-col font-sans">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 shrink-0 border border-blue-500/20">
          <Video size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{stats.title}</h1>
          <p className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Session Summary</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 ml-auto px-3 py-1.5 text-xs font-bold rounded-full">
          Class Ended
        </Badge>
        <Button className="rounded-full px-6 bg-white/10 hover:bg-white/20 text-white border-none font-semibold transition-all ml-4" onClick={onDone}>
          <ArrowLeft size={16} className="mr-2" /> Back to Lectures
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Duration', value: formatDuration(stats.durationSeconds || 0), icon: <Video size={24} className="text-indigo-400" />,
                bgClass: 'bg-indigo-950/20', borderClass: 'border-indigo-500/20', hoverBorderClass: 'hover:border-indigo-500/30', glowClass: 'bg-indigo-500/10', hoverGlowClass: 'group-hover:bg-indigo-500/20', iconBgClass: 'bg-indigo-500/10'
              },
              {
                label: 'Students Joined', value: stats.totalParticipants, icon: <Users size={24} className="text-emerald-400" />,
                bgClass: 'bg-emerald-950/20', borderClass: 'border-emerald-500/20', hoverBorderClass: 'hover:border-emerald-500/30', glowClass: 'bg-emerald-500/10', hoverGlowClass: 'group-hover:bg-emerald-500/20', iconBgClass: 'bg-emerald-500/10'
              },
              {
                label: 'Total Messages', value: stats.totalMessages, icon: <MessageSquare size={24} className="text-blue-400" />,
                bgClass: 'bg-blue-950/20', borderClass: 'border-blue-500/20', hoverBorderClass: 'hover:border-blue-500/30', glowClass: 'bg-blue-500/10', hoverGlowClass: 'group-hover:bg-blue-500/20', iconBgClass: 'bg-blue-500/10'
              },
              {
                label: 'Total Reactions', value: stats.totalReactions, icon: <BarChart2 size={24} className="text-rose-400" />,
                bgClass: 'bg-rose-950/20', borderClass: 'border-rose-500/20', hoverBorderClass: 'hover:border-rose-500/30', glowClass: 'bg-rose-500/10', hoverGlowClass: 'group-hover:bg-rose-500/20', iconBgClass: 'bg-rose-500/10'
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bgClass} border ${s.borderClass} rounded-3xl p-8 relative overflow-hidden group ${s.hoverBorderClass} transition-all duration-200 hover:-translate-y-1 shadow-xl`}>
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${s.glowClass} rounded-full blur-2xl ${s.hoverGlowClass} transition-colors pointer-events-none`} />
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 ${s.iconBgClass} rounded-2xl border ${s.borderClass}`}>
                    {s.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-300">{s.label}</p>
                </div>
                <p className="text-4xl font-bold text-slate-100 tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Tabs Area */}
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                {/* Tabs */}
                <div className="flex p-2 bg-white/[0.03] border-b border-white/5">
                  {(['overview', 'participants', 'polls', 'chat'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-3 px-4 text-sm font-bold capitalize transition-all duration-200 rounded-xl ${tab === t ? 'bg-white/10 text-slate-200 shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {tab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Started At</p>
                          <p className="text-lg font-bold text-slate-200">{stats.startedAt ? new Date(stats.startedAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Ended At</p>
                          <p className="text-lg font-bold text-slate-200">{stats.endedAt ? new Date(stats.endedAt).toLocaleString() : '—'}</p>
                        </div>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Instructor</p>
                        <p className="text-lg font-bold text-slate-200">{stats.teacherName || '—'}</p>
                      </div>
                    </div>
                  )}

                  {tab === 'participants' && (
                    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
                      <table className="w-full text-sm text-left">
                        <thead className="text-slate-400 bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Joined At</th>
                            <th className="px-6 py-4">Total Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {stats.participants?.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No participants</td></tr>
                          )}
                          {stats.participants?.map((p) => (
                            <tr key={p.userId} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                    {p.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-200">{p.userName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-400 font-medium">{fmtTime(p.joinedAt)}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                                  {p.durationSeconds != null ? formatDuration(p.durationSeconds) : '–'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tab === 'polls' && (
                    <div className="space-y-6">
                      {stats.polls?.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                          <BarChart2 size={40} className="mx-auto mb-4 opacity-30" />
                          <p className="text-base font-semibold">No polls were created.</p>
                        </div>
                      )}
                      {stats.polls?.map((poll) => {
                        const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                        return (
                          <div key={poll.id} className="bg-black/20 border border-white/5 rounded-2xl p-6">
                            <p className="font-bold text-lg text-white mb-5">{poll.question}</p>
                            <div className="space-y-3">
                              {poll.options.map((opt) => {
                                const votes = poll.results?.[opt] ?? 0;
                                const pct = total ? Math.round((votes / total) * 100) : 0;
                                const isCorrect = poll.correctOption === opt;
                                return (
                                  <div key={opt} className="relative p-3 rounded-xl border border-white/5 bg-white/5">
                                    <div className="flex justify-between text-sm font-bold text-slate-300 relative z-10">
                                      <span className="flex items-center gap-2">
                                        {opt}
                                        {isCorrect && <span className="ml-2 rounded px-2 py-0.5 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>}
                                      </span>
                                      <span className="shrink-0 text-slate-400">{votes} ({pct}%)</span>
                                    </div>
                                    <div className="absolute inset-0 rounded-xl overflow-hidden opacity-20 pointer-events-none">
                                      <div className={`h-full ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
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

                  {tab === 'chat' && (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {chat.length === 0 && (
                        <div className="py-12 text-center text-slate-500">
                          <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                          <p className="text-base font-semibold">No messages.</p>
                        </div>
                      )}
                      {chat.map((m) => (
                        <div key={m.id} className="flex gap-4 group">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-slate-300">
                            {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-200">{m.userName || 'User'}</span>
                              <span className="text-xs font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                            </div>
                            <div className="inline-block bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                              <p className="text-sm text-slate-300 leading-relaxed">{m.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Reaction breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Reaction Breakdown
                </h3>
                {stats.reactionBreakdown?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.reactionBreakdown.map((r) => (
                      <div key={r.emoji} className="bg-white/5 rounded-xl p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-all duration-200">
                        <span className="text-3xl">{r.emoji}</span>
                        <span className="font-bold text-xl text-slate-200">{r.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-500 text-center py-4">No reactions recorded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TeacherLiveDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ccEnabled, setCcEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants' | 'hands'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true); const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [chatLocked, setChatLocked] = useState(false);

  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [lectureStatus, setLectureStatus] = useState<LectureStatus>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');
  const [messages, setMessages] = useState<BroadcastChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [students, setStudents] = useState<BroadcastParticipant[]>([]);
  const [hands, setHands] = useState<{ userId: string; userName: string }[]>([]);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [pastPolls, setPastPolls] = useState<PastPoll[]>([]);
  const [postStats, setPostStats] = useState<BroadcastStats | null>(null);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  // Track whether the stream ever went LIVE so we know whether to show stats after ending
  const wentLiveRef = useRef(false);

  // Poll creation form
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { text: '', correct: false },
    { text: '', correct: false },
  ]);

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const [isPageFullscreen, setIsPageFullscreen] = useState(false);

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

  const { items: floatItems, push: pushReaction } = useFloatingReactions();

  // Timer effect for teacher live state
  useEffect(() => {
    if (lectureStatus === 'LIVE') {
      if (!startedAt) setStartedAt(Date.now());
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
    } else {
      setStartedAt(null);
    }
  }, [lectureStatus, startedAt]);

  const duration = useMemo(() => {
    if (!startedAt) return '00:00';
    const s = Math.max(0, Math.floor((now - startedAt) / 1000));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return (hh ? `${String(hh).padStart(2, '0')}:` : '') +
      `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, startedAt]);

  // ── Load initial lecture state ──────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    // Fetch stream credentials and title in parallel, but only let streamInfo
    // own lectureStatus to avoid a race where two concurrent setLectureStatus
    // calls produce non-deterministic results (BUG-28).
    liveBroadcast.streamInfo(id).then((info) => {
      if (info) {
        setStreamKey(info.streamKey ?? null);
        setRtmpUrl(info.rtmpUrl ?? null);
        const s = info.status as LectureStatus ?? null;
        setLectureStatus(s);
        if (s === 'LIVE') wentLiveRef.current = true;
      }
    }).catch(() => undefined);

    liveBroadcast.getStreamUrl(id).then((info) => {
      if (info?.title) setLectureTitle(info.title);
      // Do NOT set lectureStatus here — streamInfo owns it (BUG-28)
    }).catch(() => undefined);

    liveBroadcast.getChatHistory(id).then(setMessages).catch(() => undefined);
    liveBroadcast.getActiveParticipants(id).then(setStudents).catch(() => undefined);
    liveBroadcast.getActivePoll(id).then((res) => {
      if (res?.poll) setActivePoll({ ...res.poll, results: res.results || {} });
    }).catch(() => undefined);
    liveBroadcast.listPolls(id).then((polls) => {
      setPastPolls(polls.filter((p: any) => p.status === 'ENDED'));
    }).catch(() => undefined);
  }, [id]);

  // ── Socket ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = createBroadcastSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('teacher-join', { token: getBroadcastToken(), lectureId: id });
    });

    socket.on('teacher-joined', ({ viewerCount: vc, students: s }) => {
      setViewerCount(vc ?? 0);
      if (Array.isArray(s)) setStudents(s);
    });

    socket.on('stream-started', () => {
      wentLiveRef.current = true;
      setLectureStatus('LIVE');
      // Refresh stream credentials — the teacher may not have had them loaded
      // if the page was opened before OBS started (BUG-27).
      liveBroadcast.streamInfo(id).then((info) => {
        if (info?.streamKey) setStreamKey(info.streamKey);
        if (info?.rtmpUrl) setRtmpUrl(info.rtmpUrl);
      }).catch(() => undefined);
    });
    socket.on('stream-ended', () => setLectureStatus('ENDED'));

    socket.on('viewerCount', ({ count }) => setViewerCount(count ?? 0));

    socket.on('participants', ({ students: s }) => {
      if (Array.isArray(s)) setStudents(s);
    });

    socket.on('chat', (msg: BroadcastChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('hand-raised', ({ userId, userName, raised }) => {
      setHands((prev) => {
        const filtered = prev.filter((h) => h.userId !== userId);
        return raised ? [...filtered, { userId, userName }] : filtered;
      });
      setStudents((prev) =>
        prev.map((s) => (s.userId === userId ? { ...s, handRaised: raised } : s)),
      );
    });

    socket.on('reaction', ({ emoji }) => pushReaction(emoji));

    socket.on('poll-created', ({ poll }) => {
      setActivePoll({ id: poll.id, question: poll.question, options: poll.options, correctOption: poll.correctOption, results: {} });
    });

    socket.on('poll-results', ({ pollId, results }) => {
      setActivePoll((prev) => (prev?.id === pollId ? { ...prev, results } : prev));
    });

    socket.on('poll-ended', ({ pollId }) => {
      setActivePoll((prev) => {
        if (prev?.id === pollId) {
          setPastPolls((p) => [
            ...p,
            { id: prev.id, question: prev.question, options: prev.options, correctOption: prev.correctOption, status: 'ENDED', results: prev.results },
          ]);
          return null;
        }
        return prev;
      });
    });

    socket.on('stream-error', ({ message }) => {
      toast({ title: 'Socket error', description: message, variant: 'destructive' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const sendChat = () => {
    const text = chatDraft.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit('chat', { text });
    setChatDraft('');
  };

  const endLecture = async () => {
    if (!id || ending) return;
    const wasLive = wentLiveRef.current;
    setEnding(true);
    try {
      await liveBroadcast.endLecture(id);
      if (wasLive) {
        // Brief delay so the DB write from endLecture propagates before we fetch
        // the final participant/chat/reaction counts (BUG-40).
        await new Promise((r) => setTimeout(r, 1500));
        const stats = await liveBroadcast.getStats(id);
        setPostStats(stats!);
      } else {
        toast({ title: 'Stream cancelled' });
        navigate('/teacher/lectures');
      }
    } catch {
      toast({ title: wasLive ? 'Failed to end lecture' : 'Failed to cancel stream', variant: 'destructive' });
    } finally {
      setEnding(false);
    }
  };

  const createPoll = async () => {
    const q = pollQuestion.trim();
    const opts = pollOptions.map((o) => o.text.trim()).filter(Boolean);
    if (!q || opts.length < 2 || !id) return;
    const correctOpt = pollOptions.find((o) => o.correct)?.text.trim();
    try {
      await liveBroadcast.createPoll(id, q, opts, correctOpt || undefined);
      setPollQuestion('');
      setPollOptions([{ text: '', correct: false }, { text: '', correct: false }]);
      setShowPollForm(false);
    } catch {
      toast({ title: 'Failed to create poll', variant: 'destructive' });
    }
  };

  const endPoll = async () => {
    if (!activePoll || !id) return;
    try {
      await liveBroadcast.endPoll(id, activePoll.id);
    } catch {
      toast({ title: 'Failed to end poll', variant: 'destructive' });
    }
  };

  // ── Post-class ───────────────────────────────────────────────────────────────
  if (postStats) {
    return (
      <PostClassSummary
        stats={postStats}
        onDone={() => navigate('/teacher/lectures')}
      />
    );
  }

  // ── Live / Scheduled UI ───────────────────────────────────────────────────
  // Stable helper for local connection quality simulation
  const getWifiQuality = useCallback((userId: string) => {
    const charCode = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (charCode % 3 === 0) return { label: 'Excellent', color: 'text-emerald-400' };
    if (charCode % 3 === 1) return { label: 'Fair', color: 'text-amber-400' };
    return { label: 'Weak', color: 'text-rose-400' };
  }, []);

  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s => s.userName.toLowerCase().includes(q));
  }, [students, studentSearchQuery]);

  return (
    <>
      <div ref={pageContainerRef} className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col font-sans h-auto lg:h-screen overflow-y-auto lg:overflow-hidden select-none">
        {/* Top Bar / Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b-2 border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl flex-shrink-0 z-10 shadow-lg">
          {/* Left: Primary Course Info */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/teacher/lectures')}
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Coaching Dashboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Secondary Status Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
            {lectureStatus === 'LIVE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 shrink-0 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-pulse">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">LIVE</span>
              </div>
            )}
            {lectureStatus === 'SCHEDULED' && (
              <div className="px-3 py-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[11px] font-bold uppercase tracking-widest shrink-0">Scheduled</div>
            )}
            {lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) && (
              <div className="px-3 py-1.5 rounded-2xl border border-slate-500/30 bg-white/5 text-slate-300 text-[11px] font-bold uppercase tracking-widest shrink-0">Ended</div>
            )}

            {/* Session Timer & REC Label */}
            {lectureStatus === 'LIVE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 shrink-0">
                <span className="font-mono text-[11px] font-bold text-slate-300">{duration}</span>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-rose-600/20 border border-rose-500/30 text-[9px] font-black text-rose-400 animate-pulse">
                  <CircleDot size={8} /> REC
                </div>
              </div>
            )}

            {/* Connection quality dropdown (purely visual) */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 shrink-0 text-slate-300 text-xs font-bold transition-all duration-200">
                <Wifi size={14} className="text-emerald-400" />
                <span className="text-[11px] hidden sm:inline">Excellent</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-2xl shadow-xl p-3 hidden group-hover:block z-50 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Connection Quality</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">FPS:</span>
                    <span className="font-semibold text-slate-200">30 fps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bitrate:</span>
                    <span className="font-semibold text-slate-200">2500 kbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="font-semibold text-slate-200">1080p</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewer Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5 shrink-0">
              <Users size={14} className="text-slate-400" />
              <span className="text-[11px] font-bold text-slate-300">{viewerCount}</span>
            </div>

            <button
              onClick={togglePageFullscreen}
              className="h-9 px-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 shrink-0 border border-white/5 flex items-center gap-1.5 text-xs font-bold"
              title="Fullscreen class view"
            >
              {isPageFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              <span className="hidden md:inline">Fullscreen</span>
            </button>

            {(lectureStatus === 'LIVE' || lectureStatus === 'SCHEDULED') && (
              <>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={ending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border border-transparent px-4 py-2 text-xs font-bold transition-all duration-200 disabled:opacity-50 shrink-0 shadow-lg shadow-rose-950/20"
                >
                  <StopCircle size={14} />
                  {ending
                    ? (lectureStatus === 'LIVE' ? 'Ending…' : 'Cancelling…')
                    : (lectureStatus === 'LIVE' ? 'End Class' : 'End Stream')}
                </button>
              </>
            )}
          </div>
        </header>

        {/* Stream key info for OBS (when not yet live) */}
        {streamKey && lectureStatus !== 'LIVE' && !['ENDED', 'PROCESSED'].includes(lectureStatus ?? '') && (
          <div className="px-6 py-4 bg-blue-900/10 border-b border-blue-500/20 text-sm space-y-2 flex-shrink-0 animate-in slide-in-from-top duration-300">
            <p className="text-blue-300 font-semibold flex items-center gap-2 text-xs sm:text-sm"><Video size={16} /> Configure OBS with these credentials to go live:</p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 max-w-full overflow-hidden">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">RTMP</span>
                <span className="text-blue-300 font-mono text-xs select-all break-all">{rtmpUrl}</span>
              </div>
              <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 max-w-full overflow-hidden">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">Stream Key</span>
                <span className="text-blue-300 font-mono text-xs select-all break-all">{streamKey}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Container */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-visible lg:overflow-hidden p-4 gap-4 min-h-0">
          {/* Left Area: Video Stage & Bottom Participant Avatars */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Left Area (Video Screen & Controls) */}
            <div className="flex-1 relative min-h-0 flex flex-col rounded-3xl bg-[#1e293b] border-2 border-slate-700 p-4 sm:p-5 overflow-hidden group shadow-[0_0_35px_rgba(59,130,246,0.1)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01),transparent_70%)] pointer-events-none" />

              {/* Video Screen Container */}
              <div className="relative flex-1 aspect-video lg:aspect-auto min-h-[240px] sm:min-h-[380px] lg:min-h-0 rounded-2xl overflow-hidden bg-black/40 shadow-inner border border-slate-700 flex flex-col items-center justify-center">
                {/* Reactions Overlay */}
                <FloatingReactionLayer items={floatItems} />

                {/* Pinned badge */}
                <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 text-[10px] font-black text-blue-400 uppercase tracking-widest shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Pinned for all students
                </div>

                {/* CC Captions Mock Overlay */}
                {ccEnabled && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-xl text-center bg-black/85 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs sm:text-sm text-slate-100 font-medium tracking-wide">
                      <span className="text-blue-400 font-bold uppercase text-[10px] mr-1.5">CC [Local Auto]</span> Welcome to today's live lecture. Please ensure your notebooks are ready as we cover the core syllabus.
                    </p>
                  </div>
                )}

                <div className="relative z-10 text-center p-4">
                  {lectureStatus === 'LIVE' ? (
                    <div className="space-y-6">
                      <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center mx-auto relative shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                        <div className="absolute inset-0 rounded-full border-t-2 border-rose-500 animate-spin opacity-50"></div>
                        <Video className="text-rose-500 animate-pulse" size={40} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-200 mb-2">Class is Live</p>
                        <p className="text-slate-400 text-sm font-medium">{viewerCount} student{viewerCount !== 1 ? 's' : ''} watching</p>
                      </div>
                    </div>
                  ) : lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle className="text-emerald-400" size={48} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-200 mb-1">Class Ended</p>
                        <p className="text-slate-400 text-sm">The broadcast has finished.</p>
                      </div>
                      <Button
                        className="rounded-full px-8 py-6 text-sm font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all duration-200 hover:-translate-y-0.5"
                        onClick={async () => {
                          if (!id) return;
                          try {
                            const stats = await liveBroadcast.getStats(id);
                            setPostStats(stats!);
                          } catch {
                            toast({ title: 'Failed to load stats', variant: 'destructive' });
                          }
                        }}
                      >
                        <BarChart2 size={16} className="mr-2" /> View Dashboard Summary
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-inner">
                        <Video className="text-slate-500 animate-bounce" size={40} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-200 mb-1">Ready to broadcast</p>
                        <p className="text-slate-400 text-sm">Start streaming from OBS to go live</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Caption below video */}
              <div className="mt-3 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> OBS <span className="text-slate-500">→</span> RTMP <span className="text-slate-500">→</span> HLS
                </span>
              </div>

              {/* Control Dock */}
              <div className="mt-4 flex justify-center w-full z-20 relative">
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 p-2 rounded-2xl bg-[#0f1115]/95 border border-white/10 backdrop-blur-xl shadow-2xl max-w-full">
                  {/* CC Toggle */}
                  <button
                    onClick={() => setCcEnabled(!ccEnabled)}
                    className={`h-9 px-2.5 sm:h-11 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${ccEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                    title="Closed Captions (Cosmetic)"
                  >
                    <Subtitles size={18} />
                    <span>CC</span>
                  </button>

                  {/* Mic Toggle */}
                  <button
                    onClick={() => setMicMuted(!micMuted)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${micMuted ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                    title={micMuted ? 'Unmute Mic (Cosmetic)' : 'Mute Mic (Cosmetic)'}
                  >
                    {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={() => setCameraMuted(!cameraMuted)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${cameraMuted ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                    title={cameraMuted ? 'Start Camera (Cosmetic)' : 'Stop Camera (Cosmetic)'}
                  >
                    {cameraMuted ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  {/* Screen Share */}
                  <button
                    onClick={() => setScreenSharing(!screenSharing)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${screenSharing ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                    title="Screen Share (Cosmetic)"
                  >
                    <Monitor size={18} />
                  </button>

                  {/* Reaction Trigger Panel */}
                  <div className="relative">
                    <button
                      onClick={() => setReactionsOpen(!reactionsOpen)}
                      className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-200 ${reactionsOpen ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}
                      title="Send Reaction"
                    >
                      <Smile size={18} />
                    </button>
                    {reactionsOpen && (
                      <div className="absolute bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 p-1.5 rounded-2xl bg-[#0f1115] border border-white/10 shadow-2xl flex items-center gap-1.5 z-50 animate-in slide-in-from-bottom-2 duration-200">
                        {BROADCAST_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              socketRef.current?.emit('reaction', { emoji });
                              setReactionsOpen(false);
                            }}
                            className="h-9 w-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg transition-all hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hand icon (cosmetic for teacher) */}
                  <button
                    className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                    title="Manage student hands (Cosmetic)"
                  >
                    <Hand size={18} />
                  </button>

                  {/* Recording Toggle */}
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`h-9 px-2.5 sm:h-11 sm:px-3.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${isRecording ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-white/5 text-slate-300 hover:bg-[#1f232e]'}`}
                    title="Local Recording (Cosmetic)"
                  >
                    <CircleDot size={18} className={isRecording ? 'text-white' : 'text-rose-500'} />
                    <span>REC</span>
                  </button>
                </div>
              </div>
              {/* Bottom Participant Avatars Row */}
              <div className="flex gap-3 h-20 shrink-0 overflow-x-auto py-1 items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {students.map((std) => {
                  const initials = std.initials || (std.userName ? (std.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) : '?');
                  return (
                    <div
                      key={std.userId}
                      className={`relative flex flex-col items-center justify-center rounded-xl bg-[#334155] border ${std.handRaised ? 'border-2 border-amber-500 shadow-md shadow-amber-500/15' : 'border-[1.5px] border-slate-600/60'
                        } px-2 py-1.5 transition-all w-20 sm:w-24 shrink-0 h-[68px]`}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 shrink-0">
                        {initials}
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 mt-1 truncate w-full text-center">
                        {std.userName}
                      </span>
                      {std.handRaised && (
                        <div className="absolute -top-1 -right-1 bg-[#e69f00] text-black rounded-full p-0.5 border border-slate-800" title="Hand Raised">
                          <Hand size={8} fill="black" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Area (Unified Sidebar Panel) */}
          {/* Right Area (Sidebar: two separate panels + collapse toggle) */}
          <div className={`relative flex-shrink-0 flex flex-col gap-4 min-h-0 transition-all duration-300 ${sidebarOpen ? 'w-full lg:w-80 xl:w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none'
            }`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute -left-3 top-6 z-30 h-7 w-7 rounded-full bg-[#1e293b] border-2 border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-lg hover:bg-slate-800"
              title="Collapse sidebar"
            >
              <ChevronRight size={14} />
            </button>

            {/* PANEL A: Chat / Active / Hands */}
            <div className="flex-[3] flex flex-col rounded-3xl border-2 border-slate-700 bg-[#1e293b] shadow-2xl min-h-0 overflow-hidden">            {/* Pill tabs switcher */}
              <div className="flex p-1.5 mx-3 mt-3 rounded-2xl bg-[#0f172a]/50 border border-slate-700 flex-shrink-0">
                {([
                  { key: 'chat' as const, label: 'Chat' },
                  { key: 'participants' as const, label: 'Active' },
                  { key: 'hands' as const, label: 'Hands' }
                ]).map(({ key, label }) => {
                  const count = key === 'hands' ? hands.length : key === 'participants' ? students.length : 0;
                  const isSelected = sidebarTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSidebarTab(key)}
                      className={`flex-1 py-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1 transition-all duration-200 rounded-xl relative ${isSelected ? 'bg-blue-600 text-white shadow-sm border border-blue-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                        }`}
                    >
                      <span>{label}</span>
                      {count > 0 && (
                        <span className={`px-1.5 py-0.5 text-[9px] rounded-full font-black ${key === 'hands' ? 'bg-amber-500 text-black animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Tab contents */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
                {/* Chat tab */}
                {sidebarTab === 'chat' && (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
                          <MessageSquare size={32} className="text-slate-500 mb-3" />
                          <p className="text-sm font-bold text-slate-200">No messages yet</p>
                          <p className="text-xs text-slate-400">Class chat is active</p>
                        </div>
                      )}
                      {messages.map((m) => (
                        <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                            {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="truncate text-xs sm:text-sm font-bold text-blue-300">{m.userName || 'User'}</span>
                              <span className="shrink-0 text-[10px] sm:text-xs font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                            </div>
                            <div className="inline-block bg-[#334155]/55 border border-slate-600/30 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[90%]">
                              <p className="break-words text-xs sm:text-sm text-slate-200 leading-relaxed">{m.text}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Input & Lock Row */}
                    <div className="p-3 bg-[#0f172a]/50 border-t border-slate-700/50 flex-shrink-0">
                      <div className="flex gap-2 p-1.5 bg-[#0f172a]/40 border border-slate-600/50 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all duration-200">
                        <input
                          value={chatDraft}
                          onChange={(e) => setChatDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                          placeholder="Message students…"
                          className="flex-1 min-w-0 bg-transparent px-3 text-xs sm:text-sm text-slate-200 placeholder-slate-400 outline-none h-10"
                        />
                        <button
                          onClick={sendChat}
                          disabled={!chatDraft.trim()}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all duration-200 disabled:opacity-40 hover:-translate-y-0.5 border border-blue-500/20 shadow-sm"
                        >
                          <Send size={16} className="-ml-0.5" />
                        </button>
                      </div>

                      {/* Quick Reactions emoji row */}
                      <div className="flex justify-around items-center mt-2.5 px-1 border-t border-white/[0.03] pt-2">
                        {BROADCAST_REACTIONS.slice(0, 6).map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => socketRef.current?.emit('reaction', { emoji })}
                            className="text-base hover:scale-125 hover:rotate-6 transition-all duration-150 p-1 rounded-lg hover:bg-white/5"
                          >
                            {emoji}
                          </button>
                        ))}
                        <div className="w-px h-4 bg-white/10" />
                        <button
                          onClick={() => setChatLocked(!chatLocked)}
                          className={`p-1.5 rounded-lg hover:bg-white/5 text-xs transition-colors duration-200 ${chatLocked ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
                          title={chatLocked ? 'Unlock Chat' : 'Lock Chat'}
                        >
                          {chatLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active (Participants + Roster List + Live Stats) tab */}
                {sidebarTab === 'participants' && (
                  <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {/* Micro Stats Summary Card */}
                    <div className="p-3 mx-3 mt-3 bg-[#0f172a]/30 border border-slate-700/50 rounded-2xl grid grid-cols-3 gap-2 flex-shrink-0 text-center">
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Messages</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{messages.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Hands</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{hands.length}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Polls</p>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{pastPolls.length + (activePoll ? 1 : 0)}</p>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col min-h-0 overflow-hidden mt-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Roster & Connection Status</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#334155]/60 text-slate-300">{filteredStudents.length} joined</span>
                      </div>

                      {/* Search input */}
                      <div className="mb-2.5 flex-shrink-0">
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="w-full bg-[#0f172a]/40 border border-slate-600/50 focus:border-slate-500 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors"
                        />
                      </div>

                      {/* Student roster scrollbox */}
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                        {filteredStudents.length === 0 ? (
                          <p className="text-[11px] text-slate-500 text-center py-4">No matching students</p>
                        ) : (
                          filteredStudents.map((student) => {
                            const quality = getWifiQuality(student.userId);
                            return (
                              <div key={student.userId} className="group/row flex items-center justify-between p-2 rounded-xl bg-[#334155]/40 border border-slate-700/50 hover:border-slate-600 transition-all duration-150">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {/* Avatar */}
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0 border border-white/5">
                                    {student.userName?.[0]?.toUpperCase() ?? '?'}
                                  </div>
                                  {/* Name */}
                                  <span className="text-xs font-bold text-slate-200 truncate">{student.userName}</span>
                                </div>

                                {/* Indicators */}
                                <div className="flex items-center gap-3 shrink-0">
                                  {student.handRaised ? (
                                    <div className="relative group/tooltip">
                                      <span className="cursor-pointer text-amber-500 animate-bounce flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                        <Hand size={11} />
                                      </span>
                                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-50 bg-slate-950 text-[9px] font-bold text-white px-2 py-1 rounded border border-white/10 whitespace-nowrap shadow-xl">
                                        Ask to unmute (Cosmetic)
                                      </div>
                                    </div>
                                  ) : (
                                    <Mic size={12} className="text-slate-500 opacity-60 group-hover/row:opacity-100 transition-opacity" />
                                  )}

                                  <div className="relative group/wifi">
                                    <Wifi size={12} className={`cursor-pointer ${quality.color}`} />
                                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover/wifi:block z-50 bg-slate-950 text-[9px] font-bold text-white px-2 py-0.5 rounded border border-white/10 whitespace-nowrap shadow-xl">
                                      Connection: {quality.label}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hands raised tab */}
                {sidebarTab === 'hands' && (
                  <div className="flex-grow flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {hands.length > 0 && (
                      <div className="p-3 bg-[#0f172a]/30 border-b border-slate-700/50 flex-shrink-0 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{hands.length} hands raised</span>
                        <button
                          onClick={lowerAllHands}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Lower All Hands
                        </button>
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      {hands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
                          <Hand size={32} className="text-slate-500 mb-3" />
                          <p className="text-xs font-bold text-slate-200">No raised hands</p>
                        </div>
                      ) : (
                        hands.map((h) => (
                          <div key={h.userId} className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl animate-in slide-in-from-bottom-2">
                            <span className="font-bold text-xs text-slate-200">{h.userName}</span>
                            <div className="flex items-center gap-2">
                              <button
                                className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                                onClick={() => lowerStudentHand(h.userId)}
                                title="Lower Hand"
                              >
                                Lower Hand
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL B: Polls (always visible, separate card) */}
            <div className="flex-[2] flex flex-col rounded-3xl border-2 border-slate-700 bg-[#1e293b] shadow-2xl min-h-0 overflow-hidden">
              <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-slate-700/50">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Polls</span>
              </div>
              <div className="flex-grow overflow-y-auto px-4 py-4 min-h-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {activePoll ? (
                  <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-md text-[9px] font-black uppercase px-1.5 py-0.5 font-bold">Active</span>
                        <h4 className="font-bold text-white mt-1.5 leading-tight text-xs sm:text-sm">{activePoll.question}</h4>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[10px] font-bold rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white"
                        onClick={endPoll}
                      >
                        End
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {activePoll.options.map((opt) => {
                        const votes = activePoll.results?.[opt] || 0;
                        const totalVotes = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                        const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                        const isCorrect = activePoll.correctOption === opt;
                        return (
                          <div key={opt} className="relative p-2 rounded-lg border border-white/5 bg-black/20 overflow-hidden">
                            <div className="flex justify-between relative z-10 text-[10px] sm:text-xs font-bold text-slate-300">
                              <span>{opt} {isCorrect && '✓'}</span>
                              <span className="text-slate-400">{votes} ({pct}%)</span>
                            </div>
                            <div className="absolute inset-0 bg-blue-500/15" style={{ width: `${pct}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : showPollForm ? (
                  <div className="bg-black/20 p-4 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">New Poll</span>
                      <button className="text-slate-400 hover:text-white text-[10px]" onClick={() => setShowPollForm(false)}>Cancel</button>
                    </div>
                    <Textarea
                      placeholder="Poll Question"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      className="bg-white/5 border-white/10 text-white text-xs rounded-xl min-h-[50px] resize-none"
                      rows={2}
                    />
                    <div className="space-y-1.5">
                      {pollOptions.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input
                            type="radio"
                            name="correct-opt"
                            checked={opt.correct}
                            onChange={() => setPollOptions(prev => prev.map((o, j) => ({ ...o, correct: j === idx })))}
                            className="accent-emerald-500 shrink-0"
                          />
                          <Input
                            placeholder={`Option ${idx + 1}`}
                            value={opt.text}
                            onChange={(e) => setPollOptions(prev => prev.map((o, j) => j === idx ? { ...o, text: e.target.value } : o))}
                            className="bg-white/5 border-white/10 text-white text-xs rounded-xl h-8 flex-1"
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full h-8 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
                      disabled={!pollQuestion.trim() || pollOptions.some(o => !o.text.trim())}
                      onClick={createPoll}
                    >
                      Publish Poll
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all duration-200"
                      onClick={() => setShowPollForm(true)}
                    >
                      <Plus size={14} className="mr-1.5 text-blue-400" /> Create New Poll
                    </Button>
                    {pastPolls.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Past Polls ({pastPolls.length})</p>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {pastPolls.map(p => (
                            <div key={p.id} className="p-2.5 bg-white/5 rounded-xl border border-slate-700/50 flex justify-between items-center text-[10px]">
                              <span className="truncate text-slate-300 max-w-[150px] font-semibold">{p.question}</span>
                              <span className="text-slate-500 shrink-0">Ended</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating re-open button when sidebar is collapsed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-[#1e293b] border-2 border-slate-700 flex items-center justify-center text-slate-400 hover:text-white shadow-2xl hover:bg-slate-800"
              title="Expand sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {/* End Class Confirmation Modal */}
          {showEndConfirm && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4 text-rose-500">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {lectureStatus === 'LIVE' ? 'End Live Class' : 'Cancel Stream'}
                  </h3>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {lectureStatus === 'LIVE'
                    ? 'End this live class? Students will be disconnected.'
                    : 'Cancel this scheduled stream? This cannot be undone.'}
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="rounded-2xl border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowEndConfirm(false);
                      endLecture();
                    }}
                    className="rounded-2xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 text-xs font-bold transition-all duration-200"
                  >
                    {lectureStatus === 'LIVE' ? 'End Class' : 'Cancel Stream'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
