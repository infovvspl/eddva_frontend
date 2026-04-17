import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";
import { FILE_LIMITS } from "@/lib/api/upload";

interface ProfileUploadProps {
  currentUrl?: string | null;
  onUpload: (fileUrl: string) => void;
  onRemove?: () => void;
  size?: "sm" | "md" | "lg";
  shape?: "circle" | "rounded";
  className?: string;
  disabled?: boolean;
}

const SIZE = { sm: "w-16 h-16", md: "w-24 h-24", lg: "w-32 h-32" } as const;
const ICON = { sm: "w-5 h-5", md: "w-7 h-7", lg: "w-9 h-9" } as const;

export function ProfileUpload({
  currentUrl,
  onUpload,
  onRemove,
  size = "md",
  shape = "circle",
  className,
  disabled = false,
}: ProfileUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const { upload, uploading, progress, error } = useUpload({ type: "profile", onSuccess: onUpload });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Instant local preview
    setPreview(URL.createObjectURL(file));
    const url = await upload(file);
    if (!url) setPreview(currentUrl ?? null); // revert on failure
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleRemove = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    setPreview(null);
    onRemove?.();
  };

  const limit = FILE_LIMITS.profile;
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "relative group overflow-hidden border-2 border-dashed transition-all duration-200",
          shapeClass, SIZE[size],
          preview ? "border-transparent" : "border-slate-200 hover:border-indigo-400 bg-slate-50",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        title="Click to upload profile photo"
      >
        {preview ? (
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className={cn("text-slate-300 group-hover:text-indigo-400 transition-colors mx-auto", ICON[size])} />
        )}

        {/* Hover overlay */}
        {!uploading && (
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            shapeClass,
          )}>
            <Camera className="w-5 h-5 text-white" />
          </div>
        )}

        {/* Upload progress overlay */}
        {uploading && (
          <div className={cn("absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-1", shapeClass)}>
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-600">{progress}%</span>
          </div>
        )}

        {/* Radial progress ring */}
        {uploading && (
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="#e0e7ff" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke="#6366f1" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.2s ease" }}
            />
          </svg>
        )}
      </button>

      {/* Remove button */}
      {preview && !uploading && onRemove && (
        <motion.button
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          type="button" onClick={handleRemove}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
          title="Remove photo"
        >
          <Trash2 className="w-3 h-3" />
        </motion.button>
      )}

      {error && <p className="text-xs text-red-500 text-center max-w-[120px]">{error}</p>}

      <p className="text-[11px] text-slate-400 text-center">
        {uploading ? `Uploading… ${progress}%` : `JPG/PNG/WebP · max ${limit.maxMb}MB`}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={limit.accept.join(",")}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
