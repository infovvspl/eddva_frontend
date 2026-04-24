import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import {
  Video, Plus, Loader2, X, Trash2, CheckCircle, Clock, Radio,
  Upload, Youtube, Image as ImageIcon, FileText, Sparkles,
  Eye, Edit3, Send, Calendar, Link2, Users, BarChart2,
  PlayCircle, StopCircle, Zap, BookOpen, ChevronRight,
  AlarmClock, ExternalLink, Mic, Brain, ListChecks,
  HelpCircle, RefreshCw, Trophy, TrendingUp, XCircle, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useIsCompactLayout } from "@/hooks/use-mobile";
import {
  useMyLectures, useCreateLecture, useDeleteLecture,
  useUpdateLecture, useLectureStats, useMyBatches,
} from "@/hooks/use-teacher";
import { useSubjects, useChapters, useTopics } from "@/hooks/use-admin";
import { useAuthStore } from "@/lib/auth-store";
import { getBatchSubjectTeachers } from "@/lib/api/teacher";
import {
  generateLectureNotes, updateLecture as updateLectureApi,
  generateQuizForLecture, saveQuizCheckpoints, getQuizCheckpoints,
  getWatchAnalytics, retranscribeLecture,
  type QuizCheckpoint, type WatchAnalytics,
} from "@/lib/api/teacher";
import { apiClient } from "@/lib/api/client";
import { getApiOrigin } from "@/lib/api-config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Lecture } from "@/lib/api/teacher";
import { LectureVideoUpload } from "@/components/upload/LectureVideoUpload";
import {
  isYouTubeUrl,
  isValidYouTubeLectureUrl,
  YOUTUBE_LECTURE_CAPTIONS_HINT,
} from "@/lib/lecture-source";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  published:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  draft:      "bg-amber-500/10 text-amber-600 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  live:       "bg-red-500/10 text-red-600 border-red-500/20",
  scheduled:  "bg-violet-500/10 text-violet-600 border-violet-500/20",
  ended:      "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

