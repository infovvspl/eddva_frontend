import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, HelpCircle, AlertCircle, Compass, Check, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { soundEngine } from '@/lib/audioManager';

export default function TreasureChallenge({ challenge, onSubmit, onQuit }) {
  const { questions, stageName, stageOrder } = challenge;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitchesCount, setTabSwitchesCount] = useState(0);

  const startTimeRef = useRef(Date.now());
  const timeoutRef = useRef(null);
  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  // Anti-Cheat: Tab Switching detection & copy/select blocking
  useEffect(() => {
    soundEngine.startBackgroundMusic();

    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchesCount((prev) => {
          const next = prev + 1;
          if (next >= 3) {
            toast.error('Warning: Tab switching detected! Cheat protection will flag this game.', {
              description: `${next} tab switches recorded.`,
              duration: 5000,
            });
          } else {
            toast.warning(`Tab switch detected! (${next}/3 limit)`, {
              duration: 3000,
            });
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async (currentAnswers = answers) => {
    setSubmitting(true);
    try {
      const totalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
      await onSubmit(currentAnswers, tabSwitchesCount, totalDuration);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = (currentAnswers = answers) => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOptionId(null);
      setHasAnswered(false);
    } else {
      handleSubmit(currentAnswers);
    }
  };

  const handleSelectOption = (optionId) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOptionId(optionId);

    const optionSelected = currentQuestion?.options?.find((o) => o.id === optionId);
    if (optionSelected?.isCorrect) {
      soundEngine.playCorrect();
    } else {
      soundEngine.playWrong();
    }

    // Save the student's answer
    const newAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      },
    ];
    setAnswers(newAnswers);

    // Auto-advance after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      handleNext(newAnswers);
    }, 1500);
  };

  const correctOption = currentQuestion?.options.find((o) => o.isCorrect);
  const selectedOption = currentQuestion?.options.find((o) => o.id === selectedOptionId);
  const isCorrectChoice = selectedOption?.isCorrect;

  return (
    <div className="relative min-h-[80vh] rounded-3xl border border-sky-200/90 bg-gradient-to-b from-sky-50 via-sky-100/50 to-blue-50/60 text-slate-900 p-6 md:p-8 shadow-xl shadow-sky-500/10 overflow-hidden flex flex-col justify-between max-w-4xl mx-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c712_1px,transparent_1px),linear-gradient(to_bottom,#0284c712_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25 bg-sky-400" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 bg-cyan-300" />

      {/* Header HUD */}
      <div className="relative z-10 flex items-center justify-between border-b border-sky-200/80 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-sky-700 bg-sky-500/15 border border-sky-300/80 px-3 py-1 rounded-full">
            <Compass className="h-4 w-4 animate-spin-slow text-sky-600" />
            Checkpoint {stageOrder}
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-1">{stageName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">Riddle Challenge</p>
          <p className="text-base font-black text-sky-800">
            {currentIdx + 1} of {totalQuestions}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-4 h-2.5 w-full bg-sky-100 rounded-full overflow-hidden border border-sky-200">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${((currentIdx + (hasAnswered ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="relative z-10 my-6 flex-1 flex flex-col justify-center">
        <div className="bg-white/95 border border-sky-200 rounded-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-md shadow-md shadow-sky-500/5">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-sky-600" />
            <span className="text-xs font-black uppercase tracking-wider text-sky-700">NCERT Riddle</span>
          </div>

          <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 leading-relaxed">
            {currentQuestion?.content}
          </h3>

          {currentQuestion?.contentImageUrl && (
            <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50/50 p-2 overflow-hidden flex justify-center">
              <img
                src={currentQuestion.contentImageUrl}
                alt="Riddle visual helper"
                className="max-h-[220px] object-contain rounded-lg"
              />
            </div>
          )}

          {/* Feedback Banner */}
          {hasAnswered && (
            <div className={`mt-6 flex items-start gap-3.5 p-4 sm:p-5 rounded-xl border animate-fade-in ${
              isCorrectChoice
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {isCorrectChoice ? (
                <Check className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <X className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-black text-base">
                  {isCorrectChoice ? 'Correct! Checkpoint unlocked.' : 'Incorrect riddle choice.'}
                </p>
                <p className="mt-1 font-semibold text-sm text-slate-600">
                  {isCorrectChoice ? 'You found the correct mechanism!' : `Correct answer: ${correctOption?.content}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Options Grid */}
      <div className="relative z-10 grid gap-4 sm:gap-5 sm:grid-cols-2">
        {currentQuestion?.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.isCorrect;
          
          let cardStyle = 'border-sky-200/90 bg-white hover:bg-sky-50/80 hover:border-sky-300 text-slate-800 shadow-sm';
          let badgeLabel = String.fromCharCode(65 + idx); // A, B, C, D
          let badgeStyle = 'bg-sky-100 text-sky-700 font-black';

          if (hasAnswered) {
            if (isCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/20 shadow-md shadow-emerald-500/10';
              badgeStyle = 'bg-emerald-500 text-white';
            } else if (isSelected) {
              cardStyle = 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20 shadow-md shadow-rose-500/10';
              badgeStyle = 'bg-rose-500 text-white';
            } else {
              cardStyle = 'border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed';
              badgeStyle = 'bg-slate-200 text-slate-400';
            }
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(option.id)}
              className={`flex items-center gap-4 rounded-xl border p-5 sm:p-6 text-left text-lg sm:text-xl lg:text-2xl font-black transition-all duration-200 active:scale-[0.98] ${cardStyle}`}
            >
              <span className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl text-base sm:text-lg font-black transition-all ${badgeStyle}`}>
                {hasAnswered && isCorrect ? <Check className="h-5 w-5" /> : hasAnswered && isSelected ? <X className="h-5 w-5" /> : badgeLabel}
              </span>
              <span className="leading-snug flex-1">{option.content}</span>
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="relative z-10 mt-6 border-t border-sky-200/80 pt-4 flex items-center justify-between">
        <button
          onClick={onQuit}
          disabled={submitting}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors px-3 py-2"
        >
          Quit Adventure
        </button>

        {hasAnswered && (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-6 py-3 text-xs font-black text-white hover:bg-sky-600 shadow-md shadow-sky-500/20 transition"
          >
            {submitting ? (
              'Submitting Riddle...'
            ) : currentIdx < totalQuestions - 1 ? (
              <>
                Next Checkpoint <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              'Submit Checkpoints'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
