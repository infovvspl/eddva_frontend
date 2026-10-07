// docxConvert.ts — Word (.docx) <-> the blog body editor's HTML.
// Both directions run entirely in the browser (mammoth for import, docx for
// export) — no backend involvement, no Tiptap Pro / cloud conversion service.
//
// Scope matches what BlogBodyEditor's schema actually supports: paragraphs,
// h2-h4, bold/italic/underline, bullet/numbered lists, blockquote, links,
// and images (inserted as their own block, not inline). Anything else in a
// Word file (tables, text colors, fonts) isn't part of that schema, so it's
// dropped on import rather than rendered as broken markup.

import mammoth from 'mammoth';
import {
  AlignmentType, Document, ExternalHyperlink, HeadingLevel, ImageRun, Packer, Paragraph, TextRun,
  Footer, Header, SimpleField, FootnoteReferenceRun, EndnoteReferenceRun,
} from 'docx';
import { uploadBlogCoverImage } from '@/lib/api/blogAdmin';
import type { BlogDocumentSettings, BlogReference } from '@/lib/api/blogAdmin';

/**
 * mammoth embeds a Word doc's pictures as base64 data URIs. The editor's
 * Image extension won't render those (`allowBase64` stays off on purpose —
 * a data URI can be hundreds of KB and the section body has a size cap), so
 * each one is uploaded to blog storage here and swapped for its hosted URL.
 * An image that fails to upload is dropped rather than left as inert base64.
 */
async function hostInlineImages(html: string): Promise<string> {
  const container = document.createElement('div');
  container.innerHTML = html;
  const dataImages = Array.from(container.querySelectorAll('img[src^="data:"]'));
  if (!dataImages.length) return html;

  await Promise.all(dataImages.map(async (img) => {
    try {
      const blob = await (await fetch(img.getAttribute('src') || '')).blob();
      const { url } = await uploadBlogCoverImage(blob);
      img.setAttribute('src', url);
    } catch (error) {
      // Keep the data URI as a local fallback. The editor allows base64 images
      // so a transient storage/upload failure does not erase imported artwork.
      console.warn('Could not upload imported Word image; keeping local image', error);
    }
  }));
  return container.innerHTML;
}

/** Word (.docx) File -> HTML string matching BlogBodyEditor's content model. */
export async function docxFileToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value: rawHtml } = await mammoth.convertToHtml(
    { arrayBuffer },
    // Word's "Quote" paragraph style has no HTML equivalent mammoth maps by
    // default — map it to <blockquote> so quoted callouts survive the import.
    { styleMap: ['p[style-name=\'Quote\'] => blockquote > p:fresh'] },
  );

  // mammoth emits h1-h6, but the editor only registers h2-h4 (h1 belongs to
  // the section heading field, not the body) — demote h1/h5/h6 into range.
  const html = rawHtml
    .replace(/<h1(\s[^>]*)?>/g, '<h2>').replace(/<\/h1>/g, '</h2>')
    .replace(/<h5(\s[^>]*)?>/g, '<h4>').replace(/<\/h5>/g, '</h4>')
    .replace(/<h6(\s[^>]*)?>/g, '<h4>').replace(/<\/h6>/g, '</h4>');

  return hostInlineImages(html);
}

const NUMBERED_LIST_REF = 'eddva-blog-body-numbered-list';

type Marks = { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; code?: boolean; color?: string; fontFamily?: string; fontSize?: string };
type Inline = TextRun | ExternalHyperlink;

function runsFromInline(node: Element | ChildNode, marks: Marks = {}): Inline[] {
  const runs: Inline[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) runs.push(new TextRun({ text, bold: marks.bold, italics: marks.italic, strike: marks.strike, underline: marks.underline ? {} : undefined, color: marks.color?.replace('#', ''), font: marks.fontFamily, size: marks.fontSize ? Math.round(Number.parseFloat(marks.fontSize) * 2) : undefined, style: marks.code ? 'No Spacing' : undefined }));
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === 'a') {
      const href = el.getAttribute('href');
      const children = runsFromInline(el, marks).filter((r): r is TextRun => r instanceof TextRun);
      if (href && children.length) {
        runs.push(new ExternalHyperlink({ link: href, children }));
      } else {
        runs.push(...children);
      }
      return;
    }

    const nextMarks: Marks = {
      bold: marks.bold || tag === 'strong' || tag === 'b',
      italic: marks.italic || tag === 'em' || tag === 'i',
      underline: marks.underline || tag === 'u',
      strike: marks.strike || tag === 's' || tag === 'del',
      code: marks.code || tag === 'code',
      color: el.getAttribute('data-color') || el.style.color || marks.color,
      fontFamily: el.style.fontFamily || marks.fontFamily,
      fontSize: el.style.fontSize || marks.fontSize,
    };
    runs.push(...runsFromInline(el, nextMarks));
  });
  return runs;
}

const HEADING_LEVELS: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
  h2: HeadingLevel.HEADING_2,
  h3: HeadingLevel.HEADING_3,
  h4: HeadingLevel.HEADING_4,
};

const IMAGE_TYPE_BY_MIME: Record<string, 'jpg' | 'png' | 'gif' | 'bmp'> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
};

const MAX_IMAGE_WIDTH_PX = 600;

