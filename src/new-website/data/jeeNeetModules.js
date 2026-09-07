// The modules inside EDDVA JEE NEET — the structured, teacher-led exam-prep
// product (the non-AI counterpart to EDDVA JEE NEET AI). Same shape as
// erpModules/lmsModules (id, title, Icon, desc, bullets) so it renders
// through the shared ModuleAccordion.
//
// Written from the product's own bullets in data/products.js — deliberately
// framed around structure and teacher oversight rather than AI, so the two
// JEE NEET products keep reading as genuinely different tiers.

import {
  BookOpen, ScrollText, Timer, ClipboardList, BookMarked,
  MonitorPlay, FileBarChart, Boxes,
} from "lucide-react";

export const jeeNeetModules = [
  {
    id: "structured-syllabus", title: "Structured Syllabus", Icon: BookOpen,
    desc: "The full JEE/NEET syllabus broken into chapters and topics, laid out against the exam pattern.",
    bullets: ["Complete syllabus coverage", "Chapter and topic breakdown", "Aligned to the exam pattern"],
  },
  {
    id: "previous-year-questions", title: "Previous Year Questions", Icon: ScrollText,
    desc: "Previous-year questions organized by topic, with answer keys attached for focused practice.",
    bullets: ["Topic-wise PYQ sets", "Year-wise archives", "Answer keys and solutions"],
  },
  {
    id: "timed-mock-tests", title: "Timed Mock Tests", Icon: Timer,
    desc: "Full-length and sectional tests run under real exam timing, scored instantly.",
    bullets: ["Full-length mock tests", "Sectional/chapter tests", "Exam-pattern timing", "Instant scoring"],
  },
  {
    id: "teacher-assignments", title: "Teacher-Set Assignments", Icon: ClipboardList,
    desc: "Assignments set and graded by teachers, so progress is checked by a person, not just a score.",
    bullets: ["Assignment creation by teachers", "Submission tracking", "Manual grading", "Progress reports"],
  },
  {
    id: "study-materials", title: "Study Materials", Icon: BookMarked,
    desc: "Notes and reference material for every topic, ready to download.",
    bullets: ["Topic-wise notes", "Downloadable PDFs", "Reference material"],
  },
  {
    id: "live-recorded-classes", title: "Live & Recorded Classes", Icon: MonitorPlay,
    desc: "Live classes for pace and doubts, with recordings to revisit any session later.",
    bullets: ["Live interactive classes", "Recorded lecture library", "Doubt resolution sessions"],
  },
  {
    id: "performance-reports", title: "Performance Reports", Icon: FileBarChart,
    desc: "Consolidated results across tests and terms, not just one score in isolation.",
    bullets: ["Test-wise results", "Term-wise report card", "Attendance record"],
  },
  {
    id: "batch-management", title: "Batch Management", Icon: Boxes,
    desc: "Students organized into batches, each with its own timetable and performance view.",
    bullets: ["Batch creation", "Batch-wise timetable", "Batch-wise performance view"],
  },
];
