import { describe, expect, it, vi } from 'vitest';

// The page imports the PDF viewer, which needs DOMMatrix at load time.
vi.hoisted(() => { (globalThis as any).DOMMatrix ??= class {}; });
vi.mock('@/lib/api/client', () => ({ default: { get: vi.fn() }, apiClient: { get: vi.fn() } }));

// @ts-expect-error — the page is plain JSX
import { groupMaterials } from './StudyMaterials';

type Item = { title: string };
const chapterLevel = (over: Record<string, unknown>) => ({ subjectName: 'Mathematics', chapterName: 'Real Numbers', topicName: null, ...over });
/** The one subject's chapter in the tree (subject names are normalised by the page). */
const chapterOf = (tree: Record<string, Record<string, Record<string, Item[]>>>) => Object.values(tree)[0]?.['Real Numbers'] ?? {};

describe('StudyMaterials groupMaterials', () => {
  it('keeps an animation attached to a chapter (no topic)', () => {
    const tree = groupMaterials([
      chapterLevel({ title: 'Real numbers animation', fileType: 'notes', fileUrl: 'https://media.eddva.in/x/download1.mp4' }),
    ]);
    expect(chapterOf(tree)['Chapter Materials']).toHaveLength(1);
  });

  it('keeps one saved with the animation type', () => {
    const tree = groupMaterials([chapterLevel({ title: 'Anim', fileType: 'animation', fileUrl: 'https://youtu.be/abc' })]);
    expect(chapterOf(tree)['Chapter Materials']).toHaveLength(1);
  });

  it('keeps other chapter-level items too (PPTs, ebooks)', () => {
    const tree = groupMaterials([
      chapterLevel({ title: 'Textbook', fileType: 'ebook', fileUrl: 'https://media.eddva.in/x/book.pdf' }),
      chapterLevel({ title: 'Slides', fileType: 'ppt', fileUrl: 'https://media.eddva.in/x/deck.pptx' }),
    ]);
    expect(chapterOf(tree)['Chapter Materials'].map((m: Item) => m.title).sort()).toEqual(['Slides', 'Textbook']);
  });

  it('subject-level materials (no chapter) are still ebooks only', () => {
    const tree = groupMaterials([
      { subjectName: 'Mathematics', title: 'Book', fileType: 'ebook', fileUrl: 'https://media.eddva.in/x/book.pdf' },
      { subjectName: 'Mathematics', title: 'Loose slides', fileType: 'ppt', fileUrl: 'https://media.eddva.in/x/deck.pptx' },
    ]);
    const items = Object.values(Object.values(tree)[0] as Record<string, Record<string, Item[]>>).flatMap((t) => Object.values(t).flat());
    expect(items.map((m) => m.title)).toEqual(['Book']);
  });

  it('topic-level materials are unaffected', () => {
    const tree = groupMaterials([chapterLevel({ topicName: 'HCF', title: 'Slides', fileType: 'ppt', fileUrl: 'https://media.eddva.in/x/deck.pptx' })]);
    expect(chapterOf(tree).HCF).toHaveLength(1);
  });
});
