import { extractData } from './client';
import schoolApi from './school-client';
import { putFileToS3, type UploadProgressEvent } from './upload';

/**
 * School curriculum content API (teacher Course Content page).
 *
 * Materials are stored per topic. File uploads use a school-guarded presigned
 * S3 URL (`/school/materials/upload-url`) — the coaching `/upload-url` endpoint
 * can't be reused because its JWT strategy resolves users from the coaching DB.
 */

export type SchoolMaterialType = 'notes' | 'pyq' | 'formula_sheet' | 'dpp';

export interface SchoolMaterial {
  id: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  file_url?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSizeKb?: number | null;
  isAiGenerated?: boolean;
  topicId?: string | null;
  chapterId?: string | null;
  subjectIdFk?: string | null;
  createdAt?: string | null;
}

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export const schoolContent = {
  getMaterials: (params: { topicId?: string; chapterId?: string; subjectId?: string }) =>
    schoolApi.get('/materials', { params })
      .then((res) => extractData<SchoolMaterial[]>(res) ?? []),

  createMaterial: (body: {
    title: string;
    fileType: SchoolMaterialType;
    fileUrl: string;
    fileName?: string;
    fileSizeKb?: number;
    description?: string;
    subjectIdFk?: string;
    subjectId?: string;
    chapterId?: string;
    topicId?: string;
  }) => schoolApi.post('/materials', body).then(extractData),

  deleteMaterial: (id: string) =>
    schoolApi.delete(`/materials/${id}`).then(extractData),

  /** Generate AI study content for a topic (preview only — not saved yet). */
  generateAiContent: (body: {
    topicId: string;
    contentType: string;
    difficulty?: string;
    length?: string;
    examTarget?: string;
    questionCount?: number;
    extraContext?: string;
  }) => schoolApi.post('/materials/ai-generate', body)
    .then((res) => extractData<{ content: string; contentType: string; topicName: string }>(res)),

  /** Persist AI-generated markdown as a study material for students. */
  saveAiMaterial: (body: { topicId: string; title: string; content: string; resourceType: string }) =>
    schoolApi.post('/materials/ai-save', body).then(extractData),

  /** Request a presigned PUT URL for a school material file. */
  requestUploadUrl: (body: { fileName: string; contentType: string; fileSize: number }) =>
    schoolApi.post('/materials/upload-url', body).then((res) => extractData<PresignResponse>(res)),

  /** Full file upload: presign → PUT to S3 → return the public file URL. */
  uploadMaterialFile: async (file: File, onProgress?: (e: UploadProgressEvent) => void): Promise<string> => {
    const contentType = file.type && file.type.trim() ? file.type : 'application/octet-stream';
    const { uploadUrl, fileUrl } = await schoolContent.requestUploadUrl({
      fileName: file.name,
      contentType,
      fileSize: file.size,
    });
    await putFileToS3(uploadUrl, file, contentType, onProgress);
    return fileUrl;
  },
};
