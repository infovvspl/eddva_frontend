import jsPDF from 'jspdf';

/**
 * Builds a clean, paginated A4 PDF directly from the AI-notes markdown —
 * real selectable text (not a screenshot), with embedded visuals.
 *
 * Images are passed in as { [s3Url]: dataUrl } fetched through the backend
 * (`GET /classes/recordings/:id/notes-images-data`), because the S3 bucket
 * has no CORS headers so the browser cannot rasterize them client-side.
 */

const PAGE = { w: 210, h: 297, margin: 18 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;
const COLORS = {
  title: [15, 23, 42],      // slate-900
  heading: [30, 64, 175],   // blue-800
  subheading: [51, 65, 85], // slate-700
  body: [51, 65, 85],       // slate-700
  muted: [100, 116, 139],   // slate-500
  accent: [37, 99, 235],    // blue-600
};

/** Strip inline markdown down to plain printable text. */
const cleanInline = (text) =>
  text
    .replace(/!\[.*?\]\(.*?\)/g, '')          // stray inline images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // links → label
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\$\$?([^$]*)\$\$?/g, '$1')      // math delimiters
    .replace(/\s+/g, ' ')
    .trim();

const loadImageSize = (dataUrl) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });

export const downloadNotesAsPDF = async ({ markdown, title = 'AI Notes', filename = 'ai-notes.pdf', imageMap = {} }) => {
  if (!markdown || !markdown.trim()) throw new Error('No notes content');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = PAGE.margin;

  const ensureSpace = (needed) => {
    if (y + needed > PAGE.h - PAGE.margin) {
      pdf.addPage();
      y = PAGE.margin;
    }
  };

  const writeLines = (text, { size, color, style = 'normal', lineGap = 1.6, indent = 0, bulletChar = null }) => {
    const clean = cleanInline(text);
    if (!clean) return;
    pdf.setFont('helvetica', style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lineH = size * 0.3528 + lineGap; // pt → mm plus leading
    const width = CONTENT_W - indent;
    const lines = pdf.splitTextToSize(clean, width);
    lines.forEach((line, i) => {
      ensureSpace(lineH);
      if (bulletChar && i === 0) {
        pdf.setFillColor(...COLORS.accent);
        pdf.circle(PAGE.margin + indent - 3, y - size * 0.12, 0.7, 'F');
      }
      pdf.text(line, PAGE.margin + indent, y);
      y += lineH;
    });
  };

  const drawImage = async (src, caption) => {
    const dataUrl = imageMap[src];
    if (!dataUrl) return; // image bytes unavailable — skip silently
    const dim = await loadImageSize(dataUrl);
    if (!dim || !dim.w || !dim.h) return;

    const maxW = CONTENT_W * 0.9;
    const maxH = 95;
    let w = maxW;
    let h = (dim.h / dim.w) * w;
    if (h > maxH) { h = maxH; w = (dim.w / dim.h) * h; }
    const x = PAGE.margin + (CONTENT_W - w) / 2;

    ensureSpace(h + 12);
    y += 2;
    const fmt = dataUrl.includes('image/png') ? 'PNG' : dataUrl.includes('image/webp') ? 'WEBP' : 'JPEG';
    try {
      pdf.addImage(dataUrl, fmt, x, y, w, h);
    } catch {
      return; // unsupported format — skip rather than fail the whole PDF
    }
    y += h + 4;
    if (caption) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...COLORS.muted);
      const capLines = pdf.splitTextToSize(cleanInline(caption), CONTENT_W * 0.85);
      capLines.forEach((line) => {
        ensureSpace(4);
        pdf.text(line, PAGE.w / 2, y, { align: 'center' });
        y += 4;
      });
    }
    y += 4;
  };

  // ── Document header ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.setTextColor(...COLORS.title);
  const titleLines = pdf.splitTextToSize(title, CONTENT_W);
  titleLines.forEach((line) => { pdf.text(line, PAGE.margin, y); y += 7.5; });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...COLORS.muted);
  pdf.text(`AI-generated notes  ·  ${new Date().toLocaleDateString('en-GB')}`, PAGE.margin, y);
  y += 3;
  pdf.setDrawColor(...COLORS.accent);
  pdf.setLineWidth(0.6);
  pdf.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
  y += 8;

  // ── Body ──
  // Normalize: the enricher emits "![caption](url)\n*caption*" pairs.
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let listBuffer = null; // accumulate wrapped list-item continuation lines

  const flushParagraph = (buf) => {
    if (buf.trim()) writeLines(buf, { size: 10.5, color: COLORS.body, lineGap: 2 });
  };

  let para = '';
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trimEnd();
    const trimmed = line.trim();

    const imgMatch = trimmed.match(/^!\[(.*?)\]\((\S+?)\)$/);
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    const bulletMatch = trimmed.match(/^[-*+]\s+(.*)$/);
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);

    if (imgMatch) {
      flushParagraph(para); para = '';
      // consume the "*caption*" line the enricher writes right after the image
      let caption = imgMatch[1] || '';
      const next = (lines[i + 1] || '').trim();
      if (/^\*[^*].*\*$/.test(next)) { caption = next.slice(1, -1); i += 1; }
      await drawImage(imgMatch[2], caption);
      continue;
    }

    if (headingMatch) {
      flushParagraph(para); para = '';
      const level = headingMatch[1].length;
      y += level <= 2 ? 4 : 2.5;
      if (level === 1) {
        writeLines(headingMatch[2], { size: 15, color: COLORS.title, style: 'bold', lineGap: 2.2 });
      } else if (level === 2) {
        writeLines(headingMatch[2], { size: 13, color: COLORS.heading, style: 'bold', lineGap: 2 });
      } else {
        writeLines(headingMatch[2], { size: 11.5, color: COLORS.subheading, style: 'bold', lineGap: 1.8 });
      }
      y += 1.5;
      continue;
    }

    if (bulletMatch || numberedMatch) {
      flushParagraph(para); para = '';
      const text = bulletMatch ? bulletMatch[1] : `${numberedMatch[1]}. ${numberedMatch[2]}`;
      writeLines(text, { size: 10.5, color: COLORS.body, lineGap: 1.8, indent: 6, bulletChar: bulletMatch ? '•' : null });
      y += 0.8;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { // horizontal rule
      flushParagraph(para); para = '';
      ensureSpace(6);
      y += 2;
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.line(PAGE.margin, y, PAGE.w - PAGE.margin, y);
      y += 4;
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph(para); para = '';
      writeLines(trimmed.replace(/^>\s?/, ''), { size: 10, color: COLORS.muted, style: 'italic', lineGap: 1.8, indent: 5 });
      continue;
    }

    if (!trimmed) {
      flushParagraph(para); para = '';
      y += 1.5;
      continue;
    }

    para = para ? `${para} ${trimmed}` : trimmed;
  }
  flushParagraph(para);

  // ── Footers ──
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(title, PAGE.margin, PAGE.h - 8);
    pdf.text(`Page ${i} of ${pageCount}`, PAGE.w - PAGE.margin, PAGE.h - 8, { align: 'right' });
  }

  pdf.save(filename);
};
