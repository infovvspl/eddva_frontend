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

function normalizeMaterial(row: any): StudyMaterial {
  const safeType: StudyMaterialType =
    row?.type === "notes" || row?.type === "pyq" || row?.type === "formula_sheet" || row?.type === "dpp"
      ? row.type
      : "notes";
  const safeExam: StudyMaterialExam = row?.exam === "neet" ? "neet" : "jee";

  return {
    id: String(row?.id ?? ""),
    exam: safeExam,
    type: safeType,
    title: String(row?.title ?? "Untitled material"),
    subject: row?.subject ?? undefined,
    chapter: row?.chapter ?? undefined,
    description: row?.description ?? undefined,
    fileSizeKb: typeof row?.fileSizeKb === "number" ? row.fileSizeKb : undefined,
    totalPages: typeof row?.totalPages === "number" ? row.totalPages : undefined,
    previewPages: typeof row?.previewPages === "number" && row.previewPages > 0 ? row.previewPages : 2,
    sortOrder: typeof row?.sortOrder === "number" ? row.sortOrder : 0,
    createdAt: String(row?.createdAt ?? ""),
  };
}

function normalizeMaterialList(rows: unknown): StudyMaterial[] {
  const maybeRows =
    Array.isArray(rows)
      ? rows
      : Array.isArray((rows as any)?.data)
        ? (rows as any).data
        : [];
  return maybeRows.map(normalizeMaterial).filter((m) => m.id.length > 0);
}

export const studyMaterialApi = {
  list(params: { exam?: StudyMaterialExam; type?: StudyMaterialType; subject?: string; search?: string; limit?: number } = {}) {
    return apiClient
      .get<{ data: StudyMaterial[] }>("/study-materials", { params })
      .then((r) => normalizeMaterialList(extractData(r)));
  },

  /** Returns the backend URL to stream the 2-page preview (used as iframe src). Requires tenant context (e.g. subdomain). */
  previewUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/study-materials/${id}/preview`;
  },

  /** Public marketplace preview — any institute’s material, no x-tenant / subdomain. */
  previewPublicUrl(id: string): string {
    return `${apiClient.defaults.baseURL}/tenants/public/study-materials/${id}/preview`;
  },

  accessStatus(params: { exam?: StudyMaterialExam } = {}): Promise<AccessStatus> {
    return apiClient
      .get<{ data: AccessStatus }>("/study-materials/access-status", { params })
      .then((r) => extractData(r))
      .then((payload: any) => {
        if (typeof payload?.enrolled === "boolean") return { enrolled: payload.enrolled };
        if (typeof payload?.data?.enrolled === "boolean") return { enrolled: payload.data.enrolled };
        return { enrolled: false };
      })
      .catch(() => ({ enrolled: false }));
  },

  download(id: string): Promise<DownloadUrlResponse> {
    return apiClient
      .get<{ data: DownloadUrlResponse }>(`/study-materials/${id}/download`)
      .then((r) => extractData(r));
  },

  /** Public marketplace across institutes; does not depend on tenant context. */
  listPublic(params: { exam?: StudyMaterialExam; type?: StudyMaterialType; subject?: string; search?: string; limit?: number } = {}) {
    return apiClient
      .get<{ data: StudyMaterial[] }>("/tenants/public/study-materials", { params })
      .then((r) => normalizeMaterialList(extractData(r)));
  },
};
