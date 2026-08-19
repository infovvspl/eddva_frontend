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

      <div className={`relative z-10 mx-auto max-w-3xl space-y-5 py-2 ${shake ? 'qr-shake' : ''}`}>
        {/* ── Top HUD ─────────────────────────────────────────────────── */}
        <ArenaPanel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onQuit}
              title="Quit game"
              className="qr-chip border border-rose-400/30 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/25 hover:text-rose-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="leading-none">
              <ArenaLabel tone="cyan" className="block">Quiz Rush</ArenaLabel>
              <p className="qr-display mt-1 text-sm font-bold text-white">
                Question <span className="text-cyan-300">{currentIdx + 1}</span>
                <span className="text-slate-500"> / {localQuestions.length}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lives */}
            <div className="qr-chip flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="leading-none">
                <ArenaLabel tone="muted" className="block">Lives</ArenaLabel>
                <div className="mt-1.5 flex items-center gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`h-3.5 w-3.5 transition-all duration-300 ${
                        i < lives
                          ? 'fill-rose-500 text-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]'
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

        {/* Tab-switch warning — the anti-cheat rule is only fair if the
            student can see how close they are to tripping it. */}
        {tabSwitchesCount > 0 && (
          <div className="qr-chip qr-rise flex items-center gap-2 border border-amber-400/30 bg-amber-500/10 px-4 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" />
            <span className="qr-display text-[11px] font-bold uppercase tracking-wider text-amber-200">
              Tab switch {tabSwitchesCount} / 3 — game ends on the third
            </span>
          </div>
        )}

        {/* ── Question board ──────────────────────────────────────────── */}
        <ArenaPanel className="relative overflow-hidden p-6 sm:p-8">
          {/* Combo callout */}
          {combo !== null && (
            <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center">
              <div className="qr-combo qr-display text-3xl font-bold uppercase tracking-[0.12em] text-fuchsia-300 qr-neon--magenta">
                Combo ×{combo}
              </div>
            </div>
          )}

          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1 space-y-3">
              <span className="qr-chip qr-display inline-block border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
                NCERT Challenge
              </span>
              <h2 className="qr-read text-lg font-semibold leading-relaxed text-white sm:text-xl">
                {currentQuestion.content}
              </h2>
              {currentQuestion.contentImageUrl && (
                <div className="mt-4 max-h-[200px] overflow-hidden rounded-xl border border-white/10">
                  <img
                    src={currentQuestion.contentImageUrl}
                    alt="Question visual"
                    className="max-h-[200px] object-contain"
                  />
                </div>
              )}
            </div>
            <ArenaTimer seconds={timeLeft} total={30} />
          </div>

          {/* Verdict */}
          {hasAnswered && (
            <div
              className={`qr-chip qr-pop mt-6 flex items-center gap-3 border px-4 py-3 ${
                isCorrectChoice
                  ? 'border-lime-400/40 bg-lime-400/10 qr-glow-lime'
                  : 'border-rose-400/40 bg-rose-500/10 qr-glow-rose'
              }`}
            >
              {isCorrectChoice ? (
                <>
                  <Check className="h-6 w-6 shrink-0 text-lime-300" />
                  <div>
                    <p className="qr-display text-sm font-bold uppercase tracking-wider text-lime-300">
                      Correct · +10 XP
                    </p>
                    <p className="qr-read text-xs font-medium text-lime-100/70">
                      {30 - timeLeft <= 5 ? '⚡ Speed bonus — extra +5 XP!' : 'Nice one. Keep the run alive.'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <X className="h-6 w-6 shrink-0 text-rose-300" />
                  <div>
                    <p className="qr-display text-sm font-bold uppercase tracking-wider text-rose-300">
                      {selectedOptionId === '' ? "Time's up" : 'Incorrect'}
                    </p>
                    <p className="qr-read text-xs font-medium text-rose-100/70">
                      Answer: <strong className="text-white">{correctOption?.content}</strong>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </ArenaPanel>

        {/* ── Answer keys ─────────────────────────────────────────────── */}
        <div className="qr-stagger grid gap-3 sm:grid-cols-2">
          {currentQuestion.options.map((option, index) => {
            const style = OPTION_STYLES[index % OPTION_STYLES.length];
            const isSelected = selectedOptionId === option.id;
            const isCorrect = option.isCorrect;

            let face = `bg-gradient-to-b ${style.face} text-white`;
            let shadow = `0 5px 0 ${style.edge}, 0 0 22px ${style.glow}`;

            if (hasAnswered) {
              if (isCorrect) {
                face = 'bg-gradient-to-b from-lime-400 to-lime-600 text-slate-950';
                shadow = '0 5px 0 #3f6212, 0 0 34px rgba(163,230,53,0.75)';
              } else if (isSelected) {
                face = 'bg-gradient-to-b from-rose-500 to-rose-700 text-white';
                shadow = '0 5px 0 #9f1239, 0 0 34px rgba(251,113,133,0.7)';
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
                className={`qr-key flex items-center gap-3.5 p-4 text-left ${face} ${
                  hasAnswered && !isCorrect && !isSelected ? 'opacity-40' : ''
                }`}
              >
                <span
                  className="qr-display flex h-9 w-9 shrink-0 items-center justify-center bg-black/25 text-lg leading-none"
                  style={{ clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)' }}
                >
                  {style.shape}
                </span>
                <span className="qr-read min-w-0 flex-1 text-sm font-semibold leading-snug">
                  {option.content}
                </span>
                {/* Keyboard hint — hidden on touch, where it would be a lie. */}
                <kbd className="qr-display hidden h-6 w-6 shrink-0 items-center justify-center rounded border border-white/25 bg-black/25 text-[11px] font-bold sm:inline-flex">
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
