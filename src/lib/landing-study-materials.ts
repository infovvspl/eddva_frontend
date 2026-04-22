import type { StudyMaterialExam } from "@/lib/api/study-material";

/**
 * URL segment (e.g. /exam/iit-jee, /study-material/iit-jee) → `exam` stored in DB
 * and sent to GET /tenants/public/study-materials?exam=…
 *
 * Admin must set the same exam (JEE / NEET) when creating study materials, or the
 * catalog stays empty for that track.
 */
export const LANDING_TRACK_TO_EXAM = {
  "iit-jee": "jee",
  "neet-ug": "neet",
} as const satisfies Record<string, StudyMaterialExam>;

export type LandingStudyTrack = keyof typeof LANDING_TRACK_TO_EXAM;

export function landingTrackToExam(track: string | undefined): StudyMaterialExam | undefined {
  if (!track) return undefined;
  return LANDING_TRACK_TO_EXAM[track as LandingStudyTrack];
}
