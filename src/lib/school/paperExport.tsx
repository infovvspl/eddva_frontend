import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AssessmentContentRenderer from '@/components/school/AssessmentContentRenderer';

export type PaperPart = 'questions' | 'answers' | 'both';

type PaperInput = {
  title: string;
  questions: string;
  answerKey: string;
  part: PaperPart;
};

const safeName = (s: string) =>
  (s || 'question-paper').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'question-paper';

const partLabel = (part: PaperPart) =>
  part === 'questions' ? 'Question Paper' : part === 'answers' ? 'Answer Key' : 'Question Paper & Answer Key';

/** Which sections of the paper the chosen part covers, skipping empty ones. */
function sectionsFor({ questions, answerKey, part }: PaperInput) {
  const out: { heading: string; body: string }[] = [];
  if ((part === 'questions' || part === 'both') && questions.trim()) out.push({ heading: 'Question Paper', body: questions });
  if ((part === 'answers' || part === 'both') && answerKey.trim()) out.push({ heading: 'Answer Key', body: answerKey });
  return out;
}

/**
 * Real PDF download (selectable text, A4, page numbers). Math is flattened to
 * plain text and figures are skipped — use Print → "Save as PDF" when the paper
 * has formulas or diagrams that must look exactly as on screen.
 */
export async function downloadPaperPdf(input: PaperInput): Promise<boolean> {
  const sections = sectionsFor(input);
  if (!sections.length) return false;
  const markdown = sections
    .map((s, i) => (sections.length > 1 ? `${i > 0 ? '\n\n---\n\n' : ''}# ${s.heading}\n\n${s.body}` : s.body))
    .join('');
  const { downloadNotesAsPDF } = await import('./notesPdf');
  const title = input.title.trim() || 'Question Paper';
  await downloadNotesAsPDF({
    markdown,
    title: sections.length === 1 && input.part === 'answers' ? `${title} - Answer Key` : title,
    filename: `${safeName(title)}${input.part === 'answers' ? '_answer_key' : input.part === 'both' ? '_with_answers' : ''}.pdf`,
    subtitle: partLabel(input.part),
  });
  return true;
}

/**
 * Print through a hidden iframe so the paper keeps its formulas, tables and
 * figures. Page styles are copied in so KaTeX and the exam typography apply.
 * The answer key always starts on a fresh page.
 */
export async function printPaper(input: PaperInput): Promise<boolean> {
  const sections = sectionsFor(input);
  if (!sections.length) return false;
  const title = input.title.trim() || 'Question Paper';

  const body = sections
    .map((s, i) => {
      const html = renderToStaticMarkup(<AssessmentContentRenderer>{s.body}</AssessmentContentRenderer>);
      const showHeading = sections.length > 1 || s.heading === 'Answer Key';
      return `<section class="paper-part"${i > 0 ? ' style="break-before:page;page-break-before:always"' : ''}>
        <h1 class="paper-title">${escapeHtml(title)}</h1>
        ${showHeading ? `<p class="paper-kind">${s.heading}</p>` : ''}
        ${html}
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

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
    <base href="${document.baseURI}">
    ${styles}
    <style>
      @page { size: A4; margin: 16mm; }
      html, body { background: #fff !important; color: #0f172a; }
      body { margin: 0; padding: 0; font-family: 'Times New Roman', Georgia, serif; font-size: 12pt; line-height: 1.55; }
      .paper-title { font-size: 18pt; margin: 0 0 4px; text-align: center; }
      .paper-kind { text-align: center; font-size: 10pt; letter-spacing: .08em; text-transform: uppercase; color: #475569; margin: 0 0 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
      .paper-part { max-width: none; }
      img, svg, table { max-width: 100%; break-inside: avoid; page-break-inside: avoid; }
      h2, h3 { break-after: avoid; page-break-after: avoid; }
      table { border-collapse: collapse; }
      th, td { border: 1px solid #94a3b8; padding: 4px 8px; }
    </style></head><body>${body}</body></html>`);
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

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
