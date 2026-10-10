/**
 * What a teacher may upload for each study-material type, and how to prepare it.
 *
 * `extensions` is the single source of truth for the file picker's `accept`
 * attribute AND for validating drag-and-dropped files (which bypass `accept`).
 * Only list formats the app can actually show: PDF and images preview in-app,
 * Word/PowerPoint open in the Office viewer, videos play in the animation player.
 */

export const MAX_UPLOAD_MB = 100;

export interface MaterialUploadGuide {
  /** Lower-case extensions without the dot. */
  extensions: string[];
  /** Human-readable format list, recommended format first. */
  formats: string;
  /** Short, practical tips on how the document should be laid out. */
  tips: string[];
}

const DOCS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'];
const DOCS_LABEL = 'PDF (recommended), Word, PowerPoint, JPG/PNG';
const SAVE_AS_PDF = 'Save Word files as PDF before uploading so the layout looks the same on every phone.';

const GUIDES: Record<string, MaterialUploadGuide> = {
  notes: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'Use a heading for each sub-topic, with short paragraphs and bullet points under it.',
      SAVE_AS_PDF,
      'Handwritten notes: photograph each page straight-on in good light, or scan them all into one PDF.',
    ],
  },
  study_guide: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'Start with the learning objectives, then the must-know points for each sub-topic.',
      'End with a short summary or "remember this" box for quick revision.',
      SAVE_AS_PDF,
    ],
  },
  key_concepts: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'One concept per bullet: the term in bold, then a one-line meaning.',
      'Keep it to one or two pages — this is for quick recall, not full notes.',
    ],
  },
  flashcard: {
    extensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    formats: 'PDF, Word, JPG/PNG — or type the cards (recommended)',
    tips: [
      'Choose "Type cards" so students get flip cards they can practise with. An uploaded file opens as a normal document.',
      'Fastest way: "Paste a list" with one card per line, e.g. "evaporation - water turning into vapour".',
      'You can copy two columns (word, meaning) straight from Excel or Google Sheets.',
    ],
  },
  revision_checklist: {
    extensions: DOCS,
    formats: 'PDF, Word, JPG/PNG — or type the checklist (recommended)',
    tips: [
      'Choose "Type checklist" so students get tick-off items. An uploaded file opens as a normal document.',
      'Group items by sub-topic, one short item per line (e.g. "Can explain the water cycle").',
      'Fastest way: "Paste a list" with one item per line — end a line with ":" to turn it into a sub-topic heading.',
    ],
  },
  faq: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'Write each one as "Q: …" on one line and "A: …" on the next.',
      'Group questions by sub-topic and keep answers to 2–3 sentences.',
    ],
  },
  pyq: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'One paper per file. Put the year, board/exam and total marks at the top.',
      'Number every question and show its marks.',
      'Add answers or solutions at the end, or upload them as a separate file.',
    ],
  },
  formula_sheet: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'Type formulas (Word → Insert → Equation) instead of photographing them, so they stay sharp.',
      'Group by sub-topic and include the units and what each symbol means.',
      SAVE_AS_PDF,
    ],
  },
  dpp: {
    extensions: DOCS,
    formats: DOCS_LABEL,
    tips: [
      'Number every question and show its marks.',
      'Put the answer key on the last page.',
    ],
  },
  mindmap: {
    extensions: ['pdf', 'jpg', 'jpeg', 'png'],
    formats: 'PNG/JPG image or PDF',
    tips: [
      'Export the mind map as a high-resolution image in landscape, so students can zoom in.',
      'Put the topic name in the centre and keep each branch label short.',
    ],
  },
  ppt: {
    extensions: ['pptx', 'ppt', 'pdf'],
    formats: 'PowerPoint .pptx (recommended), .ppt or PDF',
    tips: [
      'Upload the .pptx file itself — it opens in the built-in slide viewer.',
      'Videos inside slides may not play. Upload them separately as an Animation.',
      `Compress large pictures (PowerPoint → File → Compress Pictures) to stay under ${MAX_UPLOAD_MB} MB.`,
    ],
  },
  ebook: {
    extensions: ['pdf'],
    formats: 'PDF only',
    tips: [
      'A PDF from the publisher or saved from Word (where you can select the text) is read by the AI fastest.',
      'Scanned books also work but take longer to process.',
      `For a very large book, upload one chapter per file (each under ${MAX_UPLOAD_MB} MB).`,
    ],
  },
  animation: {
    extensions: ['mp4', 'webm', 'ogv'],
    formats: 'MP4 (recommended), WebM, OGV',
    tips: [
      'MP4 plays on every phone and browser.',
      `720p is enough for students. Compress longer videos to stay under ${MAX_UPLOAD_MB} MB.`,
    ],
  },
};

export const LINK_TIPS = [
  'Paste a link that opens without logging in, e.g. Google Drive (Share → "Anyone with the link"), YouTube or a website.',
  'Check the link in a private/incognito window before saving.',
];

export const TYPED_CARD_TIPS = [
  'Front: the word or question. Back: its meaning or answer — keep it to one or two sentences.',
  'Have a list already? Use "Paste a list": one card per line, e.g. "tide - ocean water rising and falling", or copy two columns from Excel / Google Sheets.',
  'Press Enter on the last card\'s back to start the next card.',
];

export const TYPED_CHECKLIST_TIPS = [
  'Click the icon next to a row to switch it between a tickable item and a sub-topic heading.',
  'Have a list already? Use "Paste a list": one item per line — end a line with ":" to make it a heading.',
  'Press Enter on the last row to start a new item.',
];

const EXT_LABELS: [string[], string][] = [
  [['pdf'], 'PDF'],
  [['doc', 'docx'], 'Word'],
  [['ppt', 'pptx'], 'PPT'],
  [['jpg', 'jpeg', 'png'], 'Image'],
  [['mp4', 'webm', 'ogv'], 'Video'],
];

/** Compact format list for the type picker, e.g. "PDF · Word · PPT · Image". */
export function formatSummary(type: string): string {
  const guide = materialUploadGuide(type);
  // Follow the guide's order so the recommended format comes first (e.g. PPT before PDF).
  const labels = [...new Set(guide.extensions.map((e) => EXT_LABELS.find(([exts]) => exts.includes(e))?.[1]).filter(Boolean))];
  const typedLabel = type === 'flashcard' ? 'Type cards' : type === 'revision_checklist' ? 'Type checklist' : null;
  return (typedLabel ? [typedLabel, ...labels] : labels).join(' · ');
}

export function materialUploadGuide(type: string): MaterialUploadGuide {
  return GUIDES[type] ?? GUIDES.notes;
}

/** `accept` attribute for a file input. */
export function acceptAttribute(guide: MaterialUploadGuide): string {
  return guide.extensions.map((e) => `.${e}`).join(',');
}

/** Whether a picked or dropped file has an extension this material type supports. */
export function isSupportedUpload(guide: MaterialUploadGuide, fileName: string): boolean {
  const ext = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return !!ext && guide.extensions.includes(ext);
}
