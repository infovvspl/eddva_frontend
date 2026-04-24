import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalVideoTrack,
  ILocalAudioTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Hand, Send,
  Users, MessageSquare, Loader2, MonitorUp, MonitorOff,
  BarChart3, Pin, X, CheckCircle, Circle, Radio,
  Plus, Smile, ArrowLeft, Crown, MoreVertical, Copy,
  Check, Maximize2, Minimize2, ChevronLeft, LayoutGrid,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  getLiveClassToken, startLiveClass, endLiveClass, getLiveSession,
  respondToPoll, createPoll, closePoll, getChatHistory, getPolls,
  attachRecording,
  type LiveSessionInfo, type LiveChatMessage, type LivePoll,
} from "@/lib/api/live-class";
import { uploadLiveRecordingToBackend } from "@/lib/api/upload";
import { cn } from "@/lib/utils";
import { getApiOrigin } from "@/lib/api-config";

AgoraRTC.setLogLevel(4);

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL?.replace(/\/api\/v\d+\/?$/, "") ||
  getApiOrigin() ||
  "http://127.0.0.1:3000") as string;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  userId: string;
  name: string;
  role: "teacher" | "student";
  joinedAt: number;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  x: number;
}

type SidePanel = "chat" | "participants" | "polls" | "hands" | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

const formatDuration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

const REACTIONS = ["👏", "❤️", "🎉", "🔥", "👍", "😂", "😮", "🙏"];

