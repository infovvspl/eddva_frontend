/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Save, Sparkles, Flag, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import {
  DraftResult,
  gradeFromPercent,
  percentage,
  resolveUploadUrl,
  getStructuredAnswerRows,
} from "./assessment-utils";
import { StructuredAnswersView } from "./AssessmentDetails";
import "./AssessmentSystem.css";


type AiCriterion = { criterion: string; maxMarks: number; awardedMarks: number; justification: string };
type AiGrading = {
  criteria: AiCriterion[];
  strengths: string[];
  missingPoints: string[];
  suggestions: string[];
  flagForReview: boolean;
  reviewNote: string;
  model?: string;
};
type ReviewQuestion = {
  questionId: string;
  questionText: string;
  maxMarks: number;
  studentAnswer: string;
  status: string;
  currentMarks: number | null;
  aiGrading: AiGrading | null;
  teacherReview: { status: string; finalMarks: number; reviewerNote?: string } | null;
};
type ReviewData = {
  submissionId: string;
  studentUserId: string;
  objectiveScore: number | null;
  objectiveTotal: number | null;
  gradingStatus: string | null;
  subjectiveQuestions: ReviewQuestion[];
};

const emptyDraft: DraftResult = {
  marksObtained: "",
  grade: "",
  remarks: "",
  isAbsent: false,
};

