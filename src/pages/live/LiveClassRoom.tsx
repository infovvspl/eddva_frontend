import { useState, useEffect, useRef, useCallback } from "react";
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
  Users, MessageSquare, Radio, Loader2, Monitor,
  BarChart3, Pin, X, CheckCircle, Clock,
  MonitorOff, Activity, ShieldCheck, Zap, Sparkles, Layers, ArrowLeft
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import {
  getLiveClassToken, startLiveClass, getLiveSession,
  respondToPoll,
  type LiveSessionInfo, type LiveChatMessage, type LivePoll,
} from "@/lib/api/live-class";
import { CardGlass } from "@/components/shared/CardGlass";
import { cn } from "@/lib/utils";

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
  isSpeaking = false,
}: {
  videoTrack: ILocalVideoTrack | ILocalAudioTrack | IAgoraRTCPemoteUser["videoTrack"] | null | undefined;
  label?: string;
  isLocal?: boolean;
  isCamOn?: boolean;
  isScreenShare?: boolean;
  isSpeaking?: boolean;
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
    <div className={cn(
      "relative w-full h-full bg-slate-950/80 rounded-[2.5rem] overflow-hidden transition-all duration-500 border-2",
      isSpeaking ? "border-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-[1.01]" : "border-white/10"
    )}>
      {showVideo ? (
        <div ref={containerRef} className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-slate-950">
           <div className="relative">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center">
                {isScreenShare ? (
                  <MonitorOff className="w-10 h-10 text-white/10" />
                ) : (
                  <VideoOff className="w-10 h-10 text-white/10" />
                )}
              </div>
              <div className="absolute -inset-4 rounded-full border border-white/5 animate-pulse" />
           </div>
           <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{isLocal ? "Optical Sensor Disabled" : "No Feed Detection"}</span>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute bottom-6 left-6 flex items-center gap-3">
         <CardGlass className="px-4 py-2 border-white/20 bg-black/40 backdrop-blur-xl flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isSpeaking ? "bg-emerald-500 animate-ping" : "bg-white/20")} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{label} {isLocal && "(YOU)"}</span>
         </CardGlass>
         {isScreenShare && (
           <CardGlass className="px-4 py-2 border-blue-500/30 bg-blue-500/20 text-blue-400">
              <span className="text-[10px] font-black uppercase tracking-widest">Projection Active</span>
           </CardGlass>
         )}
      </div>
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
    <div className="flex flex-col h-full bg-slate-950/20">
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-none">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20">
            <MessageSquare className="w-12 h-12" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Void</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderName === myName;
          const isT = msg.senderRole === "teacher";
          return (
            <motion.div
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id}
              className={cn("flex flex-col gap-2", isMe ? "items-end" : "items-start")}
            >
              <div className={cn(
                "max-w-[85%] rounded-[1.5rem] px-5 py-4 border relative group transition-all",
                msg.isPinned ? "bg-amber-500/10 border-amber-500/30 text-amber-200" :
                isT ? "bg-blue-600/20 border-blue-500/30 text-blue-100" :
                isMe ? "bg-white/10 border-white/10 text-white" : "bg-white/5 border-white/5 text-slate-300 shadow-xl"
              )}>
                {msg.isPinned && <Pin className="w-3 h-3 absolute -top-1.5 -right-1.5 text-amber-400 rotate-45" />}
                {!isMe && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest", isT ? "text-blue-400" : "text-white/40")}>
                      {msg.senderName}
                    </span>
                    {isT && <span className="bg-blue-500 py-0.5 px-2 rounded-full text-[8px] font-black text-white italic">LECTOR</span>}
                  </div>
                )}
                <p className="text-xs leading-relaxed font-medium">{msg.message}</p>
                
                {isTeacher && !msg.isPinned && (
                  <button onClick={() => onPin?.(msg.id)} className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all text-white/20 hover:text-amber-400">
                     <Pin className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-6 bg-black/20 border-t border-white/5">
        <div className="flex gap-4 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Transmit Signal..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 disabled:opacity-20 transition-all shadow-xl shadow-blue-500/10"
          >
            <Send className="w-6 h-6" />
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

  return (
    <CardGlass className={cn(
      "p-6 border-white/10 relative overflow-hidden transition-all",
      poll.isActive ? "bg-blue-500/5 border-blue-500/20" : "bg-slate-900/40 opacity-60"
    )}>
      <div className="flex items-start justify-between mb-6">
         <h4 className="text-sm font-black text-white uppercase italic tracking-tight">{poll.question}</h4>
         <div className="flex items-center gap-3">
            <span className={cn("text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest", poll.isActive ? "bg-emerald-500 text-white animate-pulse" : "bg-white/10 text-white/40")}>
               {poll.isActive ? "Pulse" : "Locked"}
            </span>
            {isTeacher && poll.isActive && (
              <button onClick={() => onClose?.(poll.id)} className="text-[10px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest">Abort</button>
            )}
         </div>
      </div>

      <div className="space-y-3">
         {poll.options.map((opt, i) => {
            const result = poll.results?.find(r => r.index === i);
            const pct = result?.percentage ?? 0;
            const isCorrect = poll.correctOptionIndex === i && !poll.isActive;
            const isSelected = myVote === i;

            return (
              <button
                key={i} disabled={isTeacher || !poll.isActive || hasVoted}
                onClick={() => onVote?.(poll.id, i)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden group",
                  isCorrect ? "bg-emerald-500/20 border-emerald-500/40" :
                  isSelected ? "bg-blue-600 border-blue-600 shadow-xl" :
                  "bg-white/5 border-white/5 hover:bg-white/10"
                )}
              >
                {showResults && (
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    className={cn("absolute inset-y-0 left-0 opacity-10", isCorrect ? "bg-emerald-500" : "bg-white")} />
                )}
                <div className="relative flex justify-between items-center z-10">
                   <span className={cn("text-xs font-black uppercase tracking-tight", isCorrect ? "text-emerald-400" : "text-white")}>{opt}</span>
                   {showResults && <span className="text-[10px] font-black text-white/40">{Math.round(pct)}%</span>}
                </div>
              </button>
            );
         })}
      </div>
    </CardGlass>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────

function CtrlBtn({ icon, label, onClick, active, danger = false, disabled = false, badge }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  badge?: number;
}) {
  return (
    <button onClick={onClick} disabled={disabled} className="flex flex-col items-center gap-2 group disabled:opacity-20 transition-all">
       <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all relative",
          danger ? "bg-red-600 text-white shadow-xl shadow-red-500/20" :
          active ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" :
          "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/5"
       )}>
          {icon}
          {!!badge && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-lg text-[9px] font-black text-white flex items-center justify-center border-2 border-slate-900 shadow-lg animate-bounce">
              {badge}
            </span>
          )}
       </div>
       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/60 transition-colors uppercase">{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SidePanel = "chat" | "polls" | "hands" | "participants";

export default function LiveClassRoom() {
  const { lectureId } = useParams<{ lectureId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher";

  // ── Session
  const [session, setSession] = useState<LiveSessionInfo | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // ── Agora
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [screenTrack, setScreenTrack] = useState<ILocalVideoTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn] = useState(true);
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [ended, setEnded] = useState(false);

  // ── Load session
  const loadSession = useCallback(() => {
    if (!lectureId) return;
    setSessionLoading(true);
    getLiveSession(lectureId)
      .then((s) => {
        setSession(s);
        setViewerCount(s.currentViewerCount);
        if (s.status === "ended") setEnded(true);
      })
      .catch(() => {
        toast.error("Neural Link Failure.");
      })
      .finally(() => setSessionLoading(false));
  }, [lectureId]);

  useEffect(() => { loadSession(); }, [loadSession]);

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

  const joinAgora = useCallback(async (token: string, channelName: string, uid: number, role: "host" | "audience") => {
    if (clientRef.current) return;
    const client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    clientRef.current = client;

    client.on("user-published", async (remoteUser, mediaType) => {
      await client.subscribe(remoteUser, mediaType);
      if (mediaType === "audio" && isSpeakerOn) remoteUser.audioTrack?.play();
      setRemoteUsers(prev => prev.find(u => u.uid === remoteUser.uid) ? prev.map(u => u.uid === remoteUser.uid ? remoteUser : u) : [...prev, remoteUser]);
    });

    client.on("user-unpublished", (remoteUser) => setRemoteUsers(prev => prev.map(u => u.uid === remoteUser.uid ? remoteUser : u)));
    client.on("user-left", (remoteUser) => setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid)));

    try {
      await client.setClientRole(role);
      await client.join(AGORA_APP_ID, channelName, token, uid);
    } catch { toast.error("Agora link failed."); return; }

    if (role === "host") {
       try {
         const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks({ AEC: true, ANS: true, AGC: true }, { encoderConfig: "480p_2" });
         setLocalAudioTrack(audio); setLocalVideoTrack(video);
         await client.publish([audio, video]);
       } catch {
         try {
            const audio = await AgoraRTC.createMicrophoneAudioTrack();
            setLocalAudioTrack(audio);
            await client.publish(audio);
         } catch { toast.error("Hardware access denied."); }
       }
    }
    setIsJoined(true);
  }, [isSpeakerOn]);

  const connectSocket = useCallback((sessionId: string, uid: number) => {
    if (socketRef.current?.connected) return;
    setSocketSessionId(sessionId);
    const socket = io(`${BACKEND_URL}/live`, { path: "/socket.io", transports: ["websocket"], auth: { token: localStorage.getItem("eddva_access_token") } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("live:join", { sessionId, userId: user?.id, name: user?.name, role: user?.role, tenantId: user?.tenantId, agoraUid: uid });
    });

    socket.on("live:joined", ({ handRaiseQueue, participants: pts }) => {
      setRaisedHands(handRaiseQueue || []);
      if (pts) setParticipants(pts);
    });

    socket.on("live:participant-joined", (data) => {
       setViewerCount(data.currentCount);
       setParticipants(prev => prev.find(p => p.userId === data.userId) ? prev : [...prev, { userId: data.userId, name: data.name, role: data.role, joinedAt: Date.now() }]);
    });

    socket.on("live:participant-left", (data) => {
       setViewerCount(data.currentCount);
       setParticipants(prev => prev.filter(p => p.userId !== data.userId));
    });

    socket.on("live:new-message", (msg) => setChatMessages(prev => [...prev, msg]));
    socket.on("live:screen-share-started", data => !isTeacher && toast.info(`${data.name} is projecting...`));
    socket.on("live:class-ended", () => { setEnded(true); leaveAgora(); });

    socket.on("live:new-poll", (poll) => { setPolls(prev => [poll, ...prev]); setPanel("polls"); toast.info("New Pulse Poll Detected"); });
    socket.on("live:new-doubt", (doubt) => { setDoubts(prev => [doubt, ...prev]); if (isTeacher) setPanel("hands"); });
  }, [user, isTeacher, leaveAgora]);

  useEffect(() => {
    if (!session || isJoined || session.status === "ended") return;
    if (session.status === "live") {
       (async () => {
          const role = isTeacher ? "host" : "audience";
          const r = await getLiveClassToken(lectureId!, role);
          await joinAgora(r.token, r.channelName, r.uid, role);
          connectSocket(r.sessionId, r.uid);
       })();
    }
  }, [session, isJoined, isTeacher, lectureId, joinAgora, connectSocket]);

  useEffect(() => {
    return () => { leaveAgora(); socketRef.current?.disconnect(); };
  }, [leaveAgora]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const r = await startLiveClass(lectureId!);
      setSession(prev => prev ? { ...prev, status: "live" } : prev);
      await joinAgora(r.token, r.channelName, r.uid, "host");
      connectSocket(r.sessionId, r.uid);
    } catch { toast.error("Command failed."); }
    finally { setIsStarting(false); }
  };

  const toggleMic = async () => {
    if (!localAudioTrack) return;
    await localAudioTrack.setEnabled(!isMicOn);
    setIsMicOn(!isMicOn);
  };

  const toggleCam = async () => {
    if (!localVideoTrack) return;
    await localVideoTrack.setEnabled(!isCamOn);
    setIsCamOn(!isCamOn);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (sessionLoading) {
    return (
       <div className="py-40 flex flex-col items-center justify-center gap-10">
          <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-100 flex items-center justify-center shadow-3xl">
             <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Establishing Nexus Connection...</p>
       </div>
    );
  }

  if (ended) {
    return (
       <div className="py-20 flex items-center justify-center">
          <div className="w-full max-w-lg">
             <CardGlass className="p-12 border-white bg-white/60 text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center mx-auto mb-10 shadow-3xl"><CheckCircle className="w-12 h-12" /></div>
                <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Transmission Ended</h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none mb-10">Data packet synchronized. Sector closed.</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate(-1)}
                  className="w-full py-6 rounded-[2.5rem] bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">Return to Command Hub</motion.button>
             </CardGlass>
          </div>
       </div>
    );
  }

  const mainRemoteUser = remoteUsers[0];

  return (
    <div className="flex flex-col space-y-8 h-full min-h-[800px]">
        {/* Cinematic Header Terminal */}
        <CardGlass className="px-10 py-6 border-white bg-white/40 flex items-center justify-between sticky top-0 z-50">
           <div className="flex items-center gap-6">
              <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-xl group hover:scale-110 transition-transform">
                 <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="min-w-0">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Optical Command Center</p>
                 <h2 className="text-xl font-black text-slate-950 uppercase italic leading-none truncate max-w-[300px]">{session?.lectureTitle}</h2>
              </div>
           </div>

           <div className="flex items-center gap-10">
              <div className="hidden md:flex flex-col items-end">
                 <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Spectral Vector</p>
                 <span className="text-xs font-black text-slate-950 uppercase italic leading-none">{session?.topicName}</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="px-5 py-2 rounded-xl bg-white border border-slate-100 flex items-center gap-3 shadow-xl">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-black text-slate-950 italic tracking-tighter tabular-nums leading-none">{viewerCount}</span>
                 </div>
                 {session?.status === "live" ? (
                   <div className="px-5 py-2 rounded-xl bg-red-600 border border-red-500 flex items-center gap-3 shadow-xl shadow-red-500/20">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-white italic tracking-tighter uppercase leading-none">Live</span>
                   </div>
                 ) : (
                   <div className="px-5 py-2 rounded-xl bg-amber-100 border border-amber-200 flex items-center gap-3">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-[10px] font-black text-amber-600 italic tracking-tighter uppercase leading-none">Standby</span>
                   </div>
                 )}
              </div>
           </div>
        </CardGlass>

        <div className="flex h-full gap-8 min-h-[600px]">
           {/* Main Feed Area */}
           <div className="flex-1 flex flex-col gap-8 min-w-0">
              <div className="flex-1 min-h-0 relative">
                 {isTeacher ? (
                   <VideoTile videoTrack={isScreenSharing ? screenTrack : localVideoTrack} label={user?.name ?? "Command"} isLocal />
                 ) : mainRemoteUser ? (
                   <VideoTile videoTrack={mainRemoteUser.videoTrack} label={session?.teacherName ?? "Operator"} />
                 ) : (
                   <div className="w-full h-full rounded-[3rem] bg-slate-900/10 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-8">
                      <div className="w-20 h-20 rounded-[2rem] bg-white border border-slate-100 flex items-center justify-center animate-pulse shadow-inner">
                         <Activity className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">{isTeacher ? "Optical Standby" : "Waiting for Neural Feed..."}</p>
                      
                      {isTeacher && session?.status === "waiting" && (
                        <motion.button
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={handleStart}
                          disabled={isStarting}
                          className="px-12 py-5 rounded-[2.5rem] bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center gap-4 transition-all"
                        >
                          {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                          Establish Broadcast
                        </motion.button>
                      )}
                   </div>
                 )}
              </div>

              {/* Control Terminal */}
              <CardGlass className="px-8 py-5 border-white bg-white/60 flex items-center justify-center gap-8 rounded-[2.5rem] shadow-2xl shrink-0">
                 <CtrlBtn icon={isMicOn ? <Mic className="w-6 h-6 text-slate-950" /> : <MicOff className="w-6 h-6 text-red-500" />} label="Voice" onClick={toggleMic} active={isMicOn} disabled={!isJoined} />
                 {isTeacher && <CtrlBtn icon={isCamOn ? <Video className="w-6 h-6 text-slate-950" /> : <VideoOff className="w-6 h-6 text-red-500" />} label="Optical" onClick={toggleCam} active={isCamOn} disabled={!isJoined} />}
                 <div className="w-px h-10 bg-slate-200" />
                 <CtrlBtn icon={<MessageSquare className={cn("w-6 h-6", panel === "chat" ? "text-blue-600" : "text-slate-400")} />} label="Nexus" onClick={() => setPanel("chat")} active={panel === "chat"} />
                 <CtrlBtn icon={<BarChart3 className={cn("w-6 h-6", panel === "polls" ? "text-blue-600" : "text-slate-400")} />} label="Pulse" onClick={() => setPanel("polls")} active={panel === "polls"} badge={polls.filter(p=>p.isActive).length} />
                 <CtrlBtn icon={<Hand className={cn("w-6 h-6", panel === "hands" ? "text-blue-600" : "text-slate-400")} />} label="Signals" onClick={() => setPanel("hands")} active={panel === "hands"} badge={raisedHands.length + doubts.filter(d=>!d.resolved).length} />
                 <div className="w-px h-10 bg-slate-200" />
                 {isTeacher ? (
                    <CtrlBtn icon={<PhoneOff className="w-6 h-6" />} label="Terminate" onClick={() => { if(confirm("End sector broadcast?")) navigate(-1); }} danger />
                 ) : (
                    <CtrlBtn icon={<ArrowLeft className="w-6 h-6" />} label="Sever" onClick={() => navigate(-1)} danger />
                 )}
              </CardGlass>
           </div>

           {/* Command Panel (Sidebar) */}
           <CardGlass className="w-[450px] shrink-0 border-white bg-slate-950/90 text-white flex flex-col p-0 overflow-hidden shadow-3xl">
              <div className="p-8 flex items-center justify-between border-b border-white/5 bg-black/20">
                 <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Module Interface</h3>
                 <div className="flex gap-2">
                    {["chat", "polls", "hands", "participants"].map(p => (
                      <button key={p} onClick={() => setPanel(p as any)} className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                         panel === p ? "bg-white text-slate-950 shadow-xl" : "bg-white/5 text-white/20 hover:bg-white/10"
                      )}>
                         {p === "chat" && <MessageSquare className="w-4 h-4" />}
                         {p === "polls" && <BarChart3 className="w-4 h-4" />}
                         {p === "hands" && <Hand className="w-4 h-4" />}
                         {p === "participants" && <Users className="w-4 h-4" />}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 overflow-hidden">
                 <AnimatePresence mode="wait">
                    {panel === "chat" && <ChatPanel key="chat" messages={chatMessages} onSend={msg => socketRef.current?.emit("live:chat", { sessionId: socketSessionId, message: msg })} isTeacher={isTeacher} myName={user?.name ?? ""} />}
                    {panel === "polls" && (
                      <motion.div key="polls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-6 overflow-y-auto h-full scrollbar-none">
                         {polls.length === 0 ? <p className="text-center text-[10px] font-black text-white/10 uppercase tracking-[0.3em] py-20">No Poll Manifest Detected</p> : polls.map(p => <PollCard key={p.id} poll={p} isTeacher={isTeacher} myVote={myVotes[p.id]} onVote={(pid, opt) => handleVote(pid, opt, socketRef, socketSessionId, setMyVotes)} />)}
                      </motion.div>
                    )}
                    {panel === "hands" && (
                      <motion.div key="hands" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-8 overflow-y-auto h-full scrollbar-none">
                         {raisedHands.length > 0 && (
                           <div className="space-y-4">
                              <h4 className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Digital Raised Hands</h4>
                              {raisedHands.map(h => (
                                 <div key={h.userId} className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">{h.name[0]}</div>
                                    <span className="text-xs font-black text-white uppercase italic">{h.name}</span>
                                    <Zap className="w-4 h-4 text-blue-400 ml-auto animate-pulse" />
                                 </div>
                              ))}
                           </div>
                         )}
                         <div className="space-y-4">
                            <h4 className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Logical Doubts Probe</h4>
                            {doubts.length === 0 ? <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.2em] pt-10">All Synapses Clear</p> : doubts.map(d => (
                               <CardGlass key={d.id} className="p-5 border-white/5 bg-white/5">
                                  <div className="flex items-center justify-between mb-3">
                                     <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{d.studentName}</span>
                                     {d.resolved && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                                  </div>
                                  <p className="text-xs text-white/60 font-medium leading-relaxed">{d.question}</p>
                               </CardGlass>
                            ))}
                         </div>
                      </motion.div>
                    )}
                    {panel === "participants" && (
                       <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-4 overflow-y-auto h-full scrollbar-none">
                          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">Active Asyncs ({participants.length})</h4>
                          {participants.map(p => (
                             <div key={p.userId} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black uppercase italic">{p.name[0]}</div>
                                <div>
                                   <p className="text-xs font-black uppercase italic">{p.name}</p>
                                   <p className="text-[9px] text-white/20 uppercase tracking-widest">{p.role}</p>
                                </div>
                             </div>
                          ))}
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </CardGlass>
        </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
async function handleVote(pollId: string, option: number, socketRef: any, socketSessionId: string, setMyVotes: any) {
  try {
    await respondToPoll(pollId, option);
    setMyVotes((prev: any) => ({ ...prev, [pollId]: option }));
    socketRef.current?.emit("live:poll-answer", { pollId, selectedOption: option, sessionId: socketSessionId });
  } catch { toast.error("Submission error."); }
}
