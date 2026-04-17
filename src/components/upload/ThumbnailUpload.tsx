import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, X, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";
import { FILE_LIMITS } from "@/lib/api/upload";

interface ThumbnailUploadProps {
  courseId: string;
  currentUrl?: string | null;
  onUpload: (fileUrl: string) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
}

export function ThumbnailUpload({ courseId, currentUrl, onUpload, onRemove, className, disabled }: ThumbnailUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<string | null>(currentUrl ?? null);
  const [dragging, setDragging] = useState(false);

  const { upload, uploading, progress, error, reset } = useUpload({
    type: "thumbnail",
    courseId,
    onSuccess: (url) => { onUpload(url); },
  });

  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  const processFile = useCallback(async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    const result = await upload(file);
    if (!result) setPreview(currentUrl ?? null);
    URL.revokeObjectURL(objectUrl);
  }, [upload, currentUrl]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, [disabled, uploading, processFile]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleRemove = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setPreview(null);
    reset();
    onRemove?.();
  };

  const limit = FILE_LIMITS.thumbnail;

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={() => !uploading && !disabled && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative w-full aspect-video rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer group",
          preview ? "border-transparent" : "border-dashed",
          dragging ? "border-indigo-400 bg-indigo-50 scale-[1.01]" : preview ? "border-transparent" : "border-slate-200 hover:border-indigo-400 bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <AnimatePresence mode="wait">
          {preview ? (
            <motion.img
              key="preview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              src={preview} alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                dragging ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-indigo-100"
              )}>
                {dragging
                  ? <Upload className="w-6 h-6 text-indigo-500" />
                  : <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                }
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                  {dragging ? "Drop to upload" : "Drag & drop or click to upload"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  JPG, PNG, WebP · max {limit.maxMb}MB
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover overlay on existing image */}
        {preview && !uploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex items-center gap-2 text-white">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-semibold">Replace thumbnail</span>
            </div>
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
            <div className="w-48 h-1.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-white text-sm font-semibold">{progress}%</p>
          </div>
        )}
      </div>

      {/* Remove button */}
      {preview && !uploading && onRemove && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          type="button" onClick={handleRemove}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors z-10"
          title="Remove thumbnail"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-500 flex items-center gap-1"
        >
          {error}
        </motion.p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={limit.accept.join(",")}
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
