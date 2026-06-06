/**
 * Download AI-generated course-content materials as PDF.
 *
 * AI materials are stored as Markdown text (no file). This renders that Markdown
 * to a printable HTML block and exports it via jsPDF. Presentations are laid out
 * one slide per page; mind-maps / notes / DPP / PYQ / etc. render as formatted
 * Markdown. File-based materials (uploads, e-books) are opened from their URL.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import { presentationMarkdownToSlides } from './presentation-markdown';
import type { SchoolMaterial } from './api/school-content';

const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const safeName = (s: string) =>
  (s || 'material').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'material';

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body, .doc { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 13px; line-height: 1.5; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 18px 0 6px; color: #4338ca; }
  h3 { font-size: 14px; margin: 12px 0 4px; }
  p { margin: 6px 0; }
  ul, ol { margin: 6px 0 6px 18px; padding: 0; }
  li { margin: 3px 0; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  th, td { border: 1px solid #d1d5db; padding: 5px 7px; text-align: left; font-size: 12px; }
  th { background: #f3f4f6; }
  code { background: #f3f4f6; padding: 1px 4px; border-radius: 4px; }
  .slide { page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin: 0 0 14px; }
  .slide h2 { margin-top: 0; border-bottom: 2px solid #fecdd3; padding-bottom: 4px; }
  .muted { color: #6b7280; font-size: 11px; }
`;

/** Render a Markdown string to HTML via an off-screen React render. */
function markdownToHtml(md: string): string {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  document.body.appendChild(host);
  const root = createRoot(host);
  flushSync(() => {
    root.render(React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, md));
  });
  const html = host.innerHTML;
  root.unmount();
  host.remove();
  return html;
}

/** Build the printable HTML body for one material (without the outer wrapper). */
function materialBodyHtml(material: SchoolMaterial): string {
  const type = String(material.fileType ?? '').toLowerCase();
  const md = material.description ?? '';
  const heading = `<h1>${esc(material.title)}</h1><p class="muted">AI generated · ${esc(type || 'notes')}</p>`;

  if (type === 'ppt') {
    const slides = presentationMarkdownToSlides(md);
    if (slides.length) {
      const body = slides
        .map(
          (s, i) =>
            `<div class="slide"><h2>Slide ${i + 1}: ${esc(s.title)}</h2><ul>${s.bullets
              .map((b) => `<li>${esc(b)}</li>`)
              .join('')}</ul></div>`,
        )
        .join('');
      return `${heading}${body}`;
    }
  }
  return `${heading}<div>${markdownToHtml(md)}</div>`;
}

async function renderHtmlToPdf(innerHtml: string, filename: string): Promise<void> {
  const container = document.createElement('div');
  container.className = 'doc';
  container.style.width = '760px';
  container.style.padding = '0';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.background = '#ffffff';
  container.innerHTML = `<style>${PRINT_CSS}</style>${innerHtml}`;
  document.body.appendChild(container);

  try {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    await doc.html(container, {
      x: 24,
      y: 24,
      width: 547, // A4 (595pt) minus 24pt margins each side
      windowWidth: 760,
      autoPaging: 'text',
    });
    doc.save(`${safeName(filename)}.pdf`);
  } finally {
    container.remove();
  }
}

/** True when the material is AI text content (no underlying file). */
export function isDownloadableAiMaterial(m: SchoolMaterial): boolean {
  const fileUrl = m.fileUrl ?? (m as any).file_url;
  return !!m.description && !fileUrl;
}

/** Download a single material: AI text → PDF; uploaded file → open its URL. */
export async function downloadMaterial(material: SchoolMaterial): Promise<void> {
  const fileUrl = material.fileUrl ?? (material as any).file_url;
  if (fileUrl) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  if (!material.description) return;
  await renderHtmlToPdf(materialBodyHtml(material), material.title);
}

/** Bundle every AI-generated material for the topic into one PDF. */
export async function downloadAllMaterials(materials: SchoolMaterial[], filename: string): Promise<number> {
  const aiMaterials = materials.filter(isDownloadableAiMaterial);
  if (!aiMaterials.length) return 0;
  const body = aiMaterials
    .map((m, i) => `<div style="${i > 0 ? 'page-break-before: always;' : ''}">${materialBodyHtml(m)}</div>`)
    .join('');
  await renderHtmlToPdf(body, filename);
  return aiMaterials.length;
}
