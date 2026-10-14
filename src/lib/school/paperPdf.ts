import jsPDF from 'jspdf';
import { instructionLines, needsUnicodeFont, type PaperFormat } from './paperFormat';
import type { PaperPart } from './paperExport';

/**
 * Builds a school-style question paper PDF with jsPDF's own text API (so the text is selectable
 * and the file is small): letterhead, exam title, class / subject / time / marks grid, student
 * fields, general instructions, then the questions, with page border and "Page x of y".
 *
 * Limits (use Print -> Save as PDF when they matter): maths is flattened to plain text, figures
 * are skipped, and scripts the built-in font cannot draw (Hindi, Odia...) are refused up front.
 */

const PAGE_W = 210;
const PAGE_H = 297;
const M = 15; // content margin
const FONT = 'times';
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [71, 85, 105];

export type PaperPdfResult = 'ok' | 'empty' | 'unsupported';

// ── text cleaning ───────────────────────────────────────────────────────────────────────────

function texToPlain(s: string): string {
  return s
    .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\cdot/g, '·')
    .replace(/\\(?:left|right)/g, '')
    .replace(/\\(?:leq?|le)\b/g, '<=')
    .replace(/\\(?:geq?|ge)\b/g, '>=')
    .replace(/\\neq?\b/g, '!=')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    .replace(/_\{([^{}]*)\}/g, '_$1')
    .replace(/[{}]/g, '');
}

function clean(text: string): string {
  return texToPlain(
    text
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/<<[^>]*>>/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1$2')
      .replace(/__(.+?)__/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/~~(.+?)~~/g, '$1')
      .replace(/\$\$?([^$]*)\$\$?/g, '$1'),
  )
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const isBoldLine = (t: string) => /^\*\*[^*].*\*\*$/.test(t.trim());

// ── logo ────────────────────────────────────────────────────────────────────────────────────

async function loadLogo(src: string): Promise<{ data: string; w: number; h: number; fmt: 'PNG' | 'JPEG' } | null> {
  if (!src) return null;
  try {
    let data = src;
    if (!src.startsWith('data:')) {
      const res = await fetch(src, { mode: 'cors' });
      if (!res.ok) return null;
      const blob = await res.blob();
      data = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(blob);
      });
    }
    if (/^data:image\/svg/i.test(data)) return null; // jsPDF cannot place SVG
    const fmt: 'PNG' | 'JPEG' = /^data:image\/png/i.test(data) ? 'PNG' : 'JPEG';
    const dim = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = data;
    });
    if (!dim || !dim.w || !dim.h) return null;
    return { data, ...dim, fmt };
  } catch {
    return null; // blocked by CORS, offline... the letterhead simply goes without a logo
  }
}

// ── builder ─────────────────────────────────────────────────────────────────────────────────

