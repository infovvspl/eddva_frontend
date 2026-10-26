/**
 * Shared "Xh Ym" / "Xm Ys" formatter — several pages (recorded-class duration,
 * live-dashboard timers, watch time) had near-identical copies of this; this
 * is the one place it should live now.
 */
export function formatDuration(seconds?: number | null): string | null {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Same unit, shorter form for a tight stat card ("1h 12m" without seconds). */
export function formatDurationShort(seconds?: number | null): string {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
