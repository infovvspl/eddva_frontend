// The modules inside EDDVA AI Learn (the LMS product), as supplied — 14
// modules, each with the capabilities it covers.
//
// Icons are chosen to match each module's name; they are not otherwise
// signed off — swap any that don't read as intended.

import {
  BrainCircuit, Captions, ClipboardCheck, CalendarCheck, MessageCircleQuestion,
  BookMarked, PenTool, LineChart, Presentation, UserRound, Gamepad2,
  HeartPulse, BookOpen, PieChart,
} from "lucide-react";

export const lmsModules = [
  {
    id: "ai-powered-learning", title: "AI-Powered Learning", Icon: BrainCircuit,
    bullets: ["AI-generated notes", "AI-assisted learning resources", "Multilingual learning support", "Personalized learning"],
  },
  {
    id: "lecture-intelligence", title: "Lecture Intelligence", Icon: Captions,
    bullets: ["Lecture transcription", "Lecture summaries", "Key-point extraction", "Searchable learning content"],
  },
  {
    id: "intelligent-assessments", title: "Intelligent Assessments", Icon: ClipboardCheck,
    bullets: ["AI-assisted assessment generation", "Intelligent assessments", "Quizzes/tests", "Performance analysis"],
  },
  {
    id: "personalized-study-planner", title: "Personalized Study Planner", Icon: CalendarCheck,
    bullets: ["Personalized study plans", "Learning schedules", "Progress-based recommendations"],
  },
  {
    id: "doubt-assistance", title: "24×7 Doubt Assistance", Icon: MessageCircleQuestion,
    bullets: ["AI-powered doubt support", "Instant explanations", "Concept clarification"],
  },
  {
    id: "digital-learning-content", title: "Digital Learning Content", Icon: BookMarked,
    bullets: ["Digital notes", "Study materials", "PDFs/documents", "Recorded lectures", "Video learning"],
  },
  {
    id: "assignments-assessments", title: "Assignments & Assessments", Icon: PenTool,
    bullets: ["Digital assignments", "Online submissions", "Online tests", "Question bank", "Results"],
  },
  {
    id: "student-performance", title: "Student Performance", Icon: LineChart,
    bullets: ["Progress tracking", "Assessment analytics", "Learning activity", "Performance insights"],
  },
  {
    id: "teacher-lms", title: "Teacher LMS", Icon: Presentation,
    bullets: ["Content upload", "Assignment management", "Assessment management", "Student monitoring"],
  },
  {
    id: "parent-dashboard", title: "Parent Dashboard", Icon: UserRound,
    bullets: ["Learning activity", "Assignment status", "Assessment performance", "Progress visibility"],
  },
  {
    id: "gamified-learning", title: "Gamified Learning", Icon: Gamepad2,
    bullets: ["Battle Arena", "Competitive learning", "Engagement mechanisms"],
  },
  {
    id: "mental-wellness", title: "Mental Wellness", Icon: HeartPulse,
    bullets: ["Mental wellness support", "Student engagement resources"],
  },
  {
    id: "curriculum-exam-support", title: "Curriculum & Exam Support", Icon: BookOpen,
    bullets: ["NCERT-aligned learning", "Classes I–XII", "Competitive-exam support for senior classes", "Subject/topic organization"],
  },
  {
    id: "learning-analytics", title: "Learning Analytics", Icon: PieChart,
    bullets: ["Engagement analytics", "Learning progress", "Assessment insights", "Student-wise analytics"],
  },
];
