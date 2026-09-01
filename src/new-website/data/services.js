// Shared services and stakeholder copy.
// Used by ServicesSection (the home page band) and SolutionPanels (the split
// panels and stakeholder rows on /solution).

import { Users, BookUser, UserRound, ShieldCheck } from "lucide-react";
import { SchoolGlyph, CapGlyph } from "../components/ServiceGlyphs";

export const services = [
  {
    id: "nw-svc-schools",
    title: "For Schools",
    desc: "Simplify school operations, engage parents, empower teachers and enhance learning.",
    Icon: SchoolGlyph,
    color: "#1a56db",
    bg: "#eff6ff",
  },
  {
    id: "nw-svc-institutes",
    title: "For Institutes",
    desc: "Advanced tools for coaching, entrance preparation and academic excellence.",
    Icon: CapGlyph,
    color: "#7c3aed",
    bg: "#f5f3ff",
  },
];

export const stakeholders = [
  {
    id: "nw-sh-students",
    title: "Students",
    desc: "Personalized learning paths, progress tracking & more.",
    Icon: Users,
    color: "#1a56db",
    bg: "#eff6ff",
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
    id: "nw-sh-parents",
    title: "Parents",
    desc: "Real-time updates, communication & performance reports.",
    Icon: UserRound,
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  {
    id: "nw-sh-admin",
    title: "Institute Admin",
    desc: "Streamlined operations, data & decision-making.",
    Icon: ShieldCheck,
    color: "#dc2626",
    bg: "#fff1f2",
  },
];
