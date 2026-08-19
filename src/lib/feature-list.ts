/**
 * The product features shown on the marketing site. Kept here so the
 * "Request a Demo" form's "Interested feature" dropdown stays in sync with
 * the FeaturesSec showcase (components/home-page/FeaturesSec.tsx).
 */
export const PRODUCT_FEATURES = [
  'Live Interactive Classes',
  'Auto-Recorded Lectures',
  'AI-Generated Study Material',
  '24/7 AI Doubt Solver',
  'Smart Testing & Analytics',
  'Personalized Study Plans',
  'AI Visual Learning',
  'AI Teaching Assistant',
  'Assignment Generator & Tracker',
  'Unified Communication Platform',
] as const;

export type ProductFeature = (typeof PRODUCT_FEATURES)[number];
