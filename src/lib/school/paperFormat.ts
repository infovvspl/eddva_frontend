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

// ── generated-header removal ────────────────────────────────────────────────────────────────

/**
 * The AI paper generator starts every paper with its own title, class / subject / marks / time
 * lines and a "General Instructions" list. The school header already prints all of that, so when
 * it is shown the generated block is dropped to avoid everything appearing twice.
 *
 * Only the leading block is touched: it ends at the first "Section A" / "Part B" heading (or the
 * rule or heading that closes the instructions). If no clear end is found, only the title and
 * detail lines before the instructions are removed and the questions are never at risk.
 */
export function stripGeneratedHeader(markdown: string): string {
  const text = String(markdown || '');
  if (!text.trim()) return text;
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  const stripMd = (l: string) => l.replace(/^[\s#>*_`-]+|[\s*_`:]+$/g, '').replace(/\*\*/g, '').trim();
  const isSection = (l: string) => /^\s*(?:#{1,6}\s*)?(?:\*\*|__)?\s*(?:section|part)\s+[A-Za-z0-9IVX]+\b/i.test(l);
  const isInstrHeading = (l: string) => {
    const t = stripMd(l);
    return t.length > 0 && t.length <= 70 && /instructions?|directions?|note\b/i.test(t) && !/^\s*\d+[.)]/.test(l);
  };
  const isListItem = (l: string) => /^\s*(?:\d+[.)]|[-*+•]|\([a-z0-9ivx]+\))\s+\S/.test(l);
  const isMeta = (l: string) =>
    /^\s*(?:[-*>]\s*)?(?:\*\*|__)?\s*(class|subject|maximum marks|max\.?\s*marks|total marks|full marks|marks|time allowed|time|duration|date|session|chapter|topic|name|roll)\b[^|]{0,60}[:–-]/i.test(l) ||
    /(?:maximum|total|full)\s+marks\s*[:–-]|time\s+allowed\s*[:–-]/i.test(l);
  const isRule = (l: string) => /^\s*(?:-{3,}|\*{3,}|_{3,}|={3,})\s*$/.test(l);
  const isHeadingLine = (l: string) => /^\s*#{1,6}\s+\S/.test(l);

  let i = 0;
  let sawHeaderBlock = false;
  let inInstructions = false;
  let end = -1;

  for (; i < lines.length; i += 1) {
    const l = lines[i];
    if (!l.trim()) continue;

    if (isSection(l)) { end = i; break; }

    if (isInstrHeading(l)) { inInstructions = true; sawHeaderBlock = true; continue; }

    if (inInstructions) {
      if (isListItem(l)) continue;
      if (isRule(l)) { end = i + 1; break; }
      if (isHeadingLine(l)) { end = i; break; }
      // plain sentence inside the instructions — keep consuming until a clear end
      if (l.trim().length < 160) continue;
      end = i; break;
    }

    if (isRule(l) || isMeta(l) || isHeadingLine(l) || /^\s*(?:\*\*|__).{0,90}(?:\*\*|__)\s*$/.test(l)) {
      sawHeaderBlock = true;
      continue;
    }

    // first line of real content
    end = i;
    break;
  }

  if (!sawHeaderBlock) return text;

  if (end < 0) {
    // Ran off the end while still inside the instructions: nothing safe to cut.
    return text;
  }
  const rest = lines.slice(end).join('\n').replace(/^\s*\n/, '');
  return rest.trim() ? rest : text;
}
