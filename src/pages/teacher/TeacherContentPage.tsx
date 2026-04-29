import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useNavigate, useSearchParams, useParams, useLocation, useOutletContext,
  Routes, Route, Navigate, Outlet, Link,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Loader2, BookOpen, FileText, X,
  Layers, Upload, Trash2, ExternalLink, Link2,
  FileQuestion, BookMarked, PenLine, Search,
  ChevronDown, ChevronRight, ChevronLeft, GraduationCap, Hash,
  AlertCircle, Check, Youtube, MoreVertical,
  FolderOpen, Folder, Play, Eye, Layout, LayoutGrid, Users,
  Sparkles, Brain, FlaskConical, StickyNote, ListChecks,
  Lightbulb, BookText, Wand2, ChevronUp, Zap, Lock,
  FileSpreadsheet, ArrowRight, CheckCircle2, ClipboardList, Clock,
  Pencil, AlertTriangle, Filter, Home, ListTree, BarChart3,
} from "lucide-react";
import {
  useSubjects, useCreateChapter, useUpdateChapter,
  useTopics, useCreateTopic, useUpdateTopic,
  useTopicResources, useUploadTopicResource, useDeleteTopicResource, useAddTopicResourceLink,
  useBulkImportCurriculum,
  useBatchContentLectures,
  useContentCoverageSummary,
} from "@/hooks/use-admin";
import { useMyBatches } from "@/hooks/use-teacher";
import * as adminApi from "@/lib/api/admin";
import type { TopicResourceType, Subject, Chapter, Topic, TopicResource, BulkImportPayload, BulkImportSubject } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";
import { MAX_MATERIAL_FILE_SIZE_MB } from "@/lib/upload-limits";
import { AeroBackground } from "@/components/shared/AeroBackground";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_ORIGIN = getApiOrigin() || "http://127.0.0.1:3000";

