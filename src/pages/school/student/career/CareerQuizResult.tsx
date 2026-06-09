import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles } from 'lucide-react';
import {
  getQuizStatus, HOLLAND_INFO,
  type QuizResult, type HollandScores,
} from '@/lib/api/career';
import { Confetti } from './_shared';

const LETTERS: (keyof HollandScores)[] = ['R', 'I', 'A', 'S', 'E', 'C'];

export default function CareerQuizResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateResult = (location.state as { result?: QuizResult } | null)?.result ?? null;
  const [result, setResult] = useState<QuizResult | null>(stateResult);

  useEffect(() => {
    // Direct navigation (no router state) → fall back to saved status (code only).
    if (!result) {
      getQuizStatus()
        .then((s) => {
          if (s.completed && s.hollandCode) {
            setResult({ hollandCode: s.hollandCode, scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } });
          }
        })
        .catch(() => undefined);
    }
  }, [result]);

  if (!result) {
    return (
      <div className="mx-auto max-w-xl p-1 text-center">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">No quiz result to show yet.</p>
          <button onClick={() => navigate('/school/student/career/quiz')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">Take the Quiz</button>
        </div>
      </div>
    );
  }

  const code = result.hollandCode || '';
  const codeLetters = code.split('');
  const maxScore = Math.max(1, ...LETTERS.map((l) => result.scores[l] ?? 0));
  const hasScores = LETTERS.some((l) => (result.scores[l] ?? 0) > 0);

  return (
    <div className="relative mx-auto max-w-2xl p-1">
      <Confetti />
      <div className="animate-[fadeIn_0.4s_ease] rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wide text-blue-600">Your Interest Profile</p>
          <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">{codeLetters.join(' + ')}</p>
          <p className="mt-1 text-lg font-bold text-slate-600">
            {codeLetters.map((l) => HOLLAND_INFO[l]?.label).filter(Boolean).join(' + ')}
          </p>
        </div>

        {/* What this means */}
        <div className="mt-5 space-y-2">
          {codeLetters.map((l) => HOLLAND_INFO[l] && (
            <div key={l} className="rounded-xl bg-blue-50/60 p-3">
              <span className="text-sm font-bold text-blue-700">{HOLLAND_INFO[l].label}:</span>{' '}
              <span className="text-sm text-slate-600">{HOLLAND_INFO[l].desc}</span>
            </div>
          ))}
        </div>

        {/* Score bars */}
        {hasScores && (
          <div className="mt-6 space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Your scores</p>
            {LETTERS.map((l) => {
              const v = result.scores[l] ?? 0;
              const isTop = codeLetters.includes(l);
              return (
                <div key={l} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-bold text-slate-500">{l}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${isTop ? 'bg-blue-600' : 'bg-slate-300'}`} style={{ width: `${(v / maxScore) * 100}%` }} />
                  </div>
                  <span className="w-5 text-right text-sm font-bold text-slate-700">{v}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button onClick={() => navigate('/school/student/career/report')}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700">
            <Sparkles className="h-4 w-4" /> Generate My Career Report <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/school/student/career')}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Back to Career Home
          </button>
        </div>
      </div>
    </div>
  );
}
