import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, CheckCircle, Clock, Link2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getLectureAssignments, submitAssignment, type LectureAssignment } from "@/lib/api/student";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import ResourceViewerModal from "@/components/resources/ResourceViewerModal";
import { uploadToS3 } from "@/lib/api/upload";

export function LectureAssignmentsSection({ lectureId, courseId }: { lectureId: string; courseId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submissionFiles, setSubmissionFiles] = useState<Record<string, File>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<LectureAssignment | null>(null);
  const [viewingSubmissionUrl, setViewingSubmissionUrl] = useState<string | null>(null);

  const { data: assignments, isLoading, error } = useQuery({
    queryKey: ["lecture-assignments", lectureId],
    queryFn: () => getLectureAssignments(lectureId),
  });

  const safeAssignments = assignments ?? [];

  const handleSubmit = async (assignmentId: string) => {
    const file = submissionFiles[assignmentId];
    if (!file) return;
    setSubmittingId(assignmentId);
    try {
      const attachmentUrl = await uploadToS3({
        type: "lecture-attachment",
        courseId,
        lectureId,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size
      }, file);

      await submitAssignment(assignmentId, attachmentUrl);
      toast({ title: "Assignment submitted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["lecture-assignments", lectureId] });
      setSubmissionFiles(prev => {
        const newFiles = { ...prev };
        delete newFiles[assignmentId];
        return newFiles;
      });
    } catch {
      toast({ title: "Failed to submit assignment", variant: "destructive" });
    } finally {
      setSubmittingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 flex justify-center items-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (safeAssignments.length === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {viewingAssignment && viewingAssignment.attachmentUrl && (
          <ResourceViewerModal
            title={viewingAssignment.title}
            content={viewingAssignment.description || undefined}
            fileUrl={viewingAssignment.attachmentUrl}
            type="pdf" // Allows opening standard files
            onClose={() => setViewingAssignment(null)}
          />
        )}
        {viewingSubmissionUrl && (
          <ResourceViewerModal
            title="My Submission"
            fileUrl={viewingSubmissionUrl}
            type="pdf"
            onClose={() => setViewingSubmissionUrl(null)}
          />
        )}
      </AnimatePresence>

      <div id="assignments" className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-orange-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5">
              Homework
            </p>
            <p className="text-sm font-bold text-slate-800 truncate leading-tight">
              Assignments
            </p>
          </div>
        </div>
        <span className="shrink-0 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-100 text-orange-700 text-xs font-black">
        {safeAssignments.length} items
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {safeAssignments.map((assignment: LectureAssignment) => {
          const sub = assignment.mySubmission;
          const isSubmitted = !!sub;

          return (
            <div key={assignment.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800">{assignment.title}</h3>
                  {assignment.description && (
                    <p className="text-sm text-slate-500 mt-1">{assignment.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {assignment.dueDate && (
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due: {format(new Date(assignment.dueDate), "PPp")}
                      </span>
                    )}
                    {assignment.maxMarks && (
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Max Marks: {assignment.maxMarks}
                      </span>
                    )}
                  </div>
                </div>
                {assignment.attachmentUrl && (
                  <Button variant="outline" size="sm" className="gap-1.5 bg-white shrink-0" onClick={() => setViewingAssignment(assignment)}>
                    <Link2 className="w-3.5 h-3.5" /> View File
                  </Button>
                )}
              </div>

              {!isSubmitted ? (
                <div className="pt-3 border-t border-slate-200/60 mt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Upload your work (PDF, images, etc.)</p>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSubmissionFiles(prev => ({ ...prev, [assignment.id]: file }));
                        }
                      }}
                      className="bg-white text-sm"
                    />
                    <Button
                      size="sm"
                      className="gap-1.5 shrink-0"
                      disabled={!submissionFiles[assignment.id] || submittingId === assignment.id}
                      onClick={() => handleSubmit(assignment.id)}
                    >
                      {submittingId === assignment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Submit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "pt-3 border-t mt-3 flex justify-between items-center p-3 rounded-lg",
                  sub.status === "graded" ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
                )}>
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-1.5 text-slate-800">
                      {sub.status === "graded" ? (
                        <><CheckCircle className="w-4 h-4 text-emerald-600" /> Graded</>
                      ) : (
                        <><Clock className="w-4 h-4 text-blue-600" /> Submitted for review</>
                      )}
                    </p>
                    {sub.status === "graded" && sub.grade != null && (
                      <p className="text-sm font-bold text-emerald-700 mt-1">Score: {sub.grade} {assignment.maxMarks ? `/ ${assignment.maxMarks}` : ""}</p>
                    )}
                    {sub.feedback && (
                      <p className="text-xs text-slate-600 mt-1 italic">"{sub.feedback}"</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={() => setViewingSubmissionUrl(sub.submissionUrl)}>
                    <Link2 className="w-3.5 h-3.5" /> My Submission
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}