// Seeded color from a string so every participant has a stable gradient
const avatarGradient = (seed: string) => {
  const palettes = [
    "from-blue-500 to-indigo-600",
    "from-violet-500 to-fuchsia-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-600",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
};

// ─── Video Tile ───────────────────────────────────────────────────────────────

interface VideoTileProps {
  videoTrack?: ILocalVideoTrack | null;
  remoteTrack?: IAgoraRTCRemoteUser["videoTrack"];
  label: string;
  sublabel?: string;
  isLocal?: boolean;
  isCamOn?: boolean;
  isMicOn?: boolean;
  isScreenShare?: boolean;
  isSpeaking?: boolean;
  isTeacher?: boolean;
  isPinned?: boolean;
  size?: "main" | "grid" | "pip";
}

function VideoTile({
  videoTrack, remoteTrack, label, sublabel,
  isLocal = false, isCamOn = true, isMicOn = true,
  isScreenShare = false, isSpeaking = false, isTeacher = false,
  isPinned = false, size = "grid",
}: VideoTileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const track = videoTrack ?? remoteTrack;

  useEffect(() => {
    if (track && containerRef.current && (isCamOn || isScreenShare)) {
      try { (track as any).play(containerRef.current, { fit: isScreenShare ? "contain" : "cover" }); } catch {}
    }
    return () => { try { (track as any)?.stop?.(); } catch {} };
  }, [track, isCamOn, isScreenShare]);

  const showVideo = track && (isCamOn || isScreenShare);
  const avatarSize =
    size === "main" ? "w-24 h-24 text-2xl" :
    size === "pip" ? "w-12 h-12 text-sm" : "w-16 h-16 text-lg";

  return (
    <div
      className={cn(
        "relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300",
        "bg-gradient-to-br from-slate-800 to-slate-900",
        isSpeaking
          ? "ring-4 ring-emerald-400 shadow-2xl shadow-emerald-500/30"
          : "ring-1 ring-white/5",
      )}
    >
      {/* Video or avatar */}
      {showVideo ? (
        <div ref={containerRef} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "rounded-full flex items-center justify-center font-black text-white shadow-2xl bg-gradient-to-br",
              avatarGradient(label),
              avatarSize,
            )}
          >
            {getInitials(label)}
          </div>
        </div>
      )}

      {/* Top-right badges */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        {isPinned && (
          <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1">
            <Pin className="w-3 h-3 text-white" />
          </div>
        )}
        {isScreenShare && (
          <div className="px-2 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md flex items-center gap-1">
            <MonitorUp className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white uppercase">Sharing</span>
          </div>
        )}
      </div>

      {/* Bottom-left name chip */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md max-w-[70%]">
          {!isMicOn && <MicOff className="w-3 h-3 text-red-400 shrink-0" />}
          {isTeacher && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          <span className="text-xs font-semibold text-white truncate">
            {label}{isLocal && " (You)"}
          </span>
        </div>
        {sublabel && size === "main" && (
          <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md">
            <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">{sublabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat Panel ───────────────────────────────────────────────────────────────

function ChatPanel({
  messages, onSend, onPin, isTeacher, myId,
}: {
  messages: LiveChatMessage[];
  onSend: (msg: string) => void;
  onPin?: (msgId: string) => void;
  isTeacher: boolean;
  myId: string;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-10 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold">No messages yet</p>
            <p className="text-xs text-slate-400 mt-1">Say hi to your class!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === myId;
          const isT = msg.senderRole === "teacher";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}
            >
              {!isMe && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className={cn("text-[11px] font-bold", isT ? "text-blue-600" : "text-slate-600")}>
                    {msg.senderName}
                  </span>
                  {isT && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-black uppercase">
                      Host
                    </span>
                  )}
                </div>
              )}
              <div
                className={cn(
                  "relative max-w-[85%] rounded-2xl px-3.5 py-2 break-words",
                  msg.isPinned
                    ? "bg-amber-50 border border-amber-200 text-amber-900"
                    : isMe
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-800",
                )}
              >
                {msg.isPinned && (
                  <Pin className="w-3 h-3 absolute -top-1.5 -left-1.5 text-amber-500 rotate-45" />
                )}
                <p className="text-sm leading-snug">{msg.message}</p>
                {isTeacher && !msg.isPinned && !isMe && onPin && (
                  <button
                    onClick={() => onPin(msg.id)}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-300 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Participants Panel ──────────────────────────────────────────────────────

function ParticipantsPanel({
  participants, myId, hostId,
}: {
  participants: Participant[];
  myId: string;
  hostId?: string;
}) {
  const sorted = useMemo(() => {
    return [...participants].sort((a, b) => {
      if (a.role === "teacher" && b.role !== "teacher") return -1;
      if (b.role === "teacher" && a.role !== "teacher") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [participants]);

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-1.5">
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Users className="w-10 h-10 mb-2" />
          <p className="text-sm font-semibold">Nobody here yet</p>
        </div>
      )}
      {sorted.map((p) => {
        const isMe = p.userId === myId;
        const isHost = p.role === "teacher" || p.userId === hostId;
        return (
          <div
            key={p.userId}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-xs bg-gradient-to-br shrink-0",
                avatarGradient(p.name),
              )}
            >
              {getInitials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {p.name}{isMe && " (You)"}
              </p>
              <p className="text-[11px] text-slate-400 font-medium capitalize">{p.role}</p>
            </div>
            {isHost && (
              <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                <Crown className="w-2.5 h-2.5 text-amber-600" />
                <span className="text-[9px] font-black text-amber-700 uppercase">Host</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Hands Panel ──────────────────────────────────────────────────────────────

function HandsPanel({
  hands, isTeacher, onLowerFor,
}: {
  hands: { userId: string; name: string }[];
  isTeacher: boolean;
  onLowerFor?: (userId: string) => void;
}) {
  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-2">
      {hands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Hand className="w-10 h-10 mb-2" />
          <p className="text-sm font-semibold">No raised hands</p>
          <p className="text-xs mt-1">Students will appear here when they raise their hand.</p>
        </div>
      ) : (
        hands.map((h, i) => (
          <motion.div
            key={h.userId}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200"
          >
            <div className="shrink-0 w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white font-black text-xs">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{h.name}</p>
              <p className="text-[11px] text-amber-700 font-semibold">Wants to speak</p>
            </div>
            <Hand className="w-4 h-4 text-amber-600" />
            {isTeacher && onLowerFor && (
              <button
                onClick={() => onLowerFor(h.userId)}
                className="shrink-0 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-700 hover:bg-amber-100"
              >
                Lower
              </button>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

// ─── Polls Panel ──────────────────────────────────────────────────────────────

function PollsPanel({
  polls, isTeacher, myVotes, onVote, onClose, onCreate,
}: {
  polls: LivePoll[];
  isTeacher: boolean;
  myVotes: Record<string, number>;
  onVote: (pollId: string, option: number) => void;
  onClose: (pollId: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      {isTeacher && (
        <div className="px-4 pt-3 pb-2 border-b border-slate-100">
          <button
            onClick={onCreate}
            className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Poll
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {polls.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <BarChart3 className="w-10 h-10 mb-2" />
            <p className="text-sm font-semibold">No polls yet</p>
            {isTeacher && <p className="text-xs mt-1">Create a quick poll to engage your class.</p>}
          </div>
        ) : (
          polls.map((p) => (
            <PollCard
              key={p.id}
              poll={p}
              isTeacher={isTeacher}
              myVote={myVotes[p.id]}
              onVote={onVote}
              onClose={onClose}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PollCard({
  poll, isTeacher, myVote, onVote, onClose,
}: {
  poll: LivePoll;
  isTeacher: boolean;
  myVote?: number;
  onVote: (pollId: string, i: number) => void;
  onClose: (pollId: string) => void;
}) {
  const hasVoted = myVote !== undefined;
  const showResults = !poll.isActive || hasVoted || isTeacher;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-4",
        poll.isActive ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="text-sm font-bold text-slate-900 flex-1">{poll.question}</h4>
        <span
          className={cn(
            "shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
            poll.isActive ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600",
          )}
        >
          {poll.isActive ? "Live" : "Closed"}
        </span>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const result = poll.results?.find((r) => r.index === i);
          const pct = result?.percentage ?? 0;
          const isCorrect = poll.correctOptionIndex === i && !poll.isActive;
          const isSelected = myVote === i;
          return (
            <button
              key={i}
              disabled={isTeacher || !poll.isActive || hasVoted}
              onClick={() => onVote(poll.id, i)}
              className={cn(
                "w-full relative overflow-hidden rounded-xl border text-left transition-all",
                isCorrect
                  ? "border-emerald-400 bg-emerald-50"
                  : isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-blue-300",
                (!poll.isActive || hasVoted || isTeacher) && "cursor-default",
              )}
            >
              {showResults && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                  className={cn(
                    "absolute inset-y-0 left-0",
                    isCorrect ? "bg-emerald-200/60" : isSelected ? "bg-blue-200/60" : "bg-slate-100",
                  )}
                />
              )}
              <div className="relative px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isCorrect ? "text-emerald-700" : "text-slate-800",
                    )}
                  >
                    {opt}
                  </span>
                </div>
                {showResults && (
                  <span className="text-xs font-black text-slate-600 tabular-nums">
                    {Math.round(pct)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      {isTeacher && poll.isActive && (
        <button
          onClick={() => onClose(poll.id)}
          className="mt-3 w-full h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Close Poll
        </button>
      )}
    </motion.div>
  );
}

// ─── Create Poll Modal ───────────────────────────────────────────────────────

function CreatePollModal({
  onClose, onCreate,
}: {
  onClose: () => void;
  onCreate: (question: string, options: string[], correctIndex?: number) => Promise<void>;
}) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    question.trim().length > 0 && options.filter((o) => o.trim().length > 0).length >= 2;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate(
        question.trim(),
        options.map((o) => o.trim()).filter(Boolean),
        correctIndex ?? undefined,
      );
      onClose();
    } catch {
      toast.error("Failed to create poll");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Create Poll</h3>
              <p className="text-[11px] text-slate-400 font-medium">Ask your class a question</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1.5 block">Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What's Newton's second law?"
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500">Options</label>
              <span className="text-[10px] text-slate-400">Tap circle to mark correct</span>
            </div>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(correctIndex === i ? null : i)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      correctIndex === i
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-slate-300 hover:border-emerald-400",
                    )}
                  >
                    {correctIndex === i ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-[10px] font-black text-slate-400">{i + 1}</span>
                    )}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 focus:bg-white"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                      className="w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={() => setOptions([...options, ""])}
                  className="w-full h-10 rounded-xl border border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add option
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!canSubmit || submitting}
            className="flex-1 h-11 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Launch Poll"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────

function CtrlBtn({
  icon, label, onClick, active, danger, disabled, badge,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative flex flex-col items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <div
        className={cn(
          "relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
          danger
            ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30"
            : active
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
        )}
      >
        {icon}
        {!!badge && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center border-2 border-slate-900">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold text-white/60 group-hover:text-white/90 transition-colors whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

// ─── Reactions Overlay ───────────────────────────────────────────────────────

function ReactionsOverlay({ reactions }: { reactions: FloatingReaction[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 h-[60vh] overflow-hidden">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            initial={{ y: 0, opacity: 0, scale: 0.5 }}
            animate={{ y: -400, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-0 text-5xl"
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveClassRoom() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher" || user?.role === "institute_admin";

  // ── Session
  const [session, setSession] = useState<LiveSessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [ended, setEnded] = useState(false);
  const [endStats, setEndStats] = useState<{ duration: number; attendanceCount: number; recordingUrl: string | null } | null>(null);

  // ── Agora
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [speakingUids, setSpeakingUids] = useState<Set<number>>(new Set());
  const [myUid, setMyUid] = useState<number | null>(null);

  // ── Socket
  const socketRef = useRef<Socket | null>(null);
  const [socketSessionId, setSocketSessionId] = useState("");

  // ── UI State
  const [panel, setPanel] = useState<SidePanel>(null);
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [raisedHands, setRaisedHands] = useState<{ userId: string; name: string }[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const [viewMode, setViewMode] = useState<"speaker" | "grid">("speaker");
  const [durationTick, setDurationTick] = useState(0);
  const [isBrowserRecording, setIsBrowserRecording] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);

  const myId = user?.id ?? "";

  // ── Tick duration every second while live
  useEffect(() => {
    if (session?.status !== "live") return;
    startTimeRef.current = startTimeRef.current ?? Date.now();
    const t = setInterval(() => setDurationTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [session?.status]);

  const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
  // durationTick consumed so linter doesn't drop the interval
  void durationTick;

  // ── Load session
  const loadSession = useCallback(async () => {
    if (!lectureId) return;
    try {
      const s = await getLiveSession(lectureId);
      setSession(s);
      setViewerCount(s.currentViewerCount);
      if (s.status === "ended") setEnded(true);
    } catch {
      toast.error("Could not load live class.");
    } finally {
      setSessionLoading(false);
    }
  }, [lectureId]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // ── Auto-poll for session status when student is waiting for host to start
  useEffect(() => {
    if (isTeacher || isJoined || ended) return;
    if (session?.status !== "waiting") return;
    const t = setInterval(loadSession, 4000);
    return () => clearInterval(t);
  }, [isTeacher, isJoined, ended, session?.status, loadSession]);

  // ── Browser recording (fallback when Agora cloud recording fails)
  // Uses getUserMedia directly — more reliable than extracting from Agora SDK tracks
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const startBrowserRecording = useCallback(async () => {
    console.log("[Recording] startBrowserRecording called");
    try {
      if (typeof MediaRecorder === "undefined") {
        console.warn("[Recording] MediaRecorder not supported in this browser");
        return;
      }

      let stream: MediaStream | null = null;

      // Attempt 1: camera + mic
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      } catch { /* no camera */ }

      // Attempt 2: mic only
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch { /* no mic */ }
      }

      // Attempt 3: reuse Agora's already-acquired audio track
      if (!stream) {
        const agoraMediaTrack = localAudioTrackRef.current?.getMediaStreamTrack?.();
        if (agoraMediaTrack) {
          stream = new MediaStream([agoraMediaTrack]);
          console.log("[Recording] Using Agora audio track as source");
        }
      }

      if (!stream) {
        console.warn("[Recording] No audio/video source available — skipping recording");
        return;
      }

      recordingStreamRef.current = stream;

      const mimeType =
        ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"].find(
          (t) => MediaRecorder.isTypeSupported(t),
        ) ?? "";

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 300_000,
      });
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.start(10_000);
      mediaRecorderRef.current = recorder;
      setIsBrowserRecording(true);
      console.log("[Recording] Started via getUserMedia, mimeType:", mimeType || "browser default");
    } catch (err) {
      console.warn("[Recording] Failed to start:", err);
    }
  }, []);

  const stopBrowserRecordingAndUpload = useCallback(async (lId: string): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return null;

    return new Promise<string | null>((resolve) => {
      recorder.onstop = async () => {
        // Release camera/mic
        recordingStreamRef.current?.getTracks().forEach((t) => t.stop());
        recordingStreamRef.current = null;

        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordingChunksRef.current, { type: mimeType });
        recordingChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsBrowserRecording(false);

        if (blob.size < 1024) { resolve(null); return; }

        const ext = mimeType.includes("mp4") ? ".mp4" : ".webm";
        const file = new File([blob], `recording${ext}`, { type: mimeType });
        toast.info("Saving recording…", { id: "rec-upload", duration: 120_000 });
        try {
          const url = await uploadLiveRecordingToBackend(lId, file);
          await attachRecording(lId, url);
          toast.dismiss("rec-upload");
          toast.success("Recording saved!");
          resolve(url);
        } catch (err) {
          toast.dismiss("rec-upload");
          console.warn("[Recording] upload failed:", err);
          resolve(null);
        }
      };
      recorder.stop();
    });
  }, []);

  // ── Agora leave
  const leaveAgora = useCallback(async () => {
    try { screenTrack?.stop(); screenTrack?.close(); } catch {}
    try { localVideoTrack?.stop(); localVideoTrack?.close(); } catch {}
    try { localAudioTrack?.stop(); localAudioTrack?.close(); } catch {}
    try { await clientRef.current?.leave(); } catch {}
    clientRef.current = null;
    setIsJoined(false);
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setScreenTrack(null);
    setRemoteUsers([]);
    setIsScreenSharing(false);
  }, [screenTrack, localVideoTrack, localAudioTrack]);

  // ── Agora join
  const joinAgora = useCallback(async (
    token: string | null, channelName: string, uid: number, role: "host" | "audience",
  ) => {
    if (clientRef.current) return;
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;
    setMyUid(uid);

    client.on("user-published", async (remoteUser, mediaType) => {
      await client.subscribe(remoteUser, mediaType);
      if (mediaType === "audio") remoteUser.audioTrack?.play();
      setRemoteUsers((prev) => {
        const exists = prev.find((u) => u.uid === remoteUser.uid);
        return exists
          ? prev.map((u) => (u.uid === remoteUser.uid ? remoteUser : u))
          : [...prev, remoteUser];
      });
    });

    client.on("user-unpublished", (remoteUser) => {
      setRemoteUsers((prev) => prev.map((u) => (u.uid === remoteUser.uid ? remoteUser : u)));
    });

    client.on("user-left", (remoteUser) => {
      setRemoteUsers((prev) => prev.filter((u) => u.uid !== remoteUser.uid));
    });

    // Speaking detection
    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", (volumes) => {
      const speaking = new Set<number>();
      volumes.forEach((v) => {
        if (v.level > 5) speaking.add(Number(v.uid));
      });
      setSpeakingUids(speaking);
    });

    try {
      await client.setClientRole(role === "host" ? "host" : "audience");
      console.log("[Agora] appId:", AGORA_APP_ID);
      console.log("[Agora] channelName:", channelName, "uid:", uid);
      console.log("[Agora] token:", token ? token.substring(0, 30) + "..." : "NULL (App ID only mode)");
      await client.join(AGORA_APP_ID, channelName, token, uid);
    } catch (err: any) {
      const code = err?.code ?? err?.message ?? String(err);
      console.error("[Agora join failed] full error:", err);
      clientRef.current = null;
      throw new Error(`Failed to connect: ${code}`);
    }

    if (role === "host") {
      try {
        const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { AEC: true, ANS: true, AGC: true },
          { encoderConfig: "720p_2" },
        );
        localAudioTrackRef.current = audio;
        setLocalAudioTrack(audio);
        setLocalVideoTrack(video);
        await client.publish([audio, video]);
      } catch (err) {
        console.warn("Camera/mic failed, trying mic only", err);
        try {
          const audio = await AgoraRTC.createMicrophoneAudioTrack();
          localAudioTrackRef.current = audio;
          setLocalAudioTrack(audio);
          await client.publish(audio);
          setIsCamOn(false);
          toast.warning("Camera unavailable — joined with mic only.");
        } catch {
          toast.error("Microphone and camera access denied.");
        }
      }
    }
    setIsJoined(true);
    startTimeRef.current = Date.now();
  }, []);

  // ── Connect socket
  const connectSocket = useCallback((sessionId: string, uid: number) => {
    if (socketRef.current?.connected) return;
    setSocketSessionId(sessionId);
    const socket = io(`${SOCKET_URL}/live`, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token: localStorage.getItem("eddva_access_token") },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("live:join", {
        sessionId,
        userId: user?.id,
        name: user?.name,
        role: user?.role,
        tenantId: user?.tenantId,
        agoraUid: uid,
      });
    });

    socket.on("live:joined", ({ handRaiseQueue, participants: pts }) => {
      if (handRaiseQueue) setRaisedHands(handRaiseQueue);
      if (pts) setParticipants(pts);
    });

    socket.on("live:participant-joined", (data) => {
      setViewerCount(data.currentCount);
      setParticipants((prev) =>
        prev.find((p) => p.userId === data.userId)
          ? prev
          : [...prev, { userId: data.userId, name: data.name, role: data.role, joinedAt: Date.now() }],
      );
    });

    socket.on("live:participant-left", (data) => {
      setViewerCount(data.currentCount);
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
    });

    socket.on("live:new-message", (msg: LiveChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
      setUnreadChat((n) => (panel === "chat" ? 0 : n + 1));
    });

    socket.on("live:hand-raise-update", ({ queue }) => {
      setRaisedHands(queue || []);
      const mine = (queue || []).some((q: any) => q.userId === user?.id);
      setHandRaised(mine);
    });

    socket.on("live:new-poll", (poll: LivePoll) => {
      setPolls((prev) => [poll, ...prev]);
      if (!isTeacher) toast.info("New poll: " + poll.question);
    });

    socket.on("live:poll-closed", (data: { pollId: string; results: any; correctOptionIndex?: number | null }) => {
      setPolls((prev) =>
        prev.map((p) =>
          p.id === data.pollId
            ? { ...p, isActive: false, results: data.results, correctOptionIndex: data.correctOptionIndex ?? p.correctOptionIndex }
            : p,
        ),
      );
    });

    socket.on("live:poll-results-update", (data: { pollId: string; results: any }) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === data.pollId ? { ...p, results: data.results } : p)),
      );
    });

    socket.on("live:reaction", (data: { emoji: string }) => {
      setReactions((prev) => [
        ...prev,
        { id: Math.random().toString(36), emoji: data.emoji, x: Math.random() * 70 + 15 },
      ]);
    });

    socket.on("live:class-ended", () => {
      toast.info("The host ended the class.");
      leaveAgora();
      setEnded(true);
    });

    socket.on("live:error", (err: { message?: string }) => {
      toast.error(err?.message || "Live class error — please rejoin");
    });
  }, [user, isTeacher, leaveAgora, panel]);

  // ── Load initial chat + polls once joined
  useEffect(() => {
    if (!socketSessionId) return;
    getChatHistory(socketSessionId).then((r) => setChatMessages(r.data.reverse())).catch(() => {});
    getPolls(socketSessionId).then(setPolls).catch(() => {});
  }, [socketSessionId]);

  // ── Auto-reset unread when chat panel opened
  useEffect(() => {
    if (panel === "chat") setUnreadChat(0);
  }, [panel]);

  // ── Auto-cleanup reactions after 3s
  useEffect(() => {
    if (reactions.length === 0) return;
    const t = setTimeout(() => {
      setReactions((prev) => prev.slice(1));
    }, 3100);
    return () => clearTimeout(t);
  }, [reactions]);

  // ── Student auto-connect when session goes live
  useEffect(() => {
    if (!session || isTeacher || isJoined || ended) return;
    if (session.status !== "live") return;
    (async () => {
      setIsJoining(true);
      try {
        const r = await getLiveClassToken(lectureId!, "audience");
        await joinAgora(r.token, r.channelName, r.uid, "audience");
        connectSocket(r.sessionId, r.uid);
      } catch {
        toast.error("Could not join class");
      } finally {
        setIsJoining(false);
      }
    })();
  }, [session, isTeacher, isJoined, ended, lectureId, joinAgora, connectSocket]);

  // ── Cleanup
  useEffect(() => {
    return () => {
      leaveAgora();
      socketRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Teacher: start class (session is waiting → creates Agora channel)
  const handleStart = async () => {
    setIsStarting(true);
    try {
      const r = await startLiveClass(lectureId!);
      setSession((prev) => (prev ? { ...prev, status: "live", startedAt: new Date().toISOString() } : prev));
      await joinAgora(r.token, r.channelName, r.uid, "host");
      connectSocket(r.sessionId, r.uid);
      await startBrowserRecording();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      toast.error(msg.startsWith("Failed to connect") ? msg : "Failed to start class — check console");
      console.error("[handleStart]", err);
    } finally {
      setIsStarting(false);
    }
  };

  // ── Teacher: rejoin an already-live session (e.g. after page refresh)
  const handleRejoin = async () => {
    setIsJoining(true);
    try {
      const r = await getLiveClassToken(lectureId!, "host");
      await joinAgora(r.token, r.channelName, r.uid, "host");
      connectSocket(r.sessionId, r.uid);
      await startBrowserRecording();
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      toast.error(msg.startsWith("Failed to connect") ? msg : "Failed to rejoin class — check console");
      console.error("[handleRejoin]", err);
    } finally {
      setIsJoining(false);
    }
  };

  // ── Teacher: end class
  const handleEnd = async () => {
    if (!confirm("End the class for everyone?")) return;
    setIsEnding(true);
    try {
      const r = await endLiveClass(lectureId!);

      let finalRecordingUrl = r.recordingUrl;

      if (!finalRecordingUrl) {
        // Agora cloud recording didn't produce a URL — use browser recording fallback.
        // Must run BEFORE leaveAgora so Agora tracks are still alive.
        finalRecordingUrl = await stopBrowserRecordingAndUpload(lectureId!);
      } else {
        // Cloud recording succeeded — discard browser recording chunks
        const rec = mediaRecorderRef.current;
        if (rec && rec.state !== "inactive") {
          rec.ondataavailable = null;
          rec.stop();
        }
        recordingChunksRef.current = [];
        mediaRecorderRef.current = null;
      }

      setEndStats({ duration: r.duration, attendanceCount: r.attendanceCount, recordingUrl: finalRecordingUrl });
      setEnded(true);
      leaveAgora();
      socketRef.current?.disconnect();
    } catch {
      toast.error("Failed to end class");
    } finally {
      setIsEnding(false);
    }
  };

  // ── Toggle mic
  const toggleMic = async () => {
    if (!localAudioTrack) return;
    await localAudioTrack.setEnabled(!isMicOn);
    setIsMicOn(!isMicOn);
  };

  // ── Toggle camera
  const toggleCam = async () => {
    if (!localVideoTrack || isScreenSharing) return;
    await localVideoTrack.setEnabled(!isCamOn);
    setIsCamOn(!isCamOn);
  };

  // ── Toggle screen share (teacher)
  const toggleScreenShare = async () => {
    if (!clientRef.current) return;
    if (isScreenSharing) {
      try {
        if (screenTrack) {
          await clientRef.current.unpublish(screenTrack);
          screenTrack.stop();
          screenTrack.close();
        }
        setScreenTrack(null);
        setIsScreenSharing(false);
        if (localVideoTrack) {
          await clientRef.current.publish(localVideoTrack);
        }
        socketRef.current?.emit("live:screen-share-stopped", { sessionId: socketSessionId });
      } catch {
        toast.error("Failed to stop screen share");
      }
      return;
    }

    try {
      const track = await AgoraRTC.createScreenVideoTrack(
        { encoderConfig: "1080p_1" },
        "disable",
      );
      const screenVideo = Array.isArray(track) ? track[0] : track;
      if (localVideoTrack) {
        try { await clientRef.current.unpublish(localVideoTrack); } catch {}
      }
      await clientRef.current.publish(screenVideo);
      setScreenTrack(screenVideo as ILocalVideoTrack);
      setIsScreenSharing(true);
      socketRef.current?.emit("live:screen-share-started", {
        sessionId: socketSessionId,
        userId: user?.id,
        name: user?.name,
      });
      (screenVideo as any).on?.("track-ended", () => { toggleScreenShare(); });
    } catch (err: any) {
      if (err?.code !== "PERMISSION_DENIED") {
        toast.error("Screen share failed");
      }
    }
  };

  // ── Raise / lower hand
  const toggleHand = () => {
    if (!socketRef.current) return;
    if (handRaised) {
      socketRef.current.emit("live:lower-hand", { sessionId: socketSessionId });
    } else {
      socketRef.current.emit("live:raise-hand", { sessionId: socketSessionId });
    }
    setHandRaised(!handRaised);
  };

  // ── Teacher: lower a student's hand
  const lowerHandFor = (userId: string) => {
    setRaisedHands((prev) => prev.filter((h) => h.userId !== userId));
    void userId;
  };

  // ── Send chat
  const sendChat = (msg: string) => {
    socketRef.current?.emit("live:chat", { sessionId: socketSessionId, message: msg });
  };

  // ── Pin message
  const pinMessage = (msgId: string) => {
    socketRef.current?.emit("live:pin-message", { sessionId: socketSessionId, messageId: msgId });
  };

  // ── Vote
  const handleVote = async (pollId: string, option: number) => {
    try {
      await respondToPoll(pollId, option);
      setMyVotes((prev) => ({ ...prev, [pollId]: option }));
      socketRef.current?.emit("live:poll-answer", { pollId, selectedOption: option, sessionId: socketSessionId });
    } catch {
      toast.error("Vote failed");
    }
  };

  // ── Teacher: create poll
  const handleCreatePoll = async (question: string, options: string[], correctIndex?: number) => {
    if (!socketSessionId) return;
    await createPoll(socketSessionId, question, options, correctIndex);
    // Poll is added via the live:new-poll socket event broadcast to all clients
  };

  // ── Teacher: close poll
  const handleClosePoll = async (pollId: string) => {
    try {
      const p = await closePoll(pollId);
      setPolls((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    } catch {
      toast.error("Failed to close poll");
    }
  };

  // ── Send reaction
  const sendReaction = (emoji: string) => {
    setReactions((prev) => [
      ...prev,
      { id: Math.random().toString(36), emoji, x: Math.random() * 70 + 15 },
    ]);
    socketRef.current?.emit("live:reaction", { sessionId: socketSessionId, emoji });
    setShowReactionPicker(false);
  };

  // ── Copy invite
  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Invite link copied");
  };

  // ── Build remote list with speaking flag & role info
  const teacherRemote = remoteUsers.find((u) => {
    const p = participants.find((pt) => Number(u.uid) === Number(u.uid));
    return p?.role === "teacher";
  }) ?? remoteUsers[0];

  const mainUser = isTeacher
    ? { kind: "local" as const }
    : teacherRemote
      ? { kind: "remote" as const, user: teacherRemote }
      : null;

  // ─── Render: loading ───────────────────────────────────────────────────────

  if (sessionLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Connecting to class...</p>
      </div>
    );
  }

  // ─── Render: ended ─────────────────────────────────────────────────────────

  if (ended) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 mx-auto flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Class ended</h1>
            <p className="text-sm text-slate-500 mb-6">
              {isTeacher ? "Great job! Here's a quick summary:" : "Thanks for attending!"}
            </p>
            {endStats && (
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-2xl font-black text-slate-900">{formatDuration(endStats.duration * 60 * 1000)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attended</p>
                    <p className="text-2xl font-black text-slate-900">{endStats.attendanceCount}</p>
                  </div>
                </div>
                {endStats.recordingUrl ? (
                  <a
                    href={endStats.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left hover:bg-emerald-100 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800">Recording ready</p>
                      <p className="text-[10px] text-emerald-600">Click to watch or share with students</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center gap-3 w-full bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
                      <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800">Recording processing</p>
                      <p className="text-[10px] text-amber-600">Will be available in the lecture shortly</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => navigate(-1)}
              className="w-full h-11 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              Back to dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: waiting (teacher hasn't started/joined, student is waiting) ─────
  // Show pre-join screen whenever the user hasn't entered Agora yet
  const isWaiting = !isJoined && !isJoining;

  if (isWaiting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="h-32 bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-600 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Video className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="absolute top-3 left-3">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <h1 className="text-xl font-black text-slate-900 mb-1 truncate">
              {session?.lectureTitle ?? "Live Class"}
            </h1>
            {session?.topicName && (
              <p className="text-xs text-slate-500 font-semibold mb-4">{session.topicName}</p>
            )}
            <div className="flex items-center gap-2 mb-5">
              {session?.teacherName && (
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs bg-gradient-to-br",
                    avatarGradient(session.teacherName),
                  )}>
                    {getInitials(session.teacherName)}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Host</p>
                    <p className="text-xs font-bold text-slate-800">{session.teacherName}</p>
                  </div>
                </div>
              )}
            </div>

            {isTeacher ? (
              session?.status === "live" ? (
                <button
                  onClick={handleRejoin}
                  disabled={isJoining}
                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radio className="w-4 h-4" /> Rejoin Live</>}
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={isStarting}
                  className="w-full h-12 rounded-2xl bg-blue-600 text-white text-sm font-black hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radio className="w-4 h-4" /> Go Live</>}
                </button>
              )
            ) : session?.status === "live" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <p className="text-xs font-bold text-emerald-800">Class is live!</p>
                </div>
                <button
                  onClick={async () => {
                    setIsJoining(true);
                    try {
                      const r = await getLiveClassToken(lectureId!, "audience");
                      await joinAgora(r.token, r.channelName, r.uid, "audience");
                      connectSocket(r.sessionId, r.uid);
                    } catch {
                      toast.error("Could not join — please try again");
                    } finally {
                      setIsJoining(false);
                    }
                  }}
                  disabled={isJoining}
                  className="w-full h-12 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Radio className="w-4 h-4" /> Join Now</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <p className="text-xs font-bold text-amber-800">Waiting for the host to start...</p>
                </div>
                <p className="text-[11px] text-slate-400 text-center">You'll be connected automatically when the class begins.</p>
              </div>
            )}

            <button
              onClick={copyInvite}
              className="w-full mt-3 h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" /> Copy invite link
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Render: main live room ─────────────────────────────────────────────────

  const remoteVideoUsers = remoteUsers.filter((u) => u.hasVideo);
  const gridCount = (isTeacher ? 1 : 0) + remoteVideoUsers.length;
  const mainLabel = isTeacher
    ? user?.name ?? "You"
    : session?.teacherName ?? "Host";

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* ─── Top bar ─── */}
      <div className="shrink-0 h-14 px-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white truncate max-w-[260px]">
              {session?.lectureTitle ?? "Live Class"}
            </h1>
            {session?.topicName && (
              <p className="text-[10px] text-white/50 font-semibold truncate max-w-[260px]">
                {session.topicName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session?.status === "live" && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-red-400 animate-ping opacity-75" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[10px] font-black text-red-200 uppercase tracking-widest">Live</span>
              <span className="text-[10px] font-black text-red-200 tabular-nums">
                {formatDuration(elapsed)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Users className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs font-black text-white tabular-nums">{viewerCount}</span>
          </div>
          <button
            onClick={() => setViewMode(viewMode === "speaker" ? "grid" : "speaker")}
            title="Toggle view"
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white items-center justify-center"
          >
            {viewMode === "speaker" ? <LayoutGrid className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={copyInvite}
            title="Copy invite"
            className="hidden md:flex w-9 h-9 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white items-center justify-center"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── Main area ─── */}
      <div className="flex-1 flex min-h-0">
        {/* Stage */}
        <div className="flex-1 relative min-w-0 flex flex-col">
          <div className="flex-1 p-4 min-h-0 relative">
            {isJoining && !isJoined ? (
              <div className="w-full h-full rounded-2xl bg-slate-900 border border-white/5 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                <p className="text-sm text-white/60 font-semibold">Joining class...</p>
              </div>
            ) : viewMode === "speaker" || gridCount <= 1 ? (
              // Speaker / spotlight view
              <div className="w-full h-full flex flex-col gap-3">
                <div className="flex-1 min-h-0">
                  {mainUser?.kind === "local" ? (
                    <VideoTile
                      videoTrack={isScreenSharing ? screenTrack : localVideoTrack}
                      label={mainLabel}
                      isLocal
                      isCamOn={isCamOn || isScreenSharing}
                      isMicOn={isMicOn}
                      isScreenShare={isScreenSharing}
                      isSpeaking={myUid !== null && speakingUids.has(myUid)}
                      isTeacher
                      isPinned
                      size="main"
                      sublabel={isScreenSharing ? "Screen share" : undefined}
                    />
                  ) : mainUser?.kind === "remote" ? (
                    <VideoTile
                      remoteTrack={mainUser.user.videoTrack}
                      label={mainLabel}
                      isCamOn={mainUser.user.hasVideo}
                      isMicOn={mainUser.user.hasAudio}
                      isSpeaking={speakingUids.has(Number(mainUser.user.uid))}
                      isTeacher
                      isPinned
                      size="main"
                    />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-slate-900 border border-white/5 flex flex-col items-center justify-center">
                      <Radio className="w-10 h-10 text-white/20 mb-3" />
                      <p className="text-sm text-white/40 font-semibold">Waiting for video...</p>
                    </div>
                  )}
                </div>
                {/* PiP strip of other participants */}
                {remoteVideoUsers.length > (isTeacher ? 0 : 1) && (
                  <div className="shrink-0 h-24 flex gap-2 overflow-x-auto">
                    {remoteVideoUsers
                      .filter((u) => isTeacher || Number(u.uid) !== Number((mainUser as any)?.user?.uid))
                      .map((u) => (
                        <div key={String(u.uid)} className="w-32 h-full shrink-0">
                          <VideoTile
                            remoteTrack={u.videoTrack}
                            label={`User ${String(u.uid).slice(-4)}`}
                            isCamOn={u.hasVideo}
                            isMicOn={u.hasAudio}
                            isSpeaking={speakingUids.has(Number(u.uid))}
                            size="pip"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              // Grid view
              <div
                className={cn(
                  "w-full h-full grid gap-3",
                  gridCount <= 2 ? "grid-cols-2" :
                  gridCount <= 4 ? "grid-cols-2 grid-rows-2" :
                  gridCount <= 6 ? "grid-cols-3 grid-rows-2" :
                  "grid-cols-3 grid-rows-3",
                )}
              >
                {isTeacher && (
                  <VideoTile
                    videoTrack={isScreenSharing ? screenTrack : localVideoTrack}
                    label={user?.name ?? "You"}
                    isLocal
                    isCamOn={isCamOn || isScreenSharing}
                    isMicOn={isMicOn}
                    isScreenShare={isScreenSharing}
                    isSpeaking={myUid !== null && speakingUids.has(myUid)}
                    isTeacher
                  />
                )}
                {remoteVideoUsers.map((u) => (
                  <VideoTile
                    key={String(u.uid)}
                    remoteTrack={u.videoTrack}
                    label={`User ${String(u.uid).slice(-4)}`}
                    isCamOn={u.hasVideo}
                    isMicOn={u.hasAudio}
                    isSpeaking={speakingUids.has(Number(u.uid))}
                  />
                ))}
              </div>
            )}

            {/* Reactions overlay */}
            <ReactionsOverlay reactions={reactions} />
          </div>

          {/* ─── Control bar ─── */}
          <div className="shrink-0 px-4 pb-4 pt-2 relative">
            <div className="mx-auto max-w-3xl bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 flex items-center justify-center gap-1.5 sm:gap-3 shadow-2xl">
              <CtrlBtn
                icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                label={isMicOn ? "Mute" : "Unmute"}
                onClick={toggleMic}
                active={isMicOn}
                danger={!isMicOn}
                disabled={!isJoined || !localAudioTrack}
              />
              {isTeacher && (
                <CtrlBtn
                  icon={isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  label={isCamOn ? "Stop Video" : "Start Video"}
                  onClick={toggleCam}
                  active={isCamOn}
                  danger={!isCamOn}
                  disabled={!isJoined || !localVideoTrack || isScreenSharing}
                />
              )}
              {isTeacher && (
                <CtrlBtn
                  icon={isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <MonitorUp className="w-5 h-5" />}
                  label={isScreenSharing ? "Stop Share" : "Share"}
                  onClick={toggleScreenShare}
                  active={isScreenSharing}
                  disabled={!isJoined}
                />
              )}
              {!isTeacher && (
                <CtrlBtn
                  icon={<Hand className="w-5 h-5" />}
                  label={handRaised ? "Lower" : "Raise"}
                  onClick={toggleHand}
                  active={handRaised}
                  disabled={!isJoined}
                />
              )}
              <div className="relative">
                <CtrlBtn
                  icon={<Smile className="w-5 h-5" />}
                  label="React"
                  onClick={() => setShowReactionPicker((s) => !s)}
                  active={showReactionPicker}
                  disabled={!isJoined}
                />
                <AnimatePresence>
                  {showReactionPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.9 }}
                      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-2xl px-3 py-2 flex gap-1 shadow-2xl"
                    >
                      {REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => sendReaction(emoji)}
                          className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-xl transition-all hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <CtrlBtn
                icon={<MessageSquare className="w-5 h-5" />}
                label="Chat"
                onClick={() => setPanel(panel === "chat" ? null : "chat")}
                active={panel === "chat"}
                badge={unreadChat || undefined}
              />
              <CtrlBtn
                icon={<Users className="w-5 h-5" />}
                label="People"
                onClick={() => setPanel(panel === "participants" ? null : "participants")}
                active={panel === "participants"}
                badge={viewerCount > 0 ? viewerCount : undefined}
              />
              <CtrlBtn
                icon={<BarChart3 className="w-5 h-5" />}
                label="Polls"
                onClick={() => setPanel(panel === "polls" ? null : "polls")}
                active={panel === "polls"}
                badge={polls.filter((p) => p.isActive).length || undefined}
              />
              {isTeacher && (
                <CtrlBtn
                  icon={<Hand className="w-5 h-5" />}
                  label="Hands"
                  onClick={() => setPanel(panel === "hands" ? null : "hands")}
                  active={panel === "hands"}
                  badge={raisedHands.length || undefined}
                />
              )}
              <div className="w-px h-8 bg-white/10" />
              {isTeacher && isBrowserRecording && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/20">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">REC</span>
                </div>
              )}
              {isTeacher ? (
                <CtrlBtn
                  icon={isEnding ? <Loader2 className="w-5 h-5 animate-spin" /> : <PhoneOff className="w-5 h-5" />}
                  label={isEnding ? "Saving…" : "End"}
                  onClick={handleEnd}
                  danger
                  disabled={isEnding}
                />
              ) : (
                <CtrlBtn
                  icon={<PhoneOff className="w-5 h-5" />}
                  label="Leave"
                  onClick={() => {
                    leaveAgora();
                    socketRef.current?.disconnect();
                    navigate(-1);
                  }}
                  danger
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── Side panel ─── */}
        <AnimatePresence>
          {panel && (
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 w-[360px] bg-white border-l border-slate-200 flex flex-col"
            >
              <div className="shrink-0 h-14 px-4 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-sm font-black text-slate-900 capitalize">
                  {panel === "chat" && "Chat"}
                  {panel === "participants" && `Participants (${participants.length})`}
                  {panel === "polls" && "Polls"}
                  {panel === "hands" && `Raised Hands (${raisedHands.length})`}
                </h2>
                <button
                  onClick={() => setPanel(null)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                {panel === "chat" && (
                  <ChatPanel
                    messages={chatMessages}
                    onSend={sendChat}
                    onPin={isTeacher ? pinMessage : undefined}
                    isTeacher={isTeacher}
                    myId={myId}
                  />
                )}
                {panel === "participants" && (
                  <ParticipantsPanel participants={participants} myId={myId} />
                )}
                {panel === "polls" && (
                  <PollsPanel
                    polls={polls}
                    isTeacher={isTeacher}
                    myVotes={myVotes}
                    onVote={handleVote}
                    onClose={handleClosePoll}
                    onCreate={() => setShowPollModal(true)}
                  />
                )}
                {panel === "hands" && (
                  <HandsPanel hands={raisedHands} isTeacher={isTeacher} onLowerFor={lowerHandFor} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Poll creator */}
      <AnimatePresence>
        {showPollModal && (
          <CreatePollModal
            onClose={() => setShowPollModal(false)}
            onCreate={handleCreatePoll}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