const statusLabel: Record<string, string> = {
  published: "Published", draft: "Review AI Notes", processing: "AI Processing…",
  live: "Live Now", scheduled: "Scheduled", ended: "Ended",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Processing Animation ─────────────────────────────────────────────────────

const AI_STEPS = [
  { icon: Mic,        label: "Transcribing audio" },
  { icon: Brain,      label: "Analysing content" },
  { icon: FileText,   label: "Generating lecture notes" },
  { icon: ListChecks, label: "Extracting key concepts" },
];

function AiProcessingCard({ lecture, activeStep }: { lecture: Lecture; activeStep?: number }) {
  // If activeStep is not explicitly provided (e.g. from artificial delay), derive from real status
  const currentStep = activeStep !== undefined ? activeStep : (
    lecture.status === "draft" || lecture.status === "published" ? 4 :
    lecture.status === "processing" && lecture.transcriptStatus === "done" ? 2 :
    lecture.transcriptStatus === "processing" ? 0 : 1
  );

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">AI is processing "{lecture.title}"</p>
          <p className="text-xs text-muted-foreground">No action needed — we'll notify you when ready</p>
        </div>
      </div>
      <div className="space-y-2">
        {AI_STEPS.map((s, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          return (
            <div key={i} className="flex items-center gap-2.5">
              {done
                ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                : current
                ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                : <div className="w-4 h-4 rounded-full border border-muted-foreground/30 shrink-0" />}
              <span className={cn("text-xs",
                done ? "text-muted-foreground line-through" :
                current ? "text-foreground font-medium" :
                "text-muted-foreground/50")}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Indeterminate progress bar */}
      <div className="w-full h-1 bg-blue-500/10 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"
          style={{ width: `${Math.round(((activeStep + 1) / AI_STEPS.length) * 100)}%`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ─── Markdown Renderer (Preview) ─────────────────────────────────────────────

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose-notes">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold text-foreground mt-5 mb-2 flex items-center gap-2"><span className="w-1 h-4 rounded-full bg-primary inline-block shrink-0"/>{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mt-4 mb-1.5">{children}</h3>,
        h4: ({ children }) => <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">{children}</h4>,
        p: ({ children }) => <p className="text-sm text-foreground leading-7 mb-3">{children}</p>,
        ul: ({ children }) => <ul className="my-2 ml-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 ml-4 space-y-1 list-decimal">{children}</ol>,
        li: ({ children }) => <li className="text-sm text-foreground leading-6 list-disc marker:text-primary">{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/50 bg-primary/5 rounded-r-lg pl-4 pr-3 py-2 my-3 text-sm italic text-foreground">{children}</blockquote>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
        code: ({ children, className }) => className?.includes("language-")
          ? <code className="block bg-secondary rounded-lg px-4 py-3 text-xs font-mono my-3 overflow-x-auto whitespace-pre">{children}</code>
          : <code className="bg-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="my-4 border-border" />,
        table: ({ children }) => <div className="overflow-x-auto my-3"><table className="w-full text-sm border-collapse">{children}</table></div>,
        th: ({ children }) => <th className="bg-secondary text-left px-3 py-2 text-xs font-semibold border border-border">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 text-sm border border-border">{children}</td>,
      }}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── WYSIWYG Toolbar Button ────────────────────────────────────────────────────

function ToolBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn(
        "h-7 min-w-[28px] px-1.5 rounded flex items-center justify-center text-xs transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}>
      {children}
    </button>
  );
}

// ─── WYSIWYG Editor ──────────────────────────────────────────────────────────

function WysiwygEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing or editing lecture notes here…" }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "outline-none min-h-full px-8 py-6 text-sm leading-7 text-foreground",
      },
    },
  });

  if (!editor) return null;

  const btn = (action: () => void, active: boolean, title: string, label: React.ReactNode) => (
    <ToolBtn onClick={action} active={active} title={title}>{label}</ToolBtn>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-secondary/40 shrink-0">
        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().setParagraph().run(), editor.isActive("paragraph"), "Paragraph", <span className="font-medium">P</span>)}
          {([1,2,3] as const).map(l => btn(
            () => editor.chain().focus().toggleHeading({ level: l }).run(),
            editor.isActive("heading", { level: l }),
            `Heading ${l}`,
            <span className="font-bold text-[11px]">H{l}</span>
          ))}
        </div>
        {/* Text formatting */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().toggleBold().run(), editor.isActive("bold"), "Bold", <span className="font-bold">B</span>)}
          {btn(() => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"), "Italic", <span className="italic">I</span>)}
          {btn(() => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"), "Underline", <span className="underline">U</span>)}
          {btn(() => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"), "Strikethrough", <span className="line-through">S</span>)}
          {btn(() => editor.chain().focus().toggleHighlight().run(), editor.isActive("highlight"), "Highlight", <span className="bg-yellow-300 text-black px-0.5 rounded text-[10px]">H</span>)}
        </div>
        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"), "Bullet List",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>)}
          {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Numbered List",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M10 6h11M10 12h11M10 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>)}
          {btn(() => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"), "Blockquote",
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>)}
          {btn(() => editor.chain().focus().toggleCode().run(), editor.isActive("code"), "Inline Code",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>)}
        </div>
        {/* Text align */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r border-border">
          {btn(() => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }), "Align Left",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M3 12h12M3 18h15"/></svg>)}
          {btn(() => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Align Center",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 6h18M6 12h12M4.5 18h15"/></svg>)}
        </div>
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          {btn(() => editor.chain().focus().undo().run(), false, "Undo",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6M3 10l6-6"/></svg>)}
          {btn(() => editor.chain().focus().redo().run(), false, "Redo",
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"/></svg>)}
        </div>
      </div>
      {/* Editor content */}
      <div className="flex-1 overflow-y-auto [&_.tiptap]:h-full">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

// ─── AI Notes Review Panel ────────────────────────────────────────────────────

type NotesPanelTab = "preview" | "edit" | "transcript" | "quiz" | "analytics";

function NotesReviewPanel({ lecture, onClose }: { lecture: Lecture; onClose: () => void }) {
  const updateLecture = useUpdateLecture();
  const { toast } = useToast();
  const [tab, setTab] = useState<NotesPanelTab>("preview");
  const [htmlContent, setHtmlContent] = useState("");
  const [concepts, setConcepts] = useState<string[]>(lecture.aiKeyConcepts || []);
  const [newConcept, setNewConcept] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const youtubeSource = isYouTubeUrl(lecture.videoUrl);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizCheckpoint[]>([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizLoaded, setQuizLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<QuizCheckpoint | null>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState<WatchAnalytics | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const loadQuiz = async () => {
    if (quizLoaded) return;
    try {
      const qs = await getQuizCheckpoints(lecture.id);
      setQuizQuestions(qs);
      setQuizLoaded(true);
    } catch { /* ignore */ }
  };

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const data = await getWatchAnalytics(lecture.id);
      setAnalytics(data);
    } catch { toast({ title: "Failed to load analytics", variant: "destructive" }); }
    finally { setIsLoadingAnalytics(false); }
  };

  const handleTabChange = (t: NotesPanelTab) => {
    setTab(t);
    if (t === "quiz") loadQuiz();
    if (t === "analytics") loadAnalytics();
  };

  const handleGenerateQuiz = async () => {
    if (!lecture.transcript) {
      toast({
        title: "No transcript",
        description: youtubeSource
          ? YOUTUBE_LECTURE_CAPTIONS_HINT
          : "Transcript is required to generate quiz questions.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const result = await generateQuizForLecture({
        transcript: lecture.transcript,
        lectureTitle: lecture.title,
        topicId: lecture.topic?.id,
      });
      const qs: QuizCheckpoint[] = (result as any).questions ?? [];
      setQuizQuestions(qs);
      setQuizLoaded(true);
      // Auto-save generated questions to DB immediately
      await saveQuizCheckpoints(lecture.id, qs);
      toast({ title: `${qs.length} quiz questions generated & saved!`, description: "Edit any question below, changes save automatically." });
    } catch (err: any) {
      toast({ title: "Quiz generation failed", description: err?.message, variant: "destructive" });
    } finally { setIsGeneratingQuiz(false); }
  };

  const handleSaveQuiz = async () => {
    setIsSavingQuiz(true);
    try {
      await saveQuizCheckpoints(lecture.id, quizQuestions);
      toast({ title: "Quiz saved!", description: "Students will see these questions while watching the video." });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSavingQuiz(false); }
  };

  const removeQuestion = async (id: string) => {
    const updated = quizQuestions.filter(q => q.id !== id);
    setQuizQuestions(updated);
    try { await saveQuizCheckpoints(lecture.id, updated); }
    catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const startEdit = (q: QuizCheckpoint) => {
    setEditingId(q.id);
    setEditDraft({ ...q, options: q.options.map(o => ({ ...o })) });
  };

  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };

  const saveEdit = async () => {
    if (!editDraft) return;
    const updated = quizQuestions.map(q => q.id === editDraft.id ? editDraft : q);
    setQuizQuestions(updated);
    setEditingId(null);
    setEditDraft(null);
    setIsSavingQuiz(true);
    try {
      await saveQuizCheckpoints(lecture.id, updated);
      toast({ title: "Question updated!" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSavingQuiz(false); }
  };

  // Convert markdown to simple HTML for Tiptap initial load
  const initialHtml = useMemo(() => {
    const md = lecture.aiNotesMarkdown || "";
    if (!md) return "";
    // Basic markdown → HTML conversion for Tiptap
    return md
      .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      .replace(/^(?!<[h|u|o|b|l])(.*\S.*)$/gm, "<p>$1</p>")
      .replace(/\n{2,}/g, "");
  }, [lecture.aiNotesMarkdown]);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      await updateLecture.mutateAsync({
        id: lecture.id, status: "published" as any,
        aiNotesMarkdown: htmlContent || lecture.aiNotesMarkdown,
        aiKeyConcepts: concepts,
      } as any);
      toast({ title: "Lecture published!", description: "Students can now view this lecture and its notes." });
      onClose();
    } catch { toast({ title: "Publish failed", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateLecture.mutateAsync({
        id: lecture.id,
        aiNotesMarkdown: htmlContent || lecture.aiNotesMarkdown,
        aiKeyConcepts: concepts,
      } as any);
      setHasChanges(false);
      toast({ title: "Notes saved" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const addConcept = () => {
    const c = newConcept.trim();
    if (c && !concepts.includes(c)) { setConcepts([...concepts, c]); setHasChanges(true); }
    setNewConcept("");
  };

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[200] flex justify-end">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-4xl bg-card border-l border-border flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Lecture Notes
            </p>
            <h2 className="font-bold text-foreground mt-0.5 truncate">{lecture.title}</h2>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5 h-8 text-xs">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                Save
              </Button>
            )}
            <Button onClick={handlePublish} disabled={isSaving} size="sm" className="gap-1.5 h-8">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Publish Lecture
            </Button>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-4 border-b border-border bg-secondary/20 shrink-0 overflow-x-auto">
          {([
            { id: "preview" as NotesPanelTab, label: "Preview", icon: Eye },
            { id: "edit" as NotesPanelTab, label: "Edit", icon: Edit3 },
            { id: "transcript" as NotesPanelTab, label: "Transcript", icon: Mic },
            { id: "quiz" as NotesPanelTab, label: "Quiz", icon: HelpCircle },
            { id: "analytics" as NotesPanelTab, label: "Analytics", icon: BarChart2 },
          ]).map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap shrink-0",
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Key Concepts */}
        <div className="px-6 py-2.5 border-b border-border bg-secondary/10 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">Concepts:</span>
            {concepts.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                {c}
                <button onClick={() => { setConcepts(concepts.filter((_, j) => j !== i)); setHasChanges(true); }}
                  className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
            <input value={newConcept} onChange={e => setNewConcept(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addConcept(); } }}
              placeholder="+ Add…"
              className="h-5 w-20 text-[11px] px-2 bg-transparent border-b border-dashed border-border outline-none focus:border-primary placeholder:text-muted-foreground/50" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {/* PREVIEW */}
          {tab === "preview" && (
            <div className="h-full overflow-y-auto px-8 py-6">
              {lecture.aiNotesMarkdown ? (
                <MarkdownContent content={lecture.aiNotesMarkdown} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  {(lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending") ? (
                    <>
                      <Loader2 className="w-12 h-12 opacity-60 text-primary animate-spin" />
                      <p className="text-sm text-foreground">Generating AI notes…</p>
                      <p className="text-xs text-center max-w-sm">
                        {youtubeSource ? "Pulling YouTube captions and summarising." : "Transcribing audio and generating notes."}
                      </p>
                    </>
                  ) : lecture.transcriptStatus === "failed" ? (
                    <>
                      <AlertTriangle className="w-12 h-12 opacity-60 text-amber-500" />
                      <p className="text-sm text-foreground">AI notes could not be generated</p>
                      <p className="text-xs text-center max-w-sm">
                        {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Check the video URL and try re-transcribe from the lecture list."}
                      </p>
                    </>
                  ) : (
                    <>
                      <FileText className="w-12 h-12 opacity-20" />
                      <p className="text-sm">No notes available yet.</p>
                      {youtubeSource && lecture.transcript && (
                        <p className="text-xs text-center max-w-sm text-muted-foreground">Transcript is ready — try refreshing, or edit notes manually.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* WYSIWYG EDIT */}
          {tab === "edit" && (
            <WysiwygEditor
              content={initialHtml}
              onChange={html => { setHtmlContent(html); setHasChanges(true); }}
            />
          )}

          {/* TRANSCRIPT */}
          {tab === "transcript" && (
            <div className="h-full overflow-y-auto px-8 py-6">
              {lecture.transcriptStatus === "processing" && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-blue-500">
                  <Loader2 className="w-10 h-10 animate-spin opacity-60" />
                  <p className="text-sm font-medium">Transcription in progress…</p>
                  <p className="text-xs text-muted-foreground">This usually takes 2-5 minutes. Refresh the page to check.</p>
                </div>
              )}
              {lecture.transcriptStatus === "failed" && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500">
                  <XCircle className="w-10 h-10 opacity-60" />
                  <p className="text-sm font-medium">Transcription failed</p>
                  <p className="text-xs text-muted-foreground text-center max-w-xs">The AI could not transcribe this video. Check that the video URL is accessible, then retry.</p>
                  <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-500/30 hover:bg-red-500/10"
                    onClick={async () => {
                      try {
                        await retranscribeLecture(lecture.id);
                        toast({ title: "Transcription started", description: "Re-transcribing the lecture…" });
                      } catch { toast({ title: "Failed", variant: "destructive" }); }
                    }}>
                    <RefreshCw className="w-3.5 h-3.5" /> Retry Transcription
                  </Button>
                </div>
              )}
              {!lecture.transcriptStatus || (lecture.transcriptStatus !== "processing" && lecture.transcriptStatus !== "failed") ? (
                lecture.transcript ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mic className="w-3.5 h-3.5 text-primary" />
                      <span>Auto-transcribed · {lecture.transcriptLanguage === "hi" ? "Hindi" : "English"}</span>
                    </div>
                    <div className="bg-secondary/40 rounded-xl p-5 text-sm text-foreground leading-7 whitespace-pre-wrap font-mono">
                      {lecture.transcript}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    {(lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending") ? (
                      <>
                        <Loader2 className="w-12 h-12 opacity-60 text-primary animate-spin" />
                        <p className="text-sm text-foreground">Preparing transcript…</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource ? "Fetching captions from YouTube." : "Transcribing uploaded video."}
                        </p>
                      </>
                    ) : lecture.transcriptStatus === "failed" ? (
                      <>
                        <AlertTriangle className="w-12 h-12 opacity-60 text-amber-500" />
                        <p className="text-sm text-foreground">Transcript unavailable</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Check the video URL and try again from the lecture list."}
                        </p>
                      </>
                    ) : (
                      <>
                        <Mic className="w-12 h-12 opacity-20" />
                        <p className="text-sm">Transcript not available.</p>
                        <p className="text-xs text-center max-w-sm">
                          {youtubeSource ? YOUTUBE_LECTURE_CAPTIONS_HINT : "Upload a video to generate a transcript automatically."}
                        </p>
                      </>
                    )}
                  </div>
                )
              ) : null}
            </div>
          )}

          {/* QUIZ */}
          {tab === "quiz" && (
            <div className="h-full overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">In-Video Quiz Checkpoints</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Questions pop up for students at the right moments while watching</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {quizQuestions.length > 0 && (
                    <Button size="sm" variant="outline" onClick={handleSaveQuiz} disabled={isSavingQuiz} className="gap-1.5 h-8 text-xs">
                      {isSavingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Save Quiz
                    </Button>
                  )}
                  <Button size="sm" onClick={handleGenerateQuiz} disabled={isGeneratingQuiz || !lecture.transcript} className="gap-1.5 h-8 text-xs">
                    {isGeneratingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    {isGeneratingQuiz ? "Generating…" : quizQuestions.length > 0 ? "Regenerate" : "Generate Quiz"}
                  </Button>
                </div>
              </div>

              {!lecture.transcript && (
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
                  <Mic className="w-4 h-4 shrink-0" />
                  <span>
                    {!lecture.transcript && youtubeSource
                      ? YOUTUBE_LECTURE_CAPTIONS_HINT
                      : "A transcript is needed to generate quiz questions. Wait for processing or upload a captioned video."}
                  </span>
                </div>
              )}

              {quizQuestions.length === 0 && !isGeneratingQuiz && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <HelpCircle className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No quiz questions yet.</p>
                  <p className="text-xs">Click "Generate Quiz" to create questions from the transcript.</p>
                </div>
              )}

              {isGeneratingQuiz && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <p className="text-sm font-medium">AI is generating quiz questions…</p>
                  <p className="text-xs">Analysing transcript for key concepts and topic boundaries</p>
                </div>
              )}

              <div className="space-y-3">
                {quizQuestions.map((q, i) => {
                  const isEditing = editingId === q.id;

                  if (isEditing && editDraft) {
                    // ── Edit mode ──
                    return (
                      <div key={q.id} className="bg-primary/5 border border-primary/30 rounded-xl p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Q{i + 1}</span>
                          <span className="text-xs font-semibold text-primary">Editing</span>
                        </div>

                        {/* Question text */}
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Question</label>
                          <textarea
                            value={editDraft.questionText}
                            onChange={e => setEditDraft(d => d ? { ...d, questionText: e.target.value } : d)}
                            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-none"
                            rows={2}
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">Options — click radio to mark correct</label>
                          {editDraft.options.map((opt, oi) => (
                            <div key={opt.label} className={cn("flex items-center gap-2 border rounded-lg px-3 py-2 transition-colors",
                              editDraft.correctOption === opt.label
                                ? "border-emerald-500/50 bg-emerald-500/8"
                                : "border-border bg-background")}>
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={editDraft.correctOption === opt.label}
                                onChange={() => setEditDraft(d => d ? { ...d, correctOption: opt.label } : d)}
                                className="shrink-0 accent-emerald-500"
                              />
                              <span className={cn("text-xs font-bold w-4 shrink-0", editDraft.correctOption === opt.label ? "text-emerald-600" : "text-muted-foreground")}>{opt.label}.</span>
                              <input
                                value={opt.text}
                                onChange={e => setEditDraft(d => d ? {
                                  ...d, options: d.options.map((o, j) => j === oi ? { ...o, text: e.target.value } : o)
                                } : d)}
                                className="flex-1 text-sm bg-transparent outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                                placeholder={`Option ${opt.label}`}
                              />
                              {editDraft.correctOption === opt.label && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            </div>
                          ))}
                        </div>

                        {/* Trigger % + Segment title */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Show at % of video</label>
                            <input
                              type="number" min={0} max={100}
                              value={editDraft.triggerAtPercent}
                              onChange={e => setEditDraft(d => d ? { ...d, triggerAtPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) } : d)}
                              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Segment Title</label>
                            <input
                              value={editDraft.segmentTitle}
                              onChange={e => setEditDraft(d => d ? { ...d, segmentTitle: e.target.value } : d)}
                              className="w-full text-sm bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-primary"
                              placeholder="e.g. Introduction"
                            />
                          </div>
                        </div>

                        {/* Explanation */}
                        <div>
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Explanation (optional)</label>
                          <textarea
                            value={editDraft.explanation ?? ""}
                            onChange={e => setEditDraft(d => d ? { ...d, explanation: e.target.value || undefined } : d)}
                            className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary resize-none"
                            rows={2}
                            placeholder="Why is this the correct answer?"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 text-xs">Cancel</Button>
                          <Button size="sm" onClick={saveEdit} disabled={isSavingQuiz} className="h-8 text-xs gap-1.5">
                            {isSavingQuiz ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  // ── View mode ──
                  return (
                    <div key={q.id} className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Q{i + 1}</span>
                            <span className="text-[10px] text-muted-foreground">at {q.triggerAtPercent}% · {q.segmentTitle}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">{q.questionText}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button onClick={() => startEdit(q)} title="Edit question"
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/10">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeQuestion(q.id)} title="Delete question"
                            className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {q.options.map(opt => (
                          <div key={opt.label}
                            className={cn("px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1.5",
                              q.correctOption === opt.label
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                                : "border-border text-muted-foreground"
                            )}>
                            <span className="font-bold shrink-0">{opt.label}.</span>
                            <span className="truncate">{opt.text}</span>
                            {q.correctOption === opt.label && <CheckCircle className="w-3 h-3 shrink-0 ml-auto" />}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground bg-secondary/60 rounded-lg px-3 py-2 leading-5">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <div className="h-full overflow-y-auto px-6 py-5 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Student Watch Analytics</p>
                <button onClick={loadAnalytics} disabled={isLoadingAnalytics}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAnalytics && "animate-spin")} />
                  Refresh
                </button>
              </div>

              {isLoadingAnalytics && (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {!isLoadingAnalytics && !analytics && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <BarChart2 className="w-12 h-12 opacity-20" />
                  <p className="text-sm">No data yet. Publish the lecture so students can watch it.</p>
                </div>
              )}

              {analytics && (
                <div className="space-y-5">
                  {/* Summary row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Watchers", value: analytics.totalWatchers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                      { label: "Completed", value: analytics.students.filter(s => s.isCompleted).length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                      { label: "Quiz Avg", value: analytics.students.filter(s => s.quizScore !== null).length > 0
                          ? `${Math.round(analytics.students.filter(s => s.quizScore !== null).reduce((a, s) => a + (s.quizScore ?? 0), 0) / analytics.students.filter(s => s.quizScore !== null).length)}%`
                          : "—",
                        icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
                    ].map(s => (
                      <div key={s.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                        <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mx-auto mb-1.5`}>
                          <s.icon className={`w-4 h-4 ${s.color}`} />
                        </div>
                        <p className="text-lg font-bold text-foreground">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-question accuracy */}
                  {analytics.questionStats.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quiz Performance</p>
                      <div className="space-y-2">
                        {analytics.questionStats.map((qs, i) => (
                          <div key={qs.questionId} className="bg-secondary/40 rounded-xl px-4 py-3">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <p className="text-xs font-medium text-foreground truncate flex-1">{qs.questionText}</p>
                              <span className={cn("text-xs font-bold shrink-0",
                                qs.accuracy === null ? "text-muted-foreground" :
                                qs.accuracy >= 70 ? "text-emerald-500" : qs.accuracy >= 40 ? "text-amber-500" : "text-red-500"
                              )}>
                                {qs.accuracy !== null ? `${qs.accuracy}%` : "—"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full",
                                  (qs.accuracy ?? 0) >= 70 ? "bg-emerald-500" : (qs.accuracy ?? 0) >= 40 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ width: `${qs.accuracy ?? 0}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {qs.correctCount}/{qs.totalAttempts} correct · {qs.segmentTitle}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-student table */}
                  {analytics.students.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Students</p>
                      <div className="space-y-2">
                        {analytics.students.sort((a, b) => b.watchPercentage - a.watchPercentage).map(s => (
                          <div key={s.studentId} className="flex items-center gap-3 bg-secondary/40 rounded-xl px-4 py-3">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {s.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground truncate">{s.studentName}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.watchPercentage}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">{Math.round(s.watchPercentage)}%</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              {s.quizScore !== null ? (
                                <span className={cn("text-xs font-bold",
                                  s.quizScore >= 70 ? "text-emerald-500" : s.quizScore >= 40 ? "text-amber-500" : "text-red-500"
                                )}>
                                  {s.quizScore}%
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              <p className="text-[10px] text-muted-foreground">{s.isCompleted ? "✓ Done" : "In progress"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {lecture.status === "published" ? "✓ Published — visible to students." : "Review notes carefully before publishing."}
          </p>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Save Changes
              </Button>
            )}
            <Button onClick={handlePublish} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {lecture.status === "published" ? "Update & Republish" : "Publish Lecture"}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Live Stats Panel ─────────────────────────────────────────────────────────

function StatsPanel({ lecture, onClose }: { lecture: Lecture; onClose: () => void }) {
  const { data: stats, isLoading } = useLectureStats(lecture.id);
  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[200] flex justify-end">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border flex flex-col h-full shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Lecture Stats</p>
            <h2 className="font-bold text-foreground mt-0.5">{lecture.title}</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : !stats ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No stats available yet. Publish the lecture first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Watches", value: stats.totalWatches, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Completion Rate", value: `${stats.completionRate}%`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Avg Watch", value: `${stats.averageWatchPercent}%`, icon: PlayCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
                  { label: "Confusion Spots", value: stats.confusionHotspots?.length ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                ].map(s => (
                  <div key={s.label} className="bg-secondary/50 rounded-2xl p-4">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
                    </div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {stats.confusionHotspots?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Most Rewound Timestamps</h3>
                  <div className="space-y-2">
                    {stats.confusionHotspots.map((sec, i) => {
                      const m = Math.floor(sec / 60), s = sec % 60;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5">
                          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="text-sm font-mono font-semibold text-foreground">{m}:{String(s).padStart(2, "0")}</span>
                          <span className="text-xs text-muted-foreground">students rewound here frequently</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lecture Detail Panel ─────────────────────────────────────────────────────

function LectureDetailPanel({ lecture, onClose, onReview }: {
  lecture: Lecture;
  onClose: () => void;
  onReview: () => void;
}) {
  const [tab, setTab] = useState<"overview" | "notes" | "transcript" | "quiz">("overview");
  const [quizSubTab, setQuizSubTab] = useState<"questions" | "students">("questions");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useLectureStats(lecture.id);
  const { data: checkpoints = [] } = useQuery({
    queryKey: ["teacher", "lecture-checkpoints", lecture.id],
    queryFn: () => getQuizCheckpoints(lecture.id),
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["teacher", "watch-analytics", lecture.id],
    queryFn: () => getWatchAnalytics(lecture.id),
    enabled: tab === "quiz",
  });

  const isYouTube = isYouTubeUrl(lecture.videoUrl);

  const tabs = [
    { key: "overview" as const, label: "Overview", icon: Eye },
    ...(lecture.aiNotesMarkdown || (lecture.aiKeyConcepts?.length ?? 0) > 0
      ? [{ key: "notes" as const, label: "Notes", icon: BookOpen }]
      : []),
    ...(lecture.transcript ? [{ key: "transcript" as const, label: "Transcript", icon: FileText }] : []),
    // Always show Quiz tab so teachers can see/add checkpoints
    { key: "quiz" as const, label: checkpoints.length > 0 ? `Quiz (${checkpoints.length})` : "Quiz", icon: ListChecks },
  ];

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-[200] flex justify-end">
      <div className="flex-1 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-card border-l border-border flex flex-col h-full shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
                {lecture.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusLabel[lecture.status] ?? lecture.status}
              </span>
              <span className="text-xs text-muted-foreground">{fmtDate(lecture.createdAt)}</span>
            </div>
            <h2 className="font-bold text-foreground text-base leading-snug">{lecture.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {lecture.batch?.name}{lecture.topic ? ` · ${lecture.topic.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {(lecture.status === "draft") && (
              <Button size="sm" onClick={() => { onClose(); onReview(); }} className="gap-1.5 h-8 text-xs">
                <Eye className="w-3.5 h-3.5" /> Review & Publish
              </Button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-6 shrink-0">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn("flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors -mb-px",
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="p-6 space-y-5">
              {isYouTube && (lecture.transcriptStatus === "processing" || lecture.transcriptStatus === "pending") && (
                <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <Loader2 className="w-4 h-4 shrink-0 mt-0.5 animate-spin text-blue-600" />
                  <div>
                    <p className="font-semibold">Processing YouTube lecture</p>
                    <p className="text-xs mt-1 leading-relaxed">Fetching captions and generating AI notes. Refresh in a minute if this stays empty.</p>
                  </div>
                </div>
              )}
              {isYouTube && lecture.transcriptStatus === "failed" && (
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Captions or AI processing failed</p>
                    <p className="text-xs mt-1 leading-relaxed">{YOUTUBE_LECTURE_CAPTIONS_HINT}</p>
                  </div>
                </div>
              )}

              {/* Video preview */}
              {lecture.videoUrl && (
                <div className="rounded-2xl overflow-hidden aspect-video bg-black">
                  {isYouTube ? (
                    <iframe
                      src={lecture.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={lecture.videoUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}

              {/* Metadata strip */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Type", value: lecture.type === "live" ? "Live Class" : "Recorded", icon: Video },
                  ...(lecture.videoDurationSeconds ? [{ label: "Duration", value: `${Math.floor(lecture.videoDurationSeconds / 60)} min`, icon: Clock }] : []),
                  ...(lecture.batch?.name ? [{ label: "Batch", value: lecture.batch.name, icon: Users }] : []),
                  ...(lecture.topic?.name ? [{ label: "Topic", value: lecture.topic.name, icon: BookOpen }] : []),
                ].map((m, i) => (
                  <div key={i} className="bg-secondary/50 rounded-xl p-3 flex items-start gap-2.5">
                    <m.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{m.label}</p>
                      <p className="text-xs font-semibold text-foreground truncate mt-0.5">{m.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {lecture.description && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</p>
                  <p className="text-sm text-foreground/80 leading-7">{lecture.description}</p>
                </div>
              )}

              {/* Live meeting link */}
              {lecture.liveMeetingUrl && (
                <a href={lecture.liveMeetingUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                  <ExternalLink className="w-4 h-4" /> Open Meeting Link
                </a>
              )}

              {/* Watch Stats */}
              {lecture.status === "published" && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Watch Stats</p>
                  {statsLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : stats ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Total Watches", value: stats.totalWatches, icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "Completion Rate", value: `${stats.completionRate}%`, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { label: "Avg Watch", value: `${stats.averageWatchPercent}%`, icon: PlayCircle, color: "text-violet-500", bg: "bg-violet-500/10" },
                        { label: "Confusion Spots", value: stats.confusionHotspots?.length ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                      ].map(s => (
                        <div key={s.label} className="bg-secondary/50 rounded-xl p-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.bg)}>
                            <s.icon className={cn("w-4 h-4", s.color)} />
                          </div>
                          <p className="text-lg font-bold text-foreground">{s.value}</p>
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No watch data yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {tab === "notes" && (
            <div className="p-6 space-y-5">
              {(lecture.aiKeyConcepts?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Key Concepts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {lecture.aiKeyConcepts!.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {(lecture.aiFormulas?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" /> Formulas
                  </p>
                  <div className="space-y-2">
                    {lecture.aiFormulas!.map((f, i) => (
                      <div key={i} className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-2.5 font-mono text-sm">{f}</div>
                    ))}
                  </div>
                </div>
              )}
              {lecture.aiNotesMarkdown ? (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Lecture Notes
                  </p>
                  <div className="prose prose-sm prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80 prose-code:text-primary max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{lecture.aiNotesMarkdown}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpen className="w-10 h-10 opacity-20 mb-3" />
                  <p className="text-sm">No AI notes generated yet.</p>
                  {lecture.status === "draft" && (
                    <Button size="sm" className="mt-3 gap-1.5" onClick={() => { onClose(); onReview(); }}>
                      <Eye className="w-3.5 h-3.5" /> Review & Add Notes
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Transcript ── */}
          {tab === "transcript" && lecture.transcript && (
            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Auto-generated Transcript
              </p>
              {lecture.transcript.split(/\n{2,}/).filter(Boolean).map((para, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-7">{para}</p>
              ))}
            </div>
          )}

          {/* ── Quiz ── */}
          {tab === "quiz" && (
            <div className="flex flex-col h-full">
              {/* No checkpoints yet */}
              {!analyticsLoading && checkpoints.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-muted-foreground">
                  <ListChecks className="w-12 h-12 opacity-20 mb-4" />
                  <p className="font-medium text-foreground">No in-video quizzes yet</p>
                  <p className="text-sm mt-1 leading-6">Go to <span className="font-semibold text-primary">Review AI Notes</span> to generate or add quiz checkpoints for this lecture.</p>
                  {(lecture.status === "draft" || lecture.status === "published") && (
                    <Button size="sm" className="mt-4 gap-1.5" onClick={() => { onClose(); onReview(); }}>
                      <Sparkles className="w-3.5 h-3.5" /> Add Quiz Checkpoints
                    </Button>
                  )}
                </div>
              )}
              {analyticsLoading && checkpoints.length === 0 ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : checkpoints.length > 0 && (
                <>
                  {/* Summary strip */}
                  {analytics && (
                    <div className="grid grid-cols-3 gap-3 p-4 border-b border-border shrink-0">
                      {[
                        { label: "Questions", value: checkpoints.length, icon: ListChecks, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Attempted By", value: analytics.students.filter(s => s.answeredCount > 0).length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                        {
                          label: "Avg Accuracy",
                          value: (() => {
                            const s = analytics.questionStats.filter(q => q.accuracy !== null);
                            return s.length ? Math.round(s.reduce((a, q) => a + (q.accuracy ?? 0), 0) / s.length) + "%" : "—";
                          })(),
                          icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10",
                        },
                      ].map(m => (
                        <div key={m.label} className="bg-secondary/50 rounded-xl p-3 text-center">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5", m.bg)}>
                            <m.icon className={cn("w-4 h-4", m.color)} />
                          </div>
                          <p className="text-lg font-bold text-foreground">{m.value}</p>
                          <p className="text-[10px] text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tabs */}
                  <div className="flex border-b border-border px-4 shrink-0">
                    {(["questions", "students"] as const).map(k => (
                      <button key={k} onClick={() => setQuizSubTab(k)}
                        className={cn("px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px capitalize",
                          quizSubTab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                        {k === "questions" ? `Questions (${checkpoints.length})` : `Student Results (${analytics?.students.length ?? 0})`}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* ── Questions sub-tab ── */}
                    {quizSubTab === "questions" && checkpoints.map((cp, i) => {
                      const qStat = analytics?.questionStats.find(q => q.questionId === cp.id);
                      const isExpanded = expandedQuestion === cp.id;
                      // per-option pick count
                      const optionCounts: Record<string, number> = {};
                      if (analytics) {
                        cp.options.forEach(o => { optionCounts[o.label] = 0; });
                        analytics.students.forEach(s => {
                          const r = s.responses.find(r => r.questionId === cp.id);
                          if (r) optionCounts[r.selectedOption] = (optionCounts[r.selectedOption] ?? 0) + 1;
                        });
                      }
                      const totalAnswered = qStat?.totalAttempts ?? 0;

                      return (
                        <div key={cp.id} className="border border-border rounded-xl overflow-hidden">
                          {/* Question header */}
                          <button
                            type="button"
                            onClick={() => setExpandedQuestion(isExpanded ? null : cp.id)}
                            className="w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
                          >
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0 mt-0.5">Q{i + 1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">{cp.segmentTitle} · at {cp.triggerAtPercent}% of video</p>
                              <p className="text-sm font-medium text-foreground leading-5">{cp.questionText}</p>
                              {qStat && (
                                <div className="mt-2.5 flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className={cn("h-full rounded-full transition-all", (qStat.accuracy ?? 0) >= 60 ? "bg-emerald-500" : (qStat.accuracy ?? 0) >= 40 ? "bg-amber-500" : "bg-red-500")}
                                      style={{ width: `${qStat.accuracy ?? 0}%` }}
                                    />
                                  </div>
                                  <span className={cn("text-xs font-bold shrink-0",
                                    (qStat.accuracy ?? 0) >= 60 ? "text-emerald-600" : (qStat.accuracy ?? 0) >= 40 ? "text-amber-600" : "text-red-600")}>
                                    {qStat.accuracy !== null ? `${qStat.accuracy}% correct` : "No attempts"}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">{totalAnswered} attempts</span>
                                </div>
                              )}
                            </div>
                            <ChevronRight className={cn("w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform", isExpanded && "rotate-90")} />
                          </button>

                          {/* Expanded: options + per-option bar */}
                          {isExpanded && (
                            <div className="border-t border-border p-4 space-y-2 bg-secondary/20">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Option Breakdown</p>
                              {cp.options.map(opt => {
                                const count = optionCounts[opt.label] ?? 0;
                                const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                                const isCorrect = opt.label === cp.correctOption;
                                return (
                                  <div key={opt.label} className={cn("rounded-xl p-3", isCorrect ? "bg-emerald-500/8 border border-emerald-500/25" : "bg-secondary/60 border border-border/50")}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                                        isCorrect ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground")}>{opt.label}</span>
                                      <span className={cn("text-xs flex-1", isCorrect ? "font-semibold text-foreground" : "text-foreground/80")}>{opt.text}</span>
                                      {isCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                                      <span className="text-xs font-bold text-foreground shrink-0">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                                      <div
                                        className={cn("h-full rounded-full transition-all", isCorrect ? "bg-emerald-500" : "bg-muted-foreground/40")}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                              {cp.explanation && (
                                <div className="mt-3 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <p className="text-xs text-foreground/80 leading-5">{cp.explanation}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* ── Students sub-tab ── */}
                    {quizSubTab === "students" && (
                      analytics?.students.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Users className="w-10 h-10 opacity-20 mb-3" />
                          <p className="text-sm">No students have attempted the quiz yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(analytics?.students ?? [])
                            .filter(s => s.answeredCount > 0)
                            .sort((a, b) => (b.quizScore ?? 0) - (a.quizScore ?? 0))
                            .map((s, idx) => (
                              <div key={s.studentId} className="border border-border rounded-xl overflow-hidden">
                                {/* Student row */}
                                <div className="flex items-center gap-3 p-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                    {s.studentName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{s.studentName}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-muted-foreground">{s.correctCount}/{s.answeredCount} correct</span>
                                      <span className="text-muted-foreground/40 text-xs">·</span>
                                      <span className="text-xs text-muted-foreground">watched {Math.round(s.watchPercentage)}%</span>
                                    </div>
                                  </div>
                                  <div className={cn("text-sm font-bold px-2.5 py-1 rounded-full",
                                    s.quizScore === null ? "text-muted-foreground bg-secondary" :
                                    s.quizScore >= 70 ? "text-emerald-700 bg-emerald-500/10" :
                                    s.quizScore >= 40 ? "text-amber-700 bg-amber-500/10" : "text-red-700 bg-red-500/10")}>
                                    {s.quizScore !== null ? `${s.quizScore}%` : "—"}
                                  </div>
                                </div>
                                {/* Per-question answer row */}
                                {s.answeredCount > 0 && (
                                  <div className="border-t border-border/50 px-3 py-2 bg-secondary/20 flex flex-wrap gap-2">
                                    {checkpoints.map((cp, qi) => {
                                      const resp = s.responses.find(r => r.questionId === cp.id);
                                      return (
                                        <div key={cp.id} title={resp ? `Q${qi + 1}: chose ${resp.selectedOption}${resp.isCorrect ? " ✓" : ` (correct: ${cp.correctOption})`}` : `Q${qi + 1}: not answered`}
                                          className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold cursor-default",
                                            !resp ? "bg-secondary text-muted-foreground" :
                                            resp.isCorrect ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25" :
                                            "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25")}>
                                          <span>Q{qi + 1}</span>
                                          {resp && (
                                            <>
                                              <span className="font-bold">{resp.selectedOption}</span>
                                              {resp.isCorrect
                                                ? <CheckCircle className="w-3 h-3" />
                                                : <XCircle className="w-3 h-3" />}
                                            </>
                                          )}
                                          {!resp && <span>—</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

type UploadStep = 1 | 2 | 3;
type VideoSource = "upload" | "youtube";

function UploadModal({ onClose, onSuccess, batches }: {
  onClose: () => void;
  onSuccess: (lectureId: string, videoUrl: string, topicId: string) => void;
  batches: any[];
}) {
  const createLecture = useCreateLecture();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<UploadStep>(1);
  const [batchId, setBatchId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lectureLanguage, setLectureLanguage] = useState<"en" | "hi">("en");
  const [videoSource, setVideoSource] = useState<VideoSource>("upload");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null); // actual File for upload
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempLectureId] = useState(() => uuidv4());

  const { user } = useAuthStore();
  // BatchSubjectTeacher.teacherId is a FK to User entity, so compare against user.id
  const teacherId = user?.id ?? "";

  // Reset subject/chapter/topic when batch changes
  const handleBatchChange = (id: string) => {
    setBatchId(id);
    setSelectedSubjectId("");
    setSelectedChapterId("");
    setTopicId("");
  };

  const { data: allSubjects, isLoading: subjectsLoading } = useSubjects(batchId || undefined);
  const { data: chapters } = useChapters(selectedSubjectId);
  const { data: topics } = useTopics(selectedChapterId);

  // Fetch subject-teacher assignments for the selected batch
  const { data: batchAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["batch-subject-teachers", batchId],
    queryFn: () => getBatchSubjectTeachers(batchId),
    enabled: !!batchId,
  });

  // Check if this teacher is the primary teacher of the selected batch
  const isPrimaryTeacher = !!batchId && batches.find((b: any) => b.id === batchId)?.teacherId === teacherId;

  // Names of subjects assigned to the current teacher in this batch (trimmed + lowercased)
  const assignedSubjectNames = batchAssignments
    .filter(a => a.teacherId === teacherId)
    .map(a => a.subjectName.toLowerCase().trim());

  // Subject list logic:
  // - Still loading → show nothing (avoid flash of wrong state)
  // - Primary teacher with NO explicit subject assignments → show all subjects
  // - Teacher has explicit subject assignments → show only those matching subjects
  // - No assignments configured in this batch at all → show all subjects
  const hasAnyAssignments = batchAssignments.length > 0;
  const isLoading = subjectsLoading || (!!batchId && assignmentsLoading);
  const subjects = isLoading
    ? []
    : !hasAnyAssignments || (isPrimaryTeacher && assignedSubjectNames.length === 0)
      ? (allSubjects ?? [])
      : (allSubjects ?? []).filter(
          (s: any) => assignedSubjectNames.includes(s.name.toLowerCase().trim())
        );

  const handleThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    const reader = new FileReader();
    reader.onload = ev => setThumbnailPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadToS3 = async (endpoint: string, file: File, onProgress?: (pct: number) => void) => {
    const form = new FormData();
    form.append("file", file);
    const res = await apiClient.post(endpoint, form, {
      timeout: 10 * 60 * 1000,
      transformRequest: [(_data, headers) => { delete headers['Content-Type']; return form; }],
      onUploadProgress: e => { if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); },
    });
    const url: string = res.data?.data?.url ?? res.data?.url;
    return url.startsWith("http") ? url : `${import.meta.env.VITE_BACKEND_URL || getApiOrigin() || "http://127.0.0.1:3000"}${url}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const trimmedUrl = videoUrl.trim();

      if (videoSource === "youtube") {
        if (!isYouTubeUrl(trimmedUrl)) {
          toast({ title: "Not a YouTube URL", description: "Paste a youtube.com or youtu.be link.", variant: "destructive" });
          return;
        }
        if (!isValidYouTubeLectureUrl(trimmedUrl)) {
          toast({
            title: "Invalid YouTube link",
            description: "Use a watch, Shorts, embed, or youtu.be URL with a valid video id.",
            variant: "destructive",
          });
          return;
        }
      }

      let finalVideoUrl = trimmedUrl;
      let finalThumbnailUrl: string | undefined;

      if (videoSource === "upload" && videoFile) {
        finalVideoUrl = await uploadToS3("/content/lectures/upload-video", videoFile, setUploadProgress);
      }

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToS3("/content/lectures/upload-thumbnail", thumbnailFile);
      }

      const lecture = await createLecture.mutateAsync({
        batchId,
        title,
        description: description || undefined,
        type: "recorded",
        topicId: topicId || undefined,
        lectureLanguage,
        videoUrl: finalVideoUrl || undefined,
        thumbnailUrl: finalThumbnailUrl,
      });
      toast({ title: "Lecture uploaded!", description: "AI is analysing your lecture in the background." });
      onClose();
      // Kick off background AI processing — non-blocking
      onSuccess(lecture.id, lecture.videoUrl ?? finalVideoUrl, topicId);
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || err?.message || "Upload failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Upload Recorded Lecture</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {([1, 2, 3] as UploadStep[]).map(s => (
                <div key={s} className={cn("h-1 rounded-full transition-all", s <= step ? "bg-primary w-8" : "bg-muted w-4")} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">Step {step} of 3</span>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground hover:text-foreground" /></button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">

          {/* Step 1: Batch + Topic + Title */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Batch *</Label>
                <select value={batchId} onChange={e => handleBatchChange(e.target.value)} required
                  className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                  <option value="">Select batch…</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <select
                  value={selectedSubjectId}
                  onChange={e => { setSelectedSubjectId(e.target.value); setSelectedChapterId(""); setTopicId(""); }}
                  disabled={!batchId}
                  className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">
                    {!batchId
                      ? "Select batch first…"
                      : isLoading
                        ? "Loading subjects…"
                        : subjects.length === 0
                          ? "No subjects found"
                          : "Select subject…"}
                  </option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {batchId && !isLoading && hasAnyAssignments && assignedSubjectNames.length === 0 && !isPrimaryTeacher && subjects.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">
                    No subjects are assigned to you for this batch yet. Contact your admin.
                  </p>
                )}
              </div>
              {selectedSubjectId && (
                <div className="space-y-1.5">
                  <Label>Chapter</Label>
                  <select value={selectedChapterId} onChange={e => { setSelectedChapterId(e.target.value); setTopicId(""); }}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                    <option value="">Select chapter…</option>
                    {(chapters ?? []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              {selectedChapterId && (
                <div className="space-y-1.5">
                  <Label>Topic</Label>
                  <select value={topicId} onChange={e => setTopicId(e.target.value)}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                    <option value="">Select topic…</option>
                    {(topics ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Lecture Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Newton's Laws of Motion — Part 1" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Brief description for students…" rows={2} className="resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label>Lecture Language <span className="text-muted-foreground font-normal">(upload: speech-to-text · YouTube: notes language)</span></Label>
                <div className="flex gap-2">
                  {([
                    { value: "en" as const, label: "English", sub: "Default" },
                    { value: "hi" as const, label: "हिंदी", sub: "Hindi" },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setLectureLanguage(opt.value)}
                      className={cn(
                        "flex-1 flex flex-col items-center py-3 rounded-xl border text-sm font-medium transition-colors",
                        lectureLanguage === opt.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40",
                      )}>
                      <span className="text-base font-bold">{opt.label}</span>
                      <span className="text-[10px] mt-0.5">{opt.sub}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  AI will transcribe using Whisper in the selected language. Students can request a Hindi translation of English transcripts.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Video Source + Thumbnail */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "upload" as VideoSource, label: "Upload Video", icon: Upload },
                  { value: "youtube" as VideoSource, label: "YouTube URL", icon: Youtube },
                ] as { value: VideoSource; label: string; icon: any }[]).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setVideoSource(opt.value);
                      if (opt.value === "youtube") {
                        setVideoFile(null);
                        if (!isYouTubeUrl(videoUrl)) setVideoUrl("");
                      } else if (isYouTubeUrl(videoUrl)) {
                        setVideoUrl("");
                      }
                    }}
                    className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors",
                      videoSource === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50")}>
                    <opt.icon className={cn("w-6 h-6", videoSource === opt.value ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", videoSource === opt.value ? "text-primary" : "text-muted-foreground")}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-amber-800">
                  {videoSource === "youtube"
                    ? `${YOUTUBE_LECTURE_CAPTIONS_HINT} For playback-only links, add the video under topic resources instead.`
                    : "Uploaded videos are transcribed with speech-to-text. Choose Hindi or English before continuing."}
                </p>
              </div>

              {videoSource === "upload" ? (
                <div className="space-y-4">
                  <LectureVideoUpload
                    courseId={batchId}
                    lectureId={tempLectureId}
                    currentUrl={videoUrl}
                    onUpload={(url) => setVideoUrl(url)}
                  />
                  {videoUrl && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-emerald-700">Video successfully uploaded</p>
                        <p className="text-xs text-emerald-600 truncate">{videoUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label>YouTube Video URL *</Label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="pl-9" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Students watch on YouTube; AI uses captions for notes and quizzes.</p>
                </div>
              )}

              {/* Thumbnail */}
              <div className="space-y-1.5">
                <Label>Thumbnail (optional)</Label>
                <div className="flex gap-3 items-center">
                  <div className={cn("w-24 h-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer",
                    thumbnailPreview ? "border-transparent" : "border-border hover:border-primary/50")}
                    onClick={() => thumbRef.current?.click()}>
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      : <ImageIcon className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Add a thumbnail to make the lecture stand out.</p>
                    <button className="text-xs text-primary font-medium mt-1" onClick={() => thumbRef.current?.click()}>
                      {thumbnailPreview ? "Change image" : "Upload image"}
                    </button>
                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2 text-sm">
                <p className="font-semibold text-foreground">Ready to upload</p>
                <div className="space-y-1 text-muted-foreground">
                  <p><span className="text-foreground font-medium">Title:</span> {title}</p>
                  <p><span className="text-foreground font-medium">Batch:</span> {batches.find(b => b.id === batchId)?.name}</p>
                  <p><span className="text-foreground font-medium">Source:</span> {videoSource === "youtube" ? "YouTube" : "File upload"}</p>
                  {videoSource === "youtube" ? (
                    <p className="break-all"><span className="text-foreground font-medium">URL:</span> {videoUrl.trim()}</p>
                  ) : (
                    <>
                      <p><span className="text-foreground font-medium">File:</span> {videoFile?.name ?? "Uploaded file"}</p>
                      {videoFile && <p><span className="text-foreground font-medium">Size:</span> {(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>}
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-border p-5 space-y-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> What happens after upload
                </p>
                {[
                  { icon: Mic, text: "AI transcribes the full audio (Speech-to-Text)" },
                  { icon: FileText, text: "Generates structured lecture notes" },
                  { icon: ListChecks, text: "Extracts key formulas, concepts & important points" },
                  { icon: Eye, text: "You review & optionally edit the AI notes" },
                  { icon: Send, text: "You publish — students get notified instantly" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <s.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(s => (s - 1) as UploadStep)}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => (s + 1) as UploadStep)}
              disabled={(step === 1 && (!batchId || !title)) || (step === 2 && !videoUrl.trim())}
              className="gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 min-w-[160px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isSubmitting && videoSource === "upload" && videoFile && uploadProgress < 100
                ? `Uploading ${uploadProgress}%`
                : isSubmitting ? "Processing…" : videoSource === "youtube" ? "Save & process" : "Upload & Process"}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Schedule Live Modal ──────────────────────────────────────────────────────

function ScheduleLiveModal({ onClose, batches }: { onClose: () => void; batches: any[] }) {
  const createLecture = useCreateLecture();
  const { toast } = useToast();
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const teacherId = user?.id ?? "";

  const handleBatchChange = (id: string) => {
    setBatchId(id);
    setSubjectId("");
    setChapterId("");
    setTopicId("");
  };

  const { data: allSubjects, isLoading: subjectsLoading } = useSubjects(batchId || undefined);
  const { data: chapters } = useChapters(subjectId);
  const { data: topics } = useTopics(chapterId);

  const { data: batchAssignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ["batch-subject-teachers", batchId],
    queryFn: () => getBatchSubjectTeachers(batchId),
    enabled: !!batchId,
  });

  const isPrimaryTeacher = !!batchId && batches.find((b: any) => b.id === batchId)?.teacherId === teacherId;
  const assignedSubjectNames = batchAssignments
    .filter((a: any) => a.teacherId === teacherId)
    .map((a: any) => a.subjectName.toLowerCase().trim());
  const hasAnyAssignments = batchAssignments.length > 0;
  const subjectsReady = !subjectsLoading && !(!!batchId && assignmentsLoading);
  const subjectList: any[] = !subjectsReady
    ? []
    : !hasAnyAssignments || (isPrimaryTeacher && assignedSubjectNames.length === 0)
      ? (allSubjects ?? [])
      : (allSubjects ?? []).filter(
          (s: any) => assignedSubjectNames.includes(s.name.toLowerCase().trim())
        );

  const chapterList: any[] = Array.isArray(chapters) ? chapters : [];
  const topicList: any[] = Array.isArray(topics) ? topics : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) { toast({ title: "Please select a topic", variant: "destructive" }); return; }
    setIsSubmitting(true);
    try {
      await createLecture.mutateAsync({
        batchId, title, description: description || undefined,
        type: "live",
        topicId,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      toast({ title: "Live class scheduled!", description: "Students have been notified and it's saved in their calendar." });
      onClose();
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || "Scheduling failed", variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "min(90vh, 800px)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">Schedule Live Class</h2>
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Students will be notified and reminded automatically</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — two-column layout */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 md:divide-y-0 md:divide-x divide-y divide-border">

            {/* Left — form fields */}
            <div className="md:col-span-3 p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Batch *</Label>
                  <select required value={batchId} onChange={e => handleBatchChange(e.target.value)}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary">
                    <option value="">Select batch…</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                {/* Subject → Chapter → Topic */}
                <div className="space-y-1.5">
                  <Label>Subject *</Label>
                  <select required value={subjectId}
                    onChange={e => { setSubjectId(e.target.value); setChapterId(""); setTopicId(""); }}
                    disabled={!batchId}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary disabled:opacity-40">
                    <option value="">
                      {!batchId ? "Select batch first…" : !subjectsReady ? "Loading…" : subjectList.length === 0 ? "No subjects found" : "Select subject…"}
                    </option>
                    {subjectList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {batchId && subjectsReady && hasAnyAssignments && assignedSubjectNames.length === 0 && !isPrimaryTeacher && subjectList.length === 0 && (
                    <p className="text-xs text-amber-500 mt-1">No subjects assigned to you for this batch. Contact your admin.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Chapter *</Label>
                  <select required value={chapterId} onChange={e => { setChapterId(e.target.value); setTopicId(""); }} disabled={!subjectId}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary disabled:opacity-40">
                    <option value="">{!subjectId ? "Select subject first…" : "Select chapter…"}</option>
                    {chapterList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Topic *</Label>
                  <select required value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!chapterId}
                    className="h-11 w-full px-4 bg-secondary border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary disabled:opacity-40">
                    <option value="">{!chapterId ? "Select chapter first…" : "Select topic…"}</option>
                    {topicList.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Class Title *</Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Electrostatics — Doubt Session" className="h-11" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="What topics will be covered? Any prerequisites?" rows={3} className="resize-none" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Date & Time *</Label>
                  <Input required type="datetime-local" value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)} className="h-11" />
                </div>
              </div>

            </div>

            {/* Right — info panel */}
            <div className="md:col-span-2 p-5 sm:p-6 flex flex-col gap-4 bg-secondary/30">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <AlarmClock className="w-4 h-4 text-primary" /> What happens next
                </p>
                <div className="space-y-3">
                  {[
                    { icon: "🔔", title: "Instant notification", desc: "All enrolled students are notified immediately" },
                    { icon: "📅", title: "Calendar saved", desc: "Added to every student's schedule & study plan" },
                    { icon: "⏰", title: "30-min reminder", desc: "Automatic reminder before the class starts" },
                    { icon: "🔴", title: "Live badge", desc: "EDVA marks it Live when you start the class" },
                    { icon: "✅", title: "Auto attendance", desc: "Students are marked attended after class ends" },
                  ].map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base mt-0.5">{s.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {scheduledAt && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-primary mb-1">Scheduled for</p>
                  <p className="text-sm font-bold text-foreground">
                    {new Date(scheduledAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          </div>{/* end two-col grid */}
          </div>{/* end scroll area */}

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 px-5 sm:px-7 py-4 border-t border-border bg-card">
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !batchId || !topicId || !title || !scheduledAt} className="gap-2 px-5">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule Live Class
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Recorded Lecture Card ────────────────────────────────────────────────────

const transcriptStatusBadge: Record<string, { cls: string; label: string }> = {
  pending:    { cls: "bg-slate-500/10 text-slate-500 border-slate-500/20",    label: "Transcript Pending" },
  processing: { cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",      label: "Transcribing…" },
  done:       { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Transcript Ready" },
  failed:     { cls: "bg-red-500/10 text-red-600 border-red-500/20",         label: "Transcript Failed" },
};

function RecordedCard({ lecture, onView, onReview, onStats, onDelete, onRetranscribe, processingStep }: {
  lecture: Lecture;
  onView: () => void;
  onReview: () => void;
  onStats: () => void;
  onDelete: () => void;
  onRetranscribe: () => void;
  processingStep?: number;
}) {
  const tsBadge = lecture.transcriptStatus ? transcriptStatusBadge[lecture.transcriptStatus] : null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-sm hover:border-primary/20 transition-all">
      {/* Clickable top section */}
      <button type="button" onClick={onView} className="w-full flex gap-4 p-4 text-left hover:bg-secondary/20 transition-colors">
        {/* Thumbnail */}
        <div className="w-28 h-18 rounded-xl bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center relative group/thumb">
          {lecture.thumbnailUrl
            ? <img src={lecture.thumbnailUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            : <Video className="w-7 h-7 text-muted-foreground/40" />}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
            <PlayCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">{lecture.title}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">{lecture.batch?.name}</span>
                {lecture.topic && <span className="text-xs text-muted-foreground">· {lecture.topic.name}</span>}
                <span className="text-xs text-muted-foreground">· {fmtDate(lecture.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
                {lecture.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                {statusLabel[lecture.status] ?? lecture.status}
              </span>
              {tsBadge && lecture.status !== "processing" && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border", tsBadge.cls)}>
                  {lecture.transcriptStatus === "processing" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {lecture.transcriptStatus === "done" && <Mic className="w-2.5 h-2.5" />}
                  {tsBadge.label}
                </span>
              )}
            </div>
          </div>
          {(processingStep !== undefined || lecture.status === "processing") && lecture.status !== "draft" && lecture.status !== "published" && (
            <div className="mt-3">
              <AiProcessingCard lecture={lecture} activeStep={processingStep} />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" /> Click to view details
          </p>
        </div>
      </button>
      {/* Action bar */}
      <div className="flex items-center gap-2 px-4 pb-3 flex-wrap border-t border-border/50 pt-3">
        {lecture.status === "draft" && (
          <Button size="sm" onClick={e => { e.stopPropagation(); onReview(); }} className="gap-1.5 h-8 text-xs">
            <Eye className="w-3.5 h-3.5" /> Review AI Notes
          </Button>
        )}
        {lecture.status === "published" && (
          <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onStats(); }} className="gap-1.5 h-8 text-xs">
            <BarChart2 className="w-3.5 h-3.5" /> Live Stats
          </Button>
        )}
        {lecture.transcriptStatus === "failed" && (
          <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onRetranscribe(); }} className="gap-1.5 h-8 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10">
            <RefreshCw className="w-3 h-3" /> Retry Transcription
          </Button>
        )}
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors p-1">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Live Class Card ──────────────────────────────────────────────────────────

function LiveCard({ lecture, onDelete }: { lecture: Lecture; onDelete: () => void }) {
  const updateLecture = useUpdateLecture();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recordingUrl, setRecordingUrl] = useState("");
  const [showRecordingInput, setShowRecordingInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const recordingReady = !!lecture.videoUrl;
  const recordingPending = lecture.status === "ended" && !recordingReady;

  const startClass = () => {
    navigate(`/live/${lecture.id}`);
  };

  const endClass = async () => {
    try {
      const result = await import("@/lib/api/live-class").then(m => m.endLiveClass(lecture.id));
      toast({
        title: "Class ended",
        description: result.recordingUrl
          ? "Recording has been saved as a recorded lecture."
          : "Attendance marked. Recording is still processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    } catch { toast({ title: "Failed to end class", variant: "destructive" }); }
  };

  const saveRecording = async () => {
    if (!recordingUrl) return;
    setIsSaving(true);
    try {
      await updateLecture.mutateAsync({ id: lecture.id, videoUrl: recordingUrl } as any);
      toast({ title: "Recording attached", description: "It has been saved as a recorded lecture and AI notes are processing." });
      setShowRecordingInput(false);
    } catch { toast({ title: "Failed", variant: "destructive" }); }
    finally { setIsSaving(false); }
  };

  const isPast = lecture.scheduledAt ? new Date(lecture.scheduledAt) < new Date() : false;

  return (
    <div className={cn("bg-card border rounded-2xl overflow-hidden", lecture.status === "live" ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "border-border")}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground text-sm">{lecture.title}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{lecture.batch?.name}</span>
              {lecture.scheduledAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {fmtDateTime(lecture.scheduledAt)}
                </span>
              )}
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border shrink-0", statusColor[lecture.status] ?? "bg-secondary text-foreground border-border")}>
            {lecture.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            {statusLabel[lecture.status] ?? lecture.status}
          </span>
        </div>

        {lecture.liveMeetingUrl && lecture.status !== "ended" && (
          <a href={lecture.liveMeetingUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">
            <ExternalLink className="w-3.5 h-3.5" />
            {lecture.liveMeetingUrl.includes("meet.google.com") ? "Open Google Meet" : "Join Meeting"}
          </a>
        )}

        {recordingPending && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
            <Loader2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />
            <p className="text-xs text-amber-800">
              Recording is not available yet. It will appear here automatically, or you can attach a recording URL manually.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {lecture.status === "scheduled" && (
            <Button size="sm" onClick={startClass} className="gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
              <Radio className="w-3.5 h-3.5" /> {isPast ? "Start Class Now" : "Open Live Room"}
            </Button>
          )}
          {lecture.status === "live" && (
            <>
              <Button size="sm" onClick={() => navigate(`/live/${lecture.id}`)} className="gap-1.5 h-8 text-xs bg-red-500 hover:bg-red-600 text-white border-0">
                <Radio className="w-3.5 h-3.5" /> Enter Live Room
              </Button>
              <Button size="sm" onClick={endClass} variant="outline" className="gap-1.5 h-8 text-xs border-red-500/40 text-red-600 hover:bg-red-500/10">
                <StopCircle className="w-3.5 h-3.5" /> End Class
              </Button>
            </>
          )}
          {lecture.status === "ended" && !recordingReady && !showRecordingInput && (
            <Button size="sm" variant="outline" onClick={() => setShowRecordingInput(true)} className="gap-1.5 h-8 text-xs">
              <Link2 className="w-3.5 h-3.5" /> Attach Recording
            </Button>
          )}
          <button onClick={onDelete} className="ml-auto text-muted-foreground hover:text-red-500 transition-colors p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {showRecordingInput && (
          <div className="flex gap-2">
            <Input value={recordingUrl} onChange={e => setRecordingUrl(e.target.value)}
              placeholder="Paste recording URL…" className="h-9 text-sm flex-1" />
            <Button size="sm" onClick={saveRecording} disabled={isSaving || !recordingUrl} className="h-9 shrink-0">
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRecordingInput(false)} className="h-9">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {lecture.status === "ended" && lecture.videoUrl && (
          <a href={lecture.videoUrl} target="_blank" rel="noreferrer"
            className="flex items-center gap-2 text-xs text-primary font-medium hover:underline">
            <PlayCircle className="w-3.5 h-3.5" /> Watch Recording
          </a>
        )}

        {lecture.status === "scheduled" && !isPast && (
          <div className="flex items-center gap-2 bg-violet-500/5 border border-violet-500/20 rounded-xl px-3 py-2">
            <AlarmClock className="w-4 h-4 text-violet-500 shrink-0" />
            <p className="text-xs text-muted-foreground">30-min reminder will be sent automatically to all students.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TeacherLecturesPage = () => {
  const isCompactLayout = useIsCompactLayout();
  const prefersReducedMotion = useReducedMotion();
  const lightMotion = isCompactLayout || !!prefersReducedMotion;
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterBatch = searchParams.get("batchId") ?? "";
  const filterSubjectId = searchParams.get("subjectId") ?? "";
  const filterChapterId = searchParams.get("chapterId") ?? "";
  const filterTopicId = searchParams.get("topicId") ?? "";

  const setBatchFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("batchId", id); else p.delete("batchId");
    p.delete("subjectId");
    p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setSubjectFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("subjectId", id); else p.delete("subjectId");
    p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setChapterFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("chapterId", id); else p.delete("chapterId");
    p.delete("topicId");
    setSearchParams(p, { replace: true });
  };
  const setTopicFilter = (id: string) => {
    const p = new URLSearchParams(searchParams);
    if (id) p.set("topicId", id); else p.delete("topicId");
    setSearchParams(p, { replace: true });
  };

  const { data: batches } = useMyBatches();
  const batchList = batches ?? [];

  /** Batch for lecture list + curriculum: explicit URL filter, else the only course when teacher has one. */
  const resolvedBatchId = useMemo(() => {
    if (filterBatch) return filterBatch;
    if (batchList.length === 1) return batchList[0].id;
    return undefined;
  }, [filterBatch, batchList]);

  const { data: lectures, isLoading } = useMyLectures({
    batchId: resolvedBatchId,
    limit: 500,
  });

  const { data: curriculumSubjectsRaw = [], isLoading: curriculumLoading } = useSubjects(resolvedBatchId);

  const deleteLecture = useDeleteLecture();
  const { toast } = useToast();

  const [tab, setTab] = useState<"recorded" | "live">("live");
  const [showUpload, setShowUpload] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [viewLecture, setViewLecture] = useState<Lecture | null>(null);
  const [reviewLecture, setReviewLecture] = useState<Lecture | null>(null);
  const [statsLecture, setStatsLecture] = useState<Lecture | null>(null);

  // Track per-lecture AI processing step for animated UI (0–3)
  const [processingSteps, setProcessingSteps] = useState<Record<string, number>>({});

  const all = lectures ?? [];
  const curriculumSubjects = Array.isArray(curriculumSubjectsRaw) ? curriculumSubjectsRaw : [];

  const subjectOptions = useMemo(() => curriculumSubjects
    .filter(s => s.isActive !== false)
    .map(s => ({ id: s.id, name: s.name, sortOrder: s.sortOrder ?? 0 }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  [curriculumSubjects]);

  const subjectNode = useMemo(
    () => curriculumSubjects.find(s => s.id === filterSubjectId),
    [curriculumSubjects, filterSubjectId],
  );

  const chapterOptions = useMemo(() => {
    const ch = subjectNode?.chapters ?? [];
    return ch
      .filter(c => c.isActive !== false)
      .map(c => ({ id: c.id, name: c.name, sortOrder: c.sortOrder ?? 0 }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [subjectNode]);

  const chapterNode = useMemo(
    () => subjectNode?.chapters?.find(c => c.id === filterChapterId),
    [subjectNode, filterChapterId],
  );

  const topicOptions = useMemo(() => {
    const topics = chapterNode?.topics ?? [];
    return topics
      .filter(t => t.isActive !== false)
      .map(t => ({ id: t.id, name: t.name, sortOrder: t.sortOrder ?? 0 }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [chapterNode]);

  const topicIdsInSubject = useMemo(() => {
    if (!subjectNode) return null;
    const ids = new Set<string>();
    for (const ch of subjectNode.chapters ?? []) {
      for (const top of ch.topics ?? []) ids.add(top.id);
    }
    return ids;
  }, [subjectNode]);

  const topicIdsInChapter = useMemo(() => {
    if (!chapterNode?.topics?.length) return null;
    return new Set(chapterNode.topics.map(t => t.id));
  }, [chapterNode]);

  const filtered = useMemo(() => {
    let list = all;
    if (filterTopicId) {
      list = list.filter(l => (l.topicId ?? l.topic?.id) === filterTopicId);
    } else if (filterChapterId && topicIdsInChapter) {
      list = list.filter(l => {
        const tid = l.topicId ?? l.topic?.id;
        return tid != null && topicIdsInChapter.has(tid);
      });
    } else if (filterSubjectId && topicIdsInSubject) {
      list = list.filter(l => {
        const tid = l.topicId ?? l.topic?.id;
        return tid != null && topicIdsInSubject.has(tid);
      });
    }
    return list;
  }, [all, filterTopicId, filterChapterId, filterSubjectId, topicIdsInChapter, topicIdsInSubject]);

  const recorded = filtered.filter(l => l.type === "recorded");
  const live = filtered.filter(l => l.type === "live");
  const sortedLive = useMemo(
    () =>
      [...live].sort((a, b) => {
        const order = { live: 0, scheduled: 1, ended: 2 };
        return (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9);
      }),
    [live],
  );
  const initialBatchSize = isCompactLayout ? 8 : 14;
  const loadMoreBatchSize = isCompactLayout ? 6 : 10;
  const [recordedVisibleCount, setRecordedVisibleCount] = useState(initialBatchSize);
  const [liveVisibleCount, setLiveVisibleCount] = useState(initialBatchSize);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRecordedVisibleCount(prev => {
      const max = recorded.length || initialBatchSize;
      return Math.max(initialBatchSize, Math.min(prev, max));
    });
  }, [recorded.length, initialBatchSize]);

  useEffect(() => {
    setLiveVisibleCount(prev => {
      const max = sortedLive.length || initialBatchSize;
      return Math.max(initialBatchSize, Math.min(prev, max));
    });
  }, [sortedLive.length, initialBatchSize]);

  const visibleRecorded = useMemo(
    () => recorded.slice(0, recordedVisibleCount),
    [recorded, recordedVisibleCount],
  );
  const visibleLive = useMemo(
    () => sortedLive.slice(0, liveVisibleCount),
    [sortedLive, liveVisibleCount],
  );
  const canLoadMore =
    tab === "recorded"
      ? visibleRecorded.length < recorded.length
      : visibleLive.length < sortedLive.length;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !canLoadMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        if (tab === "recorded") {
          setRecordedVisibleCount((prev) => Math.min(prev + loadMoreBatchSize, recorded.length));
        } else {
          setLiveVisibleCount((prev) => Math.min(prev + loadMoreBatchSize, sortedLive.length));
        }
      },
      { rootMargin: isCompactLayout ? "220px 0px" : "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canLoadMore, isLoading, isCompactLayout, loadMoreBatchSize, recorded.length, sortedLive.length, tab]);

  // Auto-poll every 8s when any recorded lecture is still processing
  // (handles the case where the user refreshes mid-processing)
  const hasProcessing = Object.keys(processingSteps).length > 0 || recorded.some(l => l.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    }, 8000);
    return () => clearInterval(id);
  }, [hasProcessing, queryClient]);

  // Track which lecture IDs were just uploaded (so we can auto-open review when AI finishes)
  const [pendingReviewIds, setPendingReviewIds] = useState<Set<string>>(new Set());

  // After a lecture is uploaded, animate the processing steps UI while the
  // backend handles AI (speech-to-text + notes via Django).
  // We do NOT call the AI from the frontend — the backend already does it.
  const triggerAiProcessing = useCallback((lectureId: string) => {
    // Mark this lecture as pending review so we can auto-open the panel
    setPendingReviewIds(prev => new Set(prev).add(lectureId));

    // Instantly refresh list to show the new lecture in 'processing' state
    queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
  }, [queryClient]);

  // Auto-open the review panel when the backend finishes AI processing
  useEffect(() => {
    if (pendingReviewIds.size === 0) return;
    const readyLecture = (lectures ?? []).find(
      l => pendingReviewIds.has(l.id) && (l.status === "draft" || l.status === "published"),
    );
    if (!readyLecture) return;

    setPendingReviewIds(prev => { const n = new Set(prev); n.delete(readyLecture.id); return n; });
    setReviewLecture(readyLecture);
    toast({
      title: readyLecture.aiNotesMarkdown ? "AI notes ready! ✨" : "AI processing complete",
      description: readyLecture.aiNotesMarkdown
        ? "Review and publish when you're satisfied."
        : isYouTubeUrl(readyLecture.videoUrl)
          ? `YouTube lecture: ${readyLecture.transcriptStatus === "failed" ? YOUTUBE_LECTURE_CAPTIONS_HINT : "If notes are missing, check captions on the video or try re-transcribe."}`
          : "AI could not generate notes — add them manually then publish.",
    });
  }, [lectures, pendingReviewIds, toast]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lecture? This cannot be undone.")) return;
    try {
      await deleteLecture.mutateAsync(id);
      toast({ title: "Deleted" });
    } catch { toast({ title: "Delete failed", variant: "destructive" }); }
  };

  const handleRetranscribe = async (id: string) => {
    try {
      await retranscribeLecture(id);
      toast({ title: "Transcription started", description: "AI is re-transcribing the lecture. This may take a few minutes." });
      queryClient.invalidateQueries({ queryKey: ["teacher", "lectures"] });
    } catch {
      toast({ title: "Failed to start transcription", variant: "destructive" });
    }
  };

  return (
    <MotionConfig reducedMotion={lightMotion ? "always" : "never"}>
    <>
    {/* Panels are siblings of (not inside) the motion.div — position:fixed children
        of a transformed element don't position relative to the viewport */}
    <AnimatePresence>
      {viewLecture && (
        <LectureDetailPanel
          key="lecture-detail"
          lecture={viewLecture}
          onClose={() => setViewLecture(null)}
          onReview={() => { setViewLecture(null); setReviewLecture(viewLecture); }}
        />
      )}
      {reviewLecture && <NotesReviewPanel key="review" lecture={reviewLecture} onClose={() => setReviewLecture(null)} />}
      {statsLecture && <StatsPanel key="stats" lecture={statsLecture} onClose={() => setStatsLecture(null)} />}
      {showUpload && (
        <UploadModal
          key="upload"
          onClose={() => setShowUpload(false)}
          onSuccess={triggerAiProcessing}
          batches={batchList}
        />
      )}
      {showSchedule && <ScheduleLiveModal key="schedule" onClose={() => setShowSchedule(false)} batches={batchList} />}
    </AnimatePresence>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("max-w-[1200px] mx-auto p-6 lg:p-8 space-y-6 pb-20", lightMotion && "lite-motion")}
    >

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lectures</h1>
          <p className="text-sm text-slate-400 mt-0.5">{recorded.length} recorded · {live.length} live classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSchedule(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Radio className="w-4 h-4" /> Schedule Live
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}
          >
            <Plus className="w-4 h-4" /> Upload Lecture
          </button>
        </div>
      </div>

      {/* ── Tabs + Filter ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
          {([
            { key: "live",     label: "Live Classes", icon: Radio },
            { key: "recorded", label: "Recorded",     icon: Video },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {batchList.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setBatchFilter("")}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                !filterBatch
                  ? "bg-white text-gray-900"
                  : "bg-slate-100 text-slate-500 hover:text-slate-700")}>
              All
            </button>
            {batchList.map(b => (
              <button type="button" key={b.id} onClick={() => setBatchFilter(b.id)}
                className={cn("px-3 py-1.5 rounded-xl text-xs font-black transition-all",
                  filterBatch === b.id
                    ? "bg-white text-gray-900"
                    : "bg-slate-100 text-slate-500 hover:text-slate-700")}>
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {(filterBatch || batchList.length > 0) && (curriculumLoading || subjectOptions.length > 0 || filterSubjectId || filterChapterId || filterTopicId) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 inline-flex items-center gap-1.5">
            Curriculum
            {curriculumLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </span>
          <select
            value={filterSubjectId}
            onChange={e => setSubjectFilter(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 min-w-[140px] max-w-[220px] outline-none focus:border-blue-400"
          >
            <option value="">All subjects</option>
            {subjectOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select
            value={filterChapterId}
            disabled={!filterSubjectId}
            onChange={e => setChapterFilter(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 min-w-[140px] max-w-[220px] outline-none focus:border-blue-400 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <option value="">All chapters</option>
            {chapterOptions.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterTopicId}
            disabled={!filterChapterId}
            onChange={e => setTopicFilter(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-800 min-w-[140px] max-w-[220px] outline-none focus:border-blue-400 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <option value="">All topics</option>
            {topicOptions.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {(filterSubjectId || filterChapterId || filterTopicId) && (
            <button
              type="button"
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.delete("subjectId");
                p.delete("chapterId");
                p.delete("topicId");
                setSearchParams(p, { replace: true });
              }}
              className="h-9 px-3 rounded-xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Clear topic filters
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : tab === "recorded" ? (
        recorded.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200">
            <Video className="w-14 h-14 text-gray-800 mb-3" />
            <p className="text-sm font-bold text-slate-400">No recorded lectures yet</p>
            <p className="text-xs text-gray-600 mt-1">Click "Upload Lecture" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRecorded.map(l => (
              <RecordedCard
                key={l.id}
                lecture={l}
                processingStep={processingSteps[l.id]}
                onView={() => setViewLecture(l)}
                onReview={() => setReviewLecture(l)}
                onStats={() => setStatsLecture(l)}
                onDelete={() => handleDelete(l.id)}
                onRetranscribe={() => handleRetranscribe(l.id)}
              />
            ))}
            <p className="text-xs text-slate-500 px-1">
              Showing {visibleRecorded.length} of {recorded.length} recorded lectures
            </p>
          </div>
        )
      ) : (
        live.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-slate-200">
            <Radio className="w-14 h-14 text-gray-800 mb-3" />
            <p className="text-sm font-bold text-slate-400">No live classes scheduled</p>
            <p className="text-xs text-gray-600 mt-1">Click "Schedule Live" to schedule your first class.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleLive.map(l => (
                  <LiveCard key={l.id} lecture={l} onDelete={() => handleDelete(l.id)} />
                ))}
            </div>
            <p className="text-xs text-slate-500 px-1">
              Showing {visibleLive.length} of {sortedLive.length} live classes
            </p>
          </div>
        )
      )}

      {canLoadMore && !isLoading && (
        <div ref={loadMoreRef} className="flex items-center justify-center py-2">
          <Loader2 className={cn("w-4 h-4 text-slate-400 animate-spin", lightMotion && "animate-none")} />
          <span className="ml-2 text-xs font-medium text-slate-500">Loading more lectures...</span>
        </div>
      )}

    </motion.div>
    </>
    </MotionConfig>
  );
};

export default TeacherLecturesPage;
