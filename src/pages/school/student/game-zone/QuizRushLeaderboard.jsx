import React, { useEffect, useState } from 'react';
import { apiClient as api } from '@/lib/api/client';
import { Trophy, ArrowLeft, Loader2, Zap, Clock, Star, Award } from 'lucide-react';
import { toast } from 'sonner';
import './quiz-rush/arena.css';
import { ArenaBackdrop, ArenaButton, ArenaLabel, ArenaPanel } from './quiz-rush/ArenaKit';

// Podium order is 2 · 1 · 3 so the champion stands in the middle, which is
// how a podium is read at a glance.
const PODIUM_ORDER = [2, 1, 3];

const MEDAL = {
  1: { ring: 'border-amber-400/60',   text: 'text-amber-300',  glow: 'rgba(251,191,36,0.55)',  height: 'h-28', label: '🥇' },
  2: { ring: 'border-slate-300/50',   text: 'text-slate-200',  glow: 'rgba(203,213,225,0.4)',  height: 'h-20', label: '🥈' },
  3: { ring: 'border-orange-400/50',  text: 'text-orange-300', glow: 'rgba(251,146,60,0.4)',   height: 'h-16', label: '🥉' },
};

export default function QuizRushLeaderboard({ onBack }) {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/school/gamification/quiz-rush/leaderboard');
        const list = res.data?.data ?? res.data ?? [];
        setRankings(list);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        toast.error('Failed to load Quiz Rush leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const top3 = PODIUM_ORDER
    .map((rank) => rankings.find((r) => r.rank === rank))
    .filter(Boolean);
  const rest = rankings.filter((r) => r.rank > 3);

  return (
    <div className="qr-arena relative">
      <ArenaBackdrop />

      <div className="relative z-10 mx-auto max-w-2xl space-y-5 pb-8">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="qr-rise py-3 text-center">
          <p className="qr-display text-[11px] font-bold uppercase tracking-[0.4em] text-amber-300/80">
            Quiz Rush
          </p>
          <h1 className="qr-display relative mt-1.5 text-4xl font-bold uppercase tracking-[0.08em] text-white sm:text-5xl">
            <span aria-hidden="true" className="absolute inset-0 translate-x-[2px] text-amber-500/60 blur-[1px]">
              Hall of Fame
            </span>
            <span className="relative">Hall of Fame</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex h-56 flex-col items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            <span className="qr-display text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-200/70">
              Reading the board
            </span>
          </div>
        ) : rankings.length === 0 ? (
          <ArenaPanel className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Award className="h-10 w-10 text-slate-700" />
            <h3 className="qr-display text-base font-bold uppercase tracking-wider text-white">
              Board is empty
            </h3>
            <p className="qr-read max-w-xs text-xs font-medium text-slate-500">
              Nobody has posted a run yet. Play once and the top spot is yours.
            </p>
          </ArenaPanel>
        ) : (
          <>
            {/* ── Podium ──────────────────────────────────────────────── */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 sm:gap-5">
                {top3.map((u) => {
                  const m = MEDAL[u.rank];
                  return (
                    <div key={u.studentId} className="qr-rise flex w-1/3 max-w-[170px] flex-col items-center">
                      <span className="text-2xl leading-none">{m.label}</span>
                      <p
                        className={`qr-read mt-1.5 line-clamp-2 text-center text-[11px] font-semibold ${m.text}`}
                        title={u.name}
                      >
                        {u.name}
                      </p>
                      <p className="qr-display mt-1 text-lg font-bold tabular-nums text-white">
                        {u.score}
                      </p>
                      <ArenaLabel tone="muted">XP</ArenaLabel>
                      {/* Plinth */}
                      <div
                        className={`mt-2.5 flex w-full ${m.height} items-start justify-center border-t-2 ${m.ring} bg-gradient-to-b from-white/[0.07] to-transparent pt-2`}
                        style={{ boxShadow: `0 -12px 28px -12px ${m.glow}` }}
                      >
                        <span className={`qr-display text-2xl font-bold ${m.text}`}>#{u.rank}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Remaining ranks ─────────────────────────────────────── */}
            {rest.length > 0 && (
              <ArenaPanel className="overflow-hidden">
                <div className="grid grid-cols-[48px_1fr_auto] items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
                  <ArenaLabel tone="muted" className="text-center">Rank</ArenaLabel>
                  <ArenaLabel tone="muted">Player</ArenaLabel>
                  <ArenaLabel tone="muted">Score</ArenaLabel>
                </div>

                <div className="qr-stagger divide-y divide-white/[0.05]">
                  {rest.map((u) => (
                    <div
                      key={u.studentId}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-cyan-400/[0.06]"
                    >
                      <span className="qr-display text-center text-sm font-bold tabular-nums text-slate-500">
                        {u.rank}
                      </span>

                      <div className="min-w-0">
                        <p className="qr-read truncate text-sm font-semibold text-white">{u.name}</p>
                        <p className="mt-0.5 flex items-center gap-3 text-[10px] font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5 fill-current text-fuchsia-400" />
                            {u.maxStreak}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-cyan-400" />
                            {u.timeTakenSeconds}s
                          </span>
                          <span className="tabular-nums">
                            {u.correctAnswers}/{u.totalQuestions}
                            <span className="ml-1 text-slate-600">
                              ({Math.round((u.correctAnswers / u.totalQuestions) * 100)}%)
                            </span>
                          </span>
                        </p>
                      </div>

                      <span className="qr-display flex items-center gap-1.5 text-sm font-bold tabular-nums text-amber-300">
                        <Star className="h-3.5 w-3.5 shrink-0 fill-current" />
                        {u.score}
                      </span>
                    </div>
                  ))}
                </div>
              </ArenaPanel>
            )}
          </>
        )}

        <ArenaButton type="button" onClick={onBack} tone="ghost" className="w-full">
          <ArrowLeft className="h-4 w-4" /> Back to Game Room
        </ArenaButton>
      </div>
    </div>
  );
}
