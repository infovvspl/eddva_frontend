import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Film, UploadCloud, X, Loader2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";
import { FILE_LIMITS } from "@/lib/api/upload";

interface LectureVideoUploadProps {
  lectureId: string;
  currentUrl?: string | null;
  onUpload: (fileUrl: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

export function LectureVideoUpload({
  lectureId,
  currentUrl,
  onUpload,
  onRemove,
  disabled = false,
}: LectureVideoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { upload, uploading, progress, error, reset } = useUpload({
    type: "lecture-video",
    lectureId,
    onSuccess: onUpload,
  });

  const handleFile = async (file: File) => {
    if (disabled || uploading) return;
    const url = await upload(file);
    if (!url) {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, uploading, upload]);

  const limit = FILE_LIMITS["lecture-video"];

  if (currentUrl && !uploading) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center group border border-slate-200">
        <video 
          src={currentUrl} 
          controls 
          className="w-full h-full object-contain"
        />
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all z-10"
            title="Remove Video"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileRef.current?.click()}
        className={cn(
          "relative aspect-video flex flex-col items-center justify-center gap-4",
          "border-2 border-dashed rounded-xl transition-colors",
          isDragOver ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed",
          uploading && "pointer-events-none"
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3 w-full px-8">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <h4 className="text-sm font-semibold text-slate-700">Uploading Video...</h4>
            
            <div className="w-full max-w-sm bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <p className="text-xs font-medium text-slate-500">{progress}% Completed</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              <Film className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                <span className="text-indigo-600 underline cursor-pointer hover:text-indigo-700">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">MP4, WebM up to 10GB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
          <X className="w-4 h-4 shrink-0" />
          <p>{error}</p>
          <button 
            type="button" 
            onClick={reset}
            className="ml-auto text-xs underline font-medium hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={limit.accept.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
