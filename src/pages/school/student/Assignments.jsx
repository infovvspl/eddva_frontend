import React, { useEffect, useRef, useState } from 'react';
import api, { unwrapSchoolList } from '@/lib/api/school-client';
import { getApiOrigin } from '@/lib/api-config';
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  MessageSquare,
  History,
  Download,
  X,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { toast } from 'sonner';

const statusLabels = {
  all: 'All',
  pending: 'Pending',
  submitted: 'Submitted',
  evaluated: 'Evaluated',
  overdue: 'Overdue',
};

const statCards = [
  { id: 'pending', label: 'Pending', icon: AlertCircle },
  { id: 'submitted', label: 'Submitted', icon: UploadCloud },
  { id: 'evaluated', label: 'Evaluated', icon: CheckCircle2 },
  { id: 'overdue', label: 'Overdue', icon: Calendar },
];

function resolveUploadUrl(filePath) {
  if (!filePath) return null;
  const clean = String(filePath).replace(/^\.\//, '').replace(/^uploads[/\\]/, '');
  const origin = getApiOrigin();
  return `${origin}/uploads/${clean}`;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(unwrapSchoolList(response));
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Could not load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const openSubmit = (assignment) => {
    setSubmitTarget(assignment);
    setNotes(assignment.mySubmission?.notes || '');
    setSubmitFile(null);
  };

  const closeSubmit = () => {
    setSubmitTarget(null);
    setNotes('');
    setSubmitFile(null);
  };

  const handleSubmit = async () => {
    if (!submitTarget) return;
    if (!submitFile && !notes.trim()) {
      toast.error('Upload a file or add notes');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      if (submitFile) data.append('file', submitFile);
      if (notes.trim()) data.append('notes', notes.trim());
      await api.post(`/assignments/${submitTarget.id}/submit`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Assignment submitted');
      closeSubmit();
      setLoading(true);
      await fetchAssignments();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || 'Failed to submit assignment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const assignmentView = (Array.isArray(assignments) ? assignments : []).map((assignment) => {
    const dueDate = assignment.dueDate || assignment.due_date
      ? new Date(assignment.dueDate || assignment.due_date)
      : null;
    const isLate = dueDate && dueDate < new Date() && assignment.status !== 'submitted' && assignment.status !== 'evaluated';
    const evaluated = assignment.status === 'evaluated';
    const submitted = assignment.status === 'submitted' || assignment.status === 'evaluated';
    const bucket = isLate ? 'overdue' : evaluated ? 'evaluated' : submitted ? 'submitted' : 'pending';
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
    return { ...assignment, isLate, bucket, daysLeft };
  });

  const counts = {
    all: assignmentView.length,
    pending: assignmentView.filter((item) => item.bucket === 'pending').length,
    submitted: assignmentView.filter((item) => item.bucket === 'submitted').length,
    evaluated: assignmentView.filter((item) => item.bucket === 'evaluated').length,
    overdue: assignmentView.filter((item) => item.bucket === 'overdue').length,
  };

  const filteredAssignments = activeStatus === 'all'
    ? assignmentView
    : assignmentView.filter((assignment) => assignment.bucket === activeStatus);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            Academic Work
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Assignments</h1>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">
            View homework from your teachers, download attachments, and upload your work.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => setActiveStatus(stat.id)}
              className={cn(
                'rounded-2xl border bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900',
                activeStatus === stat.id
                  ? 'border-blue-300 ring-2 ring-blue-100 dark:border-blue-700 dark:ring-blue-950'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-3xl font-black text-slate-950 dark:text-white">{counts[stat.id]}</p>
              </div>
              <p className="mt-5 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {[
          ['all', 'All'],
          ['pending', 'Pending'],
          ['submitted', 'Submitted'],
          ['evaluated', 'Evaluated'],
          ['overdue', 'Overdue'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveStatus(id)}
            className={cn(
              'whitespace-nowrap rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition',
              activeStatus === id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {label} ({counts[id]})
          </button>
        ))}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-slate-100 border-dashed bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <FileText className="mb-4 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No assignments</h3>
          <p className="mt-1 text-sm text-slate-500">
            Your teacher has not posted homework for your class yet, or nothing matches this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const teacherUrl = resolveUploadUrl(assignment.filePath || assignment.file_path);
            const due = assignment.dueDate || assignment.due_date;
            return (
              <div
                key={assignment.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-800" />

                <div className="flex flex-1 flex-col p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {statusLabels[assignment.bucket] || assignment.bucket}
                    </span>
                    {assignment.daysLeft !== null && assignment.bucket === 'pending' && (
                      <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
                        {assignment.daysLeft <= 0 ? 'Due today' : `${assignment.daysLeft}d left`}
                      </span>
                    )}
                  </div>

                  <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white line-clamp-2">
                    {assignment.title}
                  </h3>
                  {(assignment.subjectName || assignment.className) && (
                    <p className="mb-3 text-xs font-semibold text-slate-500">
                      {[assignment.subjectName, assignment.className].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {assignment.instructions && (
                    <p className="mb-4 line-clamp-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                      {assignment.instructions}
                    </p>
                  )}

                  <div className="mb-6 space-y-2 text-xs font-semibold text-slate-500">
                    {due && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Due: {new Date(due).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-slate-400" />
                      <span>{assignment.submissionHistory?.length || 0} submission(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-slate-400" />
                      <span>{assignment.feedback || 'Teacher feedback pending'}</span>
                    </div>
                    {assignment.marksObtained != null && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-slate-400" />
                        <span>Marks: {assignment.marksObtained}</span>
                      </div>
                    )}
                  </div>

                  {teacherUrl && (
                    <a
                      href={teacherUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      <Download size={14} />
                      Download teacher attachment
                    </a>
                  )}

                  <div className="mt-auto border-t border-slate-100 pt-4 dark:border-slate-800">
                    {assignment.bucket === 'evaluated' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">
                          <CheckCircle2 size={16} className="text-slate-500" />
                          Evaluated
                        </div>
                        {(assignment.mySubmission?.file_path || assignment.mySubmission?.filePath) && (
                          <button
                            type="button"
                            onClick={() => window.open(resolveUploadUrl(assignment.mySubmission.file_path || assignment.mySubmission.filePath), '_blank')}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <FileText size={16} />
                            View my submission
                          </button>
                        )}
                      </div>
                    ) : assignment.bucket === 'submitted' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-bold text-slate-500 dark:bg-slate-800/50">
                          <CheckCircle2 size={16} className="text-slate-500" />
                          Submitted
                        </div>
                        {(assignment.mySubmission?.file_path || assignment.mySubmission?.filePath) && (
                          <button
                            type="button"
                            onClick={() => window.open(resolveUploadUrl(assignment.mySubmission.file_path || assignment.mySubmission.filePath), '_blank')}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 py-3 text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <FileText size={16} />
                            View my submission
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSubmit(assignment)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20"
                      >
                        <UploadCloud size={16} />
                        Submit work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Submit: {submitTarget.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload your completed work (PDF, image, or document).
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubmit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300"
            >
              <UploadCloud size={28} className="text-blue-500" />
              {submitFile ? submitFile.name : 'Choose file to upload'}
            </button>

            <label className="mt-4 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Notes (optional)
            </label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any comment for your teacher..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeSubmit}
                className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Uploading…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
