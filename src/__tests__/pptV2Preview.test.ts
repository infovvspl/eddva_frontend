/**
 * The V2 browser preview renderer (public/ppt-studio/js/pptV2Preview.js).
 *
 * The preview and the .pptx export must represent the same composition from
 * the same specification, so most of what is worth asserting here is
 * *agreement*: that both read their colours, type scale, icon glyphs, layout
 * choice and annotation rules from the one source of truth in pptV2.js, and
 * that geometry lands in the same normalised place.
 *
 * The shipped files are loaded into jsdom and driven for real, so the thing
 * under test is the file the page loads.
 *
 * These tests assert structure, not appearance. Pixel QA is a separate step
 * (Playwright screenshots) because jsdom does no layout.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const JS = resolve(__dirname, '../../public/ppt-studio/js');

let PPTV2: any;
let PPTV2Preview: any;
let canvas: HTMLElement;

beforeAll(() => {
  for (const file of ['pptV2.js', 'pptV2Preview.js']) {
    const code = readFileSync(resolve(JS, file), 'utf8');
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', code)(window, document);
  }
  PPTV2 = (window as any).PPTV2;
  PPTV2Preview = (window as any).PPTV2Preview;
});

beforeEach(() => {
  document.body.innerHTML = '<div id="slide-canvas"></div>';
  canvas = document.getElementById('slide-canvas')!;
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
    slideNumber: 1, type: 'content', title: 'What is Photosynthesis?',
    bullets: ['a', 'b'], imageBase64: 'data:image/png;base64,AAA',
    v2: {
      version: '2.0', slideNumber: 1, slideType: 'concept',
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
        description: 'a green leaf', strategy: 'ai_generated_image',
        resolvedStrategy: 'ai_generated_image', url: '',
        base64: 'data:image/png;base64,AAA',
        icons: ['sun', 'water'], mustShow: [], searchTerms: ['leaf'],
        imagePrompt: 'a leaf', annotations: [], altText: 'a green leaf',
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
      theme: THEME, speakerNotes: '', citations: [],
    },
    ...over,
  };
}

const render = (data: any) => PPTV2Preview.renderSlide(canvas, data);
const text = () => canvas.textContent || '';
const nodes = () => Array.from(canvas.querySelectorAll<HTMLElement>('*'));

describe('V1 is untouched', () => {
  it('a V1 slide is not claimed by the V2 preview', () => {
    expect(PPTV2Preview.isV2({ title: 'A', bullets: ['x'], type: 'content' })).toBe(false);
  });

  it('a V2 slide is claimed', () => {
    expect(PPTV2Preview.isV2(slideSpec())).toBe(true);
  });

  it('a half-built v2 block is not claimed', () => {
    expect(PPTV2Preview.isV2({ v2: {} })).toBe(false);
  });

  it('a spec with no layout still renders rather than blanking the canvas', () => {
    // preview.js wraps renderSlide in a try/catch that falls back to V1, so
    // a throw is survivable — but not throwing at all is better, and this is
    // the degenerate input most likely to reach it.
    const data = slideSpec();
    data.v2.layout = { name: 'concept_hero_split', regions: {} } as any;
    expect(() => render(data)).not.toThrow();
  });
});

describe('one source of truth with the export', () => {
  it('reads colours from the shared resolver', () => {
    expect(PPTV2Preview._hex(THEME, 'primary')).toBe('#' + PPTV2._color(THEME, 'primary'));
  });

  it('defines no palette of its own', () => {
    // Anything duplicated here would silently drift from the exported deck.
    expect((PPTV2Preview as any)._FALLBACK_COLORS).toBeUndefined();
    expect((PPTV2Preview as any).SUBJECT_THEMES).toBeUndefined();
  });

  it('defines no layout registry of its own, only renderers for the shared one', () => {
    expect(Object.keys(PPTV2Preview._layouts).sort())
      .toEqual(Object.keys(PPTV2._layouts).sort());
  });

  it('uses the shared layout chooser', () => {
    const data = slideSpec();
    data.v2.layout.name = 'not_a_real_layout';
    expect(render(data)).toBe(PPTV2.layoutFor(data.v2));
  });

  it('uses the shared type scale, converted to em', () => {
    // pt -> em must cancel the canvas width, which is what keeps the preview
    // proportional to the export at any container size.
    expect(PPTV2Preview._em(PPTV2._pt(THEME, 'title')))
      .toBe((PPTV2._pt(THEME, 'title') / 14.4).toFixed(3) + 'em');
  });

  it('uses the shared icon glyph map', () => {
    expect(PPTV2.glyphFor('CO₂')).toBe('CO₂');
    expect((PPTV2Preview as any)._ICON_GLYPH).toBeUndefined();
  });

  it('uses the shared annotation rule', () => {
    expect(PPTV2.annotationsAllowed({ resolvedStrategy: 'searched_image' })).toBe(false);
    expect(PPTV2.annotationsAllowed({ resolvedStrategy: 'ai_generated_image' })).toBe(true);
  });

  // The label policy is set by whichever producer supplied the asset. It
  // replaces the provider-name rule above whenever it is present: a diagram
  // that labels itself must not be labelled again, and a searched photo
  // carrying required labels must get them as a key.
  it('obeys the label policy over the provider name', () => {
    expect(PPTV2.annotationsAllowed({ labelPolicy: 'anchored', resolvedStrategy: 'ai_generated_image' })).toBe(true);
    expect(PPTV2.annotationsAllowed({ labelPolicy: 'legend', resolvedStrategy: 'searched_image' })).toBe(true);
    expect(PPTV2.annotationsAllowed({ labelPolicy: 'legend', resolvedStrategy: 'cached_asset' })).toBe(true);
    expect(PPTV2.annotationsAllowed({ labelPolicy: 'native', resolvedStrategy: 'programmatic_diagram' })).toBe(false);
    expect(PPTV2.annotationsAllowed({ labelPolicy: 'none', resolvedStrategy: 'ai_generated_image' })).toBe(false);
  });

  it('keeps the old rule for payloads from before label policies', () => {
    expect(PPTV2.annotationsAllowed({ labelPolicy: '', resolvedStrategy: 'ai_generated_image' })).toBe(true);
    expect(PPTV2.annotationsAllowed({ labelPolicy: '', resolvedStrategy: 'programmatic_diagram' })).toBe(false);
    expect(PPTV2.annotationsAllowed(undefined)).toBe(false);
  });
});

describe('normalised geometry', () => {
  it('converts 0..1 to percent', () => {
    const box = PPTV2Preview._pct({ x: 0.25, y: 0.5, w: 0.5, h: 0.25 });
    expect(box.left).toBe('25%');
    expect(box.top).toBe('50%');
    expect(box.width).toBe('50%');
    expect(box.height).toBe('25%');
  });

  it('keeps a box inside the canvas', () => {
    const box = PPTV2Preview._pct({ x: 0.9, y: 0.9, w: 0.5, h: 0.5 });
    expect(parseFloat(box.width)).toBeLessThanOrEqual(10.001);
    expect(parseFloat(box.height)).toBeLessThanOrEqual(10.001);
  });

  it('clamps a negative origin', () => {
    const box = PPTV2Preview._pct({ x: -0.5, y: -0.2, w: 0.3, h: 0.3 });
    expect(box.left).toBe('0%');
    expect(box.top).toBe('0%');
  });

  it('every placed element stays within 0..100% of the canvas', () => {
    render(slideSpec());
    for (const el of nodes()) {
      if (el.style.position !== 'absolute') continue;
      const left = parseFloat(el.style.left);
      const top = parseFloat(el.style.top);
      if (Number.isNaN(left) || Number.isNaN(top)) continue;
      // Decorative bleed is deliberate and the canvas clips it.
      if (parseFloat(el.style.opacity || '1') < 0.2) continue;
      expect(left).toBeGreaterThanOrEqual(-0.01);
      expect(top).toBeGreaterThanOrEqual(-0.01);
      expect(left + (parseFloat(el.style.width) || 0)).toBeLessThanOrEqual(100.01);
    }
  });

  it('agrees with the export on where a region sits', () => {
    const region = { x: 0.525, y: 0.285, w: 0.42, h: 0.615 };
    const inches = PPTV2._box(region);
    const pct = PPTV2Preview._pct(region);
    expect(parseFloat(pct.left) / 100).toBeCloseTo(inches.x / PPTV2.SLIDE_W, 5);
    expect(parseFloat(pct.top) / 100).toBeCloseTo(inches.y / PPTV2.SLIDE_H, 5);
  });
});

describe('layouts', () => {
  it('renders all eleven without throwing', () => {
    for (const name of Object.keys(PPTV2Preview._layouts)) {
      document.body.innerHTML = '<div id="slide-canvas"></div>';
      canvas = document.getElementById('slide-canvas')!;
      const data = slideSpec();
      data.v2.layout.name = name;
      expect(() => render(data), name).not.toThrow();
      expect(canvas.childNodes.length, name).toBeGreaterThan(0);
    }
  });

  it('falls back to a generic layout for an unknown name', () => {
    const data = slideSpec();
    data.v2.layout.name = 'invented_later';
    expect(render(data)).toBe('concept_hero_split');
    expect(text()).toContain('What is Photosynthesis?');
  });

  it('renders the process connectors as arrows', () => {
    const data = slideSpec();
    data.v2.slideType = 'process';
    data.v2.layout.name = 'process_steps';
    (data.v2.layout.regions as any).connector_0 =
      { x: 0.261, y: 0.733, w: 0.022, h: 0.05 };
    render(data);
    // The reserved connector gap is taller than it is wide, so the arrow
    // points down the way the backend laid the steps out.
    expect(text()).toContain('▼');
  });
});

describe('primitives', () => {
  it('renders the badge, title, subtitle and cards', () => {
    render(slideSpec());
    const body = text();
    expect(body).toContain('CLASS 8 • SCIENCE • CBSE');
    expect(body).toContain('What is Photosynthesis?');
    expect(body).toContain('Plants make their own food');
    expect(body).toContain('Sunlight');
    expect(body).toContain('Water');
  });

  it('numbers the cards', () => {
    render(slideSpec());
    expect(text()).toContain('01');
  });

  it('marks the emphasised title words as their own styled run', () => {
    render(slideSpec());
    const strongs = Array.from(canvas.querySelectorAll('strong'))
      .map(s => s.textContent);
    expect(strongs).toContain('Photosynthesis');
  });

  it('marks highlighted terms inside card bodies', () => {
    render(slideSpec());
    const strongs = Array.from(canvas.querySelectorAll('strong'))
      .map(s => s.textContent);
    expect(strongs).toContain('chlorophyll');
  });

  it('renders the decorative element at low opacity so it never competes', () => {
    render(slideSpec());
    const decor = nodes().filter(el => parseFloat(el.style.opacity || '1') < 0.2);
    expect(decor.length).toBeGreaterThan(0);
  });

  it('renders the slide number', () => {
    render(slideSpec());
    expect(text()).toContain('1');
  });
});

describe('images', () => {
  it('renders the image and never distorts it', () => {
    render(slideSpec());
    const img = canvas.querySelector('img')!;
    expect(img).toBeTruthy();
    expect(['contain', 'cover']).toContain(img.style.objectFit);
  });

  it('contains a diagram so its labels survive', () => {
    const data = slideSpec();
    data.v2.visual.resolvedStrategy = 'programmatic_diagram';
    render(data);
    expect(canvas.querySelector('img')!.style.objectFit).toBe('contain');
  });

  it('covers a plain photograph', () => {
    const data = slideSpec();
    data.v2.visual.resolvedStrategy = 'searched_image';
    data.v2.slideType = 'concept';
    data.v2.visual.annotations = [];
    render(data);
    expect(canvas.querySelector('img')!.style.objectFit).toBe('cover');
  });

  it('agrees with the export on the fit mode', () => {
    for (const strategy of ['programmatic_diagram', 'ai_generated_image', 'searched_image']) {
      document.body.innerHTML = '<div id="slide-canvas"></div>';
      canvas = document.getElementById('slide-canvas')!;
      const data = slideSpec();
      data.v2.visual.resolvedStrategy = strategy;
      data.v2.visual.annotations = [];
      data.v2.slideType = 'concept';
      render(data);
      const previewFit = canvas.querySelector('img')!.style.objectFit;

      const exportCalls: any[] = [];
      const fakeSlide = {
        addShape: () => {}, addText: () => {},
        addImage: (o: any) => exportCalls.push(o), addNotes: () => {},
        background: null,
      };
      const fakePptx = { shapes: new Proxy({}, { get: (_t, k) => String(k) }) };
      PPTV2.renderSlide(fakeSlide, fakePptx, data, {});
      expect(exportCalls[0].sizing.type, strategy).toBe(previewFit);
    }
  });

  it('a missing image costs the image, never the slide', () => {
    const data = slideSpec();
    data.v2.visual.base64 = '';
    data.v2.visual.url = '';
    data.imageBase64 = '';
    expect(() => render(data)).not.toThrow();
    expect(text()).toContain('What is Photosynthesis?');
  });

  it('a broken image shows its alt text instead of an empty frame', () => {
    render(slideSpec());
    const img = canvas.querySelector('img')!;
    img.onerror!(new Event('error'));
    expect(text()).toContain('a green leaf');
  });
});

describe('annotations', () => {
  function annotated() {
    const data = slideSpec();
    data.v2.visual.resolvedStrategy = 'ai_generated_image';
    data.v2.visual.annotations = [
      { text: 'Upper surface', anchor: [0.5, 0.12], leader: true, side: 'auto' },
      { text: 'Stomata', anchor: [0.9, 0.5], leader: true, side: 'auto' },
      { text: 'Xylem', anchor: [0.12, 0.88], leader: true, side: 'auto' },
    ];
    return data;
  }

  it('renders each annotation as text with a leader line', () => {
    render(annotated());
    const body = text();
    expect(body).toContain('Upper surface');
    expect(body).toContain('Stomata');
    expect(canvas.querySelectorAll('svg line').length).toBe(3);
  });

  it('keeps chips inside the picture, not merely inside the canvas', () => {
    render(annotated());
    const chips = nodes().filter(el => ['Upper surface', 'Stomata', 'Xylem']
      .includes((el.textContent || '').trim()) && el.style.position === 'absolute');
    expect(chips.length).toBe(3);
    for (const chip of chips) {
      const left = parseFloat(chip.style.left);
      const top = parseFloat(chip.style.top);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left).toBeLessThanOrEqual(100);
      expect(top).toBeLessThanOrEqual(100);
    }
  });

  it('does not let a chip clip its own text', () => {
    // A fixed-width chip cut "Stomata" down to "nata" in the first render.
    render(annotated());
    const chip = nodes().find(el => (el.textContent || '').trim() === 'Stomata')!;
    expect(chip.style.width).toBe('auto');
    expect(chip.style.textOverflow).toBe('ellipsis');
  });

  it('steps a colliding chip clear of the one already placed', () => {
    const data = annotated();
    // Two anchors at the same height: "O₂" landed across "Stomata" before.
    data.v2.visual.annotations = [
      { text: 'First', anchor: [0.8, 0.5], leader: true, side: 'right' },
      { text: 'Second', anchor: [0.82, 0.5], leader: true, side: 'right' },
    ];
    render(data);
    const tops = ['First', 'Second'].map(t =>
      parseFloat(nodes().find(el => (el.textContent || '').trim() === t)!.style.top));
    expect(Math.abs(tops[0] - tops[1])).toBeGreaterThan(1);
  });

  it('is skipped on anything that labels itself', () => {
    // A searched figure arrives with labels in the pixels; a programmatic
    // diagram draws its own from its spec. Only a generated image is bare.
    for (const strategy of ['searched_image', 'programmatic_diagram', 'icon_composition']) {
      document.body.innerHTML = '<div id="slide-canvas"></div>';
      canvas = document.getElementById('slide-canvas')!;
      const data = annotated();
      data.v2.visual.resolvedStrategy = strategy;
      render(data);
      expect(text(), strategy).not.toContain('Stomata');
    }
  });

  it('survives a malformed anchor', () => {
    const data = annotated();
    data.v2.visual.annotations = [{ text: 'Odd', anchor: null, leader: true, side: 'auto' } as any];
    expect(() => render(data)).not.toThrow();
    expect(text()).toContain('Odd');
  });
});

describe('icon composition', () => {
  function iconic(slideType = 'concept') {
    const data = slideSpec();
    data.v2.slideType = slideType;
    data.v2.visual.base64 = '';
    data.v2.visual.url = '';
    data.imageBase64 = '';
    data.v2.visual.resolvedStrategy = 'icon_composition';
    return data;
  }

  it('draws glyphs instead of an empty frame', () => {
    render(iconic());
    expect(text()).toContain('☀');
    expect(text()).toContain('H₂O');
  });

  it('resolves a subscripted icon name', () => {
    // "CO₂" fell back to a bare "C" before the key was normalised.
    const data = iconic();
    data.v2.visual.icons = ['CO₂'];
    render(data);
    expect(text()).toContain('CO₂');
  });

  it('gives every disc the same size whatever the glyph length', () => {
    // Sizing the disc and the glyph on one element made "C₆H₁₂O₆" a visibly
    // smaller circle, out of line with its neighbours.
    const data = iconic();
    data.v2.visual.icons = ['sun', 'glucose'];
    render(data);
    const discs = nodes().filter(el => el.style.borderRadius === '50%'
      && el.style.width === '3.2em');
    expect(discs.length).toBe(2);
    expect(new Set(discs.map(d => d.style.fontSize)).size).toBe(1);
  });

  it('uses the step icons on a process slide, not the picture objects', () => {
    // visual.icons describes the picture; on a process slide the steps are
    // the sequence, which is what the row should show - each step's symbol,
    // captioned with the step's own name rather than its icon key.
    const data = iconic('process');
    data.v2.visual.icons = ['leaf outline', 'chloroplast'];
    data.v2.contentBlocks[0].icon = 'sun';
    data.v2.contentBlocks[1].icon = 'oxygen';
    render(data);
    const body = text();
    expect(body).toContain('☀');
    expect(body).toContain('O₂');
    expect(body).toContain(data.v2.contentBlocks[0].label);
    expect(body).not.toContain('leaf outline');
  });

  it('numbers the discs when a name has no symbol, on an ordered slide', () => {
    // A Light slide whose steps were "arrow", "arrow", "mirror" rendered as
    // "A", "A", "M" — two identical circles carrying no information.
    const data = iconic('process');
    data.v2.visual.icons = [];
    data.v2.contentBlocks[0].icon = 'arrow';
    data.v2.contentBlocks[1].icon = 'mirror';
    render(data);
    const body = text();
    expect(body).toContain('1');
    expect(body).toContain('2');
  });

  it('never shows the same disc twice', () => {
    // Off a sequence, repeated objects collapse to one disc ("O2", "oxygen").
    const set = iconic();
    set.v2.visual.icons = ['oxygen', 'O2'];
    render(set);
    const discs = () => nodes().filter(el => el.style.width === '3.2em'
      && el.style.borderRadius === '50%');
    expect(discs().length).toBe(1);
    // On a sequence each step keeps its disc, numbered, so two "arrow"
    // steps are 1 and 2 - never two identical circles.
    canvas.innerHTML = '';
    const steps = iconic('process');
    steps.v2.visual.icons = [];
    steps.v2.contentBlocks[0].icon = 'arrow';
    steps.v2.contentBlocks[1].icon = 'Arrow';
    steps.v2.contentBlocks[0].label = 'Mirror';   // no symbol of their own
    steps.v2.contentBlocks[1].label = 'Prism';
    render(steps);
    expect(discs().map(d => d.textContent)).toEqual(['1', '2']);
  });

  it('draws nothing rather than an empty frame when there is nothing to show', () => {
    const data = iconic();
    data.v2.visual.icons = [];
    data.v2.contentBlocks = [];
    render(data);
    expect(canvas.querySelectorAll('img').length).toBe(0);
  });
});

describe('robustness', () => {
  it('renders with no theme', () => {
    const data = slideSpec();
    delete (data.v2 as any).theme;
    expect(() => render(data)).not.toThrow();
  });

  it('renders a gradient background with a solid colour underneath it', () => {
    // jsdom's CSS engine discards gradient values, so the gradient string
    // itself is checked in the browser pass, not here. What is checkable —
    // and what matters if the gradient is ever unsupported — is that the
    // fallback colour is set rather than left blank.
    const data = slideSpec();
    data.v2.theme = { ...THEME, background: 'gradient:primary->accent' };
    render(data);
    expect(canvas.style.backgroundColor).toBe('rgb(27, 122, 75)');
  });

  it('renders a flat background as the surface colour', () => {
    render(slideSpec());
    expect(canvas.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('renders with no blocks, no subtitle and no image', () => {
    const data = slideSpec();
    data.v2.contentBlocks = [];
    data.v2.subtitle = '';
    data.v2.visual.base64 = '';
    data.imageBase64 = '';
    expect(() => render(data)).not.toThrow();
    expect(text()).toContain('What is Photosynthesis?');
  });

  it('resolves every subject theme', () => {
    for (const [name, primary] of Object.entries({
      biology: '1B7A4B', physics: '1E4FA3', chemistry: '5B3FB5',
      mathematics: '1E4FA3', history: '8A4B2A', geography: '136F63',
    })) {
      const theme = { ...THEME, name, colors: { ...THEME.colors, primary: '#' + primary } };
      expect(PPTV2Preview._hex(theme, 'primary')).toBe('#' + primary);
    }
  });
});

describe('picture mat', () => {
  // A dark studio theme sends image_mat white: figures drawn for a white page
  // (transparent PNGs with dark labels) otherwise lose their labels.
  const frameOf = () => canvas.querySelector('img')!.parentElement!.style.background;
  const DARK = { ...THEME, colors: { ...THEME.colors, surface: '#1A1A2E',
                                       surface_alt: '#16213E', image_mat: '#FFFFFF' } };

  it('frames the picture on the theme mat', () => {
    const data = slideSpec();
    data.v2.theme = DARK;
    render(data);
    expect(frameOf()).toBe('rgb(255, 255, 255)');
  });

  it('a deck saved before the mat existed keeps its panel colour', () => {
    render(slideSpec());
    expect(frameOf()).toBe('rgb(244, 246, 248)');            // surface_alt
  });

  it('the export frames it the same way', () => {
    const fills: string[] = [];
    const fakeSlide = {
      addShape: (_s: any, o: any) => { if (o && o.fill) fills.push(o.fill.color); },
      addText: () => {}, addImage: () => {}, addNotes: () => {}, background: null,
    };
    const fakePptx = { shapes: new Proxy({}, { get: (_t, k) => String(k) }) };
    const data = slideSpec();
    data.v2.theme = DARK;
    PPTV2.renderSlide(fakeSlide, fakePptx, data, {});
    expect(fills).toContain('FFFFFF');
    expect(fills).not.toContain('16213E');
  });
});
