// Shared About copy.
// Used by AboutSection (home page card grid) and AboutPillars (the numbered
// editorial list on /about) so the two surfaces never drift.

import { BrainCircuit, Cog, ScanEye, ShieldCheck } from "lucide-react";

export const aboutCards = [
  {
    id: "nw-about-card-ai",
    title: "AI-Powered Learning",
    desc: "AI-generated notes, smart assessments and personalized learning paths.",
    Icon: BrainCircuit,
    color: "#2563eb",
    bg: "#eaf1fd",
  },
  {
    id: "nw-about-card-auto",
    title: "Smart School Automation",
    desc: "Automate attendance, timetable, fees, communication and more.",
    Icon: Cog,
    color: "#0891b2",
    bg: "#e6fafd",
  },
  {
    id: "nw-about-card-visibility",
    title: "360° Visibility",
    desc: "Real-time insights and reports for better decisions.",
    Icon: ScanEye,
    color: "#16a34a",
    bg: "#eafaef",
  },
  {
    id: "nw-about-card-secure",
    title: "Secure & Reliable",
    desc: "Enterprise-grade security to keep your data safe.",
    Icon: ShieldCheck,
    color: "#7c3aed",
    bg: "#f3efff",
  },
];
