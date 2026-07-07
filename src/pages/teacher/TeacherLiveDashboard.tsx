import { useCallback, useEffect, useRef, useState } from 'react';
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
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
              { label: 'Duration', value: formatDuration(stats.durationSeconds || 0), icon: <Video size={20} className="text-indigo-400" /> },
              { label: 'Students Joined', value: stats.totalParticipants, icon: <Users size={20} className="text-emerald-400" /> },
              { label: 'Total Messages', value: stats.totalMessages, icon: <MessageSquare size={20} className="text-blue-400" /> },
              { label: 'Total Reactions', value: stats.totalReactions, icon: <BarChart2 size={20} className="text-rose-400" /> },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                    {s.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-400">{s.label}</p>
                </div>
                <p className="text-4xl font-bold text-white tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Tabs Area */}
              <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                {/* Tabs */}
                <div className="flex p-2 bg-black/20 border-b border-white/5">
                  {(['overview', 'participants', 'polls', 'chat'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-3 px-4 text-sm font-bold capitalize transition-all rounded-xl ${
                        tab === t ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                        <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Started At</p>
                          <p className="text-lg font-medium text-slate-200">{stats.startedAt ? new Date(stats.startedAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Ended At</p>
                          <p className="text-lg font-medium text-slate-200">{stats.endedAt ? new Date(stats.endedAt).toLocaleString() : '—'}</p>
                        </div>
                      </div>
                      <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Instructor</p>
                        <p className="text-lg font-medium text-slate-200">{stats.teacherName || '—'}</p>
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
                            {m.userName.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-bold text-slate-200">{m.userName}</span>
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
                      <div key={r.emoji} className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-white/5">
                        <span className="text-2xl">{r.emoji}</span>
                        <span className="font-bold text-lg text-slate-200">{r.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No reactions recorded</p>
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
  const { items: floatItems, push: pushReaction } = useFloatingReactions();

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
    const confirmMsg = wasLive
      ? 'End this live class? Students will be disconnected.'
      : 'Cancel this scheduled stream? This cannot be undone.';
    if (!window.confirm(confirmMsg)) return;
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
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl flex-shrink-0 z-10 sticky top-0">
        <button
          onClick={() => navigate('/teacher/lectures')}
          className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 shrink-0 border border-blue-500/20">
          <Video size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate leading-tight">{lectureTitle}</h1>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Coaching Dashboard</p>
        </div>

        {lectureStatus === 'LIVE' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 shrink-0">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest">LIVE</span>
          </div>
        )}
        {lectureStatus === 'SCHEDULED' && (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 px-3 py-1 text-xs font-bold rounded-full">Scheduled</Badge>
        )}
        {lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) && (
          <Badge variant="outline" className="border-slate-500/30 bg-white/5 text-slate-300 px-3 py-1 text-xs font-bold rounded-full">Ended</Badge>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shrink-0 ml-2">
          <Users size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-300">{viewerCount}</span>
        </div>

        {(lectureStatus === 'LIVE' || lectureStatus === 'SCHEDULED') && (
          <button
            onClick={endLecture}
            disabled={ending}
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-lg shadow-rose-900/20 shrink-0"
          >
            <StopCircle size={14} />
            {ending
              ? (lectureStatus === 'LIVE' ? 'Ending…' : 'Cancelling…')
              : (lectureStatus === 'LIVE' ? 'End Class' : 'End Stream')}
          </button>
        )}
      </header>

      {/* Stream key info for OBS (when not yet live) */}
      {streamKey && lectureStatus !== 'LIVE' && !['ENDED', 'PROCESSED'].includes(lectureStatus ?? '') && (
        <div className="px-6 py-4 bg-blue-900/10 border-b border-blue-500/20 text-sm space-y-2">
          <p className="text-blue-300 font-semibold flex items-center gap-2"><Video size={16} /> Configure OBS with these credentials to go live:</p>
          <div className="flex gap-4 flex-wrap">
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">RTMP</span>
              <span className="text-blue-300 font-mono text-xs select-all">{rtmpUrl}</span>
            </div>
            <div className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Stream Key</span>
              <span className="text-blue-300 font-mono text-xs select-all">{streamKey}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden bg-slate-950 p-4 gap-4">
        {/* Left panel */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center rounded-3xl border border-white/10 shadow-2xl bg-black min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black pointer-events-none" />
          <FloatingReactionLayer items={floatItems} />
          
          <div className="relative z-10 text-center">
            {lectureStatus === 'LIVE' ? (
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center mx-auto relative">
                  <div className="absolute inset-0 rounded-full border-t-2 border-rose-500 animate-spin opacity-50"></div>
                  <Video className="text-rose-500" size={40} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-2">Class is Live</p>
                  <p className="text-slate-400 text-sm font-medium">{viewerCount} student{viewerCount !== 1 ? 's' : ''} watching</p>
                </div>
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs font-semibold text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> OBS <span className="text-slate-500">→</span> RTMP <span className="text-slate-500">→</span> HLS
                </div>
              </div>
            ) : lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) ? (
              <div className="space-y-6">
                <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="text-emerald-400" size={48} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-2">Class Ended</p>
                  <p className="text-slate-400 text-sm">The broadcast has finished.</p>
                </div>
                <Button
                  className="rounded-full px-8 py-6 text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all hover:scale-105"
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
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Video className="text-slate-500" size={40} />
                </div>
                <div>
                  <p className="text-3xl font-bold text-white mb-2">Ready to broadcast</p>
                  <p className="text-slate-400 text-sm">Start streaming from OBS to go live</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 lg:w-96 flex-shrink-0 flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Panel tabs */}
          <div className="flex p-1.5 bg-black/20 mx-3 mt-3 rounded-2xl border border-white/5 flex-shrink-0">
            {([
              { key: 'chat', icon: MessageSquare },
              { key: 'participants', icon: Users },
              { key: 'hands', icon: Hand },
              { key: 'polls', icon: BarChart2 },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold transition-all rounded-xl relative ${
                  sidePanel === key ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={key}
              >
                <Icon size={14} />
                {key === 'hands' && hands.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-sm shadow-amber-500/50">
                    {hands.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
            {/* Chat panel */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                        <MessageSquare size={24} className="opacity-50" />
                      </div>
                      <p className="text-sm font-semibold text-slate-400">No messages yet</p>
                    </div>
                  )}
                  {messages.map((m) => (
                    <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
                        {m.userName.charAt(0).toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="truncate text-xs font-bold text-blue-300">{m.userName}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-500">{fmtTime(m.createdAt)}</span>
                        </div>
                        <div className="inline-block bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[90%]">
                          <p className="break-words text-[13px] text-slate-200 leading-relaxed">{m.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-3 bg-black/20 border-t border-white/5 flex-shrink-0">
                  <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-full focus-within:border-blue-500/50 focus-within:bg-white/10 transition-colors shadow-inner">
                    <input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                      placeholder="Message students…"
                      className="flex-1 min-w-0 bg-transparent px-4 text-sm text-white placeholder-slate-500 outline-none"
                    />
                    <button
                      onClick={sendChat}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 transition-all shadow-md"
                    >
                      <Send size={15} className="-ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Participants panel */}
            {sidePanel === 'participants' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {students.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Users size={24} className="opacity-50" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No students yet</p>
                  </div>
                )}
                {students.map((s) => (
                  <div key={s.userId} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 border border-white/5">
                      {s.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm font-bold text-slate-200 truncate flex-1">{s.userName}</span>
                    {s.handRaised && <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-500 shrink-0"><Hand size={14} /></span>}
                  </div>
                ))}
              </div>
            )}

            {/* Hands panel */}
            {sidePanel === 'hands' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                {hands.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <Hand size={24} className="opacity-50" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">No raised hands</p>
                  </div>
                )}
                {hands.map((h) => (
                  <div key={h.userId} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-900/30 to-amber-900/10 rounded-2xl border border-amber-500/20 shadow-sm">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Hand size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-200 flex-1">{h.userName}</span>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      onClick={() => setHands((prev) => prev.filter((x) => x.userId !== h.userId))}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Polls panel */}
            {sidePanel === 'polls' && (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* Active Poll (Moved to top if exists) */}
                  {activePoll && (
                    <div className="bg-blue-600/10 p-5 rounded-2xl border border-blue-500/30 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div>
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full mb-2">Active Poll</Badge>
                          <h4 className="text-sm font-bold text-white leading-tight">{activePoll.question}</h4>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 font-bold transition-colors shrink-0 h-8 text-xs"
                          onClick={endPoll}
                        >
                          End Poll
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {activePoll.options.map((opt) => {
                          const votes = activePoll.results?.[opt] || 0;
                          const totalVotes = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                          const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                          const isCorrect = activePoll.correctOption === opt;
                          return (
                            <div key={opt} className="relative z-10 p-2.5 rounded-xl border border-white/5 bg-black/20">
                              <div className="flex justify-between text-[11px] font-bold text-slate-300 relative z-10 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                  {opt}
                                  {isCorrect && <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] text-emerald-400 border border-emerald-500/20">✓ Correct</span>}
                                </span>
                                <span className="text-slate-400 shrink-0">{votes} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${isCorrect ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Create Poll form */}
                  {!activePoll && !showPollForm && (
                    <Button
                      className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold transition-all shadow-sm"
                      onClick={() => setShowPollForm(true)}
                    >
                      <Plus size={16} className="mr-2 text-blue-400" /> Create New Poll
                    </Button>
                  )}

                  {!activePoll && showPollForm && (
                    <div className="bg-black/30 p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <BarChart2 size={16} className="text-blue-400" /> Create New Poll
                        </h3>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-slate-400 hover:text-white" onClick={() => setShowPollForm(false)}>Cancel</Button>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question</label>
                        <Textarea
                          placeholder="e.g. What is the capital of France?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="bg-white/5 border-white/10 text-white text-sm rounded-xl focus:border-blue-500/50 resize-none"
                          rows={2}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Options</label>
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="radio"
                              name="correct"
                              checked={opt.correct}
                              onChange={() =>
                                setPollOptions((prev) =>
                                  prev.map((o, j) => ({ ...o, correct: j === i })),
                                )
                              }
                              className="accent-emerald-500 w-4 mt-2 shrink-0"
                              title="Mark as correct"
                            />
                            <Input
                              placeholder={`Option ${i + 1}`}
                              value={opt.text}
                              onChange={(e) => {
                                setPollOptions((prev) =>
                                  prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                                )
                              }}
                              className="bg-white/5 border-white/10 text-white text-sm rounded-xl focus:border-blue-500/50 flex-1"
                            />
                            {pollOptions.length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                className="h-10 w-10 shrink-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                              >
                                <X size={16} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {pollOptions.length < 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-xl h-10"
                          onClick={() => setPollOptions([...pollOptions, { text: '', correct: false }])}
                        >
                          + Add Option
                        </Button>
                      )}

                      <Button
                        className="w-full mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/20 h-11 transition-all"
                        disabled={!pollQuestion.trim() || pollOptions.some((o) => !o.text.trim())}
                        onClick={createPoll}
                      >
                        Publish Poll
                      </Button>
                    </div>
                  )}

                  {/* Past Polls */}
                  {pastPolls.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Past Polls</h3>
                      {pastPolls.map((poll) => (
                          <div key={poll.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm relative overflow-hidden group">
                            <h4 className="text-sm font-bold text-slate-300 leading-tight mb-4">{poll.question}</h4>
                            <div className="space-y-3">
                              {poll.options.map((opt) => (
                                  <div key={opt} className="relative z-10 p-2.5 rounded-xl border border-white/5 bg-black/20">
                                    <div className="flex justify-between text-[11px] font-bold text-slate-400 relative z-10 mb-1.5">
                                      <span className="flex items-center gap-1.5">
                                        {opt}
                                        {poll.correctOption === opt && <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-500 border border-emerald-500/20">✓ Correct</span>}
                                      </span>
                                      <span className="text-slate-500 shrink-0">
                                        {poll.results?.[opt] || 0} ({Object.values(poll.results || {}).reduce((a, b) => a + b, 0) ? Math.round(((poll.results?.[opt] || 0) / Object.values(poll.results || {}).reduce((a, b) => a + b, 0)) * 100) : 0}%)
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-500 ${poll.correctOption === opt ? 'bg-emerald-500/50' : 'bg-slate-600'}`}
                                        style={{ width: `${Object.values(poll.results || {}).reduce((a, b) => a + b, 0) ? Math.round(((poll.results?.[opt] || 0) / Object.values(poll.results || {}).reduce((a, b) => a + b, 0)) * 100) : 0}%` }}
                                      />
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Reaction bar (always visible when live) */}
          {lectureStatus === 'LIVE' && (
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-black/40 border-t border-white/5 flex-shrink-0 backdrop-blur-md relative z-20">
              {BROADCAST_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => socketRef.current?.emit('reaction', { emoji })}
                  className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-xl transition-all hover:scale-110 hover:-translate-y-1 shadow-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
