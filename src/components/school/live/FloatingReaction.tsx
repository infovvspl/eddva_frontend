import { useEffect, useState } from 'react';

export interface FloatingItem {
  id: string;
  emoji: string;
  offset: number; // horizontal offset in px
}

/**
 * Renders floating emoji reactions that drift up and fade out over ~2s.
 * Mount once inside a `relative` container; push items via `items`.
 */
export default function FloatingReactionLayer({ items }: { items: FloatingItem[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it) => (
        <FloatingReaction key={it.id} emoji={it.emoji} offset={it.offset} />
      ))}
    </div>
  );
}

function FloatingReaction({ emoji, offset }: { emoji: string; offset: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <span
      className="absolute bottom-4 text-3xl transition-all [transition-duration:2000ms] ease-out"
      style={{
        left: `calc(50% + ${offset}px)`,
        transform: mounted ? 'translateY(-220px) scale(1.4)' : 'translateY(0) scale(0.8)',
        opacity: mounted ? 0 : 1,
      }}
    >
      {emoji}
    </span>
  );
}

/** Helper hook: keeps a transient list of floating reactions, auto-pruned. */
export function useFloatingReactions() {
  const [items, setItems] = useState<FloatingItem[]>([]);
  const push = (emoji: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const offset = Math.round((Math.random() - 0.5) * 120);
    setItems((prev) => [...prev, { id, emoji, offset }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2100);
  };
  return { items, push };
}
