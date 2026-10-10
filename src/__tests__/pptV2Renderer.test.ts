/**
 * The V2 PowerPoint renderer (public/ppt-studio/js/pptV2.js).
 *
 * The renderer is a plain browser global, not a module, so these tests load
 * the *shipped file* into a sandbox and drive it with a fake PptxGenJS that
 * records every call. That means the thing under test is exactly the file the
 * page loads — no parallel copy to drift out of sync.
 *
 * What is worth testing here is what fails silently in a .pptx: geometry that
 * lands off the slide, a colour token that resolves to nothing, a label that
 * escapes the picture it belongs to, an empty frame where a visual should be.
 * None of those throw; they just produce a deck a teacher has to apologise for.
 *
 * These tests do NOT verify that the deck looks good. Nothing renders pixels.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { runInNewContext } from 'vm';
import { beforeAll, describe, expect, it } from 'vitest';

const SLIDE_W = 10;
const SLIDE_H = 5.625;

type Call = { fn: string; shape?: string; opts: any; text?: any };

/** A PptxGenJS stand-in that records instead of drawing. */
function makeSlide() {
  const calls: Call[] = [];
  return {
    calls,
    background: null as any,
    addShape(shape: string, opts: any) { calls.push({ fn: 'shape', shape, opts }); },
    addText(text: any, opts: any) { calls.push({ fn: 'text', text, opts }); },
    addImage(opts: any) { calls.push({ fn: 'image', opts }); },
    addNotes() { /* not under test */ },
  };
}

const pptx = {
  shapes: new Proxy({}, { get: (_t, k) => String(k) }) as any,
};

let PPTV2: any;

beforeAll(() => {
  const file = resolve(__dirname, '../../public/ppt-studio/js/pptV2.js');
  const sandbox: any = { window: {}, console };
  runInNewContext(readFileSync(file, 'utf8'), sandbox, { filename: 'pptV2.js' });
  PPTV2 = sandbox.window.PPTV2;
});

const THEME = {
  name: 'biology',
  colors: {
    ink: '#111827', ink_muted: '#4B5563', heading: '#1B7A4B',
    on_primary: '#FFFFFF', on_accent: '#FFFFFF', surface: '#FFFFFF',
    surface_alt: '#F4F6F8', border: '#D8DEE6', primary: '#1B7A4B',
    primary_soft: '#E6F4EC', accent: '#1E5FA8', accent_soft: '#E6EFF9',
  },
  fonts: { heading: 'Segoe UI Semibold', body: 'Segoe UI', mono: 'Consolas' },
  sizes: { display: 44, title: 32, subtitle: 20, heading: 22, body: 17,
           caption: 13, annotation: 12, footer: 10, stat: 40 },
  background: 'surface',
};

function slideSpec(over: any = {}) {
  return {
    slideNumber: 1,
    type: 'content',
    title: 'What is Photosynthesis?',
    bullets: ['a', 'b'],
    imageBase64: 'data:image/png;base64,AAA',
    v2: {
      version: '2.0',
      slideNumber: 1,
      slideType: 'concept',
      title: { text: 'What is Photosynthesis?', emphasisText: 'Photosynthesis',
               emphasis: 'strong' },
      subtitle: 'Plants make their own food',
      footer: 'Class 8 • Science • CBSE',
      learningObjective: 'Define photosynthesis',
      highlightedTerms: ['chlorophyll'],
      contentBlocks: [
        { kind: 'bullet', label: 'Sunlight', text: 'Leaves trap light using chlorophyll.',
          icon: 'sun', order: 0, emphasis: 'normal' },
        { kind: 'bullet', label: 'Water', text: 'Roots absorb water from the soil.',
          icon: 'water', order: 1, emphasis: 'normal' },
      ],
      visual: {
        description: 'a green leaf', strategy: 'searched_image',
        resolvedStrategy: 'searched_image', url: '', base64: 'data:image/png;base64,AAA',
        icons: ['sun', 'water'], mustShow: [], searchTerms: ['leaf'],
        imagePrompt: 'a leaf', annotations: [], altText: 'a leaf',
      },
      layout: {
        name: 'concept_hero_split', flow: 'ltr', density: 'normal',
        regions: {
          title: { x: 0.055, y: 0.07, w: 0.89, h: 0.125 },
          subtitle: { x: 0.055, y: 0.202, w: 0.89, h: 0.055 },
          footer: { x: 0.055, y: 0.918, w: 0.89, h: 0.042 },
          content: { x: 0.055, y: 0.285, w: 0.44, h: 0.615 },
          block_0: { x: 0.055, y: 0.285, w: 0.44, h: 0.29 },
          block_1: { x: 0.055, y: 0.61, w: 0.44, h: 0.29 },
          visual: { x: 0.525, y: 0.285, w: 0.42, h: 0.615 },
        },
      },
      theme: THEME,
      speakerNotes: '', citations: [],
    },
    ...over,
  };
}

