import React, { useEffect, useState, useRef } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { soundEngine } from '@/lib/audioManager';
import { Zap, Star, Check, X, ArrowRight, LogOut, Loader2, Heart, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import './quiz-rush/arena.css';
import {
  ArenaBackdrop,
  ArenaButton,
  ArenaFlash,
  ArenaLabel,
  ArenaPanel,
  ArenaStat,
  ArenaTimer,
} from './quiz-rush/ArenaKit';

// Four fixed identities — colour, glyph and number key. Keeping shape and key
// alongside the colour means the answer is still distinguishable to a
// colour-blind student, and gives muscle memory something to attach to.
const OPTION_STYLES = [
  { key: '1', shape: '▲', accent: '#fb7185', face: 'from-rose-500 to-rose-700',        edge: '#9f1239', glow: 'rgba(251,113,133,0.45)' },
  { key: '2', shape: '◆', accent: '#38bdf8', face: 'from-sky-500 to-sky-700',          edge: '#075985', glow: 'rgba(56,189,248,0.45)' },
  { key: '3', shape: '●', accent: '#fbbf24', face: 'from-amber-500 to-amber-600',      edge: '#92400e', glow: 'rgba(251,191,36,0.45)' },
  { key: '4', shape: '■', accent: '#a3e635', face: 'from-lime-500 to-lime-600',        edge: '#3f6212', glow: 'rgba(163,230,53,0.45)' },
];

export default function QuizRushPlay({ session, onFinish, onQuit }) {
  const { sessionId } = session;
  const [localQuestions, setLocalQuestions] = useState(session.questions || []);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);
  const [lives, setLives] = useState(3);

  // Presentation-only feedback: a colour wash on every answer, a shake on a
  // miss, and a combo callout on a milestone. None of it feeds the API.
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(null);

  const livesRef = useRef(3);
  livesRef.current = lives;

  const answersRef = useRef([]);
  answersRef.current = answers;
  const tabSwitchesCountRef = useRef(0);
  tabSwitchesCountRef.current = tabSwitchesCount;

  const timerRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const hasAnsweredRef = useRef(false);

  const updateHasAnswered = (val) => {
    setHasAnswered(val);
    hasAnsweredRef.current = val;
  };

  // Anti-Cheat: Tab Switching detection & copy/select blocking
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const next = tabSwitchesCountRef.current + 1;
        tabSwitchesCountRef.current = next;
        setTabSwitchesCount(next);

        if (next >= 3) {
          toast.error('Game terminated due to multiple tab switches (cheat protection). 15 coins deducted.', {
            duration: 5000,
          });
          clearInterval(timerRef.current);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          try {
            const totalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
            const res = await api.post('/school/gamification/quiz-rush/submit', {
              sessionId,
              answers: answersRef.current,
              tabSwitchesCount: next,
              timeTakenSeconds: totalDuration,
            });
            const results = res.data?.data ?? res.data;
            onFinish(results);
          } catch (err) {
            console.error('Failed to submit quiz results:', err);
            onQuit();
          }
        } else {
          toast.warning(`Tab switch detected! Warning ${next}/3. The game will automatically terminate and deduct coins on the 3rd switch.`, {
            duration: 5000,
          });
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const currentQuestion = localQuestions[currentIdx];

  // Start background music when playing Quiz Rush
  useEffect(() => {
    soundEngine.startBackgroundMusic();
    return () => {
      soundEngine.stopBackgroundMusic();
    };
  }, []);

  // Start timer for the current question
  useEffect(() => {
    setTimeLeft(30);
    updateHasAnswered(false);
    setSelectedOptionId(null);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 10 && prev > 1 && !hasAnsweredRef.current) {
          soundEngine.playCountdownTick();
        }
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIdx]);

  const handleNext = async (currentAnswers) => {
    const finalAnswers = Array.isArray(currentAnswers) ? currentAnswers : answers;
    const lastAns = finalAnswers[finalAnswers.length - 1];
    const isCorrect = lastAns && lastAns.selectedOptionId !== '' &&
      localQuestions[currentIdx]?.options.find(o => o.id === lastAns.selectedOptionId)?.isCorrect;

    if (isCorrect) {
      setSubmitting(true);
      try {
        const res = await api.get('/school/gamification/quiz-rush/next-question', {
          params: { sessionId, currentIdx }
        });
        const data = res.data?.data ?? res.data;
        setLocalQuestions((prev) => [...prev, data.question]);
        setCurrentIdx((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to load next question:', err);
        toast.error('Failed to generate next question.');
      } finally {
        setSubmitting(false);
      }
    } else {
      const nextLives = livesRef.current - 1;
      setLives(nextLives);
      if (nextLives > 0) {
        setSubmitting(true);
        try {
          const res = await api.get('/school/gamification/quiz-rush/next-question', {
            params: { sessionId, currentIdx }
          });
          const data = res.data?.data ?? res.data;
          setLocalQuestions((prev) => [...prev, data.question]);
          setCurrentIdx((prev) => prev + 1);
        } catch (err) {
          console.error('Failed to load next question:', err);
          toast.error('Failed to generate next question.');
        } finally {
          setSubmitting(false);
        }
      } else {
        setSubmitting(true);
        try {
          const totalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
          const res = await api.post('/school/gamification/quiz-rush/submit', {
            sessionId,
            answers: finalAnswers,
            tabSwitchesCount,
            timeTakenSeconds: totalDuration,
          });
          const results = res.data?.data ?? res.data;
          onFinish(results);
        } catch (err) {
          console.error('Failed to submit quiz results:', err);
          toast.error('Failed to submit game results.');
        } finally {
          setSubmitting(false);
        }
      }
    }
  };

  const handleTimeOut = () => {
    if (hasAnsweredRef.current) return;
    updateHasAnswered(true);
    setSelectedOptionId(''); // Empty represents timeout

    setFlash('bad');
    setShake(true);

    const timeTaken = 30;
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: '',
        timeTakenSeconds: timeTaken,
      },
    ];
    setAnswers(newAnswers);
    setStreak(0);

    // Auto-advance after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      handleNext(newAnswers);
    }, 1500);
  };

  const handleSelectOption = (optionId) => {
    if (hasAnsweredRef.current) return;
    clearInterval(timerRef.current);
    updateHasAnswered(true);
    setSelectedOptionId(optionId);

    const timeTaken = 30 - timeLeft;
    const optionSelected = currentQuestion.options.find((o) => o.id === optionId);
    const isCorrect = optionSelected?.isCorrect;

    let pointsAwarded = 0;
    if (isCorrect) {
      soundEngine.playCorrect();
      pointsAwarded += 10;
      if (timeTaken <= 5) {
        pointsAwarded += 5;
      }
      setScore((prev) => prev + pointsAwarded);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        // Call out every third hit — often enough to feel rewarding, rare
        // enough that it does not become wallpaper.
        if (next >= 3 && next % 3 === 0) setCombo(next);
        return next;
      });
      setFlash('good');
    } else {
      soundEngine.playWrong();
      setStreak(0);
      setFlash('bad');
      setShake(true);
    }

    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        timeTakenSeconds: timeTaken,
      },
    ];
    setAnswers(newAnswers);

    // Auto-advance after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      handleNext(newAnswers);
    }, 1500);
  };

  // Number keys pick an answer. Speed is the whole point of the mode, and
  // reaching for a mouse is the slowest part of it.
  useEffect(() => {
    const onKey = (e) => {
      if (hasAnsweredRef.current || !currentQuestion) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1 || idx >= currentQuestion.options.length) return;
      e.preventDefault();
      handleSelectOption(currentQuestion.options[idx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentQuestion, timeLeft]);

  // Clear the transient feedback so it can retrigger on the next question.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 430);
    return () => clearTimeout(t);
  }, [flash]);
  useEffect(() => {
    if (!shake) return;
    const t = setTimeout(() => setShake(false), 430);
    return () => clearTimeout(t);
  }, [shake]);
  useEffect(() => {
    if (combo === null) return;
    const t = setTimeout(() => setCombo(null), 1150);
    return () => clearTimeout(t);
  }, [combo]);

  const correctOption = currentQuestion.options.find((o) => o.isCorrect);
  const selectedOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
  const isCorrectChoice = selectedOption?.isCorrect;

  return (
    <div className="qr-arena relative">
      <ArenaBackdrop />
      <ArenaFlash tone={flash} />

      <div className={`relative z-10 mx-auto max-w-6xl lg:max-w-7xl w-full pt-1 sm:pt-2 pb-6 ${shake ? 'qr-shake' : ''}`}>
        {/* ── Top HUD ─────────────────────────────────────────────────── */}
        <ArenaPanel className="flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 shadow-xl">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onQuit}
              title="Quit game"
              className="qr-chip border border-rose-400/30 bg-rose-500/10 p-2.5 text-rose-300 transition hover:bg-rose-500/25 hover:text-rose-100"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
            <div className="leading-none">
              <ArenaLabel tone="cyan" className="block text-xs">Quiz Rush</ArenaLabel>
              <p className="qr-display mt-1 text-sm sm:text-base font-extrabold text-white">
                Question <span className="text-cyan-300 text-base sm:text-lg font-black">{currentIdx + 1}</span>
                <span className="text-slate-400 font-medium"> / {localQuestions.length}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lives */}
            <div className="qr-chip flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3.5 py-2">
              <div className="leading-none">
                <ArenaLabel tone="muted" className="block text-xs">Lives</ArenaLabel>
                <div className="mt-1 flex items-center gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-4 w-4 transition-all duration-300 ${
                        i < lives
                          ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.95)]'
                          : 'fill-transparent text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <ArenaStat icon={Zap} label="Streak" value={streak} tone="magenta" pulse={streak >= 3} />
            <ArenaStat icon={Star} label="XP" value={score} tone="amber" />
          </div>
        </ArenaPanel>

        {/* Tab-switch warning */}
        {tabSwitchesCount > 0 && (
          <div className="qr-chip qr-rise mt-3 flex items-center gap-3 border border-amber-400/40 bg-amber-500/15 px-5 py-2.5 shadow-lg">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0 text-amber-300" />
            <span className="qr-display text-xs sm:text-sm font-extrabold uppercase tracking-wider text-amber-200">
              Tab switch {tabSwitchesCount} / 3 — game ends on the third
            </span>
          </div>
        )}

        {/* ── Question board ──────────────────────────────────────────── */}
        <ArenaPanel className="relative overflow-hidden mt-3.5 sm:mt-4 p-6 sm:p-8 lg:p-10 min-h-[170px] sm:min-h-[190px] flex flex-col justify-center shadow-2xl">
          {/* Combo callout */}
          {combo !== null && (
            <div className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center">
              <div className="qr-combo qr-display text-3xl sm:text-4xl font-black uppercase tracking-[0.14em] text-fuchsia-300 qr-neon--magenta">
                Combo ×{combo}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0 flex-1 space-y-3.5">
              <span className="qr-chip qr-display inline-block border border-cyan-400/40 bg-cyan-400/15 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300 shadow-md">
                NCERT Challenge
              </span>
              <h2 className="qr-read text-lg sm:text-2xl lg:text-3xl font-extrabold leading-snug text-white tracking-wide">
                {currentQuestion.content}
              </h2>
              {currentQuestion.contentImageUrl && (
                <div className="mt-4 max-h-[220px] overflow-hidden rounded-2xl border border-white/15 shadow-xl">
                  <img
                    src={currentQuestion.contentImageUrl}
                    alt="Question visual"
                    className="max-h-[220px] object-contain mx-auto"
                  />
                </div>
              )}
            </div>
            <ArenaTimer seconds={timeLeft} total={30} size={80} />
          </div>

          {/* Verdict */}
          {hasAnswered && (
            <div
              className={`qr-chip qr-pop mt-6 flex items-center gap-3.5 border px-5 py-3.5 rounded-2xl shadow-xl ${
                isCorrectChoice
                  ? 'border-lime-400/50 bg-lime-400/15 qr-glow-lime'
                  : 'border-rose-400/50 bg-rose-500/15 qr-glow-rose'
              }`}
            >
              {isCorrectChoice ? (
                <>
                  <Check className="h-7 w-7 shrink-0 text-lime-300" />
                  <div>
                    <p className="qr-display text-sm font-extrabold uppercase tracking-wider text-lime-300">
                      Correct · +10 XP
                    </p>
                    <p className="qr-read text-xs font-semibold text-lime-100/90 mt-0.5">
                      {30 - timeLeft <= 5 ? '⚡ Speed bonus — extra +5 XP!' : 'Nice one. Keep the run alive.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <X className="h-7 w-7 shrink-0 text-rose-300" />
                  <div>
                    <p className="qr-display text-sm font-extrabold uppercase tracking-wider text-rose-300">
                      {selectedOptionId === '' ? "Time's up" : 'Incorrect'}
                    </p>
                    <p className="qr-read text-xs font-semibold text-rose-100/90 mt-0.5">
                      Answer: <strong className="text-white font-bold">{correctOption?.content}</strong>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </ArenaPanel>

        {/* ── Answer keys ─────────────────────────────────────────────── */}
        <div className="qr-stagger grid gap-6 sm:gap-8 lg:gap-10 xl:gap-12 sm:grid-cols-2 mt-8 sm:mt-12 lg:mt-16 xl:mt-20">
          {currentQuestion.options.map((option, index) => {
            const style = OPTION_STYLES[index % OPTION_STYLES.length];
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.isCorrect;

            let face = `bg-gradient-to-b ${style.face} text-white`;
            let shadow = `0 5px 0 ${style.edge}, 0 0 24px ${style.glow}`;

            if (hasAnswered) {
              if (isCorrect) {
                face = 'bg-gradient-to-b from-lime-400 to-lime-600 text-slate-950';
                shadow = '0 5px 0 #3f6212, 0 0 34px rgba(163,230,53,0.85)';
              } else if (isSelected) {
                face = 'bg-gradient-to-b from-rose-500 to-rose-700 text-white';
                shadow = '0 5px 0 #9f1239, 0 0 34px rgba(251,113,133,0.8)';
              } else {
                face = 'bg-white/[0.03] text-slate-600';
                shadow = 'none';
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectOption(option.id)}
                style={{ boxShadow: shadow }}
                className={`qr-key flex items-center gap-4 p-5 sm:p-6 text-left transition-all min-h-[85px] sm:min-h-[95px] ${face} ${
                  hasAnswered && !isCorrect && !isSelected ? 'opacity-35' : ''
                }`}
              >
                <span
                  className="qr-display flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center bg-black/25 text-lg sm:text-xl font-black leading-none"
                  style={{ clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)' }}
                >
                  {style.shape}
                </span>
                <span className="qr-read min-w-0 flex-1 text-sm sm:text-base lg:text-lg font-bold leading-snug">
                  {option.content}
                </span>
                {/* Keyboard hint — hidden on touch */}
                <kbd className="qr-display hidden h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg border border-white/30 bg-black/30 text-xs font-black shadow-inner sm:inline-flex">
                  {style.key}
                </kbd>
              </button>
            );
          })}
        </div>

        {/* ── Advance ─────────────────────────────────────────────────── */}
        {hasAnswered && (
          <div className="flex items-center justify-between gap-4">
            <p className="qr-display hidden text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:block">
              Press 1–4 to answer
            </p>
            <ArenaButton
              type="button"
              onClick={() => handleNext()}
              disabled={submitting}
              tone={isCorrectChoice ? 'cyan' : 'magenta'}
              className="ml-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isCorrectChoice ? 'Loading' : 'Submitting'}
                </>
              ) : (
                <>
                  {isCorrectChoice ? 'Next Question' : 'View Results'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </ArenaButton>
          </div>
        )}
      </div>
    </div>
  );
}
