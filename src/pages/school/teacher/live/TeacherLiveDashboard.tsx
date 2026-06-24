import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import {
  Hand, Radio, Users, X, Loader2, ArrowLeft, MessageSquare,
  Clock, BarChart2, Smile, UserCheck, ChevronDown, ChevronUp,
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
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);

  useEffect(() => {
    // Fetch stats and chat independently — if stats fails (e.g. older backend),
    // we still show the chat history.
    schoolLive.getChatHistory(id)
      .then(setMessages)
      .catch(() => undefined);

    schoolLive.getStats(id)
      .then(setStats)
      .catch(() => {
        // Stats endpoint not available yet — show partial UI with chat only
        toast.error('Stats unavailable — please restart the backend to enable full summary.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Degrade gracefully — show chat even without stats
  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
        <button onClick={() => navigate('/school/teacher/classes')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
        </button>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Stats unavailable — restart the backend to enable full post-class analytics.
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-900">Chat History</span>
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{messages.length}</span>
          </div>
          <div className="h-72 space-y-1.5 overflow-y-auto bg-gray-900 p-4">
            {messages.length === 0
              ? <p className="py-10 text-center text-sm text-white/40">No chat messages during this class.</p>
              : messages.map((m, i) => (
                  <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${i % 2 ? 'bg-white/5' : 'bg-white/[0.03]'}`}>
                    <span className="mr-2 font-bold text-blue-300">{m.userName}</span>
                    <span className="text-white/90">{m.text}</span>
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/school/teacher/classes')}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
          </button>
          <h1 className="text-xl font-black text-slate-900">{stats.title}</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {classDate} · {startTime} – {endTime}
            {stats.teacherName && <> · <span className="font-semibold text-slate-600">{stats.teacherName}</span></>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">
          Class Ended
        </span>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Clock className="h-5 w-5 text-violet-500" />}
          label="Duration"
          value={classDuration}
          sub={`${startTime} – ${endTime}`}
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5 text-blue-500" />}
          label="Students Joined"
          value={String(stats.totalParticipants)}
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5 text-emerald-500" />}
          label="Chat Messages"
          value={String(stats.totalMessages)}
        />
        <StatCard
          icon={<Smile className="h-5 w-5 text-amber-500" />}
          label="Reactions"
          value={String(stats.totalReactions)}
        />
      </div>

      {/* Reactions breakdown */}
      {stats.reactionBreakdown.length > 0 && (
        <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Reactions</p>
          <div className="flex flex-wrap gap-3">
            {stats.reactionBreakdown.map((r) => (
              <div key={r.emoji} className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5">
                <span className="text-2xl leading-none">{r.emoji}</span>
                <span className="text-lg font-black text-slate-800">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Participants */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <button
          onClick={() => setParticipantsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-black text-slate-900">Students Who Joined</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">{stats.totalParticipants}</span>
          </div>
          {participantsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {participantsOpen && (
          <div className="border-t border-slate-100">
            {stats.participants.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No participation data recorded for this class.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {/* Table header */}
                <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Student</span>
                  <span className="text-center">Joined at</span>
                  <span className="text-right">Watch time</span>
                </div>
                {stats.participants.map((p) => (
                  <div key={p.userId} className="grid grid-cols-3 items-center px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-black text-brand-700">
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

      {/* Chat history */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-black text-slate-900">Chat History</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">{messages.length}</span>
          </div>
          {chatOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {chatOpen && (
          <div className="border-t border-slate-100">
            {messages.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">No chat messages during this class.</p>
            ) : (
              <div className="h-72 space-y-1.5 overflow-y-auto bg-gray-900 p-4">
                {messages.map((m, i) => (
                  <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${i % 2 ? 'bg-white/5' : 'bg-white/[0.03]'}`}>
                    <span className="mr-2 font-bold text-blue-300">{m.userName}</span>
                    <span className="text-white/90">{m.text}</span>
                    <span className="ml-2 text-[10px] text-white/30">{fmtTime(m.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
  const [sidePanel, setSidePanel] = useState<'students' | 'hands'>('students');
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const { items: reactions, push: pushReaction } = useFloatingReactions();

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
    schoolLive.getStreamUrl(id)
      .then((r) => {
        let s = r.status as 'SCHEDULED' | 'LIVE' | 'ENDED';
        // A SCHEDULED class whose creation date is before today never went live — treat as ended.
        if (s === 'SCHEDULED' && r.createdAt) {
          const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
          if (new Date(r.createdAt) < todayMidnight) s = 'ENDED';
        }
        setLectureStatus(s);
        setLive(s === 'LIVE');
      })
      .catch(() => setLectureStatus('SCHEDULED'));
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
    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureStatus]);

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

  if (lectureStatus === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Ended → rich post-class summary ──────────────────────────────────────
  if (lectureStatus === 'ENDED') return <PostClassSummary id={id} />;

  // ── Active live dashboard ─────────────────────────────────────────────────
  return (
    <div className="bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${live ? 'bg-red-500 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
            <Radio className="h-3.5 w-3.5" /> {live ? 'LIVE' : 'OFFLINE'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
            <Users className="h-3.5 w-3.5 text-blue-500" /> {viewerCount} watching
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-mono text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">⏱ {duration}</span>
        </div>
        <button onClick={() => setConfirmEnd(true)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700">End Stream</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="relative flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-gray-900 lg:col-span-2 lg:h-[72vh] dark:border-slate-800">
          <FloatingReactionLayer items={reactions} />
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-white">
            <span className="text-sm font-bold">Live Chat</span>
            <span className="text-xs text-white/50">read-only</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {messages.length === 0 && <p className="py-10 text-center text-sm text-white/40">No messages yet.</p>}
            {messages.map((m, i) => (
              <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${i % 2 ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
                <span className="font-bold text-blue-300">{m.userName}</span>{' '}
                <span className="text-white/90">{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="flex h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[72vh] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <button
              onClick={() => setSidePanel('students')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${
                sidePanel === 'students'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" />
              Students
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{students.length}</span>
            </button>
            <button
              onClick={() => setSidePanel('hands')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition ${
                sidePanel === 'hands'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Hand className="h-4 w-4" />
              Raised Hands
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{hands.length}</span>
            </button>
          </div>
          {sidePanel === 'students' && <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {students.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No students joined yet.</p>}
            {students.map((student) => (
              <div key={student.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{student.userName.charAt(0).toUpperCase()}</span>
                  <span className="truncate">{student.userName}</span>
                </span>
                {(student as any).handRaised && (
                  <span className="text-amber-500 animate-bounce">✋</span>
                )}
              </div>
            ))}
          </div>}
          {sidePanel === 'hands' && <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {hands.length === 0 && <p className="py-10 text-center text-sm text-slate-400">No raised hands.</p>}
            {hands.map((h) => (
              <div key={h.userId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">{h.userName.charAt(0).toUpperCase()}</span>
                  {h.userName} <span className="animate-bounce">✋</span>
                </span>
                <button onClick={() => setHands((p) => p.filter((x) => x.userId !== h.userId))} className="text-xs font-bold text-slate-400 hover:text-red-500">Lower</button>
              </div>
            ))}
          </div>}
        </div>
      </div>

      {confirmEnd && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && setConfirmEnd(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white">End this live class?</h3>
              <button onClick={() => setConfirmEnd(false)} className="text-slate-400"><X className="h-5 w-5" /></button>
            </div>
            <p className="mb-5 text-sm text-slate-500">This ends the class for all students now. Also stop streaming in OBS to free the encoder.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmEnd(false)} disabled={ending} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={endClass} disabled={ending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
                {ending ? <><Loader2 className="h-4 w-4 animate-spin" /> Ending…</> : 'End Live Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
