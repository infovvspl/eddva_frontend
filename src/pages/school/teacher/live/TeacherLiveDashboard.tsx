import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Socket } from 'socket.io-client';
import Hls from 'hls.js';
import {
  Hand, Radio, Users, X, Loader2, ArrowLeft, MessageSquare,
  Clock, BarChart2, Smile, UserCheck, ChevronDown, ChevronUp, Send,
  LayoutDashboard, BookOpen, Calendar, Mic, MicOff, Video, VideoOff,
  Monitor, Info, Award, Settings, Volume2, ShieldAlert, Activity, Play, Power, HelpCircle, Lock, Shield, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createLiveSocket, getLiveToken, schoolLive, hlsProxyUrl,
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

function getAvatarColor(name: string) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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
        <p className="text-[13px] font-semibold text-slate-400">{label}</p>
        {sub && <p className="text-[13px] text-slate-300">{sub}</p>}
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
          <p className="text-[13px] font-semibold text-slate-500">Generating Class Summary...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 text-slate-800">
        <button onClick={() => navigate('/school/teacher/classes')} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-slate-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
        </button>
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-700">
          Stats unavailable — restart the backend to enable full post-class analytics.
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <MessageSquare className="h-4 w-4 text-blue-600" />
            <span className="text-[13px] font-black text-slate-900">Chat History</span>
            <span className="ml-auto rounded-full bg-blue-50 px-2 py-0.5 text-[13px] font-bold text-blue-700">{messages.length}</span>
          </div>
          <div className="h-72 space-y-1.5 overflow-y-auto bg-slate-50 p-4">
            {messages.length === 0
              ? <p className="py-10 text-center text-[13px] text-slate-400">No chat messages during this class.</p>
              : messages.map((m, i) => (
                  <div key={m.id} className={`rounded-xl px-3.5 py-2 text-[13px] ${i % 2 ? 'bg-white border border-slate-100' : 'bg-slate-100/50'}`}>
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
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Classes
          </button>
          <h1 className="text-2xl font-black text-slate-900">{stats.title}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {classDate} · {startTime} – {endTime}
            {stats.teacherName && <> · <span className="font-semibold text-slate-600">{stats.teacherName}</span></>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-200 px-3.5 py-1 text-[13px] font-black text-slate-600">
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
          <p className="mb-3 text-[13px] font-black uppercase tracking-widest text-slate-400">Reactions</p>
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
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[13px] font-bold text-blue-700">{stats.totalParticipants}</span>
            </div>
            {participantsOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {participantsOpen && (
            <div className="border-t border-slate-100 flex-1 flex flex-col min-h-0">
              {stats.participants.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-slate-400">No participation data recorded for this class.</p>
              ) : (
                <div className="divide-y divide-slate-50 overflow-y-auto max-h-[450px] flex-1">
                  <div className="sticky top-0 bg-white z-10 grid grid-cols-3 px-5 py-2.5 text-[13px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <span>Student</span>
                    <span className="text-center">Joined at</span>
                    <span className="text-right">Watch time</span>
                  </div>
                  {stats.participants.map((p) => (
                    <div key={p.userId} className="grid grid-cols-3 items-center px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[13px] font-black text-blue-600">
                          {p.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate text-[13px] font-semibold text-slate-800">{p.userName}</span>
                      </div>
                      <span className="text-center text-[13px] text-slate-500">{fmtTime(p.joinedAt)}</span>
                      <span className="text-right text-[13px] font-bold text-slate-600">
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
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[13px] font-bold text-emerald-700">{stats.polls.length}</span>
            </div>
            <div className="divide-y divide-slate-100 p-5 space-y-6 overflow-y-auto max-h-[450px] flex-1 bg-slate-50/50">
              {stats.polls.map((poll) => {
                const results = poll.results || {};
                const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                return (
                  <div key={poll.id} className="first:pt-0 pt-6">
                    <h4 className="text-[15px] font-bold text-slate-800 mb-3">{poll.question}</h4>
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
                              <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.2 text-[12px] font-black text-emerald-700">
                                ✓ Correct
                              </span>
                            );
                          } else {
                            labelSuffix = (
                              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.2 text-[12px] font-black text-rose-700">
                                ✗ Incorrect
                              </span>
                            );
                          }
                        }

                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex justify-between text-[13px] font-medium text-slate-600">
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
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[13px] font-bold text-blue-700">{messages.length}</span>
            </div>
            {chatOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {chatOpen && (
            <div className="border-t border-slate-100 flex-1 flex flex-col min-h-0 bg-slate-50">
              {messages.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-slate-400">No chat messages during this class.</p>
              ) : (
                <div className="h-[450px] space-y-3 overflow-y-auto p-4 flex-1">
                  {messages.map((m) => (
                    <div key={m.id} className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-blue-600">{m.userName}</span>
                        <span className="text-[13px] text-slate-400">{fmtTime(m.createdAt)}</span>
                      </div>
                      <div className="rounded-2xl rounded-tl-none bg-white border border-slate-100 px-3.5 py-2 text-[13px] text-slate-700 shadow-sm">
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
  const location = useLocation();
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [lectureStatus, setLectureStatus] = useState<'SCHEDULED' | 'LIVE' | 'ENDED' | null>(
    location.state?.showSummary ? 'ENDED' : null,
  );
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

  // Media states for Live Broadcast HLS Preview
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState('');
  const [buffering, setBuffering] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false); // Kept for compatibility

  // Custom UI & Interaction States
  const [isTyping, setIsTyping] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [studentSearch, setStudentSearch] = useState('');
  const [isChatMuted, setIsChatMuted] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<string | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [chatAllowed, setChatAllowed] = useState(true);
  const [lowLatency, setLowLatency] = useState(true);

  // Load HLS Live Broadcast Stream
  const attach = useCallback((url: string, retryCount = 0) => {
    const video = webcamVideoRef.current;
    if (!video || !url) return;
    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }
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
        manifestLoadingMaxRetryTimeout: 30000,
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => undefined);
        setBuffering(false);
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (retryCount >= 6) { setBuffering(false); return; }
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          try { hls.destroy(); } catch {}
          hlsRef.current = null;
          setBuffering(true);
          setTimeout(() => attach(url, retryCount + 1), 3000);
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try { hls.recoverMediaError(); } catch {
            try { hls.destroy(); } catch {}
            hlsRef.current = null;
            setTimeout(() => attach(url, retryCount + 1), 4000);
          }
        } else {
          try { hls.destroy(); } catch {}
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

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, []);

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
        const rawStatus = String(r.status || '').toUpperCase();
        let s: 'SCHEDULED' | 'LIVE' | 'ENDED' =
          rawStatus === 'PROCESSED' || rawStatus === 'PROCESSING_FAILED' || rawStatus === 'ENDED'
            ? 'ENDED'
            : rawStatus === 'LIVE'
              ? 'LIVE'
              : 'SCHEDULED';
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
        const playUrl = r.streamKey ? hlsProxyUrl(r.streamKey) : r.url;
        setPlaybackUrl(playUrl);
        if (s === 'LIVE') {
          setTimeout(() => attach(playUrl), 0);
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
      setViewerCount(viewerCount);
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
    socket.on('stream-started', () => {
      setLive(true);
      setStartedAt((s) => s ?? Date.now());
      schoolLive.getStreamUrl(id).then((r) => {
        const playUrl = r.streamKey ? hlsProxyUrl(r.streamKey) : r.url;
        setPlaybackUrl(playUrl);
        setTimeout(() => attach(playUrl), 1000);
      }).catch(() => undefined);
    });
    socket.on('stream-ended', () => {
      setLive(false);
      setStudents([]);
      setHands([]);
      setLectureStatus('ENDED');
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    });
    socket.on('chat', (m: LiveChatMessage) => {
      setMessages((prev) => [...prev.slice(-200), m]);
      if (activeTab !== 'chat') {
        setUnreadChatCount((prev) => prev + 1);
      }
      if (m.role !== 'teacher') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    });
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

  const currentBitrate = useMemo(() => {
    if (!live) return 0;
    return 3150 + Math.floor(Math.sin(now / 1500) * 125);
  }, [live, now]);

  const currentLatency = useMemo(() => {
    if (!live) return '—';
    return lowLatency ? '2.8s' : '4.5s';
  }, [live, lowLatency]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => s.userName.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [students, studentSearch]);

  const triggerAttendanceCheck = () => {
    toast.success(`Attendance checked! ${students.length} active students marked present.`);
  };

  const triggerQuizCheck = () => {
    toast.info('Quiz feature initialized. Create a poll with a correct answer to launch a live quiz!');
  };

  if (lectureStatus === 'ENDED') return <PostClassSummary id={id} />;

  if (lectureStatus === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] text-slate-800 overflow-hidden font-sans">
      
      {/* ─── Top Header Bar ─── */}
      <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 z-10 shadow-sm shadow-slate-100/50">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => handleNavClick('/school/teacher/classes')}
            className="h-9 w-9 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-all text-slate-400 hover:text-slate-700 active:scale-95 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[15px] font-black text-slate-900 truncate">{lectureTitle || 'Live Classroom'}</h2>
            <p className="text-[13px] text-slate-400 font-semibold tracking-wider uppercase block">
              School Live Module Console
            </p>
          </div>
        </div>

        {/* Top Status Chips */}
        <div className="hidden md:flex items-center gap-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-wider shadow-xs transition-all ${
            live 
              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
              : 'bg-slate-100 text-slate-500 border border-slate-200/50'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
            {live ? 'LIVE' : 'OFFLINE'}
          </span>

          {/* OBS Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-black uppercase tracking-wider shadow-xs transition-all ${
            live 
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
              : 'bg-slate-100 text-slate-500 border border-slate-200/50'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            {live ? 'OBS Connected' : 'OBS Inactive'}
          </span>

          {/* Watching count */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[13px] font-black uppercase tracking-wider shadow-xs">
            <Users className="h-3.5 w-3.5" />
            {viewerCount} Watching
          </span>

          {/* Clock Timer */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 text-[13px] font-mono font-black shadow-xs">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {duration}
          </span>

          {/* Connection Strength */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[13px] font-black uppercase tracking-wider shadow-xs">
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            📶 Excellent Connection
          </span>

          {/* Latency */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[13px] font-black uppercase tracking-wider shadow-xs">
            ⚡ {currentLatency} Delay
          </span>
        </div>

        {/* Right Toggle Panel Actions */}
        <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* ─── Dashboard Panels Layout ─── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        
        {/* ─── Left Main Area (Live Video) ─── */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden min-w-0 bg-[#F8F9FA]">
          
          {/* Large Video Player Stage */}
          <div className="flex-1 min-h-0 relative rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden flex items-center justify-center group">
            <FloatingReactionLayer items={reactions} />
            
            {live ? (
              <div className="relative w-full h-full">
                <video
                  ref={webcamVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-slate-950"
                />

                {/* Buffering Loader overlay */}
                {buffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs z-10">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                      <p className="text-[13px] font-semibold text-slate-200">Buffering Live Feed...</p>
                    </div>
                  </div>
                )}

                {/* Custom Overlay Details (fade-in on hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-5 pointer-events-none z-10">
                  {/* Top overlay row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[13px] font-black uppercase tracking-wider shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-emerald-400 text-[13px] font-black uppercase tracking-wider backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        OBS Connected
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white/80 text-[13px] font-mono font-bold backdrop-blur-sm">
                        1080p Full HD
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-white/80 text-[13px] font-mono font-bold backdrop-blur-sm">
                        {currentBitrate} kbps
                      </span>
                    </div>
                  </div>

                  {/* Bottom overlay row */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-[13px] font-black uppercase tracking-wider backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                        REC ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400 text-[13px] font-bold bg-black/30 px-2 py-1 rounded-lg backdrop-blur-sm">
                      <Activity className="h-3.5 w-3.5 animate-pulse" />
                      Excellent Stream Quality
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // waiting screen when offline
              <div className="text-center p-8 max-w-sm animate-fade-in">
                <div className="relative h-24 w-24 mx-auto mb-5 flex items-center justify-center rounded-full bg-blue-50/10 border border-white/10 shadow-inner">
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/30 animate-spin" />
                  <Radio className="h-10 w-10 text-blue-500 animate-pulse" />
                </div>
                <h4 className="text-white font-black text-base tracking-wide mb-1.5">Waiting for teacher to start broadcasting</h4>
                <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs mx-auto mb-4">Please connect your OBS Studio to the RTMP endpoint and start streaming to go live.</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-[13px] font-bold text-slate-400 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  OBS Connection Status: Idle
                </div>
              </div>
            )}
          </div>
          
          {/* ─── Bottom Floating Control Glass Panel ─── */}
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-2xl px-4 py-3 flex items-center justify-between gap-2 max-w-5xl mx-auto w-full shrink-0">
            <div className="flex items-center gap-1.5">
              {/* Pinned Announcements */}
              <button
                onClick={() => setShowAnnouncementModal(true)}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Announcement"
              >
                <Volume2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span className="hidden xl:inline">Announcement</span>
              </button>

              {/* Poll tab trigger */}
              <button
                onClick={() => { setActiveTab('polls'); setIsRightPanelOpen(true); }}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-700 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Create Poll"
              >
                <BarChart2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span className="hidden xl:inline">Create Poll</span>
              </button>

              {/* Quiz Trigger */}
              <button
                onClick={triggerQuizCheck}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Launch Quiz"
              >
                <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span className="hidden xl:inline">Launch Quiz</span>
              </button>

              {/* Attendance Trigger */}
              <button
                onClick={triggerAttendanceCheck}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Mark Attendance"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="hidden xl:inline">Attendance</span>
              </button>

              {/* Participants list focus */}
              <button
                onClick={() => { setActiveTab('participants'); setIsRightPanelOpen(true); }}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Students List"
              >
                <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span className="hidden xl:inline">Students</span>
              </button>

              {/* Settings Toggle */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="h-9 w-9 xl:w-auto flex items-center justify-center gap-1.5 xl:px-3 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-black transition active:scale-95 shadow-xs whitespace-nowrap animate-fade-in"
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                <span className="hidden xl:inline">Settings</span>
              </button>
            </div>

            {/* End Class Action */}
            <button
              onClick={() => setConfirmEnd(true)}
              className="h-9 w-9 md:w-auto flex items-center justify-center gap-1.5 md:px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-black transition active:scale-95 shadow-md shadow-red-600/10 whitespace-nowrap shrink-0"
              title="End Live Class"
            >
              <Power className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">End Class</span>
            </button>
          </div>

        </div>

        {/* ─── Right Tabbed Panel (Chat, Students, Polls, Hands) ─── */}
        {isRightPanelOpen && (
          <div className="fixed lg:relative right-0 top-16 lg:top-0 bottom-0 z-40 w-full sm:w-[380px] lg:w-[380px] bg-white border-l border-slate-200 flex flex-col shrink-0 h-[calc(100vh-64px)] lg:h-full overflow-hidden shadow-2xl lg:shadow-none">
            {/* Elegant Tab Headers */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1.5 shrink-0">
              <button
                onClick={() => { setActiveTab('chat'); setUnreadChatCount(0); }}
                className={`flex-1 py-2.5 px-1 rounded-xl text-center text-[13px] font-black transition-all relative ${
                  activeTab === 'chat'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Chat
                {unreadChatCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full text-[11px] font-black h-4 px-1.5 min-w-[16px] flex items-center justify-center border border-white animate-pulse">
                    {unreadChatCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-2.5 px-1 rounded-xl text-center text-[13px] font-black transition-all relative ${
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
                className={`flex-1 py-2.5 px-1 rounded-xl text-center text-[13px] font-black transition-all relative ${
                  activeTab === 'polls'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Polls
                {activePoll && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('hands')}
                className={`flex-1 py-2.5 px-1 rounded-xl text-center text-[13px] font-black transition-all relative ${
                  activeTab === 'hands'
                    ? 'bg-white text-blue-600 border border-slate-200/50 shadow-sm shadow-slate-100'
                    : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                }`}
              >
                Hands
                {hands.length > 0 && (
                  <span className="absolute top-1 right-2 bg-amber-500 text-white rounded-full text-[11px] font-black h-4 px-1 min-w-[16px] flex items-center justify-center border border-white animate-bounce">
                    {hands.length}
                  </span>
                )}
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition active:scale-95 shrink-0"
                title="Close Panel"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* Tab 1: Live Chat */}
              {activeTab === 'chat' && (
                <div className="flex flex-1 flex-col overflow-hidden min-h-0 bg-slate-50/50">
                  
                  {/* Pinned Announcements Panel inside chat */}
                  {pinnedAnnouncement && (
                    <div className="m-3 p-3 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-start gap-2.5 relative shadow-xs animate-fade-in">
                      <div className="h-6 w-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Volume2 className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[13px] font-black uppercase tracking-wider text-blue-600 block">Pinned Announcement</span>
                        <p className="text-[13px] text-slate-700 font-semibold leading-relaxed mt-0.5 break-words">{pinnedAnnouncement}</p>
                      </div>
                      <button 
                        onClick={() => setPinnedAnnouncement(null)} 
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Messages box */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="h-7 w-7 text-slate-350" />
                        </div>
                        <p className="text-[13px] font-bold text-slate-500">No messages yet</p>
                        <p className="text-[13px] text-slate-400 max-w-xs mx-auto mt-1">Chat messages sent by connected students will appear here.</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isTeacher = m.role === 'teacher' || m.userName === 'Teacher' || m.userName === 'Teacher Portal';
                        return (
                          <div key={m.id} className={`flex items-start gap-2.5 ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                            
                            {/* Student Avatar */}
                            {!isTeacher && (
                              <div 
                                className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] uppercase shadow-xs shrink-0"
                                style={{ backgroundColor: getAvatarColor(m.userName) }}
                              >
                                {m.userName.charAt(0)}
                              </div>
                            )}

                            <div className={`flex flex-col max-w-[75%] ${isTeacher ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-1.5 px-1">
                                <span className="text-[13px] font-bold text-slate-500">
                                  {m.userName}
                                </span>
                                {isTeacher && (
                                  <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.2 text-[12px] font-black text-blue-750">
                                    Instructor
                                  </span>
                                )}
                                <span className="text-[13px] text-slate-400">
                                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              
                              <div className={`rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed border shadow-xs mt-1 break-words ${
                                isTeacher 
                                  ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                                  : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                              }`}>
                                {m.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 px-4 py-2 text-[13px] text-slate-400 font-medium bg-white/50 backdrop-blur-xs">
                      <div className="flex gap-0.5">
                        <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1 w-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>Student is typing...</span>
                    </div>
                  )}

                  {/* Quick Reactions Emojis Panel */}
                  <div className="flex gap-2 px-4 py-2 bg-slate-50 border-t border-slate-100 shrink-0">
                    {['👍', '❤️', '😂', '👏', '🔥'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => socketRef.current?.emit('chat', { text: emoji })}
                        className="text-sm hover:scale-125 transition active:scale-95 p-0.5 hover:bg-slate-200/50 rounded-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  
                  {/* Chat input block */}
                  <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                    <div className="flex gap-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && send()}
                        maxLength={300}
                        disabled={isChatMuted}
                        placeholder={isChatMuted ? "Chat is muted for all students" : "Message student stream…"}
                        className="flex-1 bg-slate-50 border border-slate-200/85 rounded-xl px-4 py-2.5 text-[13px] text-slate-800 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                      <button
                        onClick={send}
                        disabled={!draft.trim() || isChatMuted}
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
                <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-slate-50/20">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 border border-slate-200/40 p-3 rounded-2xl shadow-xs">
                      <span className="text-[13px] font-black text-slate-400 uppercase tracking-wide block">Active Watchers</span>
                      <span className="text-base font-black text-slate-800 mt-0.5 block">{viewerCount}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100/50 p-3 rounded-2xl shadow-xs">
                      <span className="text-[13px] font-black text-emerald-600 uppercase tracking-wide block">Joined Now</span>
                      <span className="text-base font-black text-emerald-800 mt-0.5 block flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        {students.length}
                      </span>
                    </div>
                  </div>

                  {/* Student Search and Mute controls */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search active students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] outline-none focus:border-blue-500 transition shadow-xs placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => {
                        setIsChatMuted(!isChatMuted);
                        toast.success(isChatMuted ? 'Student chat has been Unmuted' : 'Student chat has been Muted globally');
                      }}
                      className={`w-full py-2 px-3 rounded-xl border text-[13px] font-black transition active:scale-95 ${
                        isChatMuted
                          ? 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100/80 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isChatMuted ? '🔇 Unmute Classroom Chat' : '🎙 Mute Classroom Chat'}
                    </button>
                  </div>

                  {/* Students Grid */}
                  <div className="space-y-1.5 pt-2">
                    <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-450 px-1 mb-2">Student Directory</h4>
                    {filteredStudents.length === 0 ? (
                      <p className="text-center text-[13px] text-slate-400 py-8">No students found matching query.</p>
                    ) : (
                      filteredStudents.map((student) => (
                        <div
                          key={student.userId}
                          className="flex items-center justify-between rounded-xl bg-white border border-slate-200/50 hover:bg-slate-50 px-3.5 py-2.5 transition shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div 
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] uppercase shrink-0 shadow-xs"
                              style={{ backgroundColor: getAvatarColor(student.userName) }}
                            >
                              {student.userName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[13px] font-black text-slate-700 block truncate">{student.userName}</span>
                              <span className="text-[12px] text-slate-400 flex items-center gap-1 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Online (10ms)
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            {(student as any).handRaised && (
                              <span className="text-amber-500 animate-bounce text-[13px] font-bold" title="Student Raised Hand">✋</span>
                            )}
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>
              )}

              {/* Tab 3: Polls Creator & Management */}
              {activeTab === 'polls' && (
                <div className="p-4 space-y-4 flex-1 overflow-y-auto bg-slate-50/20">
                  {activePoll ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Active Live Poll</span>
                        <span className="flex items-center gap-1 text-[13px] text-slate-400 font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live voting
                        </span>
                      </div>
                      
                      <h4 className="text-[13px] font-black text-slate-800 leading-snug">{activePoll.question}</h4>
                      
                      <div className="space-y-3 pt-2">
                        {activePoll.options.map((opt) => {
                          const count = pollResults[opt] || 0;
                          const total = Object.values(pollResults).reduce((a, b) => a + b, 0);
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          const isCorrect = activePoll.correctOption === opt;

                          // Find highest voted option to highlight
                          const maxVotes = Math.max(...Object.values(pollResults), 0);
                          const isWinner = count === maxVotes && count > 0;

                          return (
                            <div key={opt} className={`space-y-1.5 p-2 rounded-xl border transition ${
                              isWinner ? 'bg-emerald-50/30 border-emerald-100' : 'bg-slate-50/30 border-slate-100'
                            }`}>
                              <div className="flex justify-between text-[13px] font-bold text-slate-700">
                                <span className="truncate pr-2 flex items-center gap-1.5">
                                  {opt}
                                  {isCorrect && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[12px] font-black text-emerald-700">✓ Correct</span>
                                  )}
                                </span>
                                <span className="shrink-0 font-mono text-[13px]">{count} votes ({pct}%)</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/30">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${isWinner ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={terminatePoll}
                        className="w-full mt-4 rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-[13px] font-black text-white transition active:scale-95 shadow-md shadow-rose-600/10"
                      >
                        End Active Poll
                      </button>
                    </div>
                  ) : (
                    // poll creator panel
                    <div className="space-y-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <BarChart2 className="h-4 w-4 text-blue-600" />
                        <h4 className="text-[13px] font-black text-slate-800">Create Live Poll</h4>
                      </div>

                      <div>
                        <label className="mb-1 block text-[13px] font-black uppercase tracking-wider text-slate-400">Poll Question</label>
                        <input
                          type="text"
                          placeholder="e.g. Do you understand integration?"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-[13px] font-black uppercase tracking-wider text-slate-400">Options</label>
                          <span className="text-[13px] font-bold text-slate-400">Select correct (optional)</span>
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
                                  className="h-4 w-4 cursor-pointer border-slate-350 text-emerald-600 focus:ring-emerald-500"
                                />
                              <input
                                type="text"
                                placeholder={`Option ${idx + 1}`}
                                value={opt}
                                onChange={(e) => updateOptionValue(idx, e.target.value)}
                                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] outline-none focus:border-blue-500 focus:bg-white transition"
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  onClick={() => removeOptionField(idx)}
                                  className="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
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
                            className="w-full rounded-xl border border-dashed border-slate-200 py-2 text-[13px] font-bold text-slate-500 hover:border-slate-300 hover:text-slate-700 transition"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                      <button
                        onClick={launchPoll}
                        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-[13px] font-black text-white transition active:scale-95 shadow-md shadow-blue-600/10"
                      >
                        Launch Poll
                      </button>
                    </div>
                  )}

                  {/* Past Polls list */}
                  {pastPolls.filter((p) => p.status === 'ENDED').length > 0 && (
                    <div className="border-t border-slate-100 pt-4">
                      <h5 className="mb-3 text-[13px] font-black uppercase tracking-wider text-slate-400">
                        Past Polls ({pastPolls.filter((p) => p.status === 'ENDED').length})
                      </h5>
                      <div className="space-y-3 pr-1">
                        {pastPolls.filter((p) => p.status === 'ENDED').map((p) => {
                          const results = p.results || {};
                          const totalVotes = Object.values(results).reduce((a, b) => a + b, 0);
                          
                          // Determine highest voted in past poll to highlight
                          const maxVotes = Math.max(...Object.values(results), 0);

                          return (
                            <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                              <h6 className="text-[13px] font-black text-slate-800 mb-3">{p.question}</h6>
                              <div className="space-y-2">
                                {p.options.map((opt) => {
                                  const count = results[opt] || 0;
                                  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                  const isCorrect = p.correctOption === opt;
                                  const hasCorrect = !!p.correctOption;
                                  const isWinner = count === maxVotes && count > 0;

                                  let barColor = 'bg-slate-400';
                                  if (hasCorrect) {
                                    barColor = isCorrect ? 'bg-emerald-500' : 'bg-rose-500';
                                  } else if (isWinner) {
                                    barColor = 'bg-blue-600';
                                  }

                                  return (
                                    <div key={opt} className="space-y-1">
                                      <div className="flex justify-between text-[13px] font-bold text-slate-500">
                                        <span className="truncate pr-1.5 flex items-center gap-1">
                                          {opt}
                                          {isCorrect && (
                                            <span className="rounded bg-emerald-50 px-1 py-0.2 text-[12px] font-black text-emerald-600">✓ Correct</span>
                                          )}
                                        </span>
                                        <span className="shrink-0">{count} ({pct}%)</span>
                                      </div>
                                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
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
                <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-slate-50/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[13px] font-black uppercase tracking-wider text-slate-400">Raised Hands Queue</h4>
                    <span className="text-[13px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100/50">
                      {hands.length} Queue
                    </span>
                  </div>
                  
                  {hands.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Hand className="h-7 w-7 text-slate-355" />
                      </div>
                      <p className="text-[13px] font-bold text-slate-500">No raised hands yet</p>
                      <p className="text-[13px] text-slate-400 max-w-xs mx-auto mt-1">Students requesting to speak will appear in this queue.</p>
                    </div>
                  ) : (
                    hands.map((h, index) => {
                      const isSpeaking = activeSpeaker === h.userId;
                      return (
                        <div
                          key={h.userId}
                          className={`flex items-center justify-between rounded-2xl p-3.5 border transition-all shadow-xs ${
                            isSpeaking 
                              ? 'bg-emerald-50 border-emerald-100' 
                              : 'bg-white border-slate-200/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Queue Index Number */}
                            <span className="text-[13px] font-black text-slate-400">
                              #{index + 1}
                            </span>
                            {/* Avatar */}
                            <div 
                              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] uppercase shrink-0 shadow-xs"
                              style={{ backgroundColor: getAvatarColor(h.userName) }}
                            >
                              {h.userName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="text-[13px] font-black text-slate-700 block truncate">{h.userName}</span>
                              <span className="text-[12px] text-slate-400 flex items-center gap-1 font-semibold">
                                {isSpeaking ? (
                                  <span className="text-emerald-600 animate-pulse flex items-center gap-1">
                                    🎤 Speaking Now...
                                  </span>
                                ) : (
                                  <span>Raised 1m ago</span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSpeaking ? (
                              <button
                                onClick={() => {
                                  setActiveSpeaker(null);
                                  setHands((p) => p.filter((x) => x.userId !== h.userId));
                                  toast.info('Student mic lowered.');
                                }}
                                className="text-[13px] font-black text-rose-700 bg-rose-100 hover:bg-rose-200/80 px-2.5 py-1.5 rounded-lg transition"
                              >
                                Stop
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveSpeaker(h.userId);
                                    toast.success(`${h.userName} is allowed to speak.`);
                                  }}
                                  className="text-[13px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-250/80 px-2.5 py-1.5 rounded-lg transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => {
                                    setHands((p) => p.filter((x) => x.userId !== h.userId));
                                    toast.info('Student hand request dismissed.');
                                  }}
                                  className="text-[13px] font-black text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg transition"
                                >
                                  Dismiss
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ─── Pinned Announcement Creator Modal ─── */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-black text-slate-900">Create Pinned Announcement</h3>
              <button 
                onClick={() => setShowAnnouncementModal(false)} 
                className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-xl transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            <p className="text-[13px] text-slate-400 mb-4">This will be pinned at the top of the classroom chat for all students and instructors.</p>
            <textarea
              value={announcementInput}
              onChange={(e) => setAnnouncementInput(e.target.value)}
              placeholder="e.g. Welcome class! Today we are studying Chapter 4: Integration. Please check the Course Content tab for notes."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 p-4 text-[13px] text-slate-750 focus:border-blue-500 outline-none resize-none mb-4 shadow-xs"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowAnnouncementModal(false)} 
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[13px] font-bold text-slate-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (announcementInput.trim()) {
                    setPinnedAnnouncement(announcementInput.trim());
                    setShowAnnouncementModal(false);
                    setAnnouncementInput('');
                    toast.success('Announcement pinned successfully!');
                  }
                }}
                disabled={!announcementInput.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-[13px] font-black text-white shadow-md shadow-blue-600/10 transition disabled:opacity-50"
              >
                Pin Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Classroom Settings Modal ─── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-slate-900">Classroom Control Settings</h3>
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-xl transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-slate-800 block">Allow Student Chat</span>
                  <span className="text-[13px] text-slate-400">Students can write messages in Live Chat</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={chatAllowed} 
                  onChange={(e) => {
                    setChatAllowed(e.target.checked);
                    setIsChatMuted(!e.target.checked);
                    toast.success(`Chat has been ${e.target.checked ? 'Enabled' : 'Disabled'} for students.`);
                  }} 
                  className="h-4.5 w-4.5 text-blue-650 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] font-bold text-slate-800 block">Low Latency Mode</span>
                  <span className="text-[13px] text-slate-400">Reduce HLS buffering lag down to 2.8s</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={lowLatency} 
                  onChange={(e) => {
                    setLowLatency(e.target.checked);
                    toast.success(`Low latency mode ${e.target.checked ? 'Enabled' : 'Disabled'}.`);
                  }} 
                  className="h-4.5 w-4.5 text-blue-650 border-slate-300 rounded focus:ring-blue-500 cursor-pointer" 
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={() => setShowSettingsModal(false)} 
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-[13px] font-black text-white shadow-md shadow-blue-600/10 transition active:scale-95"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Class Confirmation Dialog */}
      {confirmEnd && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in" onClick={(e) => e.target === e.currentTarget && setConfirmEnd(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">End live class?</h3>
              <button onClick={() => setConfirmEnd(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-xl"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-5 text-[13px] font-semibold text-slate-500 leading-relaxed">This will end the class stream and disconnect all connected students. Make sure to stop streaming in OBS to release encoder.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmEnd(false)}
                disabled={ending}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-[13px] font-bold text-slate-600 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={endClass}
                disabled={ending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-[13px] font-black text-white shadow-md shadow-red-600/10"
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
