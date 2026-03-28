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
  Swords, Zap, Users, Globe, UserPlus, Bot,
  Trophy, Clock, ArrowLeft, Copy, Check,
  Loader2, Wifi, X, Crown, Target,
  ChevronRight, Sparkles, Shield, AlertCircle,
  CheckCircle2, XCircle, TrendingUp, TrendingDown,
  Star, Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStudentMe, useDailyBattle, useCreateBattle,
  useCancelBattle, useBattleRoom, useJoinBattle,
  useBattleLeaderboard, useSubjects, useChapters, useTopics,
  useMyBattleElo,
} from "@/hooks/use-student";
import { BattleMode, BattleRoom } from "@/lib/api/student";
import { tokenStorage } from "@/lib/api/client";
import { toast } from "sonner";
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
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    accent: "hover:border-primary/40",
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
  {
    mode: "bot",
    title: "Practice vs Bot",
    desc: "Train against AI · no risk",
    detail: "10 questions · adaptive AI",
    icon: Bot,
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    accent: "hover:border-amber-500/40",
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
}: {
  room: BattleRoom;
  mode: ModeConfig;
  myStudentId: string;
  myName: string;
  onEnd: () => void;
  onResult: (result: BattleResult) => void;
}) {
  const isBot = mode.mode === "bot";
  const totalRounds = mode.questions;
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
      // Process round result for bot mode
      processRoundResult({
        roundNumber: rn,
        roundWinnerId: null, // will be determined below
        correctOptionId: q.correctId!,
        scores: {},
        botOptionId,
        botCorrect,
      });
    }, delay);
  }, []);

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
        ? selected === data.correctOptionId
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
        setRevealed(false);
        setRoundWinnerId(null);
        setCorrectOptionId(null);
        setWaiting(false);
        answerSentRef.current = false;

        if (isBot) {
          const nextQ = questions[nextRound - 1];
          if (nextQ) {
            setCurrentQuestion(nextQ);
            startTimer();
            triggerBotAnswer(nextQ, nextRound);
          }
        }
        // For socket mode, next question comes from server event
      }, 2500);
    }
  }, [isBot, myStudentId, selected, questions, totalRounds, startTimer, triggerBotAnswer]);

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
    if (optionId) setSelected(optionId);

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
      // Bot mode: load local questions
      const qs: QuizQuestion[] = BOT_QUESTIONS.slice(0, totalRounds).map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctId: q.correctId,
      }));
      setQuestions(qs);
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4"
    >
      {/* Header: scores + round */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          {/* My score */}
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground mb-0.5 truncate">{myName}</p>
            <p className="text-3xl font-bold text-primary tabular-nums">{myScore}</p>
          </div>

          {/* Round info */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-secondary text-xs font-bold text-muted-foreground">
              <Swords className="w-3.5 h-3.5" />
              {roundNumber}/{totalRounds}
            </div>
            {!connected && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> connecting
              </span>
            )}
          </div>

          {/* Opponent score */}
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground mb-0.5 truncate">
              {isBot ? "Battle Bot" : opponentName}
            </p>
            <p className="text-3xl font-bold text-rose-400 tabular-nums">{oppScore}</p>
          </div>
        </div>

        {/* Timer bar */}
        <div className="mt-3 flex items-center gap-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors duration-300 ${timerColor}`}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className={`text-sm font-bold tabular-nums w-6 text-right ${
            timeLeft <= 5 ? "text-red-400" : "text-foreground"
          }`}>{timeLeft}</span>
        </div>
      </div>

      {/* Question */}
      {currentQuestion ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-2xl p-5 space-y-4"
          >
            <p className="text-base font-semibold text-foreground leading-snug">
              {currentQuestion.text}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentQuestion.options.map(opt => {
                const isSelected = selected === opt.id;
                const isCorrect  = revealed && opt.id === correctOptionId;
                const isWrong    = revealed && isSelected && opt.id !== correctOptionId;

                return (
                  <motion.button
                    key={opt.id}
                    whileHover={!revealed && !answerSentRef.current ? { scale: 1.02 } : {}}
                    whileTap={!revealed && !answerSentRef.current ? { scale: 0.98 } : {}}
                    onClick={() => !revealed && !answerSentRef.current && handleAnswer(opt.id)}
                    disabled={revealed || answerSentRef.current}
                    className={`relative w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all
                      ${isCorrect  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300" :
                        isWrong    ? "border-red-500 bg-red-500/15 text-red-300" :
                        isSelected ? "border-primary bg-primary/15 text-primary" :
                                     "border-border bg-secondary hover:border-primary/40 text-foreground"}
                      ${(revealed || answerSentRef.current) ? "cursor-default" : "cursor-pointer"}
                    `}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center text-[11px] font-bold shrink-0">
                        {opt.id.toUpperCase()}
                      </span>
                      <span>{opt.text}</span>
                    </span>
                    {isCorrect && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />}
                    {isWrong   && <XCircle      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Round result overlay */}
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold
                  ${roundWinnerId === myStudentId
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    : roundWinnerId === null
                    ? "bg-secondary text-muted-foreground border border-border"
                    : "bg-rose-500/10 text-rose-300 border border-rose-500/20"}
                `}
              >
                {roundWinnerId === myStudentId ? (
                  <><Star className="w-4 h-4" /> You won this round!</>
                ) : roundWinnerId === null ? (
                  <>No correct answer — round draw</>
                ) : (
                  <><Swords className="w-4 h-4" /> {isBot ? "Bot" : opponentName} won this round</>
                )}
              </motion.div>
            )}

            {/* Waiting indicator */}
            {waiting && !revealed && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Waiting for {isBot ? "bot" : "opponent"}…
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {connected ? "Waiting for opponent to join…" : "Connecting…"}
          </p>
        </div>
      )}

      {/* Abandon button */}
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={onEnd}
          className="text-muted-foreground hover:text-destructive gap-1.5 text-xs">
          <X className="w-3.5 h-3.5" /> Abandon Battle
        </Button>
      </div>
    </motion.div>
  );
}

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

  const tc = TIER_COLORS[
    (() => {
      if (newElo < 1100) return "iron";
      if (newElo < 1300) return "bronze";
      if (newElo < 1500) return "silver";
      if (newElo < 1700) return "gold";
      if (newElo < 1900) return "platinum";
      if (newElo < 2100) return "diamond";
      return "champion";
    })()
  ] ?? TIER_COLORS.iron;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto flex flex-col items-center text-center gap-6"
    >
      {/* Trophy / shield icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className={`w-24 h-24 rounded-3xl flex items-center justify-center border-2 ${
          isWinner
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-secondary border-border"
        }`}
      >
        {isWinner
          ? <Trophy className="w-12 h-12 text-amber-400" />
          : <Shield className="w-12 h-12 text-muted-foreground" />
        }
      </motion.div>

      {/* Outcome text */}
      <div>
        <h2 className={`text-2xl font-bold mb-1 ${isWinner ? "text-amber-400" : "text-foreground"}`}>
          {isWinner ? "Victory!" : "Defeat"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isWinner
            ? "Well played! You dominated the arena."
            : "Good effort. Keep training to climb the ranks."}
        </p>
      </div>

      {/* Score card */}
      <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground truncate">{myName} (You)</span>
          <span className="text-2xl font-bold text-primary tabular-nums">{myRoundsWon}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground truncate">{opponentName}</span>
          <span className="text-2xl font-bold text-rose-400 tabular-nums">{opponentRoundsWon}</span>
        </div>
      </div>

      {/* ELO + XP */}
      <div className="w-full grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-1">
          {eloChange >= 0
            ? <TrendingUp className="w-5 h-5 text-emerald-400" />
            : <TrendingDown className="w-5 h-5 text-red-400" />
          }
          <p className={`text-xl font-bold tabular-nums ${eloChange >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {eloChange >= 0 ? "+" : ""}{eloChange}
          </p>
          <p className="text-[11px] text-muted-foreground">ELO Change</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-1">
          <Flame className="w-5 h-5 text-amber-400" />
          <p className="text-xl font-bold text-amber-400 tabular-nums">+{xpEarned}</p>
          <p className="text-[11px] text-muted-foreground">XP Earned</p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <Button className="w-full gap-2" onClick={onPlayAgain}>
          <Swords className="w-4 h-4" /> Play Again
        </Button>
        <Button variant="outline" className="w-full gap-2" onClick={onHome}>
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </Button>
      </div>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-bold text-foreground text-lg">Choose Topic</h2>
          <p className="text-xs text-muted-foreground">Select the topic you want to battle on</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Subject */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
          {subLoading ? (
            <div className="h-10 rounded-xl bg-secondary animate-pulse" />
          ) : (
            <select
              value={subjectId}
              onChange={e => { setSubjectId(e.target.value); setChapterId(""); setTopicId(""); }}
              className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary"
            >
              <option value="">Select subject…</option>
              {subList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Chapter */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chapter</label>
          {chapLoading && subjectId ? (
            <div className="h-10 rounded-xl bg-secondary animate-pulse" />
          ) : (
            <select
              value={chapterId}
              onChange={e => { setChapterId(e.target.value); setTopicId(""); }}
              disabled={!subjectId}
              className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary disabled:opacity-40"
            >
              <option value="">Select chapter…</option>
              {chapList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Topic */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Topic</label>
          {topLoading && chapterId ? (
            <div className="h-10 rounded-xl bg-secondary animate-pulse" />
          ) : (
            <select
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              disabled={!chapterId}
              className="h-10 w-full px-3 bg-secondary border border-border rounded-xl text-sm outline-none focus:border-primary disabled:opacity-40"
            >
              <option value="">Select topic…</option>
              {topList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {topicId && selectedTopic && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">{selectedTopic.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTopic.estimatedStudyMinutes ? `~${selectedTopic.estimatedStudyMinutes} min · ` : ""}
                10 questions · 45s each
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <Button
        className="w-full gap-2"
        disabled={!topicId || loading}
        onClick={() => topicId && selectedTopic && onSelect(topicId, selectedTopic.name)}
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Finding Opponent…</>
          : <><Swords className="w-4 h-4" /> Start Battle</>
        }
      </Button>
    </motion.div>
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-bold text-foreground text-lg">Join a Battle</h2>
          <p className="text-xs text-muted-foreground">Enter your friend's room code</p>
        </div>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Room Code</label>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            maxLength={8}
            placeholder="e.g. AB12CD"
            className="h-14 w-full text-center text-2xl font-bold tracking-widest px-4 bg-secondary border border-border rounded-2xl outline-none focus:border-primary uppercase"
          />
        </div>
        <Button
          className="w-full h-12 text-base gap-2"
          disabled={code.trim().length < 4 || joinBattle.isPending}
          onClick={handleJoin}
        >
          {joinBattle.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
            : <><Swords className="w-4 h-4" /> Join Battle</>
          }
        </Button>
      </div>
    </motion.div>
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
    if (currentRoom.status === "in_progress") {
      onBattleStart(currentRoom);
    }
  }, [currentRoom.status]);

  const isFriend = mode.mode === "challenge_friend";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
    >
      {/* Animated radar */}
      <div className="relative w-32 h-32 mb-8">
        {[1, 2, 3].map(i => (
          <motion.div key={i}
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            initial={{ scale: 0.4, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 2, delay: i * 0.6, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
        <div className="absolute inset-0 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
          <mode.icon className={`w-10 h-10 ${mode.iconText}`} />
        </div>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        {isFriend ? "Waiting for Friend" : "Finding Opponent…"}
      </h2>
      <p className="text-sm text-muted-foreground mb-2">
        {topicName ? `Topic: ${topicName}` : mode.detail}
      </p>
      {currentRoom.status === "waiting" && (
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-8">
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          <span>Searching for a match…</span>
        </div>
      )}

      <div className="w-full max-w-xs mb-8">
        <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">
          {isFriend ? "Share this room code" : "Your room code"}
        </p>
        <button
          onClick={copyCode}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-secondary border border-border hover:border-primary/40 transition-all group"
        >
          <span className="text-2xl font-bold tracking-widest text-foreground font-mono">
            {currentRoom.roomCode}
          </span>
          {copied
            ? <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            : <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
          }
        </button>
        {isFriend && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Ask your friend to click "Challenge Friend" → Join with this code
          </p>
        )}
      </div>

      <div className="flex items-center gap-6 mb-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{mode.questions} questions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4" />
          <span>{mode.seconds}s each</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="gap-2 text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
        disabled={cancelBattle.isPending}
        onClick={handleCancel}
      >
        {cancelBattle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        Cancel
      </Button>
    </motion.div>
  );
}

// ─── Battle XP Leaderboard Widget ─────────────────────────────────────────────

function BattleLeaderboard() {
  const { data: lb, isLoading } = useBattleLeaderboard();
  const entries = lb?.data?.slice(0, 5) ?? [];

  const rankColors = ["text-yellow-400", "text-slate-400", "text-amber-600"];

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-foreground text-sm">Battle Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-secondary animate-pulse" />
              <div className="flex-1 h-4 rounded bg-secondary animate-pulse" />
              <div className="w-12 h-4 rounded bg-secondary animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!entries.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-foreground text-sm">Battle Leaderboard</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 uppercase tracking-wider">Live</span>
      </div>
      <div className="space-y-2.5">
        {entries.map((entry, i) => (
          <div key={entry.studentId} className="flex items-center gap-3">
            <span className={`text-sm font-bold w-5 text-center shrink-0 ${rankColors[i] ?? "text-muted-foreground"}`}>
              {i + 1}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center shrink-0">
              {entry.avatarUrl
                ? <img src={entry.avatarUrl} className="w-full h-full rounded-full object-cover" alt="" />
                : <span className="text-xs font-bold text-primary">{entry.name.charAt(0)}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{entry.name}</p>
              {entry.eloTier && (
                <p className="text-[10px] text-muted-foreground capitalize">{entry.eloTier}</p>
              )}
            </div>
            <span className="text-xs font-bold text-primary tabular-nums">{entry.score.toLocaleString()} XP</span>
          </div>
        ))}
      </div>
      {lb?.currentStudentRank && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Your rank</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-foreground">#{lb.currentStudentRank.rank}</span>
              <span className="text-xs font-semibold text-primary">{lb.currentStudentRank.score.toLocaleString()} XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tier Progress Widget ─────────────────────────────────────────────────────

function TierProgress({ tier, xp }: { tier: string; xp: number }) {
  const tc = TIER_COLORS[tier] ?? TIER_COLORS.iron;
  const tierIdx = TIERS.findIndex(t => t.toLowerCase() === tier);
  const progressPct = tierIdx >= 0 ? ((tierIdx + 1) / TIERS.length) * 100 : 14;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className={`w-5 h-5 ${tc.text}`} />
          <div>
            <p className="text-sm font-bold text-foreground capitalize">{tier || "Iron"} Tier</p>
            <p className="text-xs text-muted-foreground">{xp.toLocaleString()} Battle XP</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-xl text-xs font-bold ${tc.bg} ${tc.text}`}>
          {tierIdx >= 0 && tierIdx < TIERS.length - 1 ? `Next: ${TIERS[tierIdx + 1]}` : "Max Tier"}
        </div>
      </div>

      <div className="relative mb-2">
        <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-border rounded-full" />
        <motion.div
          className={`absolute top-1.5 left-0 h-0.5 rounded-full bg-gradient-to-r ${tc.grad}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div className="relative flex justify-between">
          {TIERS.map((t, i) => {
            const done = i < (tierIdx >= 0 ? tierIdx + 1 : 0);
            const current = i === tierIdx;
            return (
              <div key={t} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full border-2 transition-all ${
                  current  ? `border-primary bg-primary ring-2 ring-primary/25 ring-offset-1 ring-offset-card` :
                  done     ? `border-primary bg-primary` :
                             `border-border bg-card`
                }`} />
                <span className={`text-[9px] font-semibold hidden sm:block ${current ? tc.text : "text-muted-foreground"}`}>
                  {t}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Mode Card ────────────────────────────────────────────────────────────────

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
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={isDailyDisabled ? undefined : onSelect}
      className={`relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 transition-all cursor-pointer group
        ${isDailyDisabled ? "opacity-50 cursor-not-allowed" : `hover:shadow-lg ${mode.accent}`}
        ${isDailyLive ? "border-violet-500/40 shadow-lg shadow-violet-500/10" : ""}
      `}
    >
      {mode.badge && (
        <div className={`absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
          mode.mode === "daily" ? "bg-violet-500/15 text-violet-400" : "bg-amber-500/15 text-amber-400"
        }`}>
          {isDailyLive ? "● LIVE" : mode.badge}
        </div>
      )}

      <div className={`w-12 h-12 rounded-xl ${mode.iconBg} flex items-center justify-center`}>
        <mode.icon className={`w-6 h-6 ${mode.iconText}`} />
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-foreground text-sm mb-1">{mode.title}</h3>
        <p className="text-xs text-muted-foreground">
          {mode.mode === "daily" && dailyInfo?.topicName
            ? `Topic: ${dailyInfo.topicName}`
            : mode.desc
          }
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">{mode.detail}</p>
      </div>

      <div className="flex items-center justify-between">
        {mode.mode === "daily" && dailyInfo?.playerCount ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {dailyInfo.playerCount.toLocaleString()} online
          </span>
        ) : mode.mode === "bot" ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Always available
          </span>
        ) : isDailyDisabled ? (
          <span className="text-xs text-muted-foreground">No battle today</span>
        ) : (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="w-3 h-3" /> {mode.questions} questions
          </span>
        )}
        <div className={`flex items-center gap-1 text-xs font-bold ${mode.iconText} opacity-0 group-hover:opacity-100 transition-opacity`}>
          Play <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500/20 to-violet-500/20 border border-red-500/20 flex items-center justify-center">
            <Swords className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Battle Arena</h1>
            <p className="text-xs text-muted-foreground">
              {eloRating ? `ELO: ${eloRating} · ` : ""}Challenge students, climb the ranks
            </p>
          </div>
        </div>
        <button
          onClick={onJoinFriend}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-sm font-semibold text-emerald-400"
        >
          <UserPlus className="w-4 h-4" />
          Join with Code
        </button>
      </div>

      {/* Tier progress */}
      <TierProgress tier={tier} xp={xp} />

      {/* Daily battle highlight */}
      {dailyBattle && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onModeSelect(MODES.find(m => m.mode === "daily")!)}
          className="w-full bg-gradient-to-r from-violet-500/15 via-blue-500/10 to-violet-500/15 border border-violet-500/25 rounded-2xl p-5 text-left hover:border-violet-500/50 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-foreground text-sm">Daily Battle</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                    {(dailyBattle as any).status === "active" ? "● LIVE NOW" : "TODAY"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(dailyBattle as any).topicName
                    ? `Topic: ${(dailyBattle as any).topicName}`
                    : "Open topic · everyone battles at once"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
        </motion.button>
      )}

      {/* Mode grid + leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODES.filter(m => m.mode !== "daily").map(mode => (
            <ModeCard
              key={mode.mode}
              mode={mode}
              dailyInfo={null}
              onSelect={() => onModeSelect(mode)}
            />
          ))}
        </div>
        <div>
          <BattleLeaderboard />
        </div>
      </div>
    </motion.div>
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
    } else if (mode.mode === "bot") {
      // Bot mode: skip backend matchmaking, go directly to battle with fake room
      setBattleRoom({ battleId: "bot", roomCode: "BOT", status: "in_progress", mode: "bot" });
      setStage("in_battle");
    } else if (mode.mode === "challenge_friend") {
      startBattle(mode);
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
    setStage("matchmaking");
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
    if (activeMode.mode === "bot") {
      setBattleRoom({ battleId: "bot", roomCode: "BOT", status: "in_progress", mode: "bot" });
      setStage("in_battle");
    } else if (activeMode.mode === "topic_battle") {
      setStage("topic_pick");
    } else {
      startBattle(activeMode);
    }
  };

  if (meLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {stage === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          <motion.div key="topic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TopicPicker
              onBack={() => setStage("home")}
              onSelect={handleTopicSelect}
              loading={createBattle.isPending}
            />
          </motion.div>
        )}

        {stage === "join_room" && (
          <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <JoinRoomScreen onBack={() => setStage("home")} onJoined={handleJoined} />
          </motion.div>
        )}

        {stage === "matchmaking" && battleRoom && activeMode && (
          <motion.div key="matchmaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
            />
          </motion.div>
        )}

        {stage === "result" && battleResult && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
          >
            <div className="w-16 h-16 mb-5 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Could Not Start Battle</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">{errorMsg || "Something went wrong. Please try again."}</p>
            <Button onClick={reset} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Arena
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BattleArena;
