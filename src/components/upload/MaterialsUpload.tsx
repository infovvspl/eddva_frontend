import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, FileImage, File as FileIcon,
  X, RefreshCw, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMultiUpload } from "@/hooks/use-upload";
import type { UploadedFile } from "@/hooks/use-upload";
import { FILE_LIMITS } from "@/lib/api/upload";

interface MaterialsUploadProps {
  courseId?: string;
  onUploadComplete?: (fileUrls: string[]) => void;
  className?: string;
  disabled?: boolean;
}

// ── File icon by MIME type ─────────────────────────────────────────────────────

function FileTypeIcon({ contentType, className }: { contentType: string; className?: string }) {
  if (contentType.startsWith("image/"))       return <FileImage className={cn("text-blue-500", className)} />;
  if (contentType === "application/pdf")      return <FileText  className={cn("text-red-500",  className)} />;
  return <FileIcon className={cn("text-slate-400", className)} />;
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ value, status }: { value: number; status: UploadedFile["status"] }) {
  const color =
    status === "done"       ? "bg-emerald-500" :
    status === "error"      ? "bg-red-400"     :
    status === "uploading"  ? "bg-indigo-500"  : "bg-slate-200";

  return (
    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className={cn("h-full rounded-full transition-colors", color)}
        animate={{ width: status === "pending" ? "0%" : status === "done" ? "100%" : `${value}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

// ── Single file row ───────────────────────────────────────────────────────────

function FileRow({ file: f, onRemove, onRetry }: {
  file: UploadedFile;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const sizeMb = (f.file.size / (1024 * 1024)).toFixed(1);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 group"
    >
      <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
        <FileTypeIcon contentType={f.file.type} className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700 truncate">{f.file.name}</p>
          <span className="text-[11px] text-slate-400 shrink-0">{sizeMb}MB</span>
        </div>
        <ProgressBar value={f.progress} status={f.status} />
        {f.error && <p className="text-[11px] text-red-500">{f.error}</p>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {f.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {f.status === "uploading" && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
            <span className="text-[11px] text-indigo-600 font-semibold">{f.progress}%</span>
          </div>
        )}
        {f.status === "error" && (
          <button onClick={onRetry} title="Retry"
            className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
          </button>
        )}
        {f.status !== "uploading" && (
          <button onClick={onRemove} title="Remove"
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MaterialsUpload({ courseId, onUploadComplete, className, disabled }: MaterialsUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { files, uploadAll, retryFile, removeFile, clearAll, hasErrors } = useMultiUpload(courseId);
  const isDragging = useRef(false);

  const handleFiles = useCallback(async (incoming: File[]) => {
    const urls = await uploadAll(incoming);
    if (urls.length > 0) onUploadComplete?.(urls);
  }, [uploadAll, onUploadComplete]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length) await handleFiles(selected);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    isDragging.current = false;
    if (disabled) return;
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) await handleFiles(dropped);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); isDragging.current = true; };

  const limit = FILE_LIMITS.material;
  const pendingCount = files.filter(f => f.status === "pending" || f.status === "uploading").length;
  const doneCount    = files.filter(f => f.status === "done").length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => { isDragging.current = false; }}
        onClick={() => !disabled && fileRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group",
          disabled ? "opacity-50 cursor-not-allowed border-slate-200" : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40",
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-indigo-100 transition-colors flex items-center justify-center">
            <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
              Drag files here, or <span className="text-indigo-500 underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              PDF, JPG, PNG, DOCX · max {limit.maxMb}MB per file · multiple files allowed
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      <AnimatePresence initial={false}>
        {files.map(f => (
          <FileRow
            key={f.id}
            file={f}
            onRemove={() => removeFile(f.id)}
            onRetry={() => retryFile(f.id)}
          />
        ))}
      </AnimatePresence>

      {/* Footer bar */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between pt-1"
        >
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {pendingCount > 0 && (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                {pendingCount} uploading…
              </span>
            )}
            {doneCount > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3 h-3" /> {doneCount} uploaded
              </span>
            )}
            {hasErrors && (
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <AlertCircle className="w-3 h-3" /> Some uploads failed — retry above
              </span>
            )}
          </div>
          <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors">
            Clear all
          </button>
        </motion.div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        accept={limit.accept.join(",")}
        className="hidden"
        onChange={handleInput}
      />
    </div>
  );
}
