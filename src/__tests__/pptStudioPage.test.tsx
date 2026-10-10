/**
 * PPT Studio as its own page (src/pages/school/teacher/PptStudioPage.tsx).
 *
 * It used to open as a popup over Course Content, whose every re-render
 * rebuilt the iframe URL and reloaded the studio. Now it is a page:
 * Course Content links to it with the selection, Back returns to it, and a
 * saved deck goes to the same topic it always did.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const createMaterial = vi.fn().mockResolvedValue({});
const uploadMaterialFile = vi.fn().mockResolvedValue('https://cdn.test/deck.pptx');

vi.mock('@/context/SchoolAuthContext', () => ({
  useAuth: () => ({ user: { instituteId: 'inst-1' } }),
}));
vi.mock('@/lib/api-config', () => ({ getApiBaseUrl: () => '/api/v1' }));
vi.mock('@/lib/api/school-content', () => ({
  schoolContent: { createMaterial: (...a: any[]) => createMaterial(...a),
                   uploadMaterialFile: (...a: any[]) => uploadMaterialFile(...a) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

import PptStudioPage, { pptStudioPath } from '@/pages/school/teacher/PptStudioPage';

const TOPIC = { id: 't1', name: 'Respiration', chapterId: 'c1', kind: 'topic' as const };
const SEL = { topic: TOPIC, subject: { id: 's1', name: 'Science' },
              klass: { id: 'k1', name: 'Class 10' }, section: { id: 'sec1' } };

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={['/school/teacher/course-content?topic=x', path]} initialIndex={1}>
      <Routes>
        <Route path="/school/teacher/course-content" element={<div>Course Content page</div>} />
        <Route path="/school/teacher/ppt-studio" element={<PptStudioPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  createMaterial.mockClear();
  uploadMaterialFile.mockClear();
});

describe('the link from Course Content', () => {
  it('carries the topic scope and where a saved deck goes', () => {
    const url = new URL(pptStudioPath(SEL), 'http://x');
    expect(url.pathname).toBe('/school/teacher/ppt-studio');
    const q = Object.fromEntries(url.searchParams);
    expect(q).toMatchObject({ topic: 'Respiration', topicId: 't1', topicName: 'Respiration', chapterId: 'c1',
      className: 'Class 10', subjectName: 'Science', subjectId: 's1', classId: 'k1', sectionId: 'sec1',
      saveTopicId: 't1', saveChapterId: 'c1' });
  });

  it('a chapter deck is scoped to the chapter, and a subject node to the subject', () => {
    const chapter = Object.fromEntries(new URL(pptStudioPath({ ...SEL,
      topic: { id: 'c1', name: 'Life Processes', chapterId: 'c1', kind: 'chapter' } }), 'http://x').searchParams);
    expect(chapter).toMatchObject({ chapterId: 'c1', chapterName: 'Life Processes', saveChapterId: 'c1' });
    expect(chapter.topicId).toBeUndefined();
    const subject = Object.fromEntries(new URL(pptStudioPath({ ...SEL,
      topic: { id: 's1', name: 'Science Materials', chapterId: '', kind: 'subject' } }), 'http://x').searchParams);
    expect(subject.topic).toBe('Science');              // not "Science Materials"
    expect(subject.saveChapterId).toBeUndefined();
  });
});

describe('the page', () => {
  it('fills with the studio, given the scope, the API and the institute', () => {
    renderAt(pptStudioPath(SEL));
    const src = new URL(screen.getByTitle('AI PPT Studio').getAttribute('src')!, 'http://x');
    expect(src.pathname).toBe('/ppt-studio/index.html');
    expect(src.searchParams.get('api')).toBe('/api/v1');
    expect(src.searchParams.get('institute')).toBe('inst-1');
    expect(src.searchParams.get('topicId')).toBe('t1');
    expect(src.searchParams.get('topicName')).toBe('Respiration');
    expect(src.searchParams.get('saveTopicId')).toBeNull();   // page-only keys stay out of the studio
    expect(screen.getByText('PPT Studio')).toBeInTheDocument();
  });

  it('does not reload the studio when the page re-renders', () => {
    const { rerender } = renderAt(pptStudioPath(SEL));
    const first = screen.getByTitle('AI PPT Studio').getAttribute('src');
    rerender(
      <MemoryRouter initialEntries={[pptStudioPath(SEL)]}>
        <Routes><Route path="/school/teacher/ppt-studio" element={<PptStudioPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTitle('AI PPT Studio').getAttribute('src')).toBe(first);
  });

  it('Back returns to Course Content', () => {
    renderAt(pptStudioPath(SEL));
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText('Course Content page')).toBeInTheDocument();
  });

  it('saves a deck to the same topic, then returns to it', async () => {
    renderAt(pptStudioPath(SEL));
    const source = { postMessage: vi.fn() };
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'EDVA_PPT_SAVE', title: 'Respiration', fileName: 'Respiration.pptx',
                base64: btoa('pptx-bytes'), markdownContent: '# Respiration' },
        source: source as any,
      }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(uploadMaterialFile).toHaveBeenCalledTimes(1);
    expect(createMaterial).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Respiration', fileType: 'ppt', fileUrl: 'https://cdn.test/deck.pptx',
      description: '# Respiration', topicId: 't1', chapterId: 'c1', subjectId: 's1',
      classId: 'k1', sectionId: 'sec1',
    }));
    expect(source.postMessage).toHaveBeenCalledWith({ type: 'EDVA_PPT_SAVED', message: undefined }, '*');
    expect(screen.getByText('Course Content page')).toBeInTheDocument();
  });

  it('takes the file as bytes and tells the studio how the upload is going', async () => {
    // The studio now sends the .pptx as bytes (a painted deck is about 2 MB,
    // not 14 MB as text), and its Save button shows the upload percentage.
    uploadMaterialFile.mockImplementationOnce(async (_file: File, onProgress: any) => {
      onProgress({ loaded: 50, total: 100, percent: 50 });
      return 'https://cdn.test/deck.pptx';
    });
    renderAt(pptStudioPath(SEL));
    const source = { postMessage: vi.fn() };
    const bytes = new TextEncoder().encode('pptx-bytes');
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'EDVA_PPT_SAVE', title: 'Respiration', fileName: 'Respiration.pptx',
                buffer: bytes.buffer, markdownContent: '# Respiration' },
        source: source as any,
      }));
      await new Promise((r) => setTimeout(r, 0));
    });
    const file = uploadMaterialFile.mock.calls[0][0] as File;
    expect(file.name).toBe('Respiration.pptx');
    expect(file.size).toBe(bytes.length);
    const sent = source.postMessage.mock.calls.map((c: any[]) => c[0]);
    expect(sent).toContainEqual({ type: 'EDVA_PPT_SAVE_PROGRESS', message: undefined, stage: 'uploading', percent: 50 });
    expect(sent).toContainEqual({ type: 'EDVA_PPT_SAVE_PROGRESS', message: undefined, stage: 'saving', percent: 100 });
    expect(sent[sent.length - 1]).toEqual({ type: 'EDVA_PPT_SAVED', message: undefined });
    expect(createMaterial).toHaveBeenCalledWith(expect.objectContaining({ fileUrl: 'https://cdn.test/deck.pptx' }));
  });

  it('says so when a save arrives with no file', async () => {
    renderAt(pptStudioPath(SEL));
    const source = { postMessage: vi.fn() };
    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'EDVA_PPT_SAVE', title: 'Respiration' }, source: source as any }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(uploadMaterialFile).not.toHaveBeenCalled();
    expect(source.postMessage).toHaveBeenCalledWith({ type: 'EDVA_PPT_SAVE_ERROR', message: 'No file data' }, '*');
  });
});
