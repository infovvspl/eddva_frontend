import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, FileText, Trash2, X, ChevronRight,
  Eye, EyeOff, ClipboardList, Clock, CheckCircle2,
  AlertCircle, Pencil, ArrowLeft, Sparkles, Wand2,
  Check, Upload, Download, Users, Search,
  BookOpen, Layers, Target, ImagePlus, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useMockTests, useCreateMockTest, useDeleteMockTest, usePublishMockTest,
  useMockTestDetail, useUpdateMockTest, useRemoveQuestionFromMockTest, useBatches,
  useBatch, useSubjects, useChapters, useTopics,
} from "@/hooks/use-admin";
import { useUpload } from "@/hooks/use-upload";
import { createQuestion, aiGenerateMockTestQuestions } from "@/lib/api/admin";
import type {
  CreateMockTestQuestionPayload, AiGeneratedQuestion, Batch, MockAiGenerateType, MockTestQuestion,
} from "@/lib/api/admin";
import { getApiOrigin } from "@/lib/api-config";

// ─── URL resolver (relative paths → absolute backend URL) ────────────────────

const API_ORIGIN = getApiOrigin() || "http://127.0.0.1:3000";

function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BLUE = "#013889";
const BLUE_M = "#0257c8";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-600",
  medium: "bg-amber-500/10 text-amber-600",
  hard: "bg-rose-500/10 text-rose-600",
};

const TYPE_COLORS: Record<string, string> = {
  diagnostic:    "bg-violet-500/10 text-violet-600",
  full_mock:     "bg-blue-500/10 text-blue-600",
  subject_test:  "bg-sky-500/10 text-sky-600",
  chapter_test:  "bg-emerald-500/10 text-emerald-600",
  topic_test:    "bg-violet-500/10 text-violet-600",
  subtopic_drill:"bg-fuchsia-500/10 text-fuchsia-600",
  speed_test:    "bg-orange-500/10 text-orange-600",
  pyq:           "bg-amber-500/10 text-amber-600",
  revision:      "bg-teal-500/10 text-teal-600",
};

const TYPE_LABELS: Record<string, string> = {
  diagnostic:    "Diagnostic",
  full_mock:     "Full Mock",
  subject_test:  "Subject Test",
  chapter_test:  "Chapter Test",
  topic_test:    "Topic Test",
  subtopic_drill:"Subtopic Drill",
  speed_test:    "Speed Test",
  pyq:           "PYQ",
  revision:      "Revision",
};

const EXAM_CONFIGS: Record<string, { subjects: string[]; topics: string[]; description: string }> = {
  JEE: {
    subjects: ["Physics", "Chemistry", "Mathematics"],
    topics: [
      "Physics: Mechanics, Electrostatics & Magnetism, Modern Physics, Optics, Thermodynamics",
      "Chemistry: Physical Chemistry (Mole Concept, Equilibrium, Electrochemistry), Organic Chemistry (Reactions, Named Reactions), Inorganic Chemistry (p-block, d-block, coordination)",
      "Mathematics: Calculus (Differentiation, Integration, Limits), Algebra (Complex Numbers, Matrices, Binomial Theorem), Coordinate Geometry, Trigonometry, Probability",
    ],
    description: "JEE (Joint Entrance Examination) for IIT/NIT admissions",
  },
  NEET: {
    subjects: ["Physics", "Chemistry", "Biology"],
    topics: [
      "Physics: Mechanics, Thermodynamics, Electrostatics, Optics, Modern Physics",
      "Chemistry: Physical Chemistry, Organic Chemistry, Inorganic Chemistry",
      "Biology: Cell Biology, Genetics, Human Physiology, Plant Physiology, Ecology, Evolution",
    ],
    description: "NEET (National Eligibility cum Entrance Test) for medical admissions",
  },
  CBSE_10: {
    subjects: ["Mathematics", "Science", "Social Science"],
    topics: [
      "Mathematics: Real Numbers, Polynomials, Linear Equations, Triangles, Coordinate Geometry, Trigonometry, Statistics",
      "Science: Chemical Reactions, Life Processes, Light, Electricity, Magnetic Effects, Natural Resources",
      "Social Science: India & Contemporary World, Democratic Politics, Understanding Economic Development",
    ],
    description: "CBSE Class 10 Board Examination",
  },
  CBSE_12: {
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    topics: [
      "Physics: Electrostatics, Current Electricity, Magnetism, Optics, Atoms & Nuclei, Semiconductors",
      "Chemistry: Solutions, Electrochemistry, Coordination Compounds, Aldehydes, Amines, Polymers",
      "Mathematics: Relations, Inverse Trigonometry, Matrices, Determinants, Integrals, Differential Equations, Probability",
    ],
    description: "CBSE Class 12 Board Examination",
  },
};

// ─── Question format preset (Test details → manual + AI) ────────────────────
// CBSE exams use the standard academic lanes: MCQ, short answer, detailed answer, case study, and diagram.

type QuestionMixId =
  | "comp_mcq"
  | "comp_assertion_reason"
  | "comp_statement"
  | "comp_match"
  | "comp_diagram"
  | "comp_msq"
  | "comp_int"
  | "comp_all"
  | "acad_mcq"
  | "acad_assertion_reason"
  | "acad_short_answer"
  | "acad_detailed_answer"
  | "acad_case_study"
  | "acad_diagram"
  | "acad_all"
  | "acad_all";

const QUESTION_MIX_CHOICES: { id: QuestionMixId; group: string; label: string; hint: string }[] = [
  { id: "comp_assertion_reason", group: "Competitive (JEE / NEET / similar)", label: "Assertion reason based", hint: "Assertion-reason style with explicit evaluation of both statements and final conclusion." },
  { id: "comp_statement", group: "Competitive (JEE / NEET / similar)", label: "Statement based", hint: "Statement truth/evaluation style with direct conceptual verification." },
  { id: "comp_mcq", group: "Competitive (JEE / NEET / similar)", label: "MCQ based", hint: "Single-correct objective pattern with competitive marking." },
  { id: "comp_match", group: "Competitive (JEE / NEET / similar)", label: "Match the following based", hint: "Column matching style with clear mapping answer." },
  { id: "comp_int", group: "Competitive (JEE / NEET / similar)", label: "Integer based", hint: "Single integer/numerical answer pattern." },
  { id: "comp_diagram", group: "Competitive (JEE / NEET / similar)", label: "Diagram based", hint: "Diagram/label/identification style for any subject." },
  { id: "comp_msq", group: "Competitive (JEE / NEET / similar)", label: "MSQ", hint: "Multi-correct objective style." },
  { id: "comp_all", group: "Competitive (JEE / NEET / similar)", label: "Mix of all", hint: "Balanced mix across assertion, statement, MCQ, match, integer, diagram, and MSQ." },
  { id: "acad_mcq", group: "Academics (Board / School style)", label: "MCQ based", hint: "Academic objective MCQ format." },
  { id: "acad_assertion_reason", group: "Academics (Board / School style)", label: "Assertion reason based", hint: "Board-style assertion-reason pattern." },
  { id: "acad_short_answer", group: "Academics (Board / School style)", label: "Short answer type", hint: "Short, structured typed answers aligned to marks split." },
  { id: "acad_detailed_answer", group: "Academics (Board / School style)", label: "Detailed answers type", hint: "Detailed descriptive responses with stepwise structure." },
  { id: "acad_case_study", group: "Academics (Board / School style)", label: "Case study based", hint: "Case/data/source based board-style questions." },
  { id: "acad_diagram", group: "Academics (Board / School style)", label: "Diagram based", hint: "Diagram/label explanation style." },
  { id: "acad_all", group: "Academics (Board / School style)", label: "Mix of all", hint: "Balanced academic mix: objective + short + detailed + case + diagram." },
];

type DraftQKind = "mcq_single" | "mcq_multi" | "integer" | "descriptive";

type AiSeg = {
  questionType: MockAiGenerateType;
  style?: string;
  count: number;
  topicAppend: string;
  asDraft: DraftQKind;
  laneLabel?: string;
};

const CBSE_THEORY_PATTERN_NOTE =
  "CBSE theory pattern: 2-mark = definition + one point/example; 3-mark = definition + two explained points; 4-mark = statement/formula + 2-3 steps + diagram/example/conclusion; 5-mark = intro + 3 core points + supporting diagram/example/conclusion.";

function nextDraftKindForMix(mix: QuestionMixId, index: number): DraftQKind {
  switch (mix) {
    case "comp_assertion_reason":
    case "comp_statement":
    case "comp_mcq": return "mcq_single";
    case "comp_match":
    case "comp_diagram": return "descriptive";
    case "comp_msq": return "mcq_multi";
    case "comp_int": return "integer";
    case "comp_all":
      return (["mcq_single", "mcq_single", "mcq_single", "descriptive", "integer", "descriptive", "mcq_multi"] as const)[index % 7];
    case "acad_mcq":
    case "acad_assertion_reason": return "mcq_single";
    case "acad_short_answer":
    case "acad_detailed_answer":
    case "acad_case_study":
    case "acad_diagram": return "descriptive";
    case "acad_all":
      return (["mcq_single", "mcq_single", "descriptive", "descriptive", "descriptive", "descriptive"] as const)[index % 6];
    default: return "mcq_single";
  }
}

function splitInt3(n: number, a: number, b: number, c: number): [number, number, number] {
  const t = a + b + c || 1;
  const x = Math.max(0, Math.floor(n * (a / t)));
  const y = Math.max(0, Math.floor(n * (b / t)));
  const z = Math.max(0, n - x - y);
  return [x, y, z];
}

const CBSE_DESC_APPEND =
  ` CBSE short and long answer: constructed response, steps or reasoning expected; in board-style tests this lane is vital. ${CBSE_THEORY_PATTERN_NOTE} ` +
  `For every descriptive question, generate a model answer that follows CBSE mark split exactly: ` +
  `2m -> (1 mark definition/statement + 1 mark second point/example), ` +
  `3m -> (1 mark definition/principle + 2 marks explanation in two clear points), ` +
  `4m -> (1 mark definition/formula + 2-3 marks stepwise explanation + 0-1 mark diagram/example/conclusion), ` +
  `5m -> (1 mark intro/definition + 3 marks core explanation + 1 mark support element). ` +
  `Model answer should be structured in bullet points by these components.`;

type AiDifficultyMode = "mixed" | "easy" | "medium" | "hard";

function splitByDifficulty(
  total: number,
  mode: AiDifficultyMode,
  rotateSeed = 0,
): { easy: number; medium: number; hard: number } {
  const n = Math.max(1, total);
  if (mode === "easy") return { easy: n, medium: 0, hard: 0 };
  if (mode === "medium") return { easy: 0, medium: n, hard: 0 };
  if (mode === "hard") return { easy: 0, medium: 0, hard: n };
  // mixed (equal split; remainder distributed in rotating order)
  const base = Math.floor(n / 3);
  const rem = n % 3;
  const out = { easy: base, medium: base, hard: base } as const;
  const keys: Array<keyof typeof out> = ["easy", "medium", "hard"];
  const start = ((rotateSeed % 3) + 3) % 3;
  const mutable = { ...out };
  for (let i = 0; i < rem; i++) {
    const k = keys[(start + i) % 3];
    mutable[k] += 1;
  }
  return mutable;
}

function isCompetitiveMix(mix: QuestionMixId): boolean {
  return mix.startsWith("comp_");
}

function defaultMarksFor(kind: DraftQKind, mix: QuestionMixId, difficulty: "easy" | "medium" | "hard" = "medium") {
  if (isCompetitiveMix(mix)) {
    return { marksCorrect: 4, marksWrong: -1 };
  }

  const byDiff = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 4;

  if (kind === "descriptive") {
    // CBSE theory questions are commonly framed as 2/3/4/5 marks.
    const cbseMark = difficulty === "easy" ? 2 : difficulty === "medium" ? 3 : 5;
    return { marksCorrect: cbseMark, marksWrong: 0 };
  }

  // Academic/board objective items: no negative marking.
  if (kind === "integer") return { marksCorrect: byDiff, marksWrong: 0 };
  if (kind === "mcq_multi") return { marksCorrect: byDiff, marksWrong: 0 };
  return { marksCorrect: byDiff, marksWrong: 0 };
}

function inferDescriptiveMarksFromQuestion(
  questionText: string,
  modelText: string,
  fallback: number,
): number {
  const q = `${questionText} ${modelText}`.toLowerCase();
  const wordCount = questionText.trim().split(/\s+/).filter(Boolean).length;
  if (/\b(define|state|what is|write briefly|very short)\b/.test(q) || wordCount < 14) return 2;
  if (/\b(differentiate|explain briefly|short note|list any three)\b/.test(q)) return 3;
  if (/\b(derive|prove|justify|evaluate|case study|analyse|analyze)\b/.test(q)) return 5;
  if (/\b(explain in detail|discuss|elaborate|stepwise|with example|diagram)\b/.test(q)) return 4;
  return Math.max(2, Math.min(5, fallback));
}

