/* eslint-disable @typescript-eslint/no-explicit-any */
import { getApiOrigin } from "@/lib/api-config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DraftResult = {
  marksObtained: string;
  grade: string;
  remarks: string;
  isAbsent: boolean;
};

type ParsedAnswer = {
  key: string;
  number: string;
  value: string;
};

export type StructuredAnswerRow = {
  id: string;
  number: string;
  sectionTitle?: string;
  type: string;
  questionText: string;
  answerText: string;
  options?: Array<{ id?: string; label?: string; text?: string; value?: string }>;
  correctAnswer?: string;
  marksAwarded?: number;
  marksTotal?: number;
  gradingStatus?: string;
  submitted: boolean;
};

// ─── Simple Utilities ─────────────────────────────────────────────────────────

export function percentage(marks: number, total: number) {
  if (!total) return 0;
  return Math.round((marks / total) * 100);
}

export function gradeFromPercent(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 45) return "C";
  if (pct >= 33) return "D";
  return "F";
}

export function resolveUploadUrl(filePath: string | null | undefined) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = String(filePath).replace(/^\.\//, "").replace(/^uploads[/\\]/, "");
  return `${getApiOrigin()}/uploads/${clean}`;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function prepareNumberedText(text: string) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+(?=(?:Section|Part|Answer Key|Answers|Ans Key)\b)/gi, "\n")
    .replace(/([^\n])\s+(?=(?:Q(?:uestion)?\s*)?\d{1,2}\s*[\).:-]\s+)/gi, "$1\n")
    .trim();
}

function parseNumberedAnswers(text: string): ParsedAnswer[] {
  const counters = new Map<string, number>();
  const entries: ParsedAnswer[] = [];
  const lines = prepareNumberedText(text).split("\n");

  for (const line of lines) {
    const match = line.match(/^\s*(?:Q(?:uestion)?\s*)?(\d{1,2})\s*[\).:-]\s*(.+?)\s*$/i);
    if (match) {
      const number = match[1];
      const occurrence = (counters.get(number) || 0) + 1;
      counters.set(number, occurrence);
      entries.push({
        key: `${number}:${occurrence}`,
        number,
        value: match[2].trim(),
      });
      continue;
    }

    if (entries.length && line.trim()) {
      entries[entries.length - 1].value = `${entries[entries.length - 1].value} ${line.trim()}`;
    }
  }

  return entries.filter((entry) => entry.value);
}

