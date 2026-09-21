/**
 * Diagram API client.
 *
 * The backend is authoritative for validation, geometric consistency,
 * rendering, persistence and authorization. Nothing here re-implements any of
 * that: this module only shapes requests and normalises the two kinds of
 * failure a caller has to tell apart.
 *
 *   A REJECTED SPECIFICATION (422) is something a teacher can fix. It names
 *   the stage that refused it and carries field paths.
 *
 *   ANYTHING ELSE is a fault — offline, a denied assessment, a server error —
 *   and is shown as such rather than as "your diagram is wrong".
 *
 * `instituteId` is never sent. The server derives the tenant from the
 * assessment, so there is no tenant identity for a client to get wrong.
 */
import api from '@/lib/api/school-client';

/** Which gate refused the specification. Mirrors the backend's stages. */
export type DiagramFailureStage = 'structural' | 'geometric' | 'render' | 'storage';

export interface DiagramRejection {
  /** True when the server refused the spec itself rather than failing. */
  rejected: true;
  stage: DiagramFailureStage;
  errors: string[];
  warnings: string[];
}

export interface DiagramFault {
  rejected: false;
  message: string;
}

export type DiagramError = DiagramRejection | DiagramFault;

export interface DiagramRecord {
  id: string;
  markerKey: string;
  /** Ready to paste into the paper, e.g. "[DIAGRAM: a3f91c04]". */
  marker: string;
  kind: string;
  spec: unknown;
  rendererVersion: string;
  url: string | null;
  altText: string;
  approved: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  /** The teacher removed its marker from the paper. Never auto-deleted. */
  detached: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiagramPreview {
  svg: string;
  width: number;
  height: number;
  rendererVersion: string;
  warnings: string[];
}

export interface DiagramSaveResult {
  markerKey: string;
  marker: string;
  kind: string;
  url: string;
  width: number;
  height: number;
  rendererVersion: string;
  approved: boolean;
  /** Present on update: whether the spec changed and approval was cleared. */
  specChanged?: boolean;
  approvalCleared?: boolean;
  warnings: string[];
}

export interface DiagramCapabilities {
  rendererVersion: string;
  kinds: string[];
  templates: Array<{ id: string; slots: Array<{ id: string; defaultLabel: string }> }>;
  functionForms: Array<{ form: string; coefficients: number }>;
  opticalDevices: string[];
  strokeStyles: string[];
  labelPositions: string[];
  limits: Record<string, unknown>;
}

/**
 * Turn an axios failure into one of the two kinds above.
 *
 * A 422 carries the structured body the diagram service produces; anything
 * else is a fault and must not be dressed up as a validation problem, or a
 * teacher will hunt for a mistake in a diagram that is actually fine.
 */
export function toDiagramError(err: any): DiagramError {
  const status = err?.response?.status;
  const body = err?.response?.data;
  if (status === 422 && body && Array.isArray(body.errors)) {
    return {
      rejected: true,
      stage: (body.stage as DiagramFailureStage) || 'structural',
      errors: body.errors.map(String),
      warnings: Array.isArray(body.warnings) ? body.warnings.map(String) : [],
    };
  }
  const message = body?.message || err?.message
    || 'The diagram service could not be reached. Please try again.';
  return { rejected: false, message: String(message) };
}

const base = (assessmentId: string) => `/assessments/${encodeURIComponent(assessmentId)}/diagrams`;

export const diagramApi = {
  async capabilities(assessmentId: string): Promise<DiagramCapabilities> {
    const res = await api.get(`${base(assessmentId)}/capabilities`);
    return res.data?.data;
  },

  async list(assessmentId: string): Promise<DiagramRecord[]> {
    const res = await api.get(base(assessmentId));
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  /** Renders without storing anything and without approving anything. */
  async preview(assessmentId: string, spec: unknown): Promise<DiagramPreview> {
    const res = await api.post(`${base(assessmentId)}/preview`, { spec });
    return res.data?.data;
  },

  /** The same gates as preview, without the render. */
  async validate(assessmentId: string, spec: unknown): Promise<{ kind: string; warnings: string[] }> {
    const res = await api.post(`${base(assessmentId)}/validate`, { spec });
    return res.data?.data;
  },

  async create(assessmentId: string, spec: unknown, altText?: string): Promise<DiagramSaveResult> {
    const res = await api.post(base(assessmentId), { spec, altText });
    return res.data?.data;
  },

  async update(
    assessmentId: string, markerKey: string, spec: unknown, altText?: string,
  ): Promise<DiagramSaveResult> {
    const res = await api.put(`${base(assessmentId)}/${encodeURIComponent(markerKey)}`, { spec, altText });
    return res.data?.data;
  },

  async setApproval(
    assessmentId: string, markerKey: string, approved: boolean,
  ): Promise<{ markerKey: string; approved: boolean }> {
    const res = await api.post(
      `${base(assessmentId)}/${encodeURIComponent(markerKey)}/approval`, { approved },
    );
    return res.data?.data;
  },
};

/**
 * A rendered SVG as an image source.
 *
 * The SVG is served into an `<img>`, never inserted into the document. Even
 * though this markup comes from our own renderer — which refuses to emit a
 * script, a handler or an external reference — an `<img>` is a context where
 * SVG script cannot run at all, so the page's safety does not depend on the
 * renderer continuing to be careful.
 */
export function svgToImageSrc(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
