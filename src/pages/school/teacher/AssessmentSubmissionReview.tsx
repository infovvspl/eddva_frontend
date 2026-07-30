/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Save, Sparkles, Flag, CheckCircle2 } from "lucide-react";
import Button from "@/components/school/Button";
import GlassCard from "@/components/school/GlassCard";
import AssessmentContentRenderer from "@/components/school/AssessmentContentRenderer";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import {
  DraftResult,
  StructuredAnswersView,
  getStructuredAnswerRows,
  gradeFromPercent,
  percentage,
  resolveUploadUrl,
} from "./AssessmentDetails";
import "./AssessmentSystem.css";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
    navigate(`/school/teacher/assessments/${id}`, {
      state: {
        from: location.state?.originalFrom || `/school/teacher/assessments`,
        assessmentWorkspace,
        activeTabId: "submissions"
      },
    });
  };

  const redirectAfterSave = () => {
    navigate(`/school/teacher/assessments/${id}`, {
      state: {
        from: location.state?.originalFrom || `/school/teacher/assessments`,
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

        // Best-effort: absent for assessments with no subjective/AI-graded questions,
        // or when the feature is off — the page falls back to manual entry below.
        try {
          const reviewRes = await api.get(`/assessments/${id}/submissions/${studentId}/review`);
          const loadedReview = unwrapSchoolData<ReviewData | null>(reviewRes, null);
          if (loadedReview?.subjectiveQuestions?.length) {
            setReviewData(loadedReview);
            const initialMarks: Record<string, string> = {};
            for (const q of loadedReview.subjectiveQuestions) {
              const prefill = q.teacherReview?.finalMarks ?? q.currentMarks;
              initialMarks[q.questionId] = prefill === null || prefill === undefined ? "" : String(prefill);
            }
            setSubjectiveMarks(initialMarks);
          }
        } catch (reviewErr) {
          console.warn("No AI grading review available for this submission", reviewErr);
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

  const fileUrl = resolveUploadUrl(submission?.file_path || submission?.filePath);
  const studentName = student?.name || submission?.student_name || "Student";

  const updateDraft = (patch: Partial<DraftResult>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const saveGrade = async () => {
    if (!id || !studentId) return;
    const marks = draft.isAbsent ? 0 : Number(draft.marksObtained || 0);
    const pct = percentage(marks, totalMarks);
    const grade = draft.grade || gradeFromPercent(pct);
    setSaving(true);
    try {
      await api.post("/assessments/results", {
        assessmentId: id,
        studentId,
        marksObtained: marks,
        isAbsent: draft.isAbsent,
        grade,
        remarks: draft.remarks,
      });
      redirectAfterSave();
    } catch (err) {
      console.error("Failed to save result", err);
      alert("Could not save result. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updateSubjectiveMark = (questionId: string, value: string) => {
    setSubjectiveMarks((current) => ({ ...current, [questionId]: value }));
  };

  const saveAiGradedReview = async () => {
    if (!id || !studentId || !reviewData) return;

    const updates: Array<{ questionId: string; finalMarks: number }> = [];
    for (const q of reviewData.subjectiveQuestions) {
      const raw = subjectiveMarks[q.questionId];
      const marks = Number(raw);
      if (raw === undefined || raw === "" || !Number.isFinite(marks) || marks < 0 || marks > q.maxMarks) {
        alert(`Enter a valid mark (0-${q.maxMarks}) for every question before saving.`);
        return;
      }
      updates.push({ questionId: q.questionId, finalMarks: marks });
    }

    setSaving(true);
    try {
      await api.put(`/assessments/${id}/submissions/${studentId}/review`, { updates });
      await api.post(`/assessments/${id}/submissions/${studentId}/publish`);
      redirectAfterSave();
    } catch (err: any) {
      console.error("Failed to save AI-graded review", err);
      alert(err?.response?.data?.message || "Could not save the review. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading submission...</div>;
  }

  if (!assessment) {
    return <div className="p-12 text-center text-red-500">Assessment not found</div>;
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button
            type="button"
            onClick={backToAssessment}
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-900"
          >
            <ChevronLeft size={16} />
            Back to assessment
          </button>
          <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Review Submission - {studentName}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {assessment.title} | Marks out of {totalMarks}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">Student Submission</h3>
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
              >
                <Download size={13} />
                Open file
              </a>
            )}
          </div>
          {submission?.answer_text ? (
            <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
              <AssessmentContentRenderer>{submission.answer_text}</AssessmentContentRenderer>
            </div>
          ) : structuredRows.length ? (
            <div className="flex flex-col space-y-4">
              <div className="rounded-lg bg-white p-1">
                <StructuredAnswersView rows={paginatedRows} />
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-500">
                  Showing <span className="font-bold text-gray-700">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-gray-700">{Math.min(endIndex, structuredRows.length)}</span> of{" "}
                  <span className="font-bold text-gray-700">{structuredRows.length}</span> questions
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Per page:</span>
                    <CustomSelect
          onChange={setPageSize}
                      value={pageSize}
                      options={[
                      { value: 3, label: "3" },
                      { value: 5, label: "5" },
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: -1, label: "All" },
                    ]}
                      className="w-full"
                    />
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black transition-colors ${
                            currentPage === page
                              ? "bg-brand-600 text-white shadow-sm"
                              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        type="button"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
              No typed or selected answers were found. Use the uploaded file if available.
            </div>
          )}
        </GlassCard>

        {reviewData?.subjectiveQuestions?.length ? (
          <GlassCard className="min-w-0 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-brand-600" />
              <h3 className="text-sm font-black uppercase tracking-wide text-gray-700">AI-Graded Questions — Review Before Publishing</h3>
            </div>
            <div className="space-y-4">
              {reviewData.subjectiveQuestions.map((q) => (
                <div key={q.questionId} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap text-xs font-semibold leading-5 text-gray-600">{q.questionText}</p>
                    {q.aiGrading?.flagForReview && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-800">
                        <Flag size={11} /> Flagged for review
                      </span>
                    )}
                  </div>

                  <div className="mt-2 rounded-md bg-white p-3 text-sm font-bold leading-6 text-gray-900">
                    {q.studentAnswer || <span className="font-normal italic text-gray-400">Not answered</span>}
                  </div>

                  {q.aiGrading ? (
                    <div className="mt-3 space-y-2 rounded-md border border-brand-100 bg-brand-50/60 p-3">
                      {q.aiGrading.reviewNote && (
                        <p className="text-xs font-semibold italic text-amber-800">{q.aiGrading.reviewNote}</p>
                      )}
                      <ul className="space-y-1">
                        {q.aiGrading.criteria.map((c, i) => (
                          <li key={i} className="flex items-start justify-between gap-2 text-xs text-gray-700">
                            <span className="flex items-start gap-1.5">
                              {c.awardedMarks >= c.maxMarks ? (
                                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
                              ) : (
                                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-gray-300" />
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
                      {(q.aiGrading.strengths.length > 0 || q.aiGrading.missingPoints.length > 0) && (
                        <div className="grid gap-2 border-t border-brand-100 pt-2 sm:grid-cols-2">
                          {q.aiGrading.strengths.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Strengths</p>
                              <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                                {q.aiGrading.strengths.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                          {q.aiGrading.missingPoints.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-wide text-rose-700">Missing</p>
                              <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                                {q.aiGrading.missingPoints.map((s, i) => <li key={i}>{s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-semibold italic text-gray-400">
                      AI grading unavailable for this answer — enter marks manually.
                    </p>
                  )}

                  <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    Final marks (out of {q.maxMarks})
                    <input
                      type="number"
                      min="0"
                      max={q.maxMarks}
                      step="0.5"
                      value={subjectiveMarks[q.questionId] ?? ""}
                      onChange={(event) => updateSubjectiveMark(q.questionId, event.target.value)}
                      className="mt-1 w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500">
                Objective score: {reviewData.objectiveScore ?? 0}/{reviewData.objectiveTotal ?? 0} (auto-graded, already counted).
                Publishing computes the final total from objective + these subjective marks.
              </p>
              <Button icon={<Save size={16} />} onClick={saveAiGradedReview} disabled={saving}>
                {saving ? "Saving..." : "Save & Publish"}
              </Button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="h-fit lg:sticky lg:top-6">
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
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                Grade
                <input
                  value={draft.grade}
                  onChange={(event) => updateDraft({ grade: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.isAbsent}
                  onChange={(event) => updateDraft({ isAbsent: event.target.checked })}
                  className="h-4 w-4"
                />
                Mark absent
              </label>

              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
                Remarks
                <textarea
                  value={draft.remarks}
                  onChange={(event) => updateDraft({ remarks: event.target.value })}
                  rows={5}
                  placeholder="Add feedback or note questions checked manually."
                  className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500"
                />
              </label>

              <Button
                className="w-full justify-center"
                icon={<Save size={16} />}
                onClick={saveGrade}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Grade"}
              </Button>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default AssessmentSubmissionReview;
