import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { useAuth } from '@/context/SchoolAuthContext';
import {
  ChevronLeft, Trophy, Target, AlertTriangle, CheckCircle2,
  Clock, BarChart3, FileText, Download, Award, MessageSquare,
  UserCheck, Loader2, ClipboardList,
} from 'lucide-react';
import { getApiOrigin } from '@/lib/api-config';

function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = String(filePath).replace(/^\.\//, '').replace(/^uploads[/\\]/, '');
  return `${getApiOrigin()}/uploads/${clean}`;
}

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

export default function SessionResult() {
  const { id } = useParams();           // assessment id
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [myResult, setMyResult]     = useState(null);   // from results table
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [asmRes, resultsRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get(`/assessments/${id}/results`),
        ]);

        const asm = asmRes.data?.data ?? asmRes.data ?? null;
        setAssessment(asm);

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
  const paperUrl      = resolveUploadUrl(assessment.file_path ?? assessment.filePath);
  const resultSaved   = !!myResult && !isAbsent && marks != null;

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

      {/* Question paper / content */}
      {(assessment.content_text || paperUrl) && (
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Question Paper</h3>
            </div>
            {paperUrl && (
              <a
                href={paperUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 transition dark:bg-blue-900/20 dark:text-blue-400"
              >
                <Download size={14} /> Download
              </a>
            )}
          </div>

          {assessment.content_text ? (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              {assessment.content_text}
            </pre>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
              Download the question paper using the button above.
            </div>
          )}
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
