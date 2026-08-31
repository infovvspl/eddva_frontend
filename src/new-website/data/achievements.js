// Shared credential copy.
// Used by AchievementsSection (home page badge grid) and AwardsTimeline
// (the vertical timeline on /new-website/about).

import { Award, ShieldCheck, Rocket, BadgeCheck } from "lucide-react";

export const achievements = [
  {
    id: "nw-ach-odisha",
    title: "ODISHA ACHIEVERS",
    subtitle: "AWARD 2026",
    Icon: Award,
    color: "#b45309",
    bg: "#fffbeb",
    ring: "#fde68a",
  },
  {
    id: "nw-ach-iso",
    title: "CERTIFIED",
    subtitle: "ISO 27001:2022",
    Icon: ShieldCheck,
    color: "#1a56db",
    bg: "#eff6ff",
    ring: "#bfdbfe",
  },
  {
    id: "nw-ach-startup",
    title: "STARTUP INDIA",
    subtitle: "RECOGNIZED",
    Icon: Rocket,
    color: "#16a34a",
    bg: "#f0fdf4",
    ring: "#bbf7d0",
  },
  {
    id: "nw-ach-msme",
    title: "MSME",
    subtitle: "REGISTERED",
    Icon: BadgeCheck,
    color: "#7c3aed",
    bg: "#f5f3ff",
    ring: "#ddd6fe",
  },
];
