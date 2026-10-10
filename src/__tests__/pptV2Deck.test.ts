/**
 * Saving a V2 deck to Course Content (public/ppt-studio/js/v2Deck.js).
 *
 * A saved PPT is reopened from its markdown description, and the markdown
 * round trip keeps only V1 fields - so every saved V2 deck reopened as V1
 * bullets. The full deck now rides in the description as one html-comment
 * line. These tests pin the contract: V2 decks survive the round trip, V1
 * decks and old saves are untouched, and a bad payload falls back to the
 * markdown instead of breaking the viewer.
 *
 * The shipped files are loaded into jsdom, so the thing under test is the
 * file the page loads.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, describe, expect, it } from 'vitest';

const JS = resolve(__dirname, '../../public/ppt-studio/js');
let Deck: any;

beforeAll(() => {
  for (const file of ['pptV2.js', 'v2Deck.js']) {
    const code = readFileSync(resolve(JS, file), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', code)(window, document);
  }
  Deck = (window as any).PPTV2Deck;
});

function v2Slide(n: number, over: any = {}) {
  return {
    slideNumber: n, type: 'content', title: `Slide ${n}`, bullets: ['a fact'],
    imageUrl: 'https://img.test/leaf.png', imageBase64: 'data:image/png;base64,QUJD',
    v2: {
      version: '2.0', slideNumber: n, slideType: 'concept',
      title: { text: `Slide ${n}` },
      layout: { name: 'concept_split', regions: { title: { x: 0, y: 0, w: 1, h: 0.2 } } },
      visual: { strategy: 'programmatic_diagram', base64: 'data:image/png;base64,RElBRw==' },
      ...over,
    },
  };
}

const v1Deck = { title: 'Old deck', slides: [{ slideNumber: 1, type: 'title', title: 'Hi', bullets: [] }] };
const v2Deck = { title: 'Respiration', slides: [v2Slide(1), v2Slide(2)], generation: { version: 'v2' } };
const MD = '## Slide 1: Slide 1\n- a fact\n\n## Slide 2: Slide 2\n- a fact';

describe('saving', () => {
  it('leaves a V1 deck exactly as the markdown it was', () => {
    expect(Deck.embed(MD, v1Deck)).toBe(MD);
  });

  it('appends a V2 deck as one html-comment line the markdown parser skips', () => {
    const out = Deck.embed(MD, v2Deck);
    expect(out.startsWith(MD)).toBe(true);
    const last = out.split('\n').pop()!;
    expect(last.startsWith('<!--') && last.endsWith('-->')).toBe(true);
    expect(last).toContain(Deck.MARKER);
  });

  it('re-saving replaces the snapshot instead of stacking a second one', () => {
    const twice = Deck.embed(Deck.embed(MD, v2Deck), v2Deck);
    expect(twice.split(Deck.MARKER).length - 1).toBe(1);
  });

  it('drops the inlined copy of an image that has a URL, keeps the V2 visual', () => {
    const deck = Deck.extract(Deck.embed(MD, v2Deck));
    expect(deck.slides[0].imageBase64).toBeUndefined();
    expect(deck.slides[0].imageUrl).toBe('https://img.test/leaf.png');
    expect(deck.slides[0].v2.visual.base64).toBe('data:image/png;base64,RElBRw==');
  });

  it('does not touch the deck it was given', () => {
    const deck = JSON.parse(JSON.stringify(v2Deck));
    Deck.embed(MD, deck);
    expect(deck).toEqual(v2Deck);
  });
});

describe('reopening', () => {
  it('gives back the V2 deck as it was generated', () => {
    const deck = Deck.extract(Deck.embed(MD, v2Deck));
    expect(deck.title).toBe('Respiration');
    expect(deck.generation).toEqual({ version: 'v2' });
    expect(deck.slides.map((s: any) => s.v2.layout.name)).toEqual(['concept_split', 'concept_split']);
    expect((window as any).PPTV2.isV2(deck.slides[0])).toBe(true);
  });

  it('survives non-ASCII text and a "-->" inside the content', () => {
    const tricky = { ...v2Deck, title: 'श्वसन → ATP --> energy' };
    expect(Deck.extract(Deck.embed(MD, tricky)).title).toBe('श्वसन → ATP --> energy');
  });

  it('returns null for decks saved before this change, so the markdown is used', () => {
    expect(Deck.extract(MD)).toBeNull();
    expect(Deck.extract('')).toBeNull();
    expect(Deck.extract(undefined)).toBeNull();
  });

  it('returns null for a corrupt snapshot rather than breaking the viewer', () => {
    expect(Deck.extract(`${MD}\n\n<!-- ${Deck.MARKER}:bm90IGpzb24= -->`)).toBeNull();
  });

  it('returns null when the snapshot holds no V2 slide', () => {
    const b64 = btoa(JSON.stringify(v1Deck));
    expect(Deck.extract(`${MD}\n\n<!-- ${Deck.MARKER}:${b64} -->`)).toBeNull();
  });
});

describe('image slides (each slide one painted picture)', () => {
  const painted = {
    title: 'Photosynthesis',
    generation: { version: 'image' },
    slides: [
      { slideNumber: 1, type: 'title', title: 'What is Photosynthesis?', bullets: [],
        slideImage: { url: 'http://localhost:8001/generated-note-images/a.png',
                      base64: 'data:image/png;base64,QUJD' } },
    ],
  };

  it('are saved with the deck, because the markdown has no picture to reopen', () => {
    const deck = Deck.extract(Deck.embed(MD, painted));
    expect(deck.generation).toEqual({ version: 'image' });
    expect(deck.slides[0].slideImage.url).toBe('http://localhost:8001/generated-note-images/a.png');
  });

  it('keep only the link, not the inlined copy the export made', () => {
    const deck = Deck.extract(Deck.embed(MD, painted));
    expect(deck.slides[0].slideImage.base64).toBeUndefined();
  });

  it('do not pull a plain V1 deck along with them', () => {
    expect(Deck.embed(MD, v1Deck)).toBe(MD);
  });
});
