/**
 * Download AI-generated course-content materials as PDF.
 *
 * AI materials are stored as Markdown text (no file). We render that Markdown
 * directly with jsPDF's native text API (headings, bullets, tables, paragraphs,
 * with pagination). This avoids html2canvas/doc.html(), which produced blank
 * PDFs when the source element was rendered off-screen.
 *
 * Presentations render one slide per block; file-based materials (uploads,
 * e-books, .pptx) open from their URL instead.
 */
import jsPDF from 'jspdf';
import { presentationMarkdownToSlides } from './presentation-markdown';
import type { SchoolMaterial } from './api/school-content';

const safeName = (s: string) =>
  (s || 'material').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'material';

export function materialDisplayTitle(material: Partial<SchoolMaterial> & { chapterName?: unknown; topicName?: unknown }): string {
  const fallback = String(material.topicName || material.chapterName || material.title || 'Material').trim();
  return fallback
    .replace(/^\s*(?:school|jee|neet|cbse|icse)\s*[-:��]\s*/i, '')
    .trim() || fallback;
}

/** Strip inline Markdown markers jsPDF can't render. */
const stripInline = (s: string): string =>
  String(s ?? '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.*?)\)/g, '$1')
    .trim();

const ML = 40;
const MR = 40;
const MT = 48;
const MB = 48;

interface Cursor { y: number; }

function writePara(
  doc: jsPDF,
  cur: Cursor,
  text: string,
  opts: { size?: number; bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {},
): void {
  const { size = 11, bold = false, color = [17, 24, 39], indent = 0, gap = 4 } = opts;
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = doc.internal.pageSize.getWidth() - ML - MR - indent;
  const lh = size * 1.45;
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  const lines = doc.splitTextToSize(text || ' ', maxW) as string[];
  for (const ln of lines) {
    if (cur.y + lh > pageH - MB) { doc.addPage(); cur.y = MT; }
    doc.text(ln, ML + indent, cur.y);
    cur.y += lh;
  }
  cur.y += gap;
}

/** Render a Markdown string into the doc at the current cursor. */
function renderMarkdown(doc: jsPDF, cur: Cursor, md: string): void {
  const lines = String(md || '').split(/\r?\n/);
  for (const raw of lines) {
    const t = raw.replace(/\t/g, '  ').trim();
    if (!t) { cur.y += 5; continue; }

    let m: RegExpMatchArray | null;
    if (/^---+$/.test(t) || /^\*\*\*+$/.test(t)) { cur.y += 4; continue; }
    if ((m = t.match(/^#\s+(.*)/))) { writePara(doc, cur, stripInline(m[1]), { size: 18, bold: true, gap: 7 }); continue; }
    if ((m = t.match(/^##\s+(.*)/))) { writePara(doc, cur, stripInline(m[1]), { size: 15, bold: true, color: [67, 56, 202], gap: 5 }); continue; }
    if ((m = t.match(/^#{3,}\s+(.*)/))) { writePara(doc, cur, stripInline(m[1]), { size: 12.5, bold: true, gap: 4 }); continue; }
    // markdown table rows
    if (/^\|.*\|/.test(t)) {
      if (/^\|?[\s:|-]+\|?$/.test(t)) continue; // separator row
      const cells = t.replace(/^\||\|$/g, '').split('|').map((c) => stripInline(c.trim()));
      writePara(doc, cur, cells.join('    |    '), { size: 10.5, gap: 2 });
      continue;
    }
    // checkbox / bullets
    if ((m = t.match(/^[-*]\s*\[[ xX]\]\s+(.*)/))) { writePara(doc, cur, `☐  ${stripInline(m[1])}`, { indent: 14, gap: 2 }); continue; }
    if ((m = t.match(/^[-*•]\s+(.*)/))) { writePara(doc, cur, `•  ${stripInline(m[1])}`, { indent: 14, gap: 2 }); continue; }
    if ((m = t.match(/^(\d+)[.)]\s+(.*)/))) { writePara(doc, cur, `${m[1]}.  ${stripInline(m[2])}`, { indent: 14, gap: 2 }); continue; }
    // plain paragraph
    writePara(doc, cur, stripInline(t), {});
  }
}

/** Write one material (title + body) into the doc at the current cursor. */
function addMaterial(doc: jsPDF, cur: Cursor, material: SchoolMaterial): void {
  const type = String(material.fileType ?? '').toLowerCase();
  const md = material.description ?? '';
  const title = materialDisplayTitle(material);

  writePara(doc, cur, title, { size: 20, bold: true, gap: 2 });
  writePara(doc, cur, `AI generated · ${type || 'notes'}`, { size: 9.5, color: [107, 114, 128], gap: 10 });

  if (type === 'ppt') {
    const slides = presentationMarkdownToSlides(md);
    if (slides.length) {
      slides.forEach((s, i) => {
        writePara(doc, cur, `Slide ${i + 1}: ${stripInline(s.title)}`, { size: 14, bold: true, color: [67, 56, 202], gap: 3 });
        s.bullets.forEach((b) => writePara(doc, cur, `•  ${stripInline(b)}`, { indent: 14, gap: 2 }));
        cur.y += 6;
      });
      return;
    }
  }
  renderMarkdown(doc, cur, md);
}

/** True when the material is AI text content (no underlying file). */
export function isDownloadableAiMaterial(m: SchoolMaterial): boolean {
  const fileUrl = m.fileUrl ?? (m as unknown as { file_url?: string }).file_url;
  return !!m.description && !fileUrl;
}

/** Download a single material: AI text → PDF; uploaded file → open its URL. */
export async function downloadMaterial(material: SchoolMaterial): Promise<void> {
  const fileUrl = material.fileUrl ?? (material as unknown as { file_url?: string }).file_url;
  if (fileUrl) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  if (!material.description) return;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const cur: Cursor = { y: MT };
  addMaterial(doc, cur, material);
  doc.save(`${safeName(materialDisplayTitle(material))}.pdf`);
}

/** Bundle every AI-generated material for the topic into one PDF. */
export async function downloadAllMaterials(materials: SchoolMaterial[], filename: string): Promise<number> {
  const aiMaterials = materials.filter(isDownloadableAiMaterial);
  if (!aiMaterials.length) return 0;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const cur: Cursor = { y: MT };
  aiMaterials.forEach((m, i) => {
    if (i > 0) { doc.addPage(); cur.y = MT; }
    addMaterial(doc, cur, m);
  });
  doc.save(`${safeName(filename)}.pdf`);
  return aiMaterials.length;
}
