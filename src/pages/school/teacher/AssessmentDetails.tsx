/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Save,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Modal from "@/components/school/Modal";
import Tabs from "@/components/school/Tabs";
import StatCard from "@/components/school/StatCard";
import DataTable from "@/components/school/DataTable";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import { getApiOrigin } from "@/lib/api-config";
import "./AssessmentSystem.css";

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

type StructuredAnswerRow = {
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

function answersMatch(expected: string, actual: string) {
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

  return {
    marks,
    checked,
    correct,
    wrong,
    missing,
    skipped,
    totalKeyed,
  };
}

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

function getAssessmentQuestions(assessment: any) {
  const questions = assessment?.questions_json || assessment?.questionsJson || assessment?.questions || [];
  return parseJsonArray(questions);
}

function getQuestionSectionLetter(question: any) {
  const section = String(question?.sectionTitle || question?.section || "");
  return section.match(/section\s+([A-E])/i)?.[1]?.toUpperCase()
    || section.match(/[-–]\s*([A-E])\b/i)?.[1]?.toUpperCase()
    || "";
}

function parseInlineQuestionOptions(text: any) {
  const body = String(text || "");
  const matches = Array.from(body.matchAll(/\(([a-dA-D])\)\s*/g));
  if (matches.length < 2) return { text: body, options: [] as any[] };
  const questionText = body.slice(0, matches[0].index || 0).trim() || body;
  const options = matches.map((match, index) => {
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index || body.length : body.length;
    return {
      id: match[1].toLowerCase(),
      label: match[1],
      text: body.slice(start, end).trim(),
    };
  }).filter((option) => option.text);
  return { text: questionText, options };
}

function getEffectiveQuestion(question: any) {
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
    options: type === "true_false"
      ? [
        { id: "true", label: "True", text: "True" },
        { id: "false", label: "False", text: "False" },
      ]
      : hasOptions ? question.options : inline.options,
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

function getGradingDetailsMap(submission: any) {
  const details = parseJsonArray(submission?.grading_details || submission?.gradingDetails);
  return new Map(details.map((detail: any) => [String(detail.questionId || detail.question_id || detail.id), detail]));
}

function hasSubmittedValue(value: any) {
  return Array.isArray(value) ? value.length > 0 : String(value ?? "").trim().length > 0;
}

function buildStructuredAnswerRow(question: any, questionId: string, value: any, index: number, detail: any): StructuredAnswerRow {
  const effectiveQuestion = getEffectiveQuestion(question);
  const number = String(effectiveQuestion.displayNumber || effectiveQuestion.number || index + 1);
  const submitted = hasSubmittedValue(value);
  const isObjective = ["mcq_single", "true_false", "fill_blank", "integer"].includes(effectiveQuestion.type);
  const correctAnswer = isObjective ? effectiveQuestion.correctAnswer || effectiveQuestion.correct_answer : undefined;
  const inferredTotal = Number(effectiveQuestion.marks || 1);
  const inferredAwarded = isObjective && correctAnswer
    ? submitted && answersMatch(String(correctAnswer), String(value ?? "")) ? inferredTotal : 0
    : undefined;
  const detailTotal = detail?.total !== undefined ? Number(detail.total) : undefined;
  const detailMatchesQuestion = detailTotal === undefined || detailTotal === inferredTotal;
  const row = {
    id: questionId,
    number,
    sectionTitle: effectiveQuestion.sectionTitle || effectiveQuestion.section || undefined,
    type: effectiveQuestion.type || "answer",
    questionText: effectiveQuestion.text || `Question ${number}`,
    answerText: submitted ? formatSubmittedValue(effectiveQuestion, value) : "",
    options: Array.isArray(effectiveQuestion.options) ? effectiveQuestion.options : undefined,
    correctAnswer,
    marksAwarded: isObjective && correctAnswer !== undefined
      ? inferredAwarded
      : detail?.marks !== undefined && detailMatchesQuestion ? Number(detail.marks) : inferredAwarded,
    marksTotal: detailTotal !== undefined && detailMatchesQuestion ? detailTotal : isObjective ? inferredTotal : undefined,
    gradingStatus: detail?.status,
    submitted,
  };
  console.log(`Q${number} - type: ${row.type}, isObjective: ${isObjective}, correctAnswer: ${correctAnswer}, value: ${value}, inferredAwarded: ${inferredAwarded}, detailMarks: ${detail?.marks}, marksAwarded: ${row.marksAwarded}`);
  return row;
}

export function getStructuredAnswerRows(assessment: any, submission: any, options: { includeBlank?: boolean } = {}): StructuredAnswerRow[] {
  const answers = parseJsonObject(submission?.answers_json || submission?.answersJson);
  const questions = getAssessmentQuestions(assessment);
  const questionMap = new Map(questions.map((question: any) => [String(question.id), question]));
  const gradingDetails = getGradingDetailsMap(submission);

  if (options.includeBlank && questions.length) {
    return questions.map((question: any, index: number) => {
      const questionId = String(question.id || `q-${index + 1}`);
      return buildStructuredAnswerRow(question, questionId, answers[questionId], index, gradingDetails.get(questionId));
    });
  }

  return Object.entries(answers)
    .filter(([, value]) => hasSubmittedValue(value))
    .map(([questionId, value], index) => {
      const question: any = questionMap.get(String(questionId)) || {};
      return buildStructuredAnswerRow(question, questionId, value, index, gradingDetails.get(String(questionId)));
    });
}

export function StructuredAnswersView({
  rows,
  emptyText = "No structured answers were submitted.",
}: {
  rows: StructuredAnswerRow[];
  emptyText?: string;
}) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        {emptyText}
      </div>
    );
  }

  const groups = rows.reduce<Array<{ sectionTitle: string; rows: StructuredAnswerRow[] }>>((acc, row) => {
    const sectionTitle = row.sectionTitle || "Questions";
    const last = acc[acc.length - 1];
    if (!last || last.sectionTitle !== sectionTitle) {
      acc.push({ sectionTitle, rows: [row] });
    } else {
      last.rows.push(row);
    }
    return acc;
  }, []);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.sectionTitle} className="space-y-3">
          <h4 className="rounded-md bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600">
            {group.sectionTitle}
          </h4>
          {group.rows.map((row) => {
            const showOptions = ["mcq_single", "true_false"].includes(row.type) && Array.isArray(row.options) && row.options.length > 0;
            const submittedRaw = row.answerText.split(".")[0]?.trim().toLowerCase();
            const correctRaw = String(row.correctAnswer || "").trim().toLowerCase();
            return (
              <div key={row.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white px-2 py-0.5 text-xs font-black text-gray-700">Q{row.number}</span>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
                      {row.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  {row.marksAwarded !== undefined && row.marksTotal !== undefined && (
                    <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      {row.marksAwarded}/{row.marksTotal} marks
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-xs font-semibold leading-5 text-gray-500">{row.questionText}</p>
                {showOptions && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {row.options!.map((option) => {
                      const optionId = String(option.id || option.value || option.label || "").toLowerCase();
                      const selected = row.submitted && optionId && optionId === submittedRaw;
                      const correct = correctRaw && optionId && optionId === correctRaw;
                      const label = option.label || option.id || option.value || "";
                      const optionText = option.text || option.value || option.label || "";
                      const showLabel = label && String(label).toLowerCase() !== String(optionText).toLowerCase();
                      return (
                        <div
                          key={optionId || option.text}
                          className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                            correct
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : selected
                                ? "border-rose-300 bg-rose-50 text-rose-800"
                                : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          {showLabel && <span className="mr-2 font-black uppercase">{label}</span>}
                          {optionText}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!["mcq_single", "true_false"].includes(row.type) && (
                  <div className={`mt-2 rounded-md bg-white p-3 text-sm font-bold leading-6 ${row.submitted ? "text-gray-900" : "text-gray-400"}`}>
                    {row.submitted ? row.answerText : "Not answered"}
                  </div>
                )}
                {row.correctAnswer && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Answer key: {row.correctAnswer}</p>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

const AssessmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftResult>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reviewStudent, setReviewStudent] = useState<any | null>(null);
  const [activeTabId, setActiveTabId] = useState(location.state?.activeTabId || "overview");

  // Marks Entry Pagination & Search
  const [marksPage, setMarksPage] = useState(1);
  const [marksLimit, setMarksLimit] = useState(10);
  const [marksSearch, setMarksSearch] = useState(location.state?.marksSearch || "");

  // Submissions Pagination & Search
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [submissionsSearch, setSubmissionsSearch] = useState("");

  const totalMarks = Number(assessment?.total_marks || assessment?.totalMarks || 100);
  const previousPage = location.state?.from;
  const assessmentWorkspace = location.state?.assessmentWorkspace;

  const goBackToPreviousPage = () => {
    if (previousPage) {
      navigate(previousPage, { state: { assessmentWorkspace } });
      return;
    }
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/school/teacher/assessments");
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const assessmentRes = await api.get(`/assessments/${id}`);
      const loadedAssessment = unwrapSchoolData<any>(assessmentRes, null);
      setAssessment(loadedAssessment);

      const [studentsRes, resultsRes, submissionsRes] = await Promise.all([
        api.get("/students", {
          params: {
            classId: loadedAssessment?.class_id || loadedAssessment?.classId,
            sectionId: loadedAssessment?.section_id || loadedAssessment?.sectionId,
          },
        }),
        api.get(`/assessments/${id}/results`),
        api.get(`/assessments/${id}/submissions`),
      ]);

      const loadedStudents = unwrapSchoolList(studentsRes);
      const loadedResults = unwrapSchoolList(resultsRes);
      const loadedSubmissions = unwrapSchoolList(submissionsRes);
      setStudents(loadedStudents);
      setResults(loadedResults);
      setSubmissions(loadedSubmissions);

      const nextDrafts: Record<string, DraftResult> = {};
      loadedStudents.forEach((student: any) => {
        const existing = loadedResults.find((result: any) => String(result.student_id) === String(student.id));
        const marks = existing?.marks_obtained ?? "";
        const pct = marks === "" ? 0 : percentage(Number(marks), Number(loadedAssessment?.total_marks || 100));
        nextDrafts[student.id] = {
          marksObtained: marks === "" ? "" : String(Number(marks)),
          grade: existing?.grade || (marks === "" ? "" : gradeFromPercent(pct)),
          remarks: existing?.remarks || "",
          isAbsent: Boolean(existing?.is_absent),
        };
      });
      setDrafts(nextDrafts);
    } catch (err) {
      console.error("Failed to fetch assessment details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const resultMap = useMemo(() => {
    const map = new Map<string, any>();
    results.forEach((result) => map.set(String(result.student_id), result));
    return map;
  }, [results]);

  const submissionMap = useMemo(() => {
    const map = new Map<string, any>();
    submissions.forEach((submission) => {
      if (submission.student_user_id) map.set(String(submission.student_user_id), submission);
      if (submission.studentId) map.set(String(submission.studentId), submission);
    });
    return map;
  }, [submissions]);

  const analytics = useMemo(() => {
    const present = results.filter((result) => !result.is_absent);
    const scored = present.map((result) => Number(result.marks_obtained || 0));
    const average = scored.length
      ? Math.round(scored.reduce((sum, mark) => sum + percentage(mark, totalMarks), 0) / scored.length)
      : 0;
    const highest = scored.length ? Math.max(...scored.map((mark) => percentage(mark, totalMarks))) : 0;
    const passCount = scored.filter((mark) => percentage(mark, totalMarks) >= 33).length;
    const distinctionCount = scored.filter((mark) => percentage(mark, totalMarks) >= 75).length;
    const gradeDistribution = ["A+", "A", "B", "C", "D", "F"].map((grade) => ({
      grade,
      count: results.filter((result) => result.grade === grade).length,
    }));
    return {
      average,
      highest,
      passRate: scored.length ? Math.round((passCount / scored.length) * 100) : 0,
      distinctionRate: scored.length ? Math.round((distinctionCount / scored.length) * 100) : 0,
      gradeDistribution,
    };
  }, [results, totalMarks]);

  const leaderboardData = useMemo(() => {
    return results
      .filter((result) => !result.is_absent)
      .map((result) => ({
        ...result,
        percentage: percentage(Number(result.marks_obtained || 0), totalMarks),
      }))
      .sort((a, b) => Number(b.marks_obtained || 0) - Number(a.marks_obtained || 0))
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }, [results, totalMarks]);

  const filteredStudents = useMemo(() => {
    if (!marksSearch.trim()) return students;
    const q = marksSearch.toLowerCase();
    return students.filter((s) => {
      const name = String(s.name || "").toLowerCase();
      const rollNo = String(s.studentProfile?.rollNo || "").toLowerCase();
      return name.includes(q) || rollNo.includes(q);
    });
  }, [students, marksSearch]);

  const paginatedStudents = useMemo(() => {
    const start = (marksPage - 1) * marksLimit;
    return filteredStudents.slice(start, start + marksLimit);
  }, [filteredStudents, marksPage, marksLimit]);

  const totalMarksPages = Math.max(1, Math.ceil(filteredStudents.length / marksLimit));

  useEffect(() => {
    setMarksPage(1);
  }, [marksSearch, marksLimit]);

  const filteredSubmissions = useMemo(() => {
    if (!submissionsSearch.trim()) return submissions;
    const q = submissionsSearch.toLowerCase();
    return submissions.filter((sub) => {
      const name = String(sub.student_name || sub.studentName || "Student").toLowerCase();
      return name.includes(q);
    });
  }, [submissions, submissionsSearch]);

  const paginatedSubmissions = useMemo(() => {
    const start = (submissionsPage - 1) * submissionsLimit;
    return filteredSubmissions.slice(start, start + submissionsLimit);
  }, [filteredSubmissions, submissionsPage, submissionsLimit]);

  const totalSubmissionsPages = Math.max(1, Math.ceil(filteredSubmissions.length / submissionsLimit));

  useEffect(() => {
    setSubmissionsPage(1);
  }, [submissionsSearch, submissionsLimit]);

  const updateDraft = (studentId: string, patch: Partial<DraftResult>) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || { marksObtained: "", grade: "", remarks: "", isAbsent: false }), ...patch },
    }));
  };

  const openSubmissionReview = (student: any) => {
    const studentId = String(student.id || student.student_user_id || student.studentId);
    navigate(`/school/teacher/assessments/${id}/submissions/${studentId}/review`, {
      state: {
        from: `/school/teacher/assessments/${id}`,
        originalFrom: previousPage || `/school/teacher/assessments`,
        assessmentWorkspace,
        student: { ...student, id: studentId },
      },
    });
  };

  const autoGradeReviewSubmission = () => {
    if (!reviewStudent) return;
    if (!assessment?.answer_key?.trim()) {
      alert("No answer key is saved for this assessment.");
      return;
    }
    if (!reviewSubmission?.answer_text?.trim()) {
      const objectiveRows = reviewStructuredRows.filter((r) => ["mcq_single", "true_false", "fill_blank", "integer"].includes(r.type));
      if (objectiveRows.length > 0) {
        let score = 0;
        let total = 0;
        objectiveRows.forEach((r) => {
          const inferredTotal = r.marksTotal || 1;
          total += inferredTotal;
          if (r.submitted && r.correctAnswer !== undefined) {
            const submittedRaw = r.answerText.split(".")[0]?.trim().toLowerCase();
            const correctRaw = String(r.correctAnswer || "").trim().toLowerCase();
            if (submittedRaw === correctRaw) {
              score += inferredTotal;
            }
          }
        });
        const pct = percentage(score, total);
        updateDraft(reviewStudent.id, {
          marksObtained: String(score),
          grade: gradeFromPercent(pct),
          remarks: `Auto objective score recalculated: ${score}/${total}. Add manual marks for theory questions if needed.`,
          isAbsent: false,
        });
        return;
      }

      const objectiveScore = Number(reviewSubmission?.objective_score ?? reviewSubmission?.objectiveScore);
      const objectiveTotal = Number(reviewSubmission?.objective_total ?? reviewSubmission?.objectiveTotal);
      if (Number.isFinite(objectiveScore) && Number.isFinite(objectiveTotal) && objectiveTotal > 0) {
        const pct = percentage(objectiveScore, objectiveTotal);
        updateDraft(reviewStudent.id, {
          marksObtained: String(objectiveScore),
          grade: gradeFromPercent(pct),
          remarks: `Auto objective score loaded: ${objectiveScore}/${objectiveTotal}. Add manual marks for theory questions if needed.`,
          isAbsent: false,
        });
        return;
      }
    }
    if (!reviewSubmission?.answer_text?.trim()) {
      alert("Auto grade needs a typed submission. Uploaded files still need to be reviewed manually.");
      return;
    }

    const result = autoGradeNumberedSubmission({
      questionText: assessment.content_text || "",
      answerKey: assessment.answer_key || "",
      submissionText: reviewSubmission.answer_text || "",
      totalMarks,
    });

    if (!result.totalKeyed) {
      alert("I could not find numbered answers in the answer key.");
      return;
    }
    if (!result.checked) {
      alert("Only theory/descriptive questions were detected. Please grade this submission manually.");
      return;
    }

    const pct = percentage(result.marks, totalMarks);
    const notes = [
      `Auto-graded ${result.checked} objective/exact question${result.checked === 1 ? "" : "s"}: ${result.correct} correct.`,
      result.wrong.length ? `Wrong: ${result.wrong.join(", ")}.` : "",
      result.missing.length ? `Missing: ${result.missing.join(", ")}.` : "",
      result.skipped.length ? `Skipped for manual theory review: ${result.skipped.join(", ")}.` : "",
    ].filter(Boolean).join(" ");

    updateDraft(reviewStudent.id, {
      marksObtained: String(result.marks),
      grade: gradeFromPercent(pct),
      remarks: notes,
      isAbsent: false,
    });
  };

  const saveStudentResult = async (student: any) => {
    if (!id) return;
    const studentId = String(student.id || student.student_user_id || student.studentId);
    const draft = drafts[studentId] || { marksObtained: "", grade: "", remarks: "", isAbsent: false };
    const marks = draft.isAbsent ? 0 : Number(draft.marksObtained || 0);
    const pct = percentage(marks, totalMarks);
    const grade = draft.grade || gradeFromPercent(pct);
    const nextDraft = {
      marksObtained: String(marks),
      grade,
      remarks: draft.remarks,
      isAbsent: Boolean(draft.isAbsent),
    };
    setSavingId(studentId);
    try {
      const response = await api.post("/assessments/results", {
        assessmentId: id,
        studentId,
        marksObtained: marks,
        isAbsent: draft.isAbsent,
        grade,
        remarks: draft.remarks,
      });
      const savedResult = unwrapSchoolData<any>(response, null) || {
        assessment_id: id,
        student_id: studentId,
        total_marks: totalMarks,
        marks_obtained: marks,
        percentage: pct,
        is_absent: draft.isAbsent,
        grade,
        remarks: draft.remarks,
      };
      setResults((current) => {
        const withoutStudent = current.filter((result) => String(result.student_id) !== studentId);
        return [...withoutStudent, { ...savedResult, student_id: studentId }];
      });
      setDrafts((current) => ({
        ...current,
        [studentId]: nextDraft,
      }));
      if (reviewStudent && String(reviewStudent.id) === studentId) {
        setReviewStudent(null);
        setActiveTabId("attempts");
        setMarksSearch(reviewStudent.name || "");
      }
    } catch (err) {
      console.error("Failed to save result", err);
      alert("Could not save result. Please try again.");
    } finally {
      setSavingId(null);
    }
  };

  const markAssessmentStatus = async (status: string) => {
    if (!id) return;
    try {
      await api.put(`/assessments/${id}`, { status });
      await load();
    } catch (err) {
      console.error("Failed to update assessment status", err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading assessment...</div>;
  }

  if (!assessment) {
    return <div className="p-12 text-center text-red-500">Assessment not found</div>;
  }

  const attemptsColumns = [
    {
      key: "name",
      title: "Student",
      render: (_: any, student: any) => (
        <div>
          <p className="font-semibold text-gray-900">{student.name}</p>
          <p className="text-xs text-gray-500">
            Roll {student.studentProfile?.rollNo || "-"} | {student.studentProfile?.section?.name || "No section"}
          </p>
        </div>
      ),
    },
    {
      key: "submission",
      title: "Submission",
      render: (_: any, student: any) => {
        const hasSubmission = submissionMap.has(String(student.id));
        return hasSubmission ? <Badge variant="success">Submitted</Badge> : <Badge variant="warning">No upload</Badge>;
      },
    },
    {
      key: "marks",
      title: "Marks",
      render: (_: any, student: any) => {
        const draft = drafts[student.id];
        return (
          <input
            type="number"
            min="0"
            max={totalMarks}
            value={draft?.marksObtained || ""}
            disabled={draft?.isAbsent}
            onChange={(event) => {
              const marks = event.target.value;
              const pct = percentage(Number(marks || 0), totalMarks);
              updateDraft(student.id, { marksObtained: marks, grade: marks === "" ? "" : gradeFromPercent(pct) });
            }}
            className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
          />
        );
      },
    },
    {
      key: "grade",
      title: "Grade",
      render: (_: any, student: any) => (
        <input
          value={drafts[student.id]?.grade || ""}
          onChange={(event) => updateDraft(student.id, { grade: event.target.value })}
          className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      ),
    },
    {
      key: "absent",
      title: "Absent",
      render: (_: any, student: any) => (
        <input
          type="checkbox"
          checked={Boolean(drafts[student.id]?.isAbsent)}
          onChange={(event) => updateDraft(student.id, { isAbsent: event.target.checked })}
          className="h-4 w-4"
        />
      ),
    },
    {
      key: "remarks",
      title: "Remarks",
      render: (_: any, student: any) => (
        <input
          value={drafts[student.id]?.remarks || ""}
          onChange={(event) => updateDraft(student.id, { remarks: event.target.value })}
          placeholder="Optional"
          className="min-w-48 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
        />
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_: any, student: any) => (
        resultMap.has(String(student.id))
          ? <Badge variant="success">Saved</Badge>
          : <Badge variant="warning">Pending</Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, student: any) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Eye size={14} />}
            onClick={() => openSubmissionReview(student)}
          >
            Open
          </Button>
          <Button
            size="sm"
            icon={<Save size={14} />}
            onClick={() => saveStudentResult(student)}
            disabled={savingId === student.id}
          >
            {savingId === student.id ? "Saving..." : "Save"}
          </Button>
        </div>
      ),
    },
  ];

  const attemptsContent = (
    <GlassCard>
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Marks Entry</h3>
          <p className="text-sm text-gray-500">
            {filteredStudents.length} of {students.length} student{students.length === 1 ? "" : "s"} in this roster.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {students.length > 0 && (
            <>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={marksSearch}
                  onChange={(e) => setMarksSearch(e.target.value)}
                  placeholder="Search by student name or roll..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <select
                value={marksLimit}
                onChange={(e) => setMarksLimit(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </>
          )}
          <Button variant="outline" onClick={() => markAssessmentStatus("completed")}>
            Mark Completed
          </Button>
        </div>
      </div>
      {students.length ? (
        filteredStudents.length ? (
          <div className="space-y-4">
            <DataTable columns={attemptsColumns} data={paginatedStudents} />

            {/* Pagination Controls */}
            {totalMarksPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-800">{paginatedStudents.length}</span> of <span className="font-bold text-gray-800">{filteredStudents.length}</span> students
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMarksPage((p) => Math.max(1, p - 1))}
                    disabled={marksPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-gray-700 px-2">
                    Page {marksPage} of {totalMarksPages}
                  </span>
                  <button
                    onClick={() => setMarksPage((p) => Math.min(totalMarksPages, p + 1))}
                    disabled={marksPage === totalMarksPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
            No students found matching your search.
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
          No students found for this assessment class or section.
        </div>
      )}
    </GlassCard>
  );

  const leaderboardContent = (
    <GlassCard>
      <div className="mb-6 flex items-center gap-2">
        <Trophy size={20} className="text-yellow-500" />
        <h3 className="text-lg font-bold text-gray-900">Leaderboard</h3>
      </div>
      <div className="space-y-3">
        {leaderboardData.length ? (
          leaderboardData.map((entry) => (
            <div key={entry.id || entry.student_id} className="assessment__leaderboard-item">
              <div className={`assessment__rank assessment__rank--${entry.rank}`}>{entry.rank <= 3 ? <Trophy size={14} /> : entry.rank}</div>
              <div className="assessment__leader-info">
                <span className="assessment__leader-name">{entry.student_name || "Student"}</span>
                <span className="assessment__leader-class">{entry.grade || "Ungraded"}</span>
              </div>
              <div className="assessment__leader-score">
                <span className="assessment__leader-marks">{Number(entry.marks_obtained || 0)}/{totalMarks}</span>
                <span className="assessment__leader-pct">{entry.percentage}%</span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            Save marks to build the leaderboard.
          </div>
        )}
      </div>
    </GlassCard>
  );

  const analyticsContent = (
    <div className="assessment__results">
      <div className="assessment__result-stats">
        <StatCard title="Average Score" value={`${analytics.average}%`} icon={<Target size={24} />} gradient="var(--gradient-primary)" />
        <StatCard title="Highest Score" value={`${analytics.highest}%`} icon={<Award size={24} />} gradient="var(--gradient-cool)" />
        <StatCard title="Pass Rate" value={`${analytics.passRate}%`} icon={<TrendingUp size={24} />} gradient="var(--gradient-accent)" />
        <StatCard title="Distinction Rate" value={`${analytics.distinctionRate}%`} icon={<Trophy size={24} />} gradient="var(--gradient-secondary)" />
      </div>

      <GlassCard>
        <h3 className="assessment__grade-title">Grade Distribution</h3>
        <div className="assessment__grade-chart mt-6">
          {analytics.gradeDistribution.map((grade) => (
            <div key={grade.grade} className="assessment__grade-bar-wrapper">
              <div className="assessment__grade-bar" style={{ height: `${Math.max(grade.count, 1) * 24}px` }} />
              <span className="assessment__grade-label">{grade.grade}</span>
              <small className="assessment__grade-count">{grade.count}</small>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  const overviewContent = (
    <div className="space-y-5">
      <GlassCard>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Type</p>
            <p className="mt-1 font-semibold text-gray-900">{assessment.type || assessment.assessment_type || "Test"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Total Marks</p>
            <p className="mt-1 font-semibold text-gray-900">{totalMarks}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Duration</p>
            <p className="mt-1 font-semibold text-gray-900">{assessment.duration_minutes || 60} mins</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Scheduled</p>
            <p className="mt-1 font-semibold text-gray-900">
              {assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString() : "Not scheduled"}
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Question Paper / Instructions</h3>
            <p className="text-sm text-gray-500">
              Source: {assessment.content_source || "metadata only"}
            </p>
          </div>
          {resolveUploadUrl(assessment.file_path) && (
            <a
              href={resolveUploadUrl(assessment.file_path) || "#"}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Open uploaded file
            </a>
          )}
        </div>
        {assessment.content_text ? (
          <div className="max-h-[520px] overflow-auto rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-800">
            <AssessmentContentRenderer>{assessment.content_text}</AssessmentContentRenderer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            No manual or AI text was added for this assessment.
          </div>
        )}
      </GlassCard>

      {assessment.answer_key && (
        <GlassCard className="border border-amber-200 bg-amber-50/20">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg">🔑</span>
            <h3 className="text-lg font-bold text-amber-950">Answer Key (Teacher Only)</h3>
          </div>
          <div className="max-h-[350px] overflow-auto rounded-xl bg-white p-4 text-sm leading-6 text-gray-800 border border-amber-100">
            <AssessmentContentRenderer>{assessment.answer_key}</AssessmentContentRenderer>
          </div>
        </GlassCard>
      )}
    </div>
  );

  const submissionsContent = (
    <GlassCard>
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Student Submissions</h3>
          <p className="text-sm text-gray-500">
            {filteredSubmissions.length} of {submissions.length} online submission{submissions.length === 1 ? "" : "s"} received.
          </p>
        </div>
        {submissions.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={submissionsSearch}
                onChange={(e) => setSubmissionsSearch(e.target.value)}
                placeholder="Search by student name..."
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <select
              value={submissionsLimit}
              onChange={(e) => setSubmissionsLimit(Number(e.target.value))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-brand-500 cursor-pointer"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        )}
      </div>
      {submissions.length ? (
        filteredSubmissions.length ? (
          <div className="space-y-4">
            {paginatedSubmissions.map((submission) => {
              const fileUrl = resolveUploadUrl(submission.file_path || submission.filePath);
              const structuredRows = getStructuredAnswerRows(assessment, submission);
              const hasAnswerText = Boolean(submission.answer_text?.trim());
              return (
                <div key={submission.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{submission.student_name || "Student"}</p>
                      <p className="mt-1 text-xs font-medium text-gray-500">
                        Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "-"}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-gray-500">
                        {structuredRows.length
                          ? `${structuredRows.length} answered question${structuredRows.length === 1 ? "" : "s"}`
                          : hasAnswerText
                          ? "Typed response submitted"
                          : fileUrl
                          ? "File response submitted"
                          : "No answer content found"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Eye size={14} />}
                        onClick={() => openSubmissionReview({
                          id: submission.student_user_id,
                          name: submission.student_name || "Student",
                          studentProfile: {
                            rollNo: submission.roll_no,
                            section: { name: submission.section_name },
                          },
                        })}
                      >
                        Review
                      </Button>
                      {fileUrl && (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50"
                        >
                          <Download size={14} />
                          Open file
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalSubmissionsPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-800">{paginatedSubmissions.length}</span> of <span className="font-bold text-gray-800">{filteredSubmissions.length}</span> submissions
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                    disabled={submissionsPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-gray-700 px-2">
                    Page {submissionsPage} of {totalSubmissionsPages}
                  </span>
                  <button
                    onClick={() => setSubmissionsPage((p) => Math.min(totalSubmissionsPages, p + 1))}
                    disabled={submissionsPage === totalSubmissionsPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
            No submissions found matching your search.
          </div>
        )
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
          No students have submitted this assessment online yet.
        </div>
      )}
    </GlassCard>
  );

  const reviewSubmission = reviewStudent ? submissionMap.get(String(reviewStudent.id)) : null;
  const reviewDraft = reviewStudent ? drafts[String(reviewStudent.id)] : null;
  const reviewFileUrl = resolveUploadUrl(reviewSubmission?.file_path || reviewSubmission?.filePath);
  const reviewStructuredRows = getStructuredAnswerRows(assessment, reviewSubmission, { includeBlank: true });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <Badge variant="purple">{String(assessment.type || assessment.assessment_type || "Test").toUpperCase()}</Badge>
            <Badge variant={assessment.status === "completed" ? "success" : "warning"}>{assessment.status || "Draft"}</Badge>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{assessment.title}</h1>
          <p className="mt-1 flex items-center gap-3 text-sm font-medium text-gray-500">
            <span>Total Marks: {totalMarks}</span>
            <span>|</span>
            <span>Duration: {assessment.duration_minutes || 60} mins</span>
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={goBackToPreviousPage}>
          Back to Assessments
        </Button>
      </div>

      <Tabs
        activeTabId={activeTabId}
        onChange={(tabId) => setActiveTabId(tabId)}
        tabs={[
          { id: "overview", label: "Overview", icon: <BarChart3 size={16} />, content: overviewContent },
          { id: "submissions", label: "Submissions", icon: <FileText size={16} />, content: submissionsContent },
          { id: "attempts", label: "Marks Entry", icon: <Users size={16} />, content: attemptsContent },
          { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={16} />, content: leaderboardContent },
          { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} />, content: analyticsContent },
        ]}
      />

      <Modal
        isOpen={Boolean(reviewStudent)}
        onClose={() => setReviewStudent(null)}
        title={`Review Submission - ${reviewStudent?.name || reviewSubmission?.student_name || "Student"}`}
        size="full"
      >
        {reviewStudent && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">Student Submission</h3>
                {reviewFileUrl && (
                  <a
                    href={reviewFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
                  >
                    <Download size={13} />
                    Open file
                  </a>
                )}
              </div>
              {reviewSubmission?.answer_text ? (
                <div className="max-h-[70vh] overflow-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                  <AssessmentContentRenderer>{reviewSubmission.answer_text}</AssessmentContentRenderer>
                </div>
              ) : reviewStructuredRows.length ? (
                <div className="max-h-[70vh] overflow-auto rounded-lg bg-white p-1">
                  <StructuredAnswersView rows={reviewStructuredRows} />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                  No typed or selected answers were found. Use the uploaded file if available.
                </div>
              )}
            </div>

            <div className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-black text-gray-900">Grade This Submission</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Review the submission, then save marks and remarks.
              </p>
              <div className="mt-4 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Marks out of {totalMarks}
                  <input
                    type="number"
                    min="0"
                    max={totalMarks}
                    value={reviewDraft?.marksObtained || ""}
                    disabled={reviewDraft?.isAbsent}
                    onChange={(event) => {
                      const marks = event.target.value;
                      const pct = percentage(Number(marks || 0), totalMarks);
                      updateDraft(reviewStudent.id, {
                        marksObtained: marks,
                        grade: marks === "" ? "" : gradeFromPercent(pct),
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Grade
                  <input
                    value={reviewDraft?.grade || ""}
                    onChange={(event) => updateDraft(reviewStudent.id, { grade: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={Boolean(reviewDraft?.isAbsent)}
                    onChange={(event) => updateDraft(reviewStudent.id, { isAbsent: event.target.checked })}
                    className="h-4 w-4"
                  />
                  Mark absent
                </label>

                <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Remarks
                  <textarea
                    value={reviewDraft?.remarks || ""}
                    onChange={(event) => updateDraft(reviewStudent.id, { remarks: event.target.value })}
                    rows={5}
                    placeholder="Add feedback or note questions checked manually."
                    className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </label>

                <Button
                  className="w-full justify-center"
                  icon={<Save size={16} />}
                  onClick={() => saveStudentResult(reviewStudent)}
                  disabled={savingId === reviewStudent.id}
                >
                  {savingId === reviewStudent.id ? "Saving..." : "Save Grade"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentDetails;
