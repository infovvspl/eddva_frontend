import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth-store';
import type { Socket } from 'socket.io-client';
import {
  BROADCAST_REACTIONS,
  BroadcastChatMessage,
  BroadcastParticipant,
  BroadcastQuestion,
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
  HelpCircle,
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
  Crown,
  UserCheck,
  Settings,
} from 'lucide-react';

type SidePanel = 'chat' | 'participants' | 'hands' | 'polls';

// Students tag questions with an inline prefix in the message text (the only
// field that survives the chat server round-trip). Detected + stripped here.
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

function getAvatarColor(name: string) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ── Post-class summary ────────────────────────────────────────────────────────

function LegacyPostClassSummary({ stats, onDone }: { stats: BroadcastStats; onDone: () => void }) {
  const [tab, setTab] = useState<'overview' | 'participants' | 'polls' | 'chat'>('overview');
  const [chat, setChat] = useState<BroadcastChatMessage[]>([]);
  const { id } = stats;

  useEffect(() => {
    liveBroadcast.getChatHistory(id).then((h) => setChat(h.filter((m) => parseMuteControl(m.text) === null))).catch(() => undefined);
  }, [id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-poppins">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20">
          <Video size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{stats.title}</h1>
          <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Session Summary</p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ml-auto px-3 py-1.5 text-xs font-bold rounded-full">
          Class Ended
        </Badge>
        <Button className="rounded-full px-6 bg-secondary hover:bg-secondary/80 text-secondary-foreground border-none font-semibold transition-all ml-4" onClick={onDone}>
          <ArrowLeft size={16} className="mr-2" /> Back to Lectures
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Duration', value: formatDuration(stats.durationSeconds || 0), icon: <Video size={20} className="text-indigo-600 dark:text-indigo-400" />,
                bgClass: 'bg-indigo-50/50 dark:bg-indigo-950/20', borderClass: 'border-indigo-100 dark:border-indigo-500/20', hoverBorderClass: 'hover:border-indigo-300 dark:hover:border-indigo-500/30', glowClass: 'bg-indigo-500/5 dark:bg-indigo-500/10', hoverGlowClass: 'group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20', iconBgClass: 'bg-indigo-100/50 dark:bg-indigo-500/10'
              },
              {
                label: 'Students Joined', value: stats.totalParticipants, icon: <Users size={20} className="text-emerald-600 dark:text-emerald-400" />,
                bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20', borderClass: 'border-emerald-100 dark:border-emerald-500/20', hoverBorderClass: 'hover:border-emerald-300 dark:hover:border-emerald-500/30', glowClass: 'bg-emerald-500/5 dark:bg-emerald-500/10', hoverGlowClass: 'group-hover:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20', iconBgClass: 'bg-emerald-100/50 dark:bg-emerald-500/10'
              },
              {
                label: 'Total Messages', value: stats.totalMessages, icon: <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />,
                bgClass: 'bg-blue-50/50 dark:bg-blue-950/20', borderClass: 'border-blue-100 dark:border-blue-500/20', hoverBorderClass: 'hover:border-blue-300 dark:hover:border-blue-500/30', glowClass: 'bg-blue-500/5 dark:bg-blue-500/10', hoverGlowClass: 'group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20', iconBgClass: 'bg-blue-100/50 dark:bg-blue-500/10'
              },
              {
                label: 'Total Reactions', value: stats.totalReactions, icon: <BarChart2 size={20} className="text-rose-600 dark:text-rose-400" />,
                bgClass: 'bg-rose-50/50 dark:bg-rose-950/20', borderClass: 'border-rose-100 dark:border-rose-500/20', hoverBorderClass: 'hover:border-rose-300 dark:hover:border-rose-500/30', glowClass: 'bg-rose-500/5 dark:bg-rose-500/10', hoverGlowClass: 'group-hover:bg-rose-500/10 dark:group-hover:bg-rose-500/20', iconBgClass: 'bg-rose-100/50 dark:bg-rose-500/10'
              },
            ].map((s) => (
              <div key={s.label} className={`${s.bgClass} border ${s.borderClass} rounded-2xl p-4 relative overflow-hidden group ${s.hoverBorderClass} transition-all duration-200 hover:-translate-y-1 shadow-md`}>
                <div className={`absolute -right-4 -top-4 w-24 h-24 ${s.glowClass} rounded-full blur-2xl ${s.hoverGlowClass} transition-colors pointer-events-none`} />
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`p-2 ${s.iconBgClass} rounded-xl border ${s.borderClass}`}>
                    {s.icon}
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Detailed Tabs Area */}
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                {/* Tabs */}
                <div className="flex p-2 bg-muted/40 border-b border-border">
                  {(['overview', 'participants', 'polls', 'chat'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-3 px-4 text-sm font-bold capitalize transition-all duration-200 rounded-xl ${tab === t ? 'bg-background text-foreground shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {tab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Started At</p>
                          <p className="text-lg font-bold text-foreground">{stats.startedAt ? new Date(stats.startedAt).toLocaleString() : '—'}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl border border-border">
                          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ended At</p>
                          <p className="text-lg font-bold text-foreground">{stats.endedAt ? new Date(stats.endedAt).toLocaleString() : '—'}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-xl border border-border">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Instructor</p>
                        <p className="text-lg font-bold text-foreground">{stats.teacherName || '—'}</p>
                      </div>
                    </div>
                  )}

                  {tab === 'participants' && (
                    <div className="overflow-hidden rounded-xl border border-border bg-card/50">
                      <table className="w-full text-sm text-left">
                        <thead className="text-muted-foreground bg-muted/30 border-b border-border text-xs uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Joined At</th>
                            <th className="px-6 py-4">Total Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {stats.participants?.length === 0 && (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">No participants</td></tr>
                          )}
                          {stats.participants?.map((p) => (
                            <tr key={p.userId} className="hover:bg-muted/20 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                                    {p.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-foreground">{p.userName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground font-medium">{fmtTime(p.joinedAt)}</td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 rounded-full bg-muted/50 border border-border text-xs font-semibold text-foreground">
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
                        <div className="py-12 text-center text-muted-foreground">
                          <BarChart2 size={40} className="mx-auto mb-4 opacity-30" />
                          <p className="text-base font-semibold">No polls were created.</p>
                        </div>
                      )}
                      {stats.polls?.map((poll) => {
                        const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                        return (
                          <div key={poll.id} className="bg-muted/20 border border-border rounded-2xl p-6">
                            <p className="font-bold text-lg text-foreground mb-5">{poll.question}</p>
                            <div className="space-y-3">
                              {poll.options.map((opt) => {
                                const votes = poll.results?.[opt] ?? 0;
                                const pct = total ? Math.round((votes / total) * 100) : 0;
                                const isCorrect = poll.correctOption === opt;
                                return (
                                  <div key={opt} className="relative p-3 rounded-xl border border-border bg-card">
                                    <div className="flex justify-between text-sm font-bold text-foreground relative z-10">
                                      <span className="flex items-center gap-2">
                                        {opt}
                                        {isCorrect && <span className="ml-2 rounded px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">✓ Correct</span>}
                                      </span>
                                      <span className="shrink-0 text-muted-foreground">{votes} ({pct}%)</span>
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
                        <div className="py-12 text-center text-muted-foreground">
                          <MessageSquare size={40} className="mx-auto mb-4 opacity-30" />
                          <p className="text-base font-semibold">No messages.</p>
                        </div>
                      )}
                      {chat.map((m) => {
                        const { isQuestion, text: body } = parseChatText(m.text);
                        return (
                        <div key={m.id} className="flex gap-4 group">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
                            {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-bold text-foreground">{m.userName || 'User'}</span>
                              {isQuestion && <span className="rounded px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30">❓ Question</span>}
                              <span className="text-xs font-semibold text-muted-foreground">{fmtTime(m.createdAt)}</span>
                            </div>
                            <div className={`inline-block rounded-2xl rounded-tl-sm px-4 py-3 ${isQuestion ? 'bg-amber-500/10 border-l-2 border border-amber-500/40' : 'bg-muted/30 border border-border'}`}>
                              <p className="text-sm text-foreground leading-relaxed">{body}</p>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Reaction breakdown */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Reaction Breakdown
                </h3>
                {stats.reactionBreakdown?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {stats.reactionBreakdown.map((r) => (
                      <div key={r.emoji} className="bg-muted/30 rounded-xl p-4 flex items-center justify-between border border-border hover:border-border/80 transition-all duration-200">
                        <span className="text-3xl">{r.emoji}</span>
                        <span className="font-bold text-xl text-foreground">{r.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground text-center py-4">No reactions recorded</p>
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

export function PostClassSummary({ stats, onDone }: { stats: BroadcastStats; onDone: () => void }) {
  const [chat, setChat] = useState<BroadcastChatMessage[]>([]);
  const [questions, setQuestions] = useState<BroadcastQuestion[]>([]);
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [submittingAnswers, setSubmittingAnswers] = useState<Record<string, boolean>>({});
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [pollsOpen, setPollsOpen] = useState(true);
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const { id } = stats;

  useEffect(() => {
    liveBroadcast.getChatHistory(id)
      .then((h) => setChat(h.filter((m) => parseMuteControl(m.text) === null)))
      .catch(() => undefined);
    liveBroadcast.getQuestions(id).then(setQuestions).catch(() => undefined);
  }, [id]);

  const cardOpenClass = 'h-[min(560px,calc(100dvh-280px))] min-h-[360px]';
  const cardBaseClass = 'overflow-hidden rounded-2xl border border-border bg-card shadow-sm flex flex-col';
  const unansweredCount = questions.filter((q) => !q.answer).length;
  const classDate = stats.startedAt ? new Date(stats.startedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const startTime = stats.startedAt ? fmtTime(stats.startedAt) : null;
  const endTime = stats.endedAt ? fmtTime(stats.endedAt) : null;

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8F9FA] p-4 text-slate-800 sm:p-6 lg:p-8 font-poppins">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <button
            onClick={onDone}
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-400 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Lectures
          </button>
          <h1 className="truncate text-2xl font-black text-slate-900">{stats.title}</h1>
          <p className="mt-0.5 text-[13px] text-slate-500">
            {classDate || 'Session Summary'}
            {startTime && endTime && <> | {startTime} - {endTime}</>}
            {stats.teacherName && <> | <span className="font-semibold text-slate-600">{stats.teacherName}</span></>}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-200 px-3.5 py-1 text-[13px] font-black text-slate-600">
          Class Ended
        </span>
      </div>

      <main>
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Duration', value: formatDuration(stats.durationSeconds || 0), icon: <Video size={20} className="text-indigo-600 dark:text-indigo-400" />, bgClass: 'bg-indigo-50/50 dark:bg-indigo-950/20', borderClass: 'border-indigo-100 dark:border-indigo-500/20', iconBgClass: 'bg-indigo-100/50 dark:bg-indigo-500/10' },
              { label: 'Students Joined', value: stats.totalParticipants, icon: <Users size={20} className="text-emerald-600 dark:text-emerald-400" />, bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20', borderClass: 'border-emerald-100 dark:border-emerald-500/20', iconBgClass: 'bg-emerald-100/50 dark:bg-emerald-500/10' },
              { label: 'Total Messages', value: stats.totalMessages, icon: <MessageSquare size={20} className="text-blue-600 dark:text-blue-400" />, bgClass: 'bg-blue-50/50 dark:bg-blue-950/20', borderClass: 'border-blue-100 dark:border-blue-500/20', iconBgClass: 'bg-blue-100/50 dark:bg-blue-500/10' },
              { label: 'Total Reactions', value: stats.totalReactions, icon: <BarChart2 size={20} className="text-rose-600 dark:text-rose-400" />, bgClass: 'bg-rose-50/50 dark:bg-rose-950/20', borderClass: 'border-rose-100 dark:border-rose-500/20', iconBgClass: 'bg-rose-100/50 dark:bg-rose-500/10' },
            ].map((s) => (
              <div key={s.label} className={`${s.bgClass} border ${s.borderClass} rounded-2xl p-4 relative overflow-hidden group transition-all duration-200 hover:-translate-y-1 shadow-md`}>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`p-2 ${s.iconBgClass} rounded-xl border ${s.borderClass}`}>{s.icon}</div>
                  <p className="text-sm font-semibold text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-2xl font-bold text-foreground tracking-tight">{s.value}</p>
              </div>
            ))}
          </div>

          {stats.reactionBreakdown?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Reaction Breakdown
              </h3>
              <div className="flex flex-wrap gap-3">
                {stats.reactionBreakdown.map((r) => (
                  <div key={r.emoji} className="bg-muted/30 rounded-xl px-4 py-3 flex items-center gap-3 border border-border hover:border-border/80 transition-all duration-200">
                    <span className="text-2xl leading-none">{r.emoji}</span>
                    <span className="font-bold text-lg text-foreground">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <div className={`${cardBaseClass} ${participantsOpen ? cardOpenClass : 'h-auto'}`}>
              <button onClick={() => setParticipantsOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 shrink-0 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <Users size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-foreground">Students Who Joined</span>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">{stats.totalParticipants}</span>
                </div>
                {participantsOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </button>
              {participantsOpen && (
                <div className="border-t border-border flex-1 flex min-h-0 flex-col">
                  {stats.participants?.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center p-6 text-center text-sm font-medium text-muted-foreground">No participants</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(90px,.8fr)_minmax(110px,.8fr)] gap-3 border-b border-border bg-muted/20 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Student</span>
                        <span className="text-center">Joined</span>
                        <span className="text-right">Watch Time</span>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-border">
                        {stats.participants?.map((p) => (
                          <div key={p.userId} className="grid grid-cols-[minmax(0,1.4fr)_minmax(90px,.8fr)_minmax(110px,.8fr)] items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold uppercase text-white shadow-sm" style={{ backgroundColor: getAvatarColor(p.userName || 'Student') }}>
                                {(p.userName?.charAt(0) || '?').toUpperCase()}
                              </div>
                              <span className="truncate text-sm font-semibold text-foreground">{p.userName}</span>
                            </div>
                            <span className="text-center text-sm font-medium text-muted-foreground">{fmtTime(p.joinedAt)}</span>
                            <span className="text-right text-sm font-bold text-foreground">{p.durationSeconds != null ? formatDuration(p.durationSeconds) : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className={`${cardBaseClass} ${pollsOpen ? cardOpenClass : 'h-auto'}`}>
              <button onClick={() => setPollsOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 shrink-0 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <BarChart2 size={18} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-foreground">Class Polls</span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">{stats.polls?.length || 0}</span>
                </div>
                {pollsOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </button>
              {pollsOpen && (
                <div className="border-t border-border flex-1 min-h-0 overflow-y-auto bg-muted/10 p-5">
                  {stats.polls?.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                      <BarChart2 size={40} className="mb-3 opacity-40" />
                      <p className="text-sm font-semibold">No polls were created.</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {stats.polls?.map((poll) => {
                        const total = Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
                        return (
                          <div key={poll.id} className="bg-card border border-border rounded-2xl p-5">
                            <p className="font-bold text-base text-foreground mb-4">{poll.question}</p>
                            <div className="space-y-3">
                              {poll.options.map((opt) => {
                                const votes = poll.results?.[opt] ?? 0;
                                const pct = total ? Math.round((votes / total) * 100) : 0;
                                const isCorrect = poll.correctOption === opt;
                                return (
                                  <div key={opt} className="relative p-3 rounded-xl border border-border bg-background overflow-hidden">
                                    <div className="flex justify-between gap-3 text-sm font-bold text-foreground relative z-10">
                                      <span className="flex min-w-0 items-center gap-2 break-words">
                                        {opt}
                                        {isCorrect && <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">Correct</span>}
                                      </span>
                                      <span className="shrink-0 text-muted-foreground">{votes} ({pct}%)</span>
                                    </div>
                                    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
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
                </div>
              )}
            </div>

            <div className={`${cardBaseClass} ${questionsOpen ? cardOpenClass : 'h-auto'}`}>
              <button onClick={() => setQuestionsOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 shrink-0 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <HelpCircle size={18} className="text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-bold text-foreground">Questions</span>
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">{questions.length}</span>
                  {unansweredCount > 0 && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">{unansweredCount} unanswered</span>}
                </div>
                {questionsOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </button>
              {questionsOpen && (
                <div className="border-t border-border flex-1 min-h-0 overflow-y-auto bg-muted/10 p-5">
                  {questions.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                      <HelpCircle size={40} className="mb-3 opacity-40" />
                      <p className="text-sm font-semibold">No questions were asked during this class.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((q) => (
                        <div key={q.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold uppercase text-white shadow-sm" style={{ backgroundColor: getAvatarColor(q.userName || 'Student') }}>
                                {(q.userName?.charAt(0) || '?').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-foreground">{q.userName || 'Student'}</p>
                                <p className="text-xs font-medium text-muted-foreground">{fmtTime(q.createdAt)}</p>
                              </div>
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${q.answer ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                              {q.answer ? 'Answered' : 'Unanswered'}
                            </span>
                          </div>
                          <p className="pl-11 text-sm font-semibold leading-relaxed text-foreground break-words">{q.text}</p>
                          {q.answer ? (
                            <div className="ml-11 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
                              <p className="mb-1 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Teacher Answer</p>
                              <p className="text-sm font-medium leading-relaxed text-foreground break-words">{q.answer}</p>
                            </div>
                          ) : (
                            <div className="ml-11 space-y-2">
                              <Textarea
                                rows={2}
                                placeholder="Type your answer and post it..."
                                value={draftAnswers[q.id] || ''}
                                onChange={(e) => setDraftAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                className="min-h-[76px] resize-none rounded-xl"
                              />
                              <div className="flex justify-end">
                                <Button
                                  size="sm"
                                  disabled={!draftAnswers[q.id]?.trim() || submittingAnswers[q.id]}
                                  onClick={async () => {
                                    const answer = (draftAnswers[q.id] || '').trim();
                                    if (!answer) return;
                                    setSubmittingAnswers((prev) => ({ ...prev, [q.id]: true }));
                                    try {
                                      await liveBroadcast.answerQuestion(id, q.id, answer);
                                      setQuestions((prev) => prev.map((item) => item.id === q.id ? { ...item, answer } : item));
                                      setDraftAnswers((prev) => {
                                        const next = { ...prev };
                                        delete next[q.id];
                                        return next;
                                      });
                                    } finally {
                                      setSubmittingAnswers((prev) => ({ ...prev, [q.id]: false }));
                                    }
                                  }}
                                  className="rounded-lg font-bold"
                                >
                                  <Send size={14} className="mr-2" />
                                  {submittingAnswers[q.id] ? 'Posting...' : 'Post Answer'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={`${cardBaseClass} ${chatOpen ? cardOpenClass : 'h-auto'}`}>
              <button onClick={() => setChatOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 px-5 py-4 hover:bg-muted/40 shrink-0 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <MessageSquare size={18} className="text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-bold text-foreground">Chat History</span>
                  <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-bold text-violet-600 dark:text-violet-400">{chat.length}</span>
                </div>
                {chatOpen ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </button>
              {chatOpen && (
                <div className="border-t border-border flex-1 min-h-0 overflow-y-auto bg-muted/10 p-5">
                  {chat.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                      <MessageSquare size={40} className="mb-3 opacity-40" />
                      <p className="text-sm font-semibold">No messages.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chat.map((m) => {
                        const { isQuestion, text: body } = parseChatText(m.text);
                        return (
                          <div key={m.id} className="flex gap-4 group">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: getAvatarColor(m.userName || 'User') }}>
                              {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                <span className="text-sm font-bold text-foreground">{m.userName || 'User'}</span>
                                {isQuestion && <span className="rounded px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30">Question</span>}
                                <span className="text-xs font-semibold text-muted-foreground">{fmtTime(m.createdAt)}</span>
                              </div>
                              <div className={`inline-block max-w-full rounded-2xl rounded-tl-sm px-4 py-3 ${isQuestion ? 'bg-amber-500/10 border-l-2 border border-amber-500/40' : 'bg-card border border-border'}`}>
                                <p className="text-sm text-foreground leading-relaxed break-words">{body}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TeacherLiveDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [ccEnabled, setCcEnabled] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'participants' | 'polls' | 'hands' | 'questions'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [chatLocked, setChatLocked] = useState(false);

  const [lectureTitle, setLectureTitle] = useState('Live Class');
  const [lectureStatus, setLectureStatus] = useState<LectureStatus>(null);
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [rtmpUrl, setRtmpUrl] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [viewerCount, setViewerCount] = useState(0);
  const [sidePanel, setSidePanel] = useState<SidePanel>('chat');
  const [messages, setMessages] = useState<BroadcastChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatMuted, setChatMuted] = useState(false);
  const [students, setStudents] = useState<BroadcastParticipant[]>([]);
  const [hands, setHands] = useState<{ userId: string; userName: string }[]>([]);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);
  const [pastPolls, setPastPolls] = useState<PastPoll[]>([]);
  const [postStats, setPostStats] = useState<BroadcastStats | null>(null);
  const [ending, setEnding] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Classroom features states
  const [questionsActive, setQuestionsActive] = useState(false);
  const [questions, setQuestions] = useState<BroadcastQuestion[]>([]);
  const [pinnedAnnouncement, setPinnedAnnouncement] = useState<string | null>(null);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [chatAllowed, setChatAllowed] = useState(true);
  const [lowLatency, setLowLatency] = useState(true);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
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

    if (location.state?.showSummary) {
      liveBroadcast.getStats(id).then((stats) => {
        if (stats) setPostStats(stats);
      }).catch(() => undefined);
    }

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

    liveBroadcast.getChatHistory(id).then((h) => {
      // Late-join: derive mute from the last HOST-authored control marker (ignore any
      // student who typed the marker); strip all markers from render.
      let muted = false;
      for (const m of h) {
        const v = parseMuteControl(m.text);
        if (v !== null && (!user?.id || m.userId === user.id)) muted = v;
      }
      setChatMuted(muted);
      setMessages(h.filter((m) => parseMuteControl(m.text) === null));
    }).catch(() => undefined);
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

    socket.on('teacher-joined', ({ viewerCount: vc, students: s, questionsActive: qa, questions: q }) => {
      setViewerCount(vc ?? 0);
      if (Array.isArray(s)) setStudents(s);
      if (typeof qa === 'boolean') setQuestionsActive(qa);
      if (Array.isArray(q)) setQuestions(q);
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
      // Hidden mute-control message — only the host may trigger it. Swallow all
      // markers from render, but only apply state when it's the host's own message
      // (guards against a student typing the marker literally).
      const mute = parseMuteControl(msg.text);
      if (mute !== null) {
        if (!user?.id || msg.userId === user.id) setChatMuted(mute);
        return;
      }
      setMessages((prev) => [...prev, msg]);
    });

    // Keep local mute state in sync (reconnect, or another host toggled it).
    socket.on('chat-muted', ({ muted }: { muted?: boolean }) => setChatMuted(!!muted));

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

    socket.on('questions-toggled', ({ active }: { active: boolean }) => {
      setQuestionsActive(active);
    });
    socket.on('question-added', (q: any) => {
      setQuestions((prev) => [...prev, q]);
    });
    socket.on('question-answered', ({ questionId, answer }: { questionId: string; answer: string }) => {
      setQuestions((prev) =>
        prev.map((item) => (item.id === questionId ? { ...item, answer } : item))
      );
    });
    socket.on('announcement-pinned', ({ text }) => {
      setPinnedAnnouncement(text);
    });
    socket.on('announcement-unpinned', () => {
      setPinnedAnnouncement(null);
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

  // Mute/unmute class chat for students. Optimistic local update + broadcast so
  // students disable their input; the host can always chat.
  const toggleChatMute = () => {
    const next = !chatMuted;
    setChatMuted(next);
    // TEMP diagnostic (remove after debugging) — confirms the emit fires and the socket is live.
    console.log('[chat-muted][teacher] emitting muted =', next, '| socket connected =', socketRef.current?.connected);
    // Primary transport: hidden control message over the reliably-relayed `chat` channel.
    socketRef.current?.emit('chat', { text: next ? CHATMUTE_ON : CHATMUTE_OFF });
    // Legacy/no-op unless the backend also relays a dedicated event (kept for forward-compat).
    socketRef.current?.emit('chat-muted', { muted: next });
  };

  // Clear a single student's raised hand from the teacher's view. Mirrors the
  // local state updates in the `hand-raised` handler; the socket emit is
  // best-effort so students are notified if the backend supports it.
  const lowerStudentHand = (userId: string) => {
    setHands((prev) => prev.filter((h) => h.userId !== userId));
    setStudents((prev) =>
      prev.map((s) => (s.userId === userId ? { ...s, handRaised: false } : s)),
    );
    socketRef.current?.emit('lower-hand', { userId });
  };

  // Clear every raised hand at once.
  const lowerAllHands = () => {
    setHands([]);
    setStudents((prev) =>
      prev.map((s) => (s.handRaised ? { ...s, handRaised: false } : s)),
    );
    socketRef.current?.emit('lower-hand', { all: true });
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

  const triggerAttendanceCheck = () => {
    toast({ title: "Attendance Marked", description: `Attendance checked! ${students.length} active students marked present.` });
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

  // ── Live / Scheduled UI ───────────────────────────────────────────────────
  // Stable helper for local connection quality simulation
  const getWifiQuality = useCallback((userId: string) => {
    const charCode = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (charCode % 3 === 0) return { label: 'Excellent', color: 'text-emerald-600' };
    if (charCode % 3 === 1) return { label: 'Fair', color: 'text-amber-600' };
    return { label: 'Weak', color: 'text-rose-600' };
  }, []);

  const filteredStudents = useMemo(() => {
    const q = studentSearchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter(s => s.userName.toLowerCase().includes(q));
  }, [students, studentSearchQuery]);

  // ── Post-class ───────────────────────────────────────────────────────────────
  if (postStats) {
    return (
      <PostClassSummary
        stats={postStats}
        onDone={() => navigate('/teacher/lectures')}
      />
    );
  }

  return (
    <>
      <div ref={pageContainerRef} className="h-[calc(100vh-64px)] w-full text-slate-700 flex flex-col font-poppins overflow-hidden select-none bg-slate-50 transition-colors duration-200">
        {/* Top Bar / Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0 z-10 shadow-sm">
          {/* Left: Primary Course Info */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/teacher/lectures')}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all duration-200 shrink-0 border border-slate-200/60"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100/50 text-indigo-600 shrink-0">
                <Video size={18} />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-sm font-bold text-slate-800 truncate leading-tight tracking-tight max-w-[200px] sm:max-w-[300px]">{lectureTitle}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coaching Dashboard</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Secondary Status Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
            {lectureStatus === 'LIVE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 shrink-0 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">LIVE</span>
              </div>
            )}
            {lectureStatus === 'SCHEDULED' && (
              <div className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-widest shrink-0">Scheduled</div>
            )}
            {lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) && (
              <div className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-widest shrink-0">Ended</div>
            )}

            {/* Session Timer & REC Label */}
            {lectureStatus === 'LIVE' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                <span className="font-mono text-[11px] font-bold text-slate-600">{duration}</span>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-[9px] font-black text-rose-600 animate-pulse">
                  <CircleDot size={8} /> REC
                </div>
              </div>
            )}

            {/* Connection quality dropdown (purely visual) */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shrink-0 text-slate-600 hover:text-slate-800 text-xs font-bold transition-all duration-200">
                <Wifi size={14} className="text-emerald-600" />
                <span className="text-[11px] hidden sm:inline">Excellent</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-3 hidden group-hover:block z-50 animate-in fade-in duration-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Connection Quality</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">FPS:</span>
                    <span className="font-semibold text-slate-800">30 fps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bitrate:</span>
                    <span className="font-semibold text-slate-800">2500 kbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resolution:</span>
                    <span className="font-semibold text-slate-800">1080p</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Viewer Count Button */}
            <div className="relative" ref={participantsDropdownRef}>
              <button
                onClick={() => setParticipantsOpen(!participantsOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 shrink-0 text-slate-600 hover:text-slate-800 transition-all select-none text-xs font-bold"
                title="View participants"
              >
                <Users size={14} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600">{viewerCount}</span>
              </button>

              {participantsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Participants ({viewerCount + 1})</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {/* Host Row */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TH'}
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Teacher'}</span>
                      </div>
                      <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 border border-amber-200 px-1 py-0.5 text-[9px] font-black text-amber-700 uppercase tracking-wide">
                        <Crown className="w-2.5 h-2.5 mr-0.5" /> Host
                      </span>
                    </div>

                    {/* Students List */}
                    {students.length === 0 ? (
                      <p className="text-[10px] text-slate-500 text-center py-4">No students joined yet</p>
                    ) : (
                      students.map((student) => (
                        <div key={student.userId} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0 border border-slate-200">
                              {student.userName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate">{student.userName}</span>
                          </div>
                          {student.handRaised && (
                            <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-1 py-0.5 text-[8px] font-black text-amber-700">
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
              className="h-9 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all duration-200 shrink-0 border border-slate-200/60 flex items-center gap-1.5 text-xs font-bold"
              title="Fullscreen class view"
            >
              {isPageFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              <span className="hidden md:inline">Fullscreen</span>
            </button>

            {(lectureStatus === 'LIVE' || lectureStatus === 'SCHEDULED') && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={ending}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white border border-transparent px-4 py-2 text-xs font-bold transition-all duration-200 disabled:opacity-50 shrink-0 shadow-md"
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
          <div className="px-6 py-4 bg-indigo-50/50 border-b border-indigo-100 text-sm space-y-2 flex-shrink-0 animate-in slide-in-from-top duration-300">
            <p className="text-indigo-600 font-semibold flex items-center gap-2 text-xs sm:text-sm"><Video size={16} /> Configure OBS with these credentials to go live:</p>
            <div className="flex gap-4 flex-wrap">
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 max-w-full overflow-hidden shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">RTMP</span>
                <span className="text-indigo-600 font-mono text-xs select-all break-all">{rtmpUrl}</span>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2 max-w-full overflow-hidden shadow-sm">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider shrink-0">Stream Key</span>
                <span className="text-indigo-600 font-mono text-xs select-all break-all">{streamKey}</span>
              </div>
            </div>
          </div>
        )}            {/* Main Container */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 gap-4 min-h-0">
          {/* Left Area: Video Stage & Bottom Participant Avatars */}
          <div className="flex-grow flex-1 min-w-0 flex flex-col gap-4">
            {/* Left Area (Video Screen & Controls) */}
            <div className="flex-1 relative min-h-0 flex flex-col rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-hidden group shadow-sm">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.01),transparent_70%)] pointer-events-none" />

              {/* Video Screen Container */}
              <div className="relative flex-1 aspect-video lg:aspect-auto min-h-[240px] sm:min-h-[380px] lg:min-h-0 rounded-xl overflow-hidden bg-black shadow-inner border border-slate-800 flex flex-col items-center justify-center">
                {/* Reactions Overlay */}
                <FloatingReactionLayer items={floatItems} />

                {/* Pinned badge */}
                <div className="absolute left-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-indigo-600/10 border border-indigo-500/30 px-3 py-1.5 text-[10px] font-black text-indigo-500 uppercase tracking-widest shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Pinned for all students
                </div>

                {/* CC Captions Mock Overlay */}
                {ccEnabled && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 max-w-xl text-center bg-black/85 backdrop-blur-md border border-white/10 rounded-xl px-5 py-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                    <p className="text-xs sm:text-sm text-slate-100 font-medium tracking-wide">
                      <span className="text-indigo-500 font-bold uppercase text-[10px] mr-1.5">CC [Local Auto]</span> Welcome to today's live lecture. Please ensure your notebooks are ready as we cover the core syllabus.
                    </p>
                  </div>
                )}

                <div className="relative z-10 text-center p-4">
                  {lectureStatus === 'LIVE' ? (
                    <div className="space-y-6">
                      <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/50 flex items-center justify-center mx-auto relative shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                        <div className="absolute inset-0 rounded-full border-t-2 border-rose-500 animate-spin opacity-50"></div>
                        <Video className="text-rose-600 animate-pulse" size={40} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white mb-2">Class is Live</p>
                        <p className="text-slate-300 text-sm font-medium">{viewerCount} student{viewerCount !== 1 ? 's' : ''} watching</p>
                      </div>
                    </div>
                  ) : lectureStatus && ['ENDED', 'PROCESSED'].includes(lectureStatus) ? (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                        <CheckCircle className="text-emerald-400" size={48} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white mb-1">Class Ended</p>
                        <p className="text-slate-300 text-sm">The broadcast has finished.</p>
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
                        <Video className="text-slate-400 animate-bounce" size={40} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white mb-1">Ready to broadcast</p>
                        <p className="text-slate-300 text-sm">Start streaming from OBS to go live</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Centered Caption below video */}
              <div className="mt-3 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" /> OBS <span className="text-slate-400">→</span> RTMP <span className="text-slate-400">→</span> HLS
                </span>
              </div>

              {/* Control Dock */}
              <div className="mt-4 flex justify-center w-full z-20 relative">
                <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/80 shadow-md max-w-full">
                  {/* Announcement Trigger */}
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200"
                    title="Pinned Announcement"
                  >
                    <Volume2 size={18} />
                  </button>

                  {/* Create Poll Trigger */}
                  <button
                    onClick={() => { setSidebarTab('polls'); setSidebarOpen(true); }}
                    className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200"
                    title="Create Poll"
                  >
                    <BarChart2 size={18} />
                  </button>

                  {/* Ask Questions Trigger */}
                  <button
                    onClick={() => {
                      const nextVal = !questionsActive;
                      setQuestionsActive(nextVal);
                      socketRef.current?.emit('toggle-questions', { active: nextVal });
                      if (nextVal) {
                        setSidebarTab('questions');
                        setSidebarOpen(true);
                      }
                      toast({ title: nextVal ? "Q&A session activated!" : "Q&A session deactivated." });
                    }}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      questionsActive
                        ? 'bg-emerald-100 text-emerald-850 border border-emerald-200 font-bold'
                        : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
                    }`}
                    title="Ask Questions"
                  >
                    <HelpCircle size={18} />
                  </button>

                  {/* Attendance Trigger */}
                  <button
                    onClick={triggerAttendanceCheck}
                    className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 border border-slate-200"
                    title="Mark Attendance"
                  >
                    <UserCheck size={18} />
                  </button>

                  {/* Mic Toggle */}
                  <button
                    onClick={() => setMicMuted(!micMuted)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center transition-all duration-200 ${micMuted ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'}`}
                    title={micMuted ? 'Unmute Mic (Cosmetic)' : 'Mute Mic (Cosmetic)'}
                  >
                    {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={() => setCameraMuted(!cameraMuted)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center transition-all duration-200 ${cameraMuted ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'}`}
                    title={cameraMuted ? 'Start Camera (Cosmetic)' : 'Stop Camera (Cosmetic)'}
                  >
                    {cameraMuted ? <VideoOff size={18} /> : <Video size={18} />}
                  </button>

                  {/* Screen Share */}
                  <button
                    onClick={() => setScreenSharing(!screenSharing)}
                    className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center transition-all duration-200 ${screenSharing ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'}`}
                    title="Screen Share (Cosmetic)"
                  >
                    <Monitor size={18} />
                  </button>


                  {/* Recording Toggle */}
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`h-9 px-2.5 sm:h-11 sm:px-3.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all duration-200 ${isRecording ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                    title="Local Recording (Cosmetic)"
                  >
                    <CircleDot size={18} className={isRecording ? 'text-white' : 'text-rose-600'} />
                    <span>REC</span>
                  </button>
                </div>
              </div>
              {/* Bottom Participant Avatars Row */}
              <div className="hidden lg:flex gap-3 h-20 shrink-0 overflow-x-auto py-1 items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {students.map((std) => {
                  const initials = std.initials || (std.userName ? (std.userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) : '?');
                  return (
                    <div
                      key={std.userId}
                      className={`relative flex flex-col items-center justify-center rounded-xl bg-slate-50 border ${std.handRaised ? 'border-2 border-amber-300 shadow-sm shadow-amber-500/10' : 'border border-slate-200/60'
                        } px-2 py-1.5 transition-all w-20 sm:w-24 shrink-0 h-[68px]`}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-[10px] bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
                        {initials}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1 truncate w-full text-center">
                        {std.userName}
                      </span>
                      {std.handRaised && (
                        <div className="absolute -top-1 -right-1 bg-amber-50 text-amber-700 rounded-full p-0.5 border border-amber-200 shadow-sm" title="Hand Raised">
                          <Hand size={8} fill="black" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Area (Sidebar: single panel with tabs) */}
          <div className={`relative flex-shrink-0 flex flex-col gap-4 min-h-0 transition-all duration-300 ${sidebarOpen ? 'w-full lg:w-80 xl:w-96 opacity-100' : 'w-0 opacity-0 overflow-hidden pointer-events-none'
            }`}>
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute -left-3 top-6 z-30 h-7 w-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 shadow-md hover:bg-slate-50 transition-all"
              title="Collapse sidebar"
            >
              <ChevronRight size={14} />
            </button>

            {/* PANEL: Unified Tabbed Sidebar (Chat, Q&A, Students, Polls, Hands) */}
            <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm min-h-0 overflow-hidden h-full">
              {/* Pill tabs switcher */}
              <div className="flex p-1 mx-3 mt-3 rounded-xl bg-slate-50 border border-slate-200/60 flex-shrink-0 overflow-x-auto gap-0.5">
                {([
                  { key: 'chat' as const, label: 'Chat' },
                  { key: 'questions' as const, label: 'Q&A' },
                  { key: 'participants' as const, label: 'Students' },
                  { key: 'polls' as const, label: 'Polls' },
                  { key: 'hands' as const, label: 'Hands' }
                ]).map(({ key, label }) => {
                  const count = key === 'hands' ? hands.length 
                              : key === 'participants' ? students.length 
                              : key === 'questions' ? questions.filter(q => !q.answer).length
                              : key === 'polls' && activePoll ? 1 : 0;
                  const isSelected = sidebarTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSidebarTab(key)}
                      className={`flex-1 py-1.5 px-2 text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all duration-200 rounded-lg relative whitespace-nowrap ${isSelected ? 'bg-white text-indigo-600 border border-slate-200/50 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                        }`}
                    >
                      <span>{label}</span>
                      {count > 0 && (
                        <span className={`px-1 py-0.5 text-[8px] rounded-full font-black leading-none ${key === 'hands' ? 'bg-amber-50 border border-amber-200 text-amber-700 animate-pulse' : key === 'polls' ? 'bg-emerald-50 text-emerald-700 animate-pulse' : 'bg-slate-150 text-slate-600'}`}>
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
                    {/* Pinned Announcements Panel inside chat */}
                    {pinnedAnnouncement && (
                      <div className="m-3 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex items-start gap-2 relative shadow-xs animate-fade-in text-xs">
                        <div className="h-5 w-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <Volume2 className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0 pr-5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">Pinned Announcement</span>
                          <p className="text-slate-700 font-semibold leading-normal mt-0.5 break-words">{pinnedAnnouncement}</p>
                        </div>
                        <button 
                          onClick={() => {
                            socketRef.current?.emit('unpin-announcement');
                            setPinnedAnnouncement(null);
                          }} 
                          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                      {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 opacity-50">
                          <MessageSquare size={32} className="text-slate-400 mb-3" />
                          <p className="text-sm font-bold text-slate-800">No messages yet</p>
                          <p className="text-xs text-slate-500">Class chat is active</p>
                        </div>
                      )}
                      {messages.map((m) => {
                        const { isQuestion, text: body } = parseChatText(m.text);
                        return (
                          <div key={m.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-1">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                              {(m.userName?.charAt(0) ?? '?').toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-xs text-slate-800 truncate">{m.userName || 'Student'}</span>
                                <span className="text-[9px] text-slate-400">
                                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className={`text-xs leading-relaxed font-semibold break-words p-2.5 rounded-2xl border ${isQuestion ? 'bg-amber-50/50 border-amber-200/60 text-amber-900 rounded-tl-none' : 'bg-slate-50/50 border-slate-100 text-slate-700 rounded-tl-none'
                                }`}>
                                {body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    <div className="p-3 border-t border-slate-200 bg-white flex-shrink-0">
                      <div className="flex gap-2">
                        <Input
                          placeholder={chatMuted ? "Chat is muted" : "Type a message..."}
                          value={chatDraft}
                          onChange={(e) => setChatDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                          disabled={chatMuted}
                          className="bg-slate-50 border-slate-200 text-slate-800 text-xs rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-indigo-500"
                        />
                        <Button
                          size="icon"
                          onClick={sendChat}
                          disabled={chatMuted || !chatDraft.trim()}
                          className="h-10 w-10 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Questions / Q&A tab */}
                {sidebarTab === 'questions' && (
                  <div className="flex-grow flex flex-col min-h-0 bg-slate-50/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Student Q&A</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${questionsActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                        {questionsActive ? 'Session Active' : 'Session Closed'}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      {questions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
                          <HelpCircle size={32} className="text-slate-400 mb-3" />
                          <p className="text-xs font-bold text-slate-800">No questions yet</p>
                          <p className="text-[11px] text-slate-500">
                            {questionsActive ? 'Students can ask questions now' : 'Activate Q&A from control dock'}
                          </p>
                        </div>
                      ) : (
                        questions.map((q) => (
                          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs space-y-2 text-xs">
                            <div className="flex justify-between items-start gap-1">
                              <div>
                                <span className="font-bold text-slate-800">{q.userName}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  {q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${q.answer ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                {q.answer ? 'Answered' : 'Unanswered'}
                              </span>
                            </div>

                            <p className="text-slate-700 font-semibold break-words leading-normal">{q.text}</p>

                            {q.answer ? (
                              <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-2 text-slate-650 leading-normal font-semibold">
                                <span className="text-[10px] font-black text-indigo-600 block mb-0.5">Answer:</span>
                                {q.answer}
                              </div>
                            ) : (
                              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                                <textarea
                                  placeholder="Type your answer here..."
                                  rows={2}
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none font-semibold"
                                  id={`ans-${q.id}`}
                                />
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => {
                                      const textInput = document.getElementById(`ans-${q.id}`) as HTMLTextAreaElement;
                                      const ansText = textInput?.value.trim();
                                      if (ansText) {
                                        socketRef.current?.emit('answer-question', { questionId: q.id, answer: ansText });
                                      } else {
                                        toast({ title: 'Answer cannot be empty', variant: 'destructive' });
                                      }
                                    }}
                                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-[11px] font-black text-white active:scale-95 transition"
                                  >
                                    Send Answer
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Active/Participants tab */}
                {sidebarTab === 'participants' && (
                  <div className="flex-grow flex flex-col min-h-0 bg-slate-50/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Active Students ({students.length})</span>
                      <button
                        onClick={toggleChatMute}
                        className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition ${chatMuted ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                        {chatMuted ? '🔇 Muted' : '🎙 Mute Chat'}
                      </button>
                    </div>

                    <div className="p-3 border-b border-slate-200 bg-white flex-shrink-0">
                      <Input
                        placeholder="Search students..."
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        className="bg-slate-50 border-slate-200 text-slate-800 text-xs rounded-xl h-8 focus-visible:ring-1 focus-visible:ring-indigo-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                      {filteredStudents.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8">No students found.</p>
                      ) : (
                        filteredStudents.map((std) => {
                          const wifi = getWifiQuality(std.userId);
                          return (
                            <div key={std.userId} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                              <div>
                                <span className="font-bold text-xs text-slate-800 block">{std.userName || 'Student'}</span>
                                <span className={`text-[10px] font-medium ${wifi.color}`}>{wifi.label} Connection</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {std.handRaised && (
                                  <span className="text-xs text-amber-500 animate-bounce">✋</span>
                                )}
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Polls tab */}
                {sidebarTab === 'polls' && (
                  <div className="flex-grow flex flex-col min-h-0 bg-slate-50/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Class Polls</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                      {activePoll ? (
                        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 shadow-sm space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <span className="bg-indigo-100 border border-indigo-200 rounded text-[9px] font-black uppercase px-1.5 py-0.5 text-indigo-700 animate-pulse">Active</span>
                              <h4 className="font-bold text-slate-800 mt-1.5 leading-tight text-xs sm:text-sm">{activePoll.question}</h4>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 text-[10px] font-bold rounded-lg bg-rose-50 border border-rose-250 text-rose-600 hover:bg-rose-600 hover:text-white"
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
                                <div key={opt} className="relative p-2 rounded-lg border border-slate-200 bg-white overflow-hidden text-xs">
                                  <div className="flex justify-between relative z-10 font-bold text-slate-800">
                                    <span>{opt} {isCorrect && '✓'}</span>
                                    <span className="text-slate-500">{votes} ({pct}%)</span>
                                  </div>
                                  <div className="absolute inset-y-0 left-0 bg-indigo-500/10" style={{ width: `${pct}%` }} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : showPollForm ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3 animate-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs sm:text-sm">New Poll</span>
                            <button className="text-slate-400 hover:text-slate-600 text-[10px]" onClick={() => setShowPollForm(false)}>Cancel</button>
                          </div>
                          <Textarea
                            placeholder="Poll Question"
                            value={pollQuestion}
                            onChange={(e) => setPollQuestion(e.target.value)}
                            className="bg-white border-slate-200 text-slate-800 text-xs rounded-xl min-h-[50px] resize-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                            rows={2}
                          />
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400">
                              Select the correct answer <span className="font-medium text-slate-500">(optional)</span>
                            </p>
                            {pollOptions.map((opt, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input
                                  type="radio"
                                  name="correct-opt"
                                  checked={opt.correct}
                                  onChange={() => setPollOptions(prev => prev.map((o, j) => ({ ...o, correct: j === idx })))}
                                  className="accent-indigo-600 shrink-0 cursor-pointer"
                                  title="Mark this option as the correct answer"
                                />
                                <Input
                                  placeholder={`Option ${idx + 1}`}
                                  value={opt.text}
                                  onChange={(e) => setPollOptions(prev => prev.map((o, j) => j === idx ? { ...o, text: e.target.value } : o))}
                                  className="bg-white border-slate-200 text-slate-800 text-xs rounded-xl h-8 flex-1 focus-visible:ring-1 focus-visible:ring-indigo-500"
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            className="w-full h-8 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                            disabled={!pollQuestion.trim() || pollOptions.some(o => !o.text.trim())}
                            onClick={createPoll}
                          >
                            Publish Poll
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            className="w-full h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 text-xs font-bold transition-all duration-200"
                            onClick={() => setShowPollForm(true)}
                          >
                            <Plus size={14} className="mr-1.5 text-indigo-600 animate-pulse" /> Create New Poll
                          </Button>
                          {pastPolls.length > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Past Polls ({pastPolls.length})</p>
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {pastPolls.map(p => (
                                  <div key={p.id} className="p-2.5 bg-white rounded-xl border border-slate-200/60 flex justify-between items-center text-[10px]">
                                    <span className="truncate text-slate-700 max-w-[150px] font-semibold">{p.question}</span>
                                    <span className="text-slate-400 shrink-0 font-medium">Ended</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hands raised tab */}
                {sidebarTab === 'hands' && (
                  <div className="flex-grow flex flex-col min-h-0 bg-slate-50/50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex-shrink-0 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{hands.length} hands raised</span>
                      {hands.length > 0 && (
                        <button
                          onClick={lowerAllHands}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Lower All Hands
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      {hands.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50 py-12">
                          <Hand size={32} className="text-slate-400 mb-3" />
                          <p className="text-xs font-bold text-slate-800">No raised hands</p>
                        </div>
                      ) : (
                        hands.map((h, idx) => {
                          const isSpeaking = activeSpeaker === h.userId;
                          return (
                            <div key={h.userId} className={`flex items-center justify-between p-3 border rounded-xl animate-in slide-in-from-bottom-2 ${isSpeaking ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                              <div>
                                <span className="font-bold text-xs text-slate-800 block">{h.userName}</span>
                                {isSpeaking && <span className="text-[10px] text-emerald-600 font-bold block animate-pulse">🎤 Speaking...</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {isSpeaking ? (
                                  <button
                                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition-all border border-rose-200"
                                    onClick={() => {
                                      lowerStudentHand(h.userId);
                                      if (activeSpeaker === h.userId) setActiveSpeaker(null);
                                    }}
                                  >
                                    Stop
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-200"
                                      onClick={() => {
                                        setActiveSpeaker(h.userId);
                                        toast({ title: `${h.userName} is allowed to speak.` });
                                      }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-all border border-slate-250"
                                      onClick={() => lowerStudentHand(h.userId)}
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating re-open button when sidebar is collapsed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed right-3 top-1/2 -translate-y-1/2 z-30 h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-xl hover:bg-slate-50 transition-all duration-200"
              title="Expand sidebar"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {/* End Class Confirmation Modal */}
          {showEndConfirm && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 mb-4 text-rose-600">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {lectureStatus === 'LIVE' ? 'End Live Class' : 'Cancel Stream'}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {lectureStatus === 'LIVE'
                    ? 'End this live class? Students will be disconnected.'
                    : 'Cancel this scheduled stream? This cannot be undone.'}
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowEndConfirm(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-200"
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

          {/* ─── Pinned Announcement Creator Modal ─── */}
          {showAnnouncementModal && (
            <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-slate-800">Create Pinned Announcement</h3>
                  <button 
                    onClick={() => setShowAnnouncementModal(false)} 
                    className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[12px] text-slate-400 mb-4">This will be pinned at the top of the classroom chat for all students.</p>
                <textarea
                  value={announcementInput}
                  onChange={(e) => setAnnouncementInput(e.target.value)}
                  placeholder="e.g. Welcome class! Today we are studying Chapter 4: Integration."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-750 focus:border-indigo-500 outline-none resize-none mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setShowAnnouncementModal(false)} 
                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (announcementInput.trim()) {
                        socketRef.current?.emit('pin-announcement', { text: announcementInput.trim() });
                        setPinnedAnnouncement(announcementInput.trim());
                        setShowAnnouncementModal(false);
                        setAnnouncementInput('');
                        toast({ title: 'Announcement pinned successfully!' });
                      }
                    }}
                    disabled={!announcementInput.trim()}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                  >
                    Pin Announcement
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Classroom Settings Modal ─── */}
          {showSettingsModal && (
            <div className="fixed inset-0 z-[200] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-bold text-slate-800">Classroom Control Settings</h3>
                  <button 
                    onClick={() => setShowSettingsModal(false)} 
                    className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-lg transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Allow Student Chat</span>
                      <span className="text-[10px] text-slate-400">Students can write messages in Live Chat</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={chatAllowed} 
                      onChange={(e) => {
                        setChatAllowed(e.target.checked);
                        setChatMuted(!e.target.checked);
                        toast({ title: `Chat has been ${e.target.checked ? 'Enabled' : 'Disabled'} for students.` });
                      }} 
                      className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer animate-fade-in" 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block">Low Latency Mode</span>
                      <span className="text-[10px] text-slate-400">Reduce HLS buffering lag down to 2.8s</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={lowLatency} 
                      onChange={(e) => {
                        setLowLatency(e.target.checked);
                        toast({ title: `Low latency mode ${e.target.checked ? 'Enabled' : 'Disabled'}.` });
                      }} 
                      className="h-4.5 w-4.5 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer animate-fade-in" 
                    />
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowSettingsModal(false)} 
                  className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
