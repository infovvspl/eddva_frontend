import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Plus, X, CheckCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Lecture } from "@/lib/api/teacher";
import {
  LectureAssignment,
  AssignmentSubmission,
  getAssignmentsForLecture,
  createLectureAssignment,
  getAssignmentSubmissions,
  gradeAssignmentSubmission
} from "@/lib/api/teacher";
import { uploadToS3 } from "@/lib/api/upload";
import ResourceViewerModal from "@/components/resources/ResourceViewerModal";

function AssignmentSubmissionsView({ assignment }: { assignment: LectureAssignment }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["assignments", assignment.id, "submissions"],
    queryFn: () => getAssignmentSubmissions(assignment.id),
  });
  
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  const handleGrade = async (submissionId: string) => {
    try {
      await gradeAssignmentSubmission(submissionId, { grade: Number(grade), feedback });
      toast({ title: "Grade submitted" });
      queryClient.invalidateQueries({ queryKey: ["assignments", assignment.id, "submissions"] });
      setGradingId(null);
    } catch {
      toast({ title: "Failed to grade", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  if (submissions.length === 0) return <p className="text-sm text-muted-foreground py-4">No submissions yet.</p>;

  return (
    <>
      <AnimatePresence>
        {viewingUrl && (
          <ResourceViewerModal
            title="Student Submission"
            fileUrl={viewingUrl}
            type="pdf"
            onClose={() => setViewingUrl(null)}
          />
        )}
      </AnimatePresence>
      <div className="space-y-4">
      {submissions.map(sub => (
        <div key={sub.id} className="p-4 border rounded-xl bg-card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-sm">{sub.student?.user?.name || "Unknown Student"}</p>
              <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
              <p className="text-xs mt-1">Status: <span className="font-medium capitalize">{sub.status}</span></p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 h-8 shrink-0" onClick={() => setViewingUrl(sub.submissionUrl)}>
              <Download className="w-3.5 h-3.5" /> View Submission
            </Button>
          </div>
          
          {sub.status === "graded" && gradingId !== sub.id ? (
            <div className="mt-3 bg-secondary/50 p-3 rounded-lg flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">Grade: {sub.grade}</p>
                {sub.feedback && <p className="text-xs text-muted-foreground mt-0.5">{sub.feedback}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setGradingId(sub.id); setGrade(String(sub.grade)); setFeedback(sub.feedback || ""); }}>Edit</Button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2 bg-secondary/20 p-3 rounded-lg border">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Grade Submission</p>
              <div className="flex gap-2">
                <Input type="number" placeholder="Grade" className="w-24 h-8" value={gradingId === sub.id ? grade : ""} onChange={e => { setGradingId(sub.id); setGrade(e.target.value); }} />
                <Input placeholder="Optional feedback..." className="flex-1 h-8" value={gradingId === sub.id ? feedback : ""} onChange={e => { setGradingId(sub.id); setFeedback(e.target.value); }} />
                <Button size="sm" className="h-8" disabled={gradingId !== sub.id || !grade} onClick={() => handleGrade(sub.id)}>Save</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
    </>
  );
}

export function AssignmentManagerModal({ lecture, onClose }: { lecture: Lecture; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "create" | "submissions">("list");
  const [selectedAssignment, setSelectedAssignment] = useState<LectureAssignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments", lecture.id],
    queryFn: () => getAssignmentsForLecture(lecture.id),
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [viewingUrl, setViewingUrl] = useState<{url: string, title: string} | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let attachmentUrl = "";
      if (file) {
        attachmentUrl = await uploadToS3({
          type: "lecture-attachment",
          courseId: lecture.batchId,
          lectureId: lecture.id,
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size
        }, file);
      }
      await createLectureAssignment(lecture.id, {
        title,
        description,
        attachmentUrl,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        maxMarks: maxMarks ? Number(maxMarks) : undefined,
      });
      toast({ title: "Assignment created successfully" });
      queryClient.invalidateQueries({ queryKey: ["assignments", lecture.id] });
      setView("list");
    } catch {
      toast({ title: "Failed to create assignment", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {viewingUrl && (
          <ResourceViewerModal
            title={viewingUrl.title}
            fileUrl={viewingUrl.url}
            type="pdf"
            onClose={() => setViewingUrl(null)}
          />
        )}
      </AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-card rounded-2xl border shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="font-semibold">{view === "list" ? "Assignments" : view === "create" ? "New Assignment" : "Submissions"}</h2>
            <p className="text-xs text-muted-foreground">{lecture.title}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {view === "list" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setView("create")} size="sm" className="gap-1.5 h-8">
                  <Plus className="w-3.5 h-3.5" /> Create Assignment
                </Button>
              </div>
              
              {isLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : assignments.length === 0 ? (
                <div className="text-center py-12 bg-secondary/20 rounded-xl border border-dashed">
                  <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No assignments yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create one to assign homework to students.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map(a => (
                    <div key={a.id} className="p-4 border rounded-xl flex items-center justify-between bg-card hover:bg-secondary/20 transition-colors">
                      <div>
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          {a.dueDate && <span>Due: {format(new Date(a.dueDate), "PPp")}</span>}
                          {a.maxMarks && <span>Max marks: {a.maxMarks}</span>}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {a.attachmentUrl && (
                          <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setViewingUrl({ url: a.attachmentUrl!, title: a.title })}>
                            View File
                          </Button>
                        )}
                        <Button size="sm" className="h-8" onClick={() => { setSelectedAssignment(a); setView("submissions"); }}>
                          Submissions
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === "create" && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 Practice Problems" />
              </div>
              <div className="space-y-1">
                <Label>Description (Optional)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Instructions for the students..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label>Max Marks (Optional)</Label>
                  <Input type="number" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} placeholder="100" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Attachment (PDF/Image)</Label>
                <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg" />
              </div>
              <div className="pt-4 flex gap-2 justify-end border-t">
                <Button type="button" variant="outline" onClick={() => setView("list")}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Assignment
                </Button>
              </div>
            </form>
          )}

          {view === "submissions" && selectedAssignment && (
            <div>
              <Button variant="ghost" size="sm" className="mb-4 h-8 px-2 -ml-2" onClick={() => { setView("list"); setSelectedAssignment(null); }}>
                &larr; Back to Assignments
              </Button>
              <AssignmentSubmissionsView assignment={selectedAssignment} />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
