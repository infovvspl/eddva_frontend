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
  Eye,
} from 'lucide-react';
import { cn } from '@/components/school/admin/Skeleton';
import { toast } from 'sonner';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { useIsMobile } from '@/hooks/use-mobile';

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

/** Resolve the teacher's attachment URL (stored as S3/CDN URL or local uploads). */
function resolveTeacherFileUrl(filePath) {
  if (!filePath) return null;
  const raw = String(filePath);
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/uploads/')) return `${getApiOrigin()}${raw}`;
  const clean = raw.replace(/^\.\//, "").replace(/^uploads[/\\]/, "");
  return `${getApiOrigin()}/uploads/${clean}`;
}

/** Call the backend to resolve a submission's file to a publicly accessible URL, then open it. */
async function openSubmissionFile(submissionId) {
  if (!submissionId) return;
  try {
    const res = await api.get(`/assignments/submissions/${submissionId}/file`);
    const url = res.data?.data?.url || res.data?.url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      throw new Error('No file URL returned');
    }
  } catch (err) {
    const msg = err?.response?.data?.message || 'Could not load submission file';
    // toast is used in the component; re-throw so callers can handle it
    throw new Error(msg);
  }
}

export default function Assignments() {
  const isMobile = useIsMobile();
  const [assignments, setAssignments] = useState([]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeSubject, setActiveSubject] = useState('all');
  const [assignedSubjects, setAssignedSubjects] = useState([]);
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

  const fetchProfile = async () => {
    try {
      const response = await api.get('/students/profile/me');
      const data = response.data?.data ?? response.data;
      const subjectsList = data?.studentProfile?.subjects || [];
      setAssignedSubjects(subjectsList);
    } catch (error) {
      console.error('Failed to fetch student profile subjects:', error);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchProfile();
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
    const assignmentId = submitTarget.id || submitTarget.assignment_id;
    if (!assignmentId) {
      toast.error('Assignment id is missing. Please refresh and try again.');
      return;
    }
    if (!submitFile && !notes.trim()) {
      toast.error('Upload a file or add notes');
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      if (submitFile) data.append('file', submitFile);
      if (notes.trim()) data.append('notes', notes.trim());
      await api.post(`/assignments/${assignmentId}/submit`, data, {
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
    all: assignmentView.filter((item) => activeSubject === 'all' || item.subjectName === activeSubject).length,
    pending: assignmentView.filter((item) => item.bucket === 'pending' && (activeSubject === 'all' || item.subjectName === activeSubject)).length,
    submitted: assignmentView.filter((item) => item.bucket === 'submitted' && (activeSubject === 'all' || item.subjectName === activeSubject)).length,
    evaluated: assignmentView.filter((item) => item.bucket === 'evaluated' && (activeSubject === 'all' || item.subjectName === activeSubject)).length,
    overdue: assignmentView.filter((item) => item.bucket === 'overdue' && (activeSubject === 'all' || item.subjectName === activeSubject)).length,
  };

  const subjects = ['all', ...new Set([
    ...assignedSubjects,
    ...assignmentView.map((item) => item.subjectName).filter(Boolean)
  ])];

  const filteredAssignments = assignmentView.filter((assignment) => {
    const statusMatches = activeStatus === 'all' || assignment.bucket === activeStatus;
    const subjectMatches = activeSubject === 'all' || assignment.subjectName === activeSubject;
    return statusMatches && subjectMatches;
  });

  return (
    <div className="space-y-6">
      {!isMobile && (
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
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              type="button"
              onClick={() => setActiveStatus(stat.id)}
              className={cn(
                'rounded-2xl border bg-white p-4 sm:p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900',
                activeStatus === stat.id
                  ? 'border-blue-300 ring-2 ring-blue-100 dark:border-blue-700 dark:ring-blue-950'
                  : 'border-slate-200 dark:border-slate-800',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Icon className="h-4 sm:h-5 sm:w-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">{counts[stat.id]}</p>
              </div>
              <p className="mt-3 sm:mt-5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1 pb-1 sm:pb-0 w-full sm:w-auto">
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
                'shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition sm:px-4 sm:py-2 sm:text-xs',
                activeStatus === id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800',
              )}
            >
              {label} ({counts[id]})
            </button>
          ))}
        </div>

        {subjects.length > 1 && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60 sm:px-3 sm:py-2 w-full sm:w-auto">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 shrink-0">Subject:</span>
            <div className="flex-1 sm:w-44">
              <CustomSelect
                onChange={setActiveSubject}
                value={activeSubject}
                options={subjects.map((sub) => ({ value: sub, label: sub === 'all' ? 'All Subjects' : sub }))}
                className="w-full"
              />
            </div>
          </div>
        )}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
          {filteredAssignments.map((assignment) => {
            const teacherUrl = resolveTeacherFileUrl(assignment.filePath || assignment.file_path);
            const due = assignment.dueDate || assignment.due_date;
            const instructionsText = (assignment.instructions || '')
              .replace(/[#*`_~\[\]]/g, '') // Strip markdown symbols
              .replace(/\s+/g, ' ') // Collapse multiple spaces
              .trim();

            return (
              <div
                key={assignment.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"
              >
                <div>
                  {/* Header Row: Title & Details on left, Status Badge on right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 sm:text-base" title={assignment.title}>
                        {assignment.title}
                      </h3>
                      {(assignment.subjectName || assignment.className || assignment.sectionName) && (
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {[assignment.subjectName, assignment.className, assignment.sectionName].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border",
                          assignment.bucket === 'evaluated'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                            : assignment.bucket === 'submitted'
                            ? "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
                            : assignment.bucket === 'overdue'
                            ? "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                            : "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                        )}
                      >
                        {statusLabels[assignment.bucket] || assignment.bucket}
                      </span>
                      {assignment.daysLeft !== null && assignment.bucket === 'pending' && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                          {assignment.daysLeft <= 0 ? 'Due today' : `${assignment.daysLeft}d left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description / Instructions */}
                  {instructionsText && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {instructionsText}
                    </p>
                  )}

                  {/* Metadata Row (Inline flex wrap) */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {due && (
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        <span>Due: {new Date(due).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <History size={13} className="text-slate-400 shrink-0" />
                      <span>{assignment.submissionHistory?.length || 0} sub(s)</span>
                    </div>
                    {assignment.marksObtained != null && (
                      <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span>Marks: {assignment.marksObtained}</span>
                      </div>
                    )}
                  </div>

                  {/* Teacher Feedback (Compact Box) */}
                  {assignment.feedback && (
                    <div className="mt-3 rounded-lg border-l-2 border-blue-500 bg-blue-50/40 p-2 dark:bg-blue-950/20">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Teacher Feedback</p>
                      <p className="mt-0.5 text-xs font-medium italic text-slate-700 dark:text-slate-300">"{assignment.feedback}"</p>
                    </div>
                  )}

                  {/* Attachments */}
                  {teacherUrl && (
                    <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                      <a
                        href={teacherUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Eye size={13} />
                        <span>View Attachment</span>
                      </a>
                      <a
                        href={teacherUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {assignment.bucket === 'evaluated' || assignment.bucket === 'submitted' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="capitalize">{assignment.bucket}</span>
                      </div>
                      {assignment.mySubmission?.id && (
                        <button
                          type="button"
                          onClick={() => openSubmissionFile(assignment.mySubmission.id).catch((e) => toast.error(e.message))}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/40"
                        >
                          <FileText size={13} />
                          <span>Submission</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openSubmit(assignment)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 shadow-sm"
                    >
                      <UploadCloud size={14} />
                      <span>Submit Work</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="erp-modal-container max-w-lg">
            <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Submit: {submitTarget.title}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Upload your completed work (PDF, image, or document).
                </p>
              </div>
              <button
                type="button"
                onClick={closeSubmit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="erp-modal-body space-y-4">
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
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-7 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-300"
              >
                <UploadCloud size={28} className="text-blue-500" />
                {submitFile ? submitFile.name : 'Choose file to upload'}
              </button>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500">
                  Notes (optional)
                </label>
                <textarea
                  className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any comment for your teacher..."
                />
              </div>
            </div>

            <div className="erp-modal-footer">
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