function laneQualityPass(q: AiGeneratedQuestion, seg: AiSeg): boolean {
  const text = `${q.questionText || ""} ${q.explanation || ""}`.toLowerCase();
  const label = (seg.laneLabel || "").toLowerCase();
  const has = (arr: string[]) => arr.some((k) => text.includes(k));
  const qWords = (q.questionText || "").trim().split(/\s+/).filter(Boolean).length;
  const exWords = (q.explanation || "").trim().split(/\s+/).filter(Boolean).length;
  const level = (q.difficulty || "medium").toLowerCase();
  const minEx = level === "hard" ? 28 : level === "medium" ? 18 : 10;

  if (label.includes("assertion reason")) {
    return has(["assertion", "reason"]) && exWords >= minEx;
  }
  if (label.includes("statement based")) {
    return has(["statement"]) && has(["which of the following", "correct", "incorrect"]) && exWords >= minEx;
  }
  if (label.includes("match the following")) {
    const qText = (q.questionText || "").toLowerCase();
    const hasColumns = qText.includes("column i") && qText.includes("column ii");
    const hasPairStyle = /(a[\).]|b[\).]|c[\).]|d[\).])/.test(qText) || /\b(1[\).]|2[\).]|3[\).]|4[\).])/.test(qText);
    return (has(["match the following"]) || hasColumns) && hasPairStyle && qWords >= 14 && exWords >= Math.max(minEx, 16);
  }
  if (label.includes("diagram")) {
    const qText = (q.questionText || "").toLowerCase();
    const hasDiagramCueInQuestion = ["diagram", "figure", "label", "identify", "draw"].some((k) => qText.includes(k));
    const hasLabeledStructure =
      /\b[a-z]\)\s*/i.test(q.questionText || "") ||
      /\b(label|labels?)\b/i.test(q.questionText || "") ||
      /[:\n]\s*(a|b|c)\s*[-:]/i.test(q.questionText || "");
    return hasDiagramCueInQuestion && hasLabeledStructure && qWords >= 14 && exWords >= (level === "hard" ? 34 : 22);
  }
  if (label.includes("case study")) {
    return has(["case", "scenario", "passage", "data", "source"]) && qWords >= 16 && exWords >= (level === "hard" ? 40 : 28);
  }
  if (label.includes("short answer")) {
    return has(["define", "state", "write short", "briefly", "short note"]) && exWords >= 12 && exWords <= 45;
  }
  if (label.includes("detailed answers")) {
    const hasPromptCue = has(["explain in detail", "discuss", "derive", "justify", "elaborate", "with steps"]);
    const structuredAnswer = (q.explanation || "").includes("\n") || /(^|\s)(1[\).]|2[\).]|first|second|third)\b/i.test(q.explanation || "");
    return hasPromptCue && structuredAnswer && qWords >= 14 && exWords >= (level === "hard" ? 42 : 30);
  }
  if (label.includes("msq")) {
    const optionCount = Array.isArray(q.options) ? q.options.length : 0;
    const explicitCorrect = (q.options || []).filter((o) => Boolean(o.isCorrect)).length;
    const fromAnswerKey = (() => {
      const arr = (q.correctOptions || []).filter(Boolean);
      if (arr.length > 0) return arr.length;
      const raw = String(q.correctOption || "").toUpperCase();
      if (!raw) return 0;
      const picks = raw
        .split(/[,;/|]|\s+AND\s+|\s+&\s+/i)
        .map((s) => s.trim().match(/^([A-E])\b/)?.[1] || "")
        .filter(Boolean);
      return new Set(picks).size;
    })();
    const correctCount = Math.max(explicitCorrect, fromAnswerKey);
    return optionCount >= 4 && correctCount >= 2 && exWords >= minEx;
  }
  if (label.includes("mcq based")) {
    return exWords >= minEx;
  }
  // Keep default permissive for generic MCQ/MSQ/Integer lanes.
  return exWords >= minEx;
}

function draftLaneQualityPass(
  q: Pick<DraftQuestion, "content" | "explanation" | "solutionText" | "difficulty">,
  seg: AiSeg,
): boolean {
  return laneQualityPass(
    {
      questionText: q.content || "",
      explanation: (q.solutionText || q.explanation || ""),
      options: [],
      correctOption: "A",
      difficulty: q.difficulty || "medium",
    } as AiGeneratedQuestion,
    seg,
  );
}

function applyMarksPolicyToDraft(
  q: DraftQuestion,
  mix: QuestionMixId,
): DraftQuestion {
  const difficulty = (q.difficulty || "medium") as "easy" | "medium" | "hard";
  const kind = q.type as DraftQKind;
  const marks = defaultMarksFor(kind, mix, difficulty);
  let marksCorrect = marks.marksCorrect;
  const lane = (q.generatedTypeLabel || "").toLowerCase();

  // Strict academic fixed-mark mapping requested by user.
  if (mix.startsWith("acad_")) {
    if (lane.includes("short answer")) marksCorrect = 2;
    else if (lane.includes("detailed answers")) marksCorrect = 5;
    else if (lane.includes("diagram") || lane.includes("case study")) marksCorrect = 4;
    else marksCorrect = 1; // MCQ + assertion-reason (+ objective fallback)
  }
  if (kind === "descriptive") {
    marksCorrect = inferDescriptiveMarksFromQuestion(
      q.content || "",
      q.solutionText || q.explanation || "",
      marksCorrect,
    );
    if (!mix.startsWith("acad_")) {
      const minByDifficulty: Record<"easy" | "medium" | "hard", number> = {
        easy: 2,
        medium: 3,
        hard: 4,
      };
      marksCorrect = Math.max(minByDifficulty[difficulty], marksCorrect);
      if (lane.includes("case study") || lane.includes("detailed answers") || lane.includes("diagram")) {
        marksCorrect = Math.max(4, marksCorrect);
      }
      if (lane.includes("short answer")) {
        marksCorrect = Math.min(3, Math.max(2, marksCorrect));
      }
    }
  }

  // Re-assert strict academic fixed-mark mapping after any inference.
  if (mix.startsWith("acad_")) {
    if (lane.includes("short answer")) marksCorrect = 2;
    else if (lane.includes("detailed answers")) marksCorrect = 5;
    else if (lane.includes("diagram") || lane.includes("case study")) marksCorrect = 4;
    else marksCorrect = 1;
  }

  return {
    ...q,
    marksCorrect,
    marksWrong: mix.startsWith("acad_") ? 0 : (kind === "descriptive" ? 0 : marks.marksWrong),
  };
}

function looksCompetencyStyle(q: AiGeneratedQuestion): boolean {
  const t = `${q.questionText || ""} ${q.explanation || ""}`.toLowerCase();
  const cues = [
    "case", "scenario", "passage", "source", "data", "graph", "table",
    "application", "real-life", "consider the following",
    "read the following",
  ];
  return cues.some((c) => t.includes(c));
}

