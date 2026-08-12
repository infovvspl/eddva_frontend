import React from 'react';
import { Trophy, Star, Coins, Zap, Award, RefreshCw, ArrowLeft, Clock, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clearStudentDashboardCache } from '@/lib/school/student-dashboard-cache';
import { soundEngine } from '@/lib/audioManager';
import './quiz-rush/arena.css';
import { ArenaBackdrop, ArenaButton, ArenaLabel, ArenaPanel } from './quiz-rush/ArenaKit';

/**
 * Counts a number up on mount. A reward that lands instantly reads as a
 * number; one that climbs reads as something you won.
 */
function useCountUp(target = 0, duration = 900) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const end = Number(target) || 0;
    if (end === 0) { setN(0); return; }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setN(end); return; }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      // Ease-out so it decelerates into the final value.
      setN(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

export default function QuizRushResult({ result, onPlayAgain, onViewLeaderboard }) {
  const {
    totalQuestions,
    correctAnswers,
    xpEarned,
    coinsEarned,
    isPerfectScore,
    maxStreak,
    speedBonusCount,
    timeTakenSeconds,
    hasLeveledUp,
    newLevel,
    newTitle,
    badgeUnlocked,
    currentXp,
    currentCoins,
    levelProgress,
  } = result;

  const scorePct = Math.round((correctAnswers / totalQuestions) * 100) || 0;

  const xpCount = useCountUp(xpEarned);
  const coinCount = useCountUp(coinsEarned, 750);

  React.useEffect(() => {
    clearStudentDashboardCache();
    if (scorePct >= 50) {
      soundEngine.playGameWin();
    } else {
      soundEngine.playGameLose();
    }
  }, []);

  const strong = scorePct >= 80;
  const decent = scorePct >= 50;

  const verdict = strong ? 'Flawless Run' : decent ? 'Run Complete' : 'Run Ended';
  const verdictTone = strong ? 'text-amber-300' : decent ? 'text-cyan-300' : 'text-rose-300';
  const verdictGlow = strong ? 'qr-neon--amber' : decent ? 'qr-neon' : '';

  return (
    <div className="qr-arena relative">
      <ArenaBackdrop />

      <div className="relative z-10 mx-auto max-w-xl space-y-4 pb-8">
        <Link
          to="/school/student/gamification"
          className="qr-display inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 transition hover:text-cyan-300"
        >
          <ArrowLeft className="h-3 w-3" /> Gamification Center
        </Link>

        {/* ── Verdict ─────────────────────────────────────────────────── */}
        <div className="qr-rise py-4 text-center">
          <div
            className={`qr-pop mx-auto flex h-20 w-20 items-center justify-center border ${
              strong
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                : decent
                ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-300'
                : 'border-rose-400/40 bg-rose-500/10 text-rose-300'
            }`}
            style={{ clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)' }}
          >
            <Trophy className="h-9 w-9" />
          </div>
          <h1 className={`qr-display mt-4 text-4xl font-bold uppercase tracking-[0.06em] ${verdictTone} ${verdictGlow}`}>
            {verdict}
          </h1>
          {isPerfectScore && (
            <p className="qr-display mt-1 text-[11px] font-bold uppercase tracking-[0.3em] text-amber-300">
              ★ Perfect Score ★
            </p>
          )}

          {/* Accuracy bar — the headline number, given room to be the headline. */}
          <div className="mx-auto mt-5 max-w-xs">
            <div className="flex items-end justify-between">
              <ArenaLabel tone="muted">Accuracy</ArenaLabel>
              <span className="qr-display text-2xl font-bold tabular-nums text-white">{scorePct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden bg-white/[0.06]">
              <div
                className={`h-full transition-[width] duration-1000 ease-out ${
                  strong ? 'bg-amber-400' : decent ? 'bg-cyan-400' : 'bg-rose-400'
                }`}
                style={{ width: `${scorePct}%`, boxShadow: '0 0 12px currentColor' }}
              />
            </div>
            <p className="qr-read mt-1.5 text-[11px] font-medium text-slate-500">
              {correctAnswers} of {totalQuestions} correct
            </p>
          </div>
        </div>

        {/* ── Rewards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <ArenaPanel className="p-5">
            <div className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
              <ArenaLabel tone="amber">XP Earned</ArenaLabel>
            </div>
            <p className="qr-display mt-2 text-3xl font-bold tabular-nums text-amber-300 qr-neon--amber">
              +{xpCount}
            </p>
          </ArenaPanel>

          <ArenaPanel tone="magenta" className="p-5">
            <div className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 fill-current text-fuchsia-300" />
              <ArenaLabel tone="magenta">Coins</ArenaLabel>
            </div>
            <p className="qr-display mt-2 text-3xl font-bold tabular-nums text-fuchsia-300 qr-neon--magenta">
              +{coinCount}
            </p>
          </ArenaPanel>
        </div>

        {/* ── Run stats ───────────────────────────────────────────────── */}
        <ArenaPanel className="qr-stagger divide-y divide-white/[0.06]">
          {[
            { icon: Zap, tone: 'text-fuchsia-300', label: 'Max Combo', value: `${maxStreak}` },
            { icon: Target, tone: 'text-lime-300', label: 'Speed Bonuses', value: `${speedBonusCount} under 5s` },
            { icon: Clock, tone: 'text-cyan-300', label: 'Total Time', value: `${timeTakenSeconds}s` },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between px-5 py-3.5">
              <span className="flex items-center gap-2.5">
                <s.icon className={`h-4 w-4 ${s.tone}`} />
                <ArenaLabel tone="muted">{s.label}</ArenaLabel>
              </span>
              <span className="qr-display text-sm font-bold tabular-nums text-white">{s.value}</span>
            </div>
          ))}
        </ArenaPanel>

        {/* ── Level up ────────────────────────────────────────────────── */}
        {hasLeveledUp && (
          <ArenaPanel className="qr-pop border-amber-400/40 p-5 text-center qr-glow-lime">
            <ArenaLabel tone="amber">Rank Promotion</ArenaLabel>
            <h2 className="qr-display mt-2 text-2xl font-bold uppercase tracking-wider text-amber-300 qr-neon--amber">
              Level {newLevel}
            </h2>
            <p className="qr-read mt-1 text-xs font-medium text-slate-400">
              You are now a <strong className="text-white">{newTitle}</strong>.
            </p>
          </ArenaPanel>
        )}

        {/* ── Badge ───────────────────────────────────────────────────── */}
        {badgeUnlocked && (
          <ArenaPanel className="qr-pop border-lime-400/40 p-5 text-center">
            <div className="qr-float mx-auto flex h-14 w-14 items-center justify-center border border-lime-400/40 bg-lime-400/10 text-lime-300">
              <Award className="h-7 w-7" />
            </div>
            <ArenaLabel tone="muted" className="mt-3 block">Badge Unlocked</ArenaLabel>
            <h2 className="qr-display mt-1 text-lg font-bold uppercase tracking-wider text-lime-300">
              {badgeUnlocked}
            </h2>
          </ArenaPanel>
        )}

        {/* ── Progress to next rank ───────────────────────────────────── */}
        <ArenaPanel className="p-5">
          <div className="flex items-center justify-between">
            <ArenaLabel tone="cyan">Level {newLevel} · {newTitle}</ArenaLabel>
            <span className="qr-display text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Next · {newLevel + 1}
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden bg-white/[0.06]">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-[width] duration-1000 ease-out"
              style={{ width: `${levelProgress}%`, boxShadow: '0 0 14px rgba(34,211,238,0.6)' }}
            />
          </div>
          <p className="qr-read mt-2 text-center text-[10px] font-medium text-slate-500">
            {levelProgress}% toward the next rank
          </p>
        </ArenaPanel>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          <ArenaButton type="button" onClick={onPlayAgain} tone="cyan" className="w-full py-4 text-base">
            <RefreshCw className="h-5 w-5" /> Run It Back
          </ArenaButton>
          <ArenaButton type="button" onClick={onViewLeaderboard} tone="ghost" className="w-full">
            <Trophy className="h-4 w-4 text-amber-300" /> Hall of Fame
          </ArenaButton>
        </div>
      </div>
    </div>
  );
}
