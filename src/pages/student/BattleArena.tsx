/**
 * BattleArena
 *
 * Stages:
 *   home          → browse modes, daily battle, live leaderboard
 *   topic_pick    → topic selector for topic_battle mode
 *   join_room     → enter a room code to join a friend's battle
 *   matchmaking   → waiting room after createBattle() resolves
 *   in_battle     → live quiz UI (socket.io or bot simulation)
 *   result        → ELO / XP result screen
 *   error         → recoverable error state
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Zap, Users, Globe, UserPlus,
  Trophy, Clock, ArrowLeft, ArrowRight, Copy, Check,
  Loader2, Wifi, X, Crown, Target,
  ChevronRight, Sparkles, Shield, AlertCircle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Star, Flame, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useStudentMe, useDailyBattle, useCreateBattle,
  useCancelBattle, useBattleRoom, useJoinBattle,
  useBattleLeaderboard, useSubjects, useChapters, useTopics,
  useMyBattleElo,
} from "@/hooks/use-student";
import { BattleMode, BattleRoom } from "@/lib/api/student";
import { tokenStorage } from "@/lib/api/client";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const CYAN   = "#06B6D4";
const AMBER  = "#F59E0B";
const EMERALD = "#10B981";
const SLATE  = "#64748B";

const CardGlass = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { y: -5, scale: 1.01 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500",
      onClick ? "cursor-pointer" : "",
      className
    )}
  >
    {children}
  </motion.div>
);

import { io, Socket } from "socket.io-client";

// ─── Tier Config ─────────────────────────────────────────────────────────────

const TIERS = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Champion"];

const TIER_COLORS: Record<string, { grad: string; text: string; bg: string }> = {
  champion: { grad: "from-amber-400 to-orange-500",   text: "text-amber-400",  bg: "bg-amber-500/10"  },
  diamond:  { grad: "from-cyan-400 to-blue-500",      text: "text-cyan-400",   bg: "bg-cyan-500/10"   },
  platinum: { grad: "from-violet-400 to-purple-600",  text: "text-violet-400", bg: "bg-violet-500/10" },
  gold:     { grad: "from-yellow-400 to-amber-500",   text: "text-yellow-400", bg: "bg-yellow-500/10" },
  silver:   { grad: "from-slate-300 to-slate-500",    text: "text-slate-400",  bg: "bg-slate-500/10"  },
  bronze:   { grad: "from-amber-600 to-orange-700",   text: "text-orange-400", bg: "bg-orange-500/10" },
  iron:     { grad: "from-slate-500 to-slate-700",    text: "text-slate-400",  bg: "bg-slate-500/10"  },
};

// ─── Mode Config ─────────────────────────────────────────────────────────────

interface ModeConfig {
  mode: BattleMode;
  title: string;
  desc: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconText: string;
  accent: string;
  badge?: string;
  questions: number;
  seconds: number;
}

const MODES: ModeConfig[] = [
  {
    mode: "quick_duel",
    title: "Quick 1v1 Duel",
    desc: "Instant matchmaking",
    detail: "5 questions · 30s each",
    icon: Zap,
    iconBg: "bg-blue-600/10",
    iconText: "text-blue-600",
    accent: "hover:border-blue-600/40",
    questions: 5,
    seconds: 30,
  },
  {
    mode: "topic_battle",
    title: "Topic Battle",
    desc: "Pick your battlefield",
    detail: "10 questions · 45s each",
    icon: Target,
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-400",
    accent: "hover:border-blue-500/40",
    questions: 10,
    seconds: 45,
  },
  {
    mode: "daily",
    title: "Daily Battle",
    desc: "Everyone vs everyone",
    detail: "Scheduled event · big prizes",
    icon: Globe,
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    accent: "hover:border-violet-500/40",
    badge: "DAILY",
    questions: 15,
    seconds: 60,
  },
  {
    mode: "challenge_friend",
    title: "Challenge Friend",
    desc: "Share a room code",
    detail: "10 questions · your rules",
    icon: UserPlus,
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    accent: "hover:border-emerald-500/40",
    questions: 10,
    seconds: 45,
  },
];

// ─── Bot question bank (fallback when no backend questions) ───────────────────

interface BotQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctId: string;
}

const BOT_QUESTIONS: BotQuestion[] = [
  {
    id: "bq1", text: "What is the SI unit of electric current?",
    options: [{ id: "a", text: "Volt" }, { id: "b", text: "Ampere" }, { id: "c", text: "Ohm" }, { id: "d", text: "Watt" }],
    correctId: "b",
  },
  {
    id: "bq2", text: "Which gas is most abundant in Earth's atmosphere?",
    options: [{ id: "a", text: "Oxygen" }, { id: "b", text: "Carbon dioxide" }, { id: "c", text: "Nitrogen" }, { id: "d", text: "Argon" }],
    correctId: "c",
  },
  {
    id: "bq3", text: "What is the chemical symbol for Gold?",
    options: [{ id: "a", text: "Gd" }, { id: "b", text: "Go" }, { id: "c", text: "Au" }, { id: "d", text: "Ag" }],
    correctId: "c",
  },
  {
    id: "bq4", text: "Speed of light in vacuum is approximately:",
    options: [{ id: "a", text: "3×10⁶ m/s" }, { id: "b", text: "3×10⁸ m/s" }, { id: "c", text: "3×10¹⁰ m/s" }, { id: "d", text: "3×10⁴ m/s" }],
    correctId: "b",
  },
  {
    id: "bq5", text: "Which organelle is known as the powerhouse of the cell?",
    options: [{ id: "a", text: "Nucleus" }, { id: "b", text: "Ribosome" }, { id: "c", text: "Golgi apparatus" }, { id: "d", text: "Mitochondria" }],
    correctId: "d",
  },
  {
    id: "bq6", text: "The value of π (pi) up to two decimal places is:",
    options: [{ id: "a", text: "3.12" }, { id: "b", text: "3.14" }, { id: "c", text: "3.16" }, { id: "d", text: "3.18" }],
    correctId: "b",
  },
  {
    id: "bq7", text: "Which planet is called the Red Planet?",
    options: [{ id: "a", text: "Venus" }, { id: "b", text: "Jupiter" }, { id: "c", text: "Mars" }, { id: "d", text: "Saturn" }],
    correctId: "c",
  },
  {
    id: "bq8", text: "The atomic number of Carbon is:",
    options: [{ id: "a", text: "6" }, { id: "b", text: "8" }, { id: "c", text: "12" }, { id: "d", text: "14" }],
    correctId: "a",
  },
  {
    id: "bq9", text: "Newton's second law relates force to:",
    options: [{ id: "a", text: "Velocity" }, { id: "b", text: "Momentum" }, { id: "c", text: "Mass × Acceleration" }, { id: "d", text: "Energy" }],
    correctId: "c",
  },
  {
    id: "bq10", text: "What is 2⁸?",
    options: [{ id: "a", text: "128" }, { id: "b", text: "256" }, { id: "c", text: "512" }, { id: "d", text: "64" }],
    correctId: "b",
  },
];

// ─── Battle result type ───────────────────────────────────────────────────────

interface BattleResult {
  winnerId: string | null;
  myStudentId: string;
  isWinner: boolean;
  myRoundsWon: number;
  opponentRoundsWon: number;
  myName: string;
  opponentName: string;
  eloChange: number;
  xpEarned: number;
  newElo: number;
}

// ─── In-Battle Quiz UI ────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctId?: string; // only set locally for bot mode
}

interface ScoreMap {
  [studentId: string]: number;
}

function BattleInProgress({
  room,
  mode,
  myStudentId,
  myName,
  onEnd,
  onResult,
  prefetchedQuestions,
  topicLabel,
}: {
  room: BattleRoom;
  mode: ModeConfig;
  myStudentId: string;
  myName: string;
  onEnd: () => void;
  onResult: (result: BattleResult) => void;
  prefetchedQuestions?: QuizQuestion[];
  topicLabel?: string;
}) {
  const isBot = mode.mode === "bot";
  const totalRounds = prefetchedQuestions?.length || mode.questions;
  const secondsPerRound = mode.seconds;

  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [roundNumber, setRoundNumber]   = useState(1);
  const [timeLeft, setTimeLeft]         = useState(secondsPerRound);
  const [selected, setSelected]         = useState<string | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [scores, setScores]             = useState<ScoreMap>({});
  const [waiting, setWaiting]           = useState(false); // waiting for opponent to answer
  const [opponentName, setOpponentName] = useState("Opponent");
  const [opponentStudentId, setOpponentStudentId] = useState("");
  const [questions, setQuestions]       = useState<QuizQuestion[]>([]);
  const [connected, setConnected]       = useState(false);

  const socketRef  = useRef<Socket | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerSentRef = useRef(false);
  const startTimeRef  = useRef<number>(0);
  // Refs to avoid stale-closure bugs in bot mode callbacks
  const selectedRef   = useRef<string | null>(null);
  const questionsRef  = useRef<QuizQuestion[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processRoundResultRef = useRef<(data: any) => void>(null!);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // ─── Timer ────────────────────────────────────────────────────────────────

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(secondsPerRound);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearTimer();
          // Auto-submit empty answer on timeout
          if (!answerSentRef.current) {
            handleAnswer(null, true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [secondsPerRound]);

  // ─── Bot Mode Logic ───────────────────────────────────────────────────────

  const botAnswerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBotAnswer = useCallback((q: QuizQuestion, rn: number) => {
    if (!q.correctId) return;
    // Bot answers in 3-25 seconds with ~65% accuracy
    const delay = 3000 + Math.random() * 22000;
    const botCorrect = Math.random() < 0.65;
    botAnswerTimeout.current = setTimeout(() => {
      const botOptionId = botCorrect
        ? q.correctId!
        : q.options.find(o => o.id !== q.correctId)?.id ?? q.options[0].id;
      // Use ref so we always call the latest processRoundResult (avoids stale closure)
      processRoundResultRef.current({
        roundNumber: rn,
        roundWinnerId: null,
        correctOptionId: q.correctId!,
        scores: {},
        botOptionId,
        botCorrect,
      });
    }, delay);
  }, []); // stable — intentionally empty; uses processRoundResultRef to stay fresh

  const processRoundResult = useCallback((data: {
    roundNumber: number;
    roundWinnerId: string | null;
    correctOptionId: string;
    scores: ScoreMap;
    botOptionId?: string;
    botCorrect?: boolean;
  }) => {
    clearTimer();
    if (botAnswerTimeout.current) clearTimeout(botAnswerTimeout.current);

    setRevealed(true);
    setCorrectOptionId(data.correctOptionId);

    // In bot mode, compute winner from bot answer + player answer
    let effectiveWinnerId = data.roundWinnerId;
    let newScores = { ...data.scores };

    if (isBot) {
      const playerAnsweredCorrect = answerSentRef.current
        ? selectedRef.current === data.correctOptionId  // use ref — avoids stale closure
        : false;
      const botAnsweredCorrect = data.botCorrect ?? false;
      const playerTime = Date.now() - startTimeRef.current;
      const botTime = 5000 + Math.random() * 15000; // simulated

      if (playerAnsweredCorrect && !botAnsweredCorrect) {
        effectiveWinnerId = myStudentId;
      } else if (!playerAnsweredCorrect && botAnsweredCorrect) {
        effectiveWinnerId = "bot";
      } else if (playerAnsweredCorrect && botAnsweredCorrect) {
        effectiveWinnerId = playerTime < botTime ? myStudentId : "bot";
      }

      // Update scores
      setScores(prev => {
        const updated = { ...prev };
        if (effectiveWinnerId === myStudentId) {
          updated[myStudentId] = (updated[myStudentId] ?? 0) + 1;
        } else if (effectiveWinnerId === "bot") {
          updated["bot"] = (updated["bot"] ?? 0) + 1;
        }
        return updated;
      });
    } else {
      setScores(newScores);
    }

    setRoundWinnerId(effectiveWinnerId);

    // If last round, finish after delay
    if (data.roundNumber >= totalRounds) {
      setTimeout(() => {
        finalizeBattle(effectiveWinnerId, newScores);
      }, 2500);
    } else {
      // Next question after 2.5s
      setTimeout(() => {
        const nextRound = data.roundNumber + 1;
        setRoundNumber(nextRound);
        setSelected(null);
        selectedRef.current = null;
        setRevealed(false);
        setRoundWinnerId(null);
        setCorrectOptionId(null);
        setWaiting(false);
        answerSentRef.current = false;

        if (isBot) {
          const nextQ = questionsRef.current[nextRound - 1];  // use ref — avoids stale closure
          if (nextQ) {
            setCurrentQuestion(nextQ);
            startTimer();
            triggerBotAnswer(nextQ, nextRound);
          }
        }
        // For socket mode, next question comes from server event
      }, 2500);
    }
  }, [isBot, myStudentId, totalRounds, startTimer, triggerBotAnswer]);
  // Always keep the ref pointing at the latest version so triggerBotAnswer (stable, [] deps) can call it
  processRoundResultRef.current = processRoundResult;

  const finalizeBattle = useCallback((lastRoundWinnerId: string | null, finalScores: ScoreMap) => {
    let myScore = 0;
    let botScore = 0;

    if (isBot) {
      setScores(prev => {
        myScore = prev[myStudentId] ?? 0;
        botScore = prev["bot"] ?? 0;
        return prev;
      });
      // Compute from current state
      setTimeout(() => {
        setScores(prev => {
          const ms = prev[myStudentId] ?? 0;
          const bs = prev["bot"] ?? 0;
          const isWinner = ms > bs;
          onResult({
            winnerId: isWinner ? myStudentId : "bot",
            myStudentId,
            isWinner,
            myRoundsWon: ms,
            opponentRoundsWon: bs,
            myName,
            opponentName: "Battle Bot",
            eloChange: 0,
            xpEarned: isWinner ? 30 : 10,
            newElo: 1000,
          });
          return prev;
        });
      }, 100);
    } else {
      const ms = finalScores[myStudentId] ?? 0;
      const os = Object.entries(finalScores).find(([k]) => k !== myStudentId)?.[1] ?? 0;
      const isWinner = ms > os;
      onResult({
        winnerId: isWinner ? myStudentId : opponentStudentId,
        myStudentId,
        isWinner,
        myRoundsWon: ms,
        opponentRoundsWon: os,
        myName,
        opponentName,
        eloChange: 0, // will be updated from server's finishBattle result
        xpEarned: isWinner ? 50 : 20,
        newElo: 1000,
      });
    }
  }, [isBot, myStudentId, myName, opponentName, opponentStudentId, onResult]);

  // ─── Handle answer selection ───────────────────────────────────────────────

  const handleAnswer = useCallback((optionId: string | null, isTimeout = false) => {
    if (answerSentRef.current || revealed) return;
    answerSentRef.current = true;
    clearTimer();

    const responseTimeMs = Date.now() - startTimeRef.current;
    if (optionId) { setSelected(optionId); selectedRef.current = optionId; }
    else { selectedRef.current = null; }

    if (isBot) {
      // Don't process yet — wait for bot's answer
      if (!isTimeout) {
        setWaiting(true);
      }
      return;
    }

    // Socket mode
    if (socketRef.current && currentQuestion) {
      socketRef.current.emit("battle:answer", {
        roomCode: room.roomCode,
        battleId: room.battleId,
        questionId: currentQuestion.id,
        optionId: optionId ?? "",
        roundNumber,
        responseTimeMs,
        studentId: myStudentId,
      });
      setWaiting(true);
    }
  }, [revealed, currentQuestion, room, roundNumber, myStudentId, isBot]);

  // ─── Socket setup ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isBot) {
      // Bot mode: use prefetched curriculum questions, fall back to hardcoded bank
      const sourceQs = prefetchedQuestions && prefetchedQuestions.length > 0
        ? prefetchedQuestions
        : BOT_QUESTIONS.slice(0, totalRounds).map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correctId: q.correctId,
          }));
      const qs = sourceQs.slice(0, totalRounds);
      setQuestions(qs);
      questionsRef.current = qs;   // keep ref in sync so processRoundResult sees it
      selectedRef.current = null;  // reset for fresh battle
      setCurrentQuestion(qs[0]);
      setOpponentName("Battle Bot");
      setConnected(true);
      answerSentRef.current = false;
      startTimer();
      triggerBotAnswer(qs[0], 1);
      return;
    }

    // Socket.IO mode
    const token = tokenStorage.getAccess();
    const socket = io(`${backendUrl}/battle`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("battle:join", { roomCode: room.roomCode, studentId: myStudentId });
    });

    socket.on("connect_error", () => {
      toast.error("Failed to connect to battle server.");
    });

    socket.on("battle:player_joined", (data: { participants: any[] }) => {
      const opp = data.participants.find((p: any) => p.studentId !== myStudentId);
      if (opp) {
        setOpponentName(opp.name ?? "Opponent");
        setOpponentStudentId(opp.studentId ?? "");
      }
    });

    socket.on("battle:start", (data: {
      battle: any;
      firstQuestion: QuizQuestion;
      totalRounds: number;
      timePerRound: number;
    }) => {
      setCurrentQuestion(data.firstQuestion);
      answerSentRef.current = false;
      startTimer();
    });

    socket.on("battle:question", (data: { question: QuizQuestion; roundNumber: number }) => {
      setCurrentQuestion(data.question);
      setRoundNumber(data.roundNumber);
      setSelected(null);
      setRevealed(false);
      setRoundWinnerId(null);
      setCorrectOptionId(null);
      setWaiting(false);
      answerSentRef.current = false;
      startTimer();
    });

    socket.on("battle:round_result", (data: {
      roundNumber: number;
      winnerId: string | null;
      correctOptionId: string;
      scores: ScoreMap;
    }) => {
      processRoundResult({
        roundNumber: data.roundNumber,
        roundWinnerId: data.winnerId,
        correctOptionId: data.correctOptionId,
        scores: data.scores,
      });
    });

    socket.on("battle:end", (data: {
      winnerId: string;
      finalScores: { studentId: string; name: string; roundsWon: number; eloChange: number; xpEarned: number; newElo: number }[];
    }) => {
      clearTimer();
      const me = data.finalScores.find(s => s.studentId === myStudentId);
      const opp = data.finalScores.find(s => s.studentId !== myStudentId);
      onResult({
        winnerId: data.winnerId,
        myStudentId,
        isWinner: data.winnerId === myStudentId,
        myRoundsWon: me?.roundsWon ?? 0,
        opponentRoundsWon: opp?.roundsWon ?? 0,
        myName,
        opponentName: opp?.name ?? opponentName,
        eloChange: me?.eloChange ?? 0,
        xpEarned: me?.xpEarned ?? 0,
        newElo: me?.newElo ?? 1000,
      });
    });

    socket.on("battle:opponent_left", () => {
      toast("Opponent disconnected.");
      clearTimer();
      onEnd();
    });

    socket.on("battle:error", (data: { message: string }) => {
      toast.error(data.message ?? "Battle error.");
    });

    return () => {
      clearTimer();
      if (botAnswerTimeout.current) clearTimeout(botAnswerTimeout.current);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When bot mode: answer + bot already answered → resolve round
  useEffect(() => {
    if (!isBot || !waiting || !currentQuestion?.correctId) return;
    // Already waiting means player has answered; bot answer will come from triggerBotAnswer
    // Nothing to do here — bot fires via timeout
  }, [isBot, waiting, currentQuestion]);

  const timerPct = (timeLeft / secondsPerRound) * 100;
  const timerColor = timeLeft > secondsPerRound * 0.5
    ? "bg-emerald-500"
    : timeLeft > secondsPerRound * 0.25
    ? "bg-amber-500"
    : "bg-red-500";

  const myScore  = scores[myStudentId] ?? 0;
  const oppScore = isBot ? (scores["bot"] ?? 0) : (Object.entries(scores).find(([k]) => k !== myStudentId)?.[1] ?? 0);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* 🛡️ Combat HUD: Holographic Frames */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Unit A: Player */}
        <CardGlass className="p-8 border-blue-500/20 bg-blue-500/[0.02]">
           <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-blue-100 flex items-center justify-center text-2xl font-black text-slate-900 mb-4 shadow-xl">
                 {myName.charAt(0).toUpperCase()}
              </div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Unit Paragon</p>
              <p className="text-lg font-black text-slate-900 uppercase italic truncate max-w-full mb-6">{myName}</p>
              
              <div className="w-full space-y-2">
                 <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase italic">
                    <span>Dominance</span>
                    <span className="text-blue-600">{myScore}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <motion.div animate={{ width: `${(myScore/totalRounds)*100}%` }} className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
                 </div>
              </div>
           </div>
        </CardGlass>

        {/* ⚡ Battle Core: Timer & Round */}
        <div className="flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full"
              />
              <div className="relative w-28 h-28 rounded-full border-4 border-slate-900 flex flex-col items-center justify-center bg-white shadow-2xl z-10">
                 <p className={cn("text-3xl font-black tabular-nums", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-slate-900")}>
                    {timeLeft}
                 </p>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seconds</p>
              </div>
           </div>

           <div className="flex flex-col items-center gap-2">
              <div className="px-5 py-2 rounded-full bg-white text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                 Nexus Round {roundNumber}/{totalRounds}
              </div>
              {topicLabel && (
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full">
                   {topicLabel}
                </span>
              )}
           </div>
        </div>

        {/* Unit B: Opponent */}
        <CardGlass className="p-8 border-red-500/20 bg-red-500/[0.02]">
           <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white border-2 border-red-100 flex items-center justify-center text-2xl font-black text-slate-900 mb-4 shadow-xl">
                 {isBot ? <Sparkles className="w-8 h-8 text-purple-600" /> : opponentName.charAt(0).toUpperCase()}
              </div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">{isBot ? "Neural Construct" : "Enemy Paragon"}</p>
              <p className="text-lg font-black text-slate-900 uppercase italic truncate max-w-full mb-6">{isBot ? "Battle Bot" : opponentName}</p>

              <div className="w-full space-y-2">
                 <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase italic">
                    <span>Dominance</span>
                    <span className="text-red-600">{oppScore}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
                    <motion.div animate={{ width: `${(oppScore/totalRounds)*100}%` }} className="h-full bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                 </div>
              </div>
           </div>
        </CardGlass>
      </div>

      {/* 🧩 Data Node: Question */}
      {currentQuestion ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="space-y-8"
          >
            <CardGlass className="p-12 border-white/80 text-center">
               <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight italic">
                    "{currentQuestion.text}"
                  </h2>
               </div>
            </CardGlass>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selected === opt.id;
                const isCorrect  = revealed && opt.id === correctOptionId;
                const isWrong    = revealed && isSelected && opt.id !== correctOptionId;
                const label = String.fromCharCode(65 + optIdx);

                return (
                  <motion.button
                    key={opt.id}
                    whileHover={!revealed && !answerSentRef.current ? { y: -4, scale: 1.02 } : {}}
                    whileTap={!revealed && !answerSentRef.current ? { scale: 0.98 } : {}}
                    onClick={() => !revealed && !answerSentRef.current && handleAnswer(opt.id)}
                    disabled={revealed || answerSentRef.current}
                    className={cn(
                      "relative w-full text-left px-8 py-6 rounded-[2rem] border-2 transition-all group overflow-hidden",
                      isCorrect  ? "border-emerald-500 bg-emerald-50 shadow-emerald-500/10" :
                      isWrong    ? "border-red-500 bg-red-50 shadow-red-500/10" :
                      isSelected ? "border-blue-600 bg-blue-50 shadow-blue-500/10" :
                                   "border-white bg-white/40 backdrop-blur-md hover:border-blue-200 shadow-xl"
                    )}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                       <div className={cn(
                         "w-10 h-10 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                         isCorrect  ? "bg-emerald-500 text-white border-emerald-500" :
                         isWrong    ? "bg-red-500 text-white border-red-500" :
                         isSelected ? "bg-blue-600 text-white border-blue-600" :
                                      "bg-slate-50 text-slate-400 border-slate-100 group-hover:border-blue-200"
                       )}>
                          {label}
                       </div>
                       <span className={cn("text-base font-black uppercase italic tracking-tight", (revealed || isSelected) ? "text-slate-900" : "text-slate-600")}>
                         {opt.text}
                       </span>
                    </div>
                    {isCorrect && <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />}
                    {isWrong   && <XCircle      className="absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 text-red-500" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Event Log Overlay */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center"
                >
                   <div className={cn(
                     "px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl",
                     roundWinnerId === myStudentId ? "bg-emerald-500 text-white shadow-emerald-500/20" :
                     roundWinnerId === null ? "bg-white text-gray-900 shadow-slate-900/20" :
                     "bg-red-500 text-white shadow-red-500/20"
                   )}>
                      {roundWinnerId === myStudentId ? (
                        <><Star className="w-5 h-5 fill-white" /> Node Secured: Excellence Point Secured</>
                      ) : roundWinnerId === null ? (
                        <><Info className="w-5 h-5" /> Node Stabilized: Tie Detected</>
                      ) : (
                        <><Bolt className="w-5 h-5 fill-white" /> Sector Compromised: Opponent Gain</>
                      )}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {waiting && !revealed && (
              <div className="flex flex-col items-center gap-4 py-4 text-slate-400">
                <div className="flex gap-1.5">
                   {[0, 1, 2].map(i => <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, delay: i*0.2 }} className="w-2 h-2 rounded-full bg-blue-500" />)}
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Waiting for {isBot ? "Neural Construct" : "Enemy Paragon"} Response</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="py-40 flex flex-col items-center gap-6">
           <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-blue-50" />
              <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-pulse" />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Connecting to Neural Combat Frequency...</p>
        </div>
      )}

      {/* Manual Termination */}
      <div className="flex justify-center pt-10">
        <button onClick={onEnd} className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-50 transition-all">
          <X className="w-4 h-4" /> Terminate Link
        </button>
      </div>
    </div>
  );
}

const Bolt = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>
);
const Activity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  onPlayAgain,
  onHome,
}: {
  result: BattleResult;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const { isWinner, myRoundsWon, opponentRoundsWon, myName, opponentName,
    eloChange, xpEarned, newElo } = result;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <CardGlass className="p-12 text-center border-white/80 overflow-hidden">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="relative z-10"
        >
           <div className="flex justify-center mb-10">
              <div className={cn(
                "w-32 h-32 rounded-[3rem] flex items-center justify-center shadow-2xl relative",
                isWinner ? "bg-amber-400 text-white shadow-amber-500/40" : "bg-white text-white shadow-slate-900/40"
              )}>
                 {isWinner ? <Trophy className="w-16 h-16" /> : <Swords className="w-16 h-16" />}
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border-2 border-dashed border-current opacity-20 rounded-[3.5rem]" />
              </div>
           </div>

           <h2 className={cn("text-5xl font-black uppercase italic tracking-tighter mb-4", isWinner ? "text-amber-500" : "text-slate-900")}>
              {isWinner ? "Combat Zenith" : "Sector Compromised"}
           </h2>
           <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-12">
              {isWinner ? "Neural Link Dominance Established" : "Defensive Node Re-calibration Required"}
           </p>

           {/* Scoreboard */}
           <div className="grid grid-cols-3 gap-12 items-center mb-16">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Your Impact</p>
                 <p className="text-4xl font-black text-slate-900">{myRoundsWon}</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-px h-12 bg-slate-100" />
                 <span className="text-xs font-black text-gray-600 my-2">VS</span>
                 <div className="w-px h-12 bg-slate-100" />
              </div>
              <div className="text-left">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Enemy Impact</p>
                 <p className="text-4xl font-black text-slate-900">{opponentRoundsWon}</p>
              </div>
           </div>

           {/* Rewards Grid */}
           <div className="grid grid-cols-2 gap-6 mb-16">
              <div className="p-6 rounded-[2rem] bg-blue-50 border border-blue-100 flex flex-col items-center">
                 <Zap className="w-6 h-6 text-blue-600 mb-2" />
                 <p className="text-2xl font-black text-slate-900">+{xpEarned}</p>
                 <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Neural XP Sync</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-purple-50 border border-purple-100 flex flex-col items-center">
                 <TrendingUp className="w-6 h-6 text-purple-600 mb-2" />
                 <p className="text-2xl font-black text-slate-900">{newElo}</p>
                 <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest">ELO Resonance</p>
              </div>
           </div>

           {/* Actions */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white text-white text-xs font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all"
              >
                 Return to Arena
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onHome}
                className="w-full sm:w-auto px-12 py-5 rounded-2xl bg-white border border-slate-100 text-slate-900 text-xs font-black uppercase tracking-widest shadow-xl hover:border-blue-200 transition-all"
              >
                 Identity Hub
              </motion.button>
           </div>
        </motion.div>
        
        {/* Decorative Background Elements */}
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full -ml-32 -mb-32" />
        <div className={cn("absolute top-0 right-0 w-80 h-80 blur-[100px] rounded-full -mr-40 -mt-40", isWinner ? "bg-amber-500/10" : "bg-red-500/10")} />
      </CardGlass>
    </div>
  );
}

