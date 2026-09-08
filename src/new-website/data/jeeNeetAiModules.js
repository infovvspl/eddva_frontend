// The modules inside EDDVA JEE NEET AI — the AI-driven exam-prep product.
// Same shape as erpModules/lmsModules (id, title, Icon, desc, bullets) so it
// renders through the shared ModuleAccordion.
//
// Written from the product's own bullets in data/products.js and the
// AI-tools/practice-&-assess groups already shipped for Students in
// data/solutions.js — this is the AI-first product, so AI capabilities lead.

import {
  Sparkles, BrainCircuit, Target, ListChecks, ScrollText,
  BarChart3, MonitorPlay, Trophy,
} from "lucide-react";

export const jeeNeetAiModules = [
  {
    id: "ai-study-plan", title: "AI Study Plan", Icon: Sparkles,
    desc: "A day-wise plan generated from a diagnostic test and your pace, so revision time goes where it's actually needed.",
    bullets: ["Diagnostic test to map your starting level", "AI-generated day-wise study plan", "Plan adjusts as you progress", "Reminders for what's due"],
  },
  {
    id: "ai-study-assistant", title: "AI Study Assistant", Icon: BrainCircuit,
    desc: "Ask a doubt on any topic and get a worked explanation back, any time — not just during class hours.",
    bullets: ["Ask a question on any topic", "Step-by-step worked explanations", "Available 24×7", "Covers Physics, Chemistry, Biology/Maths"],
  },
  {
    id: "weak-topic-detection", title: "Weak-Topic Detection", Icon: Target,
    desc: "Pinpoints exactly which topics are costing marks from actual test performance, not guesswork.",
    bullets: ["Topic-level accuracy tracking", "Automatic weak-area flagging", "Suggested practice for weak topics", "Progress re-check after practice"],
  },
  {
    id: "mock-tests-analysis", title: "Mock Tests & Analysis", Icon: ListChecks,
    desc: "Full-length and chapter-wise mock tests with an instant, question-by-question breakdown.",
    bullets: ["Full-length mock tests", "Chapter-wise tests", "Instant scoring", "Question-by-question analysis"],
  },
  {
    id: "pyq-bank", title: "PYQ Bank", Icon: ScrollText,
    desc: "Previous-year questions organized by topic and year, with solutions attached.",
    bullets: ["Year-wise and topic-wise PYQs", "Solutions with explanations", "Practice mode and timed mode"],
  },
  {
    id: "performance-analytics", title: "Performance Analytics", Icon: BarChart3,
    desc: "Tracks score trends and estimated rank over time, not just the last test's result.",
    bullets: ["Score trends over time", "Percentile/rank estimation", "Subject-wise strength map", "Comparison with batch average"],
  },
  {
    id: "live-recorded-classes", title: "Live & Recorded Classes", Icon: MonitorPlay,
    desc: "Live sessions for pace and doubt-clearing, recordings for revisiting any topic later.",
    bullets: ["Live interactive classes", "Recorded lecture library", "Doubt resolution during class"],
  },
  {
    id: "gamified-practice", title: "Gamified Practice", Icon: Trophy,
    desc: "Streaks, leaderboards and badges to keep daily revision consistent through a long prep cycle.",
    bullets: ["Daily practice streaks", "Leaderboards", "Badges and rewards"],
  },
];
