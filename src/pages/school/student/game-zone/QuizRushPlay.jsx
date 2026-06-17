import React, { useEffect, useState, useRef } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { Clock, Zap, Star, Check, X, ArrowRight, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const OPTION_STYLES = [
  { bg: 'bg-rose-500 hover:bg-rose-600', text: 'text-white', border: 'border-rose-600', color: '#f43f5e', shape: '▲' },
  { bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white', border: 'border-blue-600', color: '#3b82f6', shape: '♦' },
  { bg: 'bg-amber-500 hover:bg-amber-600', text: 'text-white', border: 'border-amber-600', color: '#f59e0b', shape: '●' },
  { bg: 'bg-emerald-500 hover:bg-emerald-600', text: 'text-white', border: 'border-emerald-600', color: '#10b981', shape: '■' },
];

export default function QuizRushPlay({ session, onFinish, onQuit }) {
  const { sessionId, questions } = session;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);

  const currentQuestion = questions[currentIdx];

  // Start timer for the current question
  useEffect(() => {
    setTimeLeft(30);
    setHasAnswered(false);
    setSelectedOptionId(null);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIdx]);

  const handleTimeOut = () => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOptionId(''); // Empty represents timeout

    const timeTaken = 30;
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionId: '',
        timeTakenSeconds: timeTaken,
      },
    ]);
    setStreak(0);
  };

  const handleSelectOption = (optionId) => {
    if (hasAnswered) return;
    clearInterval(timerRef.current);
    setHasAnswered(true);
    setSelectedOptionId(optionId);

    const timeTaken = 30 - timeLeft;
    const optionSelected = currentQuestion.options.find((o) => o.id === optionId);
    const isCorrect = optionSelected?.isCorrect;

    let pointsAwarded = 0;
    if (isCorrect) {
      pointsAwarded += 10;
      if (timeTaken <= 5) {
        pointsAwarded += 5;
      }
      setScore((prev) => prev + pointsAwarded);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        return next;
      });
    } else {
      setStreak(0);
    }

    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
        timeTakenSeconds: timeTaken,
      },
    ]);
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // End of quiz, submit answers
      setSubmitting(true);
      try {
        const res = await api.post('/school/gamification/quiz-rush/submit', {
          sessionId,
          answers,
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
  };

  const correctOption = currentQuestion.options.find((o) => o.isCorrect);
  const selectedOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
  const isCorrectChoice = selectedOption?.isCorrect;

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-6">
      {/* Top HUD */}
      <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800">
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
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Quiz Rush Session</p>
            <p className="text-sm font-black">Question {currentIdx + 1} of {questions.length}</p>
          </div>
        </div>

        {/* Stats HUD */}
        <div className="flex items-center gap-6 text-xs font-black">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Zap className="h-4 w-4 text-yellow-400 fill-current" />
            <span>Streak: {streak}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-amber-400">
            <Star className="h-4 w-4 fill-current" />
            <span>XP: {score}</span>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 transition-all duration-300"
          style={{ width: `${((currentIdx + (hasAnswered ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {/* Timer and Main Board */}
      <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 min-h-[300px] flex flex-col justify-between overflow-hidden">
        {/* Giant Timer background effect */}
        <div className="absolute top-4 right-4 flex items-center justify-center h-14 w-14 rounded-full border-4 border-indigo-50 bg-indigo-50 dark:border-slate-800 dark:bg-slate-950 font-black text-lg text-slate-800 dark:text-white">
          <Clock className="h-3 w-3 absolute -top-1 -left-1 text-indigo-500 animate-spin" />
          {timeLeft}
        </div>

        {/* Question Text */}
        <div className="space-y-4 pr-12">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-black uppercase text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
            NCERT Challenge
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
            {currentQuestion.content}
          </h2>
          {currentQuestion.contentImageUrl && (
            <div className="mt-4 max-h-[200px] overflow-hidden rounded-xl">
              <img
                src={currentQuestion.contentImageUrl}
                alt="Question visual"
                className="max-h-[200px] object-contain"
              />
            </div>
          )}
        </div>

        {/* Answer Feedback message */}
        {hasAnswered && (
          <div className="mt-8 flex items-center gap-3 animate-fade-in p-4 rounded-xl border bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800">
            {selectedOptionId === '' ? (
              <>
                <X className="h-6 w-6 text-rose-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-rose-700 dark:text-rose-400">Time is Up!</p>
                  <p className="text-xs font-semibold text-slate-500">The correct answer was: <strong className="text-slate-800 dark:text-white">{correctOption?.content}</strong></p>
                </div>
              </>
            ) : isCorrectChoice ? (
              <>
                <Check className="h-6 w-6 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">Correct! +10 XP</p>
                  <p className="text-xs font-semibold text-slate-500">
                    {30 - timeLeft <= 5 && '⚡ Speed Bonus! Extra +5 XP!'} Great job.
                  </p>
                </div>
              </>
            ) : (
              <>
                <X className="h-6 w-6 text-rose-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-rose-700 dark:text-rose-400">Incorrect</p>
                  <p className="text-xs font-semibold text-slate-500">The correct answer was: <strong className="text-slate-800 dark:text-white">{correctOption?.content}</strong></p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option, index) => {
          const style = OPTION_STYLES[index % OPTION_STYLES.length];
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.isCorrect;
          
          let buttonClass = `${style.bg} ${style.text} ${style.border}`;
          let borderClass = 'border-transparent';

          if (hasAnswered) {
            if (isCorrect) {
              buttonClass = 'bg-emerald-500 text-white border-emerald-600 ring-2 ring-emerald-300 dark:ring-emerald-950';
            } else if (isSelected) {
              buttonClass = 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-300 dark:ring-rose-950';
            } else {
              buttonClass = 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed';
            }
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(option.id)}
              className={`flex items-center gap-4 rounded-2xl border-b-4 p-5 text-left text-sm font-black transition shadow-sm hover:shadow active:translate-y-0.5 ${buttonClass}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20 text-base">
                {style.shape}
              </span>
              <span className="leading-snug">{option.content}</span>
            </button>
          );
        })}
      </div>

      {/* Controls HUD */}
      {hasAnswered && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                {currentIdx < questions.length - 1 ? 'Next Question' : 'View Results'}{' '}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
