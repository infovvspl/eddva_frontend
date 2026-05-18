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
  useDeleteDoubt,
  useMyBatches,
  teacherKeys,
} from "@/hooks/use-teacher";
import { type Doubt } from "@/lib/api/teacher";
import {
  MessageSquare, Clock, AlertCircle, CheckCircle2, Send,
  Loader2, Search, RefreshCw, ChevronRight, Image as ImageIcon,
  BookOpen, Sparkles, ThumbsUp, ThumbsDown, Link2, Eye, EyeOff,
<<<<<<< HEAD
  CheckCheck, XCircle, Users, Inbox, Filter, Bot, Upload, Trash2, ArrowUpDown,
=======
  CheckCheck, XCircle, Users, Inbox, Filter, Bot, Upload, Trash2,
  Star, RotateCcw, Mic, PenTool, Bold, Italic, List, ListOrdered,
  Superscript, Code, Paperclip, SmilePlus, AtSign, MoreVertical,
  Video, UserPlus, ArrowUpRight, FileText, Layers, Globe, Lightbulb,
  TrendingUp, ChevronDown, Bookmark,
>>>>>>> 75d05cb45304297f8e61008820cb17d5ea571823
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

const PRIORITY_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  high:   { label: "HIGH PRIORITY",   bg: "bg-red-50 dark:bg-red-950/30",    text: "text-red-600 dark:text-red-400",       dot: "bg-red-500" },
  medium: { label: "MEDIUM PRIORITY", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600 dark:text-amber-400",   dot: "bg-amber-500" },
  low:    { label: "LOW PRIORITY",    bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
};

function getPriority(mins?: number): "high" | "medium" | "low" {
  if (!mins) return "low";
  if (mins > 120) return "high";
  if (mins > 60) return "medium";
  return "low";
}

function waitingBadgeColor(mins?: number): string {
  if (!mins) return "bg-slate-100 text-slate-500";
  if (mins > 120) return "bg-red-50 text-red-600";
  if (mins > 60) return "bg-amber-50 text-amber-600";
  return "bg-emerald-50 text-emerald-600";
}

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
  const subject = doubt.topic?.chapter?.subject?.name ?? doubt.subjectName;
  const priority = getPriority(mins);
  const pm = PRIORITY_META[priority];
  const imgCount = doubt.questionImageUrl ? 1 : 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3.5 border-b border-border/60 transition-all group",
        selected
          ? "bg-primary/5 border-l-[3px] border-l-primary shadow-sm"
          : "hover:bg-muted/30 border-l-[3px] border-l-transparent"
      )}
    >
