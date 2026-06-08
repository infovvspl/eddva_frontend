/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BarChart3,
  ChevronLeft,
  Download,
  FileText,
  Save,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import GlassCard from "@/components/school/GlassCard";
import Button from "@/components/school/Button";
import Badge from "@/components/school/Badge";
import Tabs from "@/components/school/Tabs";
import StatCard from "@/components/school/StatCard";
import DataTable from "@/components/school/DataTable";
import api, { unwrapSchoolData, unwrapSchoolList } from "@/lib/api/school-client";
import { getApiOrigin } from "@/lib/api-config";
import "./AssessmentSystem.css";

type DraftResult = {
  marksObtained: string;
  grade: string;
  remarks: string;
  isAbsent: boolean;
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
        <Button
          size="sm"
          icon={<Save size={14} />}
          onClick={() => saveStudentResult(student)}
          disabled={savingId === student.id}
        >
          {savingId === student.id ? "Saving..." : "Save"}
        </Button>
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
          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-800">
            {assessment.content_text}
          </pre>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
            No manual or AI text was added for this assessment.
          </div>
        )}
      </GlassCard>
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
                {submission.answer_text ? (
                  <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    {submission.answer_text}
                  </pre>
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
    </div>
  );
};

export default AssessmentDetails;
