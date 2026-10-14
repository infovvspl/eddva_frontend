import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AssessmentContentRenderer from '@/components/school/AssessmentContentRenderer';
import PaperHeader from '@/components/school/teacher/PaperHeader';
import { stripGeneratedHeader, type PaperFormat } from './paperFormat';

export type PaperPart = 'questions' | 'answers' | 'both';

type PaperInput = {
  /** Used for the file name; the printed title comes from `format.examTitle`. */
  title: string;
  questions: string;
  answerKey: string;
  part: PaperPart;
  format: PaperFormat;
};

const safeName = (s: string) =>
  (s || 'question-paper').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'question-paper';

/** Which sections of the paper the chosen part covers, skipping empty ones. */
function sectionsFor({ questions, answerKey, part }: PaperInput) {
  const out: { kind: 'questions' | 'answers'; body: string }[] = [];
  if ((part === 'questions' || part === 'both') && questions.trim()) out.push({ kind: 'questions', body: questions });
  if ((part === 'answers' || part === 'both') && answerKey.trim()) out.push({ kind: 'answers', body: answerKey });
  return out;
}

export type PdfOutcome = 'ok' | 'empty' | 'unsupported';

/**
 * School-format PDF download (letterhead, class / subject / time / marks, instructions, page
 * numbers; selectable text). Maths is flattened to plain text and figures are skipped, and
 * scripts the built-in font can't draw return 'unsupported' — the caller falls back to Print,
 * which keeps formulas, diagrams and every script exactly as on screen.
 */
export async function downloadPaperPdf(input: PaperInput): Promise<PdfOutcome> {
  if (!sectionsFor(input).length) return 'empty';
  const { buildPaperPdf } = await import('./paperPdf');
  const base = safeName(input.title || input.format.examTitle);
  const suffix = input.part === 'answers' ? '_answer_key' : input.part === 'both' ? '_with_answers' : '';
  return buildPaperPdf({
    format: input.format,
    questions: stripGeneratedHeader(input.questions),
    answerKey: stripGeneratedHeader(input.answerKey),
    part: input.part,
    filename: `${base}${suffix}.pdf`,
  });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Print through a hidden iframe so the paper keeps its formulas, tables and figures, under the
 * same school header shown in the preview. Page styles are copied in so KaTeX applies. The
 * answer key always starts on a fresh page.
 */
export async function printPaper(input: PaperInput): Promise<boolean> {
  const sections = sectionsFor(input);
  if (!sections.length) return false;
  const title = input.format.examTitle || input.title || 'Question Paper';

  const body = sections
    .map((s, i) => {
      const header = renderToStaticMarkup(<PaperHeader format={input.format} variant={s.kind} />);
      const content = renderToStaticMarkup(<AssessmentContentRenderer>{stripGeneratedHeader(s.body)}</AssessmentContentRenderer>);
      return `<section class="paper-part"${i > 0 ? ' style="break-before:page;page-break-before:always"' : ''}>
        ${header}
        <div class="paper-body">${content}</div>
      </section>`;
    })
    .join('');

  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((el) => (el instanceof HTMLLinkElement ? `<link rel="stylesheet" href="${el.href}">` : el.outerHTML))
    .join('\n');

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return false;
  }

  const border = input.format.showBorder ? '1.5px solid #0f172a' : 'none';
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <base href="${document.baseURI}">
    ${styles}
    <style>
      @page { size: A4; margin: 12mm; }
      html, body { background: #fff !important; color: #0f172a; }
      body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, Georgia, serif; font-size: 12pt; line-height: 1.55; }
      .paper-part { border: ${border}; padding: 10mm 9mm; box-sizing: border-box; }
      .paper-body { margin-top: 10px; }
      .paper-foot { margin-top: 14px; padding-top: 6px; border-top: 1px solid #cbd5e1; font-size: 10px; color: #475569; text-align: center; }
      img, svg, table { max-width: 100%; break-inside: avoid; page-break-inside: avoid; }
      h2, h3 { break-after: avoid; page-break-after: avoid; }
      table { border-collapse: collapse; }
      .paper-body th, .paper-body td { border: 1px solid #94a3b8; padding: 4px 8px; }
    </style></head><body>${body}${input.format.footerNote ? `<div class="paper-foot">${escapeHtml(input.format.footerNote)}</div>` : ''}</body></html>`);
  doc.close();

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);
  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const waitForAssets = async () => {
      try { await (doc as any).fonts?.ready; } catch { /* ignore */ }
      const imgs = Array.from(doc.images).filter((i) => !i.complete);
      await Promise.race([
        Promise.all(imgs.map((i) => new Promise((r) => { i.onload = i.onerror = () => r(null); }))),
        new Promise((r) => setTimeout(r, 4000)),
      ]);
      finish();
    };
    if (doc.readyState === 'complete') waitForAssets();
    else win.addEventListener('load', waitForAssets, { once: true });
    setTimeout(finish, 6000);
  });

  win.addEventListener('afterprint', cleanup, { once: true });
  win.focus();
  win.print();
  // Browsers that never fire afterprint would otherwise leak the iframe.
  setTimeout(() => iframe.remove(), 120000);
  return true;
}