export async function buildPaperPdf(opts: {
  format: PaperFormat;
  questions: string;
  answerKey: string;
  part: PaperPart;
  filename: string;
}): Promise<PaperPdfResult> {
  const { format, part } = opts;
  const wantQ = (part === 'questions' || part === 'both') && opts.questions.trim();
  const wantA = (part === 'answers' || part === 'both') && opts.answerKey.trim();
  if (!wantQ && !wantA) return 'empty';

  const everything = [wantQ ? opts.questions : '', wantA ? opts.answerKey : '', format.schoolName, format.examTitle, format.subjectName, format.instructions, format.affiliation].join('\n');
  if (needsUnicodeFont(everything)) return 'unsupported';

  const logo = format.showLogo ? await loadLogo(format.logo) : null;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = M;

  const setInk = (c: [number, number, number] = INK) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: 'normal' | 'bold' | 'italic' | 'bolditalic', size: number) => {
    doc.setFont(FONT, style);
    doc.setFontSize(size);
  };
  const lineH = (size: number) => size * 0.3528 * 1.35;

  const border = () => {
    if (!format.showBorder) return;
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.rect(6, 6, PAGE_W - 12, PAGE_H - 12);
  };

  const bottomLimit = PAGE_H - M - 4;

  const newPage = (running = true) => {
    doc.addPage();
    border();
    y = M;
    if (running) {
      font('italic', 8.5);
      setInk(MUTED);
      const bits = [format.schoolName, format.examTitle, [format.className, format.subjectName].filter(Boolean).join(' • ')].filter(Boolean);
      doc.text(bits.join('   |   '), PAGE_W / 2, y, { align: 'center' });
      y += 3;
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(M, y, PAGE_W - M, y);
      y += 6;
      setInk();
    }
  };

  const ensure = (h: number) => {
    if (y + h > bottomLimit) newPage();
  };

  const wrapped = (
    text: string,
    o: { x?: number; width?: number; size?: number; style?: 'normal' | 'bold' | 'italic' | 'bolditalic'; gap?: number; align?: 'left' | 'center' } = {},
  ) => {
    const { x = M, width = PAGE_W - 2 * M, size = 11, style = 'normal', gap = 1.2, align = 'left' } = o;
    font(style, size);
    setInk();
    const lh = lineH(size);
    const lines = doc.splitTextToSize(text || ' ', width) as string[];
    lines.forEach((ln) => {
      ensure(lh);
      if (align === 'center') doc.text(ln, x + width / 2, y + size * 0.3, { align: 'center' });
      else doc.text(ln, x, y + size * 0.3);
      y += lh;
    });
    y += gap;
  };

  // ── header ────────────────────────────────────────────────────────────────────────────────

  const drawHeader = (variant: 'questions' | 'answers') => {
    const isAnswers = variant === 'answers';
    const top = y;
    const logoBox = 20;

    if (logo) {
      const ratio = logo.w / logo.h;
      let w = logoBox;
      let h = logoBox;
      if (ratio > 1) h = logoBox / ratio; else w = logoBox * ratio;
      try { doc.addImage(logo.data, logo.fmt, M, top + (logoBox - h) / 2, w, h); } catch { /* unsupported image */ }
    }

    const textX = M + logoBox + 3;
    const textW = PAGE_W - 2 * M - 2 * (logoBox + 3);
    font('bold', 18);
    setInk();
    const nameLines = doc.splitTextToSize((format.schoolName || 'SCHOOL NAME').toUpperCase(), textW) as string[];
    let ty = top + 7;
    nameLines.slice(0, 2).forEach((ln) => {
      doc.text(ln, textX + textW / 2, ty, { align: 'center' });
      ty += 7;
    });
    if (format.showAffiliation && format.affiliation) {
      font('normal', 9);
      setInk(MUTED);
      const aff = doc.splitTextToSize(format.affiliation, textW) as string[];
      aff.slice(0, 2).forEach((ln) => {
        doc.text(ln, textX + textW / 2, ty, { align: 'center' });
        ty += 4;
      });
    }
    y = Math.max(top + logoBox, ty) + 2;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(M, y, PAGE_W - M, y);
    y += 6;

    // exam title
    const title = [format.examTitle, format.session && `Session ${format.session}`].filter(Boolean).join('   •   ') || 'QUESTION PAPER';
    font('bold', 13);
    setInk();
    doc.text(title.toUpperCase(), PAGE_W / 2, y, { align: 'center' });
    y += 5;
    if (isAnswers) {
      font('bold', 9);
      const label = 'ANSWER KEY  -  TEACHER COPY';
      const w = doc.getTextWidth(label) + 8;
      doc.setLineWidth(0.4);
      doc.rect(PAGE_W / 2 - w / 2, y - 1, w, 6);
      doc.text(label, PAGE_W / 2, y + 3.2, { align: 'center' });
      y += 9;
    } else {
      y += 2;
    }

    // class / subject / time / marks grid
    const classSection = [format.className, format.sectionName && `(${format.sectionName})`].filter(Boolean).join(' ') || '-';
    const cells: Array<[string, string]> = [
      ['Class:', classSection],
      ['Subject:', format.subjectName || '-'],
      ['Date:', format.date || '-'],
      ['Time Allowed:', format.timeAllowed || '-'],
      ['Maximum Marks:', format.maxMarks || '-'],
      [isAnswers ? 'Marking scheme' : 'Marks Obtained:', ''],
    ];
    const colW = (PAGE_W - 2 * M) / 3;
    const rowH = 8;
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    cells.forEach(([k, v], i) => {
      const cx = M + (i % 3) * colW;
      const cy = y + Math.floor(i / 3) * rowH;
      doc.rect(cx, cy, colW, rowH);
      font('bold', 10);
      const kw = doc.getTextWidth(k) + 2; // measured in the bold font the label is drawn in
      doc.text(k, cx + 2, cy + 5.2);
      if (v) {
        font('normal', 10);
        const fit = doc.splitTextToSize(v, Math.max(8, colW - kw - 4)) as string[];
        doc.text(fit[0] || '', cx + 2 + kw, cy + 5.2);
      }
    });
    y += rowH * 2 + 5;

    // student fields
    if (!isAnswers && format.showStudentFields) {
      font('bold', 10);
      const fields: Array<[string, number]> = [['Name:', 2], ['Roll No.:', 1], ['Section:', 1]];
      const total = fields.reduce((a, f) => a + f[1], 0);
      const usable = PAGE_W - 2 * M - 8 * (fields.length - 1);
      let fx = M;
      fields.forEach(([k, wgt]) => {
        const w = (usable * wgt) / total;
        doc.text(k, fx, y + 4);
        const kw = doc.getTextWidth(k + ' ');
        doc.setLineWidth(0.25);
        doc.line(fx + kw, y + 4.4, fx + w, y + 4.4);
        fx += w + 8;
      });
      y += 10;
    }

    // general instructions
    const lines = instructionLines(format);
    if (!isAnswers && format.showInstructions && lines.length > 0) {
      const boxX = M;
      const boxW = PAGE_W - 2 * M;
      const innerW = boxW - 10;
      font('normal', 10);
      const wrappedLines: Array<{ n: number; parts: string[] }> = lines.map((l, i) => ({
        n: i + 1,
        parts: doc.splitTextToSize(l, innerW - 6) as string[],
      }));
      const bodyH = wrappedLines.reduce((a, l) => a + l.parts.length * 4.6, 0);
      const boxH = 8 + bodyH + 3;
      ensure(boxH + 4);
      doc.setLineWidth(0.3);
      doc.rect(boxX, y, boxW, boxH);
      font('bold', 10);
      doc.text('GENERAL INSTRUCTIONS', boxX + 5, y + 5.5);
      font('normal', 10);
      let iy = y + 11;
      wrappedLines.forEach((l) => {
        doc.text(`${l.n}.`, boxX + 5, iy);
        l.parts.forEach((part) => {
          doc.text(part, boxX + 11, iy);
          iy += 4.6;
        });
      });
      y += boxH + 4;
    }

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.line(M, y, PAGE_W - M, y);
    y += 6;
  };

  // ── body ──────────────────────────────────────────────────────────────────────────────────

  const drawTable = (rows: string[][]) => {
    const cols = Math.max(...rows.map((r) => r.length));
    const w = (PAGE_W - 2 * M) / cols;
    const size = 10;
    doc.setLineWidth(0.25);
    doc.setDrawColor(100, 116, 139);
    rows.forEach((r, ri) => {
      font(ri === 0 ? 'bold' : 'normal', size);
      const cellLines = r.map((c) => doc.splitTextToSize(clean(c) || ' ', w - 3) as string[]);
      const h = Math.max(...cellLines.map((l) => l.length)) * lineH(size) + 2.5;
      ensure(h);
      cellLines.forEach((ls, ci) => {
        const cx = M + ci * w;
        doc.rect(cx, y, w, h);
        ls.forEach((ln, li) => doc.text(ln, cx + 1.5, y + 1.5 + size * 0.3 + li * lineH(size)));
      });
      y += h;
    });
    y += 3;
  };

  const drawBody = (markdown: string) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i];
      const t = raw.trim();
      i += 1;

      if (!t) { y += 1.6; continue; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
        ensure(4);
        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.2);
        doc.line(M, y + 1, PAGE_W - M, y + 1);
        y += 4;
        continue;
      }

      // markdown table
      if (/^\|.*\|/.test(t)) {
        const rows: string[][] = [];
        let k = i - 1;
        while (k < lines.length && /^\s*\|.*\|/.test(lines[k])) {
          const row = lines[k].trim();
          if (!/^\|?[\s:|-]+\|?$/.test(row)) rows.push(row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
          k += 1;
        }
        i = k;
        if (rows.length) drawTable(rows);
        continue;
      }

      const heading = t.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        const text = clean(heading[2]);
        y += level <= 2 ? 2 : 1;
        if (level <= 2) {
          ensure(10);
          wrapped(text.toUpperCase(), { size: 12, style: 'bold', align: 'center', gap: 1 });
          doc.setDrawColor(15, 23, 42);
          doc.setLineWidth(0.3);
          doc.line(M, y, PAGE_W - M, y);
          y += 3;
        } else {
          wrapped(text, { size: 11, style: 'bold', gap: 1 });
        }
        continue;
      }

      if (isBoldLine(t)) {
        y += 1;
        wrapped(clean(t), { size: 11, style: 'bold', gap: 1 });
        continue;
      }

      const q = t.match(/^(\d+)\s*[.)]\s+(.*)$/);
      if (q) {
        const text = clean(q[2]);
        font('normal', 11);
        const lh = lineH(11);
        const parts = doc.splitTextToSize(text, PAGE_W - 2 * M - 9) as string[];
        ensure(lh * Math.min(parts.length, 2) + 1);
        font('bold', 11);
        doc.text(`${q[1]}.`, M, y + 11 * 0.3);
        font('normal', 11);
        parts.forEach((ln) => {
          ensure(lh);
          doc.text(ln, M + 9, y + 11 * 0.3);
          y += lh;
        });
        y += 1.6;
        continue;
      }

      const opt = t.match(/^\(?([a-hA-H]|[ivxIVX]{1,4})[.)]\s+(.*)$/);
      if (opt) {
        const text = clean(opt[2]);
        font('normal', 10.5);
        const lh = lineH(10.5);
        const parts = doc.splitTextToSize(text, PAGE_W - 2 * M - 22) as string[];
        parts.forEach((ln, idx) => {
          ensure(lh);
          if (idx === 0) doc.text(`(${opt[1].toLowerCase()})`, M + 9, y + 10.5 * 0.3);
          doc.text(ln, M + 18, y + 10.5 * 0.3);
          y += lh;
        });
        y += 0.8;
        continue;
      }

      const bullet = t.match(/^[-*+•]\s+(.*)$/);
      if (bullet) {
        wrapped(`• ${clean(bullet[1])}`, { x: M + 6, width: PAGE_W - 2 * M - 6, size: 11, gap: 0.8 });
        continue;
      }

      wrapped(clean(t), { size: 11, gap: 1.4 });
    }
  };

  // ── assemble ──────────────────────────────────────────────────────────────────────────────

  border();
  if (wantQ) {
    drawHeader('questions');
    drawBody(opts.questions);
  }
  if (wantA) {
    if (wantQ) newPage(false);
    drawHeader('answers');
    drawBody(opts.answerKey);
  }

  // footers
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    font('italic', 8.5);
    setInk(MUTED);
    if (format.footerNote) doc.text(format.footerNote, M, PAGE_H - 9);
    doc.text(`Page ${p} of ${pages}`, PAGE_W - M, PAGE_H - 9, { align: 'right' });
  }

  doc.save(opts.filename);
  return 'ok';
}
