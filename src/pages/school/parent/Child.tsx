import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, CheckCircle2, CheckCircle, XCircle, Clock, BookOpen, Search, X, Trophy, Target, Award, MessageSquare, Loader2 } from "lucide-react";
import { parentClient } from "@/lib/api/parent-client";
import { useParentContext } from "@/components/school/parent/ParentAuthGuard";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import api from '@/lib/api/school-client';
import GlassCard from '@/components/school/GlassCard';

export default function ParentChild() {
  const { activeChildId } = useParentContext();
  const [activeTab, setActiveTab] = useState<"attendance" | "marks" | "homework" | "tests">("attendance");

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Academic Progress</h2>
        <p className="text-sm font-semibold text-slate-500">View detailed reports for your child</p>
      </div>

      <div className="flex overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm border border-slate-100 no-scrollbar">
        {[
          { id: "attendance", label: "Attendance" },
          { id: "marks", label: "Report Card" },
          { id: "homework", label: "Homework" },
          { id: "tests", label: "Tests" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-[2rem] bg-white p-4 sm:p-6 shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === "attendance" && <AttendanceTab studentId={activeChildId} />}
        {activeTab === "marks" && <MarksTab studentId={activeChildId} />}
        {activeTab === "homework" && <HomeworkTab studentId={activeChildId} />}
        {activeTab === "tests" && <TestsTab studentId={activeChildId} />}
      </div>
    </div>
  );
}

function AttendanceTab({ studentId }: { studentId: string | null }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-attendance', studentId, month],
    queryFn: () => studentId ? parentClient.getAttendance(studentId, month) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-black text-slate-900">Attendance Record</h3>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
          />
          <button
            onClick={() => setShowLeaveModal(true)}
            className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200 transition-colors"
          >
            Apply Leave
          </button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (() => {
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr, 10);
        const monthIndex = parseInt(monthStr, 10) - 1;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDayIndex = new Date(year, monthIndex, 1).getDay();

        const calendarDays = [];
        for (let i = 0; i < firstDayIndex; i++) {
          calendarDays.push({ dayNum: null, status: 'empty', dateStr: '' });
        }
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const record = data?.records?.find((r: any) => r.date === dateStr);
          calendarDays.push({
            dayNum: d,
            status: record ? record.status : 'no_record',
            dateStr,
          });
        }

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-400">Present</p>
                <p className="text-2xl font-black text-emerald-600">{data?.present ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-400">Absent</p>
                <p className="text-2xl font-black text-red-500">{data?.absent ?? 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-400">Late</p>
                <p className="text-2xl font-black text-amber-500">{data?.late ?? 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-black uppercase text-slate-400 py-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => (
                <div
                  key={i}
                  className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition-all ${
                    day.status === 'present' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                    day.status === 'absent' ? 'border-red-100 bg-red-50 text-red-700 font-extrabold animate-pulse' :
                    day.status === 'late' ? 'border-amber-100 bg-amber-50 text-amber-700' :
                    day.status === 'holiday' ? 'border-slate-100 bg-slate-100 text-slate-400' :
                    day.status === 'empty' ? 'border-transparent bg-transparent text-transparent opacity-0 pointer-events-none' :
                    'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                  }`}
                >
                  {day.dayNum}
                  {day.status === 'present' && <CheckCircle2 className="h-3 w-3 mt-1 text-emerald-500" />}
                  {day.status === 'absent' && <XCircle className="h-3 w-3 mt-1 text-red-500" />}
                  {day.status === 'late' && <Clock className="h-3 w-3 mt-1 text-amber-500" />}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {showLeaveModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Apply for Leave</h3>
              <button onClick={() => setShowLeaveModal(false)} className="rounded-full p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowLeaveModal(false); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">From Date</label>
                  <input type="date" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">To Date</label>
                  <input type="date" required className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Reason</label>
                <textarea required rows={3} className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 resize-none" placeholder="Enter reason for leave..." />
              </div>
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3.5 text-[15px] font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                Submit Request
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function MarksTab({ studentId }: { studentId: string | null }) {
  const navigate = useNavigate();

  const calculateReportCardPercentage = (results: any[], classNameVal: string) => {
    if (!results || results.length === 0) return 0;
    const isClass10 = classNameVal.includes('10');
    const isIT = results.some((r: any) => (r.subjectName || '').toLowerCase().includes('information technology') || (r.subjectName || '').toLowerCase().includes('it'));

    const subjectFinals: number[] = [];
    const subjects = [...new Set(results.map((res: any) => res.subjectName).filter(Boolean))];

    subjects.forEach((subject) => {
      const subjectResults = results.filter((res: any) => res.subjectName === subject);
      let theoryObtained = 0;
      let internalObtained = 0;
      let hyExam = null;
      let aExam = null;
      let t1Int = null;
      let t2Int = null;

      subjectResults.forEach((res: any) => {
        const title = (res.assessmentTitle || '').toLowerCase();
        const score = res.marksObtained !== null ? Number(res.marksObtained) : 0;

        if (title.includes('theory')) {
          theoryObtained = score;
        } else if (title.includes('internal')) {
          internalObtained = score;
        } else if (title.includes('half yearly')) {
          hyExam = score;
        } else if (title.includes('annual')) {
          aExam = score;
        } else if (title.includes('t1 internal')) {
          t1Int = score;
        } else if (title.includes('t2 internal')) {
          t2Int = score;
        }
      });

      if (isClass10) {
        if (theoryObtained > 0 || internalObtained > 0) {
          const finalVal = theoryObtained + internalObtained;
          subjectFinals.push(Math.min(100, finalVal));
        }
      } else {
        if (hyExam === null && aExam === null && t1Int === null && t2Int === null) {
          hyExam = Math.round(theoryObtained * 0.4);
          aExam = Math.round(theoryObtained * 0.5);
          t1Int = Math.round(internalObtained || (theoryObtained * 0.05));
          t2Int = Math.round(internalObtained || (theoryObtained * 0.05));
        }

        let finalVal = 0;
        if (isIT) {
          const hyScaled = hyExam !== null ? (hyExam / 50) * 35 : 0;
          const annualScaled = aExam !== null ? (aExam / 50) * 35 : 0;
          const t1IntVal = t1Int !== null ? t1Int : 0;
          const t2IntVal = t2Int !== null ? t2Int : 0;
          const internalScaled = (t1IntVal + t2IntVal) / 2;
          finalVal = hyScaled + internalScaled + annualScaled;
        } else {
          const hyScaled = hyExam !== null ? (hyExam / 80) * 40 : 0;
          const annualScaled = aExam !== null ? (aExam / 80) * 40 : 0;
          const t1IntVal = t1Int !== null ? t1Int : 0;
          const t2IntVal = t2Int !== null ? t2Int : 0;
          const internalScaled = (t1IntVal + t2IntVal) / 2;
          finalVal = hyScaled + internalScaled + annualScaled;
        }
        subjectFinals.push(Math.min(100, Math.round(finalVal * 100) / 100));
      }
    });

    const sum = subjectFinals.reduce((acc, val) => acc + val, 0);
    return subjectFinals.length > 0 ? Math.round((sum / subjectFinals.length) * 100) / 100 : 0;
  };

  const { data: student, isLoading } = useQuery({
    queryKey: ['parent-student-detail', studentId],
    queryFn: () => studentId ? api.get(`/students/${studentId}`).then(res => res.data?.data || res.data) : null,
    enabled: !!studentId,
  });

  const resultsByClass = useMemo(() => {
    if (!student) return {};
    const profile = student.studentProfile || {};
    const currentClassName = profile.section?.class?.name;
    const previousResultsList = student.previousResults || [];

    const grouped: Record<string, any[]> = {};
    previousResultsList.forEach((res: any) => {
      if (!res.className) return;
      const isCurrent = res.className === currentClassName;
      const key = isCurrent 
        ? `${res.className} (Ongoing Class)` 
        : `${res.className} (${res.academicYear || 'N/A'})`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(res);
    });
    return grouped;
  }, [student]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900">Academic Report Cards</h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      ) : Object.keys(resultsByClass).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(resultsByClass).map(([classKey, results]) => {
            const classNameVal = results[0]?.className || classKey;
            const academicYearVal = results[0]?.academicYear || '';
            const subjectResults = results.filter((res: any) => res.subjectName && !(res.assessmentTitle || '').toLowerCase().includes('(total)'));
            const subjectsList = [...new Set(subjectResults.map((res: any) => res.subjectName).filter(Boolean))];
            const subjectsDisplay = subjectsList.length > 0 ? subjectsList.join(', ') : 'General / All Subjects';
            const overallPercentage = calculateReportCardPercentage(results, classNameVal);

            return (
              <GlassCard
                key={classKey}
                onClick={() => navigate(`/school/parent/child/report-card?class=${encodeURIComponent(classNameVal)}&year=${encodeURIComponent(academicYearVal)}&studentId=${studentId}`)}
                className="group relative cursor-pointer p-6 rounded-3xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col justify-between h-48 max-w-md w-full active:scale-[0.99] student-report-classes__card"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-wider">
                      {academicYearVal || 'Academic Year'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                      <FileText size={16} />
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight group-hover:text-blue-600 transition-colors">
                    {classNameVal}
                  </h4>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-clamp-2 pr-4 leading-normal">
                    Subjects: {subjectsDisplay}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Overall weighted result</div>
                    <div className="text-xs font-black text-slate-400 dark:text-slate-500 mt-0.5">Report Card Score</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{overallPercentage}%</div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
          <BookOpen className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No report cards available yet</p>
        </div>
      )}
    </div>
  );
}

function HomeworkTab({ studentId }: { studentId: string | null }) {
  const [filter, setFilter] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ['parent-homework', studentId, filter],
    queryFn: () => studentId ? parentClient.getHomework(studentId, filter) : null,
    enabled: !!studentId,
    retry: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {["All", "Pending", "Submitted", "Overdue"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-sm font-bold whitespace-nowrap transition-colors ${
              filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : data?.homework?.length > 0 ? (
        <div className="space-y-4">
          {data.homework.map((hw: any, i: number) => (
            <div key={hw.id ?? i} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-200 transition-colors">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 font-black text-xs uppercase">
                  {(hw.subject ?? hw.title ?? "?").toString().substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-[15px] font-black text-slate-900">{hw.title}</h4>
                  {hw.subject && <p className="text-xs font-semibold text-slate-500 mt-1">{hw.subject}</p>}
                  {hw.dueDate && (
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="sm:text-right">
                {hw.status === 'submitted' ? (
                  <span className="inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-700">
                    Submitted
                  </span>
                ) : hw.status === 'overdue' ? (
                  <span className="inline-flex items-center rounded-lg bg-red-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-red-700">
                    Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center opacity-50 py-12">
          <FileText className="h-12 w-12 text-slate-400 mb-3" />
          <p className="text-sm font-bold text-slate-600">No homework found for "{filter}"</p>
        </div>
      )}
    </div>
  );
}

// ── Test Result Question & Answer Review Helpers ───────────────────────
function parseJsonObject(value: any) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value: any) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getQuestions(assessment: any) {
  const questions = assessment?.questions_json || assessment?.questionsJson || assessment?.questions || [];
  return Array.isArray(questions) ? questions : parseJsonArray(questions);
}

function normalizeAnswer(value: any) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}"']/g, '')
    .replace(/\s+/g, ' ');
}

function answerMatches(expected: any, actual: any) {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

function formatAnswer(question: any, value: any): string {
  if (Array.isArray(value)) return value.map((item) => formatAnswer(question, item)).join(', ');
  const raw = String(value ?? '').trim();
  if (!raw) return 'Not answered';
  if (question?.type === 'mcq_single' && Array.isArray(question.options)) {
    const selected = question.options.find((option: any) => String(option.id || option.value || option.text).toLowerCase() === raw.toLowerCase());
    if (selected) {
      const label = selected.label || selected.id || selected.value || '';
      const text = selected.text || selected.value || selected.label || raw;
      return label && String(label).toLowerCase() !== String(text).toLowerCase() ? `${label}. ${text}` : text;
    }
  }
  return raw;
}

function buildReviewRows(assessment: any, submission: any) {
  const questions = getQuestions(assessment);
  const answers = parseJsonObject(submission?.answers_json || submission?.answersJson);
  const details = parseJsonArray(submission?.grading_details || submission?.gradingDetails);
  const detailMap = new Map(details.map((detail: any) => [String(detail.questionId || detail.question_id || detail.id), detail]));

  return questions.map((question: any, index: number) => {
    const questionId = String(question.id || `q-${index + 1}`);
    const value = answers[questionId];
    const submitted = Array.isArray(value) ? value.length > 0 : String(value ?? '').trim().length > 0;
    const detail = detailMap.get(questionId);
    const correctAnswer = detail?.correctAnswer ?? detail?.correct_answer ?? question.correctAnswer ?? question.correct_answer;
    const isObjective = ['mcq_single', 'true_false', 'fill_blank', 'integer'].includes(question.type);
    const correct = isObjective && correctAnswer !== undefined && correctAnswer !== null && correctAnswer !== ''
      ? submitted && answerMatches(correctAnswer, value)
      : undefined;
    const detailExplanation = String(detail?.explanation || '').trim();
    const questionExplanation = String(question.explanation || '').trim();
    const explanation = questionExplanation.length > detailExplanation.length ? questionExplanation : detailExplanation;

    return {
      id: questionId,
      number: question.displayNumber || question.number || index + 1,
      sectionTitle: question.sectionTitle || question.section || '',
      type: question.type || 'answer',
      text: question.text || `Question ${index + 1}`,
      options: question.type === 'true_false'
        ? [{ id: 'true', text: 'True' }, { id: 'false', text: 'False' }]
        : Array.isArray(question.options) ? question.options : [],
      submitted,
      answerText: submitted ? formatAnswer(question, value) : 'Not answered',
      rawAnswer: value,
      correctAnswer,
      correct,
      marks: detail?.marks !== undefined ? Number(detail.marks) : undefined,
      total: detail?.total !== undefined ? Number(detail.total) : Number(question.marks || 1),
      explanation,
    };
  });
}

function TestsTab({ studentId }: { studentId: string | null }) {
  const [selectedTest, setSelectedTest] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-tests', studentId],
    queryFn: () => studentId ? parentClient.getTests(studentId) : null,
    enabled: !!studentId,
    retry: 1,
  });

  const { data: testDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['parent-test-detail', studentId, selectedTest?.id],
    queryFn: async () => {
      if (!studentId || !selectedTest?.id) return null;
      const [asmRes, submissionRes] = await Promise.all([
        api.get(`/assessments/${selectedTest.id}`),
        parentClient.getChildSubmission(studentId, selectedTest.id).catch(() => null),
      ]);
      const assessment = asmRes.data?.data ?? asmRes.data ?? null;
      const submission = submissionRes ?? null;
      return { assessment, submission };
    },
    enabled: !!studentId && !!selectedTest?.id,
  });

  return (
    <div className="space-y-8">
      {/* UPCOMING */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Upcoming Tests</h3>
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-2xl" />
        ) : data?.upcoming?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.upcoming.map((test: any, i: number) => (
              <div key={test.id ?? i} className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-indigo-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-lg bg-white/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                    {test.type || "Test"}
                  </span>
                  <span className="text-xs font-bold text-indigo-100">{test.date ? new Date(test.date).toLocaleDateString() : ""}</span>
                </div>
                <h4 className="text-lg font-black leading-tight mb-2">{test.title}</h4>
                {typeof test.totalMarks === "number" && (
                  <p className="text-xs font-medium text-indigo-100 opacity-90">Total marks: {test.totalMarks}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">No upcoming tests scheduled</p>
          </div>
        )}
      </div>

      {/* COMPLETED */}
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Completed Tests</h3>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : data?.past?.length > 0 ? (
          <div className="space-y-3">
            {data.past.map((test: any, i: number) => (
              <div 
                key={test.id ?? i} 
                onClick={() => test.marksObtained !== null && test.marksObtained !== undefined && setSelectedTest(test)}
                className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${test.marksObtained !== null && test.marksObtained !== undefined ? 'cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.99]' : ''}`}
              >
                <div>
                  <h4 className="text-[15px] font-black text-slate-900">{test.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 capitalize">{test.type || "Test"}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">{test.date ? new Date(test.date).toLocaleDateString() : ""}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  {test.marksObtained !== null && test.marksObtained !== undefined ? (
                    <>
                      <span className="text-sm sm:text-base font-black text-emerald-600">{test.marksObtained}/{test.totalMarks} marks</span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        Evaluated ({test.grade || 'N/A'})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-400">Pending Evaluation</span>
                      <span className="text-[10px] font-bold text-slate-400">{test.totalMarks} Max Marks</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm font-bold text-slate-500">No completed tests yet</p>
          </div>
        )}
      </div>

      {selectedTest && (() => {
        const selectedTestMarks = selectedTest?.marksObtained !== null && selectedTest?.marksObtained !== undefined ? Number(selectedTest.marksObtained) : 0;
        const selectedTestTotal = selectedTest ? Number(selectedTest.totalMarks || 100) : 100;
        const selectedTestPct = selectedTestTotal > 0 ? Math.round((selectedTestMarks / selectedTestTotal) * 100) : 0;
        const selectedTestRingColor =
          selectedTestPct >= 75          ? 'from-emerald-400 to-green-500'
          : selectedTestPct >= 50          ? 'from-blue-400 to-indigo-500'
          : selectedTestPct >= 33          ? 'from-amber-400 to-orange-500'
          :                                  'from-rose-400 to-red-500';

        return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl space-y-6 relative border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
              {/* Header controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 sticky top-0 bg-white z-10 pt-2">
                <div>
                  <h1 className="text-xl font-black text-slate-800">Test Result Details</h1>
                  <p className="text-xs font-semibold text-slate-400">View evaluations and feedback</p>
                </div>
                <button 
                  onClick={() => setSelectedTest(null)} 
                  className="rounded-full p-2 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {/* Hero Header */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 p-6 text-white shadow-lg">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
                />
                <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                      {selectedTest.type || 'Assessment'}
                    </span>
                    <h2 className="mt-3 text-xl font-black leading-tight sm:text-2xl">{selectedTest.title}</h2>
                    <p className="mt-1 text-xs text-blue-100">
                      {selectedTestTotal} marks · {selectedTest.date ? new Date(selectedTest.date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className={`flex h-20 w-20 flex-col items-center justify-center rounded-full bg-gradient-to-br ${selectedTestRingColor} shadow-lg shadow-black/20`}>
                      <p className="text-xl font-black text-white">{selectedTestMarks}</p>
                      <p className="text-[10px] font-bold text-white/80">/{selectedTestTotal}</p>
                    </div>
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-black backdrop-blur-sm">
                      {selectedTestPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm text-center sm:text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Marks</p>
                    <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">
                      {selectedTestMarks} <span className="text-[10px] font-bold text-slate-400">/ {selectedTestTotal}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm text-center sm:text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Percent</p>
                    <p className="text-sm sm:text-lg font-black text-slate-900 mt-0.5">{selectedTestPct}%</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 rounded-2xl border border-slate-100 bg-white p-3 sm:p-4 shadow-sm text-center sm:text-left">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Grade</p>
                    <div className="mt-0.5">
                      <span className="inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-black bg-emerald-100 text-emerald-700 border-emerald-200">
                        {selectedTest.grade || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Score progress</span>
                  <span>{selectedTestPct}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${selectedTestRingColor} transition-all duration-1000`}
                    style={{ width: `${selectedTestPct}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>0</span>
                  <span className="text-rose-500">Pass: 33%</span>
                  <span className="text-emerald-500">Distinction: 75%</span>
                  <span>{selectedTestTotal}</span>
                </div>
              </div>

              {/* Component Breakdown if available */}
              {(() => {
                try {
                  if (selectedTest.remarks && String(selectedTest.remarks).trim().startsWith('{')) {
                    const parsed = JSON.parse(selectedTest.remarks);
                    if (parsed?.type === 'breakdown' && parsed.components) {
                      return (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Marks Breakdown
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.entries(parsed.components).map(([compName, compVal]: [string, any]) => {
                              if (!compVal || !compVal.enabled) return null;
                              return (
                                <div key={compName} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 capitalize">{compName}</span>
                                  <span className="text-sm font-black text-slate-800 mt-1">{compVal.obtained} / {compVal.max}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  }
                } catch (e) {
                  // Ignore
                }
                return null;
              })()}

              {/* Teacher's general remarks */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Teacher's Remarks</h3>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-700 italic">
                    "{(() => {
                      try {
                        if (selectedTest.remarks && String(selectedTest.remarks).trim().startsWith('{')) {
                          const parsed = JSON.parse(selectedTest.remarks);
                          return parsed?.userRemarks || parsed?.remarks || "Student has successfully completed the evaluation.";
                        }
                        return selectedTest.remarks || "Student has successfully completed the evaluation.";
                      } catch (e) {
                        return selectedTest.remarks || "Student has successfully completed the evaluation.";
                      }
                    })()}"
                  </p>
                </div>
              </div>

              {/* Question & Answer review matching student SessionResult */}
              <div className="border-t border-slate-150 pt-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Questions & Answers Review</h3>
                </div>
                
                {isLoadingDetail ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-slate-400 font-bold text-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    Loading questions and answers...
                  </div>
                ) : (() => {
                  const reviewRows = testDetail?.assessment ? buildReviewRows(testDetail.assessment, testDetail.submission) : [];
                  if (!reviewRows.length) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                        Detailed review is not available yet for this assessment.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {reviewRows.map((row: any) => (
                        <div
                          key={row.id}
                          className={`rounded-2xl border p-4 transition-all ${
                            row.correct === true
                              ? 'border-emerald-100 bg-emerald-50/60'
                              : row.correct === false
                                ? 'border-rose-100 bg-rose-50/60'
                                : 'border-slate-200 bg-slate-50/70'
                          }`}
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm">
                                Q{row.number}
                              </span>
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
                                {row.type.replace(/_/g, ' ')}
                              </span>
                              {row.sectionTitle && (
                                <span className="text-xs font-bold text-slate-400">{row.sectionTitle}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {row.correct === true && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                              {row.correct === false && <XCircle className="h-5 w-5 text-rose-500" />}
                              <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                                {row.marks ?? 0}/{row.total} marks
                              </span>
                            </div>
                          </div>

                          <p className="text-sm font-bold leading-6 text-slate-900 mb-3">{row.text}</p>

                          {row.options.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {row.options.map((option: any) => {
                                const optionId = String(option.id || option.value || option.text).toLowerCase();
                                const selected = optionId === String(row.rawAnswer ?? '').toLowerCase();
                                const correct = optionId === String(row.correctAnswer ?? '').toLowerCase();
                                return (
                                  <div
                                    key={optionId}
                                    className={`rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold ${
                                      correct
                                        ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                                        : selected
                                          ? 'border-rose-300 bg-rose-100 text-rose-800'
                                          : 'border-slate-200 bg-white text-slate-700'
                                    }`}
                                  >
                                    {(option.label || option.id) && <span className="mr-2 font-black uppercase">{option.label || option.id}.</span>}
                                    {option.text || option.value || option.label}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {!['mcq_single', 'true_false'].includes(row.type) && (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div className="rounded-xl bg-white p-3 border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student's Answer</p>
                                <p className={`mt-1 text-xs sm:text-sm font-black ${row.submitted ? 'text-slate-900' : 'text-slate-400'}`}>
                                  {row.answerText}
                                </p>
                              </div>
                              {row.correctAnswer !== undefined && row.correctAnswer !== null && row.correctAnswer !== '' && (
                                <div className="rounded-xl bg-white p-3 border border-slate-100">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Right Answer</p>
                                  <p className="mt-1 text-xs sm:text-sm font-black text-emerald-700">
                                    {formatAnswer(row, row.correctAnswer)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {row.explanation && (
                            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Explanation</p>
                              <p className="mt-1 whitespace-pre-wrap break-words text-xs sm:text-sm font-semibold leading-relaxed text-slate-700">{row.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="sticky bottom-0 bg-white pt-4 pb-2">
                <button 
                  onClick={() => setSelectedTest(null)} 
                  className="w-full rounded-xl bg-slate-900 py-3.5 text-sm font-black text-white hover:bg-slate-800 transition-colors shadow-lg active:scale-98"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
