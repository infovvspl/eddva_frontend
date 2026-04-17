import { apiClient, extractData } from "./client";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadType = "profile" | "thumbnail" | "material" | "source" | "lecture-video" | "lecture-thumbnail" | "lecture-attachment";

export interface UploadUrlRequest {
  type: UploadType;
  courseId?: string;
  lectureId?: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export interface DeleteFileRequest {
  tenantId: string;
  key: string;
}

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

export const FILE_LIMITS = {
  profile:             { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  thumbnail:           { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  material:            { maxMb: 10,   accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
  source:              { maxMb: 10,   accept: ["application/zip", "application/x-zip-compressed"] },
  "lecture-video":     { maxMb: 10000, accept: ["video/mp4", "video/webm", "video/quicktime"] },
  "lecture-thumbnail": { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  "lecture-attachment":{ maxMb: 10,   accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
} satisfies Record<UploadType, { maxMb: number; accept: string[] }>;

export function validateFile(file: File, type: UploadType): string | null {
  const limit = FILE_LIMITS[type];
  const maxBytes = limit.maxMb * 1024 * 1024;

  if (file.size > maxBytes) {
    return `File too large. Maximum size is ${limit.maxMb}MB.`;
  }
  if (limit.accept.length > 0 && !limit.accept.includes(file.type)) {
    const exts = limit.accept.map(t => t.split("/")[1]).join(", ");
    return `Invalid file type. Allowed: ${exts}.`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Step 1 — Get pre-signed URL from backend
// ---------------------------------------------------------------------------

export async function requestUploadUrl(payload: UploadUrlRequest): Promise<UploadUrlResponse> {
  const res = await apiClient.post("/upload/url", payload);
  return extractData<UploadUrlResponse>(res);
}

// ---------------------------------------------------------------------------
// Step 2 — PUT file directly to S3 (no auth header, pre-signed URL)
// ---------------------------------------------------------------------------

export async function putFileToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<void> {
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    },
    // Deliberately no auth interceptors — S3 pre-signed URL handles auth
    transformRequest: [(data) => data],
  });
}

// ---------------------------------------------------------------------------
// Combined helper — request URL + upload + return final fileUrl
// ---------------------------------------------------------------------------

export async function uploadToS3(
  payload: UploadUrlRequest,
  file: File,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<string> {
  const error = validateFile(file, payload.type);
  if (error) throw new Error(error);

  const { uploadUrl, fileUrl } = await requestUploadUrl(payload);
  await putFileToS3(uploadUrl, file, onProgress);
  return fileUrl;
}

// ---------------------------------------------------------------------------
// Delete file from S3 via backend
// ---------------------------------------------------------------------------

export async function deleteS3File(payload: DeleteFileRequest): Promise<void> {
  await apiClient.delete("/upload", { data: payload });
}
