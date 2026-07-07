import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import {
  Hand, Radio, Users, X, Loader2, ArrowLeft, MessageSquare,
  Clock, BarChart2, Smile, UserCheck, ChevronDown, ChevronUp, Send,
  LayoutDashboard, BookOpen, Calendar, Mic, MicOff, Video, VideoOff,
  Monitor, Info, Award
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createLiveSocket, getLiveToken, schoolLive,
  type LiveChatMessage, type LiveLectureStats,
} from '@/lib/api/school-live';
import FloatingReactionLayer, { useFloatingReactions } from '@/components/school/live/FloatingReaction';

interface RaisedHand { userId: string; userName: string }
interface LiveStudent { userId: string; userName: string }

function raisedHandsFromStudents(rows: (LiveStudent & { handRaised?: boolean })[]): RaisedHand[] {
  return rows
    .filter((row) => row.handRaised)
    .map((row) => ({ userId: row.userId, userName: row.userName }));
}

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50">{icon}</div>
      <div>
        <p className="text-xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-400">{label}</p>
        {sub && <p className="text-[10px] text-slate-300">{sub}</p>}
      </div>
    </div>
  );
}

// ── Post-class summary ────────────────────────────────────────────────────────

function PostClassSummary({ id }: { id: string }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<LiveLectureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);

  useEffect(() => {
    schoolLive.getChatHistory(id)
      .then(setMessages)
      .catch(() => undefined);

    schoolLive.getStats(id)
      .then(setStats)
      .catch(() => {
        toast.error('Stats unavailable — please restart the backend to enable full summary.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Generating Class Summary...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 text-slate-800">
        <button onClick={() => navigate('/school/teacher/classes')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
        </button>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Stats unavailable — restart the backend to enable full post-class analytics.
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-black text-slate-900">Chat History</span>
            <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{messages.length}</span>
          </div>
          <div className="h-72 space-y-1.5 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0
              ? <p className="py-10 text-center text-sm text-slate-400">No chat messages during this class.</p>
              : messages.map((m, i) => (
                  <div key={m.id} className={`rounded-xl px-3.5 py-2 text-sm ${i % 2 ? 'bg-white border border-slate-100' : 'bg-slate-100/50'}`}>
                    <span className="mr-2 font-bold text-blue-600">{m.userName}</span>
                    <span className="text-slate-700">{m.text}</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    );
  }

  const classDuration = fmtDuration(stats.durationSeconds);
  const classDate = fmtDate(stats.startedAt);
  const startTime = fmtTime(stats.startedAt);
  const endTime = fmtTime(stats.endedAt);

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 text-slate-800">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/school/teacher/classes')}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
          </button>
          <h1 className="text-2xl font-black text-slate-900">{stats.title}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {classDate} · {startTime} – {endTime}
            {stats.teacherName && <> · <span className="font-semibold text-slate-600">{stats.teacherName}</span></>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-200 px-3.5 py-1 text-xs font-black text-slate-600">
          Class Ended
        </span>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          label="Duration"
          value={classDuration}
          sub={`${startTime} – ${endTime}`}
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-emerald-600" />}
          label="Students Joined"
          value={String(stats.totalParticipants)}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-violet-600" />}
          label="Chat Messages"
          value={String(stats.totalMessages)}
        />
        <StatCard
          icon={<Smile className="h-5 w-5 text-amber-600" />}
          label="Reactions"
          value={String(stats.totalReactions)}
        />
      </div>

      {/* Reactions breakdown */}
      {stats.reactionBreakdown.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Reactions</p>
          <div className="flex flex-wrap gap-3">
            {stats.reactionBreakdown.map((r) => (
              <div key={r.emoji} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2">
                <span className="text-xl leading-none">{r.emoji}</span>
                <span className="text-lg font-black text-slate-800">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats sections grid */}
      <div className={`grid grid-cols-1 gap-6 ${stats.polls && stats.polls.length > 0 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        {/* Participants */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col">
          <button
            onClick={() => setParticipantsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-black text-slate-900">Students Who Joined</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{stats.totalParticipants}</span>
            </div>
            {participantsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {participantsOpen && (
            <div className="border-t border-slate-100 flex-1 flex flex-col min-h-0">
              {stats.participants.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No participation data recorded for this class.</p>
              ) : (
                <div className="divide-y divide-slate-50 overflow-y-auto max-h-[450px] flex-1">
                  <div className="sticky top-0 bg-white z-10 grid grid-cols-3 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <span>Student</span>
                    <span className="text-center">Joined at</span>
                    <span className="text-right">Watch time</span>
                  </div>
                  {stats.participants.map((p) => (
                    <div key={p.userId} className="grid grid-cols-3 items-center px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-black text-blue-600">
                          {p.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-sm font-semibold text-slate-800">{p.userName}</span>
                      </div>
                      <span className="text-center text-xs text-slate-500">{fmtTime(p.joinedAt)}</span>
                      <span className="text-right text-xs font-bold text-slate-600">
                        {p.durationSeconds ? fmtDuration(p.durationSeconds) : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Polls summary */}
        {stats.polls && stats.polls.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <BarChart2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-black text-slate-900">Class Polls</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{stats.polls.length}</span>
            </div>
            <div className="divide-y divide-slate-100 p-5 space-y-6 overflow-y-auto max-h-[450px] flex-1 bg-slate-50/50">
              {stats.polls.map((poll) => {
                const results = poll.results || {};
                const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                return (
                  <div key={poll.id} className="first:pt-0 pt-6">
                    <h4 className="text-sm font-bold text-slate-800 mb-3">{poll.question}</h4>
                    <div className="space-y-3">
                      {poll.options.map((opt) => {
                        const count = results[opt] || 0;
                        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const hasCorrectOption = !!poll.correctOption;
                        const isCorrect = poll.correctOption === opt;
                        const barColor = hasCorrectOption ? (isCorrect ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-blue-600';

                        let labelSuffix = null;
                        if (hasCorrectOption) {
                          if (isCorrect) {
                            labelSuffix = (
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[10px] font-black text-emerald-700">
                                ✓ Correct
                              </span>
                            );
                          } else {
                            labelSuffix = (
                              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-black text-rose-700">
                                ✗ Incorrect
                              </span>
                            );
                          }
                        }

                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium text-slate-600">
                              <span className="truncate pr-2 flex items-center gap-1.5">
                                {opt} {labelSuffix}
                              </span>
                              <span className="shrink-0">{count} {count === 1 ? 'vote' : 'votes'} ({pct}%)</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full transition-all duration-300 ${barColor}`}
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
        )}

        {/* Chat history */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-slate-50"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-black text-slate-900">Chat History</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">{messages.length}</span>
            </div>
            {chatOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {chatOpen && (
            <div className="border-t border-slate-100 flex-1 flex flex-col min-h-0 bg-slate-50">
              {messages.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">No chat messages during this class.</p>
              ) : (
                <div className="h-[450px] space-y-3 overflow-y-auto p-4 flex-1">
                  {messages.map((m) => (
                    <div key={m.id} className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">{m.userName}</span>
                        <span className="text-[10px] text-slate-400">{fmtTime(m.createdAt)}</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-white border border-slate-100 px-3.5 py-2 text-sm text-slate-700 shadow-sm">
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TeacherLiveDashboard() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [lectureStatus, setLectureStatus] = useState<'SCHEDULED' | 'LIVE' | 'ENDED' | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [live, setLive] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [students, setStudents] = useState<LiveStudent[]>([]);
  const [hands, setHands] = useState<RaisedHand[]>([]);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [lectureTitle, setLectureTitle] = useState('');
  const [draft, setDraft] = useState('');
  const [activePoll, setActivePoll] = useState<{ id: string; question: string; options: string[]; correctOption?: string } | null>(null);
  const [pollResults, setPollResults] = useState<Record<string, number>>({});
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null);
  const [pastPolls, setPastPolls] = useState<any[]>([]);
  const { items: reactions, push: pushReaction } = useFloatingReactions();

  // Tab State for Right Panel
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'polls' | 'hands'>('chat');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Media Capture States
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Manage screen sharing
  useEffect(() => {
    let active = true;
    const startScreenShare = async () => {
      if (!isScreenSharing || !live) {
        if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (active) {
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            webcamVideoRef.current.play().catch(() => {});
          }
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        }
      } catch (err) {
        console.warn("Screen share failed:", err);
        setIsScreenSharing(false);
      }
    };
    startScreenShare();
    return () => {
      active = false;
    };
  }, [isScreenSharing, live]);

  const addOptionField = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    } else {
      toast.error('Maximum 6 options allowed');
    }
  };

  const removeOptionField = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
      if (correctOptionIndex === index) {
        setCorrectOptionIndex(null);
      } else if (correctOptionIndex !== null && correctOptionIndex > index) {
        setCorrectOptionIndex(correctOptionIndex - 1);
      }
    } else {
      toast.error('At least 2 options are required');
    }
  };

  const updateOptionValue = (index: number, val: string) => {
    const next = [...pollOptions];
    next[index] = val;
    setPollOptions(next);
  };

  const launchPoll = async () => {
    const q = pollQuestion.trim();
    if (!q) {
      toast.error('Question is required');
      return;
    }
    const filteredOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (filteredOptions.length < 2) {
      toast.error('At least 2 non-empty options are required');
      return;
    }
    let correctOption: string | undefined;
    if (correctOptionIndex !== null && correctOptionIndex >= 0 && correctOptionIndex < pollOptions.length) {
      correctOption = pollOptions[correctOptionIndex].trim();
      if (!correctOption) {
        toast.error('Selected correct option is empty');
        return;
      }
    }
    try {
      const res = await schoolLive.createPoll(id, q, filteredOptions, correctOption);
      setActivePoll(res);
      const initialResults: Record<string, number> = {};
      for (const opt of res.options || []) {
        initialResults[opt] = 0;
      }
      setPollResults(initialResults);
      setPollQuestion('');
      setPollOptions(['', '']);
      setCorrectOptionIndex(null);
      setActiveTab('polls');
      toast.success('Poll launched successfully!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to launch poll');
    }
  };

  const terminatePoll = async () => {
    if (!activePoll) return;
    try {
      await schoolLive.endPoll(id, activePoll.id);
      setActivePoll(null);
      setPollResults({});
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
      toast.success('Poll ended');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to end poll');
    }
  };

  const endClass = async () => {
    setEnding(true);
    try {
      await schoolLive.endLecture(id);
      setLive(false);
      setLectureStatus('ENDED');
      toast.success('Live class ended');
      navigate('/school/teacher/classes');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to end the class');
      setEnding(false);
    }
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    socketRef.current?.emit('chat', { text: text.slice(0, 300) });
    setDraft('');
  };

  useEffect(() => {
    schoolLive.getChatHistory(id).then(setMessages).catch(() => undefined);
    const hydrateParticipants = () => schoolLive.getActiveParticipants(id)
      .then((rows) => {
        if (rows.length) {
          setStudents(rows);
          setHands(raisedHandsFromStudents(rows));
        }
        setViewerCount((count) => Math.max(count, rows.length));
      })
      .catch(() => undefined);
    hydrateParticipants();
    schoolLive.getActivePoll(id)
      .then((res) => {
        if (res) {
          setActivePoll(res.poll);
          setPollResults(res.results);
        }
      })
      .catch(() => undefined);
    schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    schoolLive.getStreamUrl(id)
      .then((r) => {
        let s = r.status as 'SCHEDULED' | 'LIVE' | 'ENDED';
        if (s === 'SCHEDULED' && r.createdAt) {
          const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
          if (new Date(r.createdAt) < todayMidnight) s = 'ENDED';
        }
        setLectureStatus(s);
        setLive(s === 'LIVE');
        setLectureTitle(r.title || '');
        if (r.startedAt) {
          setStartedAt(new Date(r.startedAt).getTime());
        }
      })
      .catch((err: any) => {
        const status = err?.response?.status ?? err?.status;
        setLectureStatus(status === 404 ? 'ENDED' : 'SCHEDULED');
      });
  }, [id]);

  useEffect(() => {
    if (lectureStatus === null || lectureStatus === 'ENDED') return;
    const timer = setInterval(() => {
      schoolLive.getActiveParticipants(id)
        .then((rows) => {
          if (rows.length) {
            setStudents(rows);
            setHands(raisedHandsFromStudents(rows));
          }
          setViewerCount((count) => Math.max(count, rows.length));
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [id, lectureStatus]);

  useEffect(() => {
    if (lectureStatus === null || lectureStatus === 'ENDED') return;
    const socket = createLiveSocket();
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('teacher-join', { token: getLiveToken(), lectureId: id }));
    socket.on('teacher-joined', ({ viewerCount, students = [] }: { viewerCount: number; students?: (LiveStudent & { handRaised?: boolean })[] }) => {
      setViewerCount(viewerCount); setLive(true); setStartedAt((s) => s ?? Date.now());
      if (students.length) {
        setStudents(students);
        setHands(raisedHandsFromStudents(students));
      }
    });
    socket.on('viewerCount', ({ count }: { count: number }) => setViewerCount(count));
    socket.on('participants', ({ students = [] }: { students?: (LiveStudent & { handRaised?: boolean })[] }) => {
      if (students.length) {
        setStudents(students);
        setHands(raisedHandsFromStudents(students));
      } else {
        setStudents([]);
        setHands([]);
      }
    });
    socket.on('stream-started', () => { setLive(true); setStartedAt((s) => s ?? Date.now()); });
    socket.on('stream-ended', () => { setLive(false); setStudents([]); setHands([]); setLectureStatus('ENDED'); });
    socket.on('chat', (m: LiveChatMessage) => setMessages((prev) => [...prev.slice(-200), m]));
    socket.on('reaction', ({ emoji }: { emoji: string }) => pushReaction(emoji));
    socket.on('hand-raised', ({ userId, userName, raised }: RaisedHand & { raised: boolean }) => {
      setHands((prev) => raised
        ? (prev.some((h) => h.userId === userId) ? prev : [...prev, { userId, userName }])
        : prev.filter((h) => h.userId !== userId));
    });
    socket.on('poll-created', ({ poll }: { poll: any }) => {
      setActivePoll(poll);
      const initialResults: Record<string, number> = {};
      for (const opt of poll.options) {
        initialResults[opt] = 0;
      }
      setPollResults(initialResults);
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    });
    socket.on('poll-results', ({ pollId, results }: { pollId: string; results: Record<string, number> }) => {
      setPollResults(results);
    });
    socket.on('poll-ended', () => {
      setActivePoll(null);
      setPollResults({});
      schoolLive.listPolls(id).then(setPastPolls).catch(() => undefined);
    });
    return () => { socket.disconnect(); };
  }, [id, lectureStatus]);

  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(() => {
    if (messages.length) chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const duration = useMemo(() => {
    if (!startedAt) return '00:00';
    const s = Math.max(0, Math.floor((now - startedAt) / 1000));
    const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
    return (hh ? `${String(hh).padStart(2, '0')}:` : '') + `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }, [now, startedAt]);

  const handleNavClick = (path: string) => {
    if (live) {
      if (window.confirm("Leaving this page will disconnect the live class. Are you sure you want to navigate away?")) {
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  if (lectureStatus === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-500">Loading Live Classroom...</p>
        </div>
      </div>
    );
  }

  if (lectureStatus === 'ENDED') return <PostClassSummary id={id} />;

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-slate-800 overflow-hidden font-sans">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => handleNavClick('/school/teacher/classes')}
              className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 truncate">{lectureTitle || 'Live Classroom'}</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                {live ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 animate-ping opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-red-600 font-bold">STREAM LIVE</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    <span>OFFLINE</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`h-10 px-4 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs active:scale-95 ${
                isRightPanelOpen
                  ? 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100/80 shadow-sm shadow-blue-500/5'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title={isRightPanelOpen ? 'Hide Right Panel' : 'Show Right Panel'}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{isRightPanelOpen ? 'Hide Panel' : 'Show Panel'}</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-700">{duration}</span>
            </div>
            <button
              onClick={() => setConfirmEnd(true)}
              className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-black text-white hover:bg-red-700 transition shadow-md shadow-red-600/10 active:scale-95"
            >
              End Class
            </button>
          </div>
        </header>

        {/* Dashboard Panels Layout */}
        <div className="flex-1 flex min-h-0">
          
          {/* Main Stage Component (Video + Controls) */}
          <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto min-w-0">
            
            {/* Prominent Live Video Streaming Container */}
            <div className="flex-1 min-h-[350px] relative rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
              <FloatingReactionLayer items={reactions} />
              
              {isScreenSharing && live ? (
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : (
                <div className="text-center p-6 max-w-sm">
                  <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 text-white/50">
                    <Monitor className="h-10 w-10 text-blue-500 animate-pulse" />
                  </div>
                  <h4 className="text-white font-bold text-sm">Screen Share is Inactive</h4>
                  <p className="text-xs text-white/40 mt-1">Click "Start Screen Share" below to broadcast your screen directly to the class stream.</p>
                </div>
              )}

              {/* Status Info Card Overlaid on Video */}
              <div className="absolute top-4 left-4 z-10 flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
                  <Users className="h-3.5 w-3.5 text-blue-400" />
                  {viewerCount} Watching
                </span>
                {isScreenSharing && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-lg text-[10px] font-black uppercase tracking-wider">
                    <Monitor className="h-3.5 w-3.5 animate-pulse" />
                    Screen Share Active
                  </span>
                )}
              </div>
            </div>

            {/* Video Control Bar below video container */}
            <div className="flex justify-center items-center gap-4 bg-white border border-slate-200/60 rounded-2xl px-6 py-3.5 shadow-md shadow-slate-100 max-w-xs mx-auto w-full">
              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100/80 text-blue-600 font-black text-xs transition active:scale-95 shadow-sm shadow-blue-500/5"
              >
                <Monitor className="h-4 w-4" />
                <span>{isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}</span>
              </button>
            </div>
          </div>

          {/* Right Tabbed Panel (Chat, Participants, Polls, Hands) */}
          {isRightPanelOpen && (
            <div className="w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-10">
            {/* Elegant Tab Headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-xs font-black transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-xs font-black transition-all relative ${
                  activeTab === 'participants'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Students
                {students.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('polls')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-xs font-black transition-all relative ${
                  activeTab === 'polls'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Polls
                {activePoll && (
                  <span className="absolute top-1.5 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('hands')}
                className={`flex-1 py-2 px-1 rounded-xl text-center text-xs font-black transition-all relative ${
                  activeTab === 'hands'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Hands
                {hands.length > 0 && (
                  <span className="absolute top-1 right-2 bg-amber-500 text-white rounded-full text-[8px] font-black h-4 px-1 min-w-[16px] flex items-center justify-center border border-white animate-bounce">
                    {hands.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* Tab 1: Live Chat */}
              {activeTab === 'chat' && (
                <div className="flex flex-1 flex-col overflow-hidden min-h-0 bg-slate-50/50">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold">No messages yet.</p>
                      </div>
                    ) : (
                      messages.map((m, i) => (
                        <div key={m.id} className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-bold text-slate-500">{m.userName}</span>
                            <span className="text-[9px] text-slate-400">
                              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <div className={`rounded-2xl rounded-tl-none px-3.5 py-2 text-xs text-slate-700 shadow-sm border border-slate-100 ${
                            i % 2 === 0 ? 'bg-white' : 'bg-blue-50/50 border-blue-50/30'
                          }`}>
                            {m.text}
                          </div>
                        </div>
                      ))
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
                        placeholder="Message student stream…"
                        className="flex-1 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                      <button
                        onClick={send}
                        disabled={!draft.trim()}
                        className="h-10 w-10 shrink-0 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 active:scale-95 shadow-md shadow-blue-600/10"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Students List */}
              {activeTab === 'participants' && (
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Connected Students</h4>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                      {students.length} Total
                    </span>
                  </div>
                  {students.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">No students have joined yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {students.map((student) => (
                        <div
                          key={student.userId}
                          className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 px-3.5 py-2.5 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {student.userName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-700 truncate">{student.userName}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(student as any).handRaised && (
                              <span className="text-amber-500 animate-bounce text-xs font-bold">✋</span>
                            )}
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Polls Creator & Management */}
              {activeTab === 'polls' && (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-slate-50/20">
                  {activePoll ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 shadow-sm">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Active Poll</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-4">{activePoll.question}</h4>
                      
                      <div className="space-y-3">
                        {activePoll.options.map((opt) => {
                          const count = pollResults[opt] || 0;
                          const total = Object.values(pollResults).reduce((a, b) => a + b, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const isCorrect = activePoll.correctOption === opt;

                          return (
                            <div key={opt} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-slate-700">
                                <span className="truncate pr-2 flex items-center gap-1">
                                  {opt}
                                  {isCorrect && (
                                    <span className="rounded bg-emerald-100 px-1 py-0.2 text-[8px] font-black text-emerald-700">✓ Correct</span>
                                  )}
                                </span>
                                <span className="shrink-0">{count} ({pct}%)</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50">
                                <div
                                  className={`h-full transition-all duration-500 ${isCorrect ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        onClick={terminatePoll}
                        className="w-full mt-5 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-black text-white transition active:scale-95 shadow-md shadow-rose-600/10"
                      >
                        End Poll
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                      <div>
                        <label className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400">Poll Question</label>
                        <input
                          type="text"
                          placeholder="e.g. Do you understand integration?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Options</label>
                          <span className="text-[9px] font-bold text-slate-400">Select correct (optional)</span>
                        </div>
                        
                        <div className="space-y-2">
                          {pollOptions.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correctOptionIndex"
                                checked={correctOptionIndex === idx}
                                onChange={() => setCorrectOptionIndex(idx)}
                                title="Mark as correct answer"
                                className="h-4 w-4 cursor-pointer border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => updateOptionValue(idx, e.target.value)}
                                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  onClick={() => removeOptionField(idx)}
                                  className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {pollOptions.length < 6 && (
                          <button
                            onClick={addOptionField}
                            className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-xs font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                      <button
                        onClick={launchPoll}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-black text-white transition active:scale-95 shadow-md shadow-blue-600/10"
                      >
                        Launch Poll
                      </button>
                    </div>
                  )}

                  {/* Past Polls list */}
                  {pastPolls.filter((p) => p.status === 'ENDED').length > 0 && (
                    <div className="border-t border-slate-100 pt-4">
                      <h5 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Past Polls ({pastPolls.filter((p) => p.status === 'ENDED').length})
                      </h5>
                      <div className="space-y-3 pr-1">
                        {pastPolls.filter((p) => p.status === 'ENDED').map((p) => {
                          const results = p.results || {};
                          const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                          return (
                            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                              <h6 className="text-xs font-bold text-slate-800 mb-2">{p.question}</h6>
                              <div className="space-y-2">
                                {p.options.map((opt) => {
                                  const count = results[opt] || 0;
                                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                  const isCorrect = p.correctOption === opt;
                                  const hasCorrect = !!p.correctOption;
                                  const barColor = hasCorrect ? (isCorrect ? 'bg-emerald-500' : 'bg-rose-500') : 'bg-slate-400';

                                  return (
                                    <div key={opt} className="space-y-0.5">
                                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                        <span className="truncate pr-1.5 flex items-center gap-1">
                                          {opt}
                                          {isCorrect && (
                                            <span className="rounded bg-emerald-50 px-1 py-0.2 text-[8px] font-black text-emerald-600">✓ Correct</span>
                                          )}
                                        </span>
                                        <span className="shrink-0">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
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
                  )}
                </div>
              )}

              {/* Tab 4: Hand Raise Queue */}
              {activeTab === 'hands' && (
                <div className="p-4 space-y-2.5 flex-1 overflow-y-auto bg-slate-50/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raised Hands</h4>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                      {hands.length} Raised
                    </span>
                  </div>
                  {hands.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Hand className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold">No students raising hands.</p>
                    </div>
                  ) : (
                    hands.map((h) => (
                      <div
                        key={h.userId}
                        className="flex items-center justify-between rounded-xl bg-amber-50/50 hover:bg-amber-50 border border-amber-100/50 px-3.5 py-3 transition"
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold text-slate-800">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-700 font-bold uppercase shrink-0">
                            {h.userName.charAt(0)}
                          </span>
                          <span className="truncate">{h.userName}</span>
                        </span>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="animate-bounce text-xs font-bold">✋</span>
                          <button
                            onClick={() => setHands((p) => p.filter((x) => x.userId !== h.userId))}
                            className="text-[10px] font-black text-amber-700 bg-amber-100 hover:bg-amber-200/80 px-2 py-1 rounded-lg"
                          >
                            Lower
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </div>
          )}
        </div>


      {/* End Class Confirmation Dialog */}
      {confirmEnd && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setConfirmEnd(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">End live class?</h3>
              <button onClick={() => setConfirmEnd(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-5 text-xs font-semibold text-slate-500 leading-relaxed">This will end the class stream and disconnect all connected students. Make sure to stop streaming in OBS to release encoder.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmEnd(false)}
                disabled={ending}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={endClass}
                disabled={ending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-black text-white shadow-md shadow-red-600/10"
              >
                {ending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Ending…</> : 'End Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
