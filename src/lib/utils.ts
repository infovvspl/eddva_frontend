import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeSubjectName(name: string | null | undefined): string {
  if (!name) return '';
  const cleaned = name.trim().replace(/\s+/g, ' ');
  const lowerCleaned = cleaned.toLowerCase();
  
  if (lowerCleaned === 'math' || lowerCleaned === 'maths' || lowerCleaned === 'mathematics') {
    return 'Mathematics';
  }
  if (lowerCleaned === 'hindi') {
    return 'Hindi';
  }
  if (lowerCleaned === 'english') {
    return 'English';
  }
  if (lowerCleaned === 'science') {
    return 'Science';
  }
  if (lowerCleaned === 'biology') {
    return 'Biology';
  }
  if (lowerCleaned === 'computer science') {
    return 'Computer Science';
  }
  if (lowerCleaned === 'social science') {
    return 'Social Science';
  }
  if (lowerCleaned === 'history') {
    return 'History';
  }
  
  // Title case general words
  return cleaned
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Converts a hex color (#rgb or #rrggbb) to an "H S% L%" triplet, the format
 * this project's `--primary` etc. CSS vars expect (consumed as `hsl(var(--primary))`).
 * Returns null for invalid input so callers can fall back to the default theme.
 */
export function hexToHslTriplet(hex: string | null | undefined): string | null {
  if (!hex) return null;
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: hue = ((g - b) / d) % 6; break;
      case g: hue = (b - r) / d + 2; break;
      default: hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Picks black or white foreground text for a given hex background, for contrast. */
export function contrastForegroundHsl(hex: string | null | undefined): string {
  if (!hex) return '0 0% 100%';
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return '0 0% 100%';
  let h = m[1];
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceptual luminance (sRGB, unweighted for gamma — good enough for a contrast pick)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '0 0% 9%' : '0 0% 100%';
}
