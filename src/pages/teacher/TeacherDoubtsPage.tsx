import { useState, useMemo, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDoubtQueue,
  useAllDoubts,
  useRespondToDoubt,
  useMarkDoubtReviewed,
  useResolveDoubtWithAiAsTeacher,
  useDeleteDoubt,
  useMyBatches,
  teacherKeys,
} from "@/hooks/use-teacher";
import { type Doubt } from "@/lib/api/teacher";
import {
  MessageSquare, Clock, AlertCircle, CheckCircle2, Send,
  Loader2, Search, RefreshCw, ChevronRight, Image as ImageIcon,
  BookOpen, Sparkles, ThumbsUp, ThumbsDown, Link2, Eye, EyeOff,
  CheckCheck, XCircle, Users, Inbox, Filter, Bot, Upload, Trash2,
} from "lucide-react";
import { apiClient, extractData } from "@/lib/api/client";
import { guessImageMimeFromName, uploadToS3 } from "@/lib/api/upload";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  open:             { label: "Open",             bg: "bg-orange-100 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  ai_resolved:      { label: "AI Resolved",      bg: "bg-blue-100 dark:bg-blue-50/30",   text: "text-blue-700 dark:text-blue-400",   dot: "bg-blue-500" },
  escalated:        { label: "Needs Answer",     bg: "bg-red-100 dark:bg-red-950/30",     text: "text-red-700 dark:text-red-400",     dot: "bg-red-500" },
  teacher_resolved: { label: "Resolved",         bg: "bg-emerald-100 dark:bg-emerald-50/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
};

const AI_QUALITY_OPTIONS = [
  { value: "correct", label: "Completely Correct", desc: "AI answered it right — no extra response needed", icon: CheckCircle2, color: "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-50/20" },
  { value: "partial", label: "Partially Correct",  desc: "AI got some parts right — I'll complete it", icon: AlertCircle, color: "text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-50/20" },
  { value: "wrong",   label: "Completely Wrong",   desc: "AI missed it entirely — I'll write from scratch", icon: XCircle, color: "text-red-600 border-red-300 bg-red-50 dark:bg-red-950/20" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(minutes?: number): string {
  if (minutes == null) return "";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

function urgencyColor(minutes?: number): string {
  if (!minutes) return "";
  if (minutes > 120) return "text-red-500";
  if (minutes > 60) return "text-amber-500";
  return "text-muted-foreground";
}

// ─── AI answer parser ─────────────────────────────────────────────────────────

interface AiAnswerStructured {
  brief?: { answer?: string };
  detailed?: { solution?: string; final_answer?: string; verification?: string; key_concept?: string };
  subject?: string;
  type?: string;
}

function parseAiAnswer(raw: string | null | undefined): AiAnswerStructured | null {
  if (!raw) return null;
  let str = raw.trim();
  
  // Try to find the outermost { } block first (strips preambles/postscripts)
  const jsonMatch = str.match(/(\{[\s\S]*\})/);
  if (jsonMatch) str = jsonMatch[1].trim();

  const check = (obj: any): AiAnswerStructured | null => {
    if (obj && typeof obj === "object" && (obj.brief || obj.detailed)) return obj as AiAnswerStructured;
    return null;
  };

  try {
    return JSON.parse(str) as AiAnswerStructured;
  } catch {
    // Aggressive fix: escape raw newlines inside what looks like string values
    const fixed = str.replace(/"([\s\S]*?)"/g, (match) => 
      match.replace(/\n/g, "\\n").replace(/\r/g, "\\n")
    );
    try {
      return JSON.parse(fixed) as AiAnswerStructured;
    } catch {
      // One last try: if it's the "tightMatch" version
      const tightMatch = str.match(/\{"brief":[\s\S]*\}/);
      if (tightMatch) {
        try {
          return JSON.parse(tightMatch[0].replace(/"([\s\S]*?)"/g, (m) => m.replace(/\n/g, "\\n"))) as AiAnswerStructured;
        } catch { /* Final fail */ }
      }
    }
  }
  return null;
}

const formatMarkdown = (text?: string) => {
  if (!text) return "";
  return text
    .replace(/\\n/g, "\n")
    .replace(/\r?\n/g, "\n\n")
    // Step-based and final answer formatting
    .replace(/(Step\s*\d+[^a-zA-Z0-9\s]?|Final\s*Answer\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Theory-specific 5-part numerical/theory headers
    .replace(/(\(\d\)\s*[a-zA-Z\s/-]+[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    // Legacy sub-headers
    .replace(/(Reason\s*[:\u2014\u2013\u002D.]?|Explanation\s*[:\u2014\u2013\u002D.]?|Logic\s*[:\u2014\u2013\u002D.]?|Key\s*Concept\s*[:\u2014\u2013\u002D.]?|Verification\s*[:\u2014\u2013\u002D.]?)/gi, "\n\n$1")
    .replace(/\\\[/g, "$$").replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$").replace(/\\\)/g, "$")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.open;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full", m.bg, m.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

// ─── Doubt List Item ──────────────────────────────────────────────────────────

function DoubtListItem({ doubt, selected, onClick }: {
  doubt: Doubt;
  selected: boolean;
  onClick: () => void;
}) {
  const mins = doubt.timeSinceAskedMinutes ?? doubt.minutesSinceAsked;
  const name = doubt.student?.fullName ?? doubt.studentName ?? "Student";
  const topic = doubt.topic?.name ?? doubt.topicName;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border transition-colors",
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/40 border-l-2 border-l-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={doubt.status} />
            {mins != null && (
              <span className={cn("text-xs flex items-center gap-1", urgencyColor(mins))}>
                <Clock className="w-3 h-3" /> {timeAgo(mins)}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-2 mb-1">
            {doubt.questionText || doubt.ocrExtractedText || "Image question"}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{name}</span>
            {topic && <><span>·</span><span>{topic}</span></>}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Response Editor ──────────────────────────────────────────────────────────

function ResponseEditor({ doubtId, aiQualityRating, questionText, onDone }: {
  doubtId: string;
  aiQualityRating?: string;
  questionText?: string;
  onDone: () => void;
}) {
  const [response, setResponse] = useState("");
  const [lectureRef, setLectureRef] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [diagramUploading, setDiagramUploading] = useState(false);
  const diagramFileRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const respondM = useRespondToDoubt();

  const onDiagramFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setDiagramUploading(true);
    try {
      const contentType = (file.type && file.type.trim()) || guessImageMimeFromName(file.name);
      const url = await uploadToS3(
        {
          type: "doubt-response-image",
          fileName: file.name,
          contentType,
          fileSize: file.size,
        },
        file,
      );
      setImageUrl(url);
      toast.success("Image uploaded — it will be included with your response.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setDiagramUploading(false);
    }
  };

  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
      const res = await apiClient.post(`/doubts/${doubtId}/ai-draft`);
      const data = extractData<{ explanation: string }>(res);
      const explanation = data?.explanation ?? "";
      if (explanation) {
        setResponse(prev => prev ? `${prev}\n\n[AI Draft]:\n${explanation}` : explanation);
        toast.success("AI draft added — review and edit before sending.");
      } else {
        toast.error("AI couldn't generate a response. Write manually.");
      }
    } catch {
      toast.error("Failed to get AI response.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!response.trim()) { toast.error("Please write a response before sending."); return; }
    if (diagramUploading) { toast.error("Wait for the image upload to finish."); return; }
    try {
      await respondM.mutateAsync({
        id: doubtId,
        payload: {
          teacherResponse: response.trim(),
          aiQualityRating: aiQualityRating as any,
          lectureRef: lectureRef.trim() || undefined,
          responseImageUrl: imageUrl.trim() || undefined,
        },
      });
      toast.success("Response sent! Student has been notified.");
      onDone();
    } catch {
      toast.error("Failed to send response. Please try again.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview toggle */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Write Response</p>
        <button
          onClick={() => setShowPreview(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? "Edit" : "Preview"}
        </button>
      </div>

      {/* AI Assist button */}
      {!showPreview && (
        <button
          onClick={handleAiAssist}
          disabled={aiLoading}
          className="w-full flex items-center justify-center gap-2 py-2 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-50/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          {aiLoading ? "Generating AI draft…" : "Ask AI for Help (pre-fill response)"}
        </button>
      )}

      {showPreview ? (
        <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-50/20 rounded-xl p-4 min-h-[120px]">
          <p className="text-xs font-semibold text-emerald-600 mb-2">Preview — Student will see:</p>
          <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
              {formatMarkdown(response)}
            </ReactMarkdown>
            {!response && <span className="text-muted-foreground italic">Nothing written yet…</span>}
          </div>
          {lectureRef && (
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-600 border border-blue-200 bg-blue-50 dark:bg-blue-50/20 rounded-lg px-3 py-2">
              <Link2 className="w-3.5 h-3.5 shrink-0" /> {lectureRef}
            </div>
          )}
          {imageUrl && (
            <div className="mt-3 border border-border rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Diagram" className="max-h-48 object-contain w-full" onError={() => {}} />
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Main textarea */}
          <textarea
            rows={5}
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Write a clear, step-by-step explanation for the student…"
            className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />

          {/* Lecture reference */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Link2 className="w-3.5 h-3.5" /> Lecture Reference (optional)
            </label>
            <input
              value={lectureRef}
              onChange={e => setLectureRef(e.target.value)}
              placeholder='e.g. "Lecture 3 at 12min 30sec"'
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Diagram: URL or upload */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ImageIcon className="w-3.5 h-3.5" /> Diagram / image (optional)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="Paste image URL, or use Upload"
                className="w-full min-w-0 flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <input
                ref={diagramFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                className="hidden"
                onChange={onDiagramFileSelected}
              />
              <button
                type="button"
                onClick={() => diagramFileRef.current?.click()}
                disabled={diagramUploading}
                className="inline-flex shrink-0 items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm font-medium bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {diagramUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {diagramUploading ? "Uploading…" : "Upload image"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              JPG, PNG, WebP, or GIF up to 10&nbsp;MB. Uploaded files are stored for your institute and the URL is filled in automatically.
            </p>
          </div>
        </>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={respondM.isPending || !response.trim() || diagramUploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {respondM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {respondM.isPending ? "Sending…" : "Send Response to Student"}
      </button>
    </div>
  );
}

// ─── Doubt Detail Panel ────────────────────────────────────────────────────────

function DoubtDetailPanel({ doubt, onRefresh, onDelete }: { doubt: Doubt; onRefresh: () => void; onDelete: () => void }) {
  const [aiQuality, setAiQuality] = useState<"correct" | "partial" | "wrong" | null>(null);
  const [showResponseEditor, setShowResponseEditor] = useState(false);
  const [viewMode, setViewMode] = useState<"brief" | "detailed">("detailed");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const markReviewedM = useMarkDoubtReviewed();
  const resolveWithAiM = useResolveDoubtWithAiAsTeacher();
  const deleteM = useDeleteDoubt();

  const mins = doubt.timeSinceAskedMinutes ?? doubt.minutesSinceAsked;
  const name = doubt.student?.fullName ?? doubt.studentName ?? "Student";
  const topic = doubt.topic?.name ?? doubt.topicName;
  const subject = doubt.topic?.chapter?.subject?.name ?? doubt.subjectName;
  const isResolved = doubt.status === "teacher_resolved";
  const isEscalated = doubt.status === "escalated";
  const hasAI = !!doubt.aiExplanation;

  const handleMarkReviewed = async () => {
    try {
      await markReviewedM.mutateAsync({ id: doubt.id, aiQualityRating: "correct" });
      toast.success("Marked as reviewed. Student notified.");
      onRefresh();
    } catch {
      toast.error("Failed to mark as reviewed.");
    }
  };

  const handleResolveWithAi = async () => {
    try {
      await resolveWithAiM.mutateAsync(doubt.id);
      toast.success("AI explanation generated and sent to the student.");
      onRefresh();
    } catch (e: unknown) {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast.error(msg || "Could not run AI resolution. Try again or write a manual response.");
    }
  };

  const handleDeleteConfirmed = () => {
    deleteM.mutate(doubt.id, {
      onSuccess: () => {
        toast.success("Doubt deleted.");
        setConfirmDelete(false);
        onDelete();
      },
      onError: () => {
        toast.error("Failed to delete doubt.");
        setConfirmDelete(false);
      },
    });
  };

  const needsResponse = isEscalated || (aiQuality === "partial") || (aiQuality === "wrong");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header: student + meta */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <StatusBadge status={doubt.status} />
              {mins != null && (
                <span className={cn("text-xs flex items-center gap-1.5", urgencyColor(mins))}>
                  <Clock className="w-3.5 h-3.5" /> {timeAgo(mins)}
                  {mins > 120 && <span className="text-red-500 font-medium">· Waiting long</span>}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{name}</p>
                {(topic || subject) && (
                  <p className="text-xs text-muted-foreground">
                    {[subject, topic].filter(Boolean).join(" › ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {doubt.source && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {doubt.source}
              </span>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete doubt"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirmation Dialog ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Delete this doubt?</p>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              The doubt from <span className="font-medium text-foreground">{name}</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleteM.isPending}
                className="flex-1 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleteM.isPending}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {deleteM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteM.isPending ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 py-5 space-y-5">

        {/* ── Student's Question ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Student's Question</p>
          <div className="border border-border rounded-xl p-4 bg-muted/20">
            {doubt.questionText && (
              <div className="text-sm text-foreground prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {formatMarkdown(doubt.questionText)}
                </ReactMarkdown>
              </div>
            )}
            {doubt.ocrExtractedText && doubt.ocrExtractedText !== doubt.questionText && (
              <p className="text-sm text-muted-foreground mt-2 italic">(Extracted from image: {doubt.ocrExtractedText})</p>
            )}
            {doubt.questionImageUrl && (
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <img
                  src={doubt.questionImageUrl}
                  alt="Student's uploaded question"
                  className="max-h-64 object-contain w-full bg-white"
                />
              </div>
            )}
            {!doubt.questionText && !doubt.questionImageUrl && (
              <p className="text-sm text-muted-foreground italic">No question text provided.</p>
            )}
          </div>
        </section>

        {/* ── What AI Tried ── */}
        {hasAI && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> What AI Tried
              </p>
              
              {/* Brief / Detailed toggle — only when structured data available */}
              {parseAiAnswer(doubt.aiExplanation) && (
                <div className="flex gap-0.5 bg-blue-100/70 dark:bg-blue-900/30 p-0.5 rounded-lg shrink-0">
                  <button
                    onClick={() => setViewMode("brief")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all",
                      viewMode === "brief" ? "bg-white dark:bg-blue-800 text-blue-700 dark:text-white shadow-sm" : "text-blue-400 hover:text-blue-600"
                    )}
                  >
                    Brief
                  </button>
                  <button
                    onClick={() => setViewMode("detailed")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold transition-all",
                      viewMode === "detailed" ? "bg-white dark:bg-blue-800 text-blue-700 dark:text-white shadow-sm" : "text-blue-400 hover:text-blue-600"
                    )}
                  >
                    Detailed
                  </button>
                </div>
              )}
            </div>

            <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-50/20 rounded-xl p-4 space-y-3">
              {(() => {
                const parsed = parseAiAnswer(doubt.aiExplanation);
                if (!parsed) {
                  return (
                    <div className="text-sm text-foreground prose prose-sm prose-blue dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMarkdown(doubt.aiExplanation)}
                      </ReactMarkdown>
                    </div>
                  );
                }

                return viewMode === "brief" ? (
                  <div className="text-sm text-foreground prose prose-sm prose-blue dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {formatMarkdown(parsed.brief?.answer || parsed.detailed?.final_answer || parsed.detailed?.solution || doubt.aiExplanation)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-foreground prose prose-sm prose-blue dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {formatMarkdown(parsed.detailed?.solution || parsed.detailed?.explanation || parsed.brief?.answer || doubt.aiExplanation)}
                      </ReactMarkdown>
                    </div>
                    {parsed.detailed?.verification && (
                      <div className="p-3 bg-blue-100/40 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">✓ Verification</p>
                        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{parsed.detailed.verification}</p>
                      </div>
                    )}
                    {parsed.detailed?.key_concept && (
                      <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg">
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">💡 Key Concept</p>
                        <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">{parsed.detailed.key_concept}</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {doubt.aiConceptLinks && doubt.aiConceptLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doubt.aiConceptLinks.map((c) => (
                    <span key={c} className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              )}
              {/* Student's rating of AI */}
              {doubt.isHelpful === false && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 border-t border-blue-200 dark:border-blue-800 pt-2 mt-2">
                  <ThumbsDown className="w-3.5 h-3.5" /> Student said this wasn't helpful
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Teacher Action Zone ── */}
        {!isResolved && (
          <section className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Action</p>

            {/* Case 1: AI resolved → teacher rates quality */}
            {doubt.status === "ai_resolved" && hasAI && !showResponseEditor && (
              <div className="space-y-3">
                <p className="text-sm font-medium">How accurate is the AI answer?</p>
                <div className="space-y-2">
                  {AI_QUALITY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = aiQuality === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setAiQuality(opt.value as any)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all",
                          isSelected ? opt.color : "border-border hover:border-primary/30 hover:bg-muted/30"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", isSelected ? "" : "text-muted-foreground")} />
                        <div>
                          <p className={cn("text-sm font-semibold", isSelected ? "" : "text-foreground")}>{opt.label}</p>
                          <p className={cn("text-xs mt-0.5", isSelected ? "opacity-80" : "text-muted-foreground")}>{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Action buttons based on selection */}
                {aiQuality === "correct" && (
                  <button
                    onClick={handleMarkReviewed}
                    disabled={markReviewedM.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                  >
                    {markReviewedM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                    {markReviewedM.isPending ? "Marking…" : "Mark as Reviewed — Student already has the answer"}
                  </button>
                )}

                {(aiQuality === "partial" || aiQuality === "wrong") && (
                  <button
                    onClick={() => setShowResponseEditor(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Write Full Response
                  </button>
                )}
              </div>
            )}

            {/* Case 2: Escalated → direct response editor */}
            {(isEscalated || showResponseEditor) && (
              <div className="space-y-3">
                {isEscalated && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {hasAI
                      ? "Student found AI answer unhelpful — needs your explanation."
                      : "Student asked you directly — no AI was used."}
                  </div>
                )}

                {isEscalated && !showResponseEditor && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/30 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">Resolve with AI</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Run the full AI pipeline on this doubt. The student gets the same experience as an automatic AI answer, and you can still verify or follow up afterward.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResolveWithAi}
                      disabled={resolveWithAiM.isPending}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 border-blue-400 dark:border-blue-600 bg-white dark:bg-background text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-950/50 disabled:opacity-50 transition-colors"
                    >
                      {resolveWithAiM.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      {resolveWithAiM.isPending ? "Generating AI answer…" : "Resolve with AI for student"}
                    </button>
                    <p className="text-xs text-center text-muted-foreground">— or write your own answer below —</p>
                  </div>
                )}

                <ResponseEditor
                  doubtId={doubt.id}
                  aiQualityRating={aiQuality ?? undefined}
                  questionText={doubt.questionText ?? undefined}
                  onDone={onRefresh}
                />
              </div>
            )}

            {/* Case 3: AI resolved but no AI text → direct response */}
            {doubt.status === "ai_resolved" && !hasAI && !showResponseEditor && (
              <button
                onClick={() => setShowResponseEditor(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" /> Write Response
              </button>
            )}
          </section>
        )}

        {/* ── Resolved: Teacher's Response ── */}
        {isResolved && (
          <section className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolution
            </p>

            {/* Reviewed without response */}
            {doubt.teacherReviewedAt && !doubt.teacherResponse && (
              <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-50/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCheck className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">AI Answer Verified Correct</p>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">You confirmed the AI explanation was completely correct. Student already has the answer.</p>
              </div>
            )}

            {/* Written response */}
            {doubt.teacherResponse && (
              <div className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-50/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Your Response (sent to student)</p>
                </div>
                <div className="text-sm text-foreground prose prose-sm prose-emerald dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {formatMarkdown(doubt.teacherResponse)}
                  </ReactMarkdown>
                </div>
                {doubt.teacherLectureRef && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-50/20 rounded-lg px-3 py-2">
                    <Link2 className="w-3.5 h-3.5 shrink-0" /> {doubt.teacherLectureRef}
                  </div>
                )}
                {doubt.teacherResponseImageUrl && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <img src={doubt.teacherResponseImageUrl} alt="Diagram" className="max-h-48 object-contain w-full" />
                  </div>
                )}
              </div>
            )}

            {/* Student's rating of teacher response */}
            {doubt.isTeacherResponseHelpful != null && (
              <div className={cn(
                "flex items-center gap-2 text-xs rounded-xl px-3 py-2 border",
                doubt.isTeacherResponseHelpful
                  ? "bg-emerald-50 dark:bg-emerald-50/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
              )}>
                {doubt.isTeacherResponseHelpful
                  ? <><ThumbsUp className="w-3.5 h-3.5" /> Student rated this helpful — Doubt fully closed</>
                  : <><ThumbsDown className="w-3.5 h-3.5" /> Student said not helpful — Doubt re-opened</>}
              </div>
            )}

            {/* Resolved timestamp */}
            {doubt.resolvedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Resolved {new Date(doubt.resolvedAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "queue" | "all";
type FilterStatus = "" | "ai_resolved" | "escalated" | "teacher_resolved";

export default function TeacherDoubtsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("queue");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("");
  const [filterBatchId, setFilterBatchId] = useState<string>("");

  const { data: batches = [] } = useMyBatches();
  const { data: queue = [], isLoading: queueLoading, refetch: refetchQueue } = useDoubtQueue(filterBatchId || undefined);
  const { data: allDoubts = [], isLoading: allLoading, refetch: refetchAll } = useAllDoubts(filterStatus || undefined, filterBatchId || undefined);

  const doubts = tab === "queue" ? queue : allDoubts;
  const isLoading = tab === "queue" ? queueLoading : allLoading;

  const filtered = useMemo(() => {
    if (!search.trim()) return doubts;
    const q = search.toLowerCase();
    return doubts.filter(d =>
      d.questionText?.toLowerCase().includes(q) ||
      (d.student?.fullName ?? d.studentName ?? "").toLowerCase().includes(q) ||
      (d.topic?.name ?? d.topicName ?? "").toLowerCase().includes(q)
    );
  }, [doubts, search]);

  const selectedDoubt = filtered.find(d => d.id === selectedId) ?? null;

  const handleRefresh = () => {
    refetchQueue();
    refetchAll();
    if (selectedId) qc.invalidateQueries({ queryKey: teacherKeys.doubt(selectedId) });
  };

  // Stats
  const pendingCount = queue.length;
  const resolvedToday = allDoubts.filter(d =>
    d.resolvedAt && new Date(d.resolvedAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Page header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Answer Doubts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} doubt${pendingCount > 1 ? "s" : ""} waiting for your response`
                : "All caught up! No pending doubts."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-center border border-border rounded-xl px-4 py-2">
                <p className="text-lg font-bold text-red-500">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center border border-border rounded-xl px-4 py-2">
                <p className="text-lg font-bold text-emerald-600">{resolvedToday}</p>
                <p className="text-xs text-muted-foreground">Resolved Today</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2.5 border border-border rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Body: split panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT: Doubt List ── */}
        <div className={cn(
          "flex flex-col border-r border-border bg-background",
          selectedDoubt ? "hidden md:flex w-80 xl:w-96 shrink-0" : "flex flex-1"
        )}>
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => { setTab("queue"); setSelectedId(null); }}
              className={cn("flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                tab === "queue" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Inbox className="w-4 h-4" />
              Escalated Queue
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab("all"); setSelectedId(null); }}
              className={cn("flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                tab === "all" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <MessageSquare className="w-4 h-4" /> All Doubts
            </button>
          </div>

          {/* Search + filter */}
          <div className="p-3 border-b border-border space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by question or student…"
                className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Course filter */}
            {batches.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <select
                  value={filterBatchId}
                  onChange={e => { setFilterBatchId(e.target.value); setSelectedId(null); }}
                  className="flex-1 py-1.5 px-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">All Courses</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {tab === "all" && (
              <div className="flex gap-1 flex-wrap">
                {([["", "All"], ["escalated", "Needs Answer"], ["ai_resolved", "AI Resolved"], ["teacher_resolved", "Resolved"]] as [FilterStatus, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterStatus(val)}
                    className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                      filterStatus === val
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 px-4 text-muted-foreground">
                {tab === "queue"
                  ? <><CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-500 opacity-60" /><p className="font-semibold">All caught up!</p><p className="text-sm mt-1">No escalated doubts waiting.</p></>
                  : <><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-semibold">No doubts found</p><p className="text-sm mt-1">{search ? "Try clearing the search." : "Student doubts will appear here."}</p></>
                }
              </div>
            ) : (
              <div>
                {filtered.map(d => (
                  <DoubtListItem
                    key={d.id}
                    doubt={d}
                    selected={selectedId === d.id}
                    onClick={() => setSelectedId(d.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Detail Panel ── */}
        {selectedDoubt ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Back button (mobile) */}
            <div className="md:hidden px-4 py-2 border-b border-border shrink-0">
              <button
                onClick={() => setSelectedId(null)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to list
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DoubtDetailPanel
                key={selectedDoubt.id}
                doubt={selectedDoubt}
                onRefresh={handleRefresh}
                onDelete={() => { setSelectedId(null); handleRefresh(); }}
              />
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground flex-col gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <BookOpen className="w-8 h-8 opacity-40" />
            </div>
            <p className="font-semibold">Select a doubt to review</p>
            <p className="text-sm">Click any doubt from the list to see details and respond.</p>
          </div>
        )}
      </div>
    </div>
  );
}
