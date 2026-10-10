/**
 * Revision checklist <-> Markdown format shared by the viewer, the teacher
 * editor and the AI generator. A checklist is stored in
 * `study_materials.description` as Markdown: "- [ ] item" lines for tickable
 * items, and any other line (e.g. "## Sub-topic") rendered as-is — see
 * RevisionChecklistViewer in MaterialViewPage.tsx / StudyMaterials.jsx.
 */

export type ChecklistRow = { text: string; heading: boolean };

const ITEM_RE = /^\s*[-*]\s+\[[ xX]\]\s+(.+)$/;
const HEADING_RE = /^\s*#{1,6}\s+(.+)$/;

/** Parse a stored checklist back into rows, for the editor. */
export function parseChecklist(content: string): ChecklistRow[] {
  if (!content) return [];
  const rows: ChecklistRow[] = [];
  for (const raw of content.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const item = line.match(ITEM_RE);
    if (item) { rows.push({ text: item[1].trim(), heading: false }); continue; }
    const heading = line.match(HEADING_RE);
    if (heading) { rows.push({ text: heading[1].trim(), heading: true }); continue; }
    // Plain text line (no marker) — keep as a heading-like line so it round-trips.
    rows.push({ text: line, heading: true });
  }
  return rows;
}

/** Serialize rows to the stored Markdown format. Blank rows are dropped. */
export function serializeChecklist(rows: ChecklistRow[]): string {
  return rows
    .map((r) => ({ ...r, text: r.text.trim() }))
    .filter((r) => r.text)
    .map((r) => (r.heading ? `## ${r.text}` : `- [ ] ${r.text}`))
    .join('\n');
}

/**
 * Parse a pasted list into rows: one item per line. A line ending in ":" or
 * starting with "#" becomes a sub-topic heading; everything else is an item.
 */
export function parsePastedChecklist(text: string): { rows: ChecklistRow[] } {
  const rows: ChecklistRow[] = [];
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const heading = line.match(HEADING_RE);
    if (heading) { rows.push({ text: heading[1].trim(), heading: true }); continue; }
    if (/:$/.test(line)) { rows.push({ text: line.slice(0, -1).trim(), heading: true }); continue; }
    rows.push({ text: line.replace(/^[-*•+]\s*\[[ xX]?\]\s*/, '').replace(/^[-*•+]\s*/, ''), heading: false });
  }
  return { rows };
}

// ── Editor helpers ───────────────────────────────────────────────────────────

/** A row being edited — `id` keeps React keys and focus stable while rows move. */
export type EditableChecklistRow = ChecklistRow & { id: string };

let seq = 0;
export const newRowId = () => `citem-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const blankRow = (): EditableChecklistRow => ({ id: newRowId(), text: '', heading: false });
export const toEditableRows = (rows: ChecklistRow[]): EditableChecklistRow[] =>
  rows.length ? rows.map((r) => ({ ...r, id: newRowId() })) : [blankRow()];

export const completeRows = (rows: EditableChecklistRow[]): ChecklistRow[] =>
  rows.filter((r) => r.text.trim()).map(({ text, heading }) => ({ text: text.trim(), heading }));
