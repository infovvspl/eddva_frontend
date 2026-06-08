import { apiClient } from './api/client';
import axios from 'axios';

export type UploadType = 
  | 'profile' 
  | 'thumbnail' 
  | 'material' 
  | 'source' 
  | 'lecture-video' 
  | 'lecture-thumbnail' 
  | 'lecture-attachment'
  | 'chat-attachment';

export interface GenerateUploadUrlParams {
  type: UploadType;
  fileName: string;
  contentType: string;
  fileSize: number;
  courseId?: string;
  lectureId?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

const s3UploadClient = axios.create({
  withCredentials: false,
});

delete s3UploadClient.defaults.headers.common.Accept;
delete s3UploadClient.defaults.headers.common.Authorization;

export const getUploadUrl = async (params: GenerateUploadUrlParams): Promise<UploadUrlResponse> => {
  let resolvedContentType = params.contentType ? params.contentType.trim() : '';
  const ext = params.fileName.split('.').pop()?.toLowerCase();
  
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg'
  };

  if (!resolvedContentType || resolvedContentType === 'application/octet-stream') {
    if (ext && mimeMap[ext]) {
      resolvedContentType = mimeMap[ext];
    }
  }

  if (!resolvedContentType) {
    resolvedContentType = 'application/octet-stream';
  }

  try {
    const { data } = await apiClient.post<any>('/upload-url', {
      ...params,
      contentType: resolvedContentType
    });
    
    // Unwrap standard API response envelopes ({ success: true, data: { uploadUrl, fileUrl } })
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  } catch (err: any) {
    console.error("Failed to generate upload URL:", err);
    throw err;
  }
};

export const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progressEvent: any) => void
): Promise<void> => {
  await s3UploadClient.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    withCredentials: false,
    onUploadProgress: onProgress,
  });
};
