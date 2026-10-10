// Shared services and stakeholder copy.
// Used by ServicesSection (the home page band) and, on /solution, by
// SolutionAudience and SolutionRoles.
//
// `title` and `desc` are the original signed-off strings. `covers` was added
// for the solution page: each entry names a module that ships in this repo,
// but which modules belong to the school vs institute pitch is my inference —
// have it confirmed.

import { UserCog, BookUser, UserRound, Users } from "lucide-react";
import { SchoolGlyph, CapGlyph, UniversityGlyph } from "../components/ServiceGlyphs";

export const services = [
  {
    id: "nw-svc-schools",
    title: "For Schools",
    desc: "Simplify school operations, engage parents, empower teachers and enhance learning.",
    covers: [
      "Admissions, promotion and student records",
      "Daily attendance and timetable",
      "Fees, accounts and report cards",
      "Parent communication and notices",
    ],
    Icon: SchoolGlyph,
    color: "#ffffff",
    bg: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
  },
  {
    id: "nw-svc-institutes",
    title: "For Institutes",
    desc: "Advanced tools for coaching, entrance preparation and academic excellence.",
    covers: [
      "Batches, live classes and recordings",
      "Mock tests and previous-year questions",
      "AI study plans and weak-topic analysis",
      "Leaderboards and performance analytics",
    ],
    Icon: CapGlyph,
    color: "#ffffff",
    bg: "linear-gradient(135deg, #c084fc, #7c3aed)",
  },
  {
    id: "nw-svc-universities",
    title: "For Universities",
    desc: "One platform across departments and programs — nursing, PG, management and graduation courses alike.",
    covers: [
      "Multi-department and multi-program setup",
      "Semester-wise academics and examinations",
      "Faculty, batch and course management",
      "Institution-wide analytics and reporting",
    ],
    Icon: UniversityGlyph,
    color: "#ffffff",
    bg: "linear-gradient(135deg, #fb923c, #c2410c)",
  },
];

// Order: Institute Admin, Teachers, Students, Parents — matches the order
// used for the same four stakeholders in data/solutions.js.
export const stakeholders = [
  {
    id: "nw-sh-admin",
    title: "Institute Admin",
    desc: "Streamlined operations, data & decision-making.",
    Icon: UserCog,
    color: "#dc2626",
    bg: "#fff1f2",
  },
  {
    id: "nw-sh-teachers",
    title: "Teachers",
    desc: "Smart tools, lesson planning, assessments & insights.",
    Icon: BookUser,
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    id: "nw-sh-students",
    title: "Students",
    desc: "Personalized learning paths, progress tracking & more.",
    Icon: UserRound,
    color: "#1a56db",
    bg: "#eff6ff",
  },
  {
    id: "nw-sh-parents",
    title: "Parents",
    desc: "Real-time updates, communication & performance reports.",
    Icon: Users,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
];
