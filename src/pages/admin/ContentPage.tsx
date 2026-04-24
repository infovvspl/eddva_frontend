import React, { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Loader2, BookOpen, FileText, X,
  Layers, Upload, Trash2, ExternalLink, Link2,
  FileQuestion, BookMarked, PenLine, Search,
  ChevronDown, ChevronRight, ChevronLeft, GraduationCap, Hash,
  AlertCircle, Check, Youtube, MoreVertical,
  FolderOpen, Folder, Play, Eye, LayoutGrid, Users,
  Sparkles, Brain, FlaskConical, StickyNote, ListChecks,
  Lightbulb, BookText, Wand2, ChevronUp, Zap, Lock,
  FileSpreadsheet, ArrowRight, CheckCircle2, ClipboardList, Clock,
  Pencil, AlertTriangle, Filter,
} from "lucide-react";
import {
  useBatches,
  useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject,
  useChapters, useCreateChapter, useUpdateChapter, useDeleteChapter,
  useTopics, useCreateTopic, useUpdateTopic, useDeleteTopic,
  useTopicResources, useUploadTopicResource, useDeleteTopicResource, useAddTopicResourceLink,
  useBulkImportCurriculum,
  useBatchContentLectures,
} from "@/hooks/use-admin";
import * as adminApi from "@/lib/api/admin";
import type { TopicResourceType, Subject, Chapter, Topic, TopicResource, BulkImportPayload, BulkImportSubject } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiOrigin } from "@/lib/api-config";
import { MAX_MATERIAL_FILE_SIZE_MB } from "@/lib/upload-limits";

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

// ─── Resource type config ──────────────────────────────────────────────────────

