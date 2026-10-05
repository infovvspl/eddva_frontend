import { describe, expect, it } from 'vitest';
import { acceptAttribute, formatSummary, isSupportedUpload, materialUploadGuide } from './material-upload-guide';

const TYPES = ['notes', 'study_guide', 'key_concepts', 'flashcard', 'revision_checklist', 'faq', 'pyq', 'formula_sheet', 'dpp', 'mindmap', 'ppt', 'ebook', 'animation'];

describe('materialUploadGuide', () => {
  it.each(TYPES)('%s has formats and preparation tips', (type) => {
    const g = materialUploadGuide(type);
    expect(g.extensions.length).toBeGreaterThan(0);
    expect(g.formats).toBeTruthy();
    expect(g.tips.length).toBeGreaterThan(0);
  });

  it('falls back to the notes guide for unknown types', () => {
    expect(materialUploadGuide('something_new')).toBe(materialUploadGuide('notes'));
  });

  it('only offers formats the app can show (no .txt)', () => {
    for (const t of TYPES) expect(materialUploadGuide(t).extensions).not.toContain('txt');
  });
});

describe('isSupportedUpload', () => {
  it('checks the extension case-insensitively', () => {
    expect(isSupportedUpload(materialUploadGuide('ebook'), 'Science BOOK.PDF')).toBe(true);
    expect(isSupportedUpload(materialUploadGuide('ebook'), 'chapter.docx')).toBe(false);
    expect(isSupportedUpload(materialUploadGuide('animation'), 'water-cycle.mp4')).toBe(true);
    expect(isSupportedUpload(materialUploadGuide('animation'), 'water-cycle.pdf')).toBe(false);
  });

  it('rejects files with no extension', () => {
    expect(isSupportedUpload(materialUploadGuide('notes'), 'README')).toBe(false);
  });
});

describe('acceptAttribute / formatSummary', () => {
  it('builds the file-input accept list', () => {
    expect(acceptAttribute(materialUploadGuide('ebook'))).toBe('.pdf');
  });

  it('puts the recommended format first', () => {
    expect(formatSummary('ppt')).toBe('PPT · PDF');
    expect(formatSummary('notes')).toBe('PDF · Word · PPT · Image');
    expect(formatSummary('flashcard')).toMatch(/^Type cards · /);
  });
});