function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
}

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:[?&]v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function fmtSize(kb?: number) {
  if (!kb) return "";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const TEACHER_PRIMARY_GRADIENT: React.CSSProperties = { background: "linear-gradient(135deg, #4f46e5, #7c3aed)" };

// ─── Resource type config ──────────────────────────────────────────────────────

const RES_TYPES: {
  value: TopicResourceType; label: string; shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; isUrl?: boolean; accept?: string;
}[] = [
    { value: "pdf", label: "Lecture Notes", shortLabel: "Notes", icon: FileText, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", accept: ".pdf" },
    { value: "dpp", label: "DPP Sheet", shortLabel: "DPP", icon: PenLine, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", accept: ".pdf,.doc,.docx" },
    { value: "pyq", label: "PYQ Paper", shortLabel: "PYQ", icon: FileQuestion, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", accept: ".pdf,.doc,.docx" },
    { value: "notes", label: "Reading Material", shortLabel: "Reading", icon: BookMarked, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accept: ".pdf,.doc,.docx,.txt" },
    { value: "video", label: "YouTube Video", shortLabel: "Video", icon: Youtube, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", isUrl: true },
    { value: "link", label: "External Link", shortLabel: "Link", icon: Link2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", isUrl: true },
  ];

function rCfg(type: TopicResourceType) {
  return RES_TYPES.find(r => r.value === type) ?? RES_TYPES[0];
}

// ─── Resource Viewer Modal ───────────────────────────────────────────────────

function ResourceViewerModal({ resource, onClose }: { resource: TopicResource; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", rCfg(resource.type).bg)}>
              {React.createElement(rCfg(resource.type).icon, { className: cn("w-6 h-6", rCfg(resource.type).color) })}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{resource.title}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{resource.type} Resource</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 prose prose-slate max-w-none">
          {resource.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {resource.description}
            </ReactMarkdown>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">No preview available for this resource.</p>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-100 transition-all">
            Close Viewer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Resource Row ──────────────────────────────────────────────────────────────

function ResourceRow({ r, onDelete }: { r: TopicResource; onDelete: () => void }) {
  const cfg = rCfg(String(r.type ?? "").toLowerCase() as TopicResourceType);
  const Icon = cfg.icon;
  const href = r.externalUrl ? resolveUrl(r.externalUrl) : resolveUrl(r.fileUrl ?? undefined);
  const rawYtUrl = r.externalUrl || (r.fileUrl?.includes("youtube.com") || r.fileUrl?.includes("youtu.be") ? r.fileUrl : null);
  const ytId = rawYtUrl ? getYouTubeId(rawYtUrl) : null;
  const [showViewer, setShowViewer] = useState(false);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="group flex items-center gap-3 p-4 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
      >
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", cfg.bg)}>
          <Icon className={cn("w-5 h-5", cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{r.title}</p>
          <div className="flex items-center gap-2 mt-1">
            {r.fileSizeKb ? <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">{fmtSize(r.fileSizeKb)}</span> : null}
            {ytId && <span className="text-[10px] text-red-500 font-black uppercase tracking-wider flex items-center gap-1"><Youtube className="w-3 h-3" /> YouTube</span>}
            {r.description && !r.fileUrl && !r.externalUrl && <span className="text-[10px] text-indigo-500 font-black uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Generated</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          {(r.description && !r.fileUrl && !r.externalUrl) ? (
            <button onClick={() => setShowViewer(true)}
              className="h-8 px-4 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
              <Eye className="w-3.5 h-3.5" /> View Content
            </button>
          ) : href ? (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="h-8 px-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-black text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all flex items-center gap-1.5 shadow-sm">
              <ExternalLink className="w-3.5 h-3.5" /> {ytId ? "Watch" : "Open"}
            </a>
          ) : null}
          <button onClick={onDelete}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
      {showViewer && <ResourceViewerModal resource={r} onClose={() => setShowViewer(false)} />}
    </>
  );
}

// ─── Inline Editable ──────────────────────────────────────────────────────────

function InlineAdd({ placeholder, onSave, onCancel, loading }: any) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2 py-2">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(val.trim()); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="flex-1 h-10 px-4 text-sm bg-white border-2 border-indigo-400 rounded-2xl outline-none shadow-lg shadow-indigo-500/10"
      />
      <div className="flex gap-1.5">
        <button onClick={() => onSave(val.trim())} disabled={loading || !val.trim()} className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition-all shadow-md">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
        <button onClick={onCancel} className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── AI Content Generator Panel ───────────────────────────────────────────────

const AI_CONTENT_TYPES = [
  { id: "dpp", label: "DPP Sheet", desc: "AI-generated Daily Practice Problems with MCQs", icon: PenLine, color: "text-orange-600", bg: "bg-orange-50", saveAs: "dpp" },
  { id: "pyq", label: "PYQ Practice", desc: "Previous Year Question style paper with solutions", icon: FileQuestion, color: "text-violet-600", bg: "bg-violet-50", saveAs: "pyq" },
  { id: "study_guide", label: "Study Guide", desc: "Crisp exam-ready summary for quick revision", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50", saveAs: "notes" },
  { id: "key_concepts", label: "Key Concepts", desc: "Must-know concepts, formulas and definitions", icon: Lightbulb, color: "text-rose-600", bg: "bg-rose-50", saveAs: "notes" },
];

function AiContentPanel({ topicId, topicName, subjectName, chapterName }: any) {
  const [selectedType, setSelectedType] = useState("dpp");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const saveAiRes = useSaveAiGeneratedResource(topicId);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);
    setSavedOk(false);
    try {
      const result = await adminApi.generateTopicAiContent(topicId, {
        contentType: selectedType as any,
        difficulty: difficulty as any,
        length: "standard",
      });
      setGeneratedContent(result.content ?? "");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;
    try {
      const cfg = AI_CONTENT_TYPES.find(t => t.id === selectedType)!;
      await saveAiRes.mutateAsync({
        title: `${cfg.label} — ${topicName}`,
        content: generatedContent,
        resourceType: cfg.saveAs,
      });
      setSavedOk(true);
      toast.success("Saved successfully! Students can now access it.");
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 border-b border-slate-100 bg-indigo-50/30">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">AI Content Studio</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{topicName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">1. Select Content Goal</label>
          <div className="grid grid-cols-1 gap-3">
            {AI_CONTENT_TYPES.map(ct => (
              <button
                key={ct.id}
                onClick={() => { setSelectedType(ct.id); setGeneratedContent(null); }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-3xl border-2 text-left transition-all",
                  selectedType === ct.id ? "border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-500/5" : "border-slate-100 hover:border-slate-200"
                )}
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", ct.bg)}>
                  <ct.icon className={cn("w-6 h-6", ct.color)} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{ct.label}</p>
                  <p className="text-xs text-slate-500 font-medium">{ct.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">2. Difficulty Level</label>
          <div className="flex gap-2">
            {["basic", "intermediate", "advanced"].map(lv => (
              <button
                key={lv}
                onClick={() => setDifficulty(lv)}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border-2",
                  difficulty === lv ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
                )}
              >
                {lv}
              </button>
            ))}
          </div>
        </div>

        {generatedContent ? (
          <div className="space-y-4">
            <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-200 prose prose-indigo max-w-none prose-sm">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
            </div>
            {!savedOk && (
              <button onClick={handleSave} disabled={saveAiRes.isPending} className="w-full h-14 rounded-3xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2">
                {saveAiRes.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                Approve & Publish to Students
              </button>
            )}
          </div>
        ) : (
          <button onClick={handleGenerate} disabled={generating} className="w-full h-14 rounded-3xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3">
            {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Magic...</> : <><Wand2 className="w-5 h-5" /> Generate with AI</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Workspace ───────────────────────────────────────────────────────────

function TeacherTopicWorkspace() {
  const { batchId, topicId } = useParams();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get("subjectId");
  const chapterId = searchParams.get("chapterId");

  const { data: resources = [], isLoading } = useTopicResources(topicId!);
  const { data: subjects = [] } = useSubjects(batchId!);
  const deleteRes = useDeleteTopicResource(topicId!);
  
  const [showAi, setShowAi] = useState(false);

  const subject = subjects.find(s => s.id === subjectId);
  const topic = useMemo(() => {
    if (!subject) return null;
    for (const ch of subject.chapters || []) {
      const t = ch.topics?.find(t => t.id === topicId);
      if (t) return { ...t, chapterName: ch.name };
    }
    return null;
  }, [subject, topicId]);

  const handleDelete = async (r: TopicResource) => {
    if (!confirm(`Permanently delete "${r.title}"?`)) return;
    try { await deleteRes.mutateAsync(r.id); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
            <span style={{ color: subject?.colorCode }}>{subject?.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600">{topic?.chapterName}</span>
          </div>
          <div className="flex items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{topic?.name}</h1>
              <p className="text-slate-500 font-medium mt-1">Audit and manage study materials for this topic</p>
            </div>
            <button onClick={() => setShowAi(true)} className="h-12 px-6 rounded-2xl bg-indigo-600 text-white text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4" /> AI Content Generator
            </button>
          </div>
        </div>

        {/* Resources */}
        <div className="flex-1 overflow-y-auto p-8">
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 rounded-[2rem] bg-white shadow-sm flex items-center justify-center mb-6">
                <Layers className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-2">No Resources Yet</h3>
              <p className="text-slate-400 max-w-sm font-medium">Use the AI Generator or ask an administrator to add materials to this topic.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map(r => <ResourceRow key={r.id} r={r} onDelete={() => handleDelete(r)} />)}
            </div>
          )}
        </div>
      </div>

      <Sheet open={showAi} onOpenChange={setShowAi}>
        <SheetContent side="right" className="p-0 w-full max-w-xl border-l-0 shadow-2xl">
          <AiContentPanel topicId={topicId} topicName={topic?.name} subjectName={subject?.name} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Batch Content Explorer ──────────────────────────────────────────────────

function TeacherBatchContent() {
  const { batchId } = useParams();
  const { data: subjects = [], isLoading } = useSubjects(batchId!);
  const navigate = useNavigate();
  const [openSubjectId, setOpenSubjectId] = useState<string | null>(null);
  const [openChapterId, setOpenChapterId] = useState<string | null>(null);
  const { data: coverage } = useContentCoverageSummary(batchId!);

  const createChapter = useCreateChapter();
  const createTopic = useCreateTopic();
  
  const [addingChapterId, setAddingChapterId] = useState<string | null>(null);
  const [addingTopicId, setAddingTopicId] = useState<string | null>(null);

  const handleAddChapter = async (subjectId: string, name: string) => {
    try {
      await createChapter.mutateAsync({ subjectId, name });
      toast.success("Chapter added");
      setAddingChapterId(null);
    } catch { toast.error("Failed to add chapter"); }
  };

  const handleAddTopic = async (chapterId: string, name: string) => {
    try {
      await createTopic.mutateAsync({ chapterId, name });
      toast.success("Topic added");
      setAddingTopicId(null);
    } catch { toast.error("Failed to add topic"); }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="flex h-full bg-slate-50/50">
      {/* Sidebar Tree */}
      <div className="w-80 border-r border-slate-100 bg-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Curriculum Explorer</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {subjects.map(s => (
            <div key={s.id} className="space-y-1">
              <button 
                onClick={() => setOpenSubjectId(openSubjectId === s.id ? null : s.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all",
                  openSubjectId === s.id ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: s.colorCode + '20' }}>
                    <BookOpen className="w-4 h-4" style={{ color: s.colorCode }} />
                  </div>
                  <span className="text-sm font-black tracking-tight">{s.name}</span>
                </div>
                {openSubjectId === s.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
              </button>

              {openSubjectId === s.id && (
                <div className="pl-4 space-y-1 mt-1">
                  {s.chapters?.map(ch => (
                    <div key={ch.id} className="space-y-1">
                      <button 
                        onClick={() => setOpenChapterId(openChapterId === ch.id ? null : ch.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2.5 rounded-xl transition-all",
                          openChapterId === ch.id ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50 text-slate-500"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Folder className={cn("w-3.5 h-3.5", openChapterId === ch.id ? "text-amber-500" : "text-slate-300")} />
                          <span className="text-[13px] font-bold">{ch.name}</span>
                        </div>
                        {openChapterId === ch.id ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5 opacity-20" />}
                      </button>

                      {openChapterId === ch.id && (
                        <div className="pl-6 space-y-1 mt-1 border-l-2 border-slate-50 ml-3.5">
                          {ch.topics?.map(t => (
                            <Link 
                              key={t.id}
                              to={`/teacher/content/${batchId}/topic/${t.id}?subjectId=${s.id}&chapterId=${ch.id}`}
                              className="group flex items-center justify-between p-2 rounded-lg hover:bg-indigo-50 transition-all"
                            >
                              <div className="flex flex-col">
                                <span className="text-[12px] font-medium text-slate-500 group-hover:text-indigo-600">{t.name}</span>
                                {coverage && (
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {(() => {
                                      const tc = coverage.subjects.find(sub => sub.id === s.id)?.chapters.find(chap => chap.id === ch.id)?.topics.find(top => top.id === t.id);
                                      if (!tc) return null;
                                      return (
                                        <>
                                          {tc.studyMaterialCount > 0 && <span className="text-[8px] font-black bg-blue-50 text-blue-500 px-1 py-0.5 rounded-md">SM {tc.studyMaterialCount}</span>}
                                          {tc.dppCount > 0 && <span className="text-[8px] font-black bg-orange-50 text-orange-500 px-1 py-0.5 rounded-md">DPP {tc.dppCount}</span>}
                                          {tc.pyqCount > 0 && <span className="text-[8px] font-black bg-violet-50 text-violet-500 px-1 py-0.5 rounded-md">PYQ {tc.pyqCount}</span>}
                                        </>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-400 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </Link>
                          ))}
                          {addingTopicId === ch.id ? (
                            <InlineAdd placeholder="New topic name..." onSave={(n: string) => handleAddTopic(ch.id, n)} onCancel={() => setAddingTopicId(null)} loading={createTopic.isPending} />
                          ) : (
                            <button onClick={() => setAddingTopicId(ch.id)} className="w-full py-1.5 px-2 text-left text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                              + Add Topic
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {addingChapterId === s.id ? (
                    <InlineAdd placeholder="New chapter name..." onSave={(n: string) => handleAddChapter(s.id, n)} onCancel={() => setAddingChapterId(null)} loading={createChapter.isPending} />
                  ) : (
                    <button onClick={() => setAddingChapterId(s.id)} className="w-full py-2 px-3 text-left text-[11px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                      + Add Chapter
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Area */}
      <div className="flex-1 overflow-hidden relative">
        <AeroBackground />
        <div className="relative z-10 h-full">
          <Routes>
            <Route index element={
              <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-8">
                  <ListTree className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Curriculum Workspace</h2>
                <p className="text-slate-500 max-w-md font-medium leading-relaxed">
                  Select a topic from the sidebar to audit its resources or generate new AI-powered study materials.
                </p>
              </div>
            } />
            <Route path="topic/:topicId" element={<TeacherTopicWorkspace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

// ─── Batch Selector ──────────────────────────────────────────────────────────

const TeacherBatchSelector = () => {
  const { data: batches = [], isLoading } = useMyBatches();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filtered = batches.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div className="min-h-[80vh] flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-6 py-12 space-y-12">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Course Curriculum</h1>
              <p className="text-slate-500 text-lg font-medium">Audit and enhance your teaching materials with AI</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            placeholder="Search your assigned courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-16 pl-14 pr-6 bg-white border border-slate-100 rounded-[2rem] outline-none focus:border-indigo-400 shadow-xl shadow-slate-200/40 transition-all text-lg font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(b => (
            <motion.div
              key={b.id}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => navigate(`/teacher/content/${b.id}`)}
              className="group relative bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden border-b-4 border-b-slate-100 hover:border-b-indigo-500"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-500">
                    <BookOpen className="w-7 h-7 text-slate-300 group-hover:text-white transition-all duration-500" />
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                    {b.status}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{b.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-100">
                      {b.examTarget}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-100">
                      {b.class}
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">{b.studentCount || 0} Students</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:translate-x-2 transition-all duration-300">
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Entry Point ─────────────────────────────────────────────────────────────

const TeacherContentPage = () => {
  return (
    <Routes>
      <Route index element={<TeacherBatchSelector />} />
      <Route path=":batchId/*" element={<TeacherBatchContent />} />
    </Routes>
  );
};

export default TeacherContentPage;