const RES_TYPES: {
  value: TopicResourceType; label: string; shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; isUrl?: boolean; accept?: string;
}[] = [
    { value: "pdf", label: "Lecture Notes", shortLabel: "Lecture Notes", icon: FileText, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", accept: ".pdf" },
    { value: "dpp", label: "DPP", shortLabel: "DPP", icon: PenLine, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", accept: ".pdf,.doc,.docx" },
    { value: "pyq", label: "PYQ", shortLabel: "PYQ", icon: FileQuestion, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", accept: ".pdf,.doc,.docx" },
    { value: "notes", label: "Handwritten Notes", shortLabel: "Handwritten Notes", icon: BookMarked, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", accept: ".pdf,.doc,.docx,.txt" },
    { value: "video", label: "YouTube", shortLabel: "YouTube", icon: Youtube, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", isUrl: true },
    { value: "link", label: "Link", shortLabel: "Link", icon: Link2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", isUrl: true },
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

// ─── Inline Edit Input ─────────────────────────────────────────────────────────

function InlineEdit({
  defaultValue, onSave, onCancel, loading,
}: { defaultValue: string; onSave: (v: string) => void; onCancel: () => void; loading?: boolean }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && val.trim()) onSave(val.trim());
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 h-7 px-2 text-sm bg-white border-2 border-blue-400 rounded-lg outline-none"
      />
      <button
        onClick={() => val.trim() && onSave(val.trim())}
        disabled={loading || !val.trim()}
        className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
      </button>
      <button onClick={onCancel} className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Confirm Delete Dialog ─────────────────────────────────────────────────────

function ConfirmDeleteDialog({
  label, name, onConfirm, onCancel, loading,
}: { label: string; name: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">Delete {label}?</p>
            <p className="text-xs text-slate-500 mt-0.5">
              "<span className="font-semibold text-slate-700">{name}</span>" and all its content will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function isYoutubeLikeUrl(url?: string | null) {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be");
}

// ─── Resource Row ──────────────────────────────────────────────────────────────

function ResourceRow({ r, onDelete }: { r: TopicResource; onDelete: () => void }) {
  const cfg = rCfg(String(r.type ?? "").toLowerCase() as TopicResourceType);
  const Icon = cfg.icon;
  const href = r.externalUrl ? resolveUrl(r.externalUrl) : resolveUrl(r.fileUrl ?? undefined);
  const rawYtUrl = r.externalUrl || (isYoutubeLikeUrl(r.fileUrl ?? undefined) ? r.fileUrl! : null);
  const ytId = rawYtUrl ? getYouTubeId(rawYtUrl) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="group flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all"
    >
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
        <Icon className={cn("w-4 h-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {r.fileSizeKb && <span className="text-[10px] text-slate-400">{fmtSize(r.fileSizeKb)}</span>}
          {ytId && <span className="text-[10px] text-red-500 font-semibold flex items-center gap-0.5"><Youtube className="w-2.5 h-2.5" /> YouTube</span>}
          {r.externalUrl && !ytId && <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{r.externalUrl}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="h-7 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center gap-1 transition-all">
            <ExternalLink className="w-3 h-3" />
            {ytId ? "Watch" : "Open"}
          </a>
        )}
        <button onClick={onDelete}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Add Resource Modal ────────────────────────────────────────────────────────

function AddResourceModal({
  topicId, topicName, batchId, initialType, onClose,
}: {
  topicId: string; topicName: string; batchId: string;
  initialType?: TopicResourceType; onClose: () => void;
}) {
  const [step, setStep] = useState<"type" | "input">(initialType ? "input" : "type");
  const [selectedType, setSelectedType] = useState<TopicResourceType>(initialType ?? "pdf");
  const [title, setTitle] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadTopicResource(topicId, batchId);
  const addLink = useAddTopicResourceLink(topicId);
  const activeCfg = rCfg(selectedType);
  const isUrlType = activeCfg.isUrl;

  const cleanFilename = (name: string) =>
    name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").replace(/\s{2,}/g, " ").trim();

  const stageFile = (file: File) => {
    if (file.size > MAX_MATERIAL_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be ≤ ${MAX_MATERIAL_FILE_SIZE_MB} MB`); return;
    }
    setPendingFile(file);
    if (!title.trim()) setTitle(cleanFilename(file.name));
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    const t = title.trim() || cleanFilename(pendingFile.name);
    try {
      await upload.mutateAsync({ file: pendingFile, type: selectedType, title: t });
      toast.success(`${activeCfg.label} uploaded`); onClose();
    } catch { toast.error("Upload failed — please try again"); }
  };

  const handleAddLink = async () => {
    if (!urlInput.trim()) { toast.error("Paste a URL first"); return; }
    const t = title.trim() || (isYouTube(urlInput) ? "YouTube Video" : "External Link");
    const type: TopicResourceType = isYouTube(urlInput) ? "video" : selectedType;
    try {
      await addLink.mutateAsync({ title: t, type, externalUrl: urlInput.trim() });
      toast.success("Link saved"); onClose();
    } catch { toast.error("Failed to save link"); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === "input" && !initialType && (
              <button onClick={() => setStep("type")}
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {step === "type" ? "What would you like to add?" : `Add ${activeCfg.label}`}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">{topicName}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === "type" ? (
            <motion.div key="type" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
              className="p-5">
              <div className="grid grid-cols-2 gap-3">
                {RES_TYPES.map(rt => {
                  const Icon = rt.icon;
                  return (
                    <button key={rt.value}
                      onClick={() => { setSelectedType(rt.value); setStep("input"); }}
                      className={cn("flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all hover:shadow-sm", rt.bg, rt.border)}>
                      <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
                        <Icon className={cn("w-5 h-5", rt.color)} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-black", rt.color)}>{rt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rt.isUrl ? "Paste URL" : "Upload file"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div key="input" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              className="p-5 space-y-4">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black", activeCfg.bg, activeCfg.border, activeCfg.color)}>
                <activeCfg.icon className="w-3.5 h-3.5" />
                {activeCfg.label}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">Title</label>
                <input
                  placeholder="Give this resource a clear title…"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 px-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>

              {isUrlType ? (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">URL</label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isYouTube(urlInput) ? <Youtube className="w-4 h-4 text-red-500" /> : <Link2 className="w-4 h-4 text-slate-400" />}
                    </div>
                    <input autoFocus placeholder="https://youtube.com/... or any URL"
                      value={urlInput} onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAddLink(); }}
                      className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                  </div>
                  {isYouTube(urlInput) && (
                    <p className="text-[11px] text-red-500 font-semibold mt-1.5 flex items-center gap-1">
                      <Youtube className="w-3 h-3" /> YouTube video detected
                    </p>
                  )}
                </div>
              ) : pendingFile ? (
                <div className={cn("rounded-2xl border-2 p-4 flex items-center gap-3", activeCfg.bg, activeCfg.border)}>
                  <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0">
                    <activeCfg.icon className={cn("w-5 h-5", activeCfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{pendingFile.name}</p>
                    <p className="text-xs text-slate-500">{fmtSize(Math.round(pendingFile.size / 1024))}</p>
                  </div>
                  <button onClick={() => { setPendingFile(null); setTitle(""); if (fileRef.current) fileRef.current.value = ""; }}
                    className="w-7 h-7 rounded-xl bg-white/80 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 block">File</label>
                  <div
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) stageFile(f); }}
                    onClick={() => fileRef.current?.click()}
                    className={cn("border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                      dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-blue-300 hover:bg-slate-50")}
                  >
                    <div className={cn("w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center", activeCfg.bg)}>
                      <Upload className={cn("w-6 h-6", activeCfg.color)} />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Drop file or <span className="text-blue-600">browse</span></p>
                    <p className="text-xs text-slate-400 mt-1">Max {MAX_MATERIAL_FILE_SIZE_MB} MB · {activeCfg.accept?.split(",").join(", ")}</p>
                    <input ref={fileRef} type="file" accept={activeCfg.accept} className="hidden"
                      onChange={e => { if (e.target.files?.[0]) stageFile(e.target.files[0]); }} />
                  </div>
                </div>
              )}

              <button
                onClick={isUrlType ? handleAddLink : handleConfirmUpload}
                disabled={isUrlType ? addLink.isPending || !urlInput.trim() : upload.isPending || !pendingFile}
                className="w-full h-11 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
                style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
                {(upload.isPending || addLink.isPending)
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> {isUrlType ? "Saving…" : "Uploading…"}</>
                  : <>{isUrlType ? <Link2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />} {isUrlType ? "Save Link" : "Upload File"}</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Compact Lecture Row ───────────────────────────────────────────────────────

function CompactLectureRow({ lec }: { lec: AdminTopicLectureRow }) {
  const videoHref = lec.videoUrl ? resolveUrl(lec.videoUrl) : "";
  const s = (lec.status || "").toLowerCase();
  const statusCls = s === "published" ? "text-emerald-700 bg-emerald-50 border-emerald-100"
    : s === "live" ? "text-red-700 bg-red-50 border-red-100"
    : s === "scheduled" ? "text-amber-700 bg-amber-50 border-amber-100"
    : "text-slate-500 bg-slate-100 border-slate-200";
  return (
    <div className="group flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
        <Play className="w-4 h-4 text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{lec.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border", statusCls)}>{lec.status}</span>
          {lec.scheduledAt && <span className="text-[10px] text-slate-400">{new Date(lec.scheduledAt).toLocaleDateString()}</span>}
        </div>
      </div>
      {videoHref && (
        <a href={videoHref} target="_blank" rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 h-7 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-1 transition-all shrink-0">
          <ExternalLink className="w-3 h-3" /> Open
        </a>
      )}
    </div>
  );
}

// ─── Resource Workspace ────────────────────────────────────────────────────────

function ResourceWorkspace({
  topicId, topicName, batchId, subject, chapter, onNavigateToLectures, onOpenAi,
}: {
  topicId: string; topicName: string; batchId: string;
  subject: Subject; chapter: Chapter;
  onNavigateToLectures: () => void;
  onOpenAi: () => void;
}) {
  const { data: resources = [], isLoading } = useTopicResources(topicId);
  const { data: batchLecturesRaw = [] } = useBatchContentLectures(batchId);
  const deleteRes = useDeleteTopicResource(topicId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState<TopicResourceType | undefined>(undefined);

  const topicLectures = useMemo(() => {
    const arr = Array.isArray(batchLecturesRaw) ? batchLecturesRaw : [];
    return (arr as AdminTopicLectureRow[]).filter(l => {
      const lid = l.topic?.id ?? (l as any).topicId;
      return lid != null && String(lid) === String(topicId);
    });
  }, [batchLecturesRaw, topicId]);


  const isYtResource = (r: TopicResource) =>
    isYoutubeLikeUrl(r.externalUrl ?? undefined) || isYoutubeLikeUrl(r.fileUrl ?? undefined);

  const grouped = useMemo(() => {
    const g: Record<TopicResourceType, TopicResource[]> = { pdf: [], dpp: [], pyq: [], notes: [], video: [], link: [], quiz: [] };
    for (const r of resources) {
      const t = String(r.type ?? "").toLowerCase() as TopicResourceType;
      if ((t === "link" || t === "video") && isYtResource(r)) { g.video.push(r); }
      else if (g[t]) { g[t].push(r); }
    }
    return g;
  }, [resources]);

  const openAdd = (type?: TopicResourceType) => { setAddModalType(type); setShowAddModal(true); };
  const hasAnything = resources.length > 0 || topicLectures.length > 0;

  const handleDelete = async (r: TopicResource) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    try { await deleteRes.mutateAsync(r.id); toast.success("Deleted"); }
    catch { toast.error("Delete failed"); }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-xs mb-2">
          <span className="font-bold" style={{ color: subject.colorCode ?? "#6B7280" }}>{subject.name}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-bold text-amber-600">{chapter.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black text-slate-900 leading-tight">{topicName}</h2>
          <span className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl font-bold shrink-0 mt-0.5">
            {resources.length} item{resources.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <button onClick={() => openAdd()}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-white text-sm font-black transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #013889, #0257c8)" }}>
            <Plus className="w-4 h-4" /> Add Resource
          </button>
          <button onClick={onOpenAi}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-black bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
          <button onClick={onNavigateToLectures}
            className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-black bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors ml-auto">
            <Play className="w-4 h-4 text-rose-400" /> Lectures
          </button>
        </div>
      </div>

      {/* Resource sections */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
        ) : !hasAnything ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-black text-slate-600 mb-1">No resources yet</p>
            <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">
              Upload study materials, DPPs, or add YouTube links for this topic.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-sm">
              {RES_TYPES.map(rt => {
                const Icon = rt.icon;
                return (
                  <button key={rt.value} onClick={() => openAdd(rt.value)}
                    className={cn("flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all hover:shadow-sm", rt.bg, rt.border)}>
                    <Icon className={cn("w-4 h-4 shrink-0", rt.color)} />
                    <span className={cn("text-xs font-bold", rt.color)}>{rt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            {topicLectures.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                      <Play className="w-3 h-3 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-black text-slate-700">Lectures</h3>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{topicLectures.length}</span>
                  </div>
                  <button onClick={onNavigateToLectures}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors">
                    Manage <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {topicLectures.map(lec => <CompactLectureRow key={lec.id} lec={lec} />)}
                </div>
              </section>
            )}
            {RES_TYPES.map(rt => {
              const items = grouped[rt.value];
              if (!items || items.length === 0) return null;
              const Icon = rt.icon;
              return (
                <section key={rt.value}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", rt.bg)}>
                        <Icon className={cn("w-3.5 h-3.5", rt.color)} />
                      </div>
                      <h3 className={cn("text-sm font-black", rt.color)}>{rt.label}</h3>
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    <button onClick={() => openAdd(rt.value)}
                      className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {items.map(r => <ResourceRow key={r.id} r={r} onDelete={() => handleDelete(r)} />)}
                    </div>
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddResourceModal
          topicId={topicId} topicName={topicName} batchId={batchId}
          initialType={addModalType}
          onClose={() => { setShowAddModal(false); setAddModalType(undefined); }}
        />
      )}
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
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleRename = async (name: string) => {
    try {
      await updateSubject.mutateAsync({ id: subject.id, name });
      toast.success("Subject renamed");
      setEditing(false);
    } catch { toast.error("Failed to rename"); }
  };

  const handleDelete = async () => {
    try {
      await deleteSubject.mutateAsync(subject.id);
      toast.success("Subject deleted");
      setConfirmDelete(false);
    } catch { toast.error("Failed to delete subject"); }
  };

  const accentColor = subject.colorCode ?? "#3B82F6";

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100">
      {confirmDelete && (
        <ConfirmDeleteDialog
          label="Subject"
          name={subject.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleteSubject.isPending}
        />
      )}

      {/* Subject row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white hover:bg-slate-50 transition-colors group">
        <button onClick={onToggle} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accentColor}18`, color: accentColor }}>
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          {editing ? (
            <InlineEdit
              defaultValue={subject.name}
              onSave={handleRename}
              onCancel={() => setEditing(false)}
              loading={updateSubject.isPending}
            />
          ) : (
            <>
              <span className="text-sm font-black text-slate-800 flex-1 truncate">{subject.name}</span>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full shrink-0"
                style={{ background: `${accentColor}15`, color: accentColor }}>
                {subject.examTarget?.toUpperCase()}
              </span>
            </>
          )}
        </button>
        {!editing && (
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-6 h-6 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors"
              title="Rename">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
              title="Delete subject">
              <Trash2 className="w-3 h-3" />
            </button>
            <ChevronDown onClick={onToggle} className={cn("w-4 h-4 text-slate-400 cursor-pointer transition-transform", open && "rotate-180")} />
          </div>
        )}
        {!editing && (
          <ChevronDown onClick={onToggle} className={cn("w-4 h-4 text-slate-400 cursor-pointer transition-transform group-hover:hidden", open && "rotate-180")} />
        )}
      </div>

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
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const visibleTopics = search ? topics.filter((t: Topic) => matchSearch(t.name)) : topics;

  const handleAddTopic = async (name: string) => {
    try {
      await createTopic.mutateAsync({ chapterId: chapter.id, name, estimatedStudyMinutes: 60 });
      toast.success("Topic created");
      setAddingTopic(null);
      if (!open) onToggle();
    } catch { toast.error("Failed to create topic"); }
  };

  const handleRename = async (name: string) => {
    try {
      await updateChapter.mutateAsync({ id: chapter.id, name });
      toast.success("Chapter renamed");
      setEditing(false);
    } catch { toast.error("Failed to rename"); }
  };

  const handleDelete = async () => {
    try {
      await deleteChapter.mutateAsync(chapter.id);
      toast.success("Chapter deleted");
      setConfirmDelete(false);
    } catch { toast.error("Failed to delete chapter"); }
  };

  return (
    <div className="ml-2">
      {confirmDelete && (
        <ConfirmDeleteDialog
          label="Chapter"
          name={chapter.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleteChapter.isPending}
        />
      )}

      {/* Chapter row */}
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-white transition-colors group">
        <button onClick={onToggle} className="flex items-center gap-1.5 shrink-0">
          {open
            ? <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            : <Folder className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {editing ? (
          <InlineEdit
            defaultValue={chapter.name}
            onSave={handleRename}
            onCancel={() => setEditing(false)}
            loading={updateChapter.isPending}
          />
        ) : (
          <>
            <button onClick={onToggle} className="flex-1 min-w-0 text-left">
              <span className="text-xs font-bold text-slate-700 truncate block">{chapter.name}</span>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              {topics.length > 0 && (
                <span className="text-[9px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full group-hover:hidden">
                  {topics.length}
                </span>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button onClick={() => setEditing(true)}
                  className="w-6 h-6 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors"
                  title="Rename">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  className="w-6 h-6 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                  title="Delete chapter">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <ChevronRight onClick={onToggle} className={cn("w-3 h-3 text-slate-300 cursor-pointer transition-transform", open && "rotate-90")} />
            </div>
          </>
        )}
      </div>

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
                visibleTopics.map((t: Topic) => (
                  <TopicRow
                    key={t.id}
                    topic={t}
                    selected={selectedTopicId === t.id}
                    onSelect={() => onSelectTopic(t)}
                    accentColor={accentColor}
                    chapterId={chapter.id}
                  />
                ))
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

function TopicRow({
  topic, selected, onSelect, accentColor, chapterId,
}: { topic: Topic; selected: boolean; onSelect: () => void; accentColor: string; chapterId: string }) {
  const updateTopic = useUpdateTopic();
  const deleteTopic = useDeleteTopic();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRename = async (name: string) => {
    try {
      await updateTopic.mutateAsync({ id: topic.id, name });
      toast.success("Topic renamed");
      setEditing(false);
    } catch { toast.error("Failed to rename"); }
  };

  const handleDelete = async () => {
    try {
      await deleteTopic.mutateAsync(topic.id);
      toast.success("Topic deleted");
      setConfirmDelete(false);
    } catch { toast.error("Failed to delete topic"); }
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmDeleteDialog
          label="Topic"
          name={topic.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleteTopic.isPending}
        />
      )}
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold group transition-all",
          selected ? "text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-900"
        )}
        style={selected ? { background: accentColor } : {}}
      >
        {editing ? (
          <InlineEdit
            defaultValue={topic.name}
            onSave={handleRename}
            onCancel={() => setEditing(false)}
            loading={updateTopic.isPending}
          />
        ) : (
          <>
            <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <Hash className={cn("w-3 h-3 shrink-0", selected ? "text-white/60" : "text-slate-300")} />
              <span className="flex-1 truncate">{topic.name}</span>
            </button>
            <div className={cn(
              "flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
              selected && "opacity-100"
            )}>
              <button onClick={e => { e.stopPropagation(); setEditing(true); }}
                className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                  selected ? "hover:bg-white/20 text-white/70" : "hover:bg-blue-50 text-slate-400 hover:text-blue-600")}
                title="Rename">
                <Pencil className="w-2.5 h-2.5" />
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
                className={cn("w-5 h-5 rounded-md flex items-center justify-center transition-colors",
                  selected ? "hover:bg-white/20 text-white/70" : "hover:bg-red-50 text-slate-400 hover:text-red-500")}
                title="Delete topic">
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

type TopicCoverage = {
  id: string;
  name: string;
  studyMaterialCount: number;
  dppCount: number;
  totalCount: number;
};

type ChapterCoverage = {
  id: string;
  name: string;
  studyMaterialCount: number;
  dppCount: number;
  totalCount: number;
  topics: TopicCoverage[];
};

type SubjectCoverage = {
  id: string;
  name: string;
  studyMaterialCount: number;
  dppCount: number;
  totalCount: number;
  chapters: ChapterCoverage[];
};

type CoverageSummary = {
  subjectCount: number;
  chapterCount: number;
  topicCount: number;
  studyMaterialCount: number;
  dppCount: number;
  totalContentCount: number;
  subjects: SubjectCoverage[];
};

function isStudyMaterial(type?: string | null) {
  const t = String(type ?? "").toLowerCase();
  return t === "pdf" || t === "notes" || t === "video" || t === "link" || t === "pyq" || t === "quiz";
}

function ContentCoverageOverview({
  batchId,
  selectedEntry,
}: {
  batchId: string;
  selectedEntry: { topic: Topic; chapter: Chapter; subject: Subject } | null;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "content-coverage", batchId],
    enabled: !!batchId,
    queryFn: async (): Promise<CoverageSummary> => {
      const subjects = (await adminApi.listSubjects(batchId)) ?? [];
      const subjectRows = await Promise.all(
        subjects.map(async (subject) => {
          const chapters = (await adminApi.listChapters(subject.id)) ?? [];
          const chapterRows = await Promise.all(
            chapters.map(async (chapter) => {
              const topics = (await adminApi.listTopics(chapter.id)) ?? [];
              const topicRows = await Promise.all(
                topics.map(async (topic) => {
                  const resources = (await adminApi.listTopicResources(topic.id)) ?? [];
                  const dppCount = resources.filter((r) => String(r.type ?? "").toLowerCase() === "dpp").length;
                  const studyMaterialCount = resources.filter((r) => isStudyMaterial(r.type)).length;
                  return {
                    id: topic.id,
                    name: topic.name,
                    dppCount,
                    studyMaterialCount,
                    totalCount: resources.length,
                  } as TopicCoverage;
                }),
              );
              return {
                id: chapter.id,
                name: chapter.name,
                dppCount: topicRows.reduce((s, t) => s + t.dppCount, 0),
                studyMaterialCount: topicRows.reduce((s, t) => s + t.studyMaterialCount, 0),
                totalCount: topicRows.reduce((s, t) => s + t.totalCount, 0),
                topics: topicRows,
              } as ChapterCoverage;
            }),
          );
          return {
            id: subject.id,
            name: subject.name,
            dppCount: chapterRows.reduce((s, c) => s + c.dppCount, 0),
            studyMaterialCount: chapterRows.reduce((s, c) => s + c.studyMaterialCount, 0),
            totalCount: chapterRows.reduce((s, c) => s + c.totalCount, 0),
            chapters: chapterRows,
          } as SubjectCoverage;
        }),
      );

      const chapterCount = subjectRows.reduce((s, sub) => s + sub.chapters.length, 0);
      const topicCount = subjectRows.reduce(
        (s, sub) => s + sub.chapters.reduce((inner, ch) => inner + ch.topics.length, 0),
        0,
      );

      return {
        subjectCount: subjectRows.length,
        chapterCount,
        topicCount,
        studyMaterialCount: subjectRows.reduce((s, sub) => s + sub.studyMaterialCount, 0),
        dppCount: subjectRows.reduce((s, sub) => s + sub.dppCount, 0),
        totalContentCount: subjectRows.reduce((s, sub) => s + sub.totalCount, 0),
        subjects: subjectRows,
      };
    },
    staleTime: 20_000,
  });

  const activePath = useMemo(() => {
    if (!selectedEntry) return "";
    return `${selectedEntry.subject.id}:${selectedEntry.chapter.id}:${selectedEntry.topic.id}`;
  }, [selectedEntry]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-semibold">Loading content overview…</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Coverage Overview</p>
            <p className="mt-1 text-sm text-slate-600">Subject-wise, chapter-wise and topic-wise upload counts.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBreakdown(v => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 hover:text-slate-700"
          >
            {showBreakdown ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showBreakdown ? "Hide details" : "Show details"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase text-slate-400">Subjects</p>
          <p className="mt-1 text-lg font-black text-slate-800">{data.subjectCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase text-slate-400">Chapters</p>
          <p className="mt-1 text-lg font-black text-slate-800">{data.chapterCount}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-[10px] font-black uppercase text-slate-400">Topics</p>
          <p className="mt-1 text-lg font-black text-slate-800">{data.topicCount}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          <p className="text-[10px] font-black uppercase text-blue-500">Study Material</p>
          <p className="mt-1 text-lg font-black text-blue-700">{data.studyMaterialCount}</p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-[10px] font-black uppercase text-amber-500">DPP</p>
          <p className="mt-1 text-lg font-black text-amber-700">{data.dppCount}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-[10px] font-black uppercase text-emerald-500">Total Files</p>
          <p className="mt-1 text-lg font-black text-emerald-700">{data.totalContentCount}</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="max-h-[220px] overflow-auto border-t border-slate-100 p-3 space-y-2">
        {data.subjects.length === 0 ? (
          <p className="p-3 text-sm text-slate-400">No subjects available yet.</p>
        ) : (
          data.subjects.map((subject) => (
            <details key={subject.id} className="rounded-xl border border-slate-100 bg-slate-50/60" open>
              <summary className="flex cursor-pointer items-center justify-between gap-2 p-3">
                <span className="text-sm font-black text-slate-800">{subject.name}</span>
                <span className="flex items-center gap-2 text-[10px] font-black">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">SM {subject.studyMaterialCount}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">DPP {subject.dppCount}</span>
                </span>
              </summary>
              <div className="space-y-1 px-2 pb-2">
                {subject.chapters.map((chapter) => (
                  <details key={chapter.id} className="rounded-lg border border-slate-100 bg-white" open={false}>
                    <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
                      <span className="text-xs font-bold text-slate-700">{chapter.name}</span>
                      <span className="flex items-center gap-2 text-[10px] font-black">
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">SM {chapter.studyMaterialCount}</span>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">DPP {chapter.dppCount}</span>
                      </span>
                    </summary>
                    <div className="space-y-1 px-2 pb-2">
                      {chapter.topics.map((topic) => {
                        const isActive =
                          activePath === `${subject.id}:${chapter.id}:${topic.id}`;
                        return (
                          <div
                            key={topic.id}
                            className={cn(
                              "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px]",
                              isActive ? "bg-indigo-50 text-indigo-800" : "bg-slate-50 text-slate-700",
                            )}
                          >
                            <span className="truncate font-semibold">{topic.name}</span>
                            <span className="ml-3 flex items-center gap-1.5 font-black">
                              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">SM {topic.studyMaterialCount}</span>
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">DPP {topic.dppCount}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))
        )}
        </div>
      )}
    </div>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

const SAMPLE_JSON = `{
  "subjects": [
    {
      "name": "Physics",
      "colorCode": "#3B82F6",
      "chapters": [
        {
          "name": "Kinematics",
          "jeeWeightage": 8,
          "neetWeightage": 4,
          "topics": [
            { "name": "Vectors", "estimatedStudyMinutes": 60 },
            { "name": "Projectile Motion", "estimatedStudyMinutes": 90 }
          ]
        }
      ]
    },
    {
      "name": "Chemistry",
      "colorCode": "#10B981",
      "chapters": [
        {
          "name": "Atomic Structure",
          "jeeWeightage": 6,
          "topics": [
            { "name": "Bohr Model", "estimatedStudyMinutes": 60 }
          ]
        }
      ]
    }
  ]
}`;

type ImportMode = "json" | "excel";
type ImportStep = "input" | "preview" | "done";

function BulkImportModal({ batchId, batchName, examTarget, onClose }: {
  batchId: string;
  batchName: string;
  examTarget: string;
  onClose: () => void;
}) {
  const importMutation = useBulkImportCurriculum();
  const [mode, setMode] = useState<ImportMode>("json");
  const [step, setStep] = useState<ImportStep>("input");
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [parseError, setParseError] = useState("");
  const [parsedSubjects, setParsedSubjects] = useState<BulkImportSubject[]>([]);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");

  // Parse the Excel/CSV file client-side into the same BulkImportSubject[] shape
  const parseExcelFile = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      // Expected columns: Subject | Chapter | Topic | JEE Weightage | NEET Weightage | Minutes
      const subjectMap = new Map<string, Map<string, { topics: any[]; jee: number; neet: number }>>();
      for (const row of rows) {
        const subject = String(row["Subject"] || row["subject"] || "").trim();
        const chapter = String(row["Chapter"] || row["chapter"] || "").trim();
        const topic = String(row["Topic"] || row["topic"] || "").trim();
        if (!subject || !chapter || !topic) continue;
        const jee = Number(row["JEE Weightage"] || row["jeeWeightage"] || 0);
        const neet = Number(row["NEET Weightage"] || row["neetWeightage"] || 0);
        const mins = Number(row["Minutes"] || row["estimatedStudyMinutes"] || 60);

        if (!subjectMap.has(subject)) subjectMap.set(subject, new Map());
        const chapMap = subjectMap.get(subject)!;
        if (!chapMap.has(chapter)) chapMap.set(chapter, { topics: [], jee, neet });
        chapMap.get(chapter)!.topics.push({ name: topic, estimatedStudyMinutes: mins });
      }

      const subjects: BulkImportSubject[] = [];
      for (const [subjectName, chapMap] of subjectMap.entries()) {
        const chapters = [];
        for (const [chapName, data] of chapMap.entries()) {
          chapters.push({ name: chapName, jeeWeightage: data.jee, neetWeightage: data.neet, topics: data.topics });
        }
        subjects.push({ name: subjectName, chapters });
      }

      if (subjects.length === 0) {
        setParseError("No valid rows found. Check the column names: Subject, Chapter, Topic, JEE Weightage, NEET Weightage, Minutes");
        return;
      }
      setParseError("");
      setParsedSubjects(subjects);
      setStep("preview");
    } catch (e: any) {
      setParseError(`Failed to read file: ${e?.message ?? "Unknown error"}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    await parseExcelFile(file);
  };

  const handleParseJson = () => {
    setParseError("");
    try {
      const parsed = JSON.parse(jsonText);
      const subjects: BulkImportSubject[] = parsed.subjects ?? parsed;
      if (!Array.isArray(subjects) || subjects.length === 0) throw new Error("subjects array is empty");
      for (const s of subjects) {
        if (!s.name) throw new Error(`Subject missing "name" field`);
        if (!Array.isArray(s.chapters)) throw new Error(`Subject "${s.name}" missing "chapters" array`);
        for (const c of s.chapters) {
          if (!c.name) throw new Error(`Chapter missing "name" in subject "${s.name}"`);
          if (!Array.isArray(c.topics)) throw new Error(`Chapter "${c.name}" missing "topics" array`);
        }
      }
      setParsedSubjects(subjects);
      setStep("preview");
    } catch (e: any) {
      setParseError(e?.message ?? "Invalid JSON");
    }
  };

  const handleImport = async () => {
    const payload: BulkImportPayload = { batchId, examTarget, subjects: parsedSubjects };
    try {
      const res = await importMutation.mutateAsync(payload);
      setResult(res);
      setStep("done");
      toast.success(`Import complete — ${res.created.topics} topics created`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Import failed");
    }
  };

  const totalTopics = parsedSubjects.reduce((s, sub) =>
    s + sub.chapters.reduce((cs, ch) => cs + ch.topics.length, 0), 0);
  const totalChapters = parsedSubjects.reduce((s, sub) => s + sub.chapters.length, 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
              Bulk Import Curriculum
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {batchName} — Import subjects, chapters & topics in one shot
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0">
          {(["input", "preview", "done"] as ImportStep[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all",
                step === s ? "bg-indigo-600 text-white" :
                  (["input", "preview", "done"].indexOf(step) > i) ? "bg-emerald-100 text-emerald-700" :
                    "bg-slate-200 text-slate-400"
              )}>
                {(["input", "preview", "done"].indexOf(step) > i)
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <span>{i + 1}</span>}
                {s === "input" ? "Input" : s === "preview" ? "Preview" : "Done"}
              </div>
              {i < 2 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Input ── */}
          {step === "input" && (
            <div className="p-6 space-y-5">
              {/* Mode toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                {([
                    { id: "excel", label: "Upload Excel/CSV", icon: FileSpreadsheet },
                  { id: "json", label: "Paste JSON", icon: ClipboardList },
                
                ] as { id: ImportMode; label: string; icon: any }[]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setMode(id); setParseError(""); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all",
                      mode === id ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              {mode === "json" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">JSON Structure</p>
                    <button
                      onClick={() => setJsonText(SAMPLE_JSON)}
                      className="text-xs text-indigo-600 font-bold hover:underline"
                    >Load sample</button>
                  </div>
                  <textarea
                    value={jsonText}
                    onChange={e => setJsonText(e.target.value)}
                    rows={14}
                    spellCheck={false}
                    className="w-full font-mono text-xs bg-slate-900 text-emerald-300 p-4 rounded-2xl border border-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    Format: <code className="bg-slate-100 px-1 rounded">{"{ subjects: [{ name, colorCode?, chapters: [{ name, jeeWeightage?, neetWeightage?, topics: [{ name, estimatedStudyMinutes? }] }] }] }"}</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Excel template info */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-700">
                    <p className="font-bold mb-2">Required columns (header row):</p>
                    <div className="grid grid-cols-3 gap-1">
                      {["Subject", "Chapter", "Topic", "JEE Weightage", "NEET Weightage", "Minutes"].map(col => (
                        <code key={col} className="bg-white border border-indigo-200 px-2 py-1 rounded-lg font-bold">{col}</code>
                      ))}
                    </div>
                    <p className="mt-2 text-indigo-500">Each row = one topic. Repeat Subject/Chapter for multiple topics.</p>
                  </div>

                  {/* Drop zone */}
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-600 text-sm">{fileName || "Click to upload Excel or CSV"}</p>
                    <p className="text-xs text-slate-400 mt-1">.xlsx, .xls, .csv — max 5 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              )}

              {parseError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 font-medium">{parseError}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <div className="p-6 space-y-4">
              {/* Stats banner */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Subjects", val: parsedSubjects.length, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Chapters", val: totalChapters, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Topics", val: totalTopics, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map(s => (
                  <div key={s.label} className={cn("rounded-2xl p-4 text-center", s.bg)}>
                    <p className={cn("text-3xl font-black", s.color)}>{s.val}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Existing subjects/chapters/topics with matching names will be skipped (no duplicates created).
                New ones will be created under <strong className="text-slate-700">{batchName}</strong>.
              </p>

              {/* Tree preview */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {parsedSubjects.map((sub, si) => (
                  <div key={si} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100">
                      <GraduationCap className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-bold text-slate-800">{sub.name}</span>
                      {sub.colorCode && (
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: sub.colorCode }} />
                      )}
                      <span className="ml-auto text-[11px] text-slate-400 font-medium">
                        {sub.chapters.length} chapters · {sub.chapters.reduce((s, c) => s + c.topics.length, 0)} topics
                      </span>
                    </div>
                    <div className="p-3 space-y-2">
                      {sub.chapters.map((ch, ci) => (
                        <div key={ci} className="ml-2">
                          <div className="flex items-center gap-2 mb-1">
                            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-xs font-bold text-slate-700">{ch.name}</span>
                            {ch.jeeWeightage ? (
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100">
                                JEE {ch.jeeWeightage}%
                              </span>
                            ) : null}
                            <span className="text-[11px] text-slate-400 ml-auto">{ch.topics.length} topics</span>
                          </div>
                          <div className="ml-5 flex flex-wrap gap-1">
                            {ch.topics.map((t, ti) => (
                              <span key={ti} className="text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && result && (
            <div className="p-6 space-y-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Import Successful!</h3>
                <p className="text-sm text-slate-500">Your course curriculum has been updated.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-wider mb-2">Created</p>
                  {[
                    { label: "Subjects", val: result.created.subjects },
                    { label: "Chapters", val: result.created.chapters },
                    { label: "Topics", val: result.created.topics },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">{r.label}</span>
                      <span className="font-black text-emerald-700">{r.val}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Skipped (exists)</p>
                  {[
                    { label: "Subjects", val: result.skipped.subjects },
                    { label: "Chapters", val: result.skipped.chapters },
                    { label: "Topics", val: result.skipped.topics },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-slate-600 font-medium">{r.label}</span>
                      <span className="font-black text-slate-500">{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          {step === "input" && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                Cancel
              </button>
              <button
                onClick={mode === "json" ? handleParseJson : undefined}
                disabled={mode === "excel"}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
              >
                Preview <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("input")} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-sm font-black rounded-2xl hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-60"
              >
                {importMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                  : <><Zap className="w-4 h-4" /> Import {totalTopics} Topics</>}
              </button>
            </>
          )}
          {step === "done" && (
            <button
              onClick={onClose}
              className="w-full px-6 py-2.5 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Done — View Curriculum
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Add Subject Modal ────────────────────────────────────────────────────────

const PRESET_SUBJECTS = [
  { name: "Physics", color: "#3B82F6", icon: "⚡" },
  { name: "Chemistry", color: "#10B981", icon: "🧪" },
  { name: "Mathematics", color: "#F59E0B", icon: "📐" },
  { name: "Biology", color: "#22C55E", icon: "🧬" },
  { name: "English", color: "#8B5CF6", icon: "📝" },
  { name: "History", color: "#EC4899", icon: "📜" },
  { name: "Computer Science", color: "#0EA5E9", icon: "💻" },
  { name: "Geography", color: "#14B8A6", icon: "🌍" },
  { name: "Economics", color: "#F97316", icon: "📊" },
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
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
              {["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#0EA5E9", "#F97316"].map(c => (
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
    id: "dpp",
    label: "DPP Sheet",
    desc: "AI-generated Daily Practice Problems with MCQs, numericals & answer key",
    icon: PenLine,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    accent: "#EA580C",
    badge: "NEW",
    saveAs: "dpp",
  },
  {
    id: "pyq",
    label: "PYQ Practice",
    desc: "Previous Year Question style paper (JEE/NEET patterns) with solutions",
    icon: FileQuestion,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    accent: "#7C3AED",
    badge: "NEW",
    saveAs: "pyq",
  },
  {
    id: "study_guide",
    label: "Study Guide",
    desc: "Crisp exam-ready summary with all must-know points for quick revision",
    icon: Brain,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    accent: "#4F46E5",
    badge: null,
    saveAs: "notes",
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
    saveAs: "notes",
  },
  {
    id: "flashcard",
    label: "Flashcards",
    desc: "Bite-sized Q&A cards for quick concept recall and spaced repetition",
    icon: StickyNote,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    accent: "#D97706",
    badge: null,
    saveAs: "notes",
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
    saveAs: "notes",
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
    saveAs: "notes",
  },
];

function ReactMarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}

const DIFFICULTY_LEVELS = [
  { id: "basic", label: "Basic", desc: "Introductory, easy language" },
  { id: "intermediate", label: "Intermediate", desc: "Standard curriculum depth" },
  { id: "advanced", label: "Advanced", desc: "Competitive exam level" },
];

const LENGTH_OPTIONS = [
  { id: "brief", label: "Brief", desc: "~300 words" },
  { id: "standard", label: "Standard", desc: "~800 words" },
  { id: "detailed", label: "Detailed", desc: "~1500 words" },
];

function AiContentPanel({ topicId, topicName, subjectName, chapterName }: {
  topicId: string;
  topicName: string;
  subjectName: string;
  chapterName: string;
}) {
  const [selectedType, setSelectedType] = useState("dpp");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [length, setLength] = useState("standard");
  const [examTarget, setExamTarget] = useState("JEE");
  const [questionCount, setQuestionCount] = useState(10);
  const [extraContext, setExtraContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const isDppOrPyq = selectedType === "dpp" || selectedType === "pyq";

  const selectedTypeCfg = AI_CONTENT_TYPES.find(t => t.id === selectedType)!;

  // Re-clear preview when topic changes
  React.useEffect(() => {
    setGeneratedContent(null);
    setSavedOk(false);
  }, [topicId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedContent(null);
    setSavedOk(false);
    try {
      const extraCtx = [
        isDppOrPyq ? `Exam target: ${examTarget}` : "",
        isDppOrPyq ? `Generate exactly ${questionCount} questions` : "",
        extraContext.trim(),
      ].filter(Boolean).join(". ") || undefined;

      const result = await import("@/lib/api/admin").then(m =>
        m.generateTopicAiContent(topicId, {
          contentType: selectedType as any,
          difficulty: isDppOrPyq ? "intermediate" : difficulty as any,
          length: isDppOrPyq ? "detailed" : length as any,
          extraContext: extraCtx,
        })
      );
      setGeneratedContent(result.content ?? "");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message ?? "AI generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;
    setSaving(true);
    try {
      await import("@/lib/api/admin").then(m =>
        m.saveAiGeneratedResource(topicId, {
          title: `${selectedTypeCfg.label} — ${topicName}`,
          content: generatedContent,
          resourceType: selectedTypeCfg.saveAs,
        })
      );
      setSavedOk(true);
      toast.success(`Saved as ${selectedTypeCfg.label} — students can now access it!`);
    } catch {
      toast.error("Save failed — please try again");
    } finally {
      setSaving(false);
    }
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
          <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-xl">
            <Zap className="w-3 h-3 text-violet-500" />
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-wide">AI Powered</span>
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
                  onClick={() => { setSelectedType(ct.id); setGeneratedContent(null); setSavedOk(false); }}
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

          {isDppOrPyq ? (
            <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              {/* Exam Target */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Exam Target</p>
                <div className="flex gap-2">
                  {["JEE", "NEET", "Both"].map(t => (
                    <button
                      key={t}
                      onClick={() => setExamTarget(t)}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl text-center text-[12px] font-black border-2 transition-all",
                        examTarget === t
                          ? selectedType === "dpp"
                            ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                            : "bg-violet-600 border-violet-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                  Number of Questions
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {[5, 10, 15, 20, 25, 30].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuestionCount(n)}
                        className={cn(
                          "w-10 h-9 rounded-xl text-xs font-black border-2 transition-all",
                          questionCount === n
                            ? selectedType === "dpp"
                              ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                              : "bg-violet-600 border-violet-600 text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={() => setQuestionCount(q => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 font-black text-sm hover:border-slate-300 flex items-center justify-center"
                    >−</button>
                    <span className="text-sm font-black text-slate-800 w-6 text-center">{questionCount}</span>
                    <button
                      onClick={() => setQuestionCount(q => Math.min(50, q + 1))}
                      className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 font-black text-sm hover:border-slate-300 flex items-center justify-center"
                    >+</button>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">
                {selectedType === "dpp"
                  ? `${questionCount} questions: MCQ + Assertion-Reason + Numericals + Answer Key`
                  : `${questionCount} questions: JEE Main + NEET + Integer Type + Full Solutions`}
              </p>
            </div>
          ) : (
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
          )}
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
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating with AI…
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generate {selectedTypeCfg.label} with AI
            </>
          )}
        </motion.button>

        {/* ── Generated content preview ── */}
        <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Preview</p>
            {generatedContent && (
              <div className="ml-auto flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wide">Ready</span>
              </div>
            )}
          </div>

          {generating ? (
            <div className="p-5 space-y-3">
              {[85, 100, 70, 95, 55, 100, 75, 90, 60].map((w, i) => (
                <div
                  key={i}
                  className={cn("h-2.5 rounded-full bg-violet-100 animate-pulse", i === 0 && "h-4 mb-4")}
                  style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
              <p className="text-center text-xs text-violet-400 font-bold pt-2">AI is crafting your content…</p>
            </div>
          ) : generatedContent ? (
            <div className="p-5">
              <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded max-h-96 overflow-y-auto text-sm leading-relaxed">
                <ReactMarkdownContent content={generatedContent} />
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-violet-300" />
              </div>
              <p className="text-sm font-black text-slate-400">Generated content will appear here</p>
              <p className="text-[11px] text-slate-300">Choose a type, configure settings, and click Generate</p>
            </div>
          )}
        </div>

        {/* ── Save as Notes button (shown only when content is ready) ── */}
        {generatedContent && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || savedOk}
            className={cn(
              "w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 border-2 transition-all",
              savedOk
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400"
            )}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : savedOk ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved — Students Can Now Access This!</>
            ) : (
              <><BookMarked className="w-4 h-4" /> Save as {selectedTypeCfg.label} for Students</>
            )}
          </motion.button>
        )}

        {/* ── Feature info chips ── */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          {[
            { icon: Brain, label: "Context-Aware", sub: "Uses topic + chapter context" },
            { icon: BookMarked, label: "Curriculum-Fit", sub: "Aligned to exam syllabus" },
            { icon: Zap, label: "One-Click Save", sub: "Students see it instantly" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-3.5 h-3.5 text-violet-400" />
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

// ─── Lectures linked to topic (admin content workspace) ─────────────────────

type AdminTopicLectureRow = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  type: string;
  videoUrl?: string | null;
  scheduledAt?: string | null;
  liveMeetingUrl?: string | null;
  topicId?: string | null;         // flat field (may be absent)
  topic?: { id?: string; name?: string } | null;  // nested object (primary from API)
  batch?: { id?: string; name?: string } | null;
  thumbnailUrl?: string | null;
};

function lectureStatusStyles(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "published") return "bg-emerald-100 text-emerald-800";
  if (s === "live") return "bg-red-100 text-red-800";
  if (s === "scheduled") return "bg-amber-100 text-amber-900";
  if (s === "ended") return "bg-slate-100 text-slate-700";
  if (s === "draft" || s === "processing") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-600";
}

function LectureAdminCard({ lec }: { lec: AdminTopicLectureRow }) {
  const videoHref = lec.videoUrl ? resolveUrl(lec.videoUrl) : "";
  const ytId = videoHref && isYouTube(videoHref) ? getYouTubeId(videoHref) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-slate-900 leading-snug">{lec.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={cn("text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full", lectureStatusStyles(lec.status))}>
              {lec.status}
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
              {lec.type}
            </span>
            {lec.topic?.name && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Topic: {lec.topic.name}
              </span>
            )}
            {lec.scheduledAt && (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 shrink-0" />
                {new Date(lec.scheduledAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          {videoHref ? (
            <a
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {ytId ? <Youtube className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {ytId ? "YouTube" : "Open video"}
            </a>
          ) : null}
          {lec.liveMeetingUrl ? (
            <a
              href={lec.liveMeetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black text-violet-600 hover:text-violet-800 flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Live / meet link
            </a>
          ) : null}
        </div>
      </div>
      {ytId ? (
        <div className="aspect-video rounded-xl overflow-hidden border border-slate-200 bg-black max-w-xl">
          <iframe
            title={lec.title}
            src={`https://www.youtube.com/embed/${ytId}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      {lec.description ? (
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-2.5">
          {lec.description}
        </p>
      ) : (
        <p className="text-[11px] text-slate-400 italic border-t border-slate-100 pt-2.5">No description provided.</p>
      )}
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
            {batch.enrolledCount ?? batch.studentCount ?? 0} enrolled
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: batches = [], isLoading: batchesLoading } = useBatches();
  const batchList = Array.isArray(batches) ? batches : [];

  const initialBatchId = searchParams.get("batchId");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId);
  const [selectedEntry, setSelectedEntry] = useState<{
    topic: Topic; chapter: Chapter; subject: Subject;
  } | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [batchSearch, setBatchSearch] = useState("");
  const [batchStatusFilter, setBatchStatusFilter] = useState<"active" | "all" | "upcoming" | "completed">("active");
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [recentBatchId, setRecentBatchId] = useState<string | null>(null);

  useEffect(() => {
    const bId = searchParams.get("batchId");
    setSelectedBatchId(bId);
    if (!bId) {
      setSelectedEntry(null);
    }
  }, [searchParams]);


  useEffect(() => {
    const saved = localStorage.getItem("admin_content_recent_batch_id");
    if (saved) setRecentBatchId(saved);
  }, []);

  const selectedBatch = batchList.find(b => b.id === selectedBatchId);
  const recentBatch = batchList.find(b => b.id === recentBatchId);

  const filteredBatches = batchList.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(batchSearch.toLowerCase());
    const status = String(b.status ?? "").toLowerCase();
    const matchesStatus = batchStatusFilter === "all" ? true : status === batchStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectBatch = (id: string) => {
    if (id !== selectedBatchId) {
      setSelectedBatchId(id);
      setSelectedEntry(null);
    }
    setRecentBatchId(id);
    localStorage.setItem("admin_content_recent_batch_id", id);
  };

  const handleBack = () => {
    setSelectedBatchId(null);
    setSelectedEntry(null);
    setBatchSearch("");
    setBatchStatusFilter("active");
  };

  // ── Phase 1: No course selected — full-width course grid ──────────────────
  if (!selectedBatch) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-6">
        {/* Page header */}
        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Content Manager</p>
          <h1 className="text-2xl font-black text-slate-900">Your Courses</h1>
          <p className="text-sm text-slate-500 mt-1">Select a course to manage its subjects, chapters, topics and resources.</p>
        </div>

        {/* Quick stats + continue card */}
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
              Ongoing: {batchList.filter((b) => String(b.status ?? "").toLowerCase() === "active").length}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-black text-slate-600">
              Total: {batchList.length}
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-700">
              Showing: {filteredBatches.length}
            </span>
          </div>
          {recentBatch && (
            <button
              type="button"
              onClick={() => handleSelectBatch(recentBatch.id)}
              className="group flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-left hover:bg-indigo-100 transition-colors"
            >
              <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-indigo-500">Continue where you left off</p>
                <p className="text-xs font-bold text-indigo-900 truncate">{recentBatch.name}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600" />
            </button>
          )}
        </div>

        {/* Search & Filters Row */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              placeholder="Search courses…"
              value={batchSearch}
              onChange={e => setBatchSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-400 shadow-sm transition-colors"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="relative shrink-0 sm:w-44">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
            </div>
            <select
              value={batchStatusFilter}
              onChange={e => setBatchStatusFilter(e.target.value as any)}
              className="h-10 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-9 pr-10 text-xs font-black text-slate-600 shadow-sm outline-none transition focus:border-blue-400"
            >
              <option value="active">Ongoing</option>
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          {batchSearch && (
            <button
              onClick={() => setBatchSearch("")}
              className="text-xs font-bold text-red-500 hover:underline transition-all"
            >
              Clear search
            </button>
          )}
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
              {batchSearch || batchStatusFilter !== "all" ? "No courses match current filters" : "No courses yet"}
            </p>
            {!batchSearch && batchStatusFilter === "all" && (
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
                {[selectedBatch.examTarget, selectedBatch.class ? `Class ${selectedBatch.class}` : null, `${selectedBatch.enrolledCount ?? selectedBatch.studentCount ?? 0} students`].filter(Boolean).join(" · ")}
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

          {/* Bulk Import */}
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-indigo-700 text-xs font-black shrink-0 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Bulk Import
          </button>

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
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left: Tree Navigator */}
        <div className="w-80 shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden">
          <TreeNav
            batchId={selectedBatch.id}
            examTarget={selectedBatch.examTarget}
            selectedTopic={selectedEntry}
            onSelectTopic={(topic, chapter, subject) => {
              setSelectedEntry({ topic, chapter, subject });
              setShowAiPanel(false);
            }}
            onAddSubject={() => setShowAddSubject(true)}
          />
        </div>

        {/* Right: Resource workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">
          {!selectedEntry ? (
            /* ── No topic selected: welcome state ── */
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Coverage overview at top */}
              <div className="p-6 pb-0">
                <ContentCoverageOverview batchId={selectedBatch.id} selectedEntry={null} />
              </div>
              {/* Select a topic prompt */}
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center border border-blue-100 shadow-sm">
                  <Layers className="w-10 h-10 text-blue-300" />
                </div>
                <div className="max-w-sm">
                  <p className="text-lg font-black text-slate-700">Select a Topic to Begin</p>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Expand a subject in the tree on the left, open a chapter, then click any topic to manage its resources.
                  </p>
                </div>
                {/* Resource type guide */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                  {RES_TYPES.map(rt => {
                    const Icon = rt.icon;
                    return (
                      <div key={rt.value} className={cn("flex items-center gap-2 px-3 py-2 rounded-2xl border bg-white shadow-sm", rt.border)}>
                        <Icon className={cn("w-3.5 h-3.5 shrink-0", rt.color)} />
                        <span className={cn("text-xs font-bold", rt.color)}>{rt.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ── Topic selected: workspace ── */
            <div className="flex-1 overflow-hidden flex">
              <ResourceWorkspace
                key={selectedEntry.topic.id}
                topicId={selectedEntry.topic.id}
                topicName={selectedEntry.topic.name}
                batchId={selectedBatch.id}
                subject={selectedEntry.subject}
                chapter={selectedEntry.chapter}
                onNavigateToLectures={() => {
                  const q = new URLSearchParams({
                    batchId: selectedBatch.id,
                    subjectId: selectedEntry.subject.id,
                    chapterId: selectedEntry.chapter.id,
                    topicId: selectedEntry.topic.id,
                  });
                  navigate(`/teacher/lectures?${q.toString()}`);
                }}
                onOpenAi={() => setShowAiPanel(true)}
              />
            </div>
          )}
        </div>

        {/* ── AI Slide-over panel ── */}
        <AnimatePresence>
          {showAiPanel && selectedEntry && (
            <>
              {/* backdrop */}
              <motion.div
                key="ai-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/20 z-20"
                onClick={() => setShowAiPanel(false)}
              />
              {/* panel */}
              <motion.div
                key="ai-panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="absolute right-0 top-0 bottom-0 w-[520px] max-w-full bg-white shadow-2xl z-30 flex flex-col overflow-hidden border-l border-slate-200"
              >
                {/* Panel header */}
                <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">AI Content Generator</p>
                      <p className="text-[11px] text-violet-600 font-semibold truncate max-w-[260px]">{selectedEntry.topic.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Panel body */}
                <div className="flex-1 overflow-hidden">
                  <AiContentPanel
                    topicId={selectedEntry.topic.id}
                    topicName={selectedEntry.topic.name}
                    subjectName={selectedEntry.subject.name}
                    chapterName={selectedEntry.chapter.name}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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
        {showBulkImport && selectedBatch && (
          <BulkImportModal
            key="bulk-import"
            batchId={selectedBatch.id}
            batchName={selectedBatch.name}
            examTarget={selectedBatch.examTarget}
            onClose={() => setShowBulkImport(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentPage;
