import React from 'react';

/**
 * Shared furniture for the Quiz Rush arena.
 *
 * The backdrop is `position: fixed` on purpose. GameArenaShell wraps its
 * children in a `max-w-6xl` padded container, so a normal-flow background
 * would sit in a letterboxed column with the shell's grey showing either
 * side. Fixed positioning lets the arena bleed to the viewport edges without
 * touching the shell, which is shared with the other four games.
 */
export function ArenaBackdrop() {
  return (
    <div className="qr-backdrop" aria-hidden="true">
      <div className="qr-aurora qr-aurora--a" />
      <div className="qr-aurora qr-aurora--b" />
      <div className="qr-aurora qr-aurora--c" />
      <div className="qr-floor" />
      <div className="qr-scanlines" />
      <div className="qr-grain" />
      <div className="qr-vignette" />
    </div>
  );
}

/** Small uppercase label used above every HUD value. */
export function ArenaLabel({ children, tone = 'cyan', className = '' }) {
  const tones = {
    cyan: 'text-cyan-300/70',
    magenta: 'text-fuchsia-300/70',
    amber: 'text-amber-300/70',
    muted: 'text-slate-400/70',
  };
  return (
    <span
      className={`qr-display text-[10px] font-bold uppercase tracking-[0.22em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Angular HUD panel. */
export function ArenaPanel({ children, className = '', tone = 'cyan', ...rest }) {
  return (
    <div
      className={`qr-panel ${tone === 'magenta' ? 'qr-panel--magenta' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Primary arcade action. `tone` picks the neon; the hard bottom edge and the
 * press-down transform come from `.qr-key` in arena.css.
 */
export function ArenaButton({
  children,
  tone = 'cyan',
  className = '',
  disabled,
  ...rest
}) {
  const tones = {
    cyan: 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-slate-950 shadow-[0_5px_0_#0e7490,0_0_28px_rgba(34,211,238,0.5)]',
    magenta: 'bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 text-slate-950 shadow-[0_5px_0_#a21caf,0_0_28px_rgba(232,121,249,0.45)]',
    ghost: 'bg-white/[0.04] text-cyan-200 border border-cyan-400/25 shadow-[0_4px_0_rgba(34,211,238,0.18)]',
  };
  return (
    <button
      disabled={disabled}
      className={`qr-key qr-display inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.14em]
        ${tones[tone]}
        ${disabled ? 'cursor-not-allowed opacity-40 saturate-0' : ''}
        ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Value + label block for the top HUD. */
export function ArenaStat({ icon: Icon, label, value, tone = 'cyan', pulse = false }) {
  const tones = {
    cyan: { text: 'text-cyan-300', glow: 'qr-neon' },
    magenta: { text: 'text-fuchsia-300', glow: 'qr-neon--magenta' },
    amber: { text: 'text-amber-300', glow: 'qr-neon--amber' },
    rose: { text: 'text-rose-300', glow: '' },
  };
  const t = tones[tone] ?? tones.cyan;
  return (
    <div className="qr-chip flex items-center gap-2.5 border border-white/10 bg-white/[0.03] px-3 py-2">
      {Icon && <Icon className={`h-4 w-4 ${t.text} ${pulse ? 'animate-pulse' : ''}`} />}
      <div className="leading-none">
        <ArenaLabel tone="muted" className="block">{label}</ArenaLabel>
        <span className={`qr-display mt-1 block text-base font-bold tabular-nums ${t.text} ${t.glow}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

/**
 * Circular countdown. An SVG ring reads as a game timer where a bare number
 * reads as a form field, and the colour carries the urgency before the digits
 * are even parsed.
 */
export function ArenaTimer({ seconds, total = 30, size = 68 }) {
  const pct = Math.max(0, Math.min(1, seconds / total));
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const urgent = seconds <= 5;
  const warn = seconds <= 10;

  const stroke = urgent ? '#fb7185' : warn ? '#fbbf24' : '#22d3ee';

  return (
    <div className={`relative ${urgent ? 'qr-urgent' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="rgba(5,6,15,0.7)" stroke="rgba(255,255,255,0.09)" strokeWidth="4"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 300ms ease',
            filter: `drop-shadow(0 0 6px ${stroke})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="qr-display text-xl font-bold tabular-nums leading-none"
          style={{ color: stroke, textShadow: `0 0 12px ${stroke}` }}
        >
          {seconds}
        </span>
        <span className="qr-display text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">
          sec
        </span>
      </div>
    </div>
  );
}

/**
 * Circular progress, used for level progress in the lobby. Same visual family
 * as ArenaTimer but driven by a percentage rather than a countdown, and without
 * the urgency colouring — progress toward a level is never alarming.
 */
export function ArenaRing({ percent = 0, size = 92, stroke = '#22d3ee', children }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0)) / 100;
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 7px ${stroke})`,
          }}
        />
      </svg>
      <div className="qr-ring-label">{children}</div>
    </div>
  );
}

/** Full-bleed colour wash used to punctuate a correct or wrong answer. */
export function ArenaFlash({ tone }) {
  if (!tone) return null;
  const bg =
    tone === 'good'
      ? 'radial-gradient(70% 60% at 50% 50%, rgba(163,230,53,0.30), transparent 70%)'
      : 'radial-gradient(70% 60% at 50% 50%, rgba(251,113,133,0.34), transparent 70%)';
  return <div className="qr-flash" style={{ background: bg }} aria-hidden="true" />;
}
