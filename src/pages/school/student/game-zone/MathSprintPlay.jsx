import React, { useEffect, useState, useRef } from 'react';
import { Clock, Zap, Flame, LogOut, ShieldCheck, Check, X } from 'lucide-react';

export default function MathSprintPlay({ session, onFinish, onQuit }) {
  const { sessionId, questions } = session;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // Game states
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  // Start 60s countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handle expiration of the 60s timer
  const handleTimeUp = () => {
    // Submit whatever answers are completed so far
    handleSubmit(answers);
  };

  const handleSelectOption = (optionId) => {
    if (hasAnswered || timeLeft <= 0) return;
    setHasAnswered(true);
    setSelectedOptionId(optionId);

    const optionSelected = currentQuestion.options.find((o) => o.id === optionId);
    const isCorrect = optionSelected?.isCorrect;

    let multiplier = 1;
    let points = 0;
    let nextStreak = 0;

    if (isCorrect) {
      nextStreak = streak + 1;
      setStreak(nextStreak);
      setMaxStreak((prev) => Math.max(prev, nextStreak));

      // Combo Multiplier
      if (nextStreak >= 5) {
        multiplier = 3;
      } else if (nextStreak >= 3) {
        multiplier = 2;
      }

      points = 10 * multiplier;
      setScore((prev) => prev + points);
    } else {
      setStreak(0);
    }

    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      },
    ];
    setAnswers(newAnswers);

    // Auto-advance to the next question after 600ms for fast-paced action!
    timeoutRef.current = setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
        setSelectedOptionId(null);
        setHasAnswered(false);
      } else {
        // Exceeded 50 questions - auto submit
        handleSubmit(newAnswers);
      }
    }, 600);
  };

  const handleSubmit = (finalAnswers) => {
    clearInterval(timerRef.current);
    onFinish(finalAnswers);
  };

  // Determine combo modes
  const isSupercharged = streak >= 5;
  const isFever = streak >= 3 && streak < 5;

  // Mode styling configurations
  let containerBorder = 'border-slate-800 bg-slate-950';
  let auraGlow = '';
  let badgeLabel = 'Standard Arena';
  let badgeColor = 'text-slate-400 bg-slate-800/50';

  if (isSupercharged) {
    containerBorder = 'border-yellow-400 bg-gradient-to-b from-yellow-950/60 via-slate-950 to-slate-950';
    auraGlow = 'shadow-2xl shadow-yellow-500/10 ring-4 ring-yellow-400/20';
    badgeLabel = 'SUPERCHARGE MODE (3x SCORE)';
    badgeColor = 'text-yellow-400 bg-yellow-400/15 border border-yellow-400/30 animate-pulse';
  } else if (isFever) {
    containerBorder = 'border-orange-500 bg-gradient-to-b from-orange-950/40 via-slate-950 to-slate-950';
    auraGlow = 'shadow-2xl shadow-orange-500/10 ring-4 ring-orange-500/10';
    badgeLabel = 'FEVER MODE (2x SCORE)';
    badgeColor = 'text-orange-400 bg-orange-400/15 border border-orange-400/30';
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-6">
      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onQuit}
            className="rounded-lg p-2 bg-slate-800 text-slate-400 hover:text-white transition"
            title="Quit game"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Arithmetic Blitz</p>
            <p className="text-sm font-black">Sum #{currentIdx + 1}</p>
          </div>
        </div>

        {/* HUD Statistics */}
        <div className="flex items-center gap-4 text-xs font-black">
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700">
            <Zap className={`h-4 w-4 fill-current ${isSupercharged ? 'text-yellow-400 animate-bounce' : isFever ? 'text-orange-500' : 'text-slate-400'}`} />
            <span>Streak: {streak}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700 text-rose-400">
            <Flame className="h-4 w-4 fill-current animate-pulse" />
            <span>XP: {score}</span>
          </div>
        </div>
      </div>

      {/* Main Gameplay Screen Card */}
      <div className={`relative rounded-3xl border p-8 shadow-sm transition-all duration-300 min-h-[300px] flex flex-col justify-between overflow-hidden ${containerBorder} ${auraGlow}`}>
        {/* Ticking circular timer HUD */}
        <div className="absolute top-4 right-4 flex items-center justify-center h-14 w-14 rounded-full border-4 border-slate-800 bg-slate-900 font-black text-lg text-white">
          <Clock className={`h-3.5 w-3.5 absolute -top-1 -left-1 text-rose-500 ${timeLeft <= 10 && 'animate-spin-slow text-red-500 font-black'}`} />
          <span className={timeLeft <= 10 ? 'text-red-500 scale-110 animate-pulse' : ''}>{timeLeft}</span>
        </div>

        {/* Question Equation Body */}
        <div className="space-y-4 pr-12 flex-1 flex flex-col justify-center">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${badgeColor} self-start`}>
            {badgeLabel}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-relaxed tracking-tight text-center py-6 font-mono select-none">
            {currentQuestion.content} = ?
          </h2>
        </div>

        {/* Explanation / Streak indicator */}
        {hasAnswered && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black animate-fade-in">
            {currentQuestion.options.find((o) => o.id === selectedOptionId)?.isCorrect ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <Check className="h-5 w-5 stroke-[3]" /> Correct! {streak >= 5 ? '⚡ SUPERCHARGE 3X!' : streak >= 3 ? '🔥 FEVER 2X!' : '+10 XP'}
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5">
                <X className="h-5 w-5 stroke-[3]" /> Streak reset!
              </span>
            )}
          </div>
        )}
      </div>

      {/* Options Selection Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.isCorrect;
          
          let cardStyle = 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-300';
          let badgeLabel = String.fromCharCode(65 + idx);
          let badgeStyle = 'bg-slate-800 text-slate-400';

          if (hasAnswered) {
            if (isCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-200 ring-2 ring-emerald-500/10';
              badgeStyle = 'bg-emerald-500 text-white';
            } else if (isSelected) {
              cardStyle = 'border-rose-500 bg-rose-950/20 text-rose-200 ring-2 ring-rose-500/10';
              badgeStyle = 'bg-rose-500 text-white';
            } else {
              cardStyle = 'border-slate-950 bg-slate-950/10 text-slate-600 opacity-30 cursor-not-allowed';
              badgeStyle = 'bg-slate-950 text-slate-800';
            }
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(option.id)}
              className={`flex items-center gap-4 rounded-2xl border p-5 text-left text-base font-black transition-all active:scale-[0.98] ${cardStyle}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${badgeStyle}`}>
                {badgeLabel}
              </span>
              <span className="leading-snug text-lg font-mono">{option.content}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
