import { apiClient, extractData } from "./client";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadType =
  | "profile"
  | "thumbnail"
  | "material"
  | "source"
  | "lecture-video"
  | "lecture-thumbnail"
  | "lecture-attachment"
  | "doubt-response-image";

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

const s3UploadClient = axios.create({
  withCredentials: false,
});

delete s3UploadClient.defaults.headers.common.Accept;
delete s3UploadClient.defaults.headers.common.Authorization;

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

export const FILE_LIMITS = {
  profile:             { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  thumbnail:           { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  material:            { maxMb: 10,   accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
  source:              { maxMb: 10,   accept: ["application/zip", "application/x-zip-compressed"] },
  "lecture-video":     { maxMb: 10240, accept: ["video/mp4", "video/webm", "video/quicktime"] },
  "lecture-thumbnail": { maxMb: 10,   accept: ["image/jpeg", "image/png", "image/webp"] },
  "lecture-attachment":{ maxMb: 10,   accept: ["application/pdf", "image/jpeg", "image/png", "image/webp"] },
  "doubt-response-image": { maxMb: 10, accept: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
} satisfies Record<UploadType, { maxMb: number; accept: string[] }>;

function humanLimitLabel(type: UploadType): string {
  return type === "lecture-video" ? "10GB" : "10MB";
}

/** When the browser leaves `file.type` empty, infer a common image MIME from the extension. */
export function guessImageMimeFromName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return "image/jpeg";
}

export function validateFile(file: File, type: UploadType, effectiveContentType?: string): string | null {
  const limit = FILE_LIMITS[type];
  const maxBytes = limit.maxMb * 1024 * 1024;
  const ct = (effectiveContentType ?? file.type).trim();

  if (file.size > maxBytes) {
    return `File must be less than ${humanLimitLabel(type)}`;
  }
  if (limit.accept.length > 0 && !limit.accept.includes(ct)) {
    const exts = limit.accept.map(t => t.split("/")[1]).join(", ");
    return `Invalid file type. Allowed: ${exts}.`;
  }
  return null;
}

function validateUploadPayload(payload: UploadUrlRequest): string | null {
  if (payload.type === "profile" || payload.type === "doubt-response-image") return null;

  const lectureTypes: UploadType[] = ["lecture-video", "lecture-thumbnail", "lecture-attachment"];
  const courseTypes: UploadType[] = ["thumbnail", "material", "source", ...lectureTypes];

  if (courseTypes.includes(payload.type) && !payload.courseId) {
    return "courseId is required for this upload.";
  }

  if (lectureTypes.includes(payload.type) && !payload.lectureId) {
    return "lectureId is required for this upload.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Step 1 — Get pre-signed URL from backend
// ---------------------------------------------------------------------------

export async function requestUploadUrl(payload: UploadUrlRequest): Promise<UploadUrlResponse> {
  const res = await apiClient.post("/upload-url", payload);
  return extractData<UploadUrlResponse>(res);
}

export const getUploadUrl = requestUploadUrl;

// ---------------------------------------------------------------------------
// Step 2 — PUT file directly to S3 (no auth header, pre-signed URL)
// ---------------------------------------------------------------------------

/**
 * Upload lecture video via Nest (multipart) so the browser never calls S3 directly.
 * Fixes CORS when the S3 bucket is not configured for your dev origin (e.g. cds.localhost).
 */
export async function uploadLectureVideoThroughBackend(
  courseId: string,
  lectureId: string,
  file: File,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("courseId", courseId);
  form.append("lectureId", lectureId);

  const res = await apiClient.post("/content/lectures/upload-video", form, {
    timeout: 0,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    transformRequest: [(data, headers) => {
      delete headers["Content-Type"];
      return data;
    }],
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    },
  });

  const payload = extractData<{ url: string }>(res);
  const url = payload?.url;
  if (!url || typeof url !== "string") {
    throw new Error("Upload succeeded but no file URL was returned.");
  }
  return url;
}

export async function putFileToS3(
  uploadUrl: string,
  file: File,
  contentType = file.type,
  onProgress?: (e: UploadProgressEvent) => void,
): Promise<void> {
  await s3UploadClient.put(uploadUrl, file, {
    headers: { "Content-Type": contentType },
    withCredentials: false,
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
  let contentType = (file.type && file.type.trim()) ? file.type : payload.contentType;
  if (!contentType && payload.type === "doubt-response-image") {
    contentType = guessImageMimeFromName(file.name);
  }
  if (!contentType) {
    throw new Error("Could not determine file content type. Rename the file with a standard extension or pick another image.");
  }
  const merged: UploadUrlRequest = { ...payload, contentType };

  const error = validateFile(file, merged.type, contentType);
  if (error) throw new Error(error);
  const payloadError = validateUploadPayload(merged);
  if (payloadError) throw new Error(payloadError);

  const { uploadUrl, fileUrl } = await requestUploadUrl(merged);
  await putFileToS3(uploadUrl, file, merged.contentType, onProgress);
  return fileUrl;
}

// ---------------------------------------------------------------------------
// Delete file from S3 via backend
// ---------------------------------------------------------------------------

export async function deleteS3File(payload: DeleteFileRequest): Promise<void> {
  await apiClient.delete("/upload", { data: payload });
}
