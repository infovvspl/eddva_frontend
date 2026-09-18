// values.js — "Our Values" grid on /about.

import { Users, Lightbulb, ShieldCheck, Target } from "lucide-react";

export const values = [
  {
    id: "nw-value-people",
    title: "People First",
    desc: "Students, teachers and institutions at the heart of everything we build.",
    Icon: Users,
    color: "#d97706",
    bg: "#fef3e2",
  },
  {
    id: "nw-value-innovation",
    title: "Innovation",
    desc: "Continuously exploring new ideas to improve education.",
    Icon: Lightbulb,
    color: "#2563eb",
    bg: "#eaf1fd",
  },
  {
    id: "nw-value-integrity",
    title: "Integrity",
    desc: "Transparent, ethical and trustworthy in all we do.",
    Icon: ShieldCheck,
    color: "#16a34a",
    bg: "#eafaef",
  },
  {
    id: "nw-value-impact",
    title: "Impact",
    desc: "Creating meaningful change in the education ecosystem.",
    Icon: Target,
    color: "#7c3aed",
    bg: "#f3efff",
  },
];
