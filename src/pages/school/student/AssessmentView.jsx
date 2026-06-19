import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api/school-client';
import { getApiOrigin } from '@/lib/api-config';
import AssessmentContentRenderer from '@/components/school/AssessmentContentRenderer';
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Loader2,
  Play,
} from 'lucide-react';

function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  const clean = String(filePath).replace(/^\.\//, '').replace(/^uploads[/\\]/, '');
  return `${getApiOrigin()}/uploads/${clean}`;
}

export default function AssessmentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [assessmentRes, submissionRes] = await Promise.all([
          api.get(`/assessments/${id}`),
          api.get(`/assessments/${id}/my-submission`).catch(() => ({ data: { data: null } })),
        ]);
        setAssessment(assessmentRes.data?.data ?? assessmentRes.data ?? null);
        setMySubmission(submissionRes.data?.data ?? submissionRes.data ?? null);
      } catch (error) {
        console.error('Failed to load assessment:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assessment not found</h2>
        <Link to="/school/student/assessments" className="mt-4 text-sm font-bold text-blue-600 hover:underline">
          Back to Assessments
        </Link>
      </div>
    );
  }

  const paperUrl = resolveUploadUrl(assessment.file_path || assessment.filePath);
  const isSubmitted = mySubmission && mySubmission.status !== 'in_progress';
  const isInProgress = mySubmission?.status === 'in_progress';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/school/student/assessments"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-600"
      >
        <ChevronLeft size={16} />
        Back to Assessments
      </Link>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600">
              {assessment.type || assessment.assessment_type || 'Assessment'}
            </span>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {assessment.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Clock size={15} />
                {assessment.duration_minutes || assessment.durationMinutes || 60} mins
              </span>
              <span>{assessment.total_marks || assessment.totalMarks || 100} marks</span>
              {assessment.scheduled_date && <span>{new Date(assessment.scheduled_date).toLocaleDateString()}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:min-w-44">
            {paperUrl && (
              <a
                href={paperUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                <Download size={16} />
                Download Paper
              </a>
            )}
            {isSubmitted ? (
              <button
                type="button"
                onClick={() => navigate(`/school/student/assessments/${assessment.id}`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <FileText size={16} />
                View Results
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate(`/school/student/assessments/${assessment.id}/take`)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <Play size={16} />
                {isInProgress ? 'Continue Test' : 'Start Test'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Question Paper</h2>
        </div>

        {assessment.content_text ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <AssessmentContentRenderer className="text-slate-800 dark:text-slate-100">
              {assessment.content_text}
            </AssessmentContentRenderer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800">
            No text instructions were added. Download the uploaded question paper if available.
          </div>
        )}
      </div>
    </div>
  );
}
