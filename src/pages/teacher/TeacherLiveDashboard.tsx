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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
        <Video className="text-blue-400" size={22} />
        <h1 className="text-lg font-semibold">{stats.title}</h1>
        <Badge variant="outline" className="border-gray-600 text-gray-400 ml-auto">Class Ended</Badge>
        <Button size="sm" variant="outline" onClick={onDone}>
          <ArrowLeft size={14} className="mr-1" /> Back to Lectures
        </Button>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 py-5 border-b border-gray-800">
        {[
          { label: 'Duration', value: formatDuration(stats.durationSeconds || 0) },
          { label: 'Students', value: stats.totalParticipants },
          { label: 'Messages', value: stats.totalMessages },
          { label: 'Reactions', value: stats.totalReactions },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reaction breakdown */}
      {stats.reactionBreakdown?.length > 0 && (
        <div className="flex gap-3 flex-wrap px-6 py-4 border-b border-gray-800">
          {stats.reactionBreakdown.map((r) => (
            <span key={r.emoji} className="bg-gray-800 rounded-full px-3 py-1 text-sm">
              {r.emoji} <span className="text-gray-300 ml-1">{r.count}</span>
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6">
        {(['overview', 'participants', 'polls', 'chat'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'overview' && (
          <div className="space-y-2 text-sm text-gray-300">
            {stats.startedAt && <p>Started: {new Date(stats.startedAt).toLocaleString()}</p>}
            {stats.endedAt && <p>Ended: {new Date(stats.endedAt).toLocaleString()}</p>}
            {stats.teacherName && <p>Teacher: {stats.teacherName}</p>}
          </div>
        )}

        {tab === 'participants' && (
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Joined</th>
                <th className="pb-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {stats.participants?.map((p) => (
                <tr key={p.userId} className="border-b border-gray-800">
                  <td className="py-2">{p.userName}</td>
                  <td className="py-2 text-gray-400">{fmtTime(p.joinedAt)}</td>
                  <td className="py-2 text-gray-400">
                    {p.durationSeconds != null ? formatDuration(p.durationSeconds) : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'polls' && (
          <div className="space-y-4">
            {stats.polls?.length === 0 && <p className="text-gray-500 text-sm">No polls were created.</p>}
            {stats.polls?.map((poll) => {
              const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
              return (
                <div key={poll.id} className="bg-gray-900 rounded-lg p-4">
                  <p className="font-medium text-sm mb-2">{poll.question}</p>
                  {poll.options.map((opt) => {
                    const votes = poll.results?.[opt] ?? 0;
                    const pct = total ? Math.round((votes / total) * 100) : 0;
                    const isCorrect = poll.correctOption === opt;
                    return (
                      <div key={opt} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isCorrect ? 'text-green-400 font-medium' : 'text-gray-300'}>
                            {opt}{isCorrect && ' ✓'}
                          </span>
                          <span className="text-gray-400">{votes} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'chat' && (
          <div className="space-y-2">
            {chat.length === 0 && <p className="text-gray-500 text-sm">No messages.</p>}
            {chat.map((m) => (
              <div key={m.id} className="text-sm">
                <span className="text-blue-300 font-medium">{m.userName}</span>
                <span className="text-gray-400 text-xs ml-2">{fmtTime(m.createdAt)}</span>
                <p className="text-gray-200">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
        <button
          onClick={() => navigate('/teacher/lectures')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <Video className="text-blue-400 flex-shrink-0" size={20} />
        <h1 className="font-semibold text-base truncate flex-1">{lectureTitle}</h1>

        {lectureStatus === 'LIVE' && (
          <Badge className="bg-red-600 text-white animate-pulse flex-shrink-0">● LIVE</Badge>
        )}
        {lectureStatus === 'SCHEDULED' && (
          <Badge variant="outline" className="border-yellow-500 text-yellow-400 flex-shrink-0">Scheduled</Badge>
        )}
        {lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) && (
          <Badge variant="outline" className="border-gray-600 text-gray-400 flex-shrink-0">Ended</Badge>
        )}

        <div className="flex items-center gap-2 text-gray-300 text-sm flex-shrink-0">
          <Users size={15} />
          {viewerCount}
        </div>

        {(lectureStatus === 'LIVE' || lectureStatus === 'SCHEDULED') && (
          <Button
            size="sm"
            variant="destructive"
            onClick={endLecture}
            disabled={ending}
            className="flex-shrink-0"
          >
            <StopCircle size={14} className="mr-1" />
            {ending
              ? (lectureStatus === 'LIVE' ? 'Ending…' : 'Cancelling…')
              : (lectureStatus === 'LIVE' ? 'End Class' : 'End Stream')}
          </Button>
        )}
      </header>

      {/* Stream key info for OBS (when not yet live) */}
      {streamKey && lectureStatus !== 'LIVE' && !['ENDED', 'PROCESSED'].includes(lectureStatus ?? '') && (
        <div className="px-4 py-3 bg-gray-900 border-b border-gray-800 text-sm space-y-1">
          <p className="text-gray-400">Configure OBS with these credentials to go live:</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-gray-300">RTMP: <span className="text-blue-300 font-mono text-xs">{rtmpUrl}</span></span>
            <span className="text-gray-300">Stream Key: <span className="text-blue-300 font-mono text-xs">{streamKey}</span></span>
          </div>
        </div>
      )}

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-gray-950 min-h-0">
          <FloatingReactionLayer items={floatItems} />
          {lectureStatus === 'LIVE' ? (
            <div className="text-center space-y-4 px-6">
              <div className="w-20 h-20 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto animate-pulse">
                <Video className="text-red-400" size={36} />
              </div>
              <p className="text-2xl font-bold text-white">Class is Live</p>
              <p className="text-gray-400 text-sm">{viewerCount} student{viewerCount !== 1 ? 's' : ''} watching</p>
              <p className="text-gray-500 text-xs">Streaming via OBS → RTMP → HLS</p>
            </div>
          ) : lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) ? (
            <div className="text-center space-y-4 px-6">
              <CheckCircle className="text-green-400 mx-auto" size={48} />
              <p className="text-xl font-semibold text-white">Class Ended</p>
              <Button
                variant="outline"
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
                View Summary
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 px-6">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Video className="text-gray-500" size={36} />
              </div>
              <p className="text-xl font-semibold text-white">Waiting for stream…</p>
              <p className="text-gray-400 text-sm">Start streaming from OBS to go live</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l border-gray-800 bg-gray-900">
          {/* Panel tabs */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {([
              { key: 'chat', icon: MessageSquare },
              { key: 'participants', icon: Users },
              { key: 'hands', icon: Hand },
              { key: 'polls', icon: BarChart2 },
            ] as const).map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSidePanel(key)}
                className={`flex-1 py-2 flex items-center justify-center gap-1 text-xs font-medium transition-colors relative ${
                  sidePanel === key ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={14} />
                {key === 'hands' && hands.length > 0 && (
                  <span className="absolute top-1 right-2 bg-yellow-500 text-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {hands.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Chat panel */}
            {sidePanel === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.map((m) => (
                    <div key={m.id} className="text-sm">
                      <span className="text-blue-300 font-medium">{m.userName}</span>
                      <span className="text-gray-500 text-xs ml-1">{fmtTime(m.createdAt)}</span>
                      <p className="text-gray-200 mt-0.5 break-words">{m.text}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-gray-600 text-xs text-center mt-4">No messages yet</p>
                  )}
                  <div ref={chatBottomRef} />
                </div>
                <div className="p-2 border-t border-gray-800 flex-shrink-0 flex gap-2">
                  <Input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Message students…"
                    className="bg-gray-800 border-gray-700 text-white text-sm h-8"
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  />
                  <Button size="sm" className="h-8 px-2" onClick={sendChat}>
                    <Send size={14} />
                  </Button>
                </div>
              </div>
            )}

            {/* Participants panel */}
            {sidePanel === 'participants' && (
              <div className="p-3 space-y-2">
                {students.length === 0 && (
                  <p className="text-gray-600 text-xs text-center mt-4">No students yet</p>
                )}
                {students.map((s) => (
                  <div key={s.userId} className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-gray-200 truncate flex-1">{s.userName}</span>
                    {s.handRaised && <Hand size={13} className="text-yellow-400 flex-shrink-0" />}
                  </div>
                ))}
              </div>
            )}

            {/* Hands panel */}
            {sidePanel === 'hands' && (
              <div className="p-3 space-y-2">
                {hands.length === 0 && (
                  <p className="text-gray-600 text-xs text-center mt-4">No raised hands</p>
                )}
                {hands.map((h) => (
                  <div key={h.userId} className="flex items-center gap-2 p-2 bg-yellow-900/30 rounded-lg border border-yellow-800/50">
                    <Hand size={15} className="text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-gray-200 flex-1">{h.userName}</span>
                    <button
                      className="text-gray-500 hover:text-gray-300"
                      onClick={() => setHands((prev) => prev.filter((x) => x.userId !== h.userId))}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Polls panel */}
            {sidePanel === 'polls' && (
              <div className="p-3 space-y-4">
                {/* Active poll */}
                {activePoll && (
                  <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-300 uppercase">Active Poll</span>
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300 px-2" onClick={endPoll}>
                        End Poll
                      </Button>
                    </div>
                    <p className="text-sm font-medium text-white mb-2">{activePoll.question}</p>
                    {activePoll.options.map((opt) => {
                      const votes = activePoll.results?.[opt] ?? 0;
                      const total = Object.values(activePoll.results || {}).reduce((a, b) => a + b, 0);
                      const pct = total ? Math.round((votes / total) * 100) : 0;
                      const isCorrect = activePoll.correctOption === opt;
                      return (
                        <div key={opt} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={isCorrect ? 'text-green-400' : 'text-gray-300'}>{opt}{isCorrect && ' ✓'}</span>
                            <span className="text-gray-400">{votes} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${isCorrect ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Create poll form */}
                {!activePoll && !showPollForm && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => setShowPollForm(true)}
                  >
                    <Plus size={14} className="mr-1" /> New Poll
                  </Button>
                )}

                {!activePoll && showPollForm && (
                  <div className="bg-gray-800 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-medium text-gray-300 uppercase">Create Poll</p>
                    <Textarea
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Question…"
                      rows={2}
                      className="bg-gray-700 border-gray-600 text-white text-sm resize-none"
                    />
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct"
                          checked={opt.correct}
                          onChange={() =>
                            setPollOptions((prev) =>
                              prev.map((o, j) => ({ ...o, correct: j === i })),
                            )
                          }
                          className="accent-green-500"
                          title="Mark as correct"
                        />
                        <Input
                          value={opt.text}
                          onChange={(e) =>
                            setPollOptions((prev) =>
                              prev.map((o, j) => (j === i ? { ...o, text: e.target.value } : o)),
                            )
                          }
                          placeholder={`Option ${i + 1}`}
                          className="bg-gray-700 border-gray-600 text-white text-sm h-7"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => setPollOptions((prev) => prev.filter((_, j) => j !== i))}
                            className="text-gray-500 hover:text-red-400"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 5 && (
                      <button
                        onClick={() => setPollOptions((prev) => [...prev, { text: '', correct: false }])}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        + Add option
                      </button>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={createPoll}>Launch</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowPollForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Past polls */}
                {pastPolls.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Past Polls</p>
                    {pastPolls.map((poll) => {
                      const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                      return (
                        <div key={poll.id} className="bg-gray-800 rounded-lg p-3 mb-2">
                          <p className="text-xs font-medium text-gray-300 mb-2">{poll.question}</p>
                          {poll.options.map((opt) => {
                            const votes = poll.results?.[opt] ?? 0;
                            const pct = total ? Math.round((votes / total) * 100) : 0;
                            return (
                              <div key={opt} className="mb-1 text-xs text-gray-400 flex justify-between">
                                <span>{opt}</span>
                                <span>{votes} ({pct}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reaction bar (always visible when live) */}
          {lectureStatus === 'LIVE' && (
            <div className="flex justify-center gap-2 p-3 border-t border-gray-800 flex-shrink-0">
              {BROADCAST_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => socketRef.current?.emit('reaction', { emoji })}
                  className="text-xl hover:scale-125 transition-transform"
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
