import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Loader2, ChevronRight, BookOpen, FileText, X, Lock,
  Layers, Hash, Clock, Upload, Trash2, ExternalLink,
  FileQuestion, Film, BookMarked, PenLine, GraduationCap, Trophy,
} from "lucide-react";
import {
  useSubjects, useCreateSubject,
  useChapters, useCreateChapter,
  useTopics, useCreateTopic,
  useTopicResources, useUploadTopicResource, useDeleteTopicResource,
  useScopeResources, useUploadScopeResource, useDeleteScopeResource,
} from "@/hooks/use-admin";
import { useBatches } from "@/hooks/use-admin";
import type { TopicResourceType, ScopeLevel, ScopeResourceType, Batch } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const _API_ORIGIN = (() => {
  try { return new URL(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").origin; }
  catch { return "http://localhost:3000"; }
})();
function resolveMediaUrl(url?: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${_API_ORIGIN}${url}`;
}

// ─── Exam badge ───────────────────────────────────────────────────────────────

const EXAM_COLORS: Record<string, { from: string; to: string }> = {
  jee:     { from: "#1D4ED8", to: "#4F46E5" },
  neet:    { from: "#059669", to: "#0D9488" },
  both:    { from: "#7C3AED", to: "#C026D3" },
  default: { from: "#0F172A", to: "#334155" },
};

function ExamBadge({ target }: { target: string }) {
  const c = EXAM_COLORS[target?.toLowerCase()] ?? EXAM_COLORS.default;
  return (
    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
      style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}>
      {target?.toUpperCase() || "—"}
    </span>
  );
}

// ─── Resource type config ─────────────────────────────────────────────────────

const RESOURCE_TYPES: { value: TopicResourceType; label: string; icon: React.ComponentType<{ className?: string }>; color: string; accept: string }[] = [
  { value: "pdf",   label: "PDF Notes",  icon: FileText,     color: "bg-red-100 text-red-600",     accept: ".pdf"                  },
  { value: "dpp",   label: "DPP",        icon: PenLine,      color: "bg-orange-100 text-orange-600", accept: ".pdf,.doc,.docx"      },
  { value: "quiz",  label: "Quiz",       icon: FileQuestion, color: "bg-violet-100 text-violet-600", accept: ".pdf,.doc,.docx,.json" },
  { value: "video", label: "Video",      icon: Film,         color: "bg-blue-100 text-blue-600",   accept: "video/*,.mp4,.mkv"     },
  { value: "notes", label: "Notes",      icon: BookMarked,   color: "bg-emerald-100 text-emerald-600", accept: ".pdf,.doc,.docx,.txt" },
];

function resourceConfig(type: TopicResourceType) {
  return RESOURCE_TYPES.find(r => r.value === type) ?? RESOURCE_TYPES[0];
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Topic Resources Panel ────────────────────────────────────────────────────

function TopicResourcesPanel({ topicId, topicName }: { topicId: string; topicName: string }) {
  const { data: resources = [], isLoading } = useTopicResources(topicId);
  const uploadResource = useUploadTopicResource(topicId);
  const deleteResource = useDeleteTopicResource(topicId);

  const [uploadType, setUploadType] = useState<TopicResourceType>("pdf");
  const [uploadName, setUploadName] = useState("");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be 5 MB or smaller"); return; }
    const title = uploadName.trim() || file.name.replace(/\.[^.]+$/, "");
    try {
      await uploadResource.mutateAsync({ file, type: uploadType, title });
      toast.success(`${resourceConfig(uploadType).label} uploaded`);
      setUploadName("");
      setShowUploadForm(false);
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    try {
      await deleteResource.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const cfg = resourceConfig(uploadType);

  return (
    <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 shrink-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Resources</p>
        <p className="text-sm font-black text-slate-900 mt-0.5 truncate">{topicName}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{resources.length} file{resources.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Type selector */}
      <div className="px-3 pt-3 flex gap-1.5 flex-wrap shrink-0">
        {RESOURCE_TYPES.map(rt => {
          const Icon = rt.icon;
          return (
            <button key={rt.value} onClick={() => setUploadType(rt.value)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                uploadType === rt.value ? rt.color + " ring-1 ring-current" : "bg-slate-100 text-slate-400 hover:text-slate-700")}>
              <Icon className="w-3 h-3" /> {rt.label}
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div className="px-3 pt-3 shrink-0">
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={handleDrop}
          onClick={() => setShowUploadForm(!showUploadForm)}
          className={cn("border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all",
            dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50")}>
          <Upload className={cn("w-5 h-5 mx-auto mb-1.5 transition-colors", dragging ? "text-blue-500" : "text-slate-300")} />
          <p className="text-xs font-bold text-slate-500">{dragging ? "Drop to upload" : `Upload ${cfg.label}`}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">click or drag & drop · max 5 MB</p>
        </div>

        <AnimatePresence>
          {showUploadForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="pt-3 space-y-2">
                <input placeholder={`${cfg.label} title (optional)`} value={uploadName}
                  onChange={e => setUploadName(e.target.value)}
                  className="w-full h-9 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors" />
                <input ref={fileRef} type="file" accept={cfg.accept} className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  disabled={uploadResource.isPending}
                  className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-white text-xs font-black disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                  {uploadResource.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><Upload className="w-3.5 h-3.5" /> Choose File</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 mt-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
        ) : resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-800">
            <BookMarked className="w-10 h-10 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No resources yet</p>
            <p className="text-xs text-gray-600 mt-0.5">Upload PDFs, DPPs, quizzes or videos</p>
          </div>
        ) : (
          resources.map((r, i) => {
            const rc = resourceConfig(r.type);
            const Icon = rc.icon;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", rc.color)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md", rc.color)}>{rc.label}</span>
                    {r.fileSize && <span className="text-[10px] text-slate-400">{formatSize(r.fileSize)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={resolveMediaUrl(r.fileUrl)} target="_blank" rel="noreferrer"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => handleDelete(r.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Tests & PYQs Panel ───────────────────────────────────────────────────────

const SCOPE_TYPE_CONFIG: Record<ScopeResourceType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; accept: string }> = {
  mock_test: { label: "Mock Test", icon: Trophy,       color: "bg-rose-100 text-rose-600",  accept: ".pdf,.doc,.docx,.zip,.json" },
  pyq:       { label: "PYQ",       icon: GraduationCap, color: "bg-amber-100 text-amber-600", accept: ".pdf,.doc,.docx,.zip,.json" },
};

const SCOPE_LEVEL_CONFIG: Record<ScopeLevel, { label: string; color: string; activeRing: string }> = {
  course:  { label: "Course",  color: "bg-violet-100 text-violet-700", activeRing: "ring-violet-400" },
  subject: { label: "Subject", color: "bg-blue-100 text-blue-700",     activeRing: "ring-blue-400"   },
  chapter: { label: "Chapter", color: "bg-indigo-100 text-indigo-700", activeRing: "ring-indigo-400" },
  topic:   { label: "Topic",   color: "bg-emerald-100 text-emerald-700", activeRing: "ring-emerald-400" },
};

function TestsAndPYQsPanel({
  batches,
  selectedSubjectId, selectedSubjectName,
  selectedChapterId, selectedChapterName,
  selectedTopicId,   selectedTopicName,
}: {
  batches: Batch[];
  selectedSubjectId: string; selectedSubjectName: string;
  selectedChapterId: string; selectedChapterName: string;
  selectedTopicId:   string; selectedTopicName:   string;
}) {
  const [level, setLevel]           = useState<ScopeLevel>("course");
  const [batchId, setBatchId]       = useState("");
  const [uploadType, setUploadType] = useState<ScopeResourceType>("mock_test");
  const [uploadName, setUploadName] = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [dragging, setDragging]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-select the deepest available level when tree selection changes
  useEffect(() => {
    if (selectedTopicId)   { setLevel("topic"); }
    else if (selectedChapterId) { setLevel("chapter"); }
    else if (selectedSubjectId) { setLevel("subject"); }
    else                        { setLevel("course"); }
  }, [selectedTopicId, selectedChapterId, selectedSubjectId]);

  const scopeId = level === "course"   ? batchId
                : level === "subject"  ? selectedSubjectId
                : level === "chapter"  ? selectedChapterId
                : selectedTopicId;

  const scopeName = level === "course"   ? (batches.find(b => b.id === batchId)?.name ?? "")
                  : level === "subject"  ? selectedSubjectName
                  : level === "chapter"  ? selectedChapterName
                  : selectedTopicName;

  const levelEnabled: Record<ScopeLevel, boolean> = {
    course:  true,
    subject: !!selectedSubjectId,
    chapter: !!selectedChapterId,
    topic:   !!selectedTopicId,
  };

  const { data: resources = [], isLoading } = useScopeResources(level, scopeId);
  const uploadResource = useUploadScopeResource(level, scopeId);
  const deleteResource = useDeleteScopeResource(level, scopeId);

  const handleFile = async (file: File) => {
    if (!scopeId) { toast.error(level === "course" ? "Select a course first" : "Make a selection first"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be 5 MB or smaller"); return; }
    const title = uploadName.trim() || file.name.replace(/\.[^.]+$/, "");
    try {
      await uploadResource.mutateAsync({ file, type: uploadType, title });
      toast.success(`${SCOPE_TYPE_CONFIG[uploadType].label} uploaded`);
      setUploadName("");
      setShowForm(false);
    } catch {
      toast.error("Upload failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this file?")) return;
    try {
      await deleteResource.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const cfg = SCOPE_TYPE_CONFIG[uploadType];
  const lcfg = SCOPE_LEVEL_CONFIG[level];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mock Tests & PYQs</p>
            <p className="text-lg font-black text-slate-900 mt-0.5 leading-none">
              {scopeName || <span className="text-slate-300 text-sm font-semibold">Select a scope below</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full", lcfg.color)}>
              {lcfg.label}
            </span>
            <span className="text-sm font-bold text-slate-400">{resources.length} file{resources.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* ── Level selector ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Scope Level</p>
          <div className="flex gap-2 flex-wrap">
            {(["course", "subject", "chapter", "topic"] as ScopeLevel[]).map(l => {
              const lc = SCOPE_LEVEL_CONFIG[l];
              const enabled = levelEnabled[l];
              return (
                <button key={l} disabled={!enabled} onClick={() => setLevel(l)}
                  className={cn(
                    "px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                    !enabled
                      ? "opacity-30 cursor-not-allowed bg-slate-100 text-slate-400"
                      : level === l
                        ? lc.color + " ring-2 " + lc.activeRing + " shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}>
                  {lc.label}
                  {!enabled && <span className="ml-1 opacity-50">—</span>}
                </button>
              );
            })}
          </div>
          {level === "course" && !selectedSubjectId && (
            <p className="text-[10px] text-slate-400 mt-1.5">Select a subject/chapter/topic in the tree above to enable deeper scopes</p>
          )}
        </div>

        {/* ── Course batch selector ── */}
        {level === "course" && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Select Course</p>
            <select value={batchId} onChange={e => setBatchId(e.target.value)}
              className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors">
              <option value="">— Choose a course —</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.examTarget?.toUpperCase()})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ── Left: Upload ── */}
          <div className="space-y-4">
            {/* Type selector */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">File Type</p>
              <div className="flex gap-2">
                {(["mock_test", "pyq"] as ScopeResourceType[]).map(t => {
                  const tc = SCOPE_TYPE_CONFIG[t];
                  const Icon = tc.icon;
                  return (
                    <button key={t} onClick={() => setUploadType(t)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                        uploadType === t ? tc.color + " ring-2 ring-current shadow-sm" : "bg-slate-100 text-slate-400 hover:text-slate-700"
                      )}>
                      <Icon className="w-3.5 h-3.5" /> {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => setShowForm(!showForm)}
              className={cn(
                "border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all",
                dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
              )}>
              <Upload className={cn("w-6 h-6 mx-auto mb-2 transition-colors", dragging ? "text-blue-500" : "text-slate-300")} />
              <p className="text-sm font-bold text-slate-500">
                {dragging ? "Drop to upload" : `Upload ${cfg.label}`}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">click or drag & drop · PDF, DOC, ZIP · max 5 MB</p>
            </div>

            <AnimatePresence>
              {showForm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="space-y-2">
                    <input placeholder={`${cfg.label} title (optional)`} value={uploadName}
                      onChange={e => setUploadName(e.target.value)}
                      className="w-full h-10 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-colors" />
                    <input ref={fileRef} type="file" accept={cfg.accept} className="hidden"
                      onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                    <button
                      onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                      disabled={uploadResource.isPending || (level === "course" && !batchId)}
                      className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-white text-sm font-black disabled:opacity-50 hover:opacity-90 transition-opacity"
                      style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                      {uploadResource.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                        : <><Upload className="w-4 h-4" /> Choose File</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: File list ── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Uploaded Files</p>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : !scopeId ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-200 border-2 border-dashed border-slate-100 rounded-2xl">
                  <FileQuestion className="w-8 h-8 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">
                    {level === "course" ? "Select a course" : `Select a ${level}`}
                  </p>
                </div>
              ) : resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-200 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Trophy className="w-8 h-8 mb-2" />
                  <p className="text-xs font-semibold text-slate-400">No files yet</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Upload a mock test or PYQ</p>
                </div>
              ) : (
                resources.map((r, i) => {
                  const tc = SCOPE_TYPE_CONFIG[r.type];
                  const Icon = tc.icon;
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all group">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", tc.color)}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md", tc.color)}>{tc.label}</span>
                          {r.fileSize && <span className="text-[10px] text-slate-400">{formatSize(r.fileSize)}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={resolveMediaUrl(r.fileUrl)} target="_blank" rel="noreferrer"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => handleDelete(r.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Field component ──────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-blue-400 transition-colors w-full";

// ─── Panel shell ──────────────────────────────────────────────────────────────

function Panel({ title, count, onAdd, addLabel, showForm, children }: {
  title: string; count: number; onAdd: () => void;
  addLabel: string; showForm: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</p>
          <p className="text-xl font-black text-slate-900 mt-0.5 leading-none">{count}</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? "Cancel" : addLabel}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ContentPage = () => {
  const { data: subjects, isLoading } = useSubjects();
  const { data: batches = [] } = useBatches();
  const createSubject = useCreateSubject();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [selectedTopic,   setSelectedTopic]   = useState("");

  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [showTopicForm,   setShowTopicForm]   = useState(false);

  const [subjectForm, setSubjectForm] = useState({ name: "", examTarget: "jee" });
  const [chapterForm, setChapterForm] = useState({ name: "" });
  const [topicForm,   setTopicForm]   = useState({ name: "", estimatedStudyMinutes: 30, gatePassPercentage: 70 });

  const { data: chapters, isLoading: chaptersLoading } = useChapters(selectedSubject);
  const createChapter = useCreateChapter();
  const { data: topics, isLoading: topicsLoading } = useTopics(selectedChapter);
  const createTopic = useCreateTopic();

  const subjectList = Array.isArray(subjects) ? subjects : [];
  const chapterList = Array.isArray(chapters) ? chapters : [];
  const topicList   = Array.isArray(topics)   ? topics   : [];
  const batchList   = Array.isArray(batches)  ? batches  : [];

  const selectedSubjectObj = subjectList.find(s => s.id === selectedSubject);
  const selectedChapterObj = chapterList.find(c => c.id === selectedChapter);
  const selectedTopicObj   = topicList.find(t => t.id === selectedTopic);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSubject.mutateAsync(subjectForm);
    setSubjectForm({ name: "", examTarget: "jee" });
    setShowSubjectForm(false);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChapter.mutateAsync({ subjectId: selectedSubject, name: chapterForm.name });
    setChapterForm({ name: "" });
    setShowChapterForm(false);
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTopic.mutateAsync({
      chapterId: selectedChapter,
      name: topicForm.name,
      estimatedStudyMinutes: topicForm.estimatedStudyMinutes,
      gatePassPercentage: topicForm.gatePassPercentage,
    });
    setTopicForm({ name: "", estimatedStudyMinutes: 30, gatePassPercentage: 70 });
    setShowTopicForm(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const showResources = !!selectedTopic;

  return (
    <div className="max-w-[1600px] mx-auto p-6 lg:p-8 pb-20 space-y-6">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-slate-900">Content Library</h1>
        <p className="text-sm text-slate-400 mt-0.5">Subjects → Chapters → Topics → Resources</p>
      </motion.div>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm font-bold flex-wrap">
        <button onClick={() => { setSelectedSubject(""); setSelectedChapter(""); setSelectedTopic(""); }}
          className={cn("transition-colors", selectedSubject ? "text-blue-600 hover:text-blue-800" : "text-slate-900 cursor-default")}>
          Subjects
        </button>
        {selectedSubjectObj && (<>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <button onClick={() => { setSelectedChapter(""); setSelectedTopic(""); }}
            className={cn("transition-colors", selectedChapter ? "text-blue-600 hover:text-blue-800" : "text-slate-900 cursor-default")}>
            {selectedSubjectObj.name}
          </button>
        </>)}
        {selectedChapterObj && (<>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <button onClick={() => setSelectedTopic("")}
            className={cn("transition-colors", selectedTopic ? "text-blue-600 hover:text-blue-800" : "text-slate-900 cursor-default")}>
            {selectedChapterObj.name}
          </button>
        </>)}
        {selectedTopicObj && (<>
          <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-slate-900">{selectedTopicObj.name}</span>
        </>)}
      </div>

      {/* ── Content tree panels ── */}
      <div className={cn("grid gap-5", showResources ? "grid-cols-1 lg:grid-cols-4" : "grid-cols-1 lg:grid-cols-3")}>

        {/* ── Subjects ── */}
        <Panel title="Subjects" count={subjectList.length} addLabel="Add Subject"
          showForm={showSubjectForm} onAdd={() => setShowSubjectForm(!showSubjectForm)}>
          <AnimatePresence>
            {showSubjectForm && (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateSubject} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 space-y-3">
                <Field label="Subject Name">
                  <input required placeholder="e.g. Physics" value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Exam Target">
                  <select value={subjectForm.examTarget} onChange={e => setSubjectForm({ ...subjectForm, examTarget: e.target.value })} className={inputCls}>
                    <option value="jee">JEE</option><option value="neet">NEET</option><option value="both">Both</option>
                  </select>
                </Field>
                <button type="submit" disabled={createSubject.isPending || !subjectForm.name}
                  className="w-full h-9 rounded-xl text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                  {createSubject.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Subject"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {subjectList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-600">
              <BookOpen className="w-10 h-10 mb-2" />
              <p className="text-sm font-semibold text-slate-400">No subjects yet</p>
            </div>
          ) : subjectList.map((s, i) => (
            <motion.button key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => { setSelectedSubject(s.id); setSelectedChapter(""); setSelectedTopic(""); }}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group",
                selectedSubject === s.id ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "hover:bg-slate-50 border border-transparent hover:border-slate-100")}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-sm"
                style={{ background: `linear-gradient(135deg, ${(EXAM_COLORS[s.examTarget?.toLowerCase()] ?? EXAM_COLORS.default).from}, ${(EXAM_COLORS[s.examTarget?.toLowerCase()] ?? EXAM_COLORS.default).to})` }}>
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold truncate", selectedSubject === s.id ? "text-white" : "text-slate-800")}>{s.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <ExamBadge target={s.examTarget} />
                  <span className={cn("text-[10px]", selectedSubject === s.id ? "text-white/60" : "text-slate-400")}>{s.chapters?.length ?? 0} ch</span>
                </div>
              </div>
              <ChevronRight className={cn("w-4 h-4 shrink-0", selectedSubject === s.id ? "text-white/60" : "text-gray-800 group-hover:text-blue-500")} />
            </motion.button>
          ))}
        </Panel>

        {/* ── Chapters ── */}
        <Panel title={selectedSubjectObj ? `Chapters · ${selectedSubjectObj.name}` : "Chapters"} count={chapterList.length}
          addLabel="Add Chapter" showForm={showChapterForm}
          onAdd={() => { if (selectedSubject) setShowChapterForm(!showChapterForm); }}>
          {!selectedSubject ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-800">
              <Layers className="w-10 h-10 mb-2" />
              <p className="text-sm font-semibold text-slate-400">Select a subject first</p>
            </div>
          ) : chaptersLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <>
              <AnimatePresence>
                {showChapterForm && (
                  <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateChapter} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 space-y-3">
                    <Field label="Chapter Name">
                      <input required placeholder="e.g. Kinematics" value={chapterForm.name}
                        onChange={e => setChapterForm({ name: e.target.value })} className={inputCls} />
                    </Field>
                    <button type="submit" disabled={createChapter.isPending || !chapterForm.name}
                      className="w-full h-9 rounded-xl text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                      {createChapter.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Chapter"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {chapterList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No chapters yet</p>
                </div>
              ) : chapterList.map((c, i) => (
                <motion.button key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => { setSelectedChapter(c.id); setSelectedTopic(""); }}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group",
                    selectedChapter === c.id ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "hover:bg-slate-50 border border-transparent hover:border-slate-100")}>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                    selectedChapter === c.id ? "bg-white/20 text-gray-900" : "bg-slate-100 text-slate-500")}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", selectedChapter === c.id ? "text-white" : "text-slate-800")}>{c.name}</p>
                    <p className={cn("text-[10px] mt-0.5", selectedChapter === c.id ? "text-white/60" : "text-slate-400")}>{c.topics?.length ?? 0} topics</p>
                  </div>
                  <ChevronRight className={cn("w-4 h-4 shrink-0", selectedChapter === c.id ? "text-white/60" : "text-gray-800 group-hover:text-blue-500")} />
                </motion.button>
              ))}
            </>
          )}
        </Panel>

        {/* ── Topics ── */}
        <Panel title={selectedChapterObj ? `Topics · ${selectedChapterObj.name}` : "Topics"} count={topicList.length}
          addLabel="Add Topic" showForm={showTopicForm}
          onAdd={() => { if (selectedChapter) setShowTopicForm(!showTopicForm); }}>
          {!selectedChapter ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-800">
              <Hash className="w-10 h-10 mb-2" />
              <p className="text-sm font-semibold text-slate-400">Select a chapter first</p>
            </div>
          ) : topicsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <>
              <AnimatePresence>
                {showTopicForm && (
                  <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleCreateTopic} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2 space-y-3">
                    <Field label="Topic Name">
                      <input required placeholder="e.g. Newton's Laws" value={topicForm.name}
                        onChange={e => setTopicForm({ ...topicForm, name: e.target.value })} className={inputCls} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Study mins">
                        <input type="number" value={topicForm.estimatedStudyMinutes}
                          onChange={e => setTopicForm({ ...topicForm, estimatedStudyMinutes: +e.target.value })} className={inputCls} />
                      </Field>
                      <Field label="Gate lock %">
                        <input type="number" min={0} max={100} value={topicForm.gatePassPercentage}
                          onChange={e => setTopicForm({ ...topicForm, gatePassPercentage: +e.target.value })} className={inputCls} />
                      </Field>
                    </div>
                    <button type="submit" disabled={createTopic.isPending || !topicForm.name}
                      className="w-full h-9 rounded-xl text-white text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                      {createTopic.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Create Topic"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              {topicList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <FileText className="w-10 h-10 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">No topics yet</p>
                </div>
              ) : topicList.map((t, i) => (
                <motion.button key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedTopic(selectedTopic === t.id ? "" : t.id)}
                  className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all group",
                    selectedTopic === t.id ? "bg-blue-600 shadow-lg shadow-blue-500/20" : "border border-slate-100 hover:border-blue-100 hover:shadow-sm bg-white")}>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                    selectedTopic === t.id ? "bg-white/20 text-gray-900" : "bg-slate-100 text-slate-500")}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", selectedTopic === t.id ? "text-white" : "text-slate-800")}>{t.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {t.estimatedStudyMinutes && (
                        <span className={cn("flex items-center gap-1 text-[10px]", selectedTopic === t.id ? "text-white/60" : "text-slate-400")}>
                          <Clock className="w-3 h-3" />{t.estimatedStudyMinutes}m
                        </span>
                      )}
                      <span className={cn("flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md",
                        selectedTopic === t.id ? "bg-white/20 text-white" : "bg-amber-50 text-amber-600")}>
                        <Lock className="w-3 h-3" />{t.gatePassPercentage ?? 70}%
                      </span>
                      <span className={cn("text-[10px] font-black px-1.5 py-0.5 rounded-md",
                        selectedTopic === t.id
                          ? "bg-white/20 text-gray-900"
                          : t.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <Upload className={cn("w-3.5 h-3.5 shrink-0 transition-colors",
                    selectedTopic === t.id ? "text-white/60" : "text-gray-800 group-hover:text-blue-500")} />
                </motion.button>
              ))}
            </>
          )}
        </Panel>

        {/* ── Topic Resources panel ── */}
        <AnimatePresence>
          {showResources && selectedTopicObj && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <TopicResourcesPanel topicId={selectedTopic} topicName={selectedTopicObj.name} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mock Tests & PYQs section ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <TestsAndPYQsPanel
          batches={batchList}
          selectedSubjectId={selectedSubject}
          selectedSubjectName={selectedSubjectObj?.name ?? ""}
          selectedChapterId={selectedChapter}
          selectedChapterName={selectedChapterObj?.name ?? ""}
          selectedTopicId={selectedTopic}
          selectedTopicName={selectedTopicObj?.name ?? ""}
        />
      </motion.div>

    </div>
  );
};

export default ContentPage;