function normalizeAnswer(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[\s"'`]*(?:answer|ans|option)\s*[:.-]?\s*/i, "")
    .replace(/^[\s"'`]*[\(\[]?([a-d])[\)\].:-]?\s*/i, "$1 ")
    .replace(/[^\p{L}\p{N}.+-]+/gu, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractOption(value: string) {
  const match = String(value || "").trim().match(/^(?:answer|ans|option)?\s*[\(:.-]?\s*([a-d])\s*[\).:-]?/i);
  return match?.[1]?.toLowerCase() || null;
}

function isTheoryAnswer(questionText: string, expectedAnswer: string) {
  const combined = `${questionText} ${expectedAnswer}`.toLowerCase();
  if (/(explain|describe|discuss|elaborate|justify|why|how|write\s+in\s+detail|long\s+answer|essay|theory)/i.test(combined)) {
    return true;
  }
  const expectedWords = normalizeAnswer(expectedAnswer).split(/\s+/).filter(Boolean);
  return expectedWords.length > 12;
}

export function answersMatch(expected: string, actual: string) {
  const expectedOption = extractOption(expected);
  const actualOption = extractOption(actual);
  if (expectedOption && actualOption) return expectedOption === actualOption;

  const normalizedExpected = normalizeAnswer(expected);
  const normalizedActual = normalizeAnswer(actual);
  if (!normalizedExpected || !normalizedActual) return false;

  const expectedSet = new Set(normalizedExpected.split(/\s*,\s*|\s+and\s+|\s+/).filter(Boolean));
  const actualSet = new Set(normalizedActual.split(/\s*,\s*|\s+and\s+|\s+/).filter(Boolean));
  if (expectedSet.size > 1 && expectedSet.size === actualSet.size) {
    return [...expectedSet].every((item) => actualSet.has(item));
  }

  return normalizedExpected === normalizedActual;
}

function autoGradeNumberedSubmission({
  questionText,
  answerKey,
  submissionText,
  totalMarks,
}: {
  questionText: string;
  answerKey: string;
  submissionText: string;
  totalMarks: number;
}) {
  const expected = parseNumberedAnswers(answerKey);
  const submitted = parseNumberedAnswers(submissionText);
  const questions = parseNumberedAnswers(questionText);
  const submittedByKey = new Map(submitted.map((entry) => [entry.key, entry]));
  const submittedByIndex = new Map(submitted.map((entry, index) => [index, entry]));
  const questionByKey = new Map(questions.map((entry) => [entry.key, entry]));

  const totalKeyed = expected.length;
  const perQuestionMarks = totalKeyed ? totalMarks / totalKeyed : 0;
  let checked = 0;
  let correct = 0;
  const wrong: string[] = [];
  const missing: string[] = [];
  const skipped: string[] = [];

  expected.forEach((entry, index) => {
    const question = questionByKey.get(entry.key)?.value || "";
    if (isTheoryAnswer(question, entry.value)) {
      skipped.push(entry.number);
      return;
    }

    const studentAnswer = submittedByKey.get(entry.key) || submittedByIndex.get(index);
    if (!studentAnswer?.value) {
      missing.push(entry.number);
      checked += 1;
      return;
    }

    checked += 1;
    if (answersMatch(entry.value, studentAnswer.value)) {
      correct += 1;
    } else {
      wrong.push(entry.number);
    }
  });

  const marks = Math.round(correct * perQuestionMarks * 100) / 100;

  return { marks, checked, correct, wrong, missing, skipped, totalKeyed };
}

export { autoGradeNumberedSubmission };

function parseJsonObject(value: any) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function parseJsonArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function getAssessmentQuestions(assessment: any) {
  const questions = assessment?.questions_json || assessment?.questionsJson || assessment?.questions || [];
  return parseJsonArray(questions);
}

function getQuestionSectionLetter(question: any) {
  const section = String(question?.sectionTitle || question?.section || "");
  return (
    section.match(/section\s+([A-E])/i)?.[1]?.toUpperCase() ||
    section.match(/[-–]\s*([A-E])\b/i)?.[1]?.toUpperCase() ||
    ""
  );
}

function parseInlineQuestionOptions(text: any) {
  const body = String(text || "");
  const matches = Array.from(body.matchAll(/\(([a-dA-D])\)\s*/g));
  if (matches.length < 2) return { text: body, options: [] as any[] };
  const questionText = body.slice(0, matches[0].index || 0).trim() || body;
  const options = matches
    .map((match, index) => {
      const start = (match.index || 0) + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index || body.length : body.length;
      return { id: match[1].toLowerCase(), label: match[1], text: body.slice(start, end).trim() };
    })
    .filter((option) => option.text);
  return { text: questionText, options };
}

export function getEffectiveQuestion(question: any) {
  const inline = parseInlineQuestionOptions(question?.text);
  const sectionLetter = getQuestionSectionLetter(question);
  const hasOptions = Array.isArray(question?.options) && question.options.length > 0;
  let type = question?.type || "short_answer";
  let marks = Number(question?.marks || 1);
  if (hasOptions || inline.options.length) {
    type = "mcq_single";
    marks = 1;
  } else if (sectionLetter === "A") {
    type = "mcq_single";
    marks = 1;
  } else if (sectionLetter === "B") {
    type = "true_false";
    marks = 1;
  } else if (sectionLetter === "C") {
    type = "fill_blank";
    marks = 1;
  } else if (sectionLetter === "D") {
    type = "short_answer";
    marks = Number(question?.marks || 3);
  } else if (sectionLetter === "E") {
    type = "long_answer";
    marks = Number(question?.marks || 5);
  }

  return {
    ...question,
    type,
    marks,
    text: inline.options.length ? inline.text : question?.text,
    options:
      type === "true_false"
        ? [
            { id: "true", label: "True", text: "True" },
            { id: "false", label: "False", text: "False" },
          ]
        : hasOptions
        ? question.options
        : inline.options,
  };
}

function formatSubmittedValue(question: any, rawValue: any) {
  const value = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue ?? "").trim();
  if (!value) return "";

  if (question?.type === "mcq_single" && Array.isArray(question.options)) {
    const selected = question.options.find((option: any) => {
      const optionValue = option.id || option.value || option.text;
      return String(optionValue) === value;
    });
    if (selected) {
      const label = selected.label || selected.id || selected.value || "";
      const text = selected.text || selected.label || selected.value || value;
      return label ? `${label}. ${text}` : text;
    }
  }

  return value;
}

export function getGradingDetailsMap(submission: any) {
  const details = parseJsonArray(submission?.grading_details || submission?.gradingDetails);
  return new Map(
    details.map((detail: any) => [String(detail.questionId || detail.question_id || detail.id), detail])
  );
}

function hasSubmittedValue(value: any) {
  return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
}

function buildStructuredAnswerRow(
  question: any,
  questionId: string,
  value: any,
  index: number,
  detail: any
): StructuredAnswerRow {
  const effectiveQuestion = getEffectiveQuestion(question);
  const number = String(effectiveQuestion.displayNumber || effectiveQuestion.number || index + 1);
  const submitted = hasSubmittedValue(value);
  const isObjective = ["mcq_single", "true_false", "fill_blank", "integer"].includes(effectiveQuestion.type);
  const correctAnswer = isObjective
    ? effectiveQuestion.correctAnswer || effectiveQuestion.correct_answer
    : undefined;
  const inferredTotal = Number(effectiveQuestion.marks || 1);
  const inferredAwarded =
    isObjective && correctAnswer
      ? submitted && answersMatch(String(correctAnswer), String(value ?? ""))
        ? inferredTotal
        : 0
      : undefined;
  const detailTotal = detail?.total !== undefined ? Number(detail.total) : undefined;
  const detailMatchesQuestion = detailTotal === undefined || detailTotal === inferredTotal;
  return {
    id: questionId,
    number,
    sectionTitle: effectiveQuestion.sectionTitle || effectiveQuestion.section || undefined,
    type: effectiveQuestion.type || "answer",
    questionText: effectiveQuestion.text || `Question ${number}`,
    answerText: submitted ? formatSubmittedValue(effectiveQuestion, value) : "",
    options: Array.isArray(effectiveQuestion.options) ? effectiveQuestion.options : undefined,
    correctAnswer,
    // Teacher override always takes priority over auto-graded marks
    marksAwarded:
      detail?.teacherReview?.finalMarks !== undefined
        ? Number(detail.teacherReview.finalMarks)
        : isObjective && correctAnswer !== undefined
        ? inferredAwarded
        : detail?.marks !== undefined && detailMatchesQuestion
        ? Number(detail.marks)
        : inferredAwarded,
    marksTotal:
      detailTotal !== undefined && detailMatchesQuestion ? detailTotal : isObjective ? inferredTotal : undefined,
    gradingStatus: detail?.teacherReview ? "reviewed" : detail?.status,
    submitted,
  };
}

export function getStructuredAnswerRows(
  assessment: any,
  submission: any,
  options: { includeBlank?: boolean } = {}
): StructuredAnswerRow[] {
  const answers = parseJsonObject(submission?.answers_json || submission?.answersJson);
  const questions = getAssessmentQuestions(assessment);
  const questionMap = new Map(questions.map((question: any) => [String(question.id), question]));
  const gradingDetails = getGradingDetailsMap(submission);

  if (options.includeBlank && questions.length) {
    return questions.map((question: any, index: number) => {
      const questionId = String(question.id || `q-${index + 1}`);
      return buildStructuredAnswerRow(
        question,
        questionId,
        answers[questionId],
        index,
        gradingDetails.get(questionId)
      );
    });
  }

  return Object.entries(answers)
    .filter(([, value]) => hasSubmittedValue(value))
    .map(([questionId, value], index) => {
      const question: any = questionMap.get(String(questionId)) || {};
      return buildStructuredAnswerRow(question, questionId, value, index, gradingDetails.get(String(questionId)));
    });
}