function buildAiPlan(mix: QuestionMixId, n: number): AiSeg[] {
  if (n < 1) return [];
  switch (mix) {
    case "comp_assertion_reason":
      return [{ questionType: "mcq_single", style: "assertion_reason", count: n, topicAppend: "", asDraft: "mcq_single", laneLabel: "Assertion reason based" }];
    case "comp_statement":
      return [{ questionType: "mcq_single", style: "statement", count: n, topicAppend: "", asDraft: "mcq_single", laneLabel: "Statement based" }];
    case "comp_mcq":
      return [{ questionType: "mcq_single", count: n, topicAppend: "", asDraft: "mcq_single", laneLabel: "MCQ based" }];
    case "comp_match":
      return [{ questionType: "descriptive", style: "match", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Match the following based" }];
    case "comp_diagram":
      return [{ questionType: "descriptive", style: "diagram", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Diagram based" }];
    case "comp_msq":
      return [{ questionType: "mcq_multi", count: n, topicAppend: "", asDraft: "mcq_multi", laneLabel: "MSQ" }];
    case "comp_int":
      return [{ questionType: "integer", count: n, topicAppend: "", asDraft: "integer", laneLabel: "Integer based" }];
    case "comp_all": {
      const [a, b, c] = splitInt3(n, 3, 2, 2);
      const assertionCount = Math.min(1, a);
      const statementCount = Math.min(1, Math.max(0, a - assertionCount));
      const mcqCount = Math.max(0, a - assertionCount - statementCount);
      const matchCount = Math.min(1, n >= 5 ? 1 : 0);
      const diagramCount = Math.min(1, n >= 6 ? 1 : 0);
      const plan: AiSeg[] = [
        { questionType: "mcq_single", style: "assertion_reason", count: assertionCount, topicAppend: "", asDraft: "mcq_single", laneLabel: "Assertion reason based" },
        { questionType: "mcq_single", style: "statement", count: statementCount, topicAppend: "", asDraft: "mcq_single", laneLabel: "Statement based" },
        { questionType: "mcq_single", count: mcqCount, topicAppend: "", asDraft: "mcq_single", laneLabel: "MCQ based" },
        { questionType: "descriptive", style: "match", count: matchCount, topicAppend: "", asDraft: "descriptive", laneLabel: "Match the following based" },
        { questionType: "descriptive", style: "diagram", count: diagramCount, topicAppend: "", asDraft: "descriptive", laneLabel: "Diagram based" },
        { questionType: "mcq_multi", count: b, topicAppend: "", asDraft: "mcq_multi", laneLabel: "MSQ" },
        { questionType: "integer", count: c, topicAppend: "", asDraft: "integer", laneLabel: "Integer based" },
      ];
      return plan.filter((seg) => seg.count > 0);
    }
    case "acad_mcq":
      return [{ questionType: "mcq_single", count: n, topicAppend: "", asDraft: "mcq_single", laneLabel: "MCQ based" }];
    case "acad_assertion_reason":
      return [{ questionType: "mcq_single", style: "assertion_reason", count: n, topicAppend: "", asDraft: "mcq_single", laneLabel: "Assertion reason based" }];
    case "acad_short_answer":
      return [{ questionType: "descriptive", style: "short_answer", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Short answer type" }];
    case "acad_detailed_answer":
      return [{ questionType: "descriptive", style: "detailed_answer", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Detailed answers type" }];
    case "acad_case_study":
      return [{ questionType: "descriptive", style: "case_study", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Case study based" }];
    case "acad_diagram":
      return [{ questionType: "descriptive", style: "diagram", count: n, topicAppend: "", asDraft: "descriptive", laneLabel: "Diagram based" }];
    case "acad_all": {
      const [a, b, c] = splitInt3(n, 2, 1, 3);
      const diagramShare = c >= 3 ? 1 : 0;
      const descriptiveCore = Math.max(0, c - diagramShare);
      const shortShare = descriptiveCore > 0 ? Math.max(1, Math.floor(descriptiveCore / 3)) : 0;
      const detailShare = descriptiveCore > 1 ? Math.max(1, Math.floor(descriptiveCore / 3)) : 0;
      const caseShare = Math.max(0, descriptiveCore - shortShare - detailShare);
      const plan: AiSeg[] = [
        { questionType: "mcq_single", count: a, topicAppend: "", asDraft: "mcq_single", laneLabel: "MCQ based" },
        { questionType: "mcq_single", style: "assertion_reason", count: b, topicAppend: "", asDraft: "mcq_single", laneLabel: "Assertion reason based" },
        { questionType: "descriptive", style: "short_answer", count: shortShare, topicAppend: "", asDraft: "descriptive", laneLabel: "Short answer type" },
        { questionType: "descriptive", style: "detailed_answer", count: detailShare, topicAppend: "", asDraft: "descriptive", laneLabel: "Detailed answers type" },
        { questionType: "descriptive", style: "case_study", count: caseShare, topicAppend: "", asDraft: "descriptive", laneLabel: "Case study based" },
        { questionType: "descriptive", style: "diagram", count: diagramShare, topicAppend: "", asDraft: "descriptive", laneLabel: "Diagram based" },
      ];
      return plan.filter((seg) => seg.count > 0);
    }
    default:
      return [{ questionType: "mcq_single", count: n, topicAppend: "", asDraft: "mcq_single" }];
  }
}

const DRAFT_KIND_LABEL: Record<DraftQKind, string> = {
  mcq_single: "MCQ (single-correct)",
  mcq_multi: "MSQ (multi-correct)",
  integer: "Integer / numerical",
  descriptive: "Descriptive",
};

/**
 * Shown in the generate loader: which slice of the plan is running.
 */
function getSegmentLabel(mix: QuestionMixId, seg: AiSeg, i: number, n: number): string {
  if (seg.laneLabel) {
    return n <= 1 ? seg.laneLabel : `Segment ${i + 1} of ${n}: ${seg.laneLabel}`;
  }
  const t = DRAFT_KIND_LABEL[seg.asDraft];
  return n <= 1 ? t : `Segment ${i + 1} of ${n}: ${t}`;
}

type AiGenLoader = {
  title: string;
  detail: string;
  /** 0–100, primarily driven by how many questions are collected vs requested */
  percent: number;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type TestCategory = "subject" | "chapter" | "topic";

interface ScopeState {
  subjectId: string; subjectName: string;
  chapterId: string; chapterName: string;
  topicId:   string; topicName: string;
}

const emptyScope: ScopeState = {
  subjectId: "", subjectName: "",
  chapterId: "", chapterName: "",
  topicId: "",   topicName: "",
};

type DraftQuestion = CreateMockTestQuestionPayload & {
  _key: number;
  subject?: string;
  explanation?: string;
  generatedTypeLabel?: string;
  /** Optional generation bucket metadata for cache reuse */
  cacheBucket?: any;
};

const GENERATED_TYPE_TAG_PREFIX = "gen_type:";

function buildGeneratedTypeTags(existing: string[] | undefined, label: string | undefined): string[] | undefined {
  const base = (existing ?? []).filter((t) => !String(t).startsWith(GENERATED_TYPE_TAG_PREFIX));
  if (!label || !label.trim()) return base.length ? base : undefined;
  const normalised = label.trim().toLowerCase().replace(/\s+/g, "_");
  return [...base, `${GENERATED_TYPE_TAG_PREFIX}${normalised}`];
}

function prettifyGeneratedTypeTag(tagValue: string): string {
  return tagValue
    .replace(/^gen_type:/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function getQuestionTypeBadgeLabel(q: Partial<DraftQuestion> & { type?: string; tags?: string[]; generatedTypeLabel?: string }): string {
  const explicit = q.generatedTypeLabel?.trim();
  if (explicit) return explicit;
  const tag = (q.tags ?? []).find((t) => String(t).startsWith(GENERATED_TYPE_TAG_PREFIX));
  if (tag) return prettifyGeneratedTypeTag(tag);
  return q.type || "question";
}

function inferSubtypeLabelFromText(questionText?: string, explanation?: string): string | undefined {
  const text = `${questionText || ""}\n${explanation || ""}`.toLowerCase();
  const has = (parts: string[]) => parts.every((p) => text.includes(p));

  if (
    has(["assertion", "reason"]) ||
    has(["assertion (a)", "reason (r)"]) ||
    text.includes("both a and r")
  ) {
    return "ASSERTION_REASON";
  }

  if (
    text.includes("match the following") ||
    has(["column i", "column ii"]) ||
    text.includes("matrix match")
  ) {
    return "MATRIX_MATCH";
  }

  if (
    text.includes("read the following passage") ||
    text.includes("based on the paragraph")
  ) {
    return "PARAGRAPH_BASED";
  }

  return undefined;
}

type CachedQuestion = Omit<DraftQuestion, "_key">;
type AiQuestionCacheEntry = {
  key: string;
  mix: QuestionMixId;
  exam: string;
  batchId?: string;
  scope: { subjectId?: string; chapterId?: string; topicId?: string };
  updatedAt: number;
  questions: CachedQuestion[];
};

const AI_Q_CACHE_KEY = "mock_ai_question_cache_v2";
const AI_Q_CACHE_MAX_ENTRIES = 30;
const AI_Q_CACHE_MAX_PER_ENTRY = 400;

function loadAiQuestionCache(): AiQuestionCacheEntry[] {
  try {
    const raw = localStorage.getItem(AI_Q_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAiQuestionCache(entries: AiQuestionCacheEntry[]) {
  try {
    localStorage.setItem(AI_Q_CACHE_KEY, JSON.stringify(entries.slice(0, AI_Q_CACHE_MAX_ENTRIES)));
  } catch {
    // ignore quota errors
  }
}

function stripKey(q: DraftQuestion): CachedQuestion {
  const { _key, ...rest } = q;
  return rest;
}

let _keyCounter = 0;
const blankQuestion = (kind: DraftQKind = "mcq_single", mix: QuestionMixId = "comp_mcq", label?: string): DraftQuestion => {
  const marks = defaultMarksFor(kind, mix);
  const base: Pick<DraftQuestion, "marksCorrect" | "marksWrong" | "content" | "difficulty" | "explanation" | "subject" | "generatedTypeLabel"> = {
    content: "",
    difficulty: "medium",
    marksCorrect: marks.marksCorrect,
    marksWrong: marks.marksWrong,
    explanation: undefined,
    subject: undefined,
    generatedTypeLabel: label,
  };
  if (kind === "integer")
    return { _key: ++_keyCounter, ...base, type: "integer", integerAnswer: "" };
  if (kind === "descriptive")
    return { _key: ++_keyCounter, ...base, type: "descriptive", marksWrong: 0, solutionText: "" };
  if (kind === "mcq_multi")
    return {
      _key: ++_keyCounter, ...base, type: "mcq_multi",
      options: [
        { optionLabel: "A", content: "", isCorrect: false },
        { optionLabel: "B", content: "", isCorrect: false },
        { optionLabel: "C", content: "", isCorrect: false },
        { optionLabel: "D", content: "", isCorrect: false },
      ],
    };
  return {
    _key: ++_keyCounter, ...base, type: "mcq_single",
    options: [
      { optionLabel: "A", content: "", isCorrect: false },
      { optionLabel: "B", content: "", isCorrect: false },
      { optionLabel: "C", content: "", isCorrect: false },
      { optionLabel: "D", content: "", isCorrect: false },
    ],
  };
};

function aiToDraft(
  q: AiGeneratedQuestion,
  as: DraftQKind,
  defaultSubject: string,
  mix: QuestionMixId,
  cacheBucket?: CbseBucket,
  generatedTypeLabel?: string,
): DraftQuestion {
  const diff = (q.difficulty?.toLowerCase() ?? "medium") as "easy" | "medium" | "hard";
  const safeDiff = ["easy", "medium", "hard"].includes(diff) ? diff : "medium";
  const marks = defaultMarksFor(as, mix, safeDiff);
  const inferredSubtype = inferSubtypeLabelFromText(q.questionText, q.explanation);
  const effectiveGeneratedTypeLabel = inferredSubtype || generatedTypeLabel;

  if (as === "descriptive") {
    const ex = (q.explanation || "").trim();
    const cleanedEx = ex
      .replace(/\bModel answer:\s*[A-E]\b\.?/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const modelSpec = (q.solutionText || "").trim();
    const model = modelSpec || cleanedEx.replace(/^\s*Model answer:\s*/i, "").trim() || cleanedEx;
    const inferredMarks = inferDescriptiveMarksFromQuestion(q.questionText, model, marks.marksCorrect);
    return {
      _key: ++_keyCounter,
      content: q.questionText,
      type: "descriptive",
      difficulty: safeDiff,
      marksCorrect: inferredMarks,
      marksWrong: marks.marksWrong,
      subject: q.subject || defaultSubject,
      explanation: q.explanation,
      generatedTypeLabel: effectiveGeneratedTypeLabel,
      solutionText: model,
      cacheBucket,
    };
  }

  if (as === "integer") {
    const hint = q.integerHint;
    const fromOpt = (() => {
      const o = (q.options ?? []).find((x) => x.isCorrect) ||
        (q.options ?? []).find((x) => x.label === q.correctOption);
      const t = (o?.text || "").replace(/[^0-9-]/g, "").trim();
      return /^-?\d+$/.test(t) ? t : "";
    })();
    const intVal = (hint && /^-?\d+$/.test(String(hint).trim()) ? String(hint).trim() : "") || fromOpt || "0";
    return {
      _key: ++_keyCounter,
      content: q.questionText,
      type: "integer",
      difficulty: safeDiff,
      marksCorrect: marks.marksCorrect,
      marksWrong: marks.marksWrong,
      integerAnswer: intVal,
      subject: q.subject || defaultSubject,
      explanation: q.explanation,
      generatedTypeLabel: effectiveGeneratedTypeLabel,
      cacheBucket,
    };
  }

  const isMulti = as === "mcq_multi" || (q.correctOptions && q.correctOptions.length > 1);
  const opts = (q.options ?? []).map((o) => ({
    optionLabel: o.label,
    content: o.text,
    isCorrect: Boolean(
      o.isCorrect ||
        (q.correctOptions && q.correctOptions.includes(o.label)) ||
        (!q.correctOptions?.length && o.label === q.correctOption),
    ),
  }));
  if (opts.length < 2) {
    return {
      _key: ++_keyCounter,
      content: q.questionText,
      type: isMulti ? "mcq_multi" : "mcq_single",
      difficulty: safeDiff,
      marksCorrect: marks.marksCorrect,
      marksWrong: marks.marksWrong,
      subject: q.subject || defaultSubject,
      explanation: q.explanation,
      generatedTypeLabel: effectiveGeneratedTypeLabel,
      cacheBucket,
      options: [
        { optionLabel: "A", content: "—", isCorrect: isMulti ? false : true },
        { optionLabel: "B", content: "—", isCorrect: isMulti ? true : false },
        { optionLabel: "C", content: "—", isCorrect: false },
        { optionLabel: "D", content: "—", isCorrect: isMulti ? true : false },
      ],
    };
  }

  return {
    _key: ++_keyCounter,
    content: q.questionText,
    type: isMulti ? "mcq_multi" : "mcq_single",
    difficulty: safeDiff,
    marksCorrect: marks.marksCorrect,
    marksWrong: marks.marksWrong,
    options: opts,
    subject: q.subject || defaultSubject,
    explanation: q.explanation,
    generatedTypeLabel: effectiveGeneratedTypeLabel,
    cacheBucket,
  };
}

// ─── StepBar ──────────────────────────────────────────────────────────────────

function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-start mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-start flex-1">
          <div className="flex flex-col items-center w-full">
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-all",
                  i <= current ? "bg-[#013889]" : "bg-slate-200"
                )} />
              )}
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 transition-all",
                i < current
                  ? "bg-[#013889] border-[#013889] text-white"
                  : i === current
                  ? "border-[#013889] text-[#013889] bg-blue-50"
                  : "border-slate-300 text-slate-400 bg-white"
              )}>
                {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-0.5 flex-1 transition-all",
                  i < current ? "bg-[#013889]" : "bg-slate-200"
                )} />
              )}
            </div>
            <span className={cn(
              "text-[10px] font-semibold mt-1.5 whitespace-nowrap text-center",
              i <= current ? "text-slate-700" : "text-slate-400"
            )}>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TopicPicker ──────────────────────────────────────────────────────────────

function TopicPicker({ value, onChange, batchId }: { value: string; onChange: (id: string) => void; batchId?: string }) {
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const { data: subjects } = useSubjects(batchId);
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Question Topic * <span className="text-slate-400 normal-case font-normal">(all questions tagged here)</span>
      </label>
      <div className="grid grid-cols-3 gap-2">
        <select value={subjectId} onChange={e => { setSubjectId(e.target.value); setChapterId(""); onChange(""); }}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
          <option value="">Subject…</option>
          {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={chapterId} onChange={e => { setChapterId(e.target.value); onChange(""); }}
          disabled={!subjectId}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
          <option value="">Chapter…</option>
          {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={value} onChange={e => onChange(e.target.value)}
          disabled={!chapterId}
          className="h-9 w-full px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
          <option value="">Topic…</option>
          {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      {!subjectList.length && (
        <p className="text-xs text-amber-500">No subjects found. Create subjects/chapters/topics in Content first.</p>
      )}
    </div>
  );
}

// ─── Question Builder Row ─────────────────────────────────────────────────────

function QuestionRow({
  q, index, onChange, onRemove, canRemove, allowedMixes,
}: {
  q: DraftQuestion; index: number;
  onChange: (u: DraftQuestion) => void;
  onRemove: () => void; canRemove: boolean;
  allowedMixes: { type: DraftQKind; label: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isInteger = q.type === "integer";
  const isDescriptive = q.type === "descriptive";
  
  const { upload, uploading } = useUpload({ type: "doubt-response-image" });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onChange({ ...q, contentImageUrl: url });
  };

  const setOpt = (i: number, key: "content" | "isCorrect", val: string | boolean) => {
    const opts = [...(q.options ?? [])];
    opts[i] = { ...opts[i], [key]: val };
    if (key === "isCorrect" && val === true && q.type === "mcq_single")
      opts.forEach((o, j) => { if (j !== i) o.isCorrect = false; });
    onChange({ ...q, options: opts });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <span className="text-xs font-bold text-slate-400 w-6 shrink-0">{String(index + 1).padStart(2, "0")}</span>
        <p className="text-sm text-slate-700 flex-1 truncate">{q.content || <span className="text-slate-400 italic">Empty question…</span>}</p>
        <div className="flex items-center gap-2 shrink-0">
          {q.subject && <span className="text-xs text-slate-400 hidden sm:block">{q.subject}</span>}
          {q.generatedTypeLabel && (
            <span className="text-xs text-[#013889] bg-[#E6EEF8] px-2 py-0.5 rounded-full hidden sm:block">
              {q.generatedTypeLabel}
            </span>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>
            {q.difficulty}
          </span>
          {canRemove && (
            <button onClick={e => { e.stopPropagation(); onRemove(); }}
              className="text-slate-400 hover:text-red-500 p-1">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="text-slate-400 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
          <div className="space-y-2.5">
            <textarea required={!q.contentImageUrl} rows={2} value={q.content}
              onChange={e => onChange({ ...q, content: e.target.value })}
              placeholder={q.contentImageUrl ? "Question text (optional with attachment)…" : "Question text…"}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-[#013889] resize-none" />
            
            {q.contentImageUrl ? (
              <div className="relative inline-block border border-slate-200 rounded-md overflow-hidden bg-white">
                <img src={resolveMediaUrl(q.contentImageUrl)} alt="Question Attachment" className="max-h-32 object-contain" />
                <button
                  type="button"
                  onClick={() => onChange({ ...q, contentImageUrl: undefined })}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-red-50 text-red-500 rounded p-1 backdrop-blur-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <input type="file" id={`upload-img-${q._key}`} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <label htmlFor={`upload-img-${q._key}`} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${uploading ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#013889]'}`}>
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {uploading ? "Uploading..." : "Attach Image"}
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500 font-semibold">Type</label>
              <select
                value={`${q.type}|${q.generatedTypeLabel || ""}`}
                onChange={e => {
                  const [v, label] = e.target.value.split("|");
                  if (v === "mcq_single" || v === "mcq_multi" || v === "integer" || v === "descriptive") {
                    const fresh = blankQuestion(v as DraftQKind, "comp_mcq", label || undefined);
                    onChange({ ...fresh, _key: q._key, content: q.content, contentImageUrl: q.contentImageUrl, difficulty: q.difficulty, marksCorrect: q.marksCorrect });
                  }
                }}
                className="mt-1 h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
                {allowedMixes.map((m, i) => (
                  <option key={i} value={`${m.type}|${m.label}`}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold">Difficulty</label>
              <select value={q.difficulty} onChange={e => onChange({ ...q, difficulty: e.target.value as any })}
                className="mt-1 h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-semibold">Marks +/-</label>
              <div className="mt-1 flex gap-1">
                <input type="number" value={q.marksCorrect}
                  onChange={e => onChange({ ...q, marksCorrect: +e.target.value })}
                  className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] text-center" />
                <input type="number" value={q.marksWrong}
                  onChange={e => onChange({ ...q, marksWrong: +e.target.value })}
                  className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] text-center" />
              </div>
            </div>
          </div>

          {!isInteger && !isDescriptive && q.options && q.options.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold">Options (tick correct)</label>
              {(q.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-xs font-bold text-slate-400">{opt.optionLabel}</span>
                  <input type="text" value={opt.content}
                    onChange={e => setOpt(i, "content", e.target.value)}
                    placeholder={`Option ${opt.optionLabel}`}
                    className="h-8 flex-1 px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]" />
                  <input type={q.type === "mcq_single" ? "radio" : "checkbox"}
                    name={`correct-${q._key}`} checked={opt.isCorrect}
                    onChange={e => setOpt(i, "isCorrect", e.target.checked)}
                    className="w-4 h-4 accent-[#013889]" />
                </div>
              ))}
            </div>
          )}

          {isInteger && (
            <div>
              <label className="text-xs text-slate-500 font-semibold">Correct Integer Answer</label>
              <input value={q.integerAnswer ?? ""}
                onChange={e => onChange({ ...q, integerAnswer: e.target.value })}
                placeholder="e.g. 42"
                className="mt-1 h-9 w-full px-3 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]" />
            </div>
          )}

          {isDescriptive && (
            <div>
              <label className="text-xs text-slate-500 font-semibold">Model answer / key points (optional but recommended)</label>
              <textarea rows={3} value={(q as DraftQuestion).solutionText ?? ""}
                onChange={e => onChange({ ...q, solutionText: e.target.value, marksWrong: 0 })}
                placeholder="Marking points or exemplar answer for review…"
                className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] resize-none" />
              {[2, 3, 4, 5].includes(Math.round(q.marksCorrect || 0)) && (
                <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                  {Math.round(q.marksCorrect) === 2 && "2-mark: very concise answer (definition/statement + one point/example)."}
                  {Math.round(q.marksCorrect) === 3 && "3-mark: definition/principle + 2 explained points in logical flow."}
                  {Math.round(q.marksCorrect) === 4 && "4-mark: structured explanation with 3-4 points; include stepwise work or diagram/example where relevant."}
                  {Math.round(q.marksCorrect) === 5 && "5-mark: complete structure - intro/definition, 3 core points/steps, and diagram/example/conclusion."}
                </p>
              )}
            </div>
          )}

          {q.explanation && (
            <p className="text-xs text-slate-500 italic border-l-2 border-[#013889]/30 pl-3">{q.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Generate Panel ────────────────────────────────────────────────────────

function AIGeneratePanel({
  exam,
  onQuestionsGenerated,
  batchId,
  testCategory,
  questionMixIds,
  batchExamTarget,
  batchClass,
  initSubjectId = "", initSubjectName = "",
  initChapterId = "", initChapterName = "",
  initTopicId = "",  initTopicName = "",
}: {
  exam: string;
  onQuestionsGenerated: (questions: DraftQuestion[], topicId?: string) => void;
  batchId?: string;
  testCategory?: TestCategory | null;
  questionMixIds: QuestionMixId[];
  /** From institute batch: steers phrasing, difficulty feel, and model-answer style. */
  batchExamTarget?: string;
  batchClass?: string;
  initSubjectId?: string; initSubjectName?: string;
  initChapterId?: string; initChapterName?: string;
  initTopicId?: string;   initTopicName?: string;
}) {

  const [count, setCount] = useState(20);
  const [countMode, setCountMode] = useState<"preset" | "custom">("preset");
  const [customCount, setCustomCount] = useState("20");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [loader, setLoader] = useState<AiGenLoader | null>(null);
  const [qualityReport, setQualityReport] = useState<string>("");
  const [cacheMode, setCacheMode] = useState<"cache_only" | "ai_only">("ai_only");
  const [difficultyMode, setDifficultyMode] = useState<AiDifficultyMode>("mixed");

  const [subjectId, setSubjectId] = useState(initSubjectId);
  const [chapterId, setChapterId] = useState(initChapterId);
  const [aiTopicId, setAiTopicId] = useState(initTopicId);
  const [aiTopicName, setAiTopicName] = useState(initTopicName);
  const [aiChapterName, setAiChapterName] = useState(initChapterName);
  const [aiSubjectName, setAiSubjectName] = useState(initSubjectName);

  const { data: subjects } = useSubjects(batchId);
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];

  const cfg = EXAM_CONFIGS[exam] ?? EXAM_CONFIGS.JEE;
  const isCbseMix = questionMixIds.some(id => id.startsWith("cbse_") || id.startsWith("acad_"));
  const topicSelected = !!aiTopicId;
  const requestedCount = countMode === "custom"
    ? Math.max(1, Math.min(300, Number(customCount) || 0))
    : count;
  const cacheScope = {
    subjectId: subjectId || undefined,
    chapterId: chapterId || undefined,
    topicId: aiTopicId || undefined,
  };
  const cacheKey = [
    batchId || "no-batch",
    questionMixIds.slice().sort().join(","),
    exam,
    cacheScope.subjectId || "-",
    cacheScope.chapterId || "-",
    cacheScope.topicId || "-",
  ].join("|");

  const countDraftDifficulties = (items: DraftQuestion[]) => {
    let easy = 0, medium = 0, hard = 0;
    for (const q of items) {
      if (q.difficulty === "easy") easy += 1;
      else if (q.difficulty === "hard") hard += 1;
      else medium += 1;
    }
    return { easy, medium, hard };
  };

  const enforceMixedDifficultyBalance = (
    items: DraftQuestion[],
    target: { easy: number; medium: number; hard: number },
  ): DraftQuestion[] => {
    if (difficultyMode !== "mixed" || items.length === 0) return items;
    const out = [...items];
    const current = countDraftDifficulties(out);
    const need = {
      easy: Math.max(0, target.easy - current.easy),
      medium: Math.max(0, target.medium - current.medium),
      hard: Math.max(0, target.hard - current.hard),
    };
    const excess = {
      easy: Math.max(0, current.easy - target.easy),
      medium: Math.max(0, current.medium - target.medium),
      hard: Math.max(0, current.hard - target.hard),
    };

    const relabel = (from: "easy" | "medium" | "hard", to: "easy" | "medium" | "hard") => {
      if (from === to || excess[from] <= 0 || need[to] <= 0) return;
      for (let i = 0; i < out.length && excess[from] > 0 && need[to] > 0; i++) {
        if (out[i].difficulty !== from) continue;
        out[i] = applyMarksPolicyToDraft(
          { ...out[i], difficulty: to as any },
          questionMixIds[0] || "comp_mcq",
        );
        excess[from] -= 1;
        need[to] -= 1;
      }
    };

    // Common failure pattern is medium-heavy; move medium to deficits first.
    relabel("medium", "easy");
    relabel("medium", "hard");
    relabel("easy", "hard");
    relabel("hard", "easy");

    return out;
  };

  const getRemainingDifficultyNeed = (items: DraftQuestion[], target: { easy: number; medium: number; hard: number }) => {
    const got = countDraftDifficulties(items);
    return {
      easy: Math.max(0, target.easy - got.easy),
      medium: Math.max(0, target.medium - got.medium),
      hard: Math.max(0, target.hard - got.hard),
    };
  };

  const allocateDifficultyCounts = (
    chunk: number,
    remainingNeed: { easy: number; medium: number; hard: number },
    seed = 0,
  ) => {
    if (chunk <= 0) return { easy: 0, medium: 0, hard: 0 };
    const totalNeed = remainingNeed.easy + remainingNeed.medium + remainingNeed.hard;
    if (difficultyMode !== "mixed" || totalNeed <= 0) {
      return splitByDifficulty(chunk, difficultyMode, seed);
    }
    const exact = {
      easy: (chunk * remainingNeed.easy) / Math.max(1, totalNeed),
      medium: (chunk * remainingNeed.medium) / Math.max(1, totalNeed),
      hard: (chunk * remainingNeed.hard) / Math.max(1, totalNeed),
    };
    const out = {
      easy: Math.floor(exact.easy),
      medium: Math.floor(exact.medium),
      hard: Math.floor(exact.hard),
    };
    let rem = chunk - out.easy - out.medium - out.hard;
    const fracs = (["easy", "medium", "hard"] as const)
      .map((k) => ({ k, f: exact[k] - out[k] }))
      .sort((a, b) => b.f - a.f);
    for (let i = 0; i < rem; i++) out[fracs[i % fracs.length].k] += 1;
    return out;
  };

  const handleGenerate = async () => {
    setError("");
    setQualityReport("");
    if (!Number.isFinite(requestedCount) || requestedCount < 1) {
      setError("Enter a valid custom question count (minimum 1).");
      return;
    }
    setGenerating(true);
    setLoader({
      title: "Preparing",
      detail: "Building the question plan and looking for reusable cached questions…",
      percent: 0,
    });

    const rotationSeed = Date.now() % 3;
    const { easy: easyCount, medium: mediumCount, hard: hardCount } = splitByDifficulty(
      requestedCount,
      difficultyMode,
      rotationSeed,
    );

    const extra = customInstructions.trim() ? ` Extra focus: ${customInstructions.trim()}` : "";
    const isCbse = isCbseMix;
    const difficultyPrompt =
      difficultyMode === "mixed"
        ? " Difficulty mix required: equal easy, medium, and hard distribution."
        : ` Generate ALL questions at ${difficultyMode.toUpperCase()} difficulty only.`;

    let topicName: string;

    if (topicSelected) {
      const topicPath = [aiSubjectName, aiChapterName, aiTopicName].filter(Boolean).join(" > ");
      topicName = isCbse
        ? `${topicPath}. Strict scope: subtopics of "${aiTopicName}" only. Use the question-type instructions per segment.${difficultyPrompt}${extra}`.trim()
        : `${topicPath}. Strict scope: subtopics of "${aiTopicName}" only. JEE/NEET-style where applicable; mix conceptual and numerical problems.${difficultyPrompt}${extra}`.trim();
    } else if (aiChapterName) {
      topicName = isCbse
        ? `Chapter "${aiChapterName}"${aiSubjectName ? ` in subject ${aiSubjectName}` : ""}. Board-style depth on major ideas.${difficultyPrompt}${extra}`.trim()
        : `Chapter "${aiChapterName}"${aiSubjectName ? ` in subject ${aiSubjectName}` : ""}. Cover major ideas; competitive difficulty; mix conceptual and numerical.${difficultyPrompt}${extra}`.trim();
    } else if (aiSubjectName) {
      topicName = isCbse
        ? `Subject "${aiSubjectName}" — full subject breadth, varied chapters; CBSE board-style as defined in the Test details question mix.${difficultyPrompt}${extra}`.trim()
        : `Subject "${aiSubjectName}" — full subject breadth, varied chapters; competitive-style items as in the Test details mix.${difficultyPrompt}${extra}`.trim();
    } else {
      topicName = isCbse
        ? `CBSE-oriented work covering (${cfg.description}). Subjects: ${cfg.subjects.join(", ")}. Syllabus hints: ${cfg.topics.join(" | ")}.${difficultyPrompt} ${extra}`.trim()
        : `${exam} multi-subject diagnostic (${cfg.description}). Subjects: ${cfg.subjects.join(", ")}. Syllabus hints: ${cfg.topics.join(" | ")}. Balanced coverage; match the Test details question type mix.${difficultyPrompt}${extra}`.trim();
    }

    if (batchExamTarget?.trim() || batchClass?.trim()) {
      const cohort = `Institute batch cohort: target exam "${(batchExamTarget || "").trim() || "as configured"}"; class/grade: ${(batchClass || "").trim() || "—"}.`;
      const styleHint = isCbse
        ? " Merge with the board-style mix and CBSE mark-step guidance already in this request: do not drop NCERT-appropriate 2/3/4/5-mark-style stems and model answers; use the cohort to sharpen which class/board exam and phrasing, while keeping stepwise working and mark-weighting that prepare students for boards."
        : " Align phrasing, traps, and model solutions with the stated competitive entrance; balance speed and rigour; model answers can be compact but must be methodologically correct for that exam.";
      topicName = `${topicName} ${cohort}${styleHint}`.trim();
    }

    try {
      const pct = (d: number) =>
        Math.min(100, Math.max(0, Math.round((d / Math.max(1, requestedCount)) * 100)));

      let plan: AiSeg[] = [];
      const perType = Math.floor(requestedCount / Math.max(1, questionMixIds.length));
      const remainderCount = requestedCount % Math.max(1, questionMixIds.length);
      questionMixIds.forEach((mixId, i) => {
        const alloc = perType + (i < remainderCount ? 1 : 0);
        if (alloc > 0) {
          plan = plan.concat(buildAiPlan(mixId, alloc));
        }
      });
      const mainMixId = questionMixIds[0] || "comp_mcq";
      const drafts: DraftQuestion[] = [];
      const subj = aiSubjectName || "";
      const seenQuestions = new Set<string>();
      let duplicateFilteredCount = 0;
      const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();

      // 1) Cache-first reuse (topic/chapter/subject aware) to reduce AI timeouts.
      const cacheEntries = loadAiQuestionCache();
      const candidates = cacheMode === "ai_only" ? [] : cacheEntries
        .filter((e) => {
          if (e.batchId && batchId && e.batchId !== batchId) return false;
          if (cacheScope.topicId) return e.scope.topicId === cacheScope.topicId;
          if (cacheScope.chapterId) return e.scope.chapterId === cacheScope.chapterId;
          if (cacheScope.subjectId) return e.scope.subjectId === cacheScope.subjectId;
          return e.exam === exam;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .flatMap((e) => e.questions);

      /** Remaining slots per plan segment (needed so multiple segments of the same draft kind e.g. CBSE conceptual + objective both MCQ) stay correct and can run in parallel). */
      const rem = plan.map((s) => s.count);
      for (const cq of candidates) {
        const t = (cq.type as DraftQKind);
        const segIdx = rem.findIndex((r, i) => r > 0 && plan[i].asDraft === t);
        if (segIdx < 0) continue;
        const seg = plan[segIdx];
        if (!draftLaneQualityPass(cq as DraftQuestion, seg)) continue;
        const enriched = {
          ...cq,
          generatedTypeLabel: cq.generatedTypeLabel || seg.laneLabel,
        } as DraftQuestion;
        const k = norm(cq.content || "");
        if (!k || seenQuestions.has(k)) continue;
        seenQuestions.add(k);
        drafts.push(applyMarksPolicyToDraft({ _key: ++_keyCounter, ...enriched }, mainMixId));
        rem[segIdx] -= 1;
        if (drafts.length >= requestedCount) break;
      }
      if (drafts.length >= requestedCount) rem.fill(0);
      setLoader({
        title: "Question cache",
        detail:
          cacheMode === "ai_only"
            ? "Cache skipped (AI only mode) — all questions will be generated fresh."
            : drafts.length > 0
              ? `Reused ${drafts.length} of ${requestedCount} from your local question cache.`
              : "No cache hits for this scope — calling AI for new questions.",
        percent: pct(drafts.length),
      });
      // Main AI pass — all plan segments with remaining work run in parallel, then merge in plan order.
      if (cacheMode !== "cache_only") {
        const toFetch = rem
          .map((n, i) => ({ segIndex: i, remNeed: n, seg: plan[i]! }))
          .filter((x) => x.remNeed > 0);
        if (toFetch.length > 0) {
          const needBeforeMain = getRemainingDifficultyNeed(drafts, {
            easy: easyCount,
            medium: mediumCount,
            hard: hardCount,
          });
          const mainAlloc = toFetch.map(({ remNeed }, idx) =>
            allocateDifficultyCounts(remNeed, needBeforeMain, rotationSeed + idx),
          );
          setLoader(
            toFetch.length > 1
              ? {
                  title: "Main — calling AI in parallel",
                  detail: `Running ${toFetch.length} segment batches at once: ${toFetch
                    .map(({ seg, segIndex }) => getSegmentLabel(mainMixId, seg, segIndex, plan.length))
                    .join(" · ")}. ${drafts.length}/${requestedCount} from cache so far.`,
                  percent: pct(drafts.length),
                }
              : (() => {
                  const { seg, segIndex, remNeed: rn } = toFetch[0]!;
                  const alloc = mainAlloc[0] || { easy: 0, medium: rn, hard: 0 };
                  return {
                    title: "Main — calling AI",
                    detail: `${getSegmentLabel(mainMixId, seg, segIndex, plan.length)} — up to ${rn} new (easy ${alloc.easy} · medium ${alloc.medium} · hard ${alloc.hard}) · ${drafts.length}/${requestedCount} collected`,
                    percent: pct(drafts.length),
                  };
                })(),
          );
          const parallelRes: Array<{ segIndex: number; seg: AiSeg; raw: AiGeneratedQuestion[] }> = [];
          const chunkSize = 3; // keep pressure lower on AI bridge; avoids burst 502s with 6-7 lanes
          for (let start = 0; start < toFetch.length; start += chunkSize) {
            const batch = toFetch.slice(start, start + chunkSize);
            const settled = await Promise.allSettled(
              batch.map(async ({ segIndex, remNeed, seg }, localIdx) => {
                const globalIdx = start + localIdx;
                const alloc = mainAlloc[globalIdx] || splitByDifficulty(remNeed, difficultyMode, rotationSeed + globalIdx);
                const raw: AiGeneratedQuestion[] = await aiGenerateMockTestQuestions({
                  topicId: aiTopicId || undefined,
                  topicName: topicName,
                  totalCount: remNeed,
                  easyCount: alloc.easy,
                  mediumCount: alloc.medium,
                  hardCount: alloc.hard,
                  questionType: seg.questionType,
                  questionStyle: seg.style,
                });
                return { segIndex, seg, raw };
              }),
            );
            for (const s of settled) {
              if (s.status === "fulfilled") parallelRes.push(s.value);
            }
          }
          for (const { seg, raw } of parallelRes) {
            for (const q of raw) {
              const key = norm(q.questionText || "");
              if (!key || seenQuestions.has(key)) { duplicateFilteredCount += 1; continue; }
              if (!laneQualityPass(q, seg)) continue;
              seenQuestions.add(key);
              drafts.push(
                aiToDraft({ ...q, subject: q.subject || subj }, seg.asDraft, subj, mainMixId, undefined, seg.laneLabel),
              );
            }
          }
        }
      }

      // Required lane coverage for "mix of all":
      // if count is large enough, force at least one from each lane.
      if (cacheMode !== "cache_only" && (mainMixId === "comp_all" || mainMixId === "acad_all")) {
        const minPerLane = new Map<string, number>();
        const activeSegs = plan.filter((s) => s.count > 0 && s.laneLabel);
        const requiredLaneCount = activeSegs.length;
        const shouldRequireAll = requestedCount >= requiredLaneCount;
        for (const seg of activeSegs) {
          minPerLane.set(seg.laneLabel!, shouldRequireAll ? 1 : 0);
        }

        const countLane = (label: string) =>
          drafts.filter((d) => (d.generatedTypeLabel || "").toLowerCase() === label.toLowerCase()).length;

        for (const seg of activeSegs) {
          const lane = seg.laneLabel!;
          const req = minPerLane.get(lane) || 0;
          if (req <= 0) continue;
          let have = countLane(lane);
          let tries = 0;
          while (have < req && drafts.length < requestedCount && tries < 4) {
            tries += 1;
            const remainingNeed = getRemainingDifficultyNeed(drafts, {
              easy: easyCount,
              medium: mediumCount,
              hard: hardCount,
            });
            const alloc = allocateDifficultyCounts(Math.min(2, req - have), remainingNeed, rotationSeed + 200 + tries);
            setLoader({
              title: "Refining — lane coverage",
              detail: `${lane} — ensuring minimum coverage (${have}/${req})`,
              percent: pct(drafts.length),
            });
            const raw = await aiGenerateMockTestQuestions({
              topicId: aiTopicId || undefined,
              topicName: topicName,
              totalCount: Math.min(2, req - have),
              easyCount: alloc.easy,
              mediumCount: alloc.medium,
              hardCount: alloc.hard,
              questionType: seg.questionType,
              questionStyle: seg.style,
            }).catch(() => [] as AiGeneratedQuestion[]);
            for (const q of raw) {
              const key = norm(q.questionText || "");
              if (!key || seenQuestions.has(key)) { duplicateFilteredCount += 1; continue; }
              if (!laneQualityPass(q, seg)) continue;
              seenQuestions.add(key);
              drafts.push(aiToDraft({ ...q, subject: q.subject || subj }, seg.asDraft, subj, mainMixId, undefined, seg.laneLabel));
              have = countLane(lane);
              if (have >= req || drafts.length >= requestedCount) break;
            }
            if (!raw.length) break;
          }
        }
      }

      // Final fill pass (still quality-guarded): tries harder for count completion
      // without accepting low-quality lane-mismatched content.
      if (cacheMode !== "cache_only" && drafts.length < requestedCount) {
        let rescueGuard = 0;
        while (drafts.length < requestedCount && rescueGuard < 12) {
          rescueGuard += 1;
          const need = requestedCount - drafts.length;
          const seg = plan[rescueGuard % Math.max(1, plan.length)];
          const remainingNeed = getRemainingDifficultyNeed(drafts, {
            easy: easyCount,
            medium: mediumCount,
            hard: hardCount,
          });
          const alloc = allocateDifficultyCounts(Math.min(6, need), remainingNeed, rotationSeed + 100 + rescueGuard);
          setLoader({
            title: "Final fill",
            detail: `${getSegmentLabel(mainMixId, seg, 0, plan.length)} — filling remaining ${need} question(s)`,
            percent: pct(drafts.length),
          });
          const raw = await aiGenerateMockTestQuestions({
            topicId: aiTopicId || undefined,
            topicName: topicName,
            totalCount: Math.min(6, need),
            easyCount: alloc.easy,
            mediumCount: alloc.medium,
            hardCount: alloc.hard,
            questionType: seg.questionType,
            questionStyle: seg.style,
          }).catch(() => [] as AiGeneratedQuestion[]);
          for (const q of raw) {
            const key = norm(q.questionText || "");
            if (!key || seenQuestions.has(key)) { duplicateFilteredCount += 1; continue; }
            if (!laneQualityPass(q, seg)) continue;
            seenQuestions.add(key);
            drafts.push(aiToDraft({ ...q, subject: q.subject || subj }, seg.asDraft, subj, mainMixId, undefined, seg.laneLabel));
            if (drafts.length >= requestedCount) break;
          }
          if (!raw.length) break;
        }
      }

      if (!drafts.length) {
        setError("AI returned no questions. Try again or reduce the count.");
        return;
      }
      if (drafts.length < requestedCount) {
        setError(
          cacheMode === "cache_only"
            ? `Cache-only mode found ${drafts.length}/${requestedCount} questions. Switch to "Only AI generate" to fill the remainder.`
            : `Could only generate ${drafts.length}/${requestedCount} unique questions this run. Try again for the remaining.`,
        );
      }

      // Final strict balance pass (mixed mode): if cache/model skewed difficulties,
      // relabel surplus buckets to meet equal E/M/H target as closely as possible.
      const balancedDrafts = enforceMixedDifficultyBalance(
        drafts.slice(0, requestedCount),
        { easy: easyCount, medium: mediumCount, hard: hardCount },
      );

      setLoader({
        title: "Finishing",
        detail: `Ready ${Math.min(balancedDrafts.length, requestedCount)} of ${requestedCount} questions. Sending to the editor…`,
        percent: 100,
      });
      const duplicateFiltered = Math.max(0, duplicateFilteredCount);
      if (mainMixId === "comp_all" || mainMixId === "acad_all") {
        const activeLanes = plan
          .filter((s) => s.count > 0 && s.laneLabel)
          .map((s) => s.laneLabel as string);
        const targetPerLane = requestedCount >= activeLanes.length ? 1 : 0;
        const coverageRows = activeLanes.map((lane) => {
          const got = balancedDrafts.filter(
            (d) => (d.generatedTypeLabel || "").toLowerCase() === lane.toLowerCase(),
          ).length;
          return { lane, got, target: targetPerLane };
        });
        const laneCoverage = coverageRows.map((r) => `${r.lane} ${r.got}/${r.target}`).join(" · ");
        const missing = coverageRows.filter((r) => r.target > 0 && r.got < r.target).map((r) => r.lane);
        const missingText = missing.length > 0 ? ` · Missing: ${missing.join(", ")}` : "";
        setQualityReport(
          `Coverage: ${laneCoverage}${missingText}${duplicateFiltered > 0 ? ` · Duplicates filtered: ${duplicateFiltered}` : ""}`,
        );
      } else {
        setQualityReport(
          `Generated ${Math.min(drafts.length, requestedCount)} questions${duplicateFiltered > 0 ? ` · Duplicates filtered: ${duplicateFiltered}` : ""}`,
        );
      }

      // Save/refresh cache entry with newest unique pool.
      const cacheOut: CachedQuestion[] = balancedDrafts.map(stripKey);
      const merged = [...cacheOut];
      const seenOut = new Set(merged.map((q) => norm(q.content || "")));
      for (const c of candidates) {
        const k = norm(c.content || "");
        if (!k || seenOut.has(k)) continue;
        seenOut.add(k);
        merged.push(c);
        if (merged.length >= AI_Q_CACHE_MAX_PER_ENTRY) break;
      }
      const nextEntries = loadAiQuestionCache().filter((e) => e.key !== cacheKey);
      nextEntries.unshift({
        key: cacheKey,
        mix: mainMixId,
        exam,
        batchId,
        scope: cacheScope,
        updatedAt: Date.now(),
        questions: merged.slice(0, AI_Q_CACHE_MAX_PER_ENTRY),
      });
      saveAiQuestionCache(nextEntries);

      onQuestionsGenerated(balancedDrafts, aiTopicId || undefined);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "AI generation failed.";
      setError(msg);
    } finally {
      setGenerating(false);
      setLoader(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200">
        <Sparkles className="w-4 h-4 text-violet-500 shrink-0" />
        <p className="text-xs text-violet-700 font-medium">
          {`AI will generate ${requestedCount} questions in the selected mix styles (${QUESTION_MIX_CHOICES.filter(c => questionMixIds.includes(c.id)).map(c => c.label).join(", ")}). `}
          {topicSelected
            ? `Topic: “${aiTopicName}” (anchored to your curriculum tree).`
            : aiChapterName
            ? `Scope: chapter “${aiChapterName}”.`
            : aiSubjectName
            ? `Scope: subject “${aiSubjectName}”.`
            : `No topic selected — using Exam Target: ${cfg.subjects.join(", ")}.`}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Question source</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setCacheMode("cache_only")}
            className={cn(
              "h-9 rounded-lg text-xs font-semibold border transition-colors",
              cacheMode === "cache_only"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            Use cache only
          </button>
          <button
            type="button"
            onClick={() => setCacheMode("ai_only")}
            className={cn(
              "h-9 rounded-lg text-xs font-semibold border transition-colors",
              cacheMode === "ai_only"
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            Only AI generate
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          {cacheMode === "cache_only"
            ? "No AI calls. Uses cached questions for this scope only."
            : "Skips cache completely. Generates all requested questions from AI."}
        </p>
      </div>

      {/* Topic Selector */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Topic <span className="normal-case font-normal text-slate-400">(narrows questions to specific topic)</span>
        </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <select value={subjectId}
              onChange={e => {
                const id = e.target.value;
                const name = subjectList.find(s => s.id === id)?.name ?? "";
                setSubjectId(id); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(name); setAiChapterName("");
              }}
              className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889]">
              <option value="">Subject…</option>
              {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            {testCategory !== "subject" && (
              <select value={chapterId}
                onChange={e => {
                  const id = e.target.value;
                  const name = chapterList.find(c => c.id === id)?.name ?? "";
                  setChapterId(id); setAiTopicId(""); setAiTopicName(""); setAiChapterName(name);
                }}
                disabled={!subjectId}
                className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
                <option value="">Chapter…</option>
                {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {(!testCategory || testCategory === "topic") && (
              <select value={aiTopicId}
                onChange={e => {
                  const id = e.target.value;
                  const name = topicList.find(t => t.id === id)?.name ?? "";
                  setAiTopicId(id); setAiTopicName(name);
                }}
                disabled={!chapterId}
                className="h-9 w-full px-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#013889] disabled:opacity-40">
                <option value="">Topic…</option>
                {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
          {topicSelected ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-600 font-medium flex-1 truncate">
                {[aiSubjectName, aiChapterName, aiTopicName].filter(Boolean).join(" › ")}
              </span>
              <button type="button"
                onClick={() => { setSubjectId(""); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(""); setAiChapterName(""); }}
                className="text-xs text-slate-400 hover:text-slate-700 shrink-0">Clear</button>
            </div>
          ) : aiChapterName ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-600 font-medium flex-1 truncate">
                {[aiSubjectName, aiChapterName].filter(Boolean).join(" › ")}
              </span>
              <button type="button"
                onClick={() => { setSubjectId(""); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(""); setAiChapterName(""); }}
                className="text-xs text-slate-400 hover:text-slate-700 shrink-0">Clear</button>
            </div>
          ) : aiSubjectName ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-600 font-medium flex-1 truncate">
                {aiSubjectName}
              </span>
              <button type="button"
                onClick={() => { setSubjectId(""); setChapterId(""); setAiTopicId(""); setAiTopicName(""); setAiSubjectName(""); setAiChapterName(""); }}
                className="text-xs text-slate-400 hover:text-slate-700 shrink-0">Clear</button>
            </div>
          ) : (
            <p className="text-xs text-amber-600 pt-0.5">No selection — will use exam-based generation below.</p>
          )}
      </div>

      <div className="grid gap-3 grid-cols-1">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Number of Questions</label>
          <select
            value={countMode === "custom" ? "custom" : String(count)}
            onChange={e => {
              const v = e.target.value;
              if (v === "custom") {
                setCountMode("custom");
              } else {
                setCountMode("preset");
                setCount(+v);
              }
            }}
            className="h-10 w-full px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]">
            <option value={10}>10 questions (~15 min)</option>
            <option value={20}>20 questions (~30 min)</option>
            <option value={30}>30 questions (~45 min)</option>
            <option value={40}>40 questions (~60 min)</option>
            <option value={60}>60 questions (~90 min)</option>
            <option value="custom">Custom</option>
          </select>
          {countMode === "custom" && (
            <input
              type="number"
              min={1}
              max={300}
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              placeholder="Enter custom count (1-300)"
              className="mt-2 h-10 w-full px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]"
            />
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Difficulty</label>
        <select
          value={difficultyMode}
          onChange={(e) => setDifficultyMode(e.target.value as AiDifficultyMode)}
          className="h-10 w-full px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]"
        >
          <option value="mixed">Mixed (Easy + Medium + Hard)</option>
          <option value="easy">Easy only</option>
          <option value="medium">Medium only</option>
          <option value="hard">Hard only</option>
        </select>
        <p className="text-[11px] text-slate-400 mt-1">
          {difficultyMode === "mixed"
            ? "Target split: equal easy, medium, and hard."
            : `AI will generate ${difficultyMode}-level questions only.`}
        </p>
      </div>

      {(batchExamTarget || batchClass) && (
        <p className="text-xs text-slate-600 rounded-lg border border-slate-200 bg-slate-50/90 px-3 py-2 leading-relaxed">
          <span className="font-semibold text-slate-700">Cohort: </span>
          {batchExamTarget ? <span>{batchExamTarget}</span> : null}
          {batchExamTarget && batchClass ? " · " : null}
          {batchClass ? <span>Class {batchClass}</span> : null}
          {isCbseMix
            ? " — adds to the CBSE mix: board-style mark steps, NCERT-appropriate model answers, and class/exam phrasing (not a replacement for the board test pattern)."
            : " — phrasing and solutions align with the batch's target entrance exam."}
        </p>
      )}

      {!topicSelected && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500 mb-2">Subjects covered:</p>
          <div className="flex flex-wrap gap-1.5">
            {cfg.subjects.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[#013889]/10 text-[#013889] font-medium">{s}</span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {difficultyMode === "mixed"
              ? "Difficulty: equal easy · medium · hard"
              : `Difficulty: ${difficultyMode} only`}
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Additional Instructions <span className="text-slate-400 normal-case font-normal">(optional)</span>
        </label>
        <textarea rows={2} value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder={topicSelected
            ? `e.g. Include more numerical problems on ${aiTopicName}. Focus on advanced concepts.`
            : "e.g. Focus more on modern physics and organic chemistry. Avoid very long numerical problems."}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] resize-none" />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {generating && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Loader2 className="w-5 h-5 animate-spin text-[#013889] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {loader?.title ?? "Working…"}
                </p>
                {loader?.detail && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {loader.detail}
                  </p>
                )}
              </div>
            </div>
            <span className="text-sm font-mono font-bold text-[#013889] tabular-nums shrink-0">
              {loader?.percent ?? 0}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#013889] to-[#0257c8] transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, loader?.percent ?? 0))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Goal: {requestedCount} questions in this run
            {difficultyMode === "mixed"
              ? " — requested mix: equal easy · medium · hard (per segment)"
              : ` — all questions: ${difficultyMode}`}
            .
          </p>
        </div>
      )}
      {!generating && qualityReport && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold text-emerald-700">Generation quality</p>
          <p className="text-xs text-emerald-800 mt-0.5">{qualityReport}</p>
        </div>
      )}

      <Button type="button" className="w-full gap-2" disabled={generating} onClick={handleGenerate}
        style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
        {generating
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          : <><Wand2 className="w-4 h-4" /> Generate {requestedCount} Questions with AI</>
        }
      </Button>
    </div>
  );
}

// ─── CSV Import Modal ─────────────────────────────────────────────────────────

const CSV_TEMPLATE = [
  "question,option_a,option_b,option_c,option_d,correct_option,difficulty,marks_correct,marks_wrong",
  "What is Newton's first law?,An object at rest stays at rest,Force equals mass times acceleration,Energy is conserved,Action equals reaction,A,easy,4,-1",
  "The speed of light is approximately?,3×10^8 m/s,3×10^6 m/s,3×10^10 m/s,3×10^4 m/s,A,medium,4,-1",
].join("\n");

function parseCsvToQuestions(csv: string): DraftQuestion[] {
  const lines = csv.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(",").map(h => h.trim());
  const qi = header.indexOf("question");
  const oa = header.indexOf("option_a");
  const ob = header.indexOf("option_b");
  const oc = header.indexOf("option_c");
  const od = header.indexOf("option_d");
  const co = header.indexOf("correct_option");
  const di = header.indexOf("difficulty");
  const mc = header.indexOf("marks_correct");
  const mw = header.indexOf("marks_wrong");

  return lines.slice(1).map(line => {
    const cols: string[] = [];
    let cur = "", inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());

    const correct = (cols[co] ?? "A").toUpperCase();
    return {
      _key: ++_keyCounter,
      content: cols[qi] ?? "",
      type: "mcq_single" as const,
      difficulty: (cols[di] ?? "medium") as any,
      marksCorrect: Number(cols[mc] ?? 4),
      marksWrong: Number(cols[mw] ?? -1),
      options: [
        { optionLabel: "A", content: cols[oa] ?? "", isCorrect: correct === "A" },
        { optionLabel: "B", content: cols[ob] ?? "", isCorrect: correct === "B" },
        { optionLabel: "C", content: cols[oc] ?? "", isCorrect: correct === "C" },
        { optionLabel: "D", content: cols[od] ?? "", isCorrect: correct === "D" },
      ],
      integerAnswer: "",
    } satisfies DraftQuestion;
  }).filter(q => q.content.length > 0);
}

function CsvImportModal({
  onClose, onBack, onImported,
}: {
  onClose: () => void;
  onBack: () => void;
  onImported: (questions: DraftQuestion[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<DraftQuestion[]>([]);
  const [parseError, setParseError] = useState("");
  const fileRef: { current: HTMLInputElement | null } = { current: null };

  const handleFile = (file: File) => {
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCsvToQuestions(text);
        if (!parsed.length) { setParseError("No valid questions found. Check your CSV format."); return; }
        setPreview(parsed);
      } catch {
        setParseError("Failed to parse CSV. Make sure it matches the template format.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "questions_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
            <h3 className="text-lg font-bold text-slate-800">Bulk Import via CSV</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <button onClick={downloadTemplate}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-slate-200 hover:border-[#013889]/40 hover:bg-slate-50 transition-all mb-4 text-left">
          <Download className="w-4 h-4 text-[#013889] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-700">Download CSV Template</p>
            <p className="text-xs text-slate-400">Columns: question, option_a–d, correct_option (A/B/C/D), difficulty, marks_correct, marks_wrong</p>
          </div>
        </button>

        {!preview.length && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${dragging ? "border-[#013889] bg-blue-50" : "border-slate-200 hover:border-[#013889]/40 hover:bg-slate-50"}`}>
            <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">Drop CSV file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">Supports .csv files up to 100 questions</p>
            <input ref={r => { fileRef.current = r; }} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {parseError}
          </div>
        )}

        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />{preview.length} questions parsed successfully
              </p>
              <button onClick={() => setPreview([])} className="text-xs text-slate-400 hover:text-slate-700">Re-upload</button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {preview.map((q, i) => (
                <div key={q._key} className="text-xs bg-slate-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="text-slate-400 font-bold shrink-0">{i + 1}.</span>
                  <span className="text-slate-700 line-clamp-2">{q.content}</span>
                  <span className={`ml-auto shrink-0 px-1.5 py-0.5 rounded-full font-bold ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={() => onImported(preview)}>
              Use These {preview.length} Questions <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Create Test Modal (4-step wizard) ───────────────────────────────────────

const STEP_LABELS = ["Test Type", "Scope", "Details", "Questions"];

type WizardStep = 0 | 1 | 2 | 3;

const CATEGORY_TO_TYPE: Record<TestCategory, string> = {
  subject: "subject_test",
  chapter: "chapter_test",
  topic:   "topic_test",
};

const TEST_CATEGORY_CONFIG: Record<TestCategory, {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = {
  subject: {
    icon: BookOpen,
    label: "Subject Test",
    description: "A comprehensive test covering an entire subject — ideal for mid-term or end-of-term assessment.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  chapter: {
    icon: Layers,
    label: "Chapter Test",
    description: "A focused test for a specific chapter — perfect for post-chapter evaluation.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  topic: {
    icon: Target,
    label: "Topic Test",
    description: "A precise test targeting one topic — great for spot assessment and revision.",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
  },
};

function CreateTestModal({
  batchId, onClose, onCreated,
}: {
  batchId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const createMockTest = useCreateMockTest();

  const [step, setStep] = useState<WizardStep>(0);
  const [testCategory, setTestCategory] = useState<TestCategory | null>(null);
  const [scope, setScope] = useState<ScopeState>(emptyScope);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState<number | "">("");
  const [targetExam, setTargetExam] = useState<string>("JEE");
  const [questionMixIds, setQuestionMixIds] = useState<QuestionMixId[]>(["comp_mcq"]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion("mcq_single", "comp_mcq")]);
  const [activeTab, setActiveTab] = useState<"manual" | "ai" | "csv">("manual");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Scope selectors
  const { data: subjects } = useSubjects(batchId);
  const { data: chapters } = useChapters(scope.subjectId);
  const { data: topics } = useTopics(scope.chapterId);
  const { data: createModalBatch } = useBatch(batchId);
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList = Array.isArray(topics) ? topics : [];
  
  useEffect(() => {
    if (createModalBatch?.examTarget && targetExam !== createModalBatch.examTarget) {
      setTargetExam(createModalBatch.examTarget);
      const isCompetitive = ["JEE", "NEET"].includes(createModalBatch.examTarget);
      if (isCompetitive && !questionMixIds.some(id => id.startsWith("comp_"))) {
        setQuestionMixIds(["comp_mcq"]);
      } else if (!isCompetitive && !questionMixIds.some(id => id.startsWith("acad_"))) {
        setQuestionMixIds(["acad_mcq"]);
      }
    }
  }, [createModalBatch?.examTarget, targetExam, questionMixIds]);

  const manualMixOptions = (() => {
    const options: { type: DraftQKind; label: string }[] = [];
    const seen = new Set<string>();

    const add = (type: DraftQKind, label: string) => {
      const key = `${type}|${label}`;
      if (seen.has(key)) return;
      seen.add(key);
      options.push({ type, label });
    };

    for (const mixId of questionMixIds) {
      if (mixId === "comp_all") {
        add("mcq_single", "Assertion reason based");
        add("mcq_single", "Statement based");
        add("mcq_single", "MCQ based");
        add("descriptive", "Match the following based");
        add("descriptive", "Diagram based");
        add("mcq_multi", "MSQ");
        add("integer", "Integer based");
      } else if (mixId === "acad_all") {
        add("mcq_single", "MCQ based");
        add("mcq_single", "Assertion reason based");
        add("descriptive", "Short answer type");
        add("descriptive", "Detailed answers type");
        add("descriptive", "Case study based");
        add("descriptive", "Diagram based");
      } else {
        const choice = QUESTION_MIX_CHOICES.find(c => c.id === mixId);
        if (choice) {
          add(nextDraftKindForMix(mixId, 0), choice.label);
        }
      }
    }

    if (options.length === 0) {
      options.push({ type: "mcq_single", label: "MCQ (single-correct)" });
      options.push({ type: "mcq_multi", label: "MSQ (multi-correct)" });
      options.push({ type: "integer", label: "Integer / numerical" });
      options.push({ type: "descriptive", label: "Descriptive (short / long answer)" });
    }
    return options;
  })();

  const computedMarks = questions.reduce((sum, q) => sum + q.marksCorrect, 0);
  const computedDuration = Math.max(30, Math.ceil(questions.length * 1.5));

  const suggestTitle = (cat: TestCategory, s: ScopeState) => {
    if (cat === "topic" && s.topicName) return `${s.topicName} — Topic Test`;
    if (cat === "chapter" && s.chapterName) return `${s.chapterName} — Chapter Test`;
    if (cat === "subject" && s.subjectName) return `${s.subjectName} — Subject Test`;
    return "";
  };

  const canProceedStep0 = testCategory !== null;

  const canProceedStep1 = (() => {
    if (!testCategory) return false;
    if (testCategory === "subject") return !!scope.subjectId;
    if (testCategory === "chapter") return !!scope.subjectId && !!scope.chapterId;
    if (testCategory === "topic") return !!scope.subjectId && !!scope.chapterId && !!scope.topicId;
    return false;
  })();

  const canProceedStep2 = title.trim().length > 0 && durationMinutes > 0;

  const canSubmit = questions.length > 0 && questions.every((q) => {
    if (!q.content.trim().length && !q.contentImageUrl) return false;
    if (q.type === "integer")
      return (q.integerAnswer ?? "").toString().trim().length > 0;
    if (q.type === "descriptive") return true;
    return (q.options ?? []).some((o) => o.isCorrect) && (q.options ?? []).every((o) => o.content.trim().length > 0);
  });

  const handleNext = () => {
    setError("");
    if (step === 0 && canProceedStep0) {
      setStep(1);
    } else if (step === 1 && canProceedStep1) {
      if (!title) setTitle(suggestTitle(testCategory!, scope));
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setQuestions((prev) => {
        if (prev.length === 1 && !prev[0].content?.trim() && !prev[0].integerAnswer && !(prev[0] as DraftQuestion).solutionText) {
          const firstMixId = questionMixIds[0] || "comp_mcq";
          return [blankQuestion(nextDraftKindForMix(firstMixId, 0), firstMixId)];
        }
        return prev;
      });
      setStep(3);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 0) setStep((step - 1) as WizardStep);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Please complete all questions before submitting. Check for empty questions or missing correct answers.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const ids: string[] = [];
      for (const q of questions) {
        const payload: any = {
          content: q.content,
          type: q.type,
          difficulty: q.difficulty,
          marksCorrect: q.marksCorrect,
          marksWrong: q.marksWrong,
          tags: buildGeneratedTypeTags(undefined, q.generatedTypeLabel),
          solutionText: (q as DraftQuestion).solutionText || q.explanation || undefined,
          contentImageUrl: q.contentImageUrl || undefined,
        };
        if (scope.topicId) payload.topicId = scope.topicId;
        if (q.type === "integer") payload.integerAnswer = q.integerAnswer;
        else if (q.type === "descriptive") {
          if ((q as DraftQuestion).solutionText) payload.solutionText = (q as DraftQuestion).solutionText;
        } else payload.options = q.options;
        const created = await createQuestion(payload);
        ids.push(created.id);
      }

      const test = await createMockTest.mutateAsync({
        title: title.trim(),
        type: testCategory ? CATEGORY_TO_TYPE[testCategory] : "topic_test",
        batchId,
        durationMinutes: durationMinutes || computedDuration,
        totalMarks: computedMarks || ids.length * 4,
        passingMarks: passingMarks !== "" ? passingMarks : undefined,
        subjectId: scope.subjectId || undefined,
        chapterId: scope.chapterId || undefined,
        topicId: scope.topicId || undefined,
        questionIds: ids,
        examMode: targetExam,
      });

      onCreated(test.id);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to create test.";
      const errs = err?.response?.data?.errors;
      setError(Array.isArray(errs) ? errs.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (showCsvImport) {
    return (
      <CsvImportModal
        onClose={onClose}
        onBack={() => setShowCsvImport(false)}
        onImported={(imported) => {
          setQuestions(prev => [...prev.filter(q => q.content.trim()), ...imported]);
          setShowCsvImport(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/30 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={cn(
          "w-full rounded-2xl bg-white shadow-2xl p-6 my-8 transition-all duration-300 ease-in-out",
          step === 3 ? "max-w-[85%]" : "max-w-xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={handleBack} className="text-slate-400 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h3 className="text-lg font-bold text-slate-800">
              {step === 0 && "Choose Test Type"}
              {step === 1 && "Select Scope"}
              {step === 2 && "Test Details"}
              {step === 3 && "Add Questions"}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <StepBar current={step} steps={STEP_LABELS} />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 0: Test Type ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">What kind of test do you want to create?</p>
              {(["subject", "chapter", "topic"] as TestCategory[]).map((cat) => {
                const cfg = TEST_CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const isSelected = testCategory === cat;
                return (
                  <button key={cat} onClick={() => setTestCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      isSelected
                        ? `${cfg.border} ${cfg.bg}`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    )}>
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                      isSelected ? cfg.bg : "bg-slate-100")}>
                      <Icon className={cn("w-5 h-5", isSelected ? cfg.color : "text-slate-400")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-bold text-sm", isSelected ? cfg.color : "text-slate-700")}>{cfg.label}</p>
                        {isSelected && <Check className={cn("w-4 h-4", cfg.color)} />}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{cfg.description}</p>
                    </div>
                  </button>
                );
              })}
              <Button className="w-full mt-2 gap-2" disabled={!canProceedStep0} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 1: Scope ── */}
          {step === 1 && testCategory && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div className={cn("flex items-center gap-2 p-3 rounded-xl border",
                TEST_CATEGORY_CONFIG[testCategory].border,
                TEST_CATEGORY_CONFIG[testCategory].bg)}>
                {(() => { const Icon = TEST_CATEGORY_CONFIG[testCategory].icon; return <Icon className={cn("w-4 h-4 shrink-0", TEST_CATEGORY_CONFIG[testCategory].color)} />; })()}
                <p className={cn("text-xs font-semibold", TEST_CATEGORY_CONFIG[testCategory].color)}>
                  {TEST_CATEGORY_CONFIG[testCategory].label} — select the scope below
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Subject *</label>
                <select value={scope.subjectId}
                  onChange={e => {
                    const id = e.target.value;
                    const name = subjectList.find(s => s.id === id)?.name ?? "";
                    setScope({ ...emptyScope, subjectId: id, subjectName: name });
                  }}
                  className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]">
                  <option value="">— Select Subject —</option>
                  {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!subjectList.length && <p className="text-xs text-amber-500 mt-1">No subjects found. Create subjects in Content first.</p>}
              </div>

              {/* Chapter */}
              {(testCategory === "chapter" || testCategory === "topic") && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Chapter *</label>
                  <select value={scope.chapterId} disabled={!scope.subjectId}
                    onChange={e => {
                      const id = e.target.value;
                      const name = chapterList.find(c => c.id === id)?.name ?? "";
                      setScope(s => ({ ...s, chapterId: id, chapterName: name, topicId: "", topicName: "" }));
                    }}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] disabled:opacity-40">
                    <option value="">— Select Chapter —</option>
                    {chapterList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Topic */}
              {testCategory === "topic" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Topic *</label>
                  <select value={scope.topicId} disabled={!scope.chapterId}
                    onChange={e => {
                      const id = e.target.value;
                      const name = topicList.find(t => t.id === id)?.name ?? "";
                      setScope(s => ({ ...s, topicId: id, topicName: name }));
                    }}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] disabled:opacity-40">
                    <option value="">— Select Topic —</option>
                    {topicList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}

              {/* Scope path preview */}
              {scope.subjectId && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium text-slate-700">
                    {[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ")}
                  </span>
                </div>
              )}

              <Button className="w-full gap-2" disabled={!canProceedStep1} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Test Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={suggestTitle(testCategory!, scope) || "e.g. Chapter 1 — Kinematics Test"}
                  className="h-10 w-full px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] focus:ring-2 focus:ring-[#013889]/10" />
                {!title && (
                  <button onClick={() => setTitle(suggestTitle(testCategory!, scope))}
                    className="mt-1 text-xs text-[#013889] hover:underline font-medium">
                    Use suggested: "{suggestTitle(testCategory!, scope) || `${scope.subjectName} Test`}"
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Duration (minutes) *</label>
                  <input type="number" min={1} value={durationMinutes}
                    onChange={e => setDurationMinutes(+e.target.value)}
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Passing Marks <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                  <input type="number" min={0} value={passingMarks}
                    onChange={e => setPassingMarks(e.target.value === "" ? "" : +e.target.value)}
                    placeholder="e.g. 60"
                    className="h-10 w-full px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889]" />
                </div>
              </div>

              {/* Target Exam info block instead of selector */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <label className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1">Target Exam</label>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#013889]" />
                  <span className="text-sm font-bold text-slate-800">{targetExam.replace("_", " ")}</span>
                  <span className="text-xs text-slate-400">— {EXAM_CONFIGS[targetExam]?.description}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Question types *</label>
                <p className="text-[11px] text-slate-400 mb-2">Select one or more templates. The AI will distribute questions proportionally.</p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 max-h-[300px] overflow-y-auto space-y-4">
                  {(() => {
                    const isCompetitive = targetExam.toUpperCase().includes("JEE") || targetExam.toUpperCase().includes("NEET");
                    const filtered = QUESTION_MIX_CHOICES.filter(c =>
                      isCompetitive
                        ? c.id.startsWith("comp_")
                        : c.id.startsWith("acad_")
                    );
                    
                    let lastGroup = "";
                    return filtered.map((c, idx) => {
                      const showGroup = c.group !== lastGroup;
                      lastGroup = c.group;
                      return (
                        <div key={c.id} className={cn("space-y-2", showGroup && idx > 0 && "pt-2 border-t border-slate-200/60")}>
                          {showGroup && (
                            <p className="text-[10px] font-black uppercase tracking-wider text-[#013889] mb-2 pl-0.5">
                              {c.group}
                            </p>
                          )}
                          <label className="flex items-start gap-2.5 cursor-pointer group">
                            <input type="checkbox"
                              checked={questionMixIds.includes(c.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setQuestionMixIds(prev => [...prev, c.id]);
                                } else {
                                  if (questionMixIds.length > 1) {
                                    setQuestionMixIds(prev => prev.filter(id => id !== c.id));
                                  }
                                }
                              }}
                              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#013889] focus:ring-[#013889] cursor-pointer" />
                            <div>
                               <span className="text-sm font-semibold text-slate-700 group-hover:text-[#013889] transition-colors">{c.label}</span>
                               <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{c.hint}</p>
                            </div>
                          </label>
                        </div>
                      );
                    });
                  })()}
                </div>
                {isCompetitiveMix(questionMixIds[0] || "comp_mcq") ? (
                  <p className="text-[11px] text-amber-700 mt-1">Competitive marking active: correct adds marks, wrong deducts marks.</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">{CBSE_THEORY_PATTERN_NOTE}</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-600">Test Summary</p>
                <p>Scope: <span className="text-slate-700 font-medium">{[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ") || "—"}</span></p>
                <p>Type: <span className="text-slate-700 font-medium">{testCategory ? TEST_CATEGORY_CONFIG[testCategory].label : "—"}</span></p>
                <p>Questions: <span className="text-slate-700 font-medium">{QUESTION_MIX_CHOICES.filter(c => questionMixIds.includes(c.id)).map(c => c.label).join(", ") || "—"}</span></p>
                <p className="text-amber-600">Total Marks: computed from questions added in next step</p>
              </div>

              <Button className="w-full gap-2" disabled={!canProceedStep2} onClick={handleNext}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                Continue to Questions <ChevronRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 3: Questions ── */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <div className="flex-1">
                  <p className="font-bold text-slate-700 truncate">{title}</p>
                  <p className="text-slate-400 mt-0.5">{[scope.subjectName, scope.chapterName, scope.topicName].filter(Boolean).join(" › ") || "—"} · {durationMinutes} min · {QUESTION_MIX_CHOICES.filter(c => questionMixIds.includes(c.id)).map(c => c.label).join(", ")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#013889]">{questions.length}Q</p>
                  <p className="text-slate-400">{computedMarks} marks</p>
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(["manual", "ai", "csv"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all capitalize",
                      activeTab === tab ? "bg-white text-[#013889] shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}>
                    {tab === "ai" ? "AI Generate" : tab === "csv" ? "CSV Import" : "Manual"}
                  </button>
                ))}
              </div>

              {/* Manual Tab */}
              {activeTab === "manual" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{questions.length} question{questions.length !== 1 ? "s" : ""}</p>
                    <button onClick={() => {
                      const opt = manualMixOptions[0];
                      setQuestions([...questions, blankQuestion(opt.type, questionMixIds[0] || "comp_mcq", opt.label)]);
                    }}
                      className="flex items-center gap-1 text-xs font-bold text-[#013889] hover:text-[#0257c8]">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {questions.map((q, i) => (
                      <QuestionRow key={q._key} q={q} index={i}
                        onChange={u => { const next = [...questions]; next[i] = u; setQuestions(next); }}
                        onRemove={() => setQuestions(questions.filter((_, j) => j !== i))}
                        canRemove={questions.length > 1}
                        allowedMixes={manualMixOptions} />
                    ))}
                  </div>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === "ai" && (
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  <AIGeneratePanel
                    exam={targetExam}
                    batchId={batchId}
                    testCategory={testCategory}
                    questionMixIds={questionMixIds}
                    batchExamTarget={createModalBatch?.examTarget}
                    batchClass={createModalBatch?.class}
                    initSubjectId={scope.subjectId}
                    initSubjectName={scope.subjectName}
                    initChapterId={scope.chapterId}
                    initChapterName={scope.chapterName}
                    initTopicId={scope.topicId}
                    initTopicName={scope.topicName}
                    onQuestionsGenerated={(drafts) => {
                      setQuestions(prev => {
                        const hasContent = prev.filter(q => q.content.trim().length > 0);
                        return [...hasContent, ...drafts];
                      });
                      setActiveTab("manual");
                    }}
                  />
                </div>
              )}

              {/* CSV Tab */}
              {activeTab === "csv" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">Import questions from a CSV file. Download the template to see the required format.</p>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setShowCsvImport(true)}>
                    <Upload className="w-4 h-4" /> Open CSV Import
                  </Button>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {computedMarks > 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    {questions.length} questions · {computedMarks} total marks · {durationMinutes} min
                  </p>
                )}
                <Button className="w-full gap-2" disabled={submitting || questions.length === 0}
                  onClick={handleSubmit}
                  style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving {questions.length} questions…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Create Test</>
                  }
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Add Question to existing test ───────────────────────────────────────────

function AddQuestionModal({ mockTestId, existingIds, batchId, onClose }: {
  mockTestId: string; existingIds: string[]; batchId?: string; onClose: () => void;
}) {
  const updateMockTest = useUpdateMockTest();
  const [q, setQ] = useState<DraftQuestion>(blankQuestion());
  const [topicId, setTopicId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload: any = {
        content: q.content, type: q.type, difficulty: q.difficulty,
        marksCorrect: q.marksCorrect, marksWrong: q.marksWrong,
        tags: buildGeneratedTypeTags(undefined, q.generatedTypeLabel),
        solutionText: (q as DraftQuestion).solutionText || q.explanation || undefined,
        contentImageUrl: q.contentImageUrl || undefined,
      };
      if (topicId) payload.topicId = topicId;
      if (q.type === "integer") payload.integerAnswer = q.integerAnswer;
      else if (q.type === "descriptive") {
        if ((q as DraftQuestion).solutionText) payload.solutionText = (q as DraftQuestion).solutionText;
      } else payload.options = q.options;
      const created = await createQuestion(payload);
      await updateMockTest.mutateAsync({ id: mockTestId, questionIds: [...existingIds, created.id] });
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed.";
      setError(Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/30 p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">Add Question</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <TopicPicker value={topicId} onChange={setTopicId} batchId={batchId} />
          <QuestionRow q={q} index={0} onChange={setQ} onRemove={() => {}} canRemove={false} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1" disabled={submitting}
              style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Question"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Mock Test Detail ─────────────────────────────────────────────────────────

/** Model / exemplar text (API may send camelCase or snake_case from Postgres). */
function getQuestionModelAnswer(q: MockTestQuestion & { solution_text?: string | null }): string {
  const s = q.solutionText ?? q.solution_text;
  return typeof s === "string" && s.trim() ? s.trim() : "";
}

function MockTestDetail({ testId, onBack }: { testId: string; onBack: () => void }) {
  const { data: test, isLoading } = useMockTestDetail(testId);
  const publishMockTest = usePublishMockTest();
  const updateMockTest = useUpdateMockTest();
  const removeQuestion = useRemoveQuestionFromMockTest(testId);
  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const questions = test?.questions ?? [];
  const existingIds = questions.map(q => q.id);

  if (isLoading) return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
    </div>
  );
  if (!test) return null;

  const handleRemove = (questionId: string) => {
    const newIds = existingIds.filter(id => id !== questionId);
    if (newIds.length > 0) {
      updateMockTest.mutate({ id: testId, questionIds: newIds });
    } else {
      removeQuestion.mutate(questionId);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tests
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <h2 className="text-lg font-bold text-slate-800">{test.title}</h2>
          {test.type && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[test.type] ?? "bg-slate-100 text-slate-500"}`}>
              {TYPE_LABELS[test.type] ?? test.type}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${test.isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
            {test.isPublished ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" disabled={publishMockTest.isPending}
            onClick={() => publishMockTest.mutate({ id: testId, publish: !test.isPublished })}>
            {publishMockTest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : test.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {test.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddQuestion(true)}
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
            <Plus className="w-3 h-3" /> Add Question
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Questions", value: questions.length, icon: <ClipboardList className="w-4 h-4" /> },
          { label: "Duration", value: `${test.durationMinutes} min`, icon: <Clock className="w-4 h-4" /> },
          { label: "Total Marks", value: test.totalMarks, icon: <CheckCircle2 className="w-4 h-4" /> },
          { label: "Passing Marks", value: test.passingMarks ?? "—", icon: <AlertCircle className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #E6EEF8 0%, #CCE0F5 100%)", color: BLUE }}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-base font-bold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No questions yet</p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={() => setShowAddQuestion(true)}
            style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
            <Plus className="w-3.5 h-3.5" /> Add Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => {
            const modelAnswer = getQuestionModelAnswer(q);
            return (
            <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 mt-0.5 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 leading-relaxed">{q.content}</p>
                    {(q.contentImageUrl || q.content_image_url) && (
                      <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 max-w-sm">
                        <img src={resolveMediaUrl(q.contentImageUrl || q.content_image_url)} alt="Question visual" className="w-full h-auto" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {getQuestionTypeBadgeLabel(q as any)}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold">+{q.marksCorrect}</span>
                      {q.marksWrong !== 0 && <span className="text-xs text-red-500 font-semibold">{q.marksWrong}</span>}
                    </div>
                    {modelAnswer && (
                      <div className="mt-3 rounded-lg border border-[#013889]/20 bg-[#E6EEF8]/50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#013889]/80 mb-1.5">
                          {q.type === "descriptive" ? "Model answer (review before publish)" : "Explanation (review before publish)"}
                        </p>
                        <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">{modelAnswer}</p>
                      </div>
                    )}
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {q.options.map(o => (
                          <div key={o.id} className={cn("flex items-center gap-2 text-xs rounded-lg px-2 py-1",
                            o.isCorrect ? "bg-emerald-50 text-emerald-700" : "text-slate-500")}>
                            <span className="font-bold w-4">{o.optionLabel}.</span>
                            <span>{o.content}</span>
                            {o.isCorrect && <CheckCircle2 className="w-3 h-3 ml-auto shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}
                    {q.type === "integer" && (() => {
                      const intq = q as MockTestQuestion & { integer_answer?: string | null };
                      const ival = intq.integerAnswer ?? intq.integer_answer;
                      return ival
                        ? (
                          <p className="mt-2 text-xs text-slate-600">
                            <span className="font-semibold text-slate-500">Expected answer: </span>
                            {ival}
                          </p>
                        )
                        : null;
                    })()}
                  </div>
                </div>
                <button onClick={() => handleRemove(q.id)}
                  disabled={updateMockTest.isPending || removeQuestion.isPending}
                  className="shrink-0 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {showAddQuestion && (
        <AddQuestionModal 
          mockTestId={testId} 
          existingIds={existingIds} 
          batchId={test.batchId} 
          onClose={() => setShowAddQuestion(false)} 
        />
      )}
    </motion.div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────

function BatchCard({ batch, onClick }: { batch: Batch; onClick: () => void }) {
  const initials = batch.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const [imgError, setImgError] = useState(false);
  const resolvedThumb = resolveMediaUrl(batch.thumbnailUrl);
  const showImg = !!resolvedThumb && !imgError;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-[#013889]/30 transition-all overflow-hidden"
    >
      {/* Thumbnail / gradient header */}
      <div className="h-28 relative flex items-end p-3"
        style={{ background: showImg ? undefined : `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
        {showImg ? (
          <img src={resolvedThumb} alt={batch.name} onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-black text-white/20">{initials}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative flex items-center gap-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {batch.examTarget}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
            {batch.class}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm truncate">{batch.name}</h3>
        {batch.description && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{batch.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{batch.studentCount ?? 0} students</span>
          </div>
          <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full",
            batch.status === "active" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
            {batch.status}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type MainView = "batches" | "tests" | "detail";

const MockTestsPage = () => {
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const deleteMockTest = useDeleteMockTest();
  const publishMockTest = usePublishMockTest();

  const [view, setView] = useState<MainView>("batches");
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");

  const { data: tests, isLoading: testsLoading } = useMockTests(
    selectedBatch ? { batchId: selectedBatch.id } : undefined
  );

  const batchList = Array.isArray(batches) ? batches : [];
  const testList = Array.isArray(tests) ? tests : [];

  const filteredBatches = batchList.filter(b =>
    b.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
    b.examTarget.toLowerCase().includes(batchSearch.toLowerCase())
  );

  const openBatch = (batch: Batch) => {
    setSelectedBatch(batch);
    setView("tests");
  };

  const goBack = () => {
    if (view === "detail") { setView("tests"); setSelectedTestId(""); }
    else if (view === "tests") { setView("batches"); setSelectedBatch(null); }
  };

  const [examFilter, setExamFilter] = useState<"all" | "competitive" | "academic">("all");

  const inferExamLane = (t: any) => {
    // 1. Check explicit examMode set during creation
    const rawMode = t.examMode || t.exam_mode;
    if (rawMode) {
      const mode = String(rawMode).toLowerCase();
      if (mode.includes("jee") || mode.includes("neet")) return "competitive";
      if (mode.includes("cbse") || mode.includes("acad") || mode.includes("class") || mode.includes("school") || mode.includes("board")) return "academic";
    }

    // 2. Fallback to title/type hints
    const hint = `${t.title || ""} ${t.type || ""}`.toLowerCase();
    if (hint.includes("compet") || hint.includes("jee") || hint.includes("neet") || hint.includes("olympiad"))
      return "competitive";
    if (
      hint.includes("acad") ||
      hint.includes("cbse") ||
      hint.includes("board") ||
      hint.includes("school") ||
      hint.includes("class") ||
      hint.includes("ncert") ||
      hint.includes("exam")
    )
      return "academic";

    return "competitive";
  };

  const visibleTests = examFilter === "all" ? testList : testList.filter(t => inferExamLane(t) === examFilter);

  const getCount = (lane: "competitive" | "academic" | "all") => {
    if (lane === "all") return testList.length;
    return testList.filter(t => inferExamLane(t) === lane).length;
  };

  // ── Detail view ──
  if (view === "detail" && selectedTestId) {
    return (
      <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
        <MockTestDetail testId={selectedTestId} onBack={() => { setView("tests"); setSelectedTestId(""); }} />
      </div>
    );
  }

  // ── Phase 1: Batch grid ──
  if (view === "batches") {
    return (
      <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800">Mock Tests</h1>
          <p className="text-sm text-slate-400 mt-0.5">Select a course to view and manage its mock tests</p>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
            placeholder="Search courses…"
            className="h-10 w-full pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#013889] focus:ring-2 focus:ring-[#013889]/10 shadow-sm"
          />
        </div>

        {batchesLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold text-slate-500">{batchSearch ? "No courses match your search" : "No courses found"}</p>
            <p className="text-sm text-slate-400 mt-1">Create courses in the Courses section first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBatches.map(batch => (
              <BatchCard key={batch.id} batch={batch} onClick={() => openBatch(batch)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Phase 2: Tests for selected batch ──
  return (
    <div className="min-h-screen p-6" style={{ background: "#F7FAFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={goBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800">{selectedBatch!.name}</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                {selectedBatch!.examTarget}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {selectedBatch!.class}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {testList.length} test{testList.length !== 1 ? "s" : ""} · {selectedBatch!.studentCount ?? 0} students
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-1.5"
          style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
          <Plus className="w-4 h-4" /> Create Test
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["all", "competitive", "academic"] as const).map((lane) => {
          const count = getCount(lane);
          return (
            <button
              key={lane}
              onClick={() => setExamFilter(lane)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 shadow-sm",
                examFilter === lane
                  ? "bg-[#013889] text-white border-transparent"
                  : "bg-white text-slate-500 border-slate-200 hover:border-[#013889]/30 hover:text-[#013889]"
              )}
            >
              <span className="capitalize">{lane === "academic" ? "Academic (CBSE)" : lane}</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                examFilter === lane ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tests list */}
      {testsLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: BLUE }} />
        </div>
      ) : visibleTests.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <ClipboardList className="w-14 h-14 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-bold text-slate-500">No tests found</p>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            {examFilter !== "all" ? `No tests matching the "${examFilter}" filter.` : "Create a Subject Test, Chapter Test, or Topic Test for this course"}
          </p>
          {examFilter === "all" && (
            <div className="flex gap-2 justify-center mt-5">
              <Button className="gap-1.5" onClick={() => setShowCreate(true)}
                style={{ background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_M} 100%)` }}>
                <Sparkles className="w-3.5 h-3.5" /> Create with AI
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
                <Plus className="w-3.5 h-3.5" /> Add Manually
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTests.map(test => (
            <motion.div key={test.id} layout
              className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#013889]/30 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #E6EEF8 0%, #CCE0F5 100%)" }}>
                    <ClipboardList className="w-5 h-5" style={{ color: BLUE }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-slate-800 text-sm truncate">{test.title}</h4>
                      {test.type && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[test.type] ?? "bg-slate-100 text-slate-500"}`}>
                          {TYPE_LABELS[test.type] ?? test.type}
                        </span>
                      )}
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                        test.isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                        {test.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(test.questionIds?.length ?? 0)} questions · {test.durationMinutes} min · {test.totalMarks} marks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
                    disabled={publishMockTest.isPending}
                    onClick={() => publishMockTest.mutate({ id: test.id, publish: !test.isPublished })}>
                    {test.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {test.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 text-xs h-8"
                    onClick={() => { setSelectedTestId(test.id); setView("detail"); }}>
                    <Pencil className="w-3 h-3" /> Manage
                  </Button>
                  <button onClick={() => deleteMockTest.mutate(test.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showCreate && selectedBatch && (
          <CreateTestModal
            batchId={selectedBatch.id}
            onClose={() => setShowCreate(false)}
            onCreated={id => { setShowCreate(false); setSelectedTestId(id); setView("detail"); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTestsPage;
