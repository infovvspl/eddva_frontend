// Capability matrix for the products page comparison table.
//
// ⚠ THE TICKS ARE INFERRED AND NOT SIGNED OFF. They are reasoned from the
// product positioning — Combo is stated as "Best of ERP + AI-LMS", the Non-AI
// model is the exam-prep structure with the AI modules removed — and from the
// modules that exist in this repo. Nobody has confirmed the actual commercial
// packaging, and a wrong tick here is a promise to a customer about what they
// are buying. Have sales confirm every cell before this page goes live.
//
// `cols` must stay in the same order as `products` in data/products.js; the
// table reads its column headings, colours and artwork from there.

export const cols = [
  "nw-prod-lms",
  "nw-prod-erp",
  "nw-prod-combo",
  "nw-prod-jee-ai",
  "nw-prod-jee-nonai",
];

/* Each row's `has` array lines up with `cols`. */
export const groups = [
  {
    id: "cmp-delivery",
    label: "Learning delivery",
    rows: [
      { id: "live",      label: "Live interactive classes",       has: [1, 0, 1, 1, 1] },
      { id: "recorded",  label: "Auto-recorded lectures",         has: [1, 0, 1, 1, 1] },
      { id: "content",   label: "Structured content library",     has: [1, 0, 1, 1, 1] },
      { id: "materials", label: "Study materials & notes",        has: [1, 0, 1, 1, 1] },
    ],
  },
  {
    id: "cmp-practice",
    label: "Practice & assessment",
    rows: [
      { id: "quizzes",  label: "Quizzes & assessments",           has: [1, 0, 1, 1, 1] },
      { id: "mocks",    label: "Full-length timed mock tests",    has: [1, 0, 1, 1, 1] },
      { id: "pyq",      label: "Previous-year question bank",     has: [0, 0, 0, 1, 1] },
      { id: "doubts",   label: "Doubt queue",                     has: [1, 0, 1, 1, 1] },
    ],
  },
  {
    id: "cmp-ai",
    label: "AI",
    rows: [
      { id: "ai-material", label: "AI-generated study material",  has: [1, 0, 1, 1, 0] },
      { id: "ai-tutor",    label: "AI study assistant",           has: [1, 0, 1, 1, 0] },
      { id: "ai-plan",     label: "Personalised AI study plan",   has: [1, 0, 1, 1, 0] },
      { id: "ai-analysis", label: "AI test analysis & weak-topic detection", has: [0, 0, 0, 1, 0] },
    ],
  },
  {
    id: "cmp-engagement",
    label: "Engagement",
    rows: [
      { id: "gamify", label: "Gamification & leaderboards",       has: [1, 0, 1, 1, 0] },
      { id: "battle", label: "Battle Arena",                      has: [1, 0, 1, 1, 0] },
    ],
  },
  {
    id: "cmp-admin",
    label: "Administration",
    rows: [
      { id: "lifecycle",  label: "Student & staff lifecycle",     has: [0, 1, 1, 0, 0] },
      { id: "fees",       label: "Fees, accounts & finance",      has: [0, 1, 1, 0, 0] },
      { id: "timetable",  label: "Class, timetable & scheduling", has: [0, 1, 1, 0, 1] },
      { id: "attendance", label: "Attendance",                    has: [0, 1, 1, 0, 1] },
      { id: "roles",      label: "Roles & permissions",           has: [0, 1, 1, 0, 0] },
      { id: "audit",      label: "Reports & audit logs",          has: [0, 1, 1, 0, 0] },
    ],
  },
  {
    id: "cmp-everywhere",
    label: "Across every plan",
    rows: [
      { id: "analytics", label: "Analytics dashboards",           has: [1, 1, 1, 1, 1] },
      { id: "comms",     label: "Communication & announcements",  has: [1, 1, 1, 1, 1] },
      { id: "devices",   label: "Web, tablet & mobile access",    has: [1, 1, 1, 1, 1] },
    ],
  },
];