// ─── Topic Picker ─────────────────────────────────────────────────────────────

function TopicPicker({
  onSelect,
  onBack,
  loading,
}: {
  onSelect: (topicId: string, topicName: string) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId]     = useState("");

  const { data: subjects, isLoading: subLoading } = useSubjects();
  const { data: chapters, isLoading: chapLoading } = useChapters(subjectId);
  const { data: topics,   isLoading: topLoading  } = useTopics(chapterId);

  const subList  = Array.isArray(subjects) ? subjects : [];
  const chapList = Array.isArray(chapters) ? chapters : [];
  const topList  = Array.isArray(topics)   ? topics   : [];

  const selectedTopic = topList.find(t => t.id === topicId);

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase leading-none">Sector<br/><span className="not-italic text-blue-600">Selection</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-2">Designate combat coordinates via neural curriculum.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CardGlass className="p-8 border-slate-100 space-y-8">
            {/* Subject */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Curriculum Subject</label>
              {subLoading ? (
                <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
              ) : (
                <select
                  value={subjectId}
                  onChange={e => { setSubjectId(e.target.value); setChapterId(""); setTopicId(""); }}
                  className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                >
                  <option value="">Select subject…</option>
                  {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Chapter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Neural Chapter</label>
                {chapLoading && subjectId ? (
                  <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
                ) : (
                  <select
                    value={chapterId}
                    onChange={e => { setChapterId(e.target.value); setTopicId(""); }}
                    disabled={!subjectId}
                    className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <option value="">Select chapter…</option>
                    {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Topic</label>
                {topLoading && chapterId ? (
                  <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
                ) : (
                  <select
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                    disabled={!chapterId}
                    className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <option value="">Select topic…</option>
                    {topList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </CardGlass>

          {topicId && selectedTopic && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                className="w-full h-16 rounded-2xl bg-white border-none text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                disabled={!topicId || loading}
                onClick={() => topicId && selectedTopic && onSelect(topicId, selectedTopic.name)}
              >
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Optimizing Link…</>
                  : <><Swords className="w-5 h-5" /> Initiate Combat Sync</>
                }
              </Button>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <CardGlass className="p-8 border-blue-100 bg-blue-500/5">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                   <Target className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Mission Metadata</h3>
             </div>
             
             {selectedTopic ? (
               <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Node</p>
                     <p className="text-lg font-black text-slate-900 leading-tight">{selectedTopic.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-blue-100">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                        <p className="text-sm font-black text-slate-900 tabular-nums">{selectedTopic.estimatedStudyMinutes || 10}m Sync</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Complexity</p>
                        <div className="flex gap-1 mt-1">
                           {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1.5 w-4 rounded-full ${i <= 3 ? "bg-blue-500" : "bg-blue-200"}`} />)}
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-10 text-center space-y-4">
                  <Info className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Awaiting Designation</p>
               </div>
             )}
          </CardGlass>
        </div>
      </div>
    </div>
  );
}

// ─── Join Room Screen ─────────────────────────────────────────────────────────

function JoinRoomScreen({
  onBack,
  onJoined,
}: {
  onBack: () => void;
  onJoined: (room: BattleRoom) => void;
}) {
  const [code, setCode] = useState("");
  const joinBattle = useJoinBattle();

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    joinBattle.mutate(trimmed, {
      onSuccess: (room) => onJoined(room),
      onError: () => toast.error("Invalid room code or room is full."),
    });
  };

  return (
    <div className="max-w-xl mx-auto py-20 space-y-12">
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <UserPlus className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Neural<br/><span className="not-italic text-emerald-600">Join Link</span></h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Synchronize with a designated combat partner via room frequency.</p>
        </div>
      </div>

      <CardGlass className="p-10 border-emerald-100 flex flex-col items-center space-y-10">
        <div className="w-full space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center block">Access Frequency Code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            maxLength={8}
            placeholder="ALPHA-SYNC"
            className="h-20 w-full text-center text-4xl font-black tracking-[0.2em] px-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] outline-none focus:border-emerald-500 focus:bg-white transition-all uppercase placeholder:text-gray-800"
          />
        </div>

        <Button
          className="w-full h-16 rounded-2xl bg-white text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
          disabled={code.trim().length < 4 || joinBattle.isPending}
          onClick={handleJoin}
        >
          {joinBattle.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Syncing Node…</>
            : <><Swords className="w-5 h-5" /> Establish Link</>
          }
        </Button>

        <button onClick={onBack} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
          Abort Synchronization
        </button>
      </CardGlass>
    </div>
  );
}

// ─── Matchmaking / Waiting Room ───────────────────────────────────────────────

function MatchmakingScreen({
  room,
  mode,
  topicName,
  onCancel,
  onBattleStart,
}: {
  room: BattleRoom;
  mode: ModeConfig;
  topicName?: string;
  onCancel: () => void;
  onBattleStart: (room: BattleRoom) => void;
}) {
  const [copied, setCopied] = useState(false);
  const cancelBattle = useCancelBattle();
  const { data: updatedRoom } = useBattleRoom(room.battleId, room.status === "waiting");

  const currentRoom = updatedRoom ?? room;

  const copyCode = () => {
    navigator.clipboard.writeText(currentRoom.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCancel = () => {
    cancelBattle.mutate(room.battleId, {
      onSuccess: onCancel,
      onError: onCancel,
    });
  };

  useEffect(() => {
    if (currentRoom.status === "in_progress" || (currentRoom.status as string) === "active") {
      onBattleStart(currentRoom);
    }
  }, [currentRoom.status]);

  const isFriend = mode.mode === "challenge_friend";

  return (
    <div className="max-w-xl mx-auto py-20 space-y-12">
       <div className="flex flex-col items-center text-center space-y-10">
          {/* Cinematic Radar */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />
            {[1, 2, 3].map(i => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full border border-blue-500/20"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <div className="absolute inset-0 rounded-[3rem] bg-white border border-slate-100 shadow-2xl flex items-center justify-center group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
               <mode.icon className={cn("w-16 h-16 relative z-10 transition-transform group-hover:scale-110", mode.iconText)} />
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-1 border border-dashed border-blue-500/20 rounded-[3.5rem]" />
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">
                Neural<br/><span className="not-italic text-blue-600">{isFriend ? "Partner Sync" : "Tactical Search"}</span>
             </h2>
             <div className="flex items-center justify-center gap-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">{currentRoom.status === "waiting" ? "Pinging Neural Lattice..." : "Sync Established"}</span>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                {topicName ? `Neural Sector: ${topicName}` : mode.detail}
             </p>
          </div>
       </div>

       <CardGlass className="p-8 border-slate-100 space-y-8">
          <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Identity Frequency</p>
             <div className="relative group">
                <button
                  onClick={copyCode}
                  className="w-full flex items-center justify-between gap-6 px-8 py-5 rounded-2xl bg-white text-white shadow-2xl hover:bg-blue-600 transition-all border border-gray-200"
                >
                  <span className="text-3xl font-black tracking-[0.3em] font-mono leading-none">
                    {currentRoom.roomCode}
                  </span>
                  {copied
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    : <Copy className="w-5 h-5 text-white/40 group-hover:text-white shrink-0 transition-colors" />
                  }
                </button>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white border border-slate-100 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                   <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Click to Resonance Link</p>
                </div>
             </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-6">
             {isFriend && (
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed max-w-xs">
                 Instruct partner to execute <span className="text-blue-600">"Neural Join"</span> using this frequency.
               </p>
             )}
             <button
               onClick={handleCancel}
               className="px-8 py-3 rounded-xl border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
             >
               Abort Synchronization
             </button>
          </div>
       </CardGlass>
    </div>
  );
}

// ─── Battle XP Leaderboard Widget ─────────────────────────────────────────────

function BattleLeaderboard() {
  const { data: lb, isLoading } = useBattleLeaderboard();
  const entries = lb?.data?.slice(0, 5) ?? [];

  if (isLoading) {
    return (
      <CardGlass className="p-8">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center animate-pulse" />
           <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
           {[1, 2, 3].map(i => <div key={i} className="h-10 w-full bg-slate-50 rounded-2xl animate-pulse" />)}
        </div>
      </CardGlass>
    );
  }

  if (!entries.length) return null;

  return (
    <CardGlass className="p-8 border-white/60">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
             <Crown className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900 uppercase italic">Combat Elite</h3>
        </div>
        <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-red-500 text-white uppercase tracking-widest animate-pulse">Live Sync</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={entry.studentId} className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 border border-slate-50 hover:bg-white transition-all group">
            <span className={cn("text-xs font-black w-6 text-center italic", i===0 ? "text-amber-500" : i===1 ? "text-slate-400" : i===2 ? "text-orange-600" : "text-gray-600")}>
              #{i + 1}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
               {entry.avatarUrl ? <img src={entry.avatarUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px] font-black">{entry.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-black text-slate-900 uppercase italic truncate">{entry.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{entry.eloTier || "Iron"}</p>
            </div>
            <span className="text-[10px] font-black text-blue-600 tabular-nums bg-blue-50 px-2 py-0.5 rounded-lg">{entry.score.toLocaleString()} XP</span>
          </div>
        ))}
      </div>

      {lb?.currentStudentRank && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link Rank</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-900 italic">#{lb.currentStudentRank.rank}</span>
              <span className="text-[10px] font-black text-blue-600 tabular-nums">{lb.currentStudentRank.score.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      )}
    </CardGlass>
  );
}

// ─── Tier Progress Widget ─────────────────────────────────────────────────────

function TierProgress({ tier, xp }: { tier: string; xp: number }) {
  const tc = TIER_COLORS[tier] ?? TIER_COLORS.iron;
  const tierIdx = TIERS.findIndex(t => t.toLowerCase() === tier);
  const progressPct = tierIdx >= 0 ? ((tierIdx + 1) / TIERS.length) * 100 : 14;

  return (
    <CardGlass className="p-8 border-white/60">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", TIER_COLORS[tier]?.bg || "bg-slate-100")}>
             <Shield className={cn("w-6 h-6", TIER_COLORS[tier]?.text || "text-slate-400")} />
          </div>
          <div>
            <p className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{tier || "Iron"} Tier</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{xp.toLocaleString()} BATTLE XP</p>
          </div>
        </div>
        <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest", TIER_COLORS[tier]?.bg || "bg-slate-100", TIER_COLORS[tier]?.text || "text-slate-400")}>
          {tierIdx >= 0 && tierIdx < TIERS.length - 1 ? `Target: ${TIERS[tierIdx + 1]}` : "Zenith Reach"}
        </div>
      </div>

      <div className="relative pt-4 pb-2">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 relative">
          <motion.div
            className={cn("h-full rounded-full bg-gradient-to-r shadow-lg shadow-blue-500/20", tc.grad)}
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-4">
          {TIERS.map((t, i) => {
            const done = i < (tierIdx >= 0 ? tierIdx + 1 : 0);
            const current = i === tierIdx;
            return (
              <div key={t} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  current ? "bg-blue-600 ring-4 ring-blue-100 shadow-lg" : 
                  done ? "bg-blue-600/40" : "bg-slate-100"
                )} />
                <span className={cn("text-[8px] font-black uppercase tracking-tighter", current ? "text-blue-600" : "text-gray-600")}>
                  {t}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </CardGlass>
  );
}

// ─── Mode Card ────────────────────────────────────────────────────────────────

// ─── Mode Card: Mission Board Integration ─────────────────────────────────────

function ModeCard({
  mode,
  onSelect,
  dailyInfo,
}: {
  mode: ModeConfig;
  onSelect: () => void;
  dailyInfo?: { topicName?: string; playerCount?: number; status?: string } | null;
}) {
  const isDailyLive = mode.mode === "daily" && dailyInfo?.status === "active";
  const isDailyDisabled = mode.mode === "daily" && !dailyInfo;

  return (
    <CardGlass
      onClick={isDailyDisabled ? undefined : onSelect}
      className={cn(
        "p-8 border-white/80 group",
        isDailyDisabled ? "opacity-30 grayscale cursor-not-allowed shadow-none" : "hover:border-blue-200",
        isDailyLive ? "ring-2 ring-violet-500/20 shadow-violet-500/10" : ""
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", mode.iconBg, mode.iconText)}>
          <mode.icon className="w-7 h-7" />
        </div>
        {mode.badge && (
          <div className={cn(
            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm",
            isDailyLive ? "bg-red-500 text-white animate-pulse" : "bg-white text-white"
          )}>
            {isDailyLive ? "● Combat Live" : mode.badge}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-8">
        <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{mode.title}</h3>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
          {mode.mode === "daily" && dailyInfo?.topicName
            ? `Neural Zone: ${dailyInfo.topicName}`
            : mode.desc
          }
        </p>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
        <div className="flex items-center gap-3">
          {mode.mode === "daily" && dailyInfo?.playerCount ? (
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {dailyInfo.playerCount.toLocaleString()} ONLINE
            </span>
          ) : (
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              {mode.questions} NODES
            </span>
          )}
        </div>
        
        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
           <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </CardGlass>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({
  tier,
  xp,
  eloRating,
  dailyBattle,
  onModeSelect,
  onJoinFriend,
}: {
  tier: string;
  xp: number;
  eloRating?: number;
  dailyBattle: ReturnType<typeof useDailyBattle>["data"];
  onModeSelect: (mode: ModeConfig) => void;
  onJoinFriend: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      {/* 🛡️ Mission Directive Header */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-10">
        <div className="space-y-4">
           <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-white text-gray-900 w-fit shadow-xl">
             <Swords className="w-3.5 h-3.5 text-red-400" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">Neural Combat Frequency: Active</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
              Combat<br/><span className="not-italic text-red-600">Terminal</span>
           </h1>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
              {eloRating ? `SYNC Rating: ${eloRating} • ` : ""}Engage designated units to optimize ELO resonance.
           </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onJoinFriend}
          className="px-8 py-5 rounded-2xl bg-white border border-slate-100 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:border-emerald-200 transition-all group"
        >
           <UserPlus className="w-5 h-5 text-emerald-500 group-hover:rotate-12 transition-transform" /> Neural Join Link
        </motion.button>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <TierProgress tier={tier} xp={xp} />
         </div>
         <CardGlass className="p-8 bg-white border-gray-200 text-gray-900 flex flex-col justify-center">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Unit Rank</p>
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-blue-400" />
               </div>
               <div>
                  <p className="text-2xl font-black italic uppercase leading-none">{tier}</p>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Status: Operational</p>
               </div>
            </div>
         </CardGlass>
      </div>

      {/* Daily Directive Highlight */}
      {dailyBattle && (
        <CardGlass 
          onClick={() => onModeSelect(MODES.find(m => m.mode === "daily")!)}
          className="p-1 border-white/40 ring-1 ring-violet-500/20 shadow-violet-500/10"
        >
          <div className="bg-gradient-to-r from-violet-600/5 to-blue-600/5 p-8 rounded-[2.3rem] flex items-center justify-between group">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 rounded-[2rem] bg-violet-600 text-white flex items-center justify-center shadow-2xl shadow-violet-600/30 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Prime Objective</h3>
                  <span className="text-[9px] font-black px-3 py-1 rounded-full bg-violet-600 text-white uppercase tracking-widest animate-pulse">
                    {(dailyBattle as any).status === "active" ? "Combat Live" : "Synchronizing"}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">
                  {(dailyBattle as any).topicName
                    ? `Neural Sector: ${(dailyBattle as any).topicName}`
                    : "Zero Domain • Global Neural Convergence"}
                </p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl group-hover:translate-x-2 transition-all">
               <ArrowRight className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </CardGlass>
      )}

      {/* Mission Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-8">
          {MODES.filter(m => m.mode !== "daily").map(mode => (
            <ModeCard
              key={mode.mode}
              mode={mode}
              dailyInfo={null}
              onSelect={() => onModeSelect(mode)}
            />
          ))}
        </div>
        <div className="lg:col-span-1">
          <BattleLeaderboard />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Bot Picker Screen ────────────────────────────────────────────────────────

type BotTestType = "topic" | "chapter" | "subject";

function BotPickerScreen({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (questions: QuizQuestion[], label: string) => void;
}) {
  const [testType, setTestType]   = useState<BotTestType>("topic");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId]     = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [topicName, setTopicName]     = useState("");
  const [count, setCount]         = useState(10);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const { data: subjects, isLoading: subLoading } = useSubjects();
  const { data: chapters, isLoading: chapLoading } = useChapters(subjectId);
  const { data: topics,   isLoading: topLoading  } = useTopics(chapterId);

  const subList  = Array.isArray(subjects) ? subjects : [];
  const chapList = Array.isArray(chapters) ? chapters : [];
  const topList  = Array.isArray(topics)   ? topics   : [];

  const scopeId =
    testType === "topic"   ? topicId :
    testType === "chapter" ? chapterId :
                             subjectId;

  const scopeLabel =
    testType === "topic"   ? topicName :
    testType === "chapter" ? chapterName :
                             subjectName;

  const canStart = !!scopeId;

  const handleStart = async () => {
    if (!canStart) return;
    setError("");
    setLoading(true);
    try {
      const raw = await getBotPracticeQuestions(testType, scopeId, count);
      if (!raw.length) {
        setError("No questions found for this selection. Try a different subject, chapter, or topic.");
        return;
      }
      const qs: QuizQuestion[] = raw.map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctId: q.correctId ?? undefined,
      }));
      onStart(qs, scopeLabel);
    } catch {
      setError("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const TEST_TYPES: { key: BotTestType; label: string; desc: string; icon: any }[] = [
    { key: "topic",   label: "Neural Node",   desc: "Targeted single topic precision", icon: Target },
    { key: "chapter", label: "Sector Scan", desc: "Mixed chapter-wide engagement", icon: Globe },
    { key: "subject", label: "Global Sync", desc: "Full curriculum saturation", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </button>
        <div>
           <h2 className="text-3xl font-black text-slate-900 italic uppercase leading-none text-amber-500">Practice<br/><span className="not-italic text-slate-900">Construct</span></h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-2">Engage artificial intelligence units for curriculum mastery.</p>
        </div>
      </div>

      {/* Test type selector */}
      <div className="grid grid-cols-3 gap-6">
        {TEST_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => { setTestType(t.key); setSubjectId(""); setChapterId(""); setTopicId(""); setSubjectName(""); setChapterName(""); setTopicName(""); }}
            className={cn(
              "p-6 rounded-[2rem] border-2 text-left transition-all relative group overflow-hidden",
              testType === t.key
                ? "border-amber-500 bg-amber-500/5 shadow-xl shadow-amber-500/10"
                : "border-slate-100 hover:border-amber-200 hover:bg-slate-50"
            )}
          >
             <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform" />
             <t.icon className={cn("w-6 h-6 mb-4 relative z-10", testType === t.key ? "text-amber-500" : "text-gray-600")} />
             <p className={cn("text-sm font-black uppercase italic tracking-tight relative z-10", testType === t.key ? "text-slate-900" : "text-slate-400")}>
               {t.label}
             </p>
             <p className="text-[10px] font-bold text-slate-400 mt-1 relative z-10">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <CardGlass className="p-8 border-slate-100 space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lattice Subject</label>
              <select
                value={subjectId}
                onChange={e => {
                  const id = e.target.value;
                  setSubjectId(id);
                  setSubjectName(subList.find(s => s.id === id)?.name ?? "");
                  setChapterId(""); setChapterName("");
                  setTopicId(""); setTopicName("");
                }}
                className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-amber-500 transition-all appearance-none"
              >
                <option value="">Select subject…</option>
                {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
               {(testType === "chapter" || testType === "topic") && (
                 <div className="space-y-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <label className="ml-1">Designated Chapter</label>
                    <select
                      value={chapterId}
                      onChange={e => {
                        const id = e.target.value;
                        setChapterId(id);
                        setChapterName(chapList.find(c => c.id === id)?.name ?? "");
                        setTopicId(""); setTopicName("");
                      }}
                      disabled={!subjectId}
                      className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-amber-500 disabled:opacity-30 transition-all appearance-none"
                    >
                      <option value="">Select chapter…</option>
                      {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
               )}

               {testType === "topic" && (
                 <div className="space-y-3 font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    <label className="ml-1">Neural Node</label>
                    <select
                      value={topicId}
                      onChange={e => {
                        const id = e.target.value;
                        setTopicId(id);
                        setTopicName(topList.find(t => t.id === id)?.name ?? "");
                      }}
                      disabled={!chapterId}
                      className="h-14 w-full px-5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-amber-500 disabled:opacity-30 transition-all appearance-none"
                    >
                      <option value="">Select topic…</option>
                      {topList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                 </div>
               )}
            </div>
          </CardGlass>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <CardGlass className="p-8 border-amber-100 bg-amber-500/5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 block">Combat Iterations</label>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={cn(
                      "h-12 rounded-xl border-2 font-black text-sm transition-all shadow-sm",
                      count === n
                        ? "border-amber-500 bg-white text-amber-500 shadow-amber-500/10"
                        : "border-white bg-white/50 text-slate-400 hover:border-amber-200"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
           </CardGlass>
           <Button
             className="w-full h-16 rounded-[1.5rem] bg-amber-500 text-white font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
             disabled={!canStart || loading}
             onClick={handleStart}
           >
             {loading
               ? <><Loader2 className="w-5 h-5 animate-spin" /> Synchronizing…</>
               : <><Bolt className="w-5 h-5" /> Engage AI Construct</>
             }
           </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────

type Stage = "home" | "topic_pick" | "join_room" | "matchmaking" | "in_battle" | "result" | "error";

const BattleArena = () => {
  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: dailyBattle } = useDailyBattle();
  const { data: eloData } = useMyBattleElo();
  const createBattle = useCreateBattle();

  const [stage, setStage]             = useState<Stage>("home");
  const [activeMode, setActiveMode]   = useState<ModeConfig | null>(null);
  const [battleRoom, setBattleRoom]   = useState<BattleRoom | null>(null);
  const [topicName, setTopicName]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);

  const student    = me?.student;
  const tier       = (eloData?.tier ?? student?.currentEloTier ?? "iron").toLowerCase();
  const xp         = eloData?.battleXp ?? student?.xpPoints ?? 0;
  const eloRating  = eloData?.eloRating;
  const myStudentId = student?.id ?? "";
  const myName      = me?.fullName ?? "You";

  const handleModeSelect = (mode: ModeConfig) => {
    setActiveMode(mode);
    if (mode.mode === "topic_battle") {
      setStage("topic_pick");
    } else if (mode.mode === "daily" && dailyBattle && (dailyBattle as any).roomCode) {
      // Daily battle: join the existing daily room by code rather than creating a new one
      const db = dailyBattle as any;
      if (db.battleId) {
        // Already has a battleId — go straight to matchmaking with that room
        setBattleRoom({ battleId: db.battleId, roomCode: db.roomCode, status: db.status === "active" ? "in_progress" : db.status, mode: "daily" });
        setStage("matchmaking");
      } else {
        startBattle(mode);
      }
    } else {
      startBattle(mode);
    }
  };

  const startBattle = (mode: ModeConfig, topId?: string, topName?: string) => {
    setTopicName(topName ?? "");
    createBattle.mutate(
      { mode: mode.mode, topicId: topId },
      {
        onSuccess: (room) => {
          setBattleRoom(room);
          setStage("matchmaking");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || "Could not create battle. Try again.";
          setErrorMsg(msg);
          setStage("error");
          toast.error(msg);
        },
      }
    );
  };

  const handleTopicSelect = (topId: string, topName: string) => {
    if (!activeMode) return;
    startBattle(activeMode, topId, topName);
    // stage is set to "matchmaking" inside startBattle.onSuccess; don't set here
  };

  const handleJoined = (room: BattleRoom) => {
    setBattleRoom(room);
    setActiveMode(MODES.find(m => m.mode === "challenge_friend") ?? MODES[0]);
    setStage("matchmaking");
  };

  const handleBattleStart = (room: BattleRoom) => {
    setBattleRoom(room);
    setStage("in_battle");
    toast.success("Battle started! Good luck!");
  };

  const handleBattleResult = (result: BattleResult) => {
    setBattleResult(result);
    setStage("result");
  };

  const reset = () => {
    setStage("home");
    setActiveMode(null);
    setBattleRoom(null);
    setTopicName("");
    setErrorMsg("");
    setBattleResult(null);
  };

  const playAgain = () => {
    if (!activeMode) { reset(); return; }
    setBattleRoom(null);
    setBattleResult(null);
    if (activeMode.mode === "topic_battle") {
      setStage("topic_pick");
    } else if (activeMode.mode === "daily") {
      // Re-enter the daily battle
      handleModeSelect(activeMode);
    } else {
      startBattle(activeMode);
    }
  };

  if (meLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] custom-scrollbar selection:bg-red-600/10">
      {/* ── Aero Dynamic Background ── */}
   
      <div className="relative z-10 px-6 sm:px-10 py-8 max-w-[1700px] mx-auto">
        <AnimatePresence mode="wait">
          {stage === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <HomeScreen
                tier={tier}
                xp={xp}
                eloRating={eloRating}
                dailyBattle={dailyBattle}
                onModeSelect={handleModeSelect}
                onJoinFriend={() => setStage("join_room")}
              />
            </motion.div>
          )}

          {stage === "topic_pick" && activeMode && (
            <motion.div key="topic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <TopicPicker
                onBack={() => setStage("topic_pick")}
                onSelect={handleTopicSelect}
                loading={createBattle.isPending}
              />
            </motion.div>
          )}

          {stage === "join_room" && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <JoinRoomScreen onBack={() => setStage("home")} onJoined={handleJoined} />
            </motion.div>
          )}

          {stage === "matchmaking" && battleRoom && activeMode && (
            <motion.div key="matchmaking" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
              <MatchmakingScreen
                room={battleRoom}
                mode={activeMode}
                topicName={topicName}
                onCancel={reset}
                onBattleStart={handleBattleStart}
              />
            </motion.div>
          )}

          {stage === "in_battle" && battleRoom && activeMode && (
            <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BattleInProgress
                room={battleRoom}
                mode={activeMode}
                myStudentId={myStudentId}
                myName={myName}
                onEnd={reset}
                onResult={handleBattleResult}
                topicLabel={topicName || undefined}
              />
            </motion.div>
          )}

          {stage === "result" && battleResult && (
            <motion.div key="result" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <ResultScreen
                result={battleResult}
                onPlayAgain={playAgain}
                onHome={reset}
              />
            </motion.div>
          )}

          {stage === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="w-20 h-20 mb-8 rounded-[2rem] bg-red-50 text-red-500 flex items-center justify-center shadow-xl">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-2">Sync Interrupted</h2>
              <p className="text-sm font-bold text-slate-400 max-w-sm mb-10 uppercase tracking-tight">{errorMsg || "Neural link failure detected."}</p>
              <button onClick={reset} className="px-10 py-4 rounded-2xl bg-white text-gray-900 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl">
                <ArrowLeft className="w-4 h-4" /> Reset Hub
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BattleArena;
