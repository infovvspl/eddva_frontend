/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Save } from "lucide-react";
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
      </div>
    </div>
  );
};

export default AssessmentSubmissionReview;