const AssessmentSubmissionReview: React.FC = () => {
  const { id, studentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateStudent = location.state?.student;
  const assessmentWorkspace = location.state?.assessmentWorkspace;

  const [assessment, setAssessment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [student, setStudent] = useState<any>(stateStudent || null);
  const [draft, setDraft] = useState<DraftResult>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  // AI-assisted grading review (only populated when the assessment has
  // subjective questions that went through the AI grading pipeline).
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [subjectiveMarks, setSubjectiveMarks] = useState<Record<string, string>>({});

  const totalMarks = Number(assessment?.total_marks || assessment?.totalMarks || 100);

  const backToAssessment = () => {
    if (location.state?.from) {
      navigate(location.state.from, {
        state: {
          from: location.state?.originalFrom,
          assessmentWorkspace,
          activeTabId: "submissions"
        },
      });
      return;
    }
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate(`/school/teacher/assessments/${id}`, {
      state: {
        assessmentWorkspace,
        activeTabId: "submissions"
      },
    });
  };

  const redirectAfterSave = () => {
    if (location.state?.from) {
      navigate(location.state.from, {
        state: {
          from: location.state?.originalFrom,
          assessmentWorkspace,
          activeTabId: "attempts",
          marksSearch: student?.name || submission?.student_name || "Student"
        },
      });
      return;
    }
    navigate(`/school/teacher/assessments/${id}`, {
      state: {
        assessmentWorkspace,
        activeTabId: "attempts",
        marksSearch: student?.name || submission?.student_name || "Student"
      },
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!id || !studentId) return;
      setLoading(true);
      try {
        const [assessmentRes, submissionsRes, resultsRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get(`/assessments/${id}/submissions`),
          api.get(`/assessments/${id}/results`),
        ]);

        const loadedAssessment = unwrapSchoolData<any>(assessmentRes, null);
        const loadedSubmissions = unwrapSchoolList(submissionsRes);
        const loadedResults = unwrapSchoolList(resultsRes);
        const loadedSubmission = loadedSubmissions.find((item: any) => {
          return String(item.student_user_id || item.studentId) === String(studentId);
        });
        const existing = loadedResults.find((result: any) => String(result.student_id) === String(studentId));
        const marks = existing?.marks_obtained ?? "";
        const pct = marks === "" ? 0 : percentage(Number(marks), Number(loadedAssessment?.total_marks || 100));

        setAssessment(loadedAssessment);
        setSubmission(loadedSubmission || null);
        setStudent(stateStudent || {
          id: studentId,
          name: loadedSubmission?.student_name || loadedSubmission?.studentName || "Student",
          studentProfile: {
            rollNo: loadedSubmission?.roll_no,
            section: { name: loadedSubmission?.section_name },
          },
        });
        setDraft({
          marksObtained: marks === "" ? "" : String(Number(marks)),
          grade: existing?.grade || (marks === "" ? "" : gradeFromPercent(pct)),
          remarks: existing?.remarks || "",
          isAbsent: Boolean(existing?.is_absent),
        });

        // ─── Seed subjectiveMarks from any previously saved teacher overrides ───────
        // grading_details on the submission contains the source of truth for all
        // teacher-overridden marks (both objective and subjective). Pre-populate
        // subjectiveMarks from this so the UI shows saved marks when the teacher
        // reopens a submission.
        const gradingDetails = Array.isArray(loadedSubmission?.grading_details)
          ? loadedSubmission.grading_details
          : (() => { try { return JSON.parse(loadedSubmission?.grading_details || "[]"); } catch { return []; } })();

        const seedMarks: Record<string, string> = {};
        for (const detail of gradingDetails) {
          const qId = String(detail.questionId || detail.question_id || detail.id || "");
          if (!qId) continue;
          const savedMark = detail.teacherReview?.finalMarks ?? detail.marks;
          if (savedMark !== undefined && savedMark !== null) {
            seedMarks[qId] = String(savedMark);
          }
        }

        // Best-effort: absent for assessments with no subjective/AI-graded questions,
        // or when the feature is off — the page falls back to manual entry below.
        try {
          const reviewRes = await api.get(`/assessments/${id}/submissions/${studentId}/review`);
          const loadedReview = unwrapSchoolData<ReviewData | null>(reviewRes, null);
          if (loadedReview?.subjectiveQuestions?.length) {
            setReviewData(loadedReview);
            // Merge: AI review questions take priority over seed (they have more detail)
            for (const q of loadedReview.subjectiveQuestions) {
              const prefill = q.teacherReview?.finalMarks ?? q.currentMarks;
              seedMarks[q.questionId] = prefill === null || prefill === undefined ? "" : String(prefill);
            }
          }
        } catch (reviewErr) {
          console.warn("No AI grading review available for this submission", reviewErr);
        }

        if (Object.keys(seedMarks).length > 0) {
          setSubjectiveMarks(seedMarks);
        }
      } catch (err) {
        console.error("Failed to fetch submission review", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, studentId]);

  const structuredRows = useMemo(() => {
    return getStructuredAnswerRows(assessment, submission, { includeBlank: true });
  }, [assessment, submission]);

  const totalPages = useMemo(() => {
    return pageSize === -1 ? 1 : Math.ceil(structuredRows.length / pageSize);
  }, [structuredRows.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = pageSize === -1 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === -1 ? structuredRows.length : startIndex + pageSize;

  const paginatedRows = useMemo(() => {
    return structuredRows.slice(startIndex, endIndex);
  }, [structuredRows, startIndex, endIndex]);

  const structuredGroups = useMemo(() => {
    return paginatedRows.reduce<Array<{ sectionTitle: string; rows: any[] }>>((acc, row) => {
      const sectionTitle = row.sectionTitle || "Questions";
      const last = acc[acc.length - 1];
      if (!last || last.sectionTitle !== sectionTitle) {
        acc.push({ sectionTitle, rows: [row] });
      } else {
        last.rows.push(row);
      }
      return acc;
    }, []);
  }, [paginatedRows]);

  const calculatedTotal = useMemo(() => {
    let sum = 0;

    for (const row of structuredRows) {
      const isObjective = ["mcq_single", "true_false", "fill_blank", "integer"].includes(row.type);
      const val = subjectiveMarks[row.id];
      if (val !== undefined && val !== null && val !== "") {
        sum += Number(val);
      } else if (isObjective) {
        if (row.marksAwarded !== undefined && row.marksAwarded !== null) {
          sum += Number(row.marksAwarded);
        }
      } else {
        if (row.marksAwarded !== undefined && row.marksAwarded !== null) {
          sum += Number(row.marksAwarded);
        }
      }
    }

    // Fallback: if structuredRows are empty but reviewData is present, use reviewData totals
    if (!structuredRows.length && reviewData) {
      const objScore = reviewData.objectiveScore ?? 0;
      let subjScore = 0;
      if (reviewData.subjectiveQuestions?.length) {
        for (const q of reviewData.subjectiveQuestions) {
          const val = subjectiveMarks[q.questionId];
          if (val !== undefined && val !== "") {
            subjScore += Number(val);
          }
        }
      }
      sum = objScore + subjScore;
    }

    return Math.round(sum * 100) / 100;
  }, [structuredRows, subjectiveMarks, reviewData]);

  useEffect(() => {
    if (calculatedTotal !== null && calculatedTotal !== undefined) {
      const pct = percentage(calculatedTotal, totalMarks);
      setDraft((current) => ({
        ...current,
        marksObtained: String(calculatedTotal),
        grade: gradeFromPercent(pct),
      }));
    }
  }, [calculatedTotal, totalMarks]);

  const fileUrl = resolveUploadUrl(submission?.file_path || submission?.filePath);
  const studentName = student?.name || submission?.student_name || "Student";

  const updateDraft = (patch: Partial<DraftResult>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const saveGrade = async () => {
    if (!id || !studentId) return;
    const finalScore = draft.isAbsent ? 0 : Number(draft.marksObtained || calculatedTotal || 0);
    const pct = percentage(finalScore, totalMarks);
    const grade = draft.grade || gradeFromPercent(pct);
    setSaving(true);
    try {
      // Collect all question mark overrides (objective & subjective) from subjectiveMarks state
      const updates: Array<{ questionId: string; finalMarks: number }> = [];
      Object.entries(subjectiveMarks).forEach(([qId, val]) => {
        const marks = Number(val);
        if (val !== "" && val !== undefined && Number.isFinite(marks) && marks >= 0) {
          updates.push({ questionId: qId, finalMarks: marks });
        }
      });

      if (updates.length > 0) {
        await api.put(`/assessments/${id}/submissions/${studentId}/review`, { updates }).catch((e) => {
          console.warn("Could not persist question review details", e);
        });
      }

      await api.post("/assessments/results", {
        assessmentId: id,
        studentId,
        marksObtained: finalScore,
        isAbsent: draft.isAbsent,
        grade,
        remarks: draft.remarks,
      });
      redirectAfterSave();
    } catch (err: any) {
      console.error("Failed to save result", err);
      alert(err?.response?.data?.message || "Could not save result. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateSubjectiveMark = (questionId: string, value: string) => {
    setSubjectiveMarks((current) => ({ ...current, [questionId]: value }));
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-2/3 max-w-lg" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
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

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={backToAssessment}
            className="mb-3 h-auto gap-2 p-0 text-sm font-bold text-brand-700 hover:bg-transparent hover:text-brand-900"
          >
            <ChevronLeft size={16} />
            Back to assessment
          </Button>
          <h1 className="font-display text-xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Review Submission - {studentName}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {assessment.title} | Marks out of {totalMarks}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0 rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">Student Submission</h3>
            {fileUrl && (
              <Button asChild variant="outline" size="sm" className="gap-2 border-brand-200 text-xs font-bold text-brand-700 hover:bg-brand-50 hover:text-brand-700">
                <a href={fileUrl} target="_blank" rel="noreferrer">
                  <Download size={13} />
                  Open file
                </a>
              </Button>
            )}
          </div>
          {structuredRows.length ? (
            <div className="flex flex-col gap-y-4">
              <div className="space-y-5">
                {structuredGroups.map((group) => (
                  <section key={group.sectionTitle} className="space-y-3">
                    <h4 className="rounded-md bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600">
                      {group.sectionTitle}
                    </h4>
                    {group.rows.map((row) => {
                      const subjectiveQ = reviewData?.subjectiveQuestions?.find((sq) => sq.questionId === row.id);
                      const isSubjective = !!subjectiveQ;

                      const showOptions = ["mcq_single", "true_false"].includes(row.type) && Array.isArray(row.options) && row.options.length > 0;
                      const submittedRaw = row.answerText ? row.answerText.split(".")[0]?.trim().toLowerCase() : "";
                      const correctRaw = String(row.correctAnswer || "").trim().toLowerCase();

                      return (
                        <Card key={row.id} className="rounded-lg border-gray-200 bg-gray-50 p-4 shadow-none">
                          {/* Row Header */}
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="rounded-md border-gray-200 bg-white px-2.5 py-1 text-xs font-black text-gray-700">Q{row.number}</Badge>
                              <Badge variant="outline" className="rounded-md border-transparent bg-blue-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-700">
                                {row.type.replace(/_/g, " ")}
                              </Badge>
                              {isSubjective && subjectiveQ.aiGrading?.flagForReview && (
                                <Badge variant="outline" className="shrink-0 gap-1 rounded-md border-transparent bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800">
                                  <Flag size={11} /> Flagged for review
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSubjective ? (
                                <Badge variant="outline" className={cn(
                                  "rounded-md px-2 py-1 text-xs font-black transition-colors",
                                  subjectiveMarks[subjectiveQ.questionId] !== undefined && subjectiveMarks[subjectiveQ.questionId] !== ""
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-transparent bg-brand-50 text-brand-700",
                                )}>
                                  {subjectiveMarks[subjectiveQ.questionId] !== undefined && subjectiveMarks[subjectiveQ.questionId] !== ""
                                    ? `${subjectiveMarks[subjectiveQ.questionId]}/${subjectiveQ.maxMarks} marks`
                                    : `Subjective (Max ${subjectiveQ.maxMarks} marks)`}
                                </Badge>
                              ) : (
                                row.marksAwarded !== undefined && row.marksTotal !== undefined && (
                                  <Badge variant="outline" className="rounded-md border-transparent bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
                                    {row.marksAwarded}/{row.marksTotal} marks
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>

                          {/* Question Text */}
                          <div className="mb-3 text-sm font-semibold leading-5 text-gray-850 text-gray-800">
                            <AssessmentContentRenderer>{row.questionText}</AssessmentContentRenderer>
                          </div>

                          {/* Answers and Grading Details */}
                          {isSubjective ? (
                            <>
                              <Card className="rounded-md bg-white p-3 text-sm font-bold leading-6 text-gray-900 border-gray-100 shadow-none">
                                {subjectiveQ.studentAnswer ? (
                                  <AssessmentContentRenderer>{subjectiveQ.studentAnswer}</AssessmentContentRenderer>
                                ) : (
                                  <span className="font-normal italic text-gray-400">Not answered</span>
                                )}
                              </Card>

                              {subjectiveQ.studentAnswerImage && (
                                <Card className="mt-3 rounded-lg border-slate-200 bg-white p-3 shadow-none">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Handwritten Answer Image</p>
                                  <a href={subjectiveQ.studentAnswerImage} target="_blank" rel="noopener noreferrer" className="inline-block group">
                                    <img
                                      src={subjectiveQ.studentAnswerImage}
                                      alt="Handwritten answer"
                                      className="max-h-48 rounded-md border border-slate-200 object-contain hover:shadow-md transition-all group-hover:scale-[1.02]"
                                    />
                                  </a>
                                </Card>
                              )}

                              {/* AI Feedback Section */}
                              {subjectiveQ.aiGrading ? (
                                <Card className="mt-3 space-y-2 rounded-md border-brand-100 bg-brand-50/60 p-3 shadow-none">
                                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-700">
                                    <Sparkles size={13} />
                                    <span>AI Feedback & Suggested Marks: {subjectiveQ.currentMarks}/{subjectiveQ.maxMarks}</span>
                                  </div>
                                  {subjectiveQ.aiGrading.reviewNote && (
                                    <p className="text-xs font-semibold italic text-amber-800">{subjectiveQ.aiGrading.reviewNote}</p>
                                  )}
                                  <ul className="space-y-1">
                                    {subjectiveQ.aiGrading.criteria.map((c, i) => (
                                      <li key={i} className="flex items-start justify-between gap-2 text-xs text-gray-700">
                                        <span className="flex items-start gap-1.5">
                                          {c.awardedMarks >= c.maxMarks ? (
                                            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                                          ) : (
                                            <span className="mt-0.5 size-3 shrink-0 rounded-full border-2 border-gray-300" />
                                          )}
                                          <span>
                                            <span className="font-semibold">{c.criterion}</span>
                                            {c.justification && <span className="text-gray-500"> — {c.justification}</span>}
                                          </span>
                                        </span>
                                        <span className="shrink-0 font-black text-gray-700">{c.awardedMarks}/{c.maxMarks}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {(subjectiveQ.aiGrading.strengths.length > 0 || subjectiveQ.aiGrading.missingPoints.length > 0) && (
                                    <div className="grid gap-2 border-t border-brand-100 pt-2 sm:grid-cols-2">
                                      {subjectiveQ.aiGrading.strengths.length > 0 && (
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Strengths</p>
                                          <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                                            {subjectiveQ.aiGrading.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                      {subjectiveQ.aiGrading.missingPoints.length > 0 && (
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">Missing</p>
                                          <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                                            {subjectiveQ.aiGrading.missingPoints.map((s, i) => <li key={i}>{s}</li>)}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Card>
                              ) : (
                                <p className="mt-3 text-xs font-semibold italic text-gray-400">
                                  AI grading unavailable for this answer — enter marks manually.
                                </p>
                              )}

                              {/* Teacher Input Box */}
                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                  Final marks (out of {subjectiveQ.maxMarks}):
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  max={subjectiveQ.maxMarks}
                                  step="0.5"
                                  value={subjectiveMarks[subjectiveQ.questionId] ?? ""}
                                  onChange={(event) => updateSubjectiveMark(subjectiveQ.questionId, event.target.value)}
                                  className="h-9 w-24 bg-white font-bold"
                                />
                              </div>
                            </>
                          ) : (
                            <>
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
                                        <AssessmentContentRenderer className="min-w-0 flex-1 [&_p]:my-0 [&_p]:text-xs [&_p]:font-semibold [&_p]:text-inherit [&_p]:leading-5">{optionText}</AssessmentContentRenderer>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {!["mcq_single", "true_false"].includes(row.type) && (
                                <div className={`mt-2 rounded-md bg-white p-3 text-sm font-bold leading-6 ${row.submitted ? "text-gray-900" : "text-gray-400"}`}>
                                  {row.submitted ? (
                                    <AssessmentContentRenderer>{row.answerText}</AssessmentContentRenderer>
                                  ) : (
                                    "Not answered"
                                  )}
                                </div>
                              )}
                              {row.correctAnswer && (
                                <div className="mt-2 text-xs font-semibold text-emerald-700">
                                  <AssessmentContentRenderer>{`Answer key: ${row.correctAnswer}`}</AssessmentContentRenderer>
                                </div>
                              )}
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                  Awarded Marks (out of {row.marksTotal || 1}):
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  max={row.marksTotal || 100}
                                  step="0.5"
                                  value={subjectiveMarks[row.id] ?? row.marksAwarded ?? ""}
                                  onChange={(event) => updateSubjectiveMark(row.id, event.target.value)}
                                  className="h-9 w-24 bg-white font-bold"
                                />
                              </div>
                            </>
                          )}
                        </Card>
                      );
                    })}
                  </section>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-700">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-gray-700">{Math.min(endIndex, structuredRows.length)}</span> of{" "}
                  <span className="font-bold text-gray-700">{structuredRows.length}</span> questions
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Per page:</span>
                    <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                      <SelectTrigger className="h-8 w-[84px] text-xs font-semibold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[3, 5, 10, 20, -1].map((n) => (
                          <SelectItem key={n} value={String(n)}>{n === -1 ? "All" : n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="size-8 rounded-lg"
                      >
                        <ChevronLeft size={16} />
                      </Button>

                      <div className="hidden items-center gap-1 sm:flex">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            type="button"
                            variant={currentPage === page ? "default" : "outline"}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                            className="size-8 rounded-lg text-xs font-black"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <span className="px-2 text-xs font-semibold text-gray-500 sm:hidden">
                        Page {currentPage} of {totalPages}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="size-8 rounded-lg"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : submission?.answer_text ? (
            <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
              <AssessmentContentRenderer>{submission.answer_text}</AssessmentContentRenderer>
            </div>
          ) : (
            <Card className="rounded-lg border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 shadow-none">
              No typed or selected answers were found. Use the uploaded file if available.
            </Card>
          )}
        </Card>

        <Card className="h-fit rounded-2xl border-gray-100 bg-white p-4 shadow-sm sm:p-[18px] lg:sticky lg:top-6">
          <h3 className="text-base font-black text-gray-900">Grade This Submission</h3>
          <p className="mt-1 text-xs font-medium text-gray-500">
            Review the submission, then save marks and remarks.
          </p>
          <div className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label htmlFor="grade-marks" className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Marks out of {totalMarks}
              </Label>
              <Input
                id="grade-marks"
                type="number"
                min="0"
                max={totalMarks}
                value={draft.marksObtained}
                disabled={draft.isAbsent}
                onChange={(event) => {
                  const marks = event.target.value;
                  const pct = percentage(Number(marks || 0), totalMarks);
                  updateDraft({
                    marksObtained: marks,
                    grade: marks === "" ? "" : gradeFromPercent(pct),
                  });
                }}
                className="bg-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="grade-grade" className="text-xs font-bold uppercase tracking-wide text-gray-500">Grade</Label>
              <Input
                id="grade-grade"
                value={draft.grade}
                disabled={!!reviewData?.subjectiveQuestions?.length}
                onChange={(event) => updateDraft({ grade: event.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="grade-absent"
                checked={draft.isAbsent}
                onCheckedChange={(checked) => updateDraft({ isAbsent: checked === true })}
              />
              <Label htmlFor="grade-absent" className="text-sm font-semibold text-gray-700">Mark absent</Label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="grade-remarks" className="text-xs font-bold uppercase tracking-wide text-gray-500">Remarks</Label>
              <Textarea
                id="grade-remarks"
                value={draft.remarks}
                onChange={(event) => updateDraft({ remarks: event.target.value })}
                rows={5}
                placeholder="Add feedback or note questions checked manually."
                className="min-h-0 resize-none bg-white"
              />
            </div>

            <Button
              className="w-full justify-center gap-2"
              onClick={saveGrade}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Grade & Publish"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssessmentSubmissionReview;