function render(data: any) {
  const slide = makeSlide();
  const layout = PPTV2.renderSlide(slide, pptx, data, {});
  return { slide, layout, calls: slide.calls };
}

/** One string per addText call. Rich text arrives as styled runs
 *  (["What is ", "Photosynthesis", "?"]), so the runs of a single call are
 *  concatenated rather than listed separately. */
function allTexts(calls: Call[]): string[] {
  return calls.filter(c => c.fn === 'text').map(c =>
    typeof c.text === 'string' ? c.text
      : Array.isArray(c.text) ? c.text.map((r: any) => r.text).join('') : '');
}

describe('V2 detection', () => {
  it('recognises a slide carrying a V2 specification', () => {
    expect(PPTV2.isV2(slideSpec())).toBe(true);
  });

  it('ignores a plain V1 slide so it keeps the old renderer', () => {
    expect(PPTV2.isV2({ title: 'A', bullets: ['x'] })).toBe(false);
    expect(PPTV2.isV2(null)).toBe(false);
  });

  it('ignores a half-built v2 block rather than half-drawing it', () => {
    expect(PPTV2.isV2({ v2: {} })).toBe(false);
    expect(PPTV2.isV2({ v2: { title: { text: 'x' } } })).toBe(false);
  });
});

describe('normalised geometry', () => {
  it('converts 0..1 to inches against the real canvas', () => {
    expect(PPTV2._box({ x: 0.5, y: 0.5, w: 0.25, h: 0.2 }))
      .toEqual({ x: 5, y: 2.8125, w: 2.5, h: 1.125 });
  });

  it('maps the full slide exactly', () => {
    expect(PPTV2._box({ x: 0, y: 0, w: 1, h: 1 }))
      .toEqual({ x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
  });

  it('clamps a box back onto the slide', () => {
    const b = PPTV2._clamp({ x: 9.5, y: 5.5, w: 2, h: 1 });
    expect(b.x + b.w).toBeLessThanOrEqual(SLIDE_W + 1e-9);
    expect(b.y + b.h).toBeLessThanOrEqual(SLIDE_H + 1e-9);
  });

  it('confines a box to its parent, not merely to the slide', () => {
    // The bug this prevents: an annotation sitting on top of the content
    // cards because it was only checked against the slide edges.
    const parent = { x: 5, y: 1, w: 4, h: 3 };
    const b = PPTV2._confine({ x: 1, y: 0, w: 1.2, h: 0.24 }, parent);
    expect(b.x).toBeGreaterThanOrEqual(parent.x);
    expect(b.x + b.w).toBeLessThanOrEqual(parent.x + parent.w + 1e-9);
    expect(b.y).toBeGreaterThanOrEqual(parent.y);
  });
});

describe('theme resolution', () => {
  it('strips the hash PptxGenJS will not accept', () => {
    expect(PPTV2._color(THEME, 'primary')).toBe('1B7A4B');
  });

  it('falls back when a token is missing instead of emitting undefined', () => {
    const colour = PPTV2._color({ colors: {} }, 'primary');
    expect(colour).toMatch(/^[0-9A-F]{6}$/);
  });

  it('survives a theme with no colors at all', () => {
    expect(PPTV2._color(undefined, 'ink')).toMatch(/^[0-9A-F]{6}$/);
  });

  it('resolves every subject theme the backend can produce', () => {
    // The renderer must not assume Biology.
    const palettes: Record<string, string> = {
      biology: '1B7A4B', physics: '1E4FA3', chemistry: '5B3FB5',
      mathematics: '1E4FA3', history: '8A4B2A', geography: '136F63',
    };
    for (const [name, primary] of Object.entries(palettes)) {
      const theme = { ...THEME, name, colors: { ...THEME.colors, primary: '#' + primary } };
      expect(PPTV2._color(theme, 'primary')).toBe(primary);
    }
  });
});

describe('typography', () => {
  it('scales the backend 13.33in point sizes onto this 10in canvas', () => {
    // 32pt on a 13.33in slide is proportionally 32 * 0.75 here.
    expect(PPTV2._pt(THEME, 'title')).toBeCloseTo(24, 1);
    expect(PPTV2._pt(THEME, 'body')).toBeCloseTo(12.8, 1);
  });

  it('keeps a strict size hierarchy', () => {
    const t = PPTV2._pt(THEME, 'title');
    expect(t).toBeGreaterThan(PPTV2._pt(THEME, 'subtitle'));
    expect(PPTV2._pt(THEME, 'subtitle')).toBeGreaterThan(PPTV2._pt(THEME, 'body'));
    expect(PPTV2._pt(THEME, 'body')).toBeGreaterThan(PPTV2._pt(THEME, 'caption'));
    expect(PPTV2._pt(THEME, 'caption')).toBeGreaterThanOrEqual(PPTV2._pt(THEME, 'footer'));
  });

  it('never returns an unreadable size', () => {
    expect(PPTV2._pt({ sizes: { body: 1 } }, 'body')).toBeGreaterThanOrEqual(PPTV2.MIN_PT);
  });

  it('shrinks type when the text will not fit, within limits', () => {
    const box = { x: 0, y: 0, w: 2, h: 0.4 };
    const shrunk = PPTV2._fitPt('word '.repeat(200), box, 17);
    expect(shrunk).toBeLessThan(17);
    expect(shrunk).toBeGreaterThanOrEqual(PPTV2.MIN_PT);
  });

  it('leaves text that already fits alone', () => {
    expect(PPTV2._fitPt('short', { x: 0, y: 0, w: 4, h: 2 }, 17)).toBe(17);
  });

  it('truncates only as a last resort, and marks it', () => {
    const out = PPTV2._truncate('word '.repeat(400), { w: 1, h: 0.3 }, 12);
    expect(out.length).toBeLessThan(2000);
    expect(out.endsWith('…')).toBe(true);
  });
});

describe('rich text runs', () => {
  it('splits highlighted terms into their own styled runs', () => {
    const runs = PPTV2._runs('Leaves use chlorophyll to trap light',
                             ['chlorophyll'], { bold: false }, { bold: true });
    expect(runs.map((r: any) => r.text).join('')).toBe('Leaves use chlorophyll to trap light');
    expect(runs.find((r: any) => r.text === 'chlorophyll').options.bold).toBe(true);
  });

  it('returns one plain run when there is nothing to highlight', () => {
    expect(PPTV2._runs('plain', [], { a: 1 }, { b: 2 })).toHaveLength(1);
  });

  it('does not break on regex characters in a term', () => {
    const runs = PPTV2._runs('CO2 (gas) enters', ['(gas)'], {}, { bold: true });
    expect(runs.map((r: any) => r.text).join('')).toBe('CO2 (gas) enters');
  });
});

describe('layout dispatch', () => {
  it('uses the layout the backend chose', () => {
    expect(render(slideSpec()).layout).toBe('concept_hero_split');
  });

  it('renders every layout in the backend registry', () => {
    const names = ['title_hero', 'concept_hero_split', 'process_steps', 'comparison',
                   'cause_effect', 'anatomy_labeled', 'magnification', 'timeline',
                   'formula_equation', 'summary_grid', 'quiz'];
    for (const name of names) {
      expect(typeof PPTV2._layouts[name]).toBe('function');
    }
  });

  it('falls back to a generic layout rather than throwing on an unknown one', () => {
    const data = slideSpec();
    data.v2.layout.name = 'something_invented_later';
    const { layout, calls } = render(data);
    expect(layout).toBe('concept_hero_split');
    expect(allTexts(calls)).toContain('What is Photosynthesis?');
  });

  it('draws each layout without error on the same content', () => {
    for (const name of Object.keys(PPTV2._layouts)) {
      const data = slideSpec();
      data.v2.layout.name = name;
      expect(() => render(data), name).not.toThrow();
    }
  });
});

describe('composition', () => {
  it('renders the category badge, title, subtitle and cards', () => {
    const texts = allTexts(render(slideSpec()).calls);
    expect(texts).toContain('CLASS 8 • SCIENCE • CBSE');
    expect(texts.join(' ')).toContain('What is Photosynthesis?');
    expect(texts).toContain('Plants make their own food');
    expect(texts).toContain('Sunlight');
    expect(texts).toContain('Water');
  });

  it('numbers the cards', () => {
    expect(allTexts(render(slideSpec()).calls)).toContain('01');
  });

  it('emphasises the title words the backend marked', () => {
    const call = render(slideSpec()).calls.find(
      c => c.fn === 'text' && Array.isArray(c.text)
        && c.text.some((r: any) => r.text === 'Photosynthesis'));
    expect(call).toBeDefined();
  });

  it('places the image inside the visual region', () => {
    const img = render(slideSpec()).calls.find(c => c.fn === 'image');
    expect(img).toBeDefined();
    expect(img!.opts.x).toBeGreaterThanOrEqual(0.525 * SLIDE_W - 0.01);
    expect(img!.opts.data).toBe('data:image/png;base64,AAA');
  });

  it('keeps every drawn object on the slide', () => {
    // Decorative bleed is allowed; anything carrying content is not.
    for (const c of render(slideSpec()).calls) {
      const o = c.opts || {};
      if (o.x == null || c.shape === 'OVAL') continue;
      expect(o.x, JSON.stringify(c.text || c.shape)).toBeGreaterThanOrEqual(-0.01);
      expect(o.x + (o.w || 0)).toBeLessThanOrEqual(SLIDE_W + 0.01);
      expect(o.y + (o.h || 0)).toBeLessThanOrEqual(SLIDE_H + 0.01);
    }
  });
});

describe('image fitting', () => {
  it('contains a diagram so its labels are not cropped off', () => {
    const data = slideSpec();
    data.v2.visual.resolvedStrategy = 'programmatic_diagram';
    const img = render(data).calls.find(c => c.fn === 'image');
    expect(img!.opts.sizing.type).toBe('contain');
  });

  it('covers a photograph, where losing the edges costs nothing', () => {
    const data = slideSpec();
    data.v2.visual.resolvedStrategy = 'searched_image';
    data.v2.slideType = 'concept';
    data.v2.visual.annotations = [];
    data.v2.visual.icons = [];
    const img = render(data).calls.find(c => c.fn === 'image');
    expect(img!.opts.sizing.type).toBe('cover');
  });

  it('never distorts: it always declares a sizing mode', () => {
    const img = render(slideSpec()).calls.find(c => c.fn === 'image');
    expect(['cover', 'contain']).toContain(img!.opts.sizing.type);
  });
});

describe('annotations', () => {
  function annotated() {
    const data = slideSpec();
    // ai_generated_image, because chips are only drawn over pictures we
    // authored — see the searched-image test below.
    data.v2.visual.resolvedStrategy = 'ai_generated_image';
    // Deliberately distinct from the card labels ("Sunlight", "Water") so a
    // match can only have come from the annotation path.
    data.v2.visual.annotations = [
      { text: 'Upper surface', anchor: [0.5, 0.1], leader: true, side: 'auto' },
      { text: 'Stomata', anchor: [0.9, 0.5], leader: true, side: 'auto' },
      { text: 'Xylem', anchor: [0.1, 0.9], leader: true, side: 'auto' },
    ];
    return data;
  }

  it('renders each annotation as real editable text', () => {
    const texts = allTexts(render(annotated()).calls);
    expect(texts).toContain('Upper surface');
    expect(texts).toContain('Stomata');
  });

  it('keeps every label inside the picture it labels', () => {
    // The first build put "Sunlight" on top of the content cards and ran
    // "Stomata" to the slide edge.
    const vis = PPTV2._box(annotated().v2.layout.regions.visual);
    const labels = render(annotated()).calls.filter(
      c => c.fn === 'text' && ['Upper surface', 'Stomata', 'Xylem'].includes(c.text));
    expect(labels).toHaveLength(3);
    for (const l of labels) {
      expect(l.opts.x).toBeGreaterThanOrEqual(vis.x - 0.06);
      expect(l.opts.x + l.opts.w).toBeLessThanOrEqual(vis.x + vis.w + 0.06);
      expect(l.opts.y).toBeGreaterThanOrEqual(vis.y - 0.01);
      expect(l.opts.y + l.opts.h).toBeLessThanOrEqual(vis.y + vis.h + 0.01);
    }
  });

  it('draws a leader with a real length, never a zero-size line', () => {
    const lines = render(annotated()).calls.filter(c => c.shape === 'LINE');
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) {
      expect(Math.max(l.opts.w, l.opts.h)).toBeGreaterThan(0.02);
      expect(l.opts.w).toBeGreaterThan(0);
      expect(l.opts.h).toBeGreaterThan(0);
    }
  });

  // A searched photo was not composed to our anchors, so its required labels
  // arrive as a key: the same words, no arrows pointing at guessed positions.
  function legend() {
    const data = annotated();
    data.v2.visual.resolvedStrategy = 'searched_image';
    data.v2.visual.labelPolicy = 'legend';
    data.v2.visual.annotations = data.v2.visual.annotations.map((a: any, i: number) => ({
      ...a, leader: false, box: [0.005, 0.66 + i * 0.11, 0.99, 0.1],
    }));
    return data;
  }

  it('draws a legend on a searched image, with no leader arrows', () => {
    const calls = render(legend()).calls;
    const texts = allTexts(calls);
    for (const word of ['Upper surface', 'Stomata', 'Xylem']) expect(texts).toContain(word);
    expect(calls.filter(c => c.shape === 'LINE')).toHaveLength(0);
  });

  it('does not double-label a diagram that labels itself', () => {
    const data = annotated();
    data.v2.visual.resolvedStrategy = 'programmatic_diagram';
    data.v2.visual.labelPolicy = 'native';
    const texts = allTexts(render(data).calls);
    expect(texts).not.toContain('Upper surface');
  });

  it('drops annotations when there is no picture to point at', () => {
    const data = annotated();
    data.v2.visual.base64 = '';
    data.imageBase64 = '';
    expect(allTexts(render(data).calls)).not.toContain('Stomata');
  });

  it('is not drawn over a searched image, which has its own labels', () => {
    // A search result is somebody else's figure and usually arrives with
    // labels baked into the pixels. The first live render put our chips on
    // top of them, hiding the real labels behind worse duplicates.
    const data = annotated();
    data.v2.visual.resolvedStrategy = 'searched_image';
    const texts = allTexts(render(data).calls);
    expect(texts).not.toContain('Stomata');
    expect(texts).not.toContain('Upper surface');
  });

  it('is not drawn over a programmatic diagram, which labels itself', () => {
    // Originally allowed, on the reasoning that we authored the figure so it
    // must be bare. Rasterising a process slide disproved that:
    // render_diagram draws labels from its own spec, and our "Glucose" chip
    // landed across the diagram's own "Glucose".
    const data = annotated();
    data.v2.visual.resolvedStrategy = 'programmatic_diagram';
    expect(allTexts(render(data).calls)).not.toContain('Stomata');
  });

  it('is drawn only over a generated image, the one case known to be bare', () => {
    const data = annotated();
    data.v2.visual.resolvedStrategy = 'ai_generated_image';
    expect(allTexts(render(data).calls)).toContain('Stomata');
  });

  it('survives a malformed anchor', () => {
    const data = annotated();
    data.v2.visual.annotations = [{ text: 'Odd', anchor: null, leader: true, side: 'auto' } as any];
    expect(() => render(data)).not.toThrow();
    expect(allTexts(render(data).calls)).toContain('Odd');
  });
});

describe('icon composition (no image available)', () => {
  function iconic() {
    const data = slideSpec();
    data.v2.visual.base64 = '';
    data.v2.visual.url = '';
    data.imageBase64 = '';
    data.v2.visual.resolvedStrategy = 'icon_composition';
    return data;
  }

  it('draws icons rather than an empty frame', () => {
    // The first build left a large blank grey panel on slide 2.
    const texts = allTexts(render(iconic()).calls);
    expect(texts).toContain('☀');
    expect(texts).toContain('H₂O');
  });

  it('uses BMP symbols and formulae, not astral emoji', () => {
    // Emoji depend on an emoji font being installed; a missing one shows a
    // box on the projector.
    for (const glyph of Object.values(PPTV2._ICON_GLYPH) as string[]) {
      for (const ch of [...glyph]) {
        expect(ch.codePointAt(0)!, glyph).toBeLessThan(0x10000);
      }
    }
  });

  it('joins icons with arrows only when the slide is a sequence', () => {
    // A live deck drew "cell A > oxygen > carbon dioxide > water > cell B"
    // across a comparison and "glucose > oxygen > CO2" across an equation.
    // A concept slide's icons are things involved, not steps.
    expect(PPTV2.iconRow(iconic().v2).mode).toBe('set');
    expect(render(iconic()).calls.some(c => c.shape === 'RIGHT_ARROW')).toBe(false);
    const steps = iconic();
    steps.v2.slideType = 'process';
    expect(PPTV2.iconRow(steps.v2).mode).toBe('sequence');
  });

  it('draws nothing at all rather than an empty box when there are no icons', () => {
    const data = iconic();
    data.v2.visual.icons = [];
    data.v2.contentBlocks = [];
    const vis = PPTV2._box(data.v2.layout.regions.visual);
    const frames = render(data).calls.filter(
      c => c.shape === 'ROUNDED_RECTANGLE' && Math.abs(c.opts.x - vis.x) < 0.01
        && Math.abs(c.opts.w - vis.w) < 0.01);
    expect(frames).toHaveLength(0);
  });
});

describe('process_steps', () => {
  function process() {
    const data = slideSpec();
    data.v2.slideType = 'process';
    data.v2.layout.name = 'process_steps';
    data.v2.layout.regions = {
      ...data.v2.layout.regions,
      visual: { x: 0.055, y: 0.285, w: 0.89, h: 0.3 },
      block_0: { x: 0.055, y: 0.615, w: 0.206, h: 0.285 },
      block_1: { x: 0.283, y: 0.615, w: 0.206, h: 0.285 },
      connector_0: { x: 0.261, y: 0.733, w: 0.022, h: 0.05 },
    } as any;
    return data;
  }

  it('renders the steps as numbered cards with an arrow between them', () => {
    const { calls } = render(process());
    expect(allTexts(calls)).toContain('01');
    expect(calls.some(c => c.shape === 'DOWN_ARROW' || c.shape === 'RIGHT_ARROW')).toBe(true);
  });

  it('does not truncate a long label in a narrow card', () => {
    // "3. Carbon Dioxide…" in the first build. The badge carries the number,
    // so the planner's own "3." is dropped rather than printed twice.
    const data = process();
    data.v2.contentBlocks[0].label = '3. Carbon Dioxide Fixation';
    const texts = allTexts(render(data).calls);
    expect(texts).toContain('Carbon Dioxide Fixation');
    expect(texts).not.toContain('3. Carbon Dioxide Fixation');
  });
});

describe('V1 is untouched', () => {
  /** Load pptExport.js too, so the guard inside _buildSlide is the real one. */
  function loadExport() {
    const dir = resolve(__dirname, '../../public/ppt-studio/js');
    const sandbox: any = {
      window: {}, console,
      PptxGenJS: function () { /* unused */ },
      THEMES: { 'dark-professional': { bgGradient: ['0F172A', '1E293B'],
                                       text: 'FFFFFF', accent: '4F46E5',
                                       bg: '0F172A', muted: '94A3B8' } },
    };
    sandbox.window.THEMES = sandbox.THEMES;
    for (const f of ['pptV2.js', 'pptExport.js']) {
      runInNewContext(readFileSync(resolve(dir, f), 'utf8'), sandbox, { filename: f });
    }
    return sandbox.window;
  }

  it('a V1 slide does not reach the V2 renderer', () => {
    const win = loadExport();
    let v2Called = false;
    win.PPTV2.renderSlide = () => { v2Called = true; };
    let v1Called = false;
    win.PPTExport._exec_content = () => { v1Called = true; };

    win.PPTExport._buildSlide(makeSlide(), pptx,
                              { type: 'content', title: 'Plain', bullets: ['x'] },
                              win.THEMES['dark-professional'], 'executive');
    expect(v2Called).toBe(false);
    expect(v1Called).toBe(true);
  });

  it('a V2 slide reaches the V2 renderer instead of the V1 design', () => {
    const win = loadExport();
    let v2Called = false;
    win.PPTV2.renderSlide = () => { v2Called = true; };
    let v1Called = false;
    win.PPTExport._exec_content = () => { v1Called = true; };

    win.PPTExport._buildSlide(makeSlide(), pptx, slideSpec(),
                              win.THEMES['dark-professional'], 'executive');
    expect(v2Called).toBe(true);
    expect(v1Called).toBe(false);
  });

  it('a V2 renderer crash falls back to V1 rather than losing the slide', () => {
    const win = loadExport();
    win.PPTV2.renderSlide = () => { throw new Error('boom'); };
    let v1Called = false;
    win.PPTExport._exec_content = () => { v1Called = true; };

    expect(() => win.PPTExport._buildSlide(
      makeSlide(), pptx, slideSpec(),
      win.THEMES['dark-professional'], 'executive')).not.toThrow();
    expect(v1Called).toBe(true);
  });
});

describe('robustness', () => {
  it('renders a slide with no blocks, no image and no subtitle', () => {
    const data = slideSpec();
    data.v2.contentBlocks = [];
    data.v2.subtitle = '';
    data.v2.visual.base64 = '';
    data.imageBase64 = '';
    expect(() => render(data)).not.toThrow();
  });

  it('renders when the theme is missing entirely', () => {
    const data = slideSpec();
    delete (data.v2 as any).theme;
    expect(() => render(data)).not.toThrow();
  });

  it('handles a gradient background spec', () => {
    const data = slideSpec();
    data.v2.theme = { ...THEME, background: 'gradient:primary->accent' };
    const { slide } = render(data);
    expect(slide.background).toBeTruthy();
  });
});

describe('slide quality fixes (live Respiration deck)', () => {
  const v2 = (over: any) => ({ slideType: 'concept', contentBlocks: [], visual: { icons: [] }, ...over });

  it('captions a process row with the step names, never the icon keys', () => {
    const row = PPTV2.iconRow(v2({
      slideType: 'process',
      contentBlocks: [
        { kind: 'step', label: '1. Inhalation', icon: 'arrow_down' },
        { kind: 'step', label: '2. Exhalation', icon: 'arrow_up' },
        { kind: 'step', label: '3. Role of Intercostals', icon: 'muscle' },
      ],
    }));
    expect(row.mode).toBe('sequence');
    expect(row.items.map((i: any) => i.caption))
      .toEqual(['Inhalation', 'Exhalation', 'Role of Intercostals']);
    expect(row.items.map((i: any) => i.glyph)).toEqual(['1', '2', '3']);
  });

  it('sets the two sides of a comparison against each other', () => {
    const row = PPTV2.iconRow(v2({
      slideType: 'comparison',
      contentBlocks: [{ label: 'Aerobic', text: 'x' }, { label: 'Anaerobic', text: 'y' }],
      visual: { icons: ['cell A', 'oxygen', 'carbon dioxide', 'water', 'cell B'] },
    }));
    expect(row.mode).toBe('versus');
    expect(row.items.map((i: any) => i.caption)).toEqual(['Aerobic', 'Anaerobic']);
  });

  it('keeps only items with a real symbol, and drops filler words from captions', () => {
    const row = PPTV2.iconRow(v2({
      slideType: 'formula',
      visual: { icons: ['glucose', 'aerobic pathway diagram', 'oxygen symbol', 'lactic acid'] },
    }));
    expect(row.mode).toBe('set');
    expect(row.items.map((i: any) => i.caption)).toEqual(['glucose', 'oxygen']);
  });

  it('draws nothing when no item has a symbol, rather than bare initials', () => {
    const row = PPTV2.iconRow(v2({ visual: { icons: ['aerobic pathway', 'lactic acid'] } }));
    expect(row.mode).toBe('none');
  });

  it('keeps a title emphasis readable on a dark background', () => {
    const theme = {
      colors: { primary: '1B7A4B', accent: '1E5FA8', accent_soft: 'E6EFF9',
                primary_soft: 'E6F4EC', on_primary: 'FFFFFF', heading: 'FFFFFF',
                surface: 'FFFFFF' },
      background: 'gradient:primary->accent',
    };
    const mark = PPTV2.titleMarkColor(theme);
    expect(mark).not.toBe('1E5FA8');
    expect(PPTV2.contrast(mark, '1B7A4B')).toBeGreaterThanOrEqual(3);
    expect(PPTV2.contrast(mark, '1E5FA8')).toBeGreaterThanOrEqual(3);
  });

  it('leaves the accent alone where it already reads', () => {
    const theme = { colors: { accent: '1E5FA8', surface: 'FFFFFF' }, background: 'surface' };
    expect(PPTV2.titleMarkColor(theme)).toBe('1E5FA8');
  });

  it('states the problem in the equation band, never a copy of card 1', () => {
    const blocks = [{ kind: 'step', label: 'Glycolysis', text: 'Produces 2 ATP.' }];
    expect(PPTV2.equationText({ contentBlocks: blocks, learningObjective: 'Calculate total ATP.' }))
      .toBe('Calculate total ATP.');
    expect(PPTV2.equationText({ contentBlocks: [{ kind: 'equation', text: 'F = ma' }, ...blocks] }))
      .toBe('F = ma');
    expect(PPTV2.equationText({ contentBlocks: blocks })).toBe('');
  });

  it('shows the key terms when no item has an honest symbol', () => {
    const row = PPTV2.iconRow(v2({ slideType: 'cause_effect', visual: { icons: ['muscle'] },
                                   highlightedTerms: ['Contraction', 'Negative pressure', 'contraction'] }));
    expect(row.mode).toBe('terms');
    expect(row.items.map((i: any) => i.caption)).toEqual(['Contraction', 'Negative pressure']);
  });

  it('strips planner numbering only when a badge already shows the number', () => {
    expect(PPTV2.displayLabel('1. Inhalation', true)).toBe('Inhalation');
    expect(PPTV2.displayLabel('Step 2: Mix', true)).toBe('Mix');
    expect(PPTV2.displayLabel('1. Inhalation', false)).toBe('1. Inhalation');
    expect(PPTV2.displayLabel('1857 Revolt', true)).toBe('1857 Revolt');
  });
});
