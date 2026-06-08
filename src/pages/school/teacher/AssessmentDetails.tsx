/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BarChart3,
  ChevronLeft,
  Download,
  Eye,
  FileText,
  Save,
  Sparkles,
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

type DraftResult = {
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

function percentage(marks: number, total: number) {
  if (!total) return 0;
  return Math.round((marks / total) * 100);
}

function gradeFromPercent(pct: number) {
  if (pct >= 90) return "A+";
  if (pct >= 75) return "A";
  if (pct >= 60) return "B";
  if (pct >= 45) return "C";
  if (pct >= 33) return "D";
  return "F";
}

function resolveUploadUrl(filePath: string | null | undefined) {
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

const AssessmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftResult>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reviewStudent, setReviewStudent] = useState<any | null>(null);

  const totalMarks = Number(assessment?.total_marks || assessment?.totalMarks || 100);

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

  const updateDraft = (studentId: string, patch: Partial<DraftResult>) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || { marksObtained: "", grade: "", remarks: "", isAbsent: false }), ...patch },
    }));
  };

  const openSubmissionReview = (student: any) => {
    const studentId = String(student.id || student.student_user_id || student.studentId);
    setDrafts((current) => {
      if (current[studentId]) return current;
      const existing = resultMap.get(studentId);
      const marks = existing?.marks_obtained ?? "";
      const pct = marks === "" ? 0 : percentage(Number(marks), totalMarks);
      return {
        ...current,
        [studentId]: {
          marksObtained: marks === "" ? "" : String(Number(marks)),
          grade: existing?.grade || (marks === "" ? "" : gradeFromPercent(pct)),
          remarks: existing?.remarks || "",
          isAbsent: Boolean(existing?.is_absent),
        },
      };
    });
    setReviewStudent({ ...student, id: studentId });
  };

  const autoGradeReviewSubmission = () => {
    if (!reviewStudent) return;
    if (!assessment?.answer_key?.trim()) {
      alert("No answer key is saved for this assessment.");
      return;
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
    const draft = drafts[student.id] || { marksObtained: "", grade: "", remarks: "", isAbsent: false };
    const marks = draft.isAbsent ? 0 : Number(draft.marksObtained || 0);
    const pct = percentage(marks, totalMarks);
    setSavingId(student.id);
    try {
      await api.post("/assessments/results", {
        assessmentId: id,
        studentId: student.id,
        marksObtained: marks,
        isAbsent: draft.isAbsent,
        grade: draft.grade || gradeFromPercent(pct),
        remarks: draft.remarks,
      });
      await load();
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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Marks Entry</h3>
          <p className="text-sm text-gray-500">
            {students.length} student{students.length === 1 ? "" : "s"} in this assessment roster.
          </p>
        </div>
        <Button variant="outline" onClick={() => markAssessmentStatus("completed")}>
          Mark Completed
        </Button>
      </div>
      {students.length ? (
        <DataTable columns={attemptsColumns} data={students} />
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
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Student Submissions</h3>
          <p className="text-sm text-gray-500">
            {submissions.length} online submission{submissions.length === 1 ? "" : "s"} received.
          </p>
        </div>
      </div>
      {submissions.length ? (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const fileUrl = resolveUploadUrl(submission.file_path || submission.filePath);
            return (
              <div key={submission.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{submission.student_name || "Student"}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">
                      Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "-"}
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
                {submission.answer_text ? (
                  <div className="mt-4 max-h-72 overflow-auto rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    <AssessmentContentRenderer>{submission.answer_text}</AssessmentContentRenderer>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                    <FileText size={16} />
                    No typed answer. Check the uploaded file.
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
        <Button variant="outline" size="sm" icon={<ChevronLeft size={16} />} onClick={() => navigate("/school/teacher/assessments")}>
          Back to Assessments
        </Button>
      </div>

      <Tabs
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
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-2">
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
                    <div className="max-h-[60vh] overflow-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                      <AssessmentContentRenderer>{reviewSubmission.answer_text}</AssessmentContentRenderer>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                      No typed answer was submitted. Use the uploaded file if available.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4">
                  <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-amber-800">Answer Key</h3>
                  {assessment.answer_key ? (
                    <div className="max-h-[60vh] overflow-auto rounded-lg bg-white p-4 text-sm leading-6 text-gray-800">
                      <AssessmentContentRenderer>{assessment.answer_key}</AssessmentContentRenderer>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-amber-200 bg-white p-8 text-center text-sm text-gray-500">
                      No answer key is saved for this assessment.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-black uppercase tracking-wide text-gray-700">Question Paper</h3>
                {assessment.content_text ? (
                  <div className="max-h-80 overflow-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    <AssessmentContentRenderer>{assessment.content_text}</AssessmentContentRenderer>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    No question text is saved for this assessment.
                  </div>
                )}
              </div>
            </div>

            <div className="h-fit rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-black text-gray-900">Grade This Submission</h3>
              <p className="mt-1 text-xs font-medium text-gray-500">
                Compare the submission with the answer key, then save marks and remarks.
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
                  variant="outline"
                  className="w-full justify-center"
                  icon={<Sparkles size={16} />}
                  onClick={autoGradeReviewSubmission}
                  disabled={!reviewSubmission?.answer_text || !assessment.answer_key}
                >
                  Auto Grade Objective
                </Button>

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
