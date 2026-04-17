import { useState, useCallback } from "react";
import { uploadToS3, deleteS3File, validateFile } from "@/lib/api/upload";
import type { UploadType, UploadProgressEvent } from "@/lib/api/upload";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Single file upload hook
// ---------------------------------------------------------------------------

export interface UseUploadOptions {
  type: UploadType;
  courseId?: string;
  lectureId?: string;
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: string) => void;
}

export interface UploadState {
  uploading: boolean;
  progress: number;      // 0–100
  fileUrl: string | null;
  error: string | null;
}

export function useUpload({ type, courseId, onSuccess, onError }: UseUploadOptions) {
  const { user } = useAuthStore();
  const [state, setState] = useState<UploadState>({
    uploading: false, progress: 0, fileUrl: null, error: null,
  });

  const upload = useCallback(async (file: File): Promise<string | null> => {
    if (!user?.tenantId) {
      const msg = "No tenant associated with your account.";
      setState(s => ({ ...s, error: msg }));
      onError?.(msg);
      return null;
    }

    const validationError = validateFile(file, type);
    if (validationError) {
      setState(s => ({ ...s, error: validationError }));
      onError?.(validationError);
      toast.error(validationError);
      return null;
    }

    setState({ uploading: true, progress: 0, fileUrl: null, error: null });

    const handleProgress = (e: UploadProgressEvent) => {
      setState(s => ({ ...s, progress: e.percent }));
    };

    try {
      const fileUrl = await uploadToS3(
        { type, courseId, lectureId, fileName: file.name, contentType: file.type, fileSize: file.size },
        file,
        handleProgress,
      );
      setState({ uploading: false, progress: 100, fileUrl, error: null });
      onSuccess?.(fileUrl);
      return fileUrl;
    } catch (err: any) {
      const msg = err?.message || "Upload failed. Please try again.";
      setState({ uploading: false, progress: 0, fileUrl: null, error: msg });
      onError?.(msg);
      toast.error(msg);
      return null;
    }
  }, [user?.tenantId, type, courseId, lectureId, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({ uploading: false, progress: 0, fileUrl: null, error: null });
  }, []);

  return { ...state, upload, reset };
}

// ---------------------------------------------------------------------------
// Multi-file upload hook (materials)
// ---------------------------------------------------------------------------

export interface UploadedFile {
  id: string;            // local key for React
  file: File;
  fileUrl: string | null;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error: string | null;
}

export function useMultiUpload(courseId?: string) {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const updateFile = (id: string, patch: Partial<UploadedFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };

  const addFiles = useCallback((incoming: File[]) => {
    const newEntries: UploadedFile[] = incoming.map(file => ({
      id: `${file.name}_${Date.now()}_${Math.random()}`,
      file,
      fileUrl: null,
      progress: 0,
      status: "pending" as const,
      error: null,
    }));
    setFiles(prev => [...prev, ...newEntries]);
    return newEntries;
  }, []);

  const uploadAll = useCallback(async (incoming?: File[]) => {
    if (!user?.tenantId) { toast.error("No tenant associated with your account."); return []; }

    const entries = incoming ? addFiles(incoming) : files.filter(f => f.status === "pending");
    const results: string[] = [];

    await Promise.allSettled(
      entries.map(async entry => {
        const validationError = validateFile(entry.file, "material");
        if (validationError) {
          updateFile(entry.id, { status: "error", error: validationError });
          return;
        }

        updateFile(entry.id, { status: "uploading", progress: 0 });
        try {
          const fileUrl = await uploadToS3(
            { type: "material", courseId, fileName: entry.file.name, contentType: entry.file.type, fileSize: entry.file.size },
            entry.file,
            (e) => updateFile(entry.id, { progress: e.percent }),
          );
          updateFile(entry.id, { status: "done", fileUrl, progress: 100 });
          results.push(fileUrl);
        } catch (err: any) {
          updateFile(entry.id, { status: "error", error: err?.message || "Upload failed", progress: 0 });
        }
      })
    );

    return results;
  }, [user?.tenantId, courseId, files, addFiles]);

  const retryFile = useCallback(async (id: string) => {
    if (!user?.tenantId) return;
    const entry = files.find(f => f.id === id);
    if (!entry) return;

    updateFile(id, { status: "uploading", error: null, progress: 0 });
    try {
      const fileUrl = await uploadToS3(
        { type: "material", courseId, fileName: entry.file.name, contentType: entry.file.type, fileSize: entry.file.size },
        entry.file,
        (e) => updateFile(id, { progress: e.percent }),
      );
      updateFile(id, { status: "done", fileUrl, progress: 100 });
    } catch (err: any) {
      updateFile(id, { status: "error", error: err?.message || "Upload failed", progress: 0 });
    }
  }, [user?.tenantId, courseId, files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAll = useCallback(() => setFiles([]), []);

  const doneUrls = files.filter(f => f.status === "done" && f.fileUrl).map(f => f.fileUrl!);
  const hasErrors = files.some(f => f.status === "error");
  const allDone = files.length > 0 && files.every(f => f.status === "done" || f.status === "error");

  return { files, uploadAll, retryFile, removeFile, clearAll, doneUrls, hasErrors, allDone };
}

// ---------------------------------------------------------------------------
// Delete hook
// ---------------------------------------------------------------------------

export function useDeleteS3File() {
  const { user } = useAuthStore();
  const [deleting, setDeleting] = useState(false);

  const deleteFile = useCallback(async (key: string) => {
    if (!user?.tenantId) return;
    setDeleting(true);
    try {
      await deleteS3File({ tenantId: user.tenantId, key });
      toast.success("File deleted.");
    } catch {
      toast.error("Could not delete file.");
    } finally {
      setDeleting(false);
    }
  }, [user?.tenantId]);

  return { deleteFile, deleting };
}
