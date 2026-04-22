import { apiClient, extractData } from "./client";

export type StudyMaterialExam = "jee" | "neet";
export type StudyMaterialType = "notes" | "pyq" | "formula_sheet" | "dpp";

export interface StudyMaterial {
  id: string;
  exam: StudyMaterialExam;
  type: StudyMaterialType;
  title: string;
  subject?: string;
  chapter?: string;
  description?: string;
  fileSizeKb?: number;
  totalPages?: number;
  previewPages: number;
  sortOrder: number;
  createdAt: string;
}

export interface AccessStatus {
  enrolled: boolean;
}

export interface DownloadUrlResponse {
  url: string;
  expiresIn: number;
}

export const studyMaterialApi = {
  list(params: { exam?: StudyMaterialExam; type?: StudyMaterialType; subject?: string; search?: string } = {}) {
    return apiClient
      .get<{ data: StudyMaterial[] }>("/study-materials", { params })
      .then((r) => extractData(r));
  },

  /** Returns the backend URL to stream the 2-page preview (used as iframe src). */
  previewUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/study-materials/${id}/preview`;
  },

  accessStatus(): Promise<AccessStatus> {
    return apiClient
      .get<{ data: AccessStatus }>("/study-materials/access-status")
      .then((r) => extractData(r))
      .catch(() => ({ enrolled: false }));
  },

  download(id: string): Promise<DownloadUrlResponse> {
    return apiClient
      .get<{ data: DownloadUrlResponse }>(`/study-materials/${id}/download`)
      .then((r) => extractData(r));
  },
};
