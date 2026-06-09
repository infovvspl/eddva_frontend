import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const streamBadge = (stream: string): string => {
  switch ((stream || '').toLowerCase()) {
    case 'science': return 'bg-blue-50 text-blue-600';
    case 'commerce': return 'bg-amber-50 text-amber-600';
    case 'arts': return 'bg-rose-50 text-rose-600';
    default: return 'bg-violet-50 text-violet-600';
  }
};

export const gradeBadge = (grade: string): string => {
  const g = (grade || '').toUpperCase();
  if (g.startsWith('A')) return 'bg-emerald-50 text-emerald-600';
  if (g.startsWith('B')) return 'bg-blue-50 text-blue-600';
  if (g.startsWith('C')) return 'bg-amber-50 text-amber-600';
  return 'bg-rose-50 text-rose-600';
};

export const fitColor = (score: number): string => {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-slate-400';
};

export const fitTextColor = (score: number): string => {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50';
  if (score >= 60) return 'text-blue-600 bg-blue-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-slate-600 bg-slate-100';
};

export function ErrorState({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/40 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-rose-400" />
      <p className="text-sm font-bold text-slate-700">Something went wrong</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{message || 'We couldn’t load this right now.'}</p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
        <RefreshCw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

/** CSS-only confetti burst (no library). */
export function Confetti() {
  const pieces = Array.from({ length: 28 });
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes career-confetti-fall {
          0% { transform: translateY(-10%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 2.2 + Math.random() * 1.8;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '-12px',
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 0.5}px`,
              background: color,
              borderRadius: '2px',
              animation: `career-confetti-fall ${dur}s linear ${delay}s 1 forwards`,
            }}
          />
        );
      })}
    </div>
  );
}
