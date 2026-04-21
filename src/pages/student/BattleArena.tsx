/**
 * BattleArena
 *
 * Stages:
 *   home          → browse modes, daily battle, live leaderboard
 *   topic_pick    → topic selector for topic_battle mode
 *   join_room     → enter a room code to join a friend's battle
 *   matchmaking   → waiting room after createBattle() resolves
 *   in_battle     → live quiz UI (socket.io or bot simulation)
 *   result        → XP points result screen
 *   error         → recoverable error state
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords, Zap, Users, Globe, UserPlus,
  Trophy, Clock, ArrowLeft, ArrowRight, Copy, Check,
  Loader2, Wifi, X, Crown, Target,
  ChevronRight, Sparkles, Shield, AlertCircle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Star, Flame, Info, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  studentKeys,
  useStudentMe, useCreateBattle,
  useCancelBattle, useBattleRoom, useJoinBattle,
  useBattleLeaderboard, useMyBattleElo,
  useMyCourses, useCourseCurriculum,
  useSubjects, useChapters, useTopics,
} from "@/hooks/use-student";
import { authKeys } from "@/hooks/use-auth";
import { patchStudentXpDelta } from "@/lib/auth-store";
import { BattleMode, BattleRoom, getBotPracticeQuestions } from "@/lib/api/student";
import { tokenStorage } from "@/lib/api/client";
import { getApiOrigin } from "@/lib/api-config";
import { toast } from "sonner";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE   = "#4F46E5"; // Indigo-600
const PURPLE = "#7C3AED";
const CYAN   = "#06B6D4";
const AMBER  = "#F59E0B";
const EMERALD = "#10B981";
const SLATE  = "#94A3B8";

const CardGlass = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <motion.div 
    whileHover={onClick ? { y: -2, scale: 1.005 } : {}}
    whileTap={onClick ? { scale: 0.995 } : {}}
    onClick={onClick}
    className={cn(
      "bg-white/30 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative overflow-hidden transition-all duration-500",
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
  // {
  //   mode: "quick_duel",
  //   title: "Quick Duel",
  //   desc: "Fast 1v1 quiz",
  //   detail: "5 questions · 30s each",
  //   icon: Zap,
  //   iconBg: "bg-indigo-50",
  //   iconText: "text-indigo-600",
  //   accent: "hover:border-indigo-100",
  //   questions: 5,
  //   seconds: 30,
  // },
  {
    mode: "challenge_friend",
    title: "Challenge Friend",
    desc: "Play with a friend",
    detail: "10 questions · room code",
    icon: UserPlus,
    iconBg: "bg-emerald-50",
    iconText: "text-emerald-500",
    accent: "hover:border-emerald-100",
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
  isDraw?: boolean;
  myStudentId: string;
  isWinner: boolean;
  myRoundsWon: number;
  opponentRoundsWon: number;
  myCorrectAnswers?: number;
  opponentCorrectAnswers?: number;
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
  myAvatarUrl,
  onEnd,
  onResult,
  prefetchedQuestions,
  topicLabel,
}: {
  room: BattleRoom;
  mode: ModeConfig;
  myStudentId: string;
  myName: string;
  myAvatarUrl?: string | null;
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
  const [opponentAvatarUrl, setOpponentAvatarUrl] = useState<string | null>(null);
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

  // Strip any path (e.g. /api/v1) — socket.io needs just the origin
  const backendUrl = (() => {
    const raw = import.meta.env.VITE_BACKEND_URL || getApiOrigin() || "http://127.0.0.1:3000";
    try { return new URL(raw).origin; } catch { return raw; }
  })();

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

    // If last round: bot mode ends locally; PvP waits for server `battle:end` (do not call
    // finalizeBattle — it would overwrite real XP/ELO with placeholders).
    if (data.roundNumber >= totalRounds) {
      setTimeout(() => {
        if (isBot) finalizeBattle(effectiveWinnerId, newScores);
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
        setOpponentAvatarUrl(opp.avatarUrl ?? null);
      }
    });

    socket.on("battle:start", (data: {
      battle: any;
      participants?: any[];
      firstQuestion: QuizQuestion;
      totalRounds: number;
      timePerRound: number;
    }) => {
      // Populate opponent info if participants are included (challenge / reconnect path)
      if (data.participants?.length) {
        const opp = data.participants.find((p: any) => p.studentId !== myStudentId);
        if (opp) {
          setOpponentName(opp.name ?? "Opponent");
          setOpponentStudentId(opp.studentId ?? "");
          setOpponentAvatarUrl(opp.avatarUrl ?? null);
        }
      }
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
      winnerId: string | null;
      isDraw?: boolean;
      finalScores: {
        studentId: string;
        name: string;
        roundsWon: number;
        correctAnswers?: number;
        eloChange: number;
        xpEarned: number;
        newElo: number;
      }[];
    }) => {
      clearTimer();
      const me = data.finalScores.find(s => s.studentId === myStudentId);
      const opp = data.finalScores.find(s => s.studentId !== myStudentId);
      const draw = data.isDraw === true || (data.winnerId == null && (me?.roundsWon === opp?.roundsWon));
      onResult({
        winnerId: data.winnerId,
        isDraw: draw,
        myStudentId,
        isWinner: !draw && data.winnerId === myStudentId,
        myRoundsWon: me?.roundsWon ?? 0,
        opponentRoundsWon: opp?.roundsWon ?? 0,
        myCorrectAnswers: me?.correctAnswers,
        opponentCorrectAnswers: opp?.correctAnswers,
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
        <CardGlass className="p-8 border-indigo-100 bg-white/40">
           <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-800 mb-4 shadow-sm overflow-hidden">
                 {myAvatarUrl
                   ? <img src={myAvatarUrl} alt={myName} className="w-full h-full object-cover" />
                   : myName.charAt(0).toUpperCase()}
              </div>
              <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mb-1">UNIT PARAGON</p>
              <p className="text-base font-bold text-slate-700 uppercase tracking-tight truncate max-w-full mb-6">{myName}</p>
              
              <div className="w-full space-y-2">
                 <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>DOMINANCE</span>
                    <span className="text-indigo-600">{myScore}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(myScore/totalRounds)*100}%` }} className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
                 </div>
              </div>
           </div>
        </CardGlass>

        {/* ⚡ Battle Core: Timer & Round */}
        <div className="flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-x-[-20%] inset-y-[-20%] bg-indigo-500/5 blur-2xl rounded-full"
              />
              <div className="relative w-24 h-24 rounded-full border border-slate-100 flex flex-col items-center justify-center bg-white shadow-xl z-10 transition-all duration-500">
                 <p className={cn("text-2xl font-bold tabular-nums", timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-slate-800")}>
                    {timeLeft}
                 </p>
                 <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">TIME LEFT</p>
              </div>
           </div>

           <div className="flex flex-col items-center gap-2">
              <div className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-[8px] font-bold uppercase tracking-widest shadow-sm">
                 ROUND {roundNumber}/{totalRounds}
              </div>
              {topicLabel && (
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-50/50 border border-indigo-100/50 px-3 py-1 rounded-full">
                   {topicLabel}
                </span>
              )}
           </div>
        </div>

        {/* Unit B: Opponent */}
        <CardGlass className="p-8 border-slate-100 bg-white/40">
           <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl font-bold text-slate-800 mb-4 shadow-sm overflow-hidden">
                 {isBot
                   ? <Sparkles className="w-6 h-6 text-indigo-400" />
                   : opponentAvatarUrl
                     ? <img src={opponentAvatarUrl} alt={opponentName} className="w-full h-full object-cover" />
                     : opponentName.charAt(0).toUpperCase()}
              </div>
              <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mb-1">{isBot ? "NEURAL CONSTRUCT" : "ENEMY PARAGON"}</p>
              <p className="text-base font-bold text-slate-700 uppercase tracking-tight truncate max-w-full mb-6">{isBot ? "Battle Bot" : opponentName}</p>

              <div className="w-full space-y-2">
                 <div className="flex justify-between text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                    <span>DOMINANCE</span>
                    <span className="text-slate-500">{oppScore}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div animate={{ width: `${(oppScore/totalRounds)*100}%` }} className="h-full bg-slate-400" />
                 </div>
              </div>
           </div>
        </CardGlass>
      </div>

      {/* Waiting for friend to join (challenge_friend, before battle:start) */}
      {!currentQuestion && mode.mode === "challenge_friend" && (
        <CardGlass className="p-12 border-white/80 text-center bg-white/40 space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            {[1, 2].map(i => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full border-2 border-indigo-400/30"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 2.5, delay: i * 1.2, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <div className="absolute inset-0 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Users className="w-8 h-8 text-indigo-500" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-800 uppercase tracking-tight">Waiting for Friend</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Share the code below — battle starts the moment they join
            </p>
          </div>
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white border border-slate-100 shadow-lg">
            <span className="text-3xl font-black tracking-[0.3em] font-mono text-slate-800">{room.roomCode}</span>
            <button
              onClick={() => navigator.clipboard.writeText(room.roomCode).then(() => toast.success("Code copied!"))}
              className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              <Copy className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </CardGlass>
      )}

      {/* 🧩 Data Node: Question */}
      {currentQuestion ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="space-y-8"
          >
            <CardGlass className="p-12 border-white/80 text-center bg-white/40">
               <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight tracking-tight">
                    {currentQuestion.text}
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
                    whileHover={!revealed && !answerSentRef.current ? { y: -2 } : {}}
                    whileTap={!revealed && !answerSentRef.current ? { scale: 0.99 } : {}}
                    onClick={() => !revealed && !answerSentRef.current && handleAnswer(opt.id)}
                    disabled={revealed || answerSentRef.current}
                    className={cn(
                      "relative w-full text-left px-8 py-5 rounded-2xl border transition-all group overflow-hidden",
                      isCorrect  ? "border-emerald-500 bg-emerald-50 shadow-sm" :
                      isWrong    ? "border-red-500 bg-red-50 shadow-sm" :
                      isSelected ? "border-indigo-600 bg-indigo-50/50 shadow-sm" :
                                   "border-slate-100 bg-white shadow-sm hover:border-indigo-200"
                    )}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                       <div className={cn(
                         "w-9 h-9 rounded-xl border flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors",
                         isCorrect  ? "bg-emerald-500 text-white border-emerald-500" :
                         isWrong    ? "bg-red-500 text-white border-red-500" :
                         isSelected ? "bg-indigo-600 text-white border-indigo-600" :
                                      "bg-slate-50 text-slate-400 border-slate-100 group-hover:border-indigo-200"
                       )}>
                          {label}
                       </div>
                       <span className={cn("text-sm font-bold tracking-tight", (revealed || isSelected) ? "text-slate-800" : "text-slate-500")}>
                         {opt.text}
                       </span>
                    </div>
                    {isCorrect && <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />}
                    {isWrong   && <XCircle      className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />}
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
                        <><Star className="w-5 h-5 fill-white" /> Correct! You win this round</>
                      ) : roundWinnerId === null ? (
                        <><Info className="w-5 h-5" /> Tie round</>
                      ) : (
                        <><Bolt className="w-5 h-5 fill-white" /> Opponent wins this round</>
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
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Waiting for {isBot ? "AI" : "Opponent"} response</p>
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
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Connecting to battle...</p>
        </div>
      )}

      {/* Manual Termination */}
      <div className="flex justify-center pt-10">
        <button onClick={onEnd} className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-50 transition-all">
          <X className="w-4 h-4" /> Leave Battle
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
    eloChange, xpEarned, newElo, isDraw, myCorrectAnswers, opponentCorrectAnswers, winnerId } = result;

  const winnerDisplayName = !isDraw && winnerId
    ? (winnerId === result.myStudentId ? myName : opponentName)
    : null;

  return (
    <div className="max-w-4xl mx-auto py-12">
      <CardGlass className="relative overflow-hidden border-indigo-400/20 bg-gradient-to-br from-[#0B1026] via-[#101735] to-[#151A35] p-12 text-center text-white">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
        <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
           <div className="flex justify-center mb-10">
              <div className={cn(
                "w-28 h-28 rounded-3xl flex items-center justify-center shadow-lg relative",
                isDraw
                  ? "bg-sky-500/10 text-sky-300 border border-sky-400/30"
                  : isWinner
                    ? "bg-amber-500/10 text-amber-300 border border-amber-400/30"
                    : "bg-red-500/10 text-red-300 border border-red-400/30"
              )}>
                 {isDraw ? <Swords className="w-12 h-12" /> : isWinner ? <Trophy className="w-12 h-12" /> : <Swords className="w-12 h-12" />}
                 <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -inset-4 border border-dashed border-current opacity-10 rounded-[2.5rem]" />
              </div>
           </div>

           <h2 className={cn(
             "text-3xl font-extrabold tracking-tight mb-2",
             isDraw ? "text-sky-300" : isWinner ? "text-amber-300" : "text-red-300",
           )}>
              {isDraw ? "Draw" : isWinner ? "Victory" : "Defeat"}
           </h2>
           <p className="text-[10px] font-bold text-white/55 uppercase tracking-widest mb-2">
              {isDraw ? "Evenly matched!" : isWinner ? "Great job!" : "Good try. Try again!"}
           </p>
           {winnerDisplayName && (
             <p className="text-sm font-semibold text-white/80 mb-10">
               Winner: <span className="text-amber-200">{winnerDisplayName}</span>
             </p>
           )}
           {isDraw && <div className="mb-10" />}

           {/* Scoreboard — round wins */}
           <div className="grid grid-cols-3 gap-12 items-center mb-8 max-w-lg mx-auto">
              <div className="text-right">
                 <p className="text-[8px] font-bold text-white/45 uppercase tracking-widest mb-2">{myName}</p>
                 <p className="text-3xl font-extrabold text-white">{myRoundsWon}</p>
                 <p className="text-[9px] font-bold text-white/40 mt-1">rounds won</p>
              </div>
              <div className="flex flex-col items-center">
                 <div className="w-px h-10 bg-white/10" />
                 <span className="text-[9px] font-bold text-white/50 my-2">VS</span>
                 <div className="w-px h-10 bg-white/10" />
              </div>
              <div className="text-left">
                 <p className="text-[8px] font-bold text-white/45 uppercase tracking-widest mb-2">{opponentName}</p>
                 <p className="text-3xl font-extrabold text-white">{opponentRoundsWon}</p>
                 <p className="text-[9px] font-bold text-white/40 mt-1">rounds won</p>
              </div>
           </div>

           {(myCorrectAnswers !== undefined || opponentCorrectAnswers !== undefined) && (
             <div className="mb-12 max-w-lg mx-auto rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
               <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-3">Correct answers</p>
               <div className="flex justify-between text-sm font-semibold">
                 <span className="text-white/90">{myName}: <span className="text-emerald-300">{myCorrectAnswers ?? "—"}</span></span>
                 <span className="text-white/90">{opponentName}: <span className="text-emerald-300">{opponentCorrectAnswers ?? "—"}</span></span>
               </div>
             </div>
           )}

           {/* Rewards Grid */}
           <div className="grid grid-cols-2 gap-4 mb-16 max-w-md mx-auto">
              <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-400/20 flex flex-col items-center shadow-sm">
                 <Zap className="w-5 h-5 text-indigo-300 mb-2" />
                 <p className="text-xl font-extrabold text-white">+{xpEarned}</p>
                 <p className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">battle XP (added to profile)</p>
              </div>
              <div className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 flex flex-col items-center shadow-sm">
                 {eloChange >= 0 ? <TrendingUp className="w-5 h-5 text-cyan-300 mb-2" /> : <TrendingDown className="w-5 h-5 text-red-300 mb-2" />}
                 <p className="text-xl font-extrabold text-white">{eloChange >= 0 ? "+" : ""}{eloChange}</p>
                 <p className="text-[8px] font-bold text-cyan-300 uppercase tracking-widest">elo · new rating {newElo}</p>
              </div>
           </div>
           <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
             <Flame className="w-3.5 h-3.5" />
             Win streak {isDraw ? "—" : isWinner ? "+1" : "reset"}
           </div>

           {/* Actions */}
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={onPlayAgain}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all hover:bg-indigo-500"
              >
                 Rematch
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={onHome}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-white/5 border border-white/20 text-white text-[9px] font-bold uppercase tracking-widest shadow-sm hover:bg-white/10 transition-all"
              >
                 Back to Lobby
              </motion.button>
           </div>
        </motion.div>
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
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Choose <span className="text-indigo-600">Topic</span></h2>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Pick a subject, chapter, and topic to start.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <CardGlass className="p-8 border-slate-100 space-y-8 bg-white/40">
            {/* Subject */}
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Subject</label>
              {subLoading ? (
                <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
              ) : (
                <select
                  value={subjectId}
                  onChange={e => { setSubjectId(e.target.value); setChapterId(""); setTopicId(""); }}
                  className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none shadow-sm"
                >
                  <option value="">Select subject…</option>
                  {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Chapter */}
              <div className="space-y-3">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Chapter</label>
                {chapLoading && subjectId ? (
                  <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
                ) : (
                  <select
                    value={chapterId}
                    onChange={e => { setChapterId(e.target.value); setTopicId(""); }}
                    disabled={!subjectId}
                    className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-30 shadow-sm"
                  >
                    <option value="">Select chapter…</option>
                    {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Topic */}
              <div className="space-y-3">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Target Topic</label>
                {topLoading && chapterId ? (
                  <div className="h-14 rounded-2xl bg-slate-50 animate-pulse" />
                ) : (
                  <select
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                    disabled={!chapterId}
                    className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none disabled:opacity-30 shadow-sm"
                  >
                    <option value="">Select topic…</option>
                    {topList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </CardGlass>

          {topicId && selectedTopic && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                className="w-full h-16 rounded-[2.5rem] bg-slate-900 border-none text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                disabled={!topicId || loading}
                onClick={() => topicId && selectedTopic && onSelect(topicId, selectedTopic.name)}
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
                  : <><Swords className="w-4 h-4" /> Start Battle</>
                }
              </Button>
            </motion.div>
          )}
        </div>

        <div className="space-y-6">
          <CardGlass className="p-8 border-indigo-100 bg-indigo-50/30">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-md">
                   <Target className="w-5 h-5" />
                </div>
                <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Battle Details</h3>
             </div>
             
             {selectedTopic ? (
               <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Selected Topic</p>
                     <p className="text-base font-bold text-slate-700 leading-tight">{selectedTopic.name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-indigo-100/50">
                     <div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Estimated Time</p>
                        <p className="text-xs font-bold text-slate-700 tabular-nums">{selectedTopic.estimatedStudyMinutes || 10} min</p>
                     </div>
                     <div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Difficulty</p>
                        <div className="flex gap-1 mt-1.5">
                           {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1 w-3.5 rounded-full ${i <= 3 ? "bg-indigo-500" : "bg-indigo-100"}`} />)}
                        </div>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="py-10 text-center space-y-4">
                  <Info className="w-7 h-7 text-indigo-200 mx-auto opacity-40" />
                  <p className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">Choose a topic to continue</p>
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
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-sm">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">Join with <span className="text-indigo-600">Code</span></h2>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Enter your friend's battle code.</p>
        </div>
      </div>

      <CardGlass className="p-10 border-slate-100 flex flex-col items-center space-y-10 bg-white/40">
        <div className="w-full space-y-4">
          <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 text-center block">ROOM CODE</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            maxLength={8}
            placeholder="ENTER CODE"
            className="h-16 w-full text-center text-2xl font-bold tracking-[0.2em] px-8 bg-white border border-slate-100 rounded-2xl outline-none focus:border-indigo-500 transition-all uppercase placeholder:text-slate-200 shadow-sm"
          />
        </div>

        <Button
          className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
          disabled={code.trim().length < 4 || joinBattle.isPending}
          onClick={handleJoin}
        >
          {joinBattle.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
            : <><Swords className="w-4 h-4" /> Join Battle</>
          }
        </Button>

        <button onClick={onBack} className="text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors">
          Back
        </button>
      </CardGlass>
    </div>
  );
}

// ─── Challenge Scope Picker (for Create Code flow) ───────────────────────────

type ScopeType = "topic" | "chapter" | "subject";

function ChallengeScopePicker({
  onBack,
  onStart,
  loading,
}: {
  onBack: () => void;
  onStart: (topicId: string | undefined, label: string) => void;
  loading: boolean;
}) {
  const [scopeType, setScopeType] = useState<ScopeType>("topic");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId]     = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [topicName, setTopicName]     = useState("");

  // Use enrolled course curriculum — this is what the student actually has access to
  const { data: myCourses = [], isLoading: coursesLoading } = useMyCourses();
  const primaryBatchId = myCourses[0]?.id ?? "";
  const { data: curriculum, isLoading: currLoading } = useCourseCurriculum(primaryBatchId);

  const isLoading = coursesLoading || currLoading;

  // Derive subject/chapter/topic lists from curriculum
  const subList = curriculum?.subjects ?? [];
  const chapList = subjectId
    ? (subList.find(s => s.id === subjectId)?.chapters ?? [])
    : [];
  const topList = chapterId
    ? (chapList.find(c => c.id === chapterId)?.topics ?? [])
    : [];

  const canStart =
    scopeType === "topic"   ? !!topicId :
    scopeType === "chapter" ? !!chapterId :
                              !!subjectId;

  const handleStart = () => {
    if (!canStart) return;
    if (scopeType === "topic") {
      onStart(topicId, topicName);
    } else if (scopeType === "chapter") {
      // Pick first topic of that chapter as the AI question anchor
      const firstTopic = topList[0];
      onStart(firstTopic?.id, chapterName);
    } else {
      // Subject — let backend pick a topic from that subject
      const firstChapter = chapList[0];
      const firstTopic = firstChapter?.topics?.[0];
      onStart(firstTopic?.id, subjectName);
    }
  };

  const SCOPE_TABS: { key: ScopeType; label: string; desc: string }[] = [
    { key: "subject", label: "Subject", desc: "Mixed questions from a subject" },
    { key: "chapter", label: "Chapter", desc: "Questions from one chapter" },
    { key: "topic",   label: "Topic",   desc: "Deep dive into one topic" },
  ];

  const resetSelections = () => {
    setSubjectId(""); setSubjectName("");
    setChapterId(""); setChapterName("");
    setTopicId("");   setTopicName("");
  };

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
            Choose <span className="text-emerald-500">Battle Scope</span>
          </h2>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">
            Select what your quiz questions will be based on.
          </p>
        </div>
      </div>

      {/* Scope Type Tabs */}
      <div className="grid grid-cols-3 gap-4">
        {SCOPE_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setScopeType(t.key); resetSelections(); }}
            className={cn(
              "p-5 rounded-2xl border text-left transition-all",
              scopeType === t.key
                ? "border-emerald-400 bg-emerald-50/40"
                : "border-slate-100 bg-white hover:border-emerald-200"
            )}
          >
            <p className={cn("text-[11px] font-bold uppercase tracking-tight", scopeType === t.key ? "text-slate-800" : "text-slate-400")}>
              {t.label}
            </p>
            <p className="text-[9px] font-bold text-slate-300 mt-1 leading-relaxed uppercase tracking-widest">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Selects */}
      <CardGlass className="p-8 border-slate-100 space-y-6 bg-white/40">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-2xl bg-slate-50 animate-pulse" />)}
          </div>
        ) : subList.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <Info className="w-8 h-8 text-slate-200 mx-auto" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              No course enrolled yet. Please enroll in a course first.
            </p>
          </div>
        ) : (
          <>
            {/* Subject */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Subject</label>
              <select
                value={subjectId}
                onChange={e => {
                  const id = e.target.value;
                  setSubjectId(id);
                  setSubjectName(subList.find(s => s.id === id)?.name ?? "");
                  setChapterId(""); setChapterName("");
                  setTopicId("");   setTopicName("");
                }}
                className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all appearance-none shadow-sm"
              >
                <option value="">Select subject…</option>
                {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Chapter (when scope = chapter or topic) */}
            {(scopeType === "chapter" || scopeType === "topic") && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Chapter</label>
                <select
                  value={chapterId}
                  onChange={e => {
                    const id = e.target.value;
                    setChapterId(id);
                    setChapterName(chapList.find(c => c.id === id)?.name ?? "");
                    setTopicId(""); setTopicName("");
                  }}
                  disabled={!subjectId}
                  className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all appearance-none disabled:opacity-30 shadow-sm"
                >
                  <option value="">Select chapter…</option>
                  {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Topic (when scope = topic) */}
            {scopeType === "topic" && (
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Topic</label>
                <select
                  value={topicId}
                  onChange={e => {
                    const id = e.target.value;
                    setTopicId(id);
                    setTopicName(topList.find(t => t.id === id)?.name ?? "");
                  }}
                  disabled={!chapterId}
                  className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all appearance-none disabled:opacity-30 shadow-sm"
                >
                  <option value="">Select topic…</option>
                  {topList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </>
        )}
      </CardGlass>

      {/* Selected scope summary + CTA */}
      {canStart && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
              {scopeType === "topic"   && topicName   && `Topic: ${topicName}`}
              {scopeType === "chapter" && chapterName && `Chapter: ${chapterName}`}
              {scopeType === "subject" && subjectName && `Subject: ${subjectName}`}
            </p>
          </div>
          <Button
            className="w-full h-16 rounded-[2.5rem] bg-slate-900 text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
            disabled={loading}
            onClick={handleStart}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating room…</>
              : <><Copy className="w-4 h-4" /> Generate Battle Code</>
            }
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Challenge Friend Picker ──────────────────────────────────────────────────

function ChallengeFriendPickerScreen({
  onCreateCode,
  onJoinCode,
  onBack,
}: {
  onCreateCode: () => void;
  onJoinCode: () => void;
  onBack: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto py-16 space-y-12">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button
          onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none">
            Challenge a <span className="text-emerald-500">Friend</span>
          </h2>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">
            Create a code or join with one your friend shared.
          </p>
        </div>
      </div>

      {/* Two option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Create Code */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateCode}
          className="relative group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-left overflow-hidden transition-all hover:border-emerald-200 hover:shadow-[0_12px_40px_0_rgba(16,185,129,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all">
              <Copy className="w-6 h-6 text-emerald-500 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Create Code</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                Generate a room code and share it with your friend
              </p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              10 questions · 45s each
            </div>
          </div>
          <div className="absolute bottom-6 right-6 w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 transition-all shadow-xs">
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </motion.button>

        {/* Join with Code */}
        <motion.button
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onJoinCode}
          className="relative group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-left overflow-hidden transition-all hover:border-indigo-200 hover:shadow-[0_12px_40px_0_rgba(79,70,229,0.1)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
          <div className="relative z-10 flex flex-col gap-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
              <UserPlus className="w-6 h-6 text-indigo-500 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Join with Code</h3>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                Enter the code your friend created to jump into their battle
              </p>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
              <Users className="w-3 h-3" />
              Enter friend's room code
            </div>
          </div>
          <div className="absolute bottom-6 right-6 w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all shadow-xs">
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </div>
        </motion.button>
      </div>

      {/* Helpful hint */}
      <div className="flex items-start gap-4 px-6 py-5 rounded-2xl bg-slate-50 border border-slate-100">
        <Info className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Create a code, copy it and send it to your friend via WhatsApp, etc.
          Your friend clicks <span className="text-indigo-500">"Join with Code"</span> and enters it to start the battle.
        </p>
      </div>
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
  backendUrl,
  myStudentId,
}: {
  room: BattleRoom;
  mode: ModeConfig;
  topicName?: string;
  onCancel: () => void;
  onBattleStart: (room: BattleRoom) => void;
  backendUrl?: string;
  myStudentId?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const cancelBattle = useCancelBattle();
  const { data: updatedRoom } = useBattleRoom(room.battleId, room.status === "waiting");

  const currentRoom = updatedRoom ?? room;

  const isFriend = mode.mode === "challenge_friend";

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

  // For quick_duel: connect socket and emit battle:join so gateway can pair players
  useEffect(() => {
    if (isFriend || !backendUrl || !myStudentId) return;

    const token = tokenStorage.getAccess();
    const socket = io(`${backendUrl}/battle`, { auth: { token }, transports: ["websocket"] });

    socket.on("connect", () => {
      socket.emit("battle:join", { roomCode: room.roomCode, studentId: myStudentId });
    });

    socket.on("battle:player_joined", (data: { participants: any[] }) => {
      const opp = data.participants.find((p: any) => p.studentId !== myStudentId);
      if (opp) setOpponentName(opp.name ?? "Opponent");
    });

    socket.on("battle:start", (data: any) => {
      socket.disconnect();
      onBattleStart({ ...currentRoom, status: "in_progress" });
    });

    socket.on("battle:error", (data: { message: string }) => {
      toast.error(data.message);
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (currentRoom.status === "in_progress" || (currentRoom.status as string) === "active") {
      onBattleStart(currentRoom);
    }
  }, [currentRoom.status]);

  return (
    <div className="max-w-xl mx-auto py-20 space-y-12">
       <div className="flex flex-col items-center text-center space-y-10">
          {/* Cinematic Radar */}
          <div className="relative w-40 h-40">
            <div className="absolute inset-x-[-10%] inset-y-[-10%] bg-indigo-500/5 rounded-full blur-2xl animate-pulse" />
            {[1, 2].map(i => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full border border-indigo-500/10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ duration: 4, delay: i * 2, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <div className="absolute inset-0 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center group overflow-hidden">
               <mode.icon className={cn("w-12 h-12 relative z-10 transition-transform group-hover:scale-110", mode.iconText)} />
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute -inset-1 border border-dashed border-indigo-500/10 rounded-[3rem]" />
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none uppercase">
                {isFriend ? "Friend" : "Match"} <span className="text-indigo-600">Matchmaking</span>
             </h2>
             <div className="flex items-center justify-center gap-3 px-4 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Wifi className="w-3 h-3 animate-pulse" />
                <span className="text-[8px] font-bold uppercase tracking-widest">{opponentName ? `Opponent found: ${opponentName}` : (currentRoom.status === "waiting" ? "Finding opponent..." : "Opponent found")}</span>
             </div>
             <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                {topicName ? `Topic: ${topicName}` : mode.detail}
             </p>
          </div>
       </div>

       <CardGlass className="p-8 border-slate-100 space-y-8">
          <div className="space-y-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Room Code</p>
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
                   <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest whitespace-nowrap">Click to copy code</p>
                </div>
             </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-6">
             {isFriend && (
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed max-w-xs">
                 Ask your friend to tap <span className="text-blue-600">"Challenge Friend"</span> and enter this code.
               </p>
             )}
             <button
               onClick={handleCancel}
               className="px-8 py-3 rounded-xl border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
             >
               Cancel
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
    <CardGlass className="p-8 border-slate-100 bg-white/40">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
             <Crown className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Top Players</h3>
        </div>
        <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-500 text-white uppercase tracking-widest">LIVE</span>
      </div>

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={entry.studentId} className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100/50 hover:bg-slate-50 transition-all group">
            <span className={cn("text-[10px] font-bold w-5 text-center", i===0 ? "text-indigo-600" : "text-slate-300")}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
               {entry.avatarUrl ? <img src={entry.avatarUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[10px] font-bold">{entry.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold text-slate-700 uppercase truncate">{entry.name}</p>
               <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{entry.eloTier || "Iron"}</p>
            </div>
            <span className="text-[9px] font-bold text-indigo-500 tabular-nums">{entry.score.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {lb?.currentStudentRank && (
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between px-2">
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Your Rank</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-800">#{lb.currentStudentRank.rank}</span>
              <span className="text-[9px] font-bold text-indigo-500 tabular-nums">{lb.currentStudentRank.score.toLocaleString()}</span>
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
    <CardGlass className="p-8 border-slate-100 bg-white/40">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm", TIER_COLORS[tier]?.bg || "bg-slate-50")}>
             <Shield className={cn("w-6 h-6", TIER_COLORS[tier]?.text || "text-slate-300")} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 uppercase tracking-tight">{tier || "Iron"} Tier</p>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none mt-1">{xp.toLocaleString()} BATTLE YIELD</p>
          </div>
        </div>
        <div className={cn("px-4 py-1.5 rounded-full text-[8px] font-bold uppercase tracking-widest", TIER_COLORS[tier]?.bg || "bg-slate-50", TIER_COLORS[tier]?.text || "text-slate-400")}>
          {tierIdx >= 0 && tierIdx < TIERS.length - 1 ? `NEXT: ${TIERS[tierIdx + 1]}` : "Zenith Reach"}
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
        "p-8 border-slate-100 group bg-white/40 overflow-hidden",
        isDailyDisabled ? "opacity-30 grayscale cursor-not-allowed shadow-none" : "hover:border-indigo-100",
        isDailyLive ? "ring-2 ring-indigo-500/10 shadow-indigo-500/5" : ""
      )}
    >
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-slate-100/50 shadow-sm group-hover:scale-105 transition-transform", mode.iconBg, mode.iconText)}>
          <mode.icon className="w-5.5 h-5.5" />
        </div>
        {mode.badge && (
          <div className={cn(
            "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest shadow-sm",
            isDailyLive ? "bg-indigo-600 text-white animate-pulse" : "bg-white border border-slate-100 text-slate-400"
          )}>
            {isDailyLive ? "● LIVE ACTIVE" : mode.badge}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-8 relative z-10">
        <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight">{mode.title}</h3>
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-loose">
          {mode.mode === "daily" && dailyInfo?.topicName
            ? `Zone: ${dailyInfo.topicName}`
            : mode.desc
          }
        </p>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
        <div className="flex items-center gap-3">
          {mode.mode === "daily" && dailyInfo?.playerCount ? (
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              {dailyInfo.playerCount.toLocaleString()} ONLINE
            </span>
          ) : (
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-indigo-400" />
              {mode.questions} NODES
            </span>
          )}
        </div>
        
        <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
           <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </CardGlass>
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
    { key: "topic",   label: "Topic Quiz",   desc: "Questions from one topic", icon: Target },
    { key: "chapter", label: "Chapter Quiz", desc: "Questions from one chapter", icon: Globe },
    { key: "subject", label: "Subject Quiz", desc: "Questions from one subject", icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-6">
        <button onClick={onBack}
          className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <div>
           <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none uppercase">AI <span className="text-indigo-600">Practice</span></h2>
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-2">Choose what you want to practice and start.</p>
        </div>
      </div>

      {/* Test type selector */}
      <div className="grid grid-cols-3 gap-6">
        {TEST_TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => { setTestType(t.key); setSubjectId(""); setChapterId(""); setTopicId(""); setSubjectName(""); setChapterName(""); setTopicName(""); }}
            className={cn(
              "p-6 rounded-3xl border text-left transition-all relative group overflow-hidden",
              testType === t.key
                ? "border-indigo-600 bg-indigo-50/30"
                : "border-slate-100 hover:border-indigo-200 bg-white/40"
            )}
          >
             <t.icon className={cn("w-5 h-5 mb-4 relative z-10", testType === t.key ? "text-indigo-600" : "text-slate-300")} />
             <p className={cn("text-[11px] font-bold uppercase tracking-tight relative z-10", testType === t.key ? "text-slate-800" : "text-slate-400")}>
               {t.label}
             </p>
             <p className="text-[8px] font-bold text-slate-300 mt-1 relative z-10 leading-relaxed uppercase tracking-widest">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <CardGlass className="p-8 border-slate-100 space-y-8 bg-white/40">
            <div className="space-y-3">
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Subject</label>
              <select
                value={subjectId}
                onChange={e => {
                  const id = e.target.value;
                  setSubjectId(id);
                  setSubjectName(subList.find(s => s.id === id)?.name ?? "");
                  setChapterId(""); setChapterName("");
                  setTopicId(""); setTopicName("");
                }}
                className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none shadow-sm"
              >
                <option value="">Select subject…</option>
                {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
               {(testType === "chapter" || testType === "topic") && (
                 <div className="space-y-3">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Chapter</label>
                    <select
                      value={chapterId}
                      onChange={e => {
                        const id = e.target.value;
                        setChapterId(id);
                        setChapterName(chapList.find(c => c.id === id)?.name ?? "");
                        setTopicId(""); setTopicName("");
                      }}
                      disabled={!subjectId}
                      className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-30 transition-all appearance-none shadow-sm"
                    >
                      <option value="">Select chapter…</option>
                      {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
               )}

               {testType === "topic" && (
                 <div className="space-y-3">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-300 ml-1">Topic</label>
                    <select
                      value={topicId}
                      onChange={e => {
                        const id = e.target.value;
                        setTopicId(id);
                        setTopicName(topList.find(t => t.id === id)?.name ?? "");
                      }}
                      disabled={!chapterId}
                      className="h-14 w-full px-5 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 disabled:opacity-30 transition-all appearance-none shadow-sm"
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
           <CardGlass className="p-8 border-slate-100 bg-indigo-50/20">
              <label className="text-[8px] font-bold uppercase tracking-widest text-slate-300 mb-6 block">ITERATIONS</label>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={cn(
                      "h-11 rounded-xl border text-[10px] font-bold transition-all shadow-xs",
                      count === n
                        ? "border-indigo-600 bg-white text-indigo-600"
                        : "border-slate-100 bg-white/50 text-slate-300 hover:border-indigo-200"
                    )}
                  >
                    {n} UNITS
                  </button>
                ))}
              </div>
           </CardGlass>
           <Button
             className="w-full h-16 rounded-[2rem] bg-slate-900 border-none text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
             disabled={!canStart || loading}
             onClick={handleStart}
           >
             {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading questions...</>
              : <><Bolt className="w-4 h-4" /> Start AI Battle</>
             }
           </Button>
        </div>
      </div>
    </div>
  );
}

interface LobbyUser {
  studentId: string;
  socketId: string;
  name: string;
  avatarUrl?: string | null;
  eloRating?: number;
  xpPoints?: number;
  xpTotal?: number;
  tier?: string;
  status?: "online" | "in_battle" | "waiting";
}

interface IncomingChallenge {
  challengeId: string;
  fromStudentId: string;
  expiresInSeconds: number;
}

function ChallengeLobbyScreen({
  users,
  myStudentId,
  onChallenge,
  onChallengeFriend,
  onModeSelect,
  myName,
  xpPoints,
}: {
  users: LobbyUser[];
  myStudentId: string;
  onChallenge: (targetStudentId: string) => void;
  onChallengeFriend: () => void;
  onModeSelect: (mode: ModeConfig) => void;
  myName: string;
  xpPoints?: number;
}) {
  const [liveSearch, setLiveSearch] = useState("");
  const others = users.filter(u => u.studentId !== myStudentId);
  const searchLower = liveSearch.trim().toLowerCase();
  const filteredOthers = searchLower
    ? others.filter(u => (u.name ?? "").toLowerCase().includes(searchLower))
    : others;
  const quickModes = MODES.filter(m => m.mode !== "bot" && m.mode !== "challenge_friend");
  const tierColor = (tier?: string) => {
    const t = (tier ?? "iron").toLowerCase();
    if (t === "champion") return { cls: "bg-amber-500/10 text-amber-700 border-amber-200", label: "Champion" };
    if (t === "diamond") return { cls: "bg-cyan-500/10 text-cyan-700 border-cyan-200", label: "Diamond" };
    if (t === "platinum") return { cls: "bg-indigo-500/10 text-indigo-700 border-indigo-200", label: "Platinum" };
    if (t === "gold") return { cls: "bg-yellow-500/10 text-yellow-700 border-yellow-200", label: "Gold" };
    if (t === "silver") return { cls: "bg-slate-400/10 text-slate-700 border-slate-200", label: "Silver" };
    if (t === "bronze") return { cls: "bg-orange-500/10 text-orange-700 border-orange-200", label: "Bronze" };
    return { cls: "bg-slate-500/10 text-slate-700 border-slate-200", label: "Iron" };
  };
  const statusFor = (status?: LobbyUser["status"]) => {
    if (status === "in_battle") return { label: "In Battle", cls: "text-red-500", dot: "bg-red-500" };
    if (status === "waiting") return { label: "Waiting", cls: "text-amber-500", dot: "bg-amber-500" };
    return { label: "Online", cls: "text-emerald-600", dot: "bg-emerald-500" };
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      <CardGlass className="border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2 text-left text-indigo-700">
            <Swords className="h-4 w-4" />
            <span className="text-sm font-semibold">Battle Arena</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 transition-colors hover:bg-slate-50">
            <Trophy className="h-4 w-4" />
            <span className="text-sm font-semibold">Leaderboard</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 transition-colors hover:bg-slate-50">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-semibold">History</span>
          </button>
        </div>
      </CardGlass>

      <div className="space-y-6">
        <CardGlass className="border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Battle Arena</h2>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {others.length + 1} Students Online
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">XP Points</p>
                <p className="text-lg font-black text-indigo-600 tabular-nums">{xpPoints ?? 0}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-black text-white">
                {myName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </CardGlass>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {quickModes.map(mode => (
            <button
              key={mode.mode}
              onClick={() => onModeSelect(mode)}
              className={cn(
                "group rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5",
                mode.mode === "quick_duel"
                  ? "border-indigo-300 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)]"
                  : "border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] hover:border-indigo-200"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <mode.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{mode.title}</span>
              </div>
              <p className={cn("text-[11px]", mode.mode === "quick_duel" ? "text-indigo-100" : "text-slate-500")}>{mode.detail}</p>
            </button>
          ))}
          <button
            onClick={onChallengeFriend}
            className="group rounded-2xl border border-slate-200 bg-white p-4 text-left text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-0.5 hover:border-emerald-300"
          >
            <div className="mb-2 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Challenge Friend</span>
            </div>
            <p className="text-[11px] text-slate-500">Create or join with code</p>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <CardGlass className="border-slate-200 bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.05)] xl:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Live Players</h3>
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 sm:self-auto">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="tabular-nums">{others.length + 1}</span> Online
              </span>
            </div>
            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                value={liveSearch}
                onChange={e => setLiveSearch(e.target.value)}
                placeholder="Search by name…"
                aria-label="Search live players by name"
                className="h-11 rounded-xl border-slate-200 bg-slate-50/80 pl-9 pr-9 text-sm placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
              {liveSearch.trim() !== "" && (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  onClick={() => setLiveSearch("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchLower !== "" && others.length > 0 && (
              <p className="mb-3 text-[11px] font-medium text-slate-500">
                Showing <span className="font-bold text-slate-700 tabular-nums">{filteredOthers.length}</span> of{" "}
                <span className="tabular-nums">{others.length}</span> players
              </p>
            )}
            <div className="max-h-[380px] space-y-3 overflow-y-auto pr-1">
              {others.length === 0 && (
                <div className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
                  <Users className="h-7 w-7 text-slate-300" />
                  <p className="text-sm text-slate-500">You're the only one online right now</p>
                  <p className="text-[11px] text-slate-400">Other players will appear here when they join the arena</p>
                </div>
              )}
              {others.length > 0 && filteredOthers.length === 0 && (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4">
                  <Search className="h-7 w-7 text-slate-300" />
                  <p className="text-center text-sm text-slate-600">
                    No players match &quot;{liveSearch.trim()}&quot;
                  </p>
                  <button
                    type="button"
                    className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:underline"
                    onClick={() => setLiveSearch("")}
                  >
                    Clear search
                  </button>
                </div>
              )}
              {filteredOthers.map((u) => {
                const tier = tierColor(u.tier);
                const status = statusFor(u.status);
                const playerXp = Number(u.xpPoints ?? u.xpTotal ?? 0);
                return (
                  <div key={u.studentId} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all hover:border-indigo-200 hover:shadow-[0_8px_20px_rgba(79,70,229,0.08)]">
                    <div className="flex min-w-0 items-center gap-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.name} className="h-10 w-10 rounded-xl border border-slate-200 object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-sm font-black text-white">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{u.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${tier.cls}`}>{tier.label}</span>
                          <span className="text-[10px] font-bold text-indigo-600 tabular-nums">XP {playerXp}</span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${status.cls}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="rounded-xl bg-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500" onClick={() => onChallenge(u.studentId)}>
                      Challenge
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardGlass>

        </div>
      </div>
    </div>
  );
}

// ─── Root Component ──────────────────────────────────────────────────────────

type Stage =
  | "lobby"
  | "challenge_pick"
  | "challenge_create"
  | "challenge_sent"
  | "incoming_request"
  | "bot_pick"
  | "join_room"
  | "matchmaking"
  | "in_battle"
  | "result"
  | "error";

const BattleArena = () => {
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useStudentMe();
  const { data: eloData } = useMyBattleElo();
  const createBattle = useCreateBattle();

  const [stage, setStage]             = useState<Stage>("lobby");
  const [activeMode, setActiveMode]   = useState<ModeConfig | null>(null);
  const [battleRoom, setBattleRoom]   = useState<BattleRoom | null>(null);
  const [topicName, setTopicName]     = useState("");
  const [errorMsg, setErrorMsg]       = useState("");
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<LobbyUser[]>([]);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallenge | null>(null);
  const [pendingChallengeId, setPendingChallengeId] = useState<string | null>(null);
  const [botQuestions, setBotQuestions] = useState<QuizQuestion[] | undefined>(undefined);
  const [challengeCountdown, setChallengeCountdown] = useState(10);
  const lobbySocketRef = useRef<Socket | null>(null);

  const student = me?.student;
  const xpPoints = Number(student?.xpPoints ?? eloData?.xpPoints ?? 0);
  const myStudentId  = student?.id ?? "";
  const myName       = me?.fullName ?? "You";
  const myAvatarUrl  = me?.profilePictureUrl ?? null;
  const backendUrl = (() => {
    const raw = import.meta.env.VITE_BACKEND_URL || getApiOrigin() || "http://127.0.0.1:3000";
    try { return new URL(raw).origin; } catch { return raw; }
  })();
  const incomingChallengerName = incomingChallenge
    ? (onlineUsers.find(u => u.studentId === incomingChallenge.fromStudentId)?.name ?? "A student")
    : "A student";

  useEffect(() => {
    if (!myStudentId) return;
    const token = tokenStorage.getAccess();
    const socket = io(`${backendUrl}/battle`, {
      auth: { token },
      transports: ["websocket"],
    });
    lobbySocketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("lobby:join", {
        studentId: myStudentId,
        tenantId: me?.tenantId,
      });
    });

    socket.on("lobby:online_users", (payload: { users: LobbyUser[] }) => {
      setOnlineUsers(Array.isArray(payload?.users) ? payload.users : []);
    });

    socket.on("battle:incoming_request", (payload: IncomingChallenge) => {
      setIncomingChallenge(payload);
      setStage("incoming_request");
    });

    socket.on("battle:challenge_sent", (payload: { challengeId: string }) => {
      setPendingChallengeId(payload.challengeId);
      setStage("challenge_sent");
      toast("Challenge sent.");
    });

    socket.on("battle:challenge_rejected", () => {
      setPendingChallengeId(null);
      setStage("lobby");
      toast.error("Challenge rejected.");
    });

    socket.on("battle:challenge_accepted", (payload: { room: BattleRoom }) => {
      setPendingChallengeId(null);
      setIncomingChallenge(null);
      setActiveMode(MODES.find(m => m.mode === "challenge_friend") ?? MODES[0]);
      setBattleRoom(payload.room);
      setStage("in_battle");
      toast.success("Challenge accepted. Battle starting!");
    });

    socket.on("battle:challenge_timeout", () => {
      setPendingChallengeId(null);
      setActiveMode({
        mode: "bot",
        title: "Bot Practice",
        desc: "Auto fallback",
        detail: "Fallback duel",
        icon: Sparkles,
        iconBg: "bg-indigo-50",
        iconText: "text-indigo-600",
        accent: "hover:border-indigo-100",
        questions: 10,
        seconds: 45,
      });
      setBattleRoom({
        battleId: `bot-${Date.now()}`,
        roomCode: "BOT",
        status: "in_progress",
        mode: "bot",
      });
      setBotQuestions(undefined);
      setStage("in_battle");
      toast("No response in 30s. Starting bot battle.");
    });

    socket.on("battle:challenge_error", (payload: { message?: string }) => {
      const msg = payload?.message ?? "Challenge failed";
      setPendingChallengeId(null);
      setStage("lobby");
      toast.error(msg);
    });

    return () => {
      socket.disconnect();
      lobbySocketRef.current = null;
    };
  }, [backendUrl, me?.tenantId, myStudentId]);

  useEffect(() => {
    if (stage !== "challenge_sent" && stage !== "incoming_request") return;
    setChallengeCountdown(30);
    const iv = setInterval(() => {
      setChallengeCountdown(prev => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [stage, pendingChallengeId, incomingChallenge?.challengeId]);

  const handleModeSelect = (mode: ModeConfig) => {
    setActiveMode(mode);
    if (mode.mode === "bot") {
      setStage("bot_pick");
    } else if (mode.mode === "challenge_friend") {
      setStage("challenge_pick");
    } else {
      startBattle(mode);
    }
  };

  const handleBotStart = (questions: QuizQuestion[], label: string) => {
    if (!activeMode || activeMode.mode !== "bot") return;
    setTopicName(label);
    setBotQuestions(questions);
    setBattleRoom({
      battleId: `bot-${Date.now()}`,
      roomCode: "BOT",
      status: "in_progress",
      mode: "bot",
    });
    setStage("in_battle");
    toast.success("AI battle started.");
  };

  const sendChallenge = (targetStudentId: string) => {
    if (!lobbySocketRef.current || !myStudentId) return;
    lobbySocketRef.current.emit("battle:challenge", {
      targetStudentId,
      fromStudentId: myStudentId,
      tenantId: me?.tenantId,
    });
  };

  const respondToChallenge = (accepted: boolean) => {
    if (!incomingChallenge || !lobbySocketRef.current) return;
    lobbySocketRef.current.emit("battle:challenge_response", {
      challengeId: incomingChallenge.challengeId,
      accepted,
      studentId: myStudentId,
    });
    if (!accepted) {
      setIncomingChallenge(null);
      setStage("lobby");
    }
  };

  const startBattle = (mode: ModeConfig, topId?: string, topName?: string) => {
    setTopicName(topName ?? "");
    createBattle.mutate(
      { mode: mode.mode, topicId: topId, topicName: topName },
      {
        onSuccess: (room) => {
          setBattleRoom(room);
          // challenge_friend: creator waits inside the battle arena (no matchmaking)
          setStage(mode.mode === "challenge_friend" ? "in_battle" : "matchmaking");
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
    // Joiner goes straight into the battle screen.
    // BattleInProgress connects socket + emits battle:join, which triggers
    // battle:start for both players (creator is already in the socket room
    // via MatchmakingScreen's own socket connection).
    setStage("in_battle");
    toast.success("Joined! Battle starting…");
  };

  const handleBattleStart = (room: BattleRoom) => {
    setBattleRoom(room);
    setStage("in_battle");
    toast.success("Battle started! Good luck!");
  };

  const handleBattleResult = (result: BattleResult) => {
    setBattleResult(result);
    setStage("result");

    const isBotBattle = activeMode?.mode === "bot";
    if (!isBotBattle) {
      const gained = Number(result.xpEarned ?? 0);
      if (gained > 0) {
        patchStudentXpDelta(gained);
        queryClient.setQueryData(studentKeys.me, (prev: unknown) => {
          const old = prev as { student?: { xpPoints?: number } } | undefined;
          if (!old?.student) return prev;
          return {
            ...old,
            student: {
              ...old.student,
              xpPoints: (old.student.xpPoints ?? 0) + gained,
            },
          };
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["student"] });
      void queryClient.invalidateQueries({ queryKey: authKeys.me });
    }
  };

  const reset = () => {
    setStage("lobby");
    setActiveMode(null);
    setBattleRoom(null);
    setTopicName("");
    setErrorMsg("");
    setBattleResult(null);
    setIncomingChallenge(null);
    setPendingChallengeId(null);
    setBotQuestions(undefined);
  };

  const playAgain = () => {
    if (!activeMode) { reset(); return; }
    setBattleRoom(null);
    setBattleResult(null);
    if (activeMode.mode === "bot") {
      setBotQuestions(undefined);
      setStage("bot_pick");
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
    <div className="relative flex flex-col space-y-12 pb-32 ">
      <div className="pointer-events-none absolute inset-0 -z-10" />
        <AnimatePresence mode="wait">
          {stage === "lobby" && (
            <motion.div key="lobby" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <ChallengeLobbyScreen
                users={onlineUsers}
                myStudentId={myStudentId}
                onChallenge={sendChallenge}
                onChallengeFriend={() => {
                  setActiveMode(MODES.find(m => m.mode === "challenge_friend") ?? MODES[0]);
                  setStage("challenge_pick");
                }}
                onModeSelect={handleModeSelect}
                myName={myName}
                xpPoints={xpPoints}
              />
            </motion.div>
          )}

          {stage === "challenge_pick" && (
            <motion.div key="challenge-pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ChallengeFriendPickerScreen
                onCreateCode={() => setStage("challenge_create")}
                onJoinCode={() => setStage("join_room")}
                onBack={() => setStage("lobby")}
              />
            </motion.div>
          )}

          {stage === "challenge_create" && (
            <motion.div key="challenge-create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ChallengeScopePicker
                onBack={() => setStage("challenge_pick")}
                onStart={(topicId, label) => {
                  const cfMode = MODES.find(m => m.mode === "challenge_friend")!;
                  setActiveMode(cfMode);
                  startBattle(cfMode, topicId, label);
                }}
                loading={createBattle.isPending}
              />
            </motion.div>
          )}

          {stage === "challenge_sent" && (
            <motion.div key="challenge-sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-slate-900/20 backdrop-blur-sm">
              <CardGlass className="mx-auto w-[92%] max-w-xl space-y-8 border-slate-200 bg-white p-10 text-center text-slate-900 shadow-[0_20px_70px_rgba(15,23,42,0.14)]">
                <div className="relative mx-auto h-24 w-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-300"
                  />
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-indigo-50 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                    <span className="text-2xl font-black text-indigo-600 tabular-nums">{challengeCountdown}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Waiting for opponent...</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Challenge sent</p>
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" className="rounded-xl border-slate-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50" onClick={() => setStage("lobby")}>
                    Cancel
                  </Button>
                </div>
              </CardGlass>
            </motion.div>
          )}

          {stage === "incoming_request" && incomingChallenge && (
            <motion.div key="incoming-request" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 grid place-items-center bg-slate-900/20 backdrop-blur-sm">
              <CardGlass className="mx-auto w-[92%] max-w-xl space-y-8 border-slate-200 bg-white p-10 text-center text-slate-900 shadow-[0_20px_70px_rgba(15,23,42,0.14)]">
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-600">
                    🔥 Incoming Request
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{incomingChallengerName} challenged you!</h3>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                    Mode: Quick Duel
                  </p>
                </div> */}
                <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-xl font-black text-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.18)]">
                  {challengeCountdown}
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Button className="rounded-xl bg-emerald-600 px-6 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500" onClick={() => respondToChallenge(true)}>
                    Accept
                  </Button>
                  <Button variant="outline" className="rounded-xl border-slate-200 bg-white px-6 text-[10px] font-bold uppercase tracking-widest text-slate-700 hover:bg-slate-50" onClick={() => respondToChallenge(false)}>
                    Reject
                  </Button>
                </div>
              </CardGlass>
            </motion.div>
          )}

          {stage === "bot_pick" && activeMode?.mode === "bot" && (
            <motion.div key="bot-pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <BotPickerScreen
                onBack={() => setStage("lobby")}
                onStart={handleBotStart}
              />
            </motion.div>
          )}

          {stage === "join_room" && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <JoinRoomScreen onBack={() => setStage("challenge_pick")} onJoined={handleJoined} />
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
                backendUrl={backendUrl}
                myStudentId={myStudentId}
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
                myAvatarUrl={myAvatarUrl}
                onEnd={reset}
                onResult={handleBattleResult}
                prefetchedQuestions={botQuestions}
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
              <div className="w-16 h-16 mb-8 rounded-3xl bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shadow-sm">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight mb-2">Something went wrong</h2>
              <p className="text-[9px] font-bold text-slate-300 max-w-sm mb-10 uppercase tracking-widest leading-relaxed">{errorMsg || "We could not start the battle. Please try again."}</p>
              <button onClick={reset} className="px-10 py-4 rounded-2xl bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-lg">
                <ArrowLeft className="w-4 h-4" /> Back to Lobby
              </button>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default BattleArena;
