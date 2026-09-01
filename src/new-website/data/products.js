// Shared product copy.
// Used by ProductsSection (home page card grid) and ProductCompare (the
// capability matrix on /products, which also supplies its column
// order from data/comparison.js).
//
// Artwork lives in `img`. The last product has no illustration supplied yet, so
// it falls back to `Icon`; drop an "Icon 5.png" beside the others, import it
// and set `img` to switch it over.
//
// `title` and `desc` are the original signed-off strings — the home page card
// grid still renders exactly those, untouched.
//
// `tagline`, `bullets`, `cta` and `TileIcon` were added for the products page
// and are transcribed from the supplied design mockup, so the wording is the
// mockup's rather than mine. Check them against what the team wants to claim
// before launch.

import { BookOpen, MonitorPlay, Landmark, Boxes, BrainCircuit, GraduationCap } from "lucide-react";
import iconLms   from "../assets/Icon 1.png";
import iconErp   from "../assets/Icon 2.png";
import iconCombo from "../assets/Icon 3.png";
import iconJee   from "../assets/Icon 4.png";

export const products = [
  {
    id: "nw-prod-lms",
    title: "AI-LMS",
    desc: "AI-powered LMS with smart content, assessments, analytics and more.",
    tagline: "Next-Gen Learning Management System",
    TileIcon: MonitorPlay,
    cta: "Book a Free Demo",
    bullets: [
      "Interactive live & recorded classes",
      "AI-generated study plans",
      "Smart quizzes, assessments & analytics",
      "Gamification and leaderboards",
    ],
    img: iconLms,
    color: "#7c3aed",
    bg: "#faf8ff",
    border: "#ece5fd",
    btn: "#7c3aed",
    btnHover: "#6d28d9",
  },
  {
    id: "nw-prod-erp",
    title: "ERP",
    desc: "Manage academic, administrative & financial operations seamlessly.",
    tagline: "Run Your Institution Seamlessly",
    TileIcon: Landmark,
    cta: "Request a Demo",
    bullets: [
      "Student & staff lifecycle management",
      "Fees, accounts & finance automation",
      "Class, timetable & resource scheduling",
      "Detailed reports & audit logs",
    ],
    img: iconErp,
    color: "#16a34a",
    bg: "#f5fbf7",
    border: "#dcf0e3",
    btn: "#16a34a",
    btnHover: "#15803d",
  },
  {
    id: "nw-prod-combo",
    title: "Combo",
    desc: "Get the best of ERP + AI-LMS in one integrated platform.",
    tagline: "Best of ERP + AI-LMS",
    TileIcon: Boxes,
    cta: "Know More",
    bullets: [
      "Unified login, unified data",
      "Smarter operations with AI",
      "Seamless experience for institutes, teachers & students",
      "Scale faster with a single solution",
    ],
    img: iconCombo,
    color: "#2563eb",
    bg: "#f5f9ff",
    border: "#dceafd",
    btn: "#2563eb",
    btnHover: "#1d4ed8",
  },
  {
    id: "nw-prod-jee-ai",
    title: "JEE / NEET\n(AI Model)",
    desc: "AI-driven learning & practice for competitive exam success.",
    tagline: "AI-Powered Preparation for Top Ranks",
    TileIcon: BrainCircuit,
    cta: "Explore Now",
    bullets: [
      "AI-based test analysis & weak topic detection",
      "Personalised study path for each student",
      "Full-length & chapter-wise mock tests",
      "Instant performance feedback",
    ],
    img: iconJee,
    color: "#ea580c",
    bg: "#fff8f2",
    border: "#fde5d2",
    btn: "#f97316",
    btnHover: "#ea580c",
  },
  {
    id: "nw-prod-jee-nonai",
    title: "JEE / NEET\n(Non-AI Model)",
    desc: "Structured content & tests for effective exam preparation.",
    tagline: "Structured Content & Practice",
    TileIcon: GraduationCap,
    cta: "Explore Now",
    bullets: [
      "Well-structured syllabus coverage",
      "Previous year questions & topic-wise practice",
      "Timed mock tests and assessments",
      "Teacher-set assignments & progress reports",
    ],
    Icon: BookOpen,
    color: "#0f766e",
    bg: "#f2fafa",
    border: "#d5eeec",
    btn: "#0f766e",
    btnHover: "#115e59",
  },
];