<<<<<<< HEAD
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={doubt.status} />
            {doubt.isTeacherResponseHelpful === false && doubt.status === "escalated" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                ↩ Reopened
              </span>
            )}
            {doubt.isHelpful === false && doubt.status === "escalated" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                ✦ AI Escalated
              </span>
            )}
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
=======
      {/* Priority + time row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", pm.bg, pm.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", pm.dot)} />
            {pm.label}
          </span>
          {mins != null && (
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(mins)}
            </span>
          )}
>>>>>>> 75d05cb45304297f8e61008820cb17d5ea571823
        </div>
        {imgCount > 0 && (
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ImageIcon className="w-3 h-3" /> {imgCount}
          </span>
        )}
      </div>

      {/* Question title */}
      <p className="text-[13px] font-semibold text-foreground line-clamp-2 mb-1.5 leading-snug">
        {doubt.questionText || doubt.ocrExtractedText || "Image question"}
      </p>

      {/* Student + subject */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{name}</span>
        </div>
        {mins != null && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", waitingBadgeColor(mins))}>
            ⏳ Waiting {timeAgo(mins).replace(" ago", "")}
          </span>
        )}
      </div>
      {(subject || topic) && (
        <p className="text-[11px] text-muted-foreground mt-1">
          {[subject, topic].filter(Boolean).join(" · ")}
        </p>
      )}
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

  const [answerTab, setAnswerTab] = useState<"write" | "voice" | "whiteboard">("write");

  return (
    <div className="space-y-3">
      {/* Answer mode tabs */}
      <div className="flex items-center border-b border-border">
        {([
          { key: "write" as const, icon: PenTool, label: "Write Answer" },
          { key: "voice" as const, icon: Mic, label: "Voice Answer" },
          { key: "whiteboard" as const, icon: BookOpen, label: "Whiteboard" },
        ]).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setAnswerTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors border-b-2",
              answerTab === key
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
        {/* AI magic button */}
        <button
          onClick={handleAiAssist}
          disabled={aiLoading}
          className="ml-auto flex items-center gap-1.5 text-xs text-blue-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
        </button>
      </div>

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
          {/* Rich text toolbar */}
          <div className="flex items-center gap-0.5 px-1 py-1 border border-border rounded-t-xl bg-muted/30 border-b-0">
            {[Bold, Italic, List, ListOrdered, Superscript, Code, Link2].map((Icon, i) => (
              <button key={i} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Main textarea */}
          <textarea
            rows={4}
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border border-border rounded-b-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none -mt-3"
          />

          {/* Hidden file input */}
          <input
            ref={diagramFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            className="hidden"
            onChange={onDiagramFileSelected}
          />
        </>
      )}

      {/* Bottom bar: attachments + send */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => diagramFileRef.current?.click()}
            disabled={diagramUploading}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50"
            title="Attach image"
          >
            {diagramUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
          </button>
          <button
            onClick={() => diagramFileRef.current?.click()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Upload image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Add emoji">
            <SmilePlus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPreview(v => !v)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title={showPreview ? "Edit" : "Preview"}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleSend}
            disabled={respondM.isPending || !response.trim() || diagramUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-l-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {respondM.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {respondM.isPending ? "Sending…" : "Send Answer"}
          </button>
          <button className="px-2 py-2.5 bg-primary text-primary-foreground rounded-r-xl border-l border-primary-foreground/20 hover:bg-primary/90 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
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
  const deleteM = useDeleteDoubt();

  const mins = doubt.timeSinceAskedMinutes ?? doubt.minutesSinceAsked;
  const name = doubt.student?.fullName ?? doubt.studentName ?? "Student";
  const topic = doubt.topic?.name ?? doubt.topicName;
  const subject = doubt.topic?.chapter?.subject?.name ?? doubt.subjectName;
  const isResolved = doubt.status === "teacher_resolved";
  const isEscalated = doubt.status === "escalated";
  const hasAI = !!doubt.aiExplanation;
  const priority = getPriority(mins);
  const pm = PRIORITY_META[priority];
  const shortId = doubt.id?.slice(0, 8)?.toUpperCase() ?? "";

  const handleMarkReviewed = async () => {
    try {
      await markReviewedM.mutateAsync({ id: doubt.id, aiQualityRating: "correct" });
      toast.success("Marked as reviewed. Student notified.");
      onRefresh();
    } catch {
      toast.error("Failed to mark as reviewed.");
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
      {/* Header: priority + ID + actions */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
        {/* Top row: priority badge, time, doubt ID, actions */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded", pm.bg, pm.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", pm.dot)} />
              {pm.label}
            </span>
            {mins != null && (
              <span className="text-xs text-muted-foreground">{timeAgo(mins)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">Doubt ID: #DQ{shortId}</span>
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
              <Star className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete doubt"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Question title */}
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-2 sm:mb-3 leading-snug">
          {doubt.questionText || doubt.ocrExtractedText || "Image question"}
        </h2>

        {/* Student info row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/10">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">
                {[subject, topic].filter(Boolean).join(" · ") || "Student"}
              </p>
            </div>
          </div>
          <button className="text-xs text-primary font-medium hover:underline px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
            View Profile
          </button>
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

      <div className="flex-1 px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">

        {/* ── Question ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Question</p>
          <div className="text-sm text-foreground leading-relaxed">
            {doubt.questionText ? (
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:mb-2 prose-ul:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {formatMarkdown(doubt.questionText)}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No question text provided.</p>
            )}
            {doubt.ocrExtractedText && doubt.ocrExtractedText !== doubt.questionText && (
              <p className="text-muted-foreground mt-1 italic text-xs">(Extracted from image: {doubt.ocrExtractedText})</p>
            )}
          </div>
        </section>

        {/* ── Attachments ── */}
        {doubt.questionImageUrl && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Attachments (1)</p>
            <div className="flex gap-2">
              <div className="w-28 h-20 rounded-lg border border-border overflow-hidden bg-white">
                <img
                  src={doubt.questionImageUrl}
                  alt="Attachment"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        )}

        {/* ── AI Suggested Answer ── */}
        {hasAI && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-bold text-foreground">AI Suggested Answer</p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20">
                <RotateCcw className="w-3.5 h-3.5" /> Regenerate
              </button>
            </div>

            <div className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-50/10 rounded-xl p-4 space-y-3">
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
                        {formatMarkdown(parsed.detailed?.solution || parsed.brief?.answer || doubt.aiExplanation)}
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

              {/* Feedback + action row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-800/40">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Was this helpful?</span>
                  <button className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <ThumbsUp className="w-3.5 h-3.5 text-muted-foreground hover:text-blue-600" />
                  </button>
                  <button className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <ThumbsDown className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["Explain More", "Simplify", "Create Diagram"].map(action => (
                    <button key={action} className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> <span className="hidden sm:inline">{action}</span><span className="sm:hidden">{action.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Student's rating of AI */}
              {doubt.isHelpful === false && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 border-t border-blue-200 dark:border-blue-800 pt-2 mt-1">
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
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const { data: batches = [] } = useMyBatches();
  const { data: queue = [], isLoading: queueLoading, refetch: refetchQueue } = useDoubtQueue(filterBatchId || undefined);
  const { data: allDoubts = [], isLoading: allLoading, refetch: refetchAll } = useAllDoubts(filterStatus || undefined, filterBatchId || undefined);

  const doubts = tab === "queue" ? queue : allDoubts;
  const isLoading = tab === "queue" ? queueLoading : allLoading;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? doubts.filter(d =>
          d.questionText?.toLowerCase().includes(q) ||
          (d.student?.fullName ?? d.studentName ?? "").toLowerCase().includes(q) ||
          (d.topic?.name ?? d.topicName ?? "").toLowerCase().includes(q)
        )
      : [...doubts];
    const isPriority = (d: typeof result[0]) =>
      d.status === "escalated" && (
        d.isTeacherResponseHelpful === false || // reopened after teacher answer
        d.isHelpful === false                   // escalated from AI-resolved
      );
    result.sort((a, b) => {
      const ra = isPriority(a) ? 1 : 0;
      const rb = isPriority(b) ? 1 : 0;
      if (rb !== ra) return rb - ra; // priority doubts always first
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
    return result;
  }, [doubts, search, sortOrder]);

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

  // Derived stats
  const escalatedCount = allDoubts.filter(d => d.status === "escalated").length;
  const avgResponseMins = useMemo(() => {
    const resolved = allDoubts.filter(d => d.resolvedAt && d.createdAt);
    if (!resolved.length) return 0;
    const total = resolved.reduce((sum, d) => {
      const diff = new Date(d.resolvedAt!).getTime() - new Date(d.createdAt).getTime();
      return sum + diff / 60000;
    }, 0);
    return Math.round(total / resolved.length);
  }, [allDoubts]);

  // Student insights for selected doubt
  const selectedName = selectedDoubt ? (selectedDoubt.student?.fullName ?? selectedDoubt.studentName ?? "Student") : "";
  const selectedSubject = selectedDoubt ? (selectedDoubt.topic?.chapter?.subject?.name ?? selectedDoubt.subjectName) : "";
  const selectedTopic = selectedDoubt ? (selectedDoubt.topic?.name ?? selectedDoubt.topicName) : "";

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Top Stats Bar ── */}
      <div className="px-3 sm:px-6 py-3 border-b border-border shrink-0 bg-background">
        <div className="grid grid-cols-2 lg:flex lg:flex-row items-center gap-2 lg:gap-4">
          {/* Pending Doubts */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-border bg-background">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Pending Doubts</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{pendingCount}</p>
                <span className="text-[10px] text-orange-600 font-medium hidden sm:inline">↑ queue</span>
              </div>
            </div>
          </div>
          {/* Escalated */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-border bg-background">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Escalated</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{escalatedCount}</p>
                <span className="text-[10px] text-red-600 font-medium hidden sm:inline">↑ urgent</span>
              </div>
            </div>
          </div>
          {/* Avg Response Time */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-border bg-background">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Avg. Response</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground">
                  {avgResponseMins >= 60 ? `${Math.floor(avgResponseMins / 60)}h ${avgResponseMins % 60}m` : `${avgResponseMins}m`}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">↓ fast</span>
              </div>
            </div>
          </div>
          {/* Resolved Today */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-xl border border-border bg-background">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">Resolved Today</p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg sm:text-2xl font-bold text-foreground">{resolvedToday}</p>
                <span className="text-[10px] text-emerald-600 font-medium hidden sm:inline">✓ today</span>
              </div>
            </div>
          </div>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="lg:ml-auto col-span-2 lg:col-span-1 flex items-center justify-center gap-2 p-2.5 border border-border rounded-xl hover:bg-secondary transition-colors text-muted-foreground w-full lg:w-auto"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs lg:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Page Title ── */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-foreground">Doubt Queue</h1>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block mt-0.5">
            Respond to student doubts and help them learn better.
          </p>
        </div>
      </div>

      {/* ── Body: 3-column layout ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── COL 1: Doubt List ── */}
        <div className={cn(
          "flex flex-col border-r border-border bg-background transition-all duration-200",
          selectedDoubt
            ? "hidden md:flex md:w-[300px] lg:w-[340px] xl:w-[380px] shrink-0"
            : "flex w-full"
        )}>
          {/* Search */}
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search doubts, students or topics…"
                className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Filter row */}
          <div className="px-3 py-2 border-b border-border shrink-0 flex items-center gap-2 flex-wrap">
            <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted/50 transition-colors">
              <Filter className="w-3 h-3" /> Filter
            </button>
            {batches.length > 0 && (
              <select
                value={filterBatchId}
                onChange={e => { setFilterBatchId(e.target.value); setSelectedId(null); }}
                className="py-1 px-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
              >
                <option value="">All Subjects</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            <select className="py-1 px-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none">
              <option>All Priorities</option>
              <option>High Priority</option>
              <option>Medium Priority</option>
              <option>Low Priority</option>
            </select>
            {tab === "all" && (
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as FilterStatus)}
                className="py-1 px-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none"
              >
                <option value="">All Status</option>
                <option value="escalated">Needs Answer</option>
                <option value="ai_resolved">AI Resolved</option>
                <option value="teacher_resolved">Resolved</option>
              </select>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => { setTab("queue"); setSelectedId(null); }}
              className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                tab === "queue" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Inbox className="w-3.5 h-3.5" />
              Escalated Queue
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.1rem] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setTab("all"); setSelectedId(null); }}
              className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                tab === "all" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <MessageSquare className="w-3.5 h-3.5" /> All Doubts
            </button>
          </div>

<<<<<<< HEAD
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

            {/* Course filter + Sort */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {batches.length > 0 && (
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
              )}
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as "newest" | "oldest")}
                className="flex-1 py-1.5 px-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

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

=======
>>>>>>> 75d05cb45304297f8e61008820cb17d5ea571823
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
                {/* Pagination footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Showing 1 to {Math.min(filtered.length, 6)} of {filtered.length} doubts</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} className={cn("w-6 h-6 rounded text-xs font-medium", n === 1 ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>{n}</button>
                    ))}
                    <button className="w-6 h-6 rounded text-xs hover:bg-muted">›</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── COL 2: Detail Panel ── */}
        {selectedDoubt ? (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Detail content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Back button (mobile) */}
              <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-muted/20">
                <button
                  onClick={() => setSelectedId(null)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back to doubts
                </button>
                <span className="text-muted-foreground text-xs ml-auto">
                  {filtered.findIndex(d => d.id === selectedId) + 1} / {filtered.length}
                </span>
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

            {/* ── COL 3: Right Sidebar ── */}
            <div className="hidden xl:flex flex-col w-[280px] border-l border-border bg-background overflow-y-auto shrink-0">
              {/* Student Insights */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Student Insights</h3>
                  <button className="text-[11px] text-primary font-medium hover:underline">View Full Profile</button>
                </div>
                {/* Performance */}
                <div className="flex items-center justify-between mb-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-xs text-muted-foreground font-medium">Overall Performance</span>
                  <span className="text-sm font-bold text-primary">72%</span>
                </div>
                {/* Strong Topics */}
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strong Topics</p>
                  <p className="text-xs text-foreground">Thermodynamics, Equilibrium</p>
                </div>
                {/* Weak Topics */}
                <div className="mb-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Weak Topics</p>
                  <p className="text-xs text-foreground">Solutions, Colligative Properties</p>
                </div>
                {/* Mini stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm font-bold text-foreground">18</p>
                    <p className="text-[10px] text-muted-foreground">Doubts Asked</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm font-bold text-foreground">3</p>
                    <p className="text-[10px] text-muted-foreground">This Week</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm font-bold text-emerald-600">15</p>
                    <p className="text-[10px] text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-1">
                  {[
                    { icon: CheckCircle2, label: "Mark as Resolved", color: "text-emerald-600" },
                    { icon: Video, label: "Convert to Live Session", color: "text-blue-600" },
                    { icon: UserPlus, label: "Assign to TA", color: "text-purple-600" },
                    { icon: ArrowUpRight, label: "Escalate Doubt", color: "text-orange-600" },
                    { icon: Bookmark, label: "Add to Notes", color: "text-slate-600" },
                  ].map(({ icon: Icon, label, color }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
                    >
                      <Icon className={cn("w-4 h-4", color)} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Assistant */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold text-foreground">AI Assistant</h3>
                  <span className="text-[9px] font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white px-1.5 py-0.5 rounded">BETA</span>
                </div>
                <div className="space-y-1">
                  {[
                    { icon: Sparkles, label: "Generate Explanation" },
                    { icon: Globe, label: "Convert to Hindi" },
                    { icon: FileText, label: "Create Practice Question" },
                    { icon: Layers, label: "Similar Doubts" },
                    { icon: Lightbulb, label: "Generate Diagram" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-blue-600" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
