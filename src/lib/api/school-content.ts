import { extractData } from './client';
import schoolApi from './school-client';
import { type UploadProgressEvent } from './upload';

/**
 * School curriculum content API (teacher Course Content page).
 *
 * Materials are stored per topic. File uploads use a school-guarded presigned
 * S3 URL (`/school/materials/upload-url`) — the coaching `/upload-url` endpoint
 * can't be reused because its JWT strategy resolves users from the coaching DB.
 */

export type SchoolMaterialType =
  | 'notes'
  | 'pyq'
  | 'formula_sheet'
  | 'dpp'
  | 'mindmap'
  | 'ppt'
  | 'ebook'
  | 'study_guide'
  | 'key_concepts'
  | 'flashcard'
  | 'revision_checklist'
  | 'faq'
  | 'animation';

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
  topicName?: string | null;
  chapterName?: string | null;
  subjectName?: string | null;
  subjectIdFk?: string | null;
  createdAt?: string | null;
}

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export const schoolContent = {
  getMaterials: (params: {
    topicId?: string;
    chapterId?: string;
    subjectId?: string;
    classId?: string;
    sectionId?: string;
  }) =>
    schoolApi.get('/materials', { params })
      .then((res) => extractData<SchoolMaterial[]>(res) ?? []),

  getMaterial: (id: string) =>
    schoolApi.get(`/materials/${id}`).then((res) => extractData<SchoolMaterial>(res)),

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
    classId?: string;
    sectionId?: string;
  }) => schoolApi.post('/materials', body).then(extractData),

  deleteMaterial: (id: string) =>
    schoolApi.delete(`/materials/${id}`).then(extractData),

  /** Generate AI study content for a topic or chapter (preview only — not saved yet). */
  generateAiContent: (body: {
    topicId?: string;
    chapterId?: string;
    contentType: string;
    difficulty?: string;
    length?: string;
    examTarget?: string;
    questionCount?: number;
    extraContext?: string;
    /** Output language: 'hindi' → Devanagari via Groq, 'odia' → Odia script via Gemini. Default: English. */
    language?: 'hindi' | 'odia';
  }) => schoolApi.post('/materials/ai-generate', body)
    .then((res) => extractData<{ content: string; contentType: string; topicName: string }>(res)),

  /** Persist AI-generated markdown as a study material for students. */
  saveAiMaterial: (body: {
    topicId?: string;
    chapterId?: string;
    title: string;
    content: string;
    resourceType: string;
    classId?: string;
    sectionId?: string;
  }) =>
    schoolApi.post('/materials/ai-save', body).then(extractData),

  /** Generate (or fetch cached) an AI image for one slide; returns its S3 URL. */
  generateSlideImage: (body: { prompt: string }) =>
    schoolApi.post('/materials/ai-slide-image', body)
      .then((res) => extractData<{ url: string; cached: boolean }>(res)),

  /** Request a presigned PUT URL for a school material file. */
  requestUploadUrl: (body: { fileName: string; contentType: string; fileSize: number }) =>
    schoolApi.post('/materials/upload-url', body).then((res) => extractData<PresignResponse>(res)),

  /** Direct multipart upload to NestJS → R2. Avoids browser PUT proxy CORS/405 issues. */
  uploadMaterialFile: async (file: File, onProgress?: (e: UploadProgressEvent) => void): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const res = await schoolApi.post('/materials/upload', form, {
      transformRequest: [(data: any, headers: any) => {
        delete headers['Content-Type'];
        return data;
      }],
      onUploadProgress: (e: any) => {
        if (onProgress && e.total) {
          onProgress({ loaded: e.loaded, total: e.total, percent: Math.round((e.loaded / e.total) * 100) });
        }
      },
    });
    const result = extractData<{ fileUrl: string }>(res);
    if (!result?.fileUrl) throw new Error('Upload succeeded but no file URL returned');
    return result.fileUrl;
  },
};
