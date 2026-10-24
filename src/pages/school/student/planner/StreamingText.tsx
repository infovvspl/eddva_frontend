import { useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

/** Time between reveals, and the most reveals an answer takes (so a long one still finishes in about 5 s). */
export const REVEAL_TICK_MS = 25;
const MAX_TICKS = 200;

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * A new answer from the AI tutor, written out word by word as if it were
 * being typed, with a blinking cursor. The whole answer has already arrived;
 * this only reveals it. Clicking shows the rest at once, and people who prefer
 * reduced motion see it all straight away.
 */
export function StreamingText({ text, onGrow, onDone }: { text: string; onGrow?: () => void; onDone?: () => void }) {
  // Words with the spaces and line breaks after them, so the Markdown keeps its shape as it grows.
  const pieces = useMemo(() => text.match(/\S+\s*|\s+/g) ?? [], [text]);
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? pieces.length : 0));
  const done = shown >= pieces.length;

  useEffect(() => {
    if (done) {
      onDone?.();
      return;
    }
    const step = Math.max(1, Math.ceil(pieces.length / MAX_TICKS));
    const timer = setTimeout(() => {
      setShown((n) => Math.min(pieces.length, n + step));
      onGrow?.();
    }, REVEAL_TICK_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, done, pieces.length]);

  return (
    <div onClick={() => setShown(pieces.length)} aria-live="polite" aria-busy={!done} className={done ? undefined : "cursor-pointer"}>
      <MarkdownRenderer content={pieces.slice(0, shown).join("")} />
      {!done && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary align-middle" aria-hidden />}
    </div>
  );
}
