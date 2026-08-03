import api from '@/lib/api/school-client';

// ── Types ───────────────────────────────────────────────────────────────────
export interface AstroInput {
  fullName: string;
  dateOfBirth: string;   // YYYY-MM-DD
  timeOfBirth?: string;  // HH:mm, optional
  placeOfBirth: string;
  gender?: string;       // optional
}

export interface ScoredTrait {
  key: string;
  label: string;
  score: number;
  blurb: string;
}

export interface ScoredCareer {
  key: string;
  label: string;
  match: number;
  rationale: string;
}

export interface TimelineStage {
  key: string;
  label: string;
  note: string;
}

export interface AstroReport {
  demo: true;
  disclaimer: string;
  overview: {
    fullName: string;
    dateOfBirth: string;
    timeOfBirth: string | null;
    placeOfBirth: string;
    gender: string | null;
    generatedOn: string;
    insightScore: number;
    /** Short hash of the inputs — two people can check they see the same report. */
    profileId: string;
  };
  personality: ScoredTrait[];
  learning: ScoredTrait[];
  academics: ScoredTrait[];
  careers: ScoredCareer[];
  strengths: ScoredTrait[];
  growthAreas: ScoredTrait[];
  timeline: TimelineStage[];
  suggestions: {
    bestSession: string;
    dailyDuration: string;
    breakPattern: string;
    revision: string;
    weeklyGoal: string;
    quote: { text: string; author: string };
  };
  summary: string;
}

// ── Calls ───────────────────────────────────────────────────────────────────

/**
 * Generate the illustrative profile.
 *
 * Deterministic on the server: the same details always return the same report,
 * so there is nothing to cache here and re-submitting is safe.
 */
export async function generateAstroReport(input: AstroInput): Promise<AstroReport> {
  // school-client prefixes /school itself, so this resolves to
  // /school/astro/generate — matching @Controller('school/astro').
  const res = await api.post('/astro/generate', input);
  return res?.data?.data ?? res?.data;
}
