import { api } from './api/client';
import axios from 'axios';

export type UploadType = 
  | 'profile' 
  | 'thumbnail' 
  | 'material' 
  | 'source' 
  | 'lecture-video' 
  | 'lecture-thumbnail' 
  | 'lecture-attachment';

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

export const getUploadUrl = async (params: GenerateUploadUrlParams): Promise<UploadUrlResponse> => {
  const { data } = await api.post<UploadUrlResponse>('/upload/url', params);
  return data;
};

export const uploadToS3 = async (
  file: File,
  uploadUrl: string,
  onProgress?: (progressEvent: any) => void
): Promise<void> => {
  await axios.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: onProgress,
  });
};
