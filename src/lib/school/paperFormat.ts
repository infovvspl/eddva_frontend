/**
 * Question-paper format: the school-style header (school name, class / section, subject, time,
 * marks, instructions...) printed on a generated paper.
 *
 * Two kinds of fields:
 *  - per-test values (class, subject, title, marks, time, date) are filled in from the test itself
 *    and can be overridden for one paper;
 *  - school-level values (name, affiliation, logo, instructions, toggles) can be saved as the
 *    school's default, so every paper afterwards starts with the same letterhead.
 */

export interface PaperFormat {
  // school-level
  schoolName: string;
  affiliation: string;
  logo: string;
  session: string;
  instructions: string; // one instruction per line
  footerNote: string;
  showLogo: boolean;
  showAffiliation: boolean;
  showInstructions: boolean;
  showStudentFields: boolean;
  showBorder: boolean;
  // per-test
  examTitle: string;
  className: string;
  sectionName: string;
  subjectName: string;
  date: string;
  timeAllowed: string;
  maxMarks: string;
}

export const DEFAULT_INSTRUCTIONS = [
  'All questions are compulsory unless stated otherwise.',
  'Read each question carefully before you answer.',
  'The marks for each question are shown against it.',
  'Write your name, class and roll number in the space provided.',
  'Neat and well-presented answers will be rewarded.',
].join('\n');

const SCHOOL_LEVEL_KEYS = [
  'schoolName', 'affiliation', 'logo', 'session', 'instructions', 'footerNote',
  'showLogo', 'showAffiliation', 'showInstructions', 'showStudentFields', 'showBorder',
] as const;

export type SchoolLevelKey = (typeof SCHOOL_LEVEL_KEYS)[number];

export const SCHOOL_DEFAULTS: Pick<PaperFormat, SchoolLevelKey> = {
  schoolName: '',
  affiliation: '',
  logo: '',
  session: '',
  instructions: DEFAULT_INSTRUCTIONS,
  footerNote: '',
  showLogo: true,
  showAffiliation: true,
  showInstructions: true,
  showStudentFields: true,
  showBorder: true,
};

/** Academic session label, e.g. 2026-27 (the Indian school year starts in April). */
export function currentSession(now = new Date()): string {
  const y = now.getFullYear();
  const start = now.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/** 120 -> "2 hours", 90 -> "1 hour 30 minutes", 45 -> "45 minutes". */
export function formatTimeAllowed(minutes: number | string | undefined | null): string {
  const m = Math.round(Number(minutes) || 0);
  if (m <= 0) return '';
  const h = Math.floor(m / 60);
  const r = m % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`);
  if (r) parts.push(`${r} ${r === 1 ? 'minute' : 'minutes'}`);
  return parts.join(' ');
}

export function formatPaperDate(raw: string | undefined | null): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function instructionLines(format: PaperFormat): string[] {
  return String(format.instructions || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean);
}

// ── persistence (per school, in this browser) ───────────────────────────────────────────────

const storageKey = (instituteId?: string | null) => `eddva:paper-format:${instituteId || 'default'}`;

export function loadSavedFormat(instituteId?: string | null): Partial<Pick<PaperFormat, SchoolLevelKey>> {
  try {
    const raw = localStorage.getItem(storageKey(instituteId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out: Record<string, unknown> = {};
    SCHOOL_LEVEL_KEYS.forEach((k) => { if (k in parsed) out[k] = parsed[k]; });
    return out as Partial<Pick<PaperFormat, SchoolLevelKey>>;
  } catch {
    return {};
  }
}

export function saveFormatAsDefault(instituteId: string | null | undefined, format: PaperFormat): boolean {
  try {
    const subset: Record<string, unknown> = {};
    SCHOOL_LEVEL_KEYS.forEach((k) => { subset[k] = format[k]; });
    localStorage.setItem(storageKey(instituteId), JSON.stringify(subset));
    return true;
  } catch {
    return false; // quota (large logo) or storage blocked
  }
}

export function clearSavedFormat(instituteId?: string | null) {
  try { localStorage.removeItem(storageKey(instituteId)); } catch { /* ignore */ }
}

/** Plain-text safety: a paper in a script jsPDF's built-in font can't draw (Hindi, Odia...). */
export function needsUnicodeFont(text: string): boolean {
  // Latin-1 plus the common typographic punctuation block are fine; everything else is not.
  return /[^\u0000-ÿ‐-‧‰-›€™←-⇿∀-⋿²³]/.test(text);
}
