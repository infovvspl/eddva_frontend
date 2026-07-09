import React from 'react';
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
  Loader2,
} from 'lucide-react';

const statusLabels = {
  all: 'All',
  pending: 'Pending',
  submitted: 'Submitted',
  evaluated: 'Evaluated',
  overdue: 'Overdue',
};

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400',
  evaluated: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400',
};

export default function AssignmentsMobile({
  assignments,
  activeStatus,
  setActiveStatus,
  activeSubject,
  setActiveSubject,
  assignedSubjects,
  loading,
  submitTarget,
  setSubmitTarget,
  notes,
  setNotes,
  submitFile,
  setSubmitFile,
  submitting,
  fileInputRef,
  resolveTeacherFileUrl,
  openSubmissionFile,
  handleSubmitAssignment,
}) {
  if (loading && assignments.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-bold text-slate-500">Loading Assignments...</p>
        </div>
      </div>
    );
  }

  // Filter on mobile
  const filtered = assignments.filter((item) => {
    const status = item.status || 'pending';
    const matchesStatus = activeStatus === 'all' || status === activeStatus;
    const matchesSubject = activeSubject === 'all' || item.subject === activeSubject;
    return matchesStatus && matchesSubject;
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Subject Filter (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x -mx-4 px-4">
        <button
          onClick={() => setActiveSubject('all')}
          className={`rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 ${
            activeSubject === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          All Subjects
        </button>
        {assignedSubjects.map((sub) => {
          const subName = sub.name || sub;
          return (
            <button
              key={subName}
              onClick={() => setActiveSubject(subName)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all shrink-0 ${
                activeSubject === subName
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-500 border border-slate-100 dark:bg-slate-900 dark:border-slate-800'
              }`}
            >
              {subName}
            </button>
          );
        })}
      </div>

      {/* Status Filter Tab Buttons */}
      <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-xl dark:bg-slate-800/80">
        {Object.entries(statusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveStatus(key)}
            className={`rounded-lg py-1.5 text-[10px] font-black text-center transition-all ${
              activeStatus === key
                ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stacked Cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {activeStatus === 'all' ? 'All' : statusLabels[activeStatus]} Assignments ({filtered.length})
          </h2>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50">
            <FileText className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">No assignments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => {
              const status = item.status || 'pending';
              const isPending = status === 'pending';
              const isEvaluated = status === 'evaluated';
              const col = statusColors[status] || 'bg-slate-50 text-slate-700 border-slate-200';
              const fileUrl = resolveTeacherFileUrl(item.teacherAttachment);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex rounded-lg bg-blue-50 px-2 py-0.5 text-[9px] font-black text-blue-700 uppercase dark:bg-blue-950/40 dark:text-blue-400">
                      {item.subject}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${col}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-black text-slate-800 dark:text-white leading-tight">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {item.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}
                    </span>
                    {item.maxMarks && (
                      <span>Max Marks: {item.maxMarks}</span>
                    )}
                  </div>

                  {/* Submission and Teacher Action Buttons */}
                  <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600"
                      >
                        <Download size={13} />
                        Download Instructions File
                      </a>
                    )}

                    {isPending && (
                      <button
                        onClick={() => setSubmitTarget(item)}
                        className="w-full rounded-xl bg-blue-600 py-2.5 text-center text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95 transition-transform"
                      >
                        Submit Assignment
                      </button>
                    )}

                    {item.submissionFileKey && (
                      <button
                        onClick={() => openSubmissionFile(item.submissionId)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        <Eye size={13} />
                        View My Submission
                      </button>
                    )}

                    {isEvaluated && (
                      <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/40">
                        <div className="flex items-center justify-between font-black text-slate-700 dark:text-slate-300">
                          <span>Evaluation Marks</span>
                          <span className="text-emerald-600 font-black">
                            {item.obtainedMarks || 0} / {item.maxMarks || 0}
                          </span>
                        </div>
                        {item.feedback && (
                          <p className="mt-1.5 text-slate-500 font-semibold italic">
                            Feedback: "{item.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Submit Modal */}
      {submitTarget && (
        <div className="fixed inset-0 z-[150] grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Submit Assignment</h3>
              <button
                onClick={() => setSubmitTarget(null)}
                className="text-slate-400 hover:bg-slate-50 p-1.5 rounded-xl transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-[13px] font-semibold text-slate-500">
              Submit file for "{submitTarget.title}"
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Remarks / Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please find the attached assignment solutions."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-[13px] text-slate-700 outline-none focus:border-blue-500 shadow-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-400 mb-1.5">Upload Attachment</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSubmitFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-[13px] font-bold text-slate-600"
                  >
                    <UploadCloud size={15} />
                    Choose File
                  </button>
                  <span className="text-xs text-slate-500 font-semibold truncate max-w-[200px]">
                    {submitFile ? submitFile.name : 'No file selected'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSubmitTarget(null)}
                className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-[13px] font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAssignment}
                disabled={submitting || !submitFile}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-[13px] font-black text-white shadow-md disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
