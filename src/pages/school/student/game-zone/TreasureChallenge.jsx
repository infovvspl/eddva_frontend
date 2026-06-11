import React, { useState } from 'react';
import { ArrowRight, HelpCircle, AlertCircle, Compass, Check, X, ShieldAlert } from 'lucide-react';

export default function TreasureChallenge({ challenge, onSubmit, onQuit }) {
  const { questions, stageName, stageOrder } = challenge;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const currentQuestion = questions[currentIdx];
  const totalQuestions = questions.length;

  const handleSelectOption = (optionId) => {
    if (hasAnswered) return;
    setHasAnswered(true);
    setSelectedOptionId(optionId);

    // Save the student's answer
    setAnswers((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        selectedOptionId: optionId,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOptionId(null);
      setHasAnswered(false);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const correctOption = currentQuestion.options.find((o) => o.isCorrect);
  const selectedOption = currentQuestion.options.find((o) => o.id === selectedOptionId);
  const isCorrectChoice = selectedOption?.isCorrect;

  return (
    <div className="relative min-h-[80vh] rounded-3xl border border-slate-800 bg-slate-950 text-slate-100 p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col justify-between max-w-3xl mx-auto">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25 bg-amber-500" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-20 bg-indigo-500" />

      {/* Header HUD */}
      <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full">
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
            Checkpoint {stageOrder}
          </span>
          <h2 className="text-lg font-black text-white mt-1">{stageName}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">Riddle Challenge</p>
          <p className="text-sm font-black text-white">
            {currentIdx + 1} of {totalQuestions}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
          style={{ width: `${((currentIdx + (hasAnswered ? 1 : 0)) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="relative z-10 my-8 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">NCERT Riddle</span>
          </div>

          <h3 className="text-lg md:text-xl font-black text-white leading-relaxed">
            {currentQuestion.content}
          </h3>

          {currentQuestion.contentImageUrl && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/50 p-2 overflow-hidden flex justify-center">
              <img
                src={currentQuestion.contentImageUrl}
                alt="Riddle visual helper"
                className="max-h-[220px] object-contain rounded-lg"
              />
            </div>
          )}

          {/* Feedback Banner */}
          {hasAnswered && (
            <div className={`mt-6 flex items-start gap-3 p-4 rounded-xl border animate-fade-in ${
              isCorrectChoice
                ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/20 text-rose-300'
            }`}>
              {isCorrectChoice ? (
                <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <X className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-black text-sm">
                  {isCorrectChoice ? 'Correct! Checkpoint unlocked.' : 'Incorrect riddle choice.'}
                </p>
                <p className="mt-1 font-semibold text-slate-400">
                  {isCorrectChoice ? 'You found the correct mechanism!' : `Correct answer: ${correctOption?.content}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Answer Options Grid */}
      <div className="relative z-10 grid gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option, idx) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.isCorrect;
          
          let cardStyle = 'border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-slate-700 text-slate-300';
          let badgeLabel = String.fromCharCode(65 + idx); // A, B, C, D
          let badgeStyle = 'bg-slate-800 text-slate-400';

          if (hasAnswered) {
            if (isCorrect) {
              cardStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-200 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-500/5';
              badgeStyle = 'bg-emerald-500 text-white';
            } else if (isSelected) {
              cardStyle = 'border-rose-500 bg-rose-950/20 text-rose-200 ring-2 ring-rose-500/10 shadow-lg shadow-rose-500/5';
              badgeStyle = 'bg-rose-500 text-white';
            } else {
              cardStyle = 'border-slate-900 bg-slate-950/20 text-slate-600 opacity-40 cursor-not-allowed';
              badgeStyle = 'bg-slate-900 text-slate-700';
            }
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={hasAnswered}
              onClick={() => handleSelectOption(option.id)}
              className={`flex items-center gap-4 rounded-xl border p-4 text-left text-sm font-black transition-all duration-200 active:scale-[0.98] ${cardStyle}`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-all ${badgeStyle}`}>
                {hasAnswered && isCorrect ? <Check className="h-4 w-4" /> : hasAnswered && isSelected ? <X className="h-4 w-4" /> : badgeLabel}
              </span>
              <span className="leading-snug">{option.content}</span>
            </button>
          );
        })}
      </div>

      {/* Control Buttons */}
      <div className="relative z-10 mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between">
        <button
          onClick={onQuit}
          disabled={submitting}
          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors px-3 py-2"
        >
          Quit Adventure
        </button>

        {hasAnswered && (
          <button
            onClick={handleNext}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/10 transition"
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
