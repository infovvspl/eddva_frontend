import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  ChevronLeft, Trophy, Target, AlertTriangle, CheckCircle2,
  Clock, Award, MessageSquare,
  UserCheck, Loader2, ClipboardList, XCircle, CheckCircle,
} from 'lucide-react';

function GradeChip({ grade }) {
  const colors = {
    'A+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'A':  'bg-green-100  text-green-700  border-green-200',
    'B':  'bg-blue-100   text-blue-700   border-blue-200',
    'C':  'bg-amber-100  text-amber-700  border-amber-200',
    'D':  'bg-orange-100 text-orange-700 border-orange-200',
    'F':  'bg-rose-100   text-rose-700   border-rose-200',
  };
  const cls = colors[grade] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm font-black ${cls}`}>
      {grade || '—'}
    </span>
  );
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getQuestions(assessment) {
  const questions = assessment?.questions_json || assessment?.questionsJson || assessment?.questions || [];
  return Array.isArray(questions) ? questions : parseJsonArray(questions);
}

function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?()[\]{}"']/g, '')
    .replace(/\s+/g, ' ');
}

function answerMatches(expected, actual) {
  return normalizeAnswer(expected) === normalizeAnswer(actual);
}

function formatAnswer(question, value) {
  if (Array.isArray(value)) return value.map((item) => formatAnswer(question, item)).join(', ');
  const raw = String(value ?? '').trim();
  if (!raw) return 'Not answered';
  if (question?.type === 'mcq_single' && Array.isArray(question.options)) {
    const selected = question.options.find((option) => String(option.id || option.value || option.text).toLowerCase() === raw.toLowerCase());
    if (selected) {
      const label = selected.label || selected.id || selected.value || '';
      const text = selected.text || selected.value || selected.label || raw;
      return label && String(label).toLowerCase() !== String(text).toLowerCase() ? `${label}. ${text}` : text;
    }
  }
  return raw;
}

function buildReviewRows(assessment, submission) {
  const questions = getQuestions(assessment);
  const answers = parseJsonObject(submission?.answers_json || submission?.answersJson);
  const details = parseJsonArray(submission?.grading_details || submission?.gradingDetails);
  const detailMap = new Map(details.map((detail) => [String(detail.questionId || detail.question_id || detail.id), detail]));

  return questions.map((question, index) => {
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

export default function SessionResult() {
  const { id } = useParams();           // assessment id
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [myResult, setMyResult]     = useState(null);   // from results table
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [asmRes, resultsRes, submissionRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get(`/assessments/${id}/results`),
          api.get(`/assessments/${id}/my-submission`).catch(() => null),
        ]);

        const asm = asmRes.data?.data ?? asmRes.data ?? null;
        setAssessment(asm);
        setMySubmission(submissionRes?.data?.data ?? submissionRes?.data ?? null);

        const allResults = resultsRes.data?.data ?? resultsRes.data ?? [];
        // Find this student's result (student_id stored in results table is the students.id)
        // The user object has user.id (users.id), so we match loosely
        const mine = Array.isArray(allResults)
          ? allResults.find(
              (r) =>
                String(r.student_id) === String(user?.id) ||
                String(r.student_user_id) === String(user?.id)
            ) ?? allResults[0] // fallback: single student fetching their own
          : null;
        setMyResult(mine ?? null);
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.id]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  /* ── Assessment not found ── */
  if (!assessment) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-600" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment not found</h2>
        <Link to="/school/student/assessments" className="mt-4 text-sm font-bold text-blue-600 hover:underline">
          ← Back to Assessments
        </Link>
      </div>
    );
  }

  const totalMarks    = Number(assessment.total_marks ?? assessment.totalMarks ?? 100);
  const marks         = myResult ? Number(myResult.marks_obtained ?? 0) : null;
  const pct           = marks != null && totalMarks ? Math.round((marks / totalMarks) * 100) : null;
  const isAbsent      = Boolean(myResult?.is_absent);
  const grade         = myResult?.grade ?? null;
  const remarks       = myResult?.remarks ?? null;
  const resultSaved   = !!myResult && !isAbsent && marks != null;
  const reviewRows    = buildReviewRows(assessment, mySubmission);

  /* ── grade ring color ── */
  const ringColor =
    pct == null          ? 'from-slate-300 to-slate-400'
    : pct >= 75          ? 'from-emerald-400 to-green-500'
    : pct >= 50          ? 'from-blue-400 to-indigo-500'
    : pct >= 33          ? 'from-amber-400 to-orange-500'
    :                      'from-rose-400 to-red-500';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back */}
      <Link
        to="/school/student/assessments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Assessments
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
              {assessment.type || 'Assessment'}
            </span>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">
              {assessment.title}
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              {totalMarks} marks · {assessment.duration_minutes ?? 60} mins
              {assessment.scheduled_date && ` · ${new Date(assessment.scheduled_date).toLocaleDateString()}`}
            </p>
          </div>

          {/* Score ring */}
          <div className="flex flex-col items-center gap-2">
            {isAbsent ? (
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/10 border-4 border-white/20">
                <UserCheck className="h-8 w-8 text-white/60" />
                <p className="mt-1 text-xs font-black uppercase text-white/60">Absent</p>
              </div>
            ) : marks != null ? (
              <div className={`flex h-24 w-24 flex-col items-center justify-center rounded-full bg-gradient-to-br ${ringColor} shadow-lg shadow-black/20`}>
                <p className="text-2xl font-black text-white">{marks}</p>
                <p className="text-xs font-bold text-white/80">/{totalMarks}</p>
              </div>
            ) : (
              <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white/10 border-4 border-white/20">
                <ClipboardList className="h-8 w-8 text-white/60" />
                <p className="mt-1 text-xs font-black uppercase text-white/60">Pending</p>
              </div>
            )}
            {pct != null && !isAbsent && (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black backdrop-blur-sm">
                {pct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Result not yet entered */}
      {!myResult && (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-dashed border-amber-200 bg-amber-50 p-10 text-center dark:border-amber-900/30 dark:bg-amber-950/10">
          <Clock className="h-10 w-10 text-amber-400" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Result Not Published Yet</h3>
          <p className="text-sm text-slate-500">
            Your teacher hasn't entered marks for this assessment yet. Check back later.
          </p>
        </div>
      )}

      {/* Absent */}
      {myResult && isAbsent && (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-rose-100 bg-rose-50 p-10 text-center dark:border-rose-900/30 dark:bg-rose-950/10">
          <UserCheck className="h-10 w-10 text-rose-400" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Marked Absent</h3>
          <p className="text-sm text-slate-500">You were marked absent for this assessment.</p>
          {remarks && (
            <p className="mt-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-300">
              Teacher's note: {remarks}
            </p>
          )}
        </div>
      )}

      {/* Result cards */}
      {resultSaved && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Marks */}
            <div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marks Obtained</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {marks} <span className="text-base font-bold text-slate-400">/ {totalMarks}</span>
                </p>
              </div>
            </div>

            {/* Percentage */}
            <div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Percentage</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{pct}%</p>
              </div>
            </div>

            {/* Grade */}
            <div className="flex items-center gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Grade</p>
                <div className="mt-1">
                  <GradeChip grade={grade} />
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
              <span>Your score</span>
              <span>{pct}%</span>
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${ringColor} transition-all duration-1000`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex justify-between text-xs font-semibold text-slate-400">
              <span>0</span>
              <span className="text-rose-500">Pass: 33%</span>
              <span className="text-emerald-500">Distinction: 75%</span>
              <span>{totalMarks}</span>
            </div>
          </div>

          {/* Teacher remarks */}
          {remarks && (
            <div className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm dark:border-indigo-900/30 dark:from-indigo-950/20 dark:to-slate-900">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">Teacher's Remarks</h3>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                {remarks}
              </p>
            </div>
          )}
        </>
      )}

      {/* Answer review */}
      {reviewRows.length > 0 && (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Review Answers</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {reviewRows.filter((row) => row.correct === true).length}/{reviewRows.filter((row) => row.correct !== undefined).length} objective correct
            </span>
          </div>

          <div className="space-y-4">
            {reviewRows.map((row) => (
              <div
                key={row.id}
                className={`rounded-2xl border p-4 ${
                  row.correct === true
                    ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/30 dark:bg-emerald-950/10'
                    : row.correct === false
                      ? 'border-rose-100 bg-rose-50/60 dark:border-rose-900/30 dark:bg-rose-950/10'
                      : 'border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/60'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      Q{row.number}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-900/20">
                      {row.type.replace(/_/g, ' ')}
                    </span>
                    {row.sectionTitle && (
                      <span className="text-xs font-bold text-slate-400">{row.sectionTitle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {row.correct === true && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    {row.correct === false && <XCircle className="h-5 w-5 text-rose-500" />}
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200">
                      {row.marks ?? 0}/{row.total} marks
                    </span>
                  </div>
                </div>

                <p className="text-sm font-bold leading-6 text-slate-900 dark:text-white">{row.text}</p>

                {row.options.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {row.options.map((option) => {
                      const optionId = String(option.id || option.value || option.text).toLowerCase();
                      const selected = optionId === String(row.rawAnswer ?? '').toLowerCase();
                      const correct = optionId === String(row.correctAnswer ?? '').toLowerCase();
                      return (
                        <div
                          key={optionId}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                            correct
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                              : selected
                                ? 'border-rose-300 bg-rose-100 text-rose-800'
                                : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
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
                    <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Answer</p>
                      <p className={`mt-1 text-sm font-black ${row.submitted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {row.answerText}
                      </p>
                    </div>
                    {row.correctAnswer !== undefined && row.correctAnswer !== null && row.correctAnswer !== '' && (
                      <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Right Answer</p>
                        <p className="mt-1 text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {formatAnswer(row, row.correctAnswer)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {row.explanation && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-950/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">Explanation</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">{row.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewRows.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white">Detailed review is not available yet</h3>
          <p className="mt-1 text-sm text-slate-500">Your submitted answers and objective explanations will appear here after submission data is available.</p>
        </div>
      )}

      {/* How-to tip */}
      {resultSaved && pct < 33 && (
        <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-5 dark:border-rose-900/30 dark:bg-rose-950/10">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="font-black text-slate-900 dark:text-white text-sm">Keep Going! 💪</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                Your score is below passing. Review your notes and practice more questions.
                Ask your teacher if you'd like extra help.
              </p>
            </div>
          </div>
        </div>
      )}
      {resultSaved && pct >= 75 && (
        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900/30 dark:bg-emerald-950/10">
          <div className="flex items-start gap-3">
            <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <p className="font-black text-slate-900 dark:text-white text-sm">Excellent Work! 🎉</p>
              <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                You scored a distinction. Keep up the great work!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
