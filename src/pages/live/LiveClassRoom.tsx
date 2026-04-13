import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  ILocalTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Hand, Send,
  Users, MessageSquare, BarChart2, Radio, Loader2, Monitor,
  BarChart3, Pin, ChevronLeft, Plus, X, CheckCircle, Clock,
  HelpCircle, AlertCircle, MonitorOff, Volume2, VolumeX,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  getLiveClassToken, startLiveClass, endLiveClass, getLiveSession,
  createPoll, closePoll, respondToPoll,
  type LiveSessionInfo, type LiveChatMessage, type LivePoll, type PollResult,
} from "@/lib/api/live-class";

AgoraRTC.setLogLevel(4);

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string;
  name: string;
  role: "teacher" | "student";
  joinedAt: number;
}

interface Doubt {
  id: string;
  studentId: string;
  studentName: string;
  question: string;
  askedAt: string;
  resolved: boolean;
  answer?: string;
  answeredBy?: "teacher" | "ai";
}

// ─── Video Tile ───────────────────────────────────────────────────────────────

function VideoTile({
  videoTrack,
  label,
  isLocal = false,
  isCamOn = true,
  isScreenShare = false,
}: {
  videoTrack: ILocalVideoTrack | ILocalAudioTrack | IAgoraRTCRemoteUser["videoTrack"] | null | undefined;
  label?: string;
  isLocal?: boolean;
  isCamOn?: boolean;
  isScreenShare?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = videoTrack as any;
    if (track && containerRef.current && (isCamOn || isScreenShare)) {
      track.play(containerRef.current);
    }
    return () => {
      try { (track as any)?.stop?.(); } catch {}
    };
  }, [videoTrack, isCamOn, isScreenShare]);

  const showVideo = videoTrack && (isCamOn || isScreenShare);

  return (
    <div className="relative w-full h-full bg-[#1a1a2e] rounded-xl overflow-hidden">
      {showVideo ? (
        <div ref={containerRef} className="w-full h-full" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1a1a2e]">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {isScreenShare ? (
              <MonitorOff className="w-6 h-6 text-primary/40" />
            ) : (
              <VideoOff className="w-6 h-6 text-white/20" />
            )}
          </div>
          <span className="text-white/30 text-xs">{isLocal ? "Camera off" : "No video"}</span>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-[11px] text-white font-medium flex items-center gap-1">
          {isScreenShare && <Monitor className="w-3 h-3 text-blue-400" />}
          {label}
          {isLocal && <span className="text-white/40 ml-0.5">(You)</span>}
        </div>
      )}
      {isScreenShare && (
        <div className="absolute top-2 left-2 bg-blue-500/20 border border-blue-500/40 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] text-blue-300 font-semibold">
          SCREEN SHARE
        </div>
      )}
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  onSend,
  onPin,
  isTeacher,
  myName,
}: {
  messages: LiveChatMessage[];
  onSend: (msg: string) => void;
  onPin?: (msgId: string) => void;
  isTeacher: boolean;
  myName: string;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = input.trim();
    if (!t || t.length > 500) return;
    onSend(t);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
            <MessageSquare className="w-8 h-8 text-white/10" />
            <p className="text-xs text-white/30">No messages yet. Say hi!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderName === myName;
          return (
            <div
              key={msg.id}
              className={`group flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}
            >
              {msg.isPinned && (
                <div className="w-full flex items-center gap-1 text-[10px] text-amber-400 mb-0.5">
                  <Pin className="w-2.5 h-2.5" /> Pinned
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words
                  ${msg.isPinned ? "border border-amber-500/30 bg-amber-500/10" :
                    msg.senderRole === "teacher" ? "bg-primary/20 border border-primary/20" :
                    isMe ? "bg-white/10" : "bg-white/5"}`}
              >
                {!isMe && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={`font-bold text-[10px] ${msg.senderRole === "teacher" ? "text-primary" : "text-white/60"}`}>
                      {msg.senderName}
                    </span>
                    {msg.senderRole === "teacher" && (
                      <span className="bg-primary/20 text-primary text-[9px] px-1 rounded">Teacher</span>
                    )}
                  </div>
                )}
                <p className="text-white/90">{msg.message}</p>
              </div>
              {isTeacher && !msg.isPinned && onPin && (
                <button
                  onClick={() => onPin(msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-amber-400 mt-0.5"
                >
                  <Pin className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/5 p-2.5">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message..."
            maxLength={500}
            rows={1}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
            style={{ minHeight: 36, maxHeight: 80 }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────

function PollCard({
  poll,
  onVote,
  onClose,
  myVote,
  isTeacher,
}: {
  poll: LivePoll;
  onVote?: (pollId: string, i: number) => void;
  onClose?: (pollId: string) => void;
  myVote?: number;
  isTeacher: boolean;
}) {
  const hasVoted = myVote !== undefined;
  const showResults = !poll.isActive || hasVoted;
  const total = poll.results?.reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${poll.isActive ? "border-primary/30 bg-primary/5" : "border-white/10 bg-white/3"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-white leading-snug">{poll.question}</p>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${poll.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
            {poll.isActive ? "LIVE" : "CLOSED"}
          </span>
          {isTeacher && poll.isActive && onClose && (
            <button onClick={() => onClose(poll.id)} className="text-[10px] text-white/30 hover:text-red-400 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const result = poll.results?.find((r) => r.index === i);
          const pct = result?.percentage ?? 0;
          const isCorrect = poll.correctOptionIndex === i && !poll.isActive;
          const isMyVote = myVote === i;
          const canVote = !isTeacher && poll.isActive && !hasVoted;

          return (
            <button
              key={i}
              disabled={!canVote}
              onClick={() => canVote && onVote?.(poll.id, i)}
              className={`w-full text-left rounded-xl border px-3 py-2.5 text-xs relative overflow-hidden transition-all
                ${isCorrect ? "border-emerald-500/50 bg-emerald-500/10" :
                  isMyVote ? "border-primary/50 bg-primary/10" :
                  canVote ? "border-white/10 hover:border-primary/30 hover:bg-primary/5 cursor-pointer" :
                  "border-white/5 cursor-default"}`}
            >
              {showResults && pct > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-xl opacity-20 ${isCorrect ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between gap-2">
                <span className={`flex items-center gap-1.5 font-medium ${isCorrect ? "text-emerald-400" : "text-white/90"}`}>
                  {isMyVote && <CheckCircle className="w-3 h-3 text-primary" />}
                  {opt}
                </span>
                {showResults && (
                  <span className="shrink-0 font-bold text-white/50">{Math.round(pct)}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showResults && total > 0 && (
        <p className="text-[10px] text-white/30 text-right">{total} vote{total !== 1 ? "s" : ""}</p>
      )}
    </div>
  );
}

// ─── Poll Creator ─────────────────────────────────────────────────────────────

function PollCreator({ sessionId, onCreated, onClose }: {
  sessionId: string;
  onCreated: (p: LivePoll) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [correct, setCorrect] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const question = q.trim();
    const options = opts.map((o) => o.trim()).filter(Boolean);
    if (!question || options.length < 2) { toast.error("Need a question and at least 2 options"); return; }
    setLoading(true);
    try {
      const poll = await createPoll(sessionId, question, options, correct);
      onCreated(poll);
      onClose();
      toast.success("Poll launched!");
    } catch { toast.error("Failed to create poll"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">New Poll</span>
        <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a question..."
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
      <div className="space-y-2">
        {opts.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input value={o} onChange={(e) => setOpts((p) => p.map((x, j) => j === i ? e.target.value : x))}
              placeholder={`Option ${i + 1}`}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50" />
            <button onClick={() => setCorrect(correct === i ? undefined : i)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors
                ${correct === i ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "border-white/10 text-white/20 hover:border-emerald-500/30"}`}
              title="Mark as correct">
              <CheckCircle className="w-3.5 h-3.5" />
            </button>
            {opts.length > 2 && (
              <button onClick={() => setOpts((p) => p.filter((_, j) => j !== i))}
                className="w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-white/20 hover:text-red-400 hover:border-red-400/30 transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {opts.length < 6 && (
          <button onClick={() => setOpts((p) => [...p, ""])}
            className="flex-1 py-2 rounded-xl border border-dashed border-white/10 text-xs text-white/30 hover:border-primary/40 hover:text-primary/60 transition-colors flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Add Option
          </button>
        )}
        <button onClick={submit} disabled={loading}
          className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart2 className="w-3.5 h-3.5" />}
          Launch Poll
        </button>
      </div>
    </div>
  );
}

// ─── Doubt Card ───────────────────────────────────────────────────────────────

function DoubtCard({ doubt, isTeacher, onResolve, onAnswer, onAskAI }: {
  doubt: Doubt;
  isTeacher: boolean;
  onResolve?: (id: string) => void;
  onAnswer?: (id: string, answer: string) => void;
  onAskAI?: (id: string, question: string) => void;
}) {
  const [answerText, setAnswerText] = useState("");
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const submitAnswer = () => {
    const t = answerText.trim();
    if (!t) return;
    onAnswer?.(doubt.id, t);
    setAnswerText("");
    setShowAnswerInput(false);
  };

  const handleAskAI = async () => {
    if (aiLoading || !onAskAI) return;
    setAiLoading(true);
    try {
      await onAskAI(doubt.id, doubt.question);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border px-3 py-3 space-y-2 transition-all ${doubt.resolved ? "border-white/5 opacity-60" : "border-amber-500/20 bg-amber-500/5"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="text-[10px] font-bold text-amber-300">{doubt.studentName}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isTeacher && !doubt.resolved && onResolve && (
            <button onClick={() => onResolve(doubt.id)}
              className="text-[10px] text-white/30 hover:text-emerald-400 border border-white/10 hover:border-emerald-400/30 px-2 py-0.5 rounded-full transition-colors">
              Resolve
            </button>
          )}
          {doubt.resolved && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
        </div>
      </div>

      {/* Question */}
      <p className="text-xs text-white/80 leading-relaxed">{doubt.question}</p>

      {/* Answer display */}
      {doubt.answer && (
        <div className={`rounded-lg px-2.5 py-2 space-y-0.5 ${doubt.answeredBy === "ai" ? "bg-violet-500/10 border border-violet-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
          <p className={`text-[10px] font-bold ${doubt.answeredBy === "ai" ? "text-violet-400" : "text-emerald-400"}`}>
            {doubt.answeredBy === "ai" ? "✨ AI Answer" : "Teacher Answer"}
          </p>
          <p className="text-xs text-white/80 leading-relaxed">{doubt.answer}</p>
        </div>
      )}

      {/* Teacher: answer controls */}
      {isTeacher && !doubt.resolved && !doubt.answer && (
        <div className="space-y-1.5">
          {showAnswerInput ? (
            <div className="space-y-1.5">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                placeholder="Type your answer..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 resize-none"
              />
              <div className="flex gap-1.5">
                <button onClick={submitAnswer} disabled={!answerText.trim()}
                  className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/30 disabled:opacity-40 transition-colors">
                  Send Answer
                </button>
                <button onClick={() => setShowAnswerInput(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[10px] hover:bg-white/10 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <button onClick={() => setShowAnswerInput(true)}
                className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[10px] font-semibold hover:border-primary/30 hover:text-primary transition-colors">
                Answer
              </button>
              {onAskAI && (
                <button onClick={handleAskAI} disabled={aiLoading}
                  className="flex-1 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-semibold hover:bg-violet-500/20 disabled:opacity-40 transition-colors flex items-center justify-center gap-1">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨ Ask AI"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────

function CtrlBtn({ icon, label, onClick, active, activeClass = "bg-white/15", inactiveClass = "bg-white/8", danger = false, disabled = false }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClass?: string;
  inactiveClass?: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-center gap-1.5 disabled:opacity-40 group">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all text-white
        ${danger ? "bg-red-500 hover:bg-red-400" : active ? activeClass : inactiveClass}
        ${!disabled ? "hover:scale-105 active:scale-95" : ""}`}>
        {icon}
      </div>
      <span className="text-[10px] text-white/40 group-hover:text-white/60 transition-colors">{label}</span>
    </button>
  );
}

// ─── Participants Panel ───────────────────────────────────────────────────────

function ParticipantsPanel({ participants, raisedHands }: {
  participants: Participant[];
  raisedHands: { userId: string; name: string }[];
}) {
  const raisedIds = new Set(raisedHands.map((h) => h.userId));
  const teachers = participants.filter((p) => p.role === "teacher");
  const students = participants.filter((p) => p.role === "student");

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      {teachers.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Teacher</p>
          <div className="space-y-1.5">
            {teachers.map((p) => (
              <div key={p.userId} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {p.name[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-white font-medium flex-1 truncate">{p.name}</span>
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}
      {students.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
            Students ({students.length})
          </p>
          <div className="space-y-1.5">
            {students.map((p) => (
              <div key={p.userId} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/3 border border-white/5">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                  {p.name[0]?.toUpperCase()}
                </div>
                <span className="text-xs text-white/80 flex-1 truncate">{p.name}</span>
                {raisedIds.has(p.userId) && <Hand className="w-3.5 h-3.5 text-amber-400" title="Hand raised" />}
              </div>
            ))}
          </div>
        </div>
      )}
      {participants.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
          <Users className="w-8 h-8 text-white/10" />
          <p className="text-xs text-white/30">No participants yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Main LiveClassRoom ───────────────────────────────────────────────────────

type SidePanel = "chat" | "polls" | "hands" | "participants";

export default function LiveClassRoom() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  // ── Session
  const [session, setSession] = useState<LiveSessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");

  // ── Agora
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // ── Socket
  const socketRef = useRef<Socket | null>(null);
  const [socketSessionId, setSocketSessionId] = useState("");

  // ── UI
  const [panel, setPanel] = useState<SidePanel>("chat");
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [raisedHands, setRaisedHands] = useState<{ userId: string; name: string }[]>([]);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showDoubtInput, setShowDoubtInput] = useState(false);
  const [doubtText, setDoubtText] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [doubtEnabled, setDoubtEnabled] = useState(false);

  // ── Load session
  const loadSession = useCallback(() => {
    if (!lectureId) return;
    setSessionLoading(true);
    setSessionError("");
    getLiveSession(lectureId)
      .then((s) => {
        setSession(s);
        setViewerCount(s.currentViewerCount);
        if (s.status === "ended") setEnded(true);
      })
      .catch((err: any) => {
        const status = err?.response?.status;
        setSessionError(
          status === 404 ? "Live session not found. Make sure the backend is running." :
          status === 403 ? "You are not allowed to access this class." :
          status === 401 ? "Session expired. Please log in again." :
          "Could not connect to the live class. Check your internet connection."
        );
      })
      .finally(() => setSessionLoading(false));
  }, [lectureId]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // ── Poll while WAITING (student auto-join when teacher starts)
  useEffect(() => {
    if (!lectureId || !session || session.status !== "waiting" || isTeacher || isJoined) return;
    const id = setInterval(async () => {
      try {
        const s = await getLiveSession(lectureId);
        if (s.status === "live") { setSession(s); setViewerCount(s.currentViewerCount); }
        else if (s.status === "ended") { setEnded(true); setSession(s); }
      } catch {}
    }, 4000);
    return () => clearInterval(id);
  }, [lectureId, session?.status, isTeacher, isJoined]);

  const joiningRef = useRef(false);

  // ── Agora join
  const joinAgora = useCallback(async (
    token: string, channelName: string, uid: number, role: "host" | "audience"
  ) => {
    if (!AGORA_APP_ID) { toast.error("VITE_AGORA_APP_ID not set in .env"); return; }
    if (clientRef.current || joiningRef.current) return; // already joined or in progress
    joiningRef.current = true;

    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (remoteUser, mediaType) => {
      await client.subscribe(remoteUser, mediaType);
      if (mediaType === "audio") {
        if (isSpeakerOn) remoteUser.audioTrack?.play();
      }
      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === remoteUser.uid);
        return exists ? prev.map((u) => u.uid === remoteUser.uid ? remoteUser : u) : [...prev, remoteUser];
      });
    });

    client.on("user-unpublished", (remoteUser) => {
      setRemoteUsers((prev) => prev.map((u) => u.uid === remoteUser.uid ? remoteUser : u));
    });

    client.on("user-left", (remoteUser) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
    });

    client.on("network-quality", (stats) => {
      if (stats.downlinkNetworkQuality >= 5) toast.warning("Poor network quality", { id: "network" });
    });

    try {
      await client.setClientRole(role);
      await client.join(AGORA_APP_ID, channelName, token, uid);
    } catch (err: any) {
      toast.error(`Failed to join stream: ${err?.code ?? err?.message ?? "unknown"}`);
      clientRef.current = null;
      joiningRef.current = false;
      return;
    }

    if (role === "host") {
      let audio: ILocalAudioTrack | null = null;
      let video: ILocalVideoTrack | null = null;
      try {
        [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          { encoderConfig: "480p_2", optimizationMode: "motion" }
        );
      } catch {
        toast.warning("Camera unavailable — trying audio only");
        try { audio = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true }); }
        catch (e: any) {
          if (e?.name === "NotAllowedError") toast.error("Microphone access blocked. Allow it in browser settings.", { duration: 10000 });
          else toast.error("Could not access microphone.");
          await client.leave(); clientRef.current = null; joiningRef.current = false; return;
        }
      }
      const toPublish: ILocalTrack[] = [];
      if (audio) { setLocalAudioTrack(audio); toPublish.push(audio); }
      if (video) { setLocalVideoTrack(video); toPublish.push(video); }
      if (toPublish.length) await client.publish(toPublish);
    }

    joiningRef.current = false;
    setIsJoined(true);
  }, []);

  // ── Student auto-join when LIVE
  useEffect(() => {
    if (!session || isTeacher || session.status !== "live" || isJoined) return;
    (async () => {
      try {
        const r = await getLiveClassToken(lectureId!, "audience");
        await joinAgora(r.token, r.channelName, r.uid, "audience");
        connectSocket(r.sessionId, r.uid);
      } catch (e: any) { toast.error(e?.response?.data?.message ?? "Failed to join class"); }
    })();
  }, [session?.status, isTeacher, isJoined, lectureId]);

  // ── Teacher auto-join when LIVE (re-entering a live room)
  useEffect(() => {
    if (!session || !isTeacher || session.status !== "live" || isJoined) return;
    (async () => {
      try {
        const r = await getLiveClassToken(lectureId!, "host");
        await joinAgora(r.token, r.channelName, r.uid, "host");
        connectSocket(r.sessionId, r.uid);
      } catch (e: any) { toast.error(e?.response?.data?.message ?? "Failed to rejoin class"); }
    })();
  }, [session?.status, isTeacher, isJoined, lectureId]);

  // ── Socket
  const connectSocket = useCallback((sessionId: string, uid: number) => {
    if (socketRef.current?.connected) return;
    setSocketSessionId(sessionId);

    const socket = io(`${BACKEND_URL}/live`, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: localStorage.getItem("eddva_access_token") },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("live:join", {
        sessionId,
        userId: user?.id,
        name: user?.name ?? "User",
        role: user?.role ?? "student",
        tenantId: user?.tenantId,
        agoraUid: uid,
      });
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connect error:", err.message);
    });

    socket.on("live:joined", (data: {
      handRaiseQueue: { userId: string; name: string }[];
      pinnedMessage: LiveChatMessage | null;
      participants?: Participant[];
    }) => {
      setRaisedHands(data.handRaiseQueue ?? []);
      if (data.participants) setParticipants(data.participants);
      if (data.pinnedMessage) {
        setChatMessages((prev) => {
          const exists = prev.find((m) => m.id === data.pinnedMessage!.id);
          return exists ? prev : [data.pinnedMessage!, ...prev];
        });
      }
    });

    socket.on("live:participant-joined", (data: { userId: string; name: string; role: "teacher" | "student"; currentCount: number }) => {
      setViewerCount(data.currentCount);
      setParticipants((prev) => {
        if (prev.find((p) => p.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, name: data.name, role: data.role, joinedAt: Date.now() }];
      });
    });

    socket.on("live:participant-left", (data: { userId: string; currentCount: number }) => {
      setViewerCount(data.currentCount);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    socket.on("live:new-message", (msg: LiveChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("live:message-pinned", (msg: LiveChatMessage) => {
      setChatMessages((prev) => prev.map((m) => ({ ...m, isPinned: m.id === msg.id })));
    });

    socket.on("live:hand-raise-update", (data: { queue: { userId: string; name: string }[] }) => {
      setRaisedHands(data.queue);
    });

    socket.on("live:new-poll", (poll: LivePoll) => {
      // Deduplicate: teacher receives this AND adds via onCreated callback
      setPolls((prev) => prev.find((p) => p.id === poll.id) ? prev : [poll, ...prev]);
      setPanel("polls");
      toast.info("📊 New poll launched!", { duration: 4000 });
    });

    socket.on("live:poll-closed", (data: { pollId: string; results: PollResult[]; correctOptionIndex: number | null }) => {
      setPolls((prev) => prev.map((p) => p.id === data.pollId ? { ...p, isActive: false, results: data.results, correctOptionIndex: data.correctOptionIndex } : p));
    });

    socket.on("live:poll-results-update", (data: { pollId: string; results: PollResult[] }) => {
      setPolls((prev) => prev.map((p) => p.id === data.pollId ? { ...p, results: data.results } : p));
    });

    socket.on("live:new-doubt", (doubt: Doubt) => {
      setDoubts((prev) => [doubt, ...prev]);
      if (isTeacher) {
        setPanel("hands");
        toast.info(`❓ ${doubt.studentName} asked a question`, { duration: 5000 });
      }
    });

    socket.on("live:doubt-resolved", (data: { doubtId: string }) => {
      setDoubts((prev) => prev.map((d) => d.id === data.doubtId ? { ...d, resolved: true } : d));
    });

    socket.on("live:doubt-answered", (data: { doubtId: string; answer: string; answeredBy: "teacher" | "ai" }) => {
      setDoubts((prev) => prev.map((d) => d.id === data.doubtId ? { ...d, answer: data.answer, answeredBy: data.answeredBy } : d));
    });

    socket.on("live:doubts-toggled", (data: { enabled: boolean }) => {
      setDoubtEnabled(data.enabled);
      if (!isTeacher) {
        toast.info(data.enabled ? "Teacher enabled Ask Doubt" : "Ask Doubt has been disabled", { duration: 3000 });
      }
    });

    socket.on("live:class-started", () => {
      setSession((prev) => prev ? { ...prev, status: "live" } : prev);
    });

    socket.on("live:class-ended", () => {
      setEnded(true);
      setSession((prev) => prev ? { ...prev, status: "ended" } : prev);
      toast.info("Class has ended");
      leaveAgora();
    });

    socket.on("live:screen-share-started", (data: { userId: string; name: string }) => {
      if (!isTeacher) toast.info(`${data.name} started screen sharing`);
    });

    socket.on("live:screen-share-stopped", () => {
      if (!isTeacher) toast.info("Screen sharing ended");
    });
  }, [user, isTeacher]);

  // ── Leave Agora
  const leaveAgora = useCallback(async () => {
    screenTrack?.stop(); screenTrack?.close();
    localVideoTrack?.stop(); localVideoTrack?.close();
    localAudioTrack?.stop(); localAudioTrack?.close();
    try { await clientRef.current?.leave(); } catch {}
    clientRef.current = null;
    setIsJoined(false);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setScreenTrack(null);
    setRemoteUsers([]);
    setIsScreenSharing(false);
  }, [screenTrack, localVideoTrack, localAudioTrack]);

  // ── Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveAgora();
      if (socketRef.current?.connected) {
        socketRef.current.emit("live:leave", { sessionId: socketSessionId });
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ── Start class
  const handleStart = async () => {
    if (!lectureId) return;
    setIsStarting(true);
    try {
      const r = await startLiveClass(lectureId);
      setSession((prev) => prev ? { ...prev, status: "live" } : prev);
      await joinAgora(r.token, r.channelName, r.uid, "host");
      connectSocket(r.sessionId, r.uid);
      toast.success("You're live! Students can join now.");
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to start class");
    } finally { setIsStarting(false); }
  };

  // ── End class
  const handleEnd = async () => {
    if (!lectureId || !confirm("End the class for all students?")) return;
    setIsEnding(true);
    try {
      await endLiveClass(lectureId);
      await leaveAgora();
      socketRef.current?.disconnect();
      setEnded(true);
      toast.success("Class ended. Attendance recorded.");
      setTimeout(() => navigate(-1), 2000);
    } catch { toast.error("Failed to end class"); }
    finally { setIsEnding(false); }
  };

  // ── Mic / Cam / Speaker
  const toggleMic = async () => {
    if (!localAudioTrack) {
      // Student enabling mic for the first time
      if (!clientRef.current || !isJoined) return;
      try {
        const audio = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
        await clientRef.current.setClientRole("host");
        await clientRef.current.publish(audio);
        setLocalAudioTrack(audio);
        setIsMicOn(true);
      } catch (e: any) {
        if (e?.name === "NotAllowedError") toast.error("Microphone access blocked. Allow it in browser settings.", { duration: 8000 });
        else toast.error("Could not access microphone.");
      }
      return;
    }
    await localAudioTrack.setEnabled(!isMicOn);
    setIsMicOn((v) => !v);
  };

  const toggleCam = async () => {
    if (!localVideoTrack) { toast.error("Camera not active. Start the class first."); return; }
    await localVideoTrack.setEnabled(!isCamOn);
    setIsCamOn((v) => !v);
  };

  const toggleStudentCam = async () => {
    if (!clientRef.current || !isJoined) return;

    if (localVideoTrack) {
      // Turn off camera
      try { await clientRef.current.unpublish(localVideoTrack); } catch {}
      localVideoTrack.stop();
      localVideoTrack.close();
      setLocalVideoTrack(null);
      setIsCamOn(false);
      if (!localAudioTrack) {
        try { await clientRef.current.setClientRole("audience"); } catch {}
      }
      return;
    }

    // Turn on camera
    try {
      const video = await AgoraRTC.createCameraVideoTrack({ encoderConfig: "480p_1", optimizationMode: "motion" });
      await clientRef.current.setClientRole("host");
      await clientRef.current.publish(video);
      setLocalVideoTrack(video);
      setIsCamOn(true);
    } catch (e: any) {
      if (e?.name === "NotAllowedError") toast.error("Camera access blocked. Allow it in browser settings.", { duration: 8000 });
      else toast.error("Could not access camera.");
    }
  };

  const toggleSpeaker = () => {
    remoteUsers.forEach((u) => {
      if (isSpeakerOn) u.audioTrack?.stop();
      else u.audioTrack?.play();
    });
    setIsSpeakerOn((v) => !v);
  };

  // ── Screen share
  const toggleScreenShare = async () => {
    if (!clientRef.current) { toast.error("Join the class first"); return; }

    if (isScreenSharing) {
      try {
        // Unpublish BEFORE closing the track
        await clientRef.current.unpublish(screenTrack!);
        if (localVideoTrack) await clientRef.current.publish(localVideoTrack);
      } catch {}
      screenTrack?.stop();
      screenTrack?.close();
      setScreenTrack(null);
      setIsScreenSharing(false);
      socketRef.current?.emit("live:screen-share-stopped", { sessionId: socketSessionId });
      toast.info("Screen sharing stopped");
      return;
    }

    try {
      const screen = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1", optimizationMode: "detail" },
        "disable"
      ) as ILocalVideoTrack;

      screen.on("track-ended", async () => {
        try {
          await clientRef.current?.unpublish(screen);
          if (localVideoTrack) await clientRef.current?.publish(localVideoTrack);
        } catch {}
        screen.stop(); screen.close();
        setScreenTrack(null);
        setIsScreenSharing(false);
        socketRef.current?.emit("live:screen-share-stopped", { sessionId: socketSessionId });
      });

      if (localVideoTrack) await clientRef.current.unpublish(localVideoTrack);
      await clientRef.current.publish(screen);
      setScreenTrack(screen);
      setIsScreenSharing(true);
      socketRef.current?.emit("live:screen-share-started", {
        sessionId: socketSessionId,
        userId: user?.id,
        name: user?.name,
      });
      toast.success("Screen sharing started");
    } catch (e: any) {
      if (e?.name === "NotAllowedError") toast.error("Screen share permission denied");
      else toast.error("Failed to start screen share");
    }
  };

  // ── Chat
  const sendChat = (message: string) => {
    if (!socketRef.current?.connected || !socketSessionId) {
      toast.error("Not connected. Reconnecting...");
      return;
    }
    socketRef.current.emit("live:chat", { sessionId: socketSessionId, message });
  };

  const pinMessage = async (messageId: string) => {
    if (!socketSessionId) return;
    try {
      const { pinMessage: pinApi } = await import("@/lib/api/live-class");
      await pinApi(socketSessionId, messageId);
    } catch { toast.error("Failed to pin message"); }
  };

  // ── Hand raise
  const toggleHand = () => {
    if (!socketRef.current?.connected || !socketSessionId) return;
    if (isHandRaised) {
      socketRef.current.emit("live:lower-hand", { sessionId: socketSessionId });
    } else {
      socketRef.current.emit("live:raise-hand", { sessionId: socketSessionId });
      setPanel("hands");
    }
    setIsHandRaised((v) => !v);
  };

  // ── Ask doubt
  const submitDoubt = () => {
    const q = doubtText.trim();
    if (!q || !socketRef.current?.connected || !socketSessionId) return;
    socketRef.current.emit("live:ask-doubt", {
      sessionId: socketSessionId,
      question: q,
      studentId: user?.id,
      studentName: user?.name,
    });
    setDoubtText("");
    setShowDoubtInput(false);
    toast.success("Doubt sent to teacher!");
  };

  // ── Resolve doubt
  const resolveDoubt = (id: string) => {
    if (!socketRef.current?.connected || !socketSessionId) return;
    socketRef.current.emit("live:resolve-doubt", { sessionId: socketSessionId, doubtId: id });
  };

  // ── Answer doubt (teacher)
  const answerDoubt = (id: string, answer: string) => {
    if (!socketRef.current?.connected || !socketSessionId) return;
    socketRef.current.emit("live:answer-doubt", {
      sessionId: socketSessionId,
      doubtId: id,
      answer,
      answeredBy: "teacher",
    });
  };

  // ── Ask AI for doubt answer
  const askAiForDoubt = async (id: string, question: string) => {
    try {
      const { apiClient, extractData } = await import("@/lib/api/client");
      const res = await apiClient.post("/ai/doubt/resolve", {
        questionText: question,
        mode: "short",
      });
      const data = extractData<{ explanation: string }>(res);
      const aiAnswer = data?.explanation ?? "AI could not generate an answer.";
      if (!socketRef.current?.connected || !socketSessionId) return;
      socketRef.current.emit("live:answer-doubt", {
        sessionId: socketSessionId,
        doubtId: id,
        answer: aiAnswer,
        answeredBy: "ai",
      });
    } catch {
      toast.error("AI failed to answer the doubt");
    }
  };

  // ── Toggle doubt submission for students
  const toggleDoubts = () => {
    if (!socketRef.current?.connected || !socketSessionId) return;
    const next = !doubtEnabled;
    setDoubtEnabled(next);
    socketRef.current.emit("live:toggle-doubts", { sessionId: socketSessionId, enabled: next });
    toast.success(next ? "Students can now ask doubts" : "Doubt submission disabled");
  };

  // ── Vote on poll
  const handleVote = async (pollId: string, option: number) => {
    try {
      await respondToPoll(pollId, option);
      setMyVotes((prev) => ({ ...prev, [pollId]: option }));
      socketRef.current?.emit("live:poll-answer", { pollId, selectedOption: option, sessionId: socketSessionId });
    } catch { toast.error("Failed to submit vote"); }
  };

  // ── Close poll
  const handleClosePoll = async (pollId: string) => {
    try {
      const updated = await closePoll(pollId);
      setPolls((prev) => prev.map((p) => p.id === updated.id ? updated : p));
    } catch { toast.error("Failed to close poll"); }
  };

  // ── Derived state
  const isLive = session?.status === "live";
  const isWaiting = session?.status === "waiting";
  const activePollCount = polls.filter((p) => p.isActive).length;
  const unresolvedDoubts = doubts.filter((d) => !d.resolved).length;
  const handCount = raisedHands.length;

  // ── The video to show in main view
  const mainRemoteUser = remoteUsers[0]; // teacher's feed for students
  const teacherScreenUser = remoteUsers.find((u) => u.hasVideo && isScreenSharing); // approximate

  // ─── Render ────────────────────────────────────────────────────────────────

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-white/40 text-sm">Connecting to live class...</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <p className="text-white font-bold text-lg mb-1">Couldn't load live class</p>
          <p className="text-white/40 text-sm max-w-sm">{sessionError}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadSession} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
            Retry
          </button>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-bold hover:bg-white/10 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="h-13 shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate max-w-[200px] leading-tight">
              {session?.lectureTitle ?? "Live Class"}
            </p>
            {session?.topicName && (
              <p className="text-[11px] text-white/40 truncate">{session.topicName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Viewer count — always show when session exists */}
          {!!session && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs font-bold text-white/70">{viewerCount}</span>
            </div>
          )}

          {/* Status badge */}
          {isLive && (
            <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-red-400">LIVE</span>
            </div>
          )}
          {isWaiting && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">Waiting</span>
            </div>
          )}
          {ended && (
            <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-xs font-bold text-white/40">Ended</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Class ended screen ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {ended && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Class Ended</h2>
              <p className="text-white/40 text-sm mt-1">
                {isTeacher ? "Great session! Attendance has been recorded." : "See you next time!"}
              </p>
            </div>
            <button onClick={() => navigate(-1)}
              className="mt-2 px-8 py-3 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">
              Back to Lectures
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      {!ended && (
        <div className="flex-1 flex overflow-hidden">

          {/* ── Video column ─────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

            {/* Main video area */}
            <div className="flex-1 relative p-3 min-h-0">

              {/* Primary video feed */}
              {isTeacher ? (
                <VideoTile
                  videoTrack={isScreenSharing ? screenTrack : localVideoTrack}
                  label={user?.name}
                  isLocal={!isScreenSharing}
                  isCamOn={isScreenSharing ? true : isCamOn && isJoined}
                  isScreenShare={isScreenSharing}
                />
              ) : mainRemoteUser ? (
                <VideoTile
                  videoTrack={mainRemoteUser.videoTrack}
                  label={session?.teacherName ?? "Teacher"}
                />
              ) : (
                /* Waiting / no video state */
                <div className="w-full h-full bg-[#111128] rounded-2xl flex flex-col items-center justify-center gap-4">
                  {isWaiting ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <div className="text-center">
                        <p className="text-white/70 text-sm font-semibold">
                          {isTeacher ? "Ready to go live?" : "Waiting for teacher to start..."}
                        </p>
                        <p className="text-white/30 text-xs mt-1">
                          {isTeacher ? "Click Start Live Class below" : "You'll auto-connect when class begins"}
                        </p>
                      </div>
                      {!isTeacher && (
                        <div className="flex items-center gap-1">
                          {[0, 200, 400].map((d) => (
                            <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-white/40 text-sm">Connecting to stream...</p>
                    </>
                  )}
                </div>
              )}

              {/* Teacher: PiP of self when screen sharing */}
              {isTeacher && isScreenSharing && localVideoTrack && isCamOn && (
                <div className="absolute bottom-5 right-5 w-36 h-24 rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                  <VideoTile videoTrack={localVideoTrack} label={user?.name} isLocal isCamOn={isCamOn} />
                </div>
              )}

              {/* Student: self-view PiP when camera is on */}
              {!isTeacher && localVideoTrack && isCamOn && (
                <div className="absolute bottom-5 right-5 w-36 h-24 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-10">
                  <VideoTile videoTrack={localVideoTrack} label={user?.name} isLocal isCamOn={isCamOn} />
                </div>
              )}

              {/* Teacher WAITING: Start CTA overlay */}
              {isTeacher && isWaiting && (
                <div className="absolute inset-3 rounded-2xl flex items-end justify-center pb-10 pointer-events-none">
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto bg-black/75 backdrop-blur-lg border border-red-500/25 rounded-2xl px-8 py-6 text-center shadow-2xl">
                    <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">Ready when you are</p>
                    <h2 className="text-lg font-bold text-white mb-1">{session?.lectureTitle}</h2>
                    <p className="text-sm text-white/40 mb-5">
                      Students waiting: <span className="text-white font-bold">{viewerCount}</span>
                    </p>
                    <button onClick={handleStart} disabled={isStarting}
                      className="inline-flex items-center gap-2.5 px-10 py-3.5 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-bold text-base transition-all disabled:opacity-60 hover:scale-105 active:scale-95">
                      {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5" />}
                      {isStarting ? "Starting..." : "Start Live Class"}
                    </button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* ── Controls bar ─────────────────────────────────────────────── */}
            <div className="shrink-0 bg-black/40 border-t border-white/5 py-3 px-4">
              <div className="flex items-center justify-center gap-3 flex-wrap">

                {/* Mic */}
                <CtrlBtn
                  icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  label={isMicOn ? "Mute" : "Unmute"}
                  onClick={toggleMic}
                  active={isMicOn}
                  activeClass="bg-white/12 hover:bg-white/20"
                  inactiveClass="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  disabled={!isTeacher && !isJoined}
                />

                {/* Cam (teacher only) */}
                {isTeacher && (
                  <CtrlBtn
                    icon={isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    label={isCamOn ? "Camera" : "Cam Off"}
                    onClick={toggleCam}
                    active={isCamOn}
                    activeClass="bg-white/12 hover:bg-white/20"
                    inactiveClass="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  />
                )}

                {/* Speaker + Camera (student only) */}
                {!isTeacher && (
                  <>
                    <CtrlBtn
                      icon={isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      label={isSpeakerOn ? "Speaker" : "Muted"}
                      onClick={toggleSpeaker}
                      active={isSpeakerOn}
                      activeClass="bg-white/12 hover:bg-white/20"
                      inactiveClass="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    />
                    <CtrlBtn
                      icon={isCamOn && localVideoTrack ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      label={isCamOn && localVideoTrack ? "Camera" : "Cam Off"}
                      onClick={toggleStudentCam}
                      active={!!(isCamOn && localVideoTrack)}
                      activeClass="bg-white/12 hover:bg-white/20"
                      inactiveClass="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      disabled={!isJoined}
                    />
                  </>
                )}

                {/* Screen share (teacher only) */}
                {isTeacher && (
                  <CtrlBtn
                    icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                    label={isScreenSharing ? "Stop Share" : "Share Screen"}
                    onClick={toggleScreenShare}
                    active={isScreenSharing}
                    activeClass="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                    inactiveClass="bg-white/8 hover:bg-white/15"
                    disabled={!isJoined}
                  />
                )}

                {/* Poll (teacher only) */}
                {isTeacher && (
                  <CtrlBtn
                    icon={<BarChart2 className="w-5 h-5" />}
                    label="Poll"
                    onClick={() => { setShowPollCreator((v) => !v); setPanel("polls"); }}
                    active={showPollCreator}
                    activeClass="bg-primary/20 hover:bg-primary/30 text-primary"
                    inactiveClass="bg-white/8 hover:bg-white/15"
                    disabled={!isLive}
                  />
                )}

                {/* Doubts toggle (teacher only) */}
                {isTeacher && (
                  <CtrlBtn
                    icon={<HelpCircle className="w-5 h-5" />}
                    label={doubtEnabled ? "Doubts On" : "Doubts Off"}
                    onClick={toggleDoubts}
                    active={doubtEnabled}
                    activeClass="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                    inactiveClass="bg-white/8 hover:bg-white/15"
                    disabled={!isLive}
                  />
                )}

                {/* Raise hand (student) */}
                {!isTeacher && (
                  <CtrlBtn
                    icon={<Hand className="w-5 h-5" />}
                    label={isHandRaised ? "Lower Hand" : "Raise Hand"}
                    onClick={toggleHand}
                    active={isHandRaised}
                    activeClass="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400"
                    inactiveClass="bg-white/8 hover:bg-white/15"
                    disabled={!isJoined}
                  />
                )}

                {/* Ask doubt (student) — only when teacher has enabled doubts */}
                {!isTeacher && doubtEnabled && (
                  <CtrlBtn
                    icon={<HelpCircle className="w-5 h-5" />}
                    label="Ask Doubt"
                    onClick={() => setShowDoubtInput((v) => !v)}
                    active={showDoubtInput}
                    activeClass="bg-violet-500/20 hover:bg-violet-500/30 text-violet-400"
                    inactiveClass="bg-white/8 hover:bg-white/15"
                    disabled={!isJoined}
                  />
                )}

                {/* Participants button */}
                <CtrlBtn
                  icon={<Users className="w-5 h-5" />}
                  label={`People (${viewerCount})`}
                  onClick={() => setPanel("participants")}
                  active={panel === "participants"}
                  activeClass="bg-white/15 hover:bg-white/20"
                  inactiveClass="bg-white/8 hover:bg-white/15"
                />

                {/* Divider */}
                <div className="w-px h-10 bg-white/10 mx-1" />

                {/* End / Leave */}
                {isTeacher ? (
                  <button onClick={handleEnd} disabled={isEnding || isWaiting}
                    className="flex flex-col items-center gap-1.5 disabled:opacity-40">
                    <div className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                      {isEnding ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] text-white/40">End Class</span>
                  </button>
                ) : (
                  <button onClick={() => {
                    leaveAgora();
                    socketRef.current?.emit("live:leave", { sessionId: socketSessionId });
                    socketRef.current?.disconnect();
                    navigate(-1);
                  }} className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                      <PhoneOff className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-white/40">Leave</span>
                  </button>
                )}
              </div>

              {/* Doubt input bar */}
              <AnimatePresence>
                {showDoubtInput && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 flex-1 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2">
                        <HelpCircle className="w-4 h-4 text-violet-400 shrink-0" />
                        <input
                          value={doubtText}
                          onChange={(e) => setDoubtText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && submitDoubt()}
                          placeholder="Type your doubt and press Enter..."
                          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                          autoFocus
                        />
                      </div>
                      <button onClick={submitDoubt} disabled={!doubtText.trim()}
                        className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-bold disabled:opacity-40 transition-colors">
                        Send
                      </button>
                      <button onClick={() => setShowDoubtInput(false)}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center">
                        <X className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────────── */}
          <div className="w-[300px] xl:w-[320px] shrink-0 border-l border-white/5 flex flex-col bg-[#0d0d1a]">

            {/* Tab bar */}
            <div className="flex border-b border-white/5 shrink-0">
              {[
                { key: "chat" as SidePanel, icon: <MessageSquare className="w-3.5 h-3.5" />, label: "Chat" },
                { key: "polls" as SidePanel, icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Polls", badge: activePollCount },
                { key: "hands" as SidePanel, icon: <Hand className="w-3.5 h-3.5" />, label: "Hands", badge: handCount + unresolvedDoubts },
                { key: "participants" as SidePanel, icon: <Users className="w-3.5 h-3.5" />, label: `(${viewerCount})` },
              ].map((t) => (
                <button key={t.key} onClick={() => setPanel(t.key)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold relative transition-colors
                    ${panel === t.key ? "text-primary border-b-2 border-primary" : "text-white/30 hover:text-white/50 border-b-2 border-transparent"}`}>
                  {t.icon}
                  <span>{t.label}</span>
                  {!!t.badge && (
                    <span className="absolute top-1 right-1.5 min-w-[16px] h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center px-0.5 font-bold">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-hidden flex flex-col">

              {/* Chat */}
              {panel === "chat" && (
                <ChatPanel
                  messages={chatMessages}
                  onSend={sendChat}
                  onPin={isTeacher ? pinMessage : undefined}
                  isTeacher={isTeacher}
                  myName={user?.name ?? ""}
                />
              )}

              {/* Polls */}
              {panel === "polls" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {isTeacher && isLive && (
                    showPollCreator ? (
                      <PollCreator
                        sessionId={socketSessionId}
                        onCreated={(p) => setPolls((prev) => [p, ...prev])}
                        onClose={() => setShowPollCreator(false)}
                      />
                    ) : (
                      <button onClick={() => setShowPollCreator(true)}
                        className="w-full py-3 rounded-xl border border-dashed border-white/10 text-white/30 hover:border-primary/40 hover:text-primary/60 transition-colors text-xs flex items-center justify-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Create Poll
                      </button>
                    )
                  )}
                  {polls.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <BarChart3 className="w-8 h-8 text-white/10" />
                      <p className="text-xs text-white/30">No polls yet</p>
                    </div>
                  ) : (
                    polls.map((p) => (
                      <PollCard
                        key={p.id}
                        poll={p}
                        onVote={!isTeacher ? handleVote : undefined}
                        onClose={isTeacher ? handleClosePoll : undefined}
                        myVote={myVotes[p.id]}
                        isTeacher={isTeacher}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Hands + Doubts */}
              {panel === "hands" && (
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {/* Raised hands */}
                  {raisedHands.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                        Raised Hands ({raisedHands.length})
                      </p>
                      <div className="space-y-1.5">
                        {raisedHands.map((h) => (
                          <div key={h.userId} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                              {h.name[0]?.toUpperCase()}
                            </div>
                            <span className="text-xs text-white/80 truncate">{h.name}</span>
                            <Hand className="w-3.5 h-3.5 text-amber-400 ml-auto shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doubts */}
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                      Doubts {unresolvedDoubts > 0 && <span className="text-amber-400">({unresolvedDoubts} pending)</span>}
                    </p>
                    {doubts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <HelpCircle className="w-8 h-8 text-white/10" />
                        <p className="text-xs text-white/30">No doubts yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {doubts.map((d) => (
                          <DoubtCard
                            key={d.id}
                            doubt={d}
                            isTeacher={isTeacher}
                            onResolve={resolveDoubt}
                            onAnswer={isTeacher ? answerDoubt : undefined}
                            onAskAI={isTeacher ? askAiForDoubt : undefined}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {raisedHands.length === 0 && doubts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Hand className="w-8 h-8 text-white/10" />
                      <p className="text-xs text-white/30">No raised hands or doubts</p>
                    </div>
                  )}
                </div>
              )}

              {/* Participants */}
              {panel === "participants" && (
                <ParticipantsPanel participants={participants} raisedHands={raisedHands} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