/** Fetches an <img> src and sizes it for the page — null if it can't be read or isn't a docx-supported format (e.g. webp, svg). */
async function loadImageForExport(src: string): Promise<{ data: ArrayBuffer; width: number; height: number; type: 'jpg' | 'png' | 'gif' | 'bmp' } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = IMAGE_TYPE_BY_MIME[blob.type];
    if (!type) return null;

    const data = await blob.arrayBuffer();
    const objectUrl = URL.createObjectURL(blob);
    try {
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('image decode failed'));
        img.src = objectUrl;
      });
      const scale = width > MAX_IMAGE_WIDTH_PX ? MAX_IMAGE_WIDTH_PX / width : 1;
      return { data, type, width: Math.round(width * scale), height: Math.round(height * scale) };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

async function blockToParagraphs(el: Element): Promise<Paragraph[]> {
  const tag = el.tagName.toLowerCase();

  if (tag === 'img') {
    const src = el.getAttribute('src') || '';
    const loaded = src ? await loadImageForExport(src) : null;
    if (!loaded) {
      return [new Paragraph({ children: [new TextRun({ text: `[Image omitted — could not be embedded: ${src || 'no source'}]`, italics: true })] })];
    }
    return [new Paragraph({
      children: [new ImageRun({ data: loaded.data, type: loaded.type, transformation: { width: loaded.width, height: loaded.height } })],
    })];
  }

  if (tag === 'ul' || tag === 'ol') {
    return Array.from(el.children).map((li) => new Paragraph({
      children: runsFromInline(li),
      ...(tag === 'ul'
        ? { bullet: { level: 0 } }
        : { numbering: { reference: NUMBERED_LIST_REF, level: 0 } }),
    }));
  }

  if (tag === 'blockquote') {
    const nested = await Promise.all(Array.from(el.children).map((child) =>
      (child.tagName.toLowerCase() === 'p'
        ? Promise.resolve([new Paragraph({ children: runsFromInline(child, { italic: true }), indent: { left: 720 } })])
        : blockToParagraphs(child)),
    ));
    return nested.flat();
  }

  if (HEADING_LEVELS[tag]) {
    return [new Paragraph({ heading: HEADING_LEVELS[tag], children: runsFromInline(el) })];
  }

  // p, and anything else unrecognized — treat as a plain paragraph of its text.
  return [new Paragraph({ children: runsFromInline(el) })];
}

/** The editor's HTML string -> a downloadable .docx Blob. */
export async function htmlToDocxBlob(html: string, options: { settings?: BlogDocumentSettings; references?: BlogReference[] } = {}): Promise<Blob> {
  const container = document.createElement('div');
  container.innerHTML = html;
  const perElement = await Promise.all(Array.from(container.children).map((el) => blockToParagraphs(el)));
  const paragraphs = perElement.flat();

  const settings = { pageSize: 'A4' as const, marginTop: 25, marginRight: 22, marginBottom: 25, marginLeft: 22, showPageNumbers: true, showTotalPages: true, ...options.settings };
  const toTwips = (mm: number) => Math.round(mm * 56.6929);
  const references = options.references || [];
  const footnotes: Record<string, { children: Paragraph[] }> = {};
  const endnotes: Record<string, { children: Paragraph[] }> = {};
  references.forEach((reference, index) => {
    const id = String(index + 1);
    const target = reference.kind === 'endnote' ? endnotes : footnotes;
    target[id] = { children: [new Paragraph(reference.text)] };
  });
  if (references.length && paragraphs.length) {
    const refs = references.map((reference, index) => reference.kind === 'endnote' ? new EndnoteReferenceRun(index + 1) : new FootnoteReferenceRun(index + 1));
    paragraphs[paragraphs.length - 1] = new Paragraph({ children: [...(paragraphs[paragraphs.length - 1].options.children || []), ...refs] });
  }
  const pageWidth = settings.pageSize === 'LETTER' ? 12240 : 11906;
  const pageHeight = settings.pageSize === 'LETTER' ? 15840 : 16838;
  const header = settings.header || settings.showPageNumbers !== false ? new Header({ children: [new Paragraph({ children: [new TextRun(settings.header || ''), ...(settings.showPageNumbers !== false ? [new TextRun('  Page '), new SimpleField('PAGE'), ...(settings.showTotalPages !== false ? [new TextRun(' of '), new SimpleField('NUMPAGES')] : [])] : [])] })] }) : undefined;
  const footer = settings.footer ? new Footer({ children: [new Paragraph(settings.footer)] }) : undefined;

  const doc = new Document({
    features: { updateFields: true },
    footnotes: Object.keys(footnotes).length ? footnotes : undefined,
    endnotes: Object.keys(endnotes).length ? endnotes : undefined,
    numbering: {
      config: [{
        reference: NUMBERED_LIST_REF,
        levels: [{ level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.START }],
      }],
    },
    sections: [{
      children: paragraphs.length ? paragraphs : [new Paragraph('')],
      headers: header ? { default: header } : undefined,
      footers: footer ? { default: footer } : undefined,
      properties: { page: { size: { width: pageWidth, height: pageHeight }, margin: { top: toTwips(settings.marginTop), right: toTwips(settings.marginRight), bottom: toTwips(settings.marginBottom), left: toTwips(settings.marginLeft), header: toTwips(10), footer: toTwips(10) } } },
    }],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
