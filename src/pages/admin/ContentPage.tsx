import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, BookOpen, FileText, X,
  Layers, Upload, Trash2, ExternalLink, Link2,
  FileQuestion, BookMarked, PenLine, Search,
  ChevronDown, ChevronRight, ChevronLeft, GraduationCap, Hash,
  AlertCircle, Check, Youtube, MoreVertical,
  FolderOpen, Folder, Play, Eye, LayoutGrid, Users,
  Sparkles, Brain, FlaskConical, StickyNote, ListChecks,
  Lightbulb, BookText, Wand2, ChevronUp, Zap, Lock,
} from "lucide-react";
import {
  useBatches,
  useSubjects, useCreateSubject,
  useChapters, useCreateChapter,
  useTopics, useCreateTopic,
  useTopicResources, useUploadTopicResource, useDeleteTopicResource, useAddTopicResourceLink,
} from "@/hooks/use-admin";
import type { TopicResourceType, Subject, Chapter, Topic, TopicResource } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();

function resolveUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url}`;
}

function isYouTube(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function fmtSize(kb?: number) {
  if (!kb) return "";
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

// ─── Resource type config ──────────────────────────────────────────────────────

const RES_TYPES: {
  value: TopicResourceType; label: string; shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; isUrl?: boolean; accept?: string;
}[] = [
  { value: "pdf",   label: "PDF Notes",  shortLabel: "PDF",     icon: FileText,     color: "text-red-600",     bg: "bg-red-50",     border: "border-red-200",   accept: ".pdf" },
  { value: "dpp",   label: "DPP",        shortLabel: "DPP",     icon: PenLine,      color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-200", accept: ".pdf,.doc,.docx" },
  { value: "pyq",   label: "PYQ",        shortLabel: "PYQ",     icon: FileQuestion, color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200", accept: ".pdf,.doc,.docx" },
  { value: "notes", label: "Notes",      shortLabel: "Notes",   icon: BookMarked,   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accept: ".pdf,.doc,.docx,.txt" },
  { value: "video", label: "YouTube",    shortLabel: "YouTube", icon: Youtube,      color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",  isUrl: true },
  { value: "link",  label: "Link",       shortLabel: "Link",    icon: Link2,        color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",  isUrl: true },
];

function rCfg(type: TopicResourceType) {
  return RES_TYPES.find(r => r.value === type) ?? RES_TYPES[0];
}

// ─── Inline Editable Input ────────────────────────────────────────────────────

function InlineAdd({
  placeholder, onSave, onCancel, loading,
}: { placeholder: string; onSave: (v: string) => void; onCancel: () => void; loading?: boolean }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-1.5 py-1">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(val.trim()); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="flex-1 h-8 px-3 text-sm bg-white border-2 border-blue-400 rounded-xl outline-none placeholder:text-slate-300"
      />
      <button
        onClick={() => val.trim() && onSave(val.trim())}
        disabled={loading || !val.trim()}
        className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onCancel}
        className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Resource Card ─────────────────────────────────────────────────────────────

function ResourceCard({ r, onDelete }: { r: TopicResource; onDelete: () => void }) {
  const cfg = rCfg(r.type);
  const Icon = cfg.icon;
  const href = r.externalUrl ? resolveUrl(r.externalUrl) : resolveUrl(r.fileUrl ?? undefined);
  const ytId = r.externalUrl ? getYouTubeId(r.externalUrl) : null;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative bg-white border border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
    >
      {/* YouTube thumbnail strip */}
      {ytId && (
        <div className="relative h-28 bg-slate-900 overflow-hidden">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt={r.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
          <div className={cn("absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white", "bg-red-600")}>
            <Youtube className="w-2.5 h-2.5" /> YouTube
          </div>
        </div>
      )}

      {/* Non-YouTube file type banner */}
      {!ytId && (
        <div className={cn("flex items-center gap-2 px-3 py-2 border-b", cfg.bg, cfg.border)}>
          <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
          <span className={cn("text-[10px] font-black uppercase tracking-widest", cfg.color)}>{cfg.shortLabel}</span>
          {r.fileSizeKb && <span className="ml-auto text-[10px] text-slate-400">{fmtSize(r.fileSizeKb)}</span>}
        </div>
      )}

      <div className="p-3">
        <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{r.title}</p>
        {r.description && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{r.description}</p>}
        {r.externalUrl && !ytId && (
          <p className="text-[10px] text-blue-500 mt-1 truncate">{r.externalUrl}</p>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-between px-3 pb-3">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700">
            <ExternalLink className="w-3 h-3" />
            {ytId ? "Watch" : r.type === "pdf" || r.type === "dpp" || r.type === "pyq" ? "View PDF" : "Open"}
          </a>
        ) : <span />}
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Upload Panel ──────────────────────────────────────────────────────────────

function UploadPanel({ topicId, topicName }: { topicId: string; topicName: string }) {
  const { data: resources = [], isLoading } = useTopicResources(topicId);
  const upload = useUploadTopicResource(topicId);
  const deleteRes = useDeleteTopicResource(topicId);
  const addLink = useAddTopicResourceLink(topicId);

  const [activeType, setActiveType] = useState<TopicResourceType>("pdf");
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [filterType, setFilterType] = useState<TopicResourceType | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const activeCfg = rCfg(activeType);
  const isUrlType = activeCfg.isUrl;

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be ≤ 5 MB"); return; }
    const t = title.trim() || file.name.replace(/\.[^.]+$/, "");
    try {
      await upload.mutateAsync({ file, type: activeType, title: t });
      toast.success(`${activeCfg.label} uploaded`);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch { toast.error("Upload failed — please try again"); }
  };

  const handleAddLink = async () => {
    if (!urlInput.trim()) { toast.error("Paste a URL first"); return; }
    const t = title.trim() || (isYouTube(urlInput) ? "YouTube Video" : "External Link");
    const type: TopicResourceType = isYouTube(urlInput) ? "video" : activeType;
    try {
      await addLink.mutateAsync({ title: t, type, externalUrl: urlInput.trim() });
      toast.success("Link saved");
      setTitle(""); setUrlInput("");
    } catch { toast.error("Failed to save link"); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (r: TopicResource) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    try { await deleteRes.mutateAsync(r.id); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  const filtered = filterType === "all" ? resources : resources.filter(r => r.type === filterType);
  const typeCounts = RES_TYPES.map(rt => ({ ...rt, count: resources.filter(r => r.type === rt.value).length }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">Topic Resources</p>
            <h2 className="text-lg font-black text-slate-900 leading-tight">{topicName}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-bold">{resources.length} item{resources.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {/* Type count pills */}
        {resources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setFilterType("all")}
              className={cn("px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                filterType === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              All ({resources.length})
            </button>
            {typeCounts.filter(t => t.count > 0).map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                    filterType === t.value ? cn(t.bg, t.color, t.border) : "bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent"
                  )}
                >
                  <Icon className="w-3 h-3" /> {t.shortLabel} ({t.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Resource Section ── */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Add Resource</p>

        {/* Type selector */}
        <div className="grid grid-cols-6 gap-1.5 mb-3">
          {RES_TYPES.map(rt => {
            const Icon = rt.icon;
            const sel = activeType === rt.value;
            return (
              <button
                key={rt.value}
                onClick={() => { setActiveType(rt.value); setMode(rt.isUrl ? "link" : "upload"); }}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 rounded-xl border text-center transition-all",
                  sel ? cn(rt.bg, rt.color, rt.border, "shadow-sm") : "bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-black uppercase tracking-wide leading-none">{rt.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Mode toggle for file types */}
        {!isUrlType && (
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 mb-3 w-fit">
            {(["upload", "link"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn("px-4 py-1.5 rounded-[10px] text-[11px] font-black uppercase tracking-wide transition-all",
                  mode === m ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"
                )}>
                {m === "upload" ? "Upload File" : "Paste URL"}
              </button>
            ))}
          </div>
        )}

        {/* Title input */}
        <input
          placeholder="Title (auto-filled from filename if empty)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full h-9 px-3.5 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors mb-2"
        />

        {/* Upload or Link input */}
        {(mode === "link" || isUrlType) ? (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {isYouTube(urlInput)
                  ? <Youtube className="w-4 h-4 text-red-500" />
                  : <Link2 className="w-4 h-4 text-slate-400" />}
              </div>
              <input
                placeholder="https://youtube.com/... or any URL"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAddLink(); }}
                className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            <button
              onClick={handleAddLink}
              disabled={addLink.isPending || !urlInput.trim()}
              className="h-9 px-4 rounded-xl font-black text-white text-xs flex items-center gap-1.5 disabled:opacity-40 transition-opacity shrink-0"
              style={{ background: "linear-gradient(135deg, #013889,#0257c8)" }}
            >
              {addLink.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        ) : (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
              dragging
                ? "border-blue-400 bg-blue-50 scale-[1.01]"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
            )}
          >
            {upload.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm font-bold text-blue-600">Uploading…</p>
              </div>
            ) : (
              <>
                <div className={cn("w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center", activeCfg.bg)}>
                  <Upload className={cn("w-5 h-5", activeCfg.color)} />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Drop {activeCfg.label} here or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">Max 5 MB · {activeCfg.accept?.split(",").join(", ")}</p>
              </>
            )}
            <input ref={fileRef} type="file" accept={activeCfg.accept} className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>
        )}
      </div>

      {/* ── Resource Grid ── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-base font-black text-slate-500">No resources yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Upload a PDF, add a DPP or PYQ file, or paste a YouTube link above.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">No {filterType} resources yet.</p>
            <button onClick={() => setFilterType("all")} className="text-xs text-blue-500 font-bold mt-1 hover:underline">Show all</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map(r => (
                <ResourceCard key={r.id} r={r} onDelete={() => handleDelete(r)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tree Navigator ────────────────────────────────────────────────────────────
// Shows Subjects → Chapters → Topics in a single scroll pane

type TreeState = {
  subjectId: string | null;
  chapterId: string | null;
};

function TreeNav({
  batchId, examTarget, selectedTopic, onSelectTopic, onAddSubject,
}: {
  batchId: string;
  examTarget: string;
  selectedTopic: { topic: Topic; chapter: Chapter; subject: Subject } | null;
  onSelectTopic: (topic: Topic, chapter: Chapter, subject: Subject) => void;
  onAddSubject: () => void;
}) {
  const { data: subjects = [], isLoading: sLoading } = useSubjects(batchId);
  const createChapter = useCreateChapter();
  const createTopic = useCreateTopic();
  const [search, setSearch] = useState("");
  const [openSubjects, setOpenSubjects] = useState<Set<string>>(new Set());
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [addingChapter, setAddingChapter] = useState<string | null>(null); // subjectId
  const [addingTopic, setAddingTopic] = useState<string | null>(null);     // chapterId

  const toggleSubject = (id: string) =>
    setOpenSubjects(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleChapter = (id: string) =>
    setOpenChapters(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const matchSearch = (name: string) => name.toLowerCase().includes(search.toLowerCase());

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-black text-slate-700">Subjects &amp; Topics</p>
          <button
            onClick={onAddSubject}
            className="flex items-center gap-1 h-7 px-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-black transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Subject
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search topics…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {sLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-400" /></div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-10 px-4">
            <GraduationCap className="w-8 h-8 mx-auto text-slate-200 mb-2" />
            <p className="text-xs text-slate-400 font-semibold">No subjects yet</p>
            <button onClick={onAddSubject} className="text-xs text-blue-500 font-bold mt-2 hover:underline">+ Add first subject</button>
          </div>
        ) : (
          subjects.map(subject => {
            const subOpen = openSubjects.has(subject.id);
            return (
              <SubjectTree
                key={subject.id}
                subject={subject}
                open={subOpen}
                onToggle={() => toggleSubject(subject.id)}
                search={search}
                openChapters={openChapters}
                onToggleChapter={toggleChapter}
                addingChapter={addingChapter}
                setAddingChapter={setAddingChapter}
                addingTopic={addingTopic}
                setAddingTopic={setAddingTopic}
                createChapter={createChapter}
                createTopic={createTopic}
                selectedTopicId={selectedTopic?.topic.id ?? null}
                onSelectTopic={onSelectTopic}
                matchSearch={matchSearch}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function SubjectTree({
  subject, open, onToggle, search, openChapters, onToggleChapter,
  addingChapter, setAddingChapter, addingTopic, setAddingTopic,
  createChapter, createTopic, selectedTopicId, onSelectTopic, matchSearch,
}: any) {
  const { data: chapters = [], isLoading } = useChapters(open || search ? subject.id : "");

  const visibleChapters = search
    ? chapters.filter((ch: Chapter) => matchSearch(ch.name) ||
        (ch as any).topics?.some?.((t: Topic) => matchSearch(t.name)))
    : chapters;

  const handleAddChapter = async (name: string) => {
    try {
      await createChapter.mutateAsync({ subjectId: subject.id, name });
      toast.success("Chapter created");
      setAddingChapter(null);
      if (!open) onToggle();
    } catch { toast.error("Failed to create chapter"); }
  };

  const accentColor = subject.colorCode ?? "#3B82F6";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100">
      {/* Subject row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors text-left group"
      >
        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform"
          style={{ background: `${accentColor}18`, color: accentColor }}>
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-black text-slate-800 flex-1 truncate">{subject.name}</span>
        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${accentColor}15`, color: accentColor }}>
          {subject.examTarget?.toUpperCase()}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Chapters */}
      <AnimatePresence>
        {(open || search) && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50/80 border-t border-slate-100 px-2 py-1.5 space-y-0.5">
              {/* Add chapter input */}
              {addingChapter === subject.id && (
                <div className="px-1">
                  <InlineAdd
                    placeholder="Chapter name…"
                    onSave={handleAddChapter}
                    onCancel={() => setAddingChapter(null)}
                    loading={createChapter.isPending}
                  />
                </div>
              )}

              {isLoading ? (
                <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-blue-400" /></div>
              ) : chapters.length === 0 && !addingChapter ? (
                <div className="text-center py-3">
                  <p className="text-[11px] text-slate-400">No chapters — </p>
                  <button onClick={() => setAddingChapter(subject.id)}
                    className="text-[11px] text-blue-500 font-bold hover:underline">add one</button>
                </div>
              ) : (
                visibleChapters.map((chapter: Chapter) => (
                  <ChapterTree
                    key={chapter.id}
                    chapter={chapter}
                    subjectId={subject.id}
                    open={openChapters.has(chapter.id)}
                    onToggle={() => onToggleChapter(chapter.id)}
                    search={search}
                    addingTopic={addingTopic}
                    setAddingTopic={setAddingTopic}
                    createTopic={createTopic}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={(t: Topic) => onSelectTopic(t, chapter, subject)}
                    matchSearch={matchSearch}
                    accentColor={accentColor}
                  />
                ))
              )}

              {/* Add chapter button */}
              {addingChapter !== subject.id && (
                <button
                  onClick={() => setAddingChapter(subject.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all"
                >
                  <Plus className="w-3 h-3" /> Add Chapter
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChapterTree({
  chapter, open, onToggle, search, addingTopic, setAddingTopic,
  createTopic, selectedTopicId, onSelectTopic, matchSearch, accentColor,
}: any) {
  const { data: topics = [], isLoading } = useTopics(open || search ? chapter.id : "");

  const visibleTopics = search ? topics.filter((t: Topic) => matchSearch(t.name)) : topics;

  const handleAddTopic = async (name: string) => {
    try {
      await createTopic.mutateAsync({ chapterId: chapter.id, name, estimatedStudyMinutes: 60 });
      toast.success("Topic created");
      setAddingTopic(null);
      if (!open) onToggle();
    } catch { toast.error("Failed to create topic"); }
  };

  return (
    <div className="ml-2">
      {/* Chapter row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white transition-colors text-left group"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {open
            ? <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            : <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          <span className="text-xs font-bold text-slate-700 truncate">{chapter.name}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {topics.length > 0 && (
            <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full">
              {topics.length}
            </span>
          )}
          <ChevronRight className={cn("w-3 h-3 text-slate-300 transition-transform", open && "rotate-90")} />
        </div>
      </button>

      {/* Topics */}
      <AnimatePresence>
        {(open || search) && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="ml-4 border-l-2 pl-2 pb-1 space-y-0.5" style={{ borderColor: `${accentColor}30` }}>
              {/* Add topic input */}
              {addingTopic === chapter.id && (
                <InlineAdd
                  placeholder="Topic name…"
                  onSave={handleAddTopic}
                  onCancel={() => setAddingTopic(null)}
                  loading={createTopic.isPending}
                />
              )}

              {isLoading ? (
                <div className="py-2 flex justify-center"><Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" /></div>
              ) : visibleTopics.length === 0 && !addingTopic ? (
                <button onClick={() => setAddingTopic(chapter.id)}
                  className="w-full text-left text-[11px] text-slate-400 hover:text-blue-500 py-1.5 px-2 font-semibold">
                  + Add first topic
                </button>
              ) : (
                visibleTopics.map((t: Topic) => {
                  const sel = selectedTopicId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTopic(t)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all text-xs font-semibold",
                        sel
                          ? "text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-900"
                      )}
                      style={sel ? { background: accentColor } : {}}
                    >
                      <Hash className={cn("w-3 h-3 shrink-0", sel ? "text-white/60" : "text-slate-300")} />
                      <span className="flex-1 truncate">{t.name}</span>
                    </button>
                  );
                })
              )}

              {/* Add topic button */}
              {addingTopic !== chapter.id && (
                <button
                  onClick={() => setAddingTopic(chapter.id)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-blue-500 hover:bg-white rounded-xl transition-all"
                >
                  <Plus className="w-3 h-3" /> Add Topic
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Add Subject Modal ────────────────────────────────────────────────────────

const PRESET_SUBJECTS = [
  { name: "Physics",          color: "#3B82F6", icon: "⚡" },
  { name: "Chemistry",        color: "#10B981", icon: "🧪" },
  { name: "Mathematics",      color: "#F59E0B", icon: "📐" },
  { name: "Biology",          color: "#22C55E", icon: "🧬" },
  { name: "English",          color: "#8B5CF6", icon: "📝" },
  { name: "History",          color: "#EC4899", icon: "📜" },
  { name: "Computer Science", color: "#0EA5E9", icon: "💻" },
  { name: "Geography",        color: "#14B8A6", icon: "🌍" },
  { name: "Economics",        color: "#F97316", icon: "📊" },
];

function AddSubjectModal({ batchId, examTarget, onClose }: { batchId: string; examTarget: string; onClose: () => void }) {
  const createSubject = useCreateSubject();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [error, setError] = useState("");

  const handleCreate = async (subjectName: string, subjectColor?: string) => {
    if (!subjectName.trim()) return;
    setError("");
    try {
      await createSubject.mutateAsync({ name: subjectName.trim(), examTarget, batchId, colorCode: subjectColor ?? color });
      toast.success(`${subjectName} added`);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to create subject");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-black text-slate-900">Add Subject</h3>
            <p className="text-xs text-slate-400 mt-0.5">Choose from presets or create custom</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Preset grid */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5">Quick add</p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_SUBJECTS.map(s => (
                <button
                  key={s.name}
                  onClick={() => handleCreate(s.name, s.color)}
                  disabled={createSubject.isPending}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm text-left transition-all disabled:opacity-40"
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="text-xs font-bold text-slate-700 leading-tight">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom subject */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2.5">Custom subject</p>
            <div className="flex gap-2 mb-3">
              <input
                placeholder="Subject name…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(name); }}
                className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition-colors"
              />
            </div>
            {/* Color */}
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Color:</p>
              {["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#0EA5E9","#F97316"].map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn("w-6 h-6 rounded-full transition-all", color === c && "ring-2 ring-offset-2 ring-slate-400 scale-110")}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => handleCreate(name)}
            disabled={createSubject.isPending || !name.trim()}
            className="w-full h-11 rounded-2xl text-white text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "linear-gradient(135deg, #013889,#0257c8)" }}
          >
            {createSubject.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create {name.trim() || "Subject"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── AI Content Generator Panel ───────────────────────────────────────────────

const AI_CONTENT_TYPES = [
  {
    id: "lesson",
    label: "Lesson Notes",
    desc: "Comprehensive markdown notes with explanations, examples & key points",
    icon: BookText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    accent: "#2563EB",
    badge: "Most Popular",
  },
  {
    id: "study_guide",
    label: "Study Guide",
    desc: "Structured revision guide with summaries, mind-maps & quick recall",
    icon: Brain,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    accent: "#7C3AED",
    badge: null,
  },
  {
    id: "practice_questions",
    label: "Practice Questions",
    desc: "MCQs, short answers & numericals with detailed solutions",
    icon: FlaskConical,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    accent: "#059669",
    badge: null,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    desc: "Bite-sized Q&A cards for quick concept recall and spaced repetition",
    icon: StickyNote,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "#D97706",
    badge: null,
  },
  {
    id: "key_concepts",
    label: "Key Concepts",
    desc: "Bulleted list of must-know concepts, formulas and definitions",
    icon: Lightbulb,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    accent: "#E11D48",
    badge: null,
  },
  {
    id: "checklist",
    label: "Revision Checklist",
    desc: "Topic checklist with subtopics students can tick off as they study",
    icon: ListChecks,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    accent: "#0D9488",
    badge: null,
  },
];

const DIFFICULTY_LEVELS = [
  { id: "basic",        label: "Basic",        desc: "Introductory, easy language" },
  { id: "intermediate", label: "Intermediate", desc: "Standard curriculum depth"   },
  { id: "advanced",     label: "Advanced",     desc: "Competitive exam level"       },
];

const LENGTH_OPTIONS = [
  { id: "brief",    label: "Brief",    desc: "~300 words" },
  { id: "standard", label: "Standard", desc: "~800 words" },
  { id: "detailed", label: "Detailed", desc: "~1500 words" },
];

function AiContentPanel({ topicName, subjectName, chapterName }: {
  topicName: string;
  subjectName: string;
  chapterName: string;
}) {
  const [selectedType, setSelectedType] = useState("lesson");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [length, setLength] = useState("standard");
  const [extraContext, setExtraContext] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectedTypeCfg = AI_CONTENT_TYPES.find(t => t.id === selectedType)!;

  const handleGenerate = () => {
    // Placeholder — AI not wired yet
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-violet-50 to-blue-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">AI Content Generator</p>
            </div>
            <h2 className="text-base font-black text-slate-900 leading-tight mt-1">{topicName}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {subjectName} · {chapterName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-wide">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* ── Step 1: Content type ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">
            1 · Choose Content Type
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {AI_CONTENT_TYPES.map(ct => {
              const Icon = ct.icon;
              const sel = selectedType === ct.id;
              return (
                <motion.button
                  key={ct.id}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedType(ct.id)}
                  className={cn(
                    "relative text-left p-3.5 rounded-2xl border-2 transition-all group",
                    sel
                      ? cn(ct.bg, ct.border, "shadow-md")
                      : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
                  )}
                >
                  {ct.badge && (
                    <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                      {ct.badge}
                    </span>
                  )}
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 transition-colors",
                    sel ? ct.bg : "bg-slate-100"
                  )}>
                    <Icon className={cn("w-4 h-4", sel ? ct.color : "text-slate-400")} />
                  </div>
                  <p className={cn("text-xs font-black leading-tight mb-1", sel ? ct.color : "text-slate-700")}>
                    {ct.label}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{ct.desc}</p>
                  {sel && (
                    <div className="absolute bottom-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: ct.accent }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Step 2: Settings ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-3">
            2 · Settings
          </p>
          <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">

            {/* Difficulty */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Difficulty Level</p>
              <div className="flex gap-2">
                {DIFFICULTY_LEVELS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-xl text-center text-[11px] font-black border-2 transition-all",
                      difficulty === d.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <p>{d.label}</p>
                    <p className={cn("text-[9px] font-medium mt-0.5 leading-tight", difficulty === d.id ? "text-white/60" : "text-slate-400")}>
                      {d.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Content Length</p>
              <div className="flex gap-2">
                {LENGTH_OPTIONS.map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={cn(
                      "flex-1 py-2 px-2 rounded-xl text-center text-[11px] font-black border-2 transition-all",
                      length === l.id
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    <p>{l.label}</p>
                    <p className={cn("text-[9px] font-medium mt-0.5", length === l.id ? "text-violet-400" : "text-slate-400")}>
                      {l.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Step 3: Extra context ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
            3 · Additional Context <span className="normal-case font-semibold text-slate-300">(optional)</span>
          </p>
          <textarea
            value={extraContext}
            onChange={e => setExtraContext(e.target.value)}
            placeholder={`e.g. "Focus on JEE applications of ${topicName}", "Include solved numericals", "Add common mistakes section"…`}
            rows={3}
            className="w-full px-4 py-3 text-sm bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-violet-400 transition-colors resize-none placeholder:text-slate-300 leading-relaxed"
          />
        </div>

        {/* ── Generate button ── */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 relative overflow-hidden shadow-lg shadow-violet-500/20 transition-all disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #6D28D9 0%, #2563EB 100%)" }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate {selectedTypeCfg.label} with AI
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full ml-1">
                SOON
              </span>
            </>
          )}
        </motion.button>

        {/* ── Preview / placeholder ── */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/60 bg-white/80">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Preview</p>
            <div className="ml-auto flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">AI Not Connected</span>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {/* Simulated skeleton lines */}
            {[85, 100, 70, 95, 55, 100, 75, 90, 60].map((w, i) => (
              <div
                key={i}
                className={cn("h-2.5 rounded-full bg-slate-200 animate-pulse", i === 0 && "h-4 mb-4")}
                style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }}
              />
            ))}
            <div className="flex items-center justify-center gap-3 pt-6 pb-2">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-500">AI content will appear here</p>
                <p className="text-[11px] text-slate-400">after you connect the AI backend</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature info chips ── */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          {[
            { icon: Brain, label: "Context-Aware", sub: "Uses topic + chapter context" },
            { icon: BookMarked, label: "Curriculum-Fit", sub: "Aligned to exam syllabus" },
            { icon: Zap, label: "One-Click Save", sub: "Auto-saves as resource" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] font-black text-slate-600 leading-tight">{label}</p>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{sub}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Course Card (used in grid) ───────────────────────────────────────────────

function CourseCard({ batch, onClick }: { batch: any; onClick: () => void }) {
  const statusColor =
    batch.status === "active" ? "#10B981" :
    batch.status === "completed" ? "#3B82F6" : "#94A3B8";
  const statusBg =
    batch.status === "active" ? "bg-emerald-50 text-emerald-700" :
    batch.status === "completed" ? "bg-blue-50 text-blue-700" :
    "bg-slate-100 text-slate-500";

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 text-left overflow-hidden transition-all w-full"
    >
      {/* Thumbnail or gradient */}
      {batch.thumbnailUrl ? (
        <img
          src={resolveUrl(batch.thumbnailUrl)}
          alt={batch.name}
          className="w-full h-36 object-cover"
        />
      ) : (
        <div className="w-full h-36 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={cn("text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full", statusBg)}>
            {batch.status}
          </span>
          {batch.examTarget && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              {batch.examTarget}
            </span>
          )}
          {batch.class && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
              Class {batch.class}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-black text-slate-900 leading-snug mb-1 group-hover:text-blue-700 transition-colors line-clamp-2">
          {batch.name}
        </h3>

        {/* Description */}
        {batch.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{batch.description}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 mt-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <Users className="w-3 h-3" />
            {batch.enrolledCount ?? 0} enrolled
          </div>
          {batch.isPaid && batch.feeAmount && (
            <div className="text-[11px] font-black text-emerald-600 ml-auto">
              ₹{Number(batch.feeAmount).toLocaleString()}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors ml-auto" />
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ContentPage = () => {
  const { data: batches = [], isLoading: batchesLoading } = useBatches();
  const batchList = Array.isArray(batches) ? batches : [];

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<{
    topic: Topic; chapter: Chapter; subject: Subject;
  } | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [rightTab, setRightTab] = useState<"resources" | "ai">("resources");

  const selectedBatch = batchList.find(b => b.id === selectedBatchId);

  const filteredBatches = batchList.filter(b =>
    b.name.toLowerCase().includes(batchSearch.toLowerCase())
  );

  const handleSelectBatch = (id: string) => {
    if (id !== selectedBatchId) {
      setSelectedBatchId(id);
      setSelectedEntry(null);
    }
  };

  const handleBack = () => {
    setSelectedBatchId(null);
    setSelectedEntry(null);
    setBatchSearch("");
  };

  // ── Phase 1: No course selected — full-width course grid ──────────────────
  if (!selectedBatch) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Content Manager</p>
          <h1 className="text-2xl font-black text-slate-900">Your Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Select a course to manage its subjects, chapters, topics and resources.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            placeholder="Search courses…"
            value={batchSearch}
            onChange={e => setBatchSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-400 shadow-sm transition-colors"
          />
        </div>

        {/* Course cards grid */}
        {batchesLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-500">
              {batchSearch ? "No courses match your search" : "No courses yet"}
            </p>
            {!batchSearch && (
              <p className="text-sm text-slate-400 mt-1">Create a course from the Batches page first.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredBatches.map(b => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CourseCard batch={b} onClick={() => handleSelectBatch(b.id)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  }

  // ── Phase 2: Course selected — header + tree + content ───────────────────
  const statusBg =
    selectedBatch.status === "active" ? "bg-emerald-100 text-emerald-700" :
    selectedBatch.status === "completed" ? "bg-blue-100 text-blue-700" :
    "bg-slate-100 text-slate-500";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 overflow-hidden">

      {/* ── Course Header Bar ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-5 py-3">
        <div className="flex items-center gap-3">
          {/* Back */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 font-bold transition-colors shrink-0 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Courses
          </button>

          <span className="text-slate-200 text-lg shrink-0">/</span>

          {/* Course identity */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-black text-slate-900 truncate">{selectedBatch.name}</h1>
                <span className={cn("text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0", statusBg)}>
                  {selectedBatch.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                {[selectedBatch.examTarget, selectedBatch.class ? `Class ${selectedBatch.class}` : null, selectedBatch.enrolledCount != null ? `${selectedBatch.enrolledCount} students` : null].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {/* Breadcrumb trail — shows when topic is selected */}
          {selectedEntry && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-1.5 flex-wrap max-w-md">
              <span className="font-semibold" style={{ color: selectedEntry.subject.colorCode ?? "#6B7280" }}>
                {selectedEntry.subject.name}
              </span>
              <ChevronRight className="w-3 h-3 shrink-0 text-slate-300" />
              <span className="font-semibold text-amber-600">{selectedEntry.chapter.name}</span>
              <ChevronRight className="w-3 h-3 shrink-0 text-slate-300" />
              <span className="font-bold text-slate-700">{selectedEntry.topic.name}</span>
            </div>
          )}

          {/* Add Subject */}
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-white text-xs font-black shrink-0 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg,#013889,#0257c8)" }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </button>
        </div>
      </div>

      {/* ── Body: Tree + Content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Tree Navigator */}
        <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
          <TreeNav
            batchId={selectedBatch.id}
            examTarget={selectedBatch.examTarget}
            selectedTopic={selectedEntry}
            onSelectTopic={(topic, chapter, subject) => { setSelectedEntry({ topic, chapter, subject }); setRightTab("resources"); }}
            onAddSubject={() => setShowAddSubject(true)}
          />
        </div>

        {/* Right: Resource workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          {!selectedEntry ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center">
                <Layers className="w-10 h-10 text-blue-300" />
              </div>
              <div className="max-w-sm">
                <p className="text-lg font-black text-slate-700">Select a Topic</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Expand any subject in the tree on the left, open a chapter, then click a topic to start managing its resources.
                </p>
              </div>
              {/* Resource type guide */}
              <div className="grid grid-cols-3 gap-2 mt-1 w-full max-w-xs">
                {RES_TYPES.map(rt => {
                  const Icon = rt.icon;
                  return (
                    <div key={rt.value} className={cn("flex items-center gap-2 px-3 py-2 rounded-2xl border", rt.bg, rt.border)}>
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", rt.color)} />
                      <span className={cn("text-xs font-bold", rt.color)}>{rt.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="shrink-0 flex items-center gap-1 px-5 pt-4 pb-0 border-b border-slate-100">
                <button
                  onClick={() => setRightTab("resources")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-black rounded-t-xl border-b-2 transition-all",
                    rightTab === "resources"
                      ? "border-blue-600 text-blue-700 bg-blue-50/60"
                      : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  Resources
                </button>
                <button
                  onClick={() => setRightTab("ai")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-black rounded-t-xl border-b-2 transition-all",
                    rightTab === "ai"
                      ? "border-violet-600 text-violet-700 bg-violet-50/60"
                      : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  AI Generate
                  <span className="text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                </button>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {rightTab === "resources" ? (
                  <UploadPanel topicId={selectedEntry.topic.id} topicName={selectedEntry.topic.name} />
                ) : (
                  <AiContentPanel
                    topicName={selectedEntry.topic.name}
                    subjectName={selectedEntry.subject.name}
                    chapterName={selectedEntry.chapter.name}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showAddSubject && selectedBatch && (
          <AddSubjectModal
            key="add-subject"
            batchId={selectedBatch.id}
            examTarget={selectedBatch.examTarget}
            onClose={() => setShowAddSubject(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentPage;
