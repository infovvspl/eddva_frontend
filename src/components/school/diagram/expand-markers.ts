/**
 * Marker expansion for the TEACHER'S PREVIEW ONLY.
 *
 * The editor's "Preview (Student View)" pane is labelled "Students will see
 * this", and until now it was not true of diagrams: it rendered the draft text
 * verbatim, so a marker appeared as the literal characters "[DIAGRAM: a3f91c04]"
 * and an approved figure never showed up at all. A teacher checking their paper
 * saw something no student would ever see.
 *
 * THIS IS NOT A SECOND IMPLEMENTATION OF THE DISPLAY RULES.
 *
 * The server decides what a student receives, and it strips unapproved and
 * detached diagrams out of the response before it leaves the building. This
 * module cannot widen that: it runs on the teacher's own screen, against the
 * teacher's own diagram list, which a teacher is already entitled to see in
 * full. Its job is to show a teacher what their paper will look like AND why a
 * figure is missing when one is — which is the part the student view cannot
 * show, because for a student a withheld diagram is simply absent.
 *
 * Nothing here is ever sent anywhere, and nothing here is HTML. Every
 * expansion is Markdown, rendered by the same AssessmentContentRenderer the
 * student paper uses — no dangerouslySetInnerHTML, no raw markup.
 */
import type { DiagramRecord } from './diagram-api';

/**
 * The marker grammar, mirroring DIAGRAM_MARKER_RE in the backend's
 * assessment-diagram-anchor.ts. Kept identical on purpose: a preview that
 * recognised a different set of markers than the server would be a preview of
 * a different paper.
 */
export const PREVIEW_MARKER_RE = /\[\s*DIAGRAM\s*:\s*([A-Za-z0-9]{4,16})\s*\]/gi;

/** Why a marker did not become a picture. */
export type PreviewMarkerState = 'shown' | 'unapproved' | 'detached' | 'unrendered' | 'unknown';

export interface PreviewMarkerSummary {
  markerKey: string;
  state: PreviewMarkerState;
}

export interface PreviewExpansion {
  /** Markdown, ready for AssessmentContentRenderer. */
  text: string;
  /** One entry per marker occurrence, in document order. */
  markers: PreviewMarkerSummary[];
}

/**
 * Alt text that cannot break out of the image it labels.
 *
 * Square brackets would close the alt early and turn the rest into body text,
 * so they go — exactly as the server does when it inlines a figure.
 */
function safeAlt(record: DiagramRecord): string {
  const text = String(record.altText || '').replace(/[[\]]/g, '').trim();
  if (text) return text;
  // Fall back to the kind. "ray_diagram" already ends in the word, so it is
  // not given a second one.
  const kind = String(record.kind || 'diagram').replace(/_/g, ' ').trim();
  return /diagram$/i.test(kind) ? kind : `${kind} diagram`;
}

/** The state of one marker, given the diagram it resolved to (or did not). */
export function markerState(record: DiagramRecord | undefined): PreviewMarkerState {
  if (!record) return 'unknown';
  if (!record.url) return 'unrendered';
  if (record.detached) return 'detached';
  if (!record.approved) return 'unapproved';
  return 'shown';
}

/**
 * What the teacher reads in place of a figure that students will not get.
 *
 * A blockquote rather than an image: it is visibly not part of the question,
 * it renders through the existing blockquote styling, and it says which of the
 * four reasons applies so the fix is obvious. The marker key is included
 * because that is what a teacher matches against the diagram list.
 */
function placeholder(markerKey: string, state: PreviewMarkerState): string {
  const reason: Record<Exclude<PreviewMarkerState, 'shown'>, string> = {
    unapproved: 'waiting for your approval — students will not see it until you approve it',
    detached: 'not attached to this paper any more; insert its marker again from Diagrams to bring it back',
    unrendered: 'has no rendered image yet, so there is nothing to show',
    unknown: 'does not match any diagram on this paper — check the key, or create the diagram',
  };
  const why = reason[state as Exclude<PreviewMarkerState, 'shown'>];
  return `> **Diagram not shown** — \`${markerKey}\` ${why}.`;
}

/**
 * Replace every marker in `text` with either its image or an explanation.
 *
 * A paper with no markers is returned byte-identical, so the preview of an
 * ordinary question paper is exactly what it was before this existed.
 */
export function expandMarkersForPreview(
  text: string,
  records: DiagramRecord[] | null | undefined,
): PreviewExpansion {
  const source = String(text ?? '');
  const markers: PreviewMarkerSummary[] = [];
  if (!source) return { text: source, markers };

  const byKey = new Map<string, DiagramRecord>();
  for (const record of records || []) {
    if (record?.markerKey) byKey.set(String(record.markerKey).toLowerCase(), record);
  }

  // A fresh regex per call: PREVIEW_MARKER_RE is global, and a shared lastIndex
  // between calls would skip markers on every second render.
  const pattern = new RegExp(PREVIEW_MARKER_RE.source, 'gi');
  const expanded = source.replace(pattern, (_match, rawKey: string) => {
    const markerKey = String(rawKey).toLowerCase();
    const record = byKey.get(markerKey);
    const state = markerState(record);
    markers.push({ markerKey, state });
    if (state === 'shown' && record) {
      return `![${safeAlt(record)}](${record.url})`;
    }
    return placeholder(markerKey, state);
  });

  return { text: expanded, markers };
}
