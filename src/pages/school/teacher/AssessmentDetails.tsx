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
  Key,
  Save,
  Search,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import StatCard from "@/components/school/StatCard";
import DataTable from "@/components/school/DataTable";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import "./AssessmentSystem.css";

const TONE_BADGE: Record<string, string> = {
  success: "bg-emerald-500/10 text-emerald-700",
  warning: "bg-amber-500/10 text-amber-700",
  purple: "bg-violet-500/10 text-violet-700",
};

function ToneBadge({ tone, className, children }: { tone: string; className?: string; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={cn("border-transparent", TONE_BADGE[tone] ?? TONE_BADGE.purple, className)}>
      {children}
    </Badge>
  );
}

// shadcn Select for the numeric "per page" pickers.
function PerPageSelect({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        {[5, 10, 20, 50].map((n) => (
          <SelectItem key={n} value={String(n)}>{n} per page</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PageControls({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (fn: (p: number) => number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="icon" className="size-8 rounded-lg" disabled={page === 1} onClick={() => onPage((p) => Math.max(1, p - 1))}>
        <ChevronLeft size={16} />
      </Button>
      <span className="px-2 text-xs font-bold text-gray-700">Page {page} of {totalPages}</span>
      <Button type="button" variant="outline" size="icon" className="size-8 rounded-lg" disabled={page === totalPages} onClick={() => onPage((p) => Math.min(totalPages, p + 1))}>
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
import {
  DraftResult,
  StructuredAnswerRow,
  percentage,
  gradeFromPercent,
  clampMarks,
  resolveUploadUrl,
  getStructuredAnswerRows,
  getEffectiveQuestion,
  getGradingDetailsMap,
  getAssessmentQuestions,
  answersMatch,
  autoGradeNumberedSubmission,
} from "./assessment-utils";

// Type-only re-exports are safe (erased at runtime, don't break Fast Refresh)
export type { DraftResult, StructuredAnswerRow };

export function StructuredAnswersView({
  rows,
  emptyText = "No structured answers were submitted.",
}: {
  rows: StructuredAnswerRow[];
  emptyText?: string;
}) {
  if (!rows.length) {
    return (
      <Card className="rounded-lg border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 shadow-none">
        {emptyText}
      </Card>
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
              <Card key={row.id} className="rounded-lg border-gray-200 bg-gray-50 p-3 shadow-none">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-md border-transparent bg-white px-2 py-0.5 text-xs font-black text-gray-700">Q{row.number}</Badge>
                    <Badge variant="outline" className="rounded-md border-transparent bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
                      {row.type.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {row.marksAwarded !== undefined && row.marksTotal !== undefined && (
                    <Badge variant="outline" className="rounded-md border-transparent bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                      {row.marksAwarded}/{row.marksTotal} marks
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-semibold leading-5 text-gray-700">
                  <AssessmentContentRenderer>{row.questionText || ''}</AssessmentContentRenderer>
                </div>
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
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${
                            correct
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : selected
                                ? "border-rose-300 bg-rose-50 text-rose-800"
                                : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          {showLabel && <span className="shrink-0 font-black uppercase">{label}</span>}
                          <AssessmentContentRenderer className="min-w-0 flex-1 [&_p]:my-0 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-inherit [&_p]:leading-5">{optionText || ''}</AssessmentContentRenderer>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!["mcq_single", "true_false"].includes(row.type) && (
                  <div className={`mt-2 rounded-md bg-white p-3 text-sm font-bold leading-6 ${row.submitted ? "text-gray-900" : "text-gray-400"}`}>
                    {row.submitted ? <AssessmentContentRenderer>{row.answerText}</AssessmentContentRenderer> : "Not answered"}
                  </div>
                )}
                {row.correctAnswer && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs font-semibold text-emerald-700">
                    <span className="shrink-0 uppercase tracking-wide">Answer key:</span>
                    <AssessmentContentRenderer className="min-w-0 flex-1 [&_p]:my-0">{row.correctAnswer}</AssessmentContentRenderer>
                  </div>
                )}
              </Card>
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
  const [activeTabId, setActiveTabId] = useState(
    location.state?.activeTabId === "overview" || !location.state?.activeTabId ? "questions" : location.state?.activeTabId
  );

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
  const [assessmentWorkspace, setAssessmentWorkspace] = useState<any>(location.state?.assessmentWorkspace || null);

  // Sync the assessment's title into navigation state so the top navbar can show
  // it instead of falling back to the raw id (Navbar's pageTitle() humanizes an
  // unrecognized path's last segment, which for a UUID reads as garbage).
  useEffect(() => {
    if (assessment?.title && location.state?.assessmentTitle !== assessment.title) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: { ...location.state, assessmentTitle: assessment.title },
      });
    }
  }, [assessment?.title, location.pathname, location.search, location.state, navigate]);

  const goBackToPreviousPage = () => {
    if (previousPage) {
      navigate(previousPage, { state: { assessmentWorkspace } });
      return;
    }
    navigate("/school/teacher/assessments", { state: { assessmentWorkspace } });
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const assessmentRes = await api.get(`/assessments/${id}`);
      const loadedAssessment = unwrapSchoolData<any>(assessmentRes, null);
      setAssessment(loadedAssessment);

      if (!assessmentWorkspace && loadedAssessment) {
        setAssessmentWorkspace({
          selectedClass: loadedAssessment.class_id ? { id: loadedAssessment.class_id, name: loadedAssessment.class_name || loadedAssessment.className || 'Class' } : null,
          selectedSection: loadedAssessment.section_id ? { id: loadedAssessment.section_id, name: loadedAssessment.section_name || loadedAssessment.sectionName || 'Section' } : null,
          selectedSubject: loadedAssessment.subject_id ? { id: loadedAssessment.subject_id, name: loadedAssessment.subject_name || loadedAssessment.subjectName || 'Subject' } : null,
        });
      }

      const [studentsRes, resultsRes, submissionsRes] = await Promise.all([
        api.get("/students", {
          params: {
            classId: loadedAssessment?.class_id || loadedAssessment?.classId,
            sectionId: loadedAssessment?.section_id || loadedAssessment?.sectionId,
            limit: 1000,
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

  useEffect(() => {
    if (location.state?.marksSearch && location.state?.marksSearch !== marksSearch) {
      setMarksSearch(location.state.marksSearch);
      if (location.state?.activeTabId) {
        setActiveTabId(location.state.activeTabId);
      }
    }
  }, [location.state]);

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
    const marks = draft.isAbsent ? 0 : clampMarks(Number(draft.marksObtained || 0), totalMarks);
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
    return (
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-2/3 max-w-lg" />
        </div>
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card className="rounded-2xl border-dashed border-red-200 bg-white p-12 text-center text-red-500 shadow-none">Assessment not found</Card>
      </div>
    );
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
        return hasSubmission ? <ToneBadge tone="success">Submitted</ToneBadge> : <ToneBadge tone="warning">No upload</ToneBadge>;
      },
    },
    {
      key: "marks",
      title: "Marks",
      render: (_: any, student: any) => {
        const draft = drafts[student.id];
        return (
          <Input
            type="number"
            min="0"
            max={totalMarks}
            value={draft?.marksObtained || ""}
            disabled={draft?.isAbsent}
            onChange={(event) => {
              const raw = event.target.value;
              const marks = raw === "" ? "" : String(clampMarks(Number(raw), totalMarks));
              const pct = percentage(Number(marks || 0), totalMarks);
              updateDraft(student.id, { marksObtained: marks, grade: marks === "" ? "" : gradeFromPercent(pct) });
            }}
            className="h-9 w-full md:w-24"
          />
        );
      },
    },
    {
      key: "grade",
      title: "Grade",
      render: (_: any, student: any) => (
        <Input
          value={drafts[student.id]?.grade || ""}
          onChange={(event) => updateDraft(student.id, { grade: event.target.value })}
          className="h-9 w-full md:w-20"
        />
      ),
    },
    {
      key: "absent",
      title: "Absent",
      render: (_: any, student: any) => (
        <Checkbox
          checked={Boolean(drafts[student.id]?.isAbsent)}
          onCheckedChange={(checked) => updateDraft(student.id, { isAbsent: checked === true })}
          aria-label="Absent"
        />
      ),
    },
    {
      key: "remarks",
      title: "Remarks",
      render: (_: any, student: any) => (
        <Input
          value={drafts[student.id]?.remarks || ""}
          onChange={(event) => updateDraft(student.id, { remarks: event.target.value })}
          placeholder="Optional"
          className="h-9 w-full md:min-w-48"
        />
      ),
    },
    {
      key: "status",
      title: "Status",
      render: (_: any, student: any) => (
        resultMap.has(String(student.id))
          ? <ToneBadge tone="success">Saved</ToneBadge>
          : <ToneBadge tone="warning">Pending</ToneBadge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, student: any) => (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openSubmissionReview(student)}>
            <Eye size={14} />
            Open
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => saveStudentResult(student)} disabled={savingId === student.id}>
            <Save size={14} />
            {savingId === student.id ? "Saving..." : "Save"}
          </Button>
        </div>
      ),
    },
  ];

  const emptyBox = (text: string, extra = "") => (
    <Card className={cn("rounded-xl border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500 shadow-none sm:p-10", extra)}>
      {text}
    </Card>
  );

  const attemptsContent = (
    <Card className="rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Marks Entry</h3>
          <p className="text-sm text-gray-500">
            {filteredStudents.length} of {students.length} student{students.length === 1 ? "" : "s"} in this roster.
          </p>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
          {students.length > 0 && (
            <>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  value={marksSearch}
                  onChange={(e) => setMarksSearch(e.target.value)}
                  placeholder="Search by student name or roll..."
                  className="h-9 w-full bg-white pl-9 pr-4 text-xs font-semibold"
                />
              </div>
              <PerPageSelect value={marksLimit} onChange={setMarksLimit} />
            </>
          )}
          <Button variant="outline" onClick={() => markAssessmentStatus("completed")} className="w-full sm:w-auto">
            Mark Completed
          </Button>
        </div>
      </div>
      {students.length ? (
        filteredStudents.length ? (
          <div className="space-y-4">
            {/* Phones: one card per student */}
            <div className="space-y-3 md:hidden">
              {paginatedStudents.map((student: any) => {
                const col = (key: string) => attemptsColumns.find((c) => c.key === key)!;
                return (
                  <Card key={student.id} className="space-y-3 rounded-xl border-gray-100 p-4 shadow-none">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">{col("name").render!(null, student)}</div>
                      {col("status").render!(null, student)}
                    </div>
                    <div>{col("submission").render!(null, student)}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Marks</Label>
                        {col("marks").render!(null, student)}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Grade</Label>
                        {col("grade").render!(null, student)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Remarks</Label>
                      {col("remarks").render!(null, student)}
                    </div>
                    <div className="flex items-center gap-2">
                      {col("absent").render!(null, student)}
                      <Label className="text-xs font-bold text-gray-600">Mark absent</Label>
                    </div>
                    <div className="border-t border-gray-100 pt-3">{col("actions").render!(null, student)}</div>
                  </Card>
                );
              })}
            </div>

            {/* Tablet / desktop table */}
            <div className="hidden md:block">
              <DataTable columns={attemptsColumns} data={paginatedStudents} />
            </div>

            {totalMarksPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-800">{Math.min(marksPage * marksLimit, filteredStudents.length)}</span> of <span className="font-bold text-gray-800">{filteredStudents.length}</span> students
                </p>
                <PageControls page={marksPage} totalPages={totalMarksPages} onPage={setMarksPage} />
              </div>
            )}
          </div>
        ) : (
          emptyBox("No students found matching your search.")
        )
      ) : (
        emptyBox("No students found for this assessment class or section.")
      )}
    </Card>
  );

  const leaderboardContent = (
    <Card className="rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
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
          emptyBox("Save marks to build the leaderboard.")
        )}
      </div>
    </Card>
  );

  const analyticsContent = (
    <div className="assessment__results">
      <div className="assessment__result-stats">
        <StatCard title="Average Score" value={`${analytics.average}%`} icon={<Target size={24} />} gradient="var(--gradient-primary)" />
        <StatCard title="Highest Score" value={`${analytics.highest}%`} icon={<Award size={24} />} gradient="var(--gradient-cool)" />
        <StatCard title="Pass Rate" value={`${analytics.passRate}%`} icon={<TrendingUp size={24} />} gradient="var(--gradient-accent)" />
        <StatCard title="Distinction Rate" value={`${analytics.distinctionRate}%`} icon={<Trophy size={24} />} gradient="var(--gradient-secondary)" />
      </div>

      <Card className="rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
        <h3 className="assessment__grade-title">Grade Distribution</h3>
        <div className="assessment__grade-chart mt-6 overflow-x-auto">
          {analytics.gradeDistribution.map((grade) => (
            <div key={grade.grade} className="assessment__grade-bar-wrapper">
              <div className="assessment__grade-bar" style={{ height: `${Math.max(grade.count, 1) * 24}px` }} />
              <span className="assessment__grade-label">{grade.grade}</span>
              <small className="assessment__grade-count">{grade.count}</small>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const questionPaperContent = (
    <Card className="flex h-full flex-col rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
      <div className="mb-6 flex flex-col gap-4 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Question Paper &amp; Instructions</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Source: {assessment.content_source || "metadata only"} | Scheduled: {assessment.scheduled_date ? new Date(assessment.scheduled_date).toLocaleDateString() : "Not scheduled"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {resolveUploadUrl(assessment.file_path) && (
            <Button asChild variant="outline" size="sm" className="gap-2 border-brand-200 font-bold text-brand-700 hover:bg-brand-50 hover:text-brand-700">
              <a href={resolveUploadUrl(assessment.file_path) || "#"} target="_blank" rel="noreferrer">
                <Download size={14} />
                Open uploaded file
              </a>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-amber-300 bg-amber-50/20 font-bold text-amber-800 hover:bg-amber-100/50 hover:text-amber-800"
            onClick={() => setActiveTabId("answer-key")}
          >
            <Key size={14} />
            Answer Key
          </Button>
        </div>
      </div>

      {assessment.content_text ? (
        <div className="select-none rounded-xl border border-gray-100 bg-gray-50 p-4 font-sans text-sm leading-7 text-gray-800 shadow-sm sm:p-6">
          <AssessmentContentRenderer>{assessment.content_text}</AssessmentContentRenderer>
        </div>
      ) : (
        emptyBox("No manual or AI text was added for this assessment.", "flex flex-1 items-center justify-center")
      )}
    </Card>
  );

  const answerKeyContent = (
    <Card className="flex h-full flex-col rounded-2xl border-amber-200/60 bg-amber-50/5 p-4 shadow-sm sm:p-[18px]">
      <div className="mb-6 flex flex-col gap-4 border-b border-amber-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-amber-950">
            <Key className="size-5 text-amber-600" />
            Answer Key &amp; Marking Scheme
          </h3>
          <p className="mt-0.5 text-xs text-amber-700/80">Reference solutions &amp; evaluation guide for teachers only</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-brand-200 bg-white font-bold text-brand-700 hover:bg-brand-50 hover:text-brand-700"
          onClick={() => setActiveTabId("questions")}
        >
          <FileText size={14} />
          Questions
        </Button>
      </div>

      {assessment.answer_key ? (
        <div className="select-none rounded-xl border border-amber-100 bg-white p-4 font-sans text-sm leading-7 text-gray-800 shadow-sm sm:p-6">
          <AssessmentContentRenderer>{assessment.answer_key}</AssessmentContentRenderer>
        </div>
      ) : (
        <Card className="flex flex-1 items-center justify-center rounded-xl border-dashed border-amber-200 bg-amber-50/20 p-12 text-center text-amber-800 shadow-none">
          No answer key has been provided for this assessment.
        </Card>
      )}
    </Card>
  );

  const submissionsContent = (
    <Card className="rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
      <div className="mb-5 flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Student Submissions</h3>
          <p className="text-sm text-gray-500">
            {filteredSubmissions.length} of {submissions.length} online submission{submissions.length === 1 ? "" : "s"} received.
          </p>
        </div>
        {submissions.length > 0 && (
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={submissionsSearch}
                onChange={(e) => setSubmissionsSearch(e.target.value)}
                placeholder="Search by student name..."
                className="h-9 w-full bg-white pl-9 pr-4 text-xs font-semibold"
              />
            </div>
            <PerPageSelect value={submissionsLimit} onChange={setSubmissionsLimit} />
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
                <Card key={submission.id} className="rounded-xl border-gray-100 bg-white p-4 shadow-sm">
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
                        className="gap-1.5"
                        onClick={() => openSubmissionReview({
                          id: submission.student_user_id,
                          name: submission.student_name || "Student",
                          studentProfile: {
                            rollNo: submission.roll_no,
                            section: { name: submission.section_name },
                          },
                        })}
                      >
                        <Eye size={14} />
                        Review
                      </Button>
                      {fileUrl && (
                        <Button asChild variant="outline" size="sm" className="gap-2 border-brand-200 font-bold text-brand-700 hover:bg-brand-50 hover:text-brand-700">
                          <a href={fileUrl} target="_blank" rel="noreferrer">
                            <Download size={14} />
                            Open file
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {totalSubmissionsPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-800">{paginatedSubmissions.length}</span> of <span className="font-bold text-gray-800">{filteredSubmissions.length}</span> submissions
                </p>
                <PageControls page={submissionsPage} totalPages={totalSubmissionsPages} onPage={setSubmissionsPage} />
              </div>
            )}
          </div>
        ) : (
          emptyBox("No submissions found matching your search.")
        )
      ) : (
        emptyBox("No students have submitted this assessment online yet.")
      )}
    </Card>
  );

  const reviewSubmission = reviewStudent ? submissionMap.get(String(reviewStudent.id)) : null;
  const reviewDraft = reviewStudent ? drafts[String(reviewStudent.id)] : null;
  const reviewFileUrl = resolveUploadUrl(reviewSubmission?.file_path || reviewSubmission?.filePath);
  const reviewStructuredRows = getStructuredAnswerRows(assessment, reviewSubmission, { includeBlank: true });

  const activeTab = activeTabId === "overview" ? "questions" : activeTabId;
  const tabContent: Record<string, React.ReactNode> = {
    questions: questionPaperContent,
    "answer-key": answerKeyContent,
    submissions: submissionsContent,
    attempts: attemptsContent,
    leaderboard: leaderboardContent,
    analytics: analyticsContent,
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <ToneBadge tone="purple">{String(assessment.type || assessment.assessment_type || "Test").toUpperCase()}</ToneBadge>
            <ToneBadge tone={assessment.status === "completed" ? "success" : "warning"}>{assessment.status || "Draft"}</ToneBadge>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-gray-900 sm:text-3xl">{assessment.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm font-medium text-gray-500">
            <span>Total Marks: {totalMarks}</span>
            <span className="hidden sm:inline">|</span>
            <span>Duration: {assessment.duration_minutes || 60} mins</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 self-start sm:self-auto" onClick={goBackToPreviousPage}>
          <ChevronLeft size={16} />
          Back to Assessments
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(tabId) => {
          setActiveTabId(tabId);
          setMarksSearch("");
        }}
      >
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
          {[
            { id: "questions", label: "Questions", icon: <FileText size={16} /> },
            { id: "answer-key", label: "Answer Key", icon: <Key size={16} /> },
            { id: "submissions", label: "Submissions", icon: <FileText size={16} /> },
            { id: "attempts", label: "Marks Entry", icon: <Users size={16} /> },
            { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
            { id: "analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
          ].map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="shrink-0 gap-2 rounded-lg px-3 py-2 text-xs font-bold text-gray-500 data-[state=active]:bg-brand-600 data-[state=active]:text-white data-[state=active]:shadow-sm sm:text-sm"
            >
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div>{tabContent[activeTab]}</div>

      <Dialog open={Boolean(reviewStudent)} onOpenChange={(open) => { if (!open) setReviewStudent(null); }}>
        <DialogContent className="flex h-[92vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-2xl">
          <DialogHeader className="shrink-0 border-b border-gray-100 p-4 pr-12 text-left sm:p-5 sm:pr-14">
            <DialogTitle className="text-base font-bold leading-normal tracking-normal sm:text-lg">
              Review Submission - {reviewStudent?.name || reviewSubmission?.student_name || "Student"}
            </DialogTitle>
            <DialogDescription className="sr-only">Read the submission, then save marks and remarks.</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {reviewStudent && (
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <Card className="min-w-0 rounded-xl border-gray-200 bg-white p-4 shadow-none">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">Student Submission</h3>
                    {reviewFileUrl && (
                      <Button asChild variant="outline" size="sm" className="gap-2 border-brand-200 text-xs font-bold text-brand-700 hover:bg-brand-50 hover:text-brand-700">
                        <a href={reviewFileUrl} target="_blank" rel="noreferrer">
                          <Download size={13} />
                          Open file
                        </a>
                      </Button>
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
                    emptyBox("No typed or selected answers were found. Use the uploaded file if available.", "p-8 text-sm")
                  )}
                </Card>

                <Card className="h-fit rounded-xl border-gray-200 bg-white p-4 shadow-sm">
                  <h3 className="text-base font-black text-gray-900">Grade This Submission</h3>
                  <p className="mt-1 text-xs font-medium text-gray-500">
                    Review the submission, then save marks and remarks.
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="review-marks" className="text-xs font-bold uppercase tracking-wide text-gray-500">
                        Marks out of {totalMarks}
                      </Label>
                      <Input
                        id="review-marks"
                        type="number"
                        min="0"
                        max={totalMarks}
                        value={reviewDraft?.marksObtained || ""}
                        disabled={reviewDraft?.isAbsent}
                        onChange={(event) => {
                          const raw = event.target.value;
                          const marks = raw === "" ? "" : String(clampMarks(Number(raw), totalMarks));
                          const pct = percentage(Number(marks || 0), totalMarks);
                          updateDraft(reviewStudent.id, {
                            marksObtained: marks,
                            grade: marks === "" ? "" : gradeFromPercent(pct),
                          });
                        }}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="review-grade" className="text-xs font-bold uppercase tracking-wide text-gray-500">Grade</Label>
                      <Input
                        id="review-grade"
                        value={reviewDraft?.grade || ""}
                        onChange={(event) => updateDraft(reviewStudent.id, { grade: event.target.value })}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="review-absent"
                        checked={Boolean(reviewDraft?.isAbsent)}
                        onCheckedChange={(checked) => updateDraft(reviewStudent.id, { isAbsent: checked === true })}
                      />
                      <Label htmlFor="review-absent" className="text-sm font-semibold text-gray-700">Mark absent</Label>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="review-remarks" className="text-xs font-bold uppercase tracking-wide text-gray-500">Remarks</Label>
                      <Textarea
                        id="review-remarks"
                        value={reviewDraft?.remarks || ""}
                        onChange={(event) => updateDraft(reviewStudent.id, { remarks: event.target.value })}
                        rows={5}
                        placeholder="Add feedback or note questions checked manually."
                        className="min-h-0 resize-none"
                      />
                    </div>

                    <Button
                      className="w-full justify-center gap-2"
                      onClick={() => saveStudentResult(reviewStudent)}
                      disabled={savingId === reviewStudent.id}
                    >
                      <Save size={16} />
                      {savingId === reviewStudent.id ? "Saving..." : "Save Grade"}
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssessmentDetails;
