/* ============================================================
 * pptV2.js — V2 infographic renderer
 *
 * Draws a slide from its V2 specification (slide.v2) instead of from the
 * flat title/bullets/image fields V1 uses. It is a separate file, and
 * pptExport.js calls into it with a four-line guard, so that:
 *
 *   - V1 rendering is literally untouched and can be compared side by side;
 *   - a bug in here falls back to V1 rather than losing the teacher's deck;
 *   - pptExport.js (1848 lines) does not grow another design system.
 *
 * Everything the backend sends is normalised: regions are 0..1 rectangles,
 * colours are token names, type sizes are points on a 13.33in reference
 * slide. This file is the one place any of that is converted into the
 * inches and hex values PptxGenJS wants.
 *
 * Canvas: 10" x 5.625" (LAYOUT_16x9), matching pptExport.js.
 * ============================================================ */

window.PPTV2 = {

  SLIDE_W: 10,
  SLIDE_H: 5.625,

  /* The backend sizes type against a 13.333in slide (the other common 16:9
   * size). Points are absolute, so 32pt on a 10in slide covers a third more
   * of the slide than 32pt on a 13.33in one — the deck would come out
   * shouting. Scaling here keeps the rendered proportions identical to the
   * ones the backend's layout and overflow model assume. */
  PT_SCALE: 10 / 13.3333,

  MIN_PT: 8,

  // ══════════════════════════════════════════════════════════
  //  GEOMETRY  — normalised 0..1 -> inches, in one place only
  // ══════════════════════════════════════════════════════════

  _box(region) {
    if (!region) return null;
    return {
      x: (+region.x || 0) * this.SLIDE_W,
      y: (+region.y || 0) * this.SLIDE_H,
      w: (+region.w || 0) * this.SLIDE_W,
      h: (+region.h || 0) * this.SLIDE_H,
    };
  },

  _region(v2, name) { return this._box((v2.layout && v2.layout.regions) ? v2.layout.regions[name] : null); },

  _inset(box, pad) {
    const p = pad == null ? 0.12 : pad;
    return { x: box.x + p, y: box.y + p, w: Math.max(box.w - 2 * p, 0.05),
             h: Math.max(box.h - 2 * p, 0.05) };
  },

  /* Keep a box on the slide. Geometry arrives validated, but an annotation
   * label is positioned from an anchor at render time and can legitimately
   * compute to something off-canvas near an edge. */
  _clamp(box) {
    const w = Math.min(box.w, this.SLIDE_W);
    const h = Math.min(box.h, this.SLIDE_H);
    return {
      w: w, h: h,
      x: Math.min(Math.max(box.x, 0), this.SLIDE_W - w),
      y: Math.min(Math.max(box.y, 0), this.SLIDE_H - h),
    };
  },

  // ══════════════════════════════════════════════════════════
  //  THEME + TYPOGRAPHY  — tokens in, real values out
  // ══════════════════════════════════════════════════════════

  _FALLBACK_COLORS: {
    ink: '111827', ink_muted: '4B5563', heading: '1F3A5F', on_primary: 'FFFFFF',
    on_accent: 'FFFFFF', surface: 'FFFFFF', surface_alt: 'F4F6F8',
    border: 'D8DEE6', primary: '1F3A5F', primary_soft: 'EAEEF4',
    accent: '0F766E', accent_soft: 'E3F2F0',
  },

  /* PptxGenJS wants bare hex with no leading '#'. */
  _color(theme, token, fallbackToken) {
    const colors = (theme && theme.colors) || {};
    let value = colors[token] || colors[fallbackToken]
      || this._FALLBACK_COLORS[token] || this._FALLBACK_COLORS[fallbackToken];
    if (!value) value = '111827';
    return String(value).replace('#', '').toUpperCase();
  },

  _font(theme, role) {
    const fonts = (theme && theme.fonts) || {};
    return fonts[role] || fonts.body || 'Segoe UI';
  },

  /* Type sizes come from one scale so no component invents its own. */
  _pt(theme, role, fallback) {
    const sizes = (theme && theme.sizes) || {};
    const base = sizes[role] != null ? sizes[role] : (fallback != null ? fallback : 17);
    return Math.max(this.MIN_PT, Math.round(base * this.PT_SCALE * 10) / 10);
  },

  /* Shrink type to fit rather than letting it spill.
   * Mirrors the backend's capacity model (chars ~ w*h*2868 at 17pt on a
   * 13.33in slide), rearranged to solve for the size that fits. Bounded by
   * MIN_PT: below that it is unreadable, and truncation is the honest
   * fallback instead. */
  _fitPt(text, box, startPt, safety) {
    const chars = String(text || '').length;
    if (!chars) return startPt;
    // A safety factor, because the estimate has no font metrics and the
    // export cannot measure. Rasterising the deck showed every process card
    // truncated with an ellipsis where the preview - which does measure -
    // fitted the same sentence whole. Aiming a little smaller costs a point
    // of size and saves the end of the sentence.
    const margin = safety == null ? 0.82 : safety;
    const areaRef = (box.w / this.SLIDE_W) * (box.h / this.SLIDE_H);
    const capacity = areaRef * 2868 * margin
      * Math.pow(17 / (startPt / this.PT_SCALE), 2);
    if (chars <= capacity) return startPt;
    const scaled = startPt * Math.sqrt(capacity / chars);
    return Math.max(this.MIN_PT, Math.round(scaled * 10) / 10);
  },

  _truncate(text, box, pt) {
    const t = String(text || '');
    const areaRef = (box.w / this.SLIDE_W) * (box.h / this.SLIDE_H);
    // Deliberately NOT the _fitPt safety factor: trimming is the last resort
    // and should only fire on text that genuinely cannot fit at this size.
    const capacity = Math.floor(areaRef * 2868 * Math.pow(17 / (pt / this.PT_SCALE), 2));
    if (t.length <= capacity || capacity < 12) return t;
    return t.slice(0, capacity - 1).replace(/\s+\S*$/, '') + '…';
  },

  // ══════════════════════════════════════════════════════════
  //  RICH TEXT  — emphasis and highlighted terms
  // ══════════════════════════════════════════════════════════

  _escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); },

  /* Split `text` so the listed terms become their own runs, which the
   * caller then styles. This is what turns "Plants make their own FOOD"
   * into a line with one word carrying the accent colour, rather than a
   * uniform grey sentence. */
  _runs(text, terms, baseStyle, markStyle) {
    const src = String(text || '');
    const list = (terms || []).map(t => String(t || '').trim()).filter(Boolean)
      .sort((a, b) => b.length - a.length);
    if (!list.length) return [{ text: src, options: baseStyle }];

    const re = new RegExp('(' + list.map(t => this._escapeRe(t)).join('|') + ')', 'ig');
    const out = [];
    let last = 0, m;
    while ((m = re.exec(src)) !== null) {
      if (m.index > last) out.push({ text: src.slice(last, m.index), options: baseStyle });
      out.push({ text: m[0], options: markStyle });
      last = m.index + m[0].length;
      if (re.lastIndex === m.index) re.lastIndex++;   // zero-width guard
    }
    if (last < src.length) out.push({ text: src.slice(last), options: baseStyle });
    return out.length ? out : [{ text: src, options: baseStyle }];
  },

  // ══════════════════════════════════════════════════════════
  //  PRIMITIVES  — the layouts compose these, nothing else
  // ══════════════════════════════════════════════════════════

  _roundRect(slide, pptx, box, fill, opts) {
    const o = opts || {};
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: box.x, y: box.y, w: box.w, h: box.h,
      fill: { color: fill, transparency: o.transparency || 0 },
      line: o.line || { color: fill, transparency: o.transparency || 0 },
      rectRadius: o.radius == null ? 0.08 : o.radius,
      shadow: o.shadow || undefined,
    });
  },

  /* An information card: tinted panel, optional number, label, body. */
  _card(slide, pptx, theme, box, spec) {
    const s = spec || {};
    const tint = s.tint || this._color(theme, 'primary_soft');
    const accent = s.accent || this._color(theme, 'primary');
    box = this._clamp(box);

    this._roundRect(slide, pptx, box, tint, {
      radius: 0.06,
      line: { color: this._color(theme, 'border'), width: 0.5 },
    });
    // Accent spine: cheap, and it gives a flat tinted box a direction.
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: box.x, y: box.y + 0.06, w: 0.045, h: Math.max(box.h - 0.12, 0.08),
      fill: { color: accent }, line: { color: accent },
    });

    const pad = 0.14;
    const fullW = box.w - pad * 2 - 0.05;
    let cursorX = box.x + pad + 0.05;
    let availW = fullW;
    const topY = box.y + pad * 0.7;
    let y = topY;
    let stacked = false;

    if (s.number) {
      const d = Math.min(0.34, box.h * 0.32);
      // In a narrow card the marker beside the label leaves too little room
      // and the label truncates ("3. Carbon Dioxide…"). Stack it instead.
      stacked = (fullW - d - 0.1) < 1.6;
      slide.addShape(pptx.shapes.OVAL, {
        x: cursorX, y: topY, w: d, h: d,
        fill: { color: accent }, line: { color: accent },
      });
      slide.addText(String(s.number), {
        x: cursorX, y: topY, w: d, h: d,
        align: 'center', valign: 'middle',
        // margin 0: PowerPoint's default text inset (~0.1in a side) left a
        // 0.34in disc with too little room for two digits, so "02" and "03"
        // wrapped to two lines inside the circle. The preview, with no such
        // inset, showed them correctly - a parity defect visible only once
        // the deck was rasterised.
        margin: 0, wrap: false,
        fontSize: this._pt(theme, 'caption', 13), bold: true,
        color: this._color(theme, 'on_primary'), fontFace: this._font(theme, 'heading'),
      });
      if (stacked) {
        y = topY + d + 0.04;
      } else {
        cursorX += d + 0.1;
        availW -= d + 0.1;
      }
    }

    const label = this.displayLabel(s.label, !!s.number);
    if (label) {
      const labelPt = this._pt(theme, 'caption', 13) + 1;
      slide.addText(this._truncate(label, { w: availW, h: 0.26 }, labelPt), {
        x: cursorX, y: y, w: availW, h: 0.26,
        fontSize: labelPt, bold: true, color: accent,
        fontFace: this._font(theme, 'heading'), valign: 'middle',
      });
      y += 0.27;
    }

    if (s.text) {
      // A numbered card with no label - a quiz option - puts its text beside
      // the badge. Starting it at the card edge printed the badge "A" on top
      // of "Alveoli".
      const beside = !!s.number && !label && !stacked;
      const bodyBox = { x: beside ? cursorX : box.x + pad + 0.05, y: y,
                        w: beside ? availW : box.w - pad * 2 - 0.05,
                        h: Math.max(box.y + box.h - pad * 0.7 - y, 0.18) };
      const pt = this._fitPt(s.text, bodyBox, this._pt(theme, 'body', 17) - 1);
      slide.addText(
        this._runs(this._truncate(s.text, bodyBox, pt), s.terms,
                   { fontSize: pt, color: this._color(theme, 'ink'),
                     fontFace: this._font(theme, 'body') },
                   { fontSize: pt, bold: true, color: accent,
                     fontFace: this._font(theme, 'body') }),
        // Centred like the preview: the backend sizes a card to its region,
        // so a two-word card is as tall as a five-line one and top-aligning
        // stranded the text above a void.
        { x: bodyBox.x, y: bodyBox.y, w: bodyBox.w, h: bodyBox.h,
          valign: 'middle', lineSpacingMultiple: 0.92 });
    }
  },

  /* Small uppercase category pill. */
  _badge(slide, pptx, theme, box, text) {
    if (!text) return;
    const fill = this._color(theme, 'accent');
    const b = this._clamp({ x: box.x, y: box.y, w: Math.min(box.w, 3.4), h: 0.26 });
    this._roundRect(slide, pptx, b, fill, { radius: 0.13 });
    slide.addText(String(text).toUpperCase(), {
      x: b.x + 0.1, y: b.y, w: b.w - 0.2, h: b.h,
      fontSize: Math.max(this.MIN_PT, this._pt(theme, 'footer', 10)),
      bold: true, charSpacing: 1.2,
      color: this._color(theme, 'on_accent'),
      fontFace: this._font(theme, 'heading'), valign: 'middle',
    });
  },

  /* Keep a box inside a parent box (not merely inside the slide). */
  _confine(box, parent) {
    const w = Math.min(box.w, parent.w);
    const h = Math.min(box.h, parent.h);
    return {
      w: w, h: h,
      x: Math.min(Math.max(box.x, parent.x), parent.x + parent.w - w),
      y: Math.min(Math.max(box.y, parent.y), parent.y + parent.h - h),
    };
  },

  /* A label pinned to a point on the visual, with a leader line.
   *
   * `anchor` is normalised inside the visual region, so labels are placed and
   * confined against that region, never merely against the slide. The first
   * build placed them outside it: "Sunlight" landed on top of the content
   * cards and "Stomata" ran to the slide edge. Labels now overlay the picture
   * — which is also how a real infographic labels a figure — and the leader
   * runs from the chip to the anchor.
   */
  _annotation(slide, pptx, theme, visualBox, ann) {
    const nx = +(ann.anchor && ann.anchor[0]);
    const ny = +(ann.anchor && ann.anchor[1]);
    const ax = visualBox.x + (isNaN(nx) ? 0.5 : nx) * visualBox.w;
    const ay = visualBox.y + (isNaN(ny) ? 0.5 : ny) * visualBox.h;

    // The backend places labels once (core/ppt_v2/labels.py) so both
    // renderers draw the same arrangement and neither has to solve collision
    // avoidance again. Phase 7 showed what happens when nobody does: two
    // labels printed over each other.
    if (ann.box && ann.box.length === 4) {
      const b = {
        x: visualBox.x + ann.box[0] * visualBox.w,
        y: visualBox.y + ann.box[1] * visualBox.h,
        w: ann.box[2] * visualBox.w,
        h: ann.box[3] * visualBox.h,
      };
      this._annotationAt(slide, pptx, theme, b, ax, ay, ann);
      return;
    }

    const lw = Math.min(1.25, visualBox.w * 0.42), lh = 0.24;
    const gap = 0.26;

    // Offset towards the nearer edge so the chip does not sit on the subject,
    // then confine to the picture so it cannot escape onto its neighbours.
    let side = ann.side && ann.side !== 'auto' ? ann.side : null;
    if (!side) side = (ax - visualBox.x) < visualBox.w / 2 ? 'left' : 'right';

    let lx, ly = ay - lh / 2;
    if (side === 'left')       { lx = ax - gap - lw; }
    else if (side === 'right') { lx = ax + gap; }
    else if (side === 'top')   { lx = ax - lw / 2; ly = ay - gap - lh; }
    else                       { lx = ax - lw / 2; ly = ay + gap; }

    const label = this._confine({ x: lx, y: ly, w: lw, h: lh }, visualBox);
    this._annotationAt(slide, pptx, theme, label, ax, ay, ann);
  },

  /** Draw one annotation chip and its leader at a known box. */
  _annotationAt(slide, pptx, theme, label, ax, ay, ann) {
    const accent = this._color(theme, 'accent');

    if (ann.leader !== false) {
      const cx = label.x + label.w / 2, cy = label.y + label.h / 2;
      // Start the leader at the chip edge facing the anchor.
      const from = {
        x: ax > cx ? label.x + label.w : ax < cx ? label.x : cx,
        y: ay > cy ? label.y + label.h : ay < cy ? label.y : cy,
      };
      const w = Math.abs(ax - from.x), h = Math.abs(ay - from.y);
      // A zero-width or zero-height LINE is a degenerate shape; give it a
      // hairline so PowerPoint draws a real segment.
      if (w > 0.02 || h > 0.02) {
        slide.addShape(pptx.shapes.LINE, {
          x: Math.min(from.x, ax), y: Math.min(from.y, ay),
          w: Math.max(w, 0.01), h: Math.max(h, 0.01),
          line: { color: accent, width: 1, endArrowType: 'triangle' },
          flipH: ax < from.x, flipV: ay < from.y,
        });
      }
      slide.addShape(pptx.shapes.OVAL, {
        x: ax - 0.045, y: ay - 0.045, w: 0.09, h: 0.09,
        fill: { color: accent }, line: { color: this._color(theme, 'surface'), width: 1 },
      });
    }

    // Near-opaque so the label stays legible over a busy photograph.
    this._roundRect(slide, pptx, label, this._color(theme, 'surface'), {
      radius: 0.1, transparency: 8,
      line: { color: accent, width: 1 },
    });
    slide.addText(this._truncate(ann.text, label, this._pt(theme, 'annotation', 12)), {
      x: label.x + 0.04, y: label.y, w: label.w - 0.08, h: label.h,
      fontSize: this._pt(theme, 'annotation', 12), bold: true,
      color: this._color(theme, 'ink'), fontFace: this._font(theme, 'body'),
      align: 'center', valign: 'middle',
    });
  },

  /* The ICON_COMPOSITION strategy: shapes, because no picture was obtained
   * or none was wanted. The first build drew the frame and stopped, leaving
   * a large empty grey panel — worse than no visual at all. */
  /* Glyphs are kept to the Basic Multilingual Plane and to chemistry
   * notation. Astral-plane emoji (💧, 🌿) depend on an emoji font being
   * installed and present as empty boxes when it is not — which on a
   * school projector is worse than no icon. Formulae also happen to be the
   * more appropriate label for a science deck. */
  _ICON_GLYPH: {
    sun: '☀', sunlight: '☀', light: '☀', solar: '☀',
    water: 'H₂O', droplet: 'H₂O', rain: 'H₂O', moisture: 'H₂O',
    air: 'CO₂', co2: 'CO₂', carbon: 'CO₂', 'carbon dioxide': 'CO₂',
    oxygen: 'O₂', o2: 'O₂',
    sugar: 'C₆H₁₂O₆', glucose: 'C₆H₁₂O₆', food: 'C₆H₁₂O₆', starch: 'C₆H₁₂O₆',
    energy: '⚡', heat: '⚡', fire: '△',
    leaf: '❖', plant: '❖', tree: '❖', root: '❖', seed: '❖', stem: '❖',
    cell: '⬡', chloroplast: '⬡', chlorophyll: '⬡', stomata: '⬡',
  },

  /* A font that actually carries the symbol glyphs above. */
  _GLYPH_FONT: 'Segoe UI Symbol',

  /* Icon names arrive as the planner wrote them — "CO₂", "Water Droplet",
   * "carbon dioxide" — so the lookup key has to be normalised. Subscript and
   * superscript digits fold to ASCII, because a map keyed "co2" otherwise
   * misses "CO₂" entirely and falls back to the first letter: the live run
   * put a bare "C" in the carbon-dioxide circle. */
  _SUB_DIGITS: { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5',
                 '₆': '6', '₇': '7', '₈': '8', '₉': '9',
                 '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5',
                 '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' },

  _iconKey(raw) {
    return String(raw || '').toLowerCase().trim()
      .replace(/[₀-₉⁰-⁹]/g, ch => this._SUB_DIGITS[ch] || ch)
      .replace(/\s+/g, ' ');
  },

  /* The mapped glyph for an icon name, or '' when nothing matches. */
  glyphFor(raw) {
    const key = this._iconKey(raw);
    return this._ICON_GLYPH[key]
      || this._ICON_GLYPH[key.replace(/\s+/g, '')]
      || this._ICON_GLYPH[key.split(' ')[0]]
      || this._ICON_GLYPH[key.split(' ').pop()]
      || '';
  },

  /* What to put in the disc when the name has no symbol of its own.
   *
   * A bare initial was the old fallback and it is actively misleading: a
   * Light slide whose steps were "arrow", "arrow", "mirror" rendered as
   * "A", "A", "M" - two identical circles carrying no information. On an
   * ordered slide the step number is always meaningful and never wrong, so
   * that is the honest fallback; elsewhere the initial at least distinguishes
   * one disc from the next.
   */
  discGlyph(raw, index, slideType) {
    const mapped = this.glyphFor(raw);
    if (mapped) return mapped;
    if (slideType === 'process' || slideType === 'timeline') return String(index + 1);
    return String(raw).trim().charAt(0).toUpperCase();
  },

  /* Slide types whose icon row is an ordered chain. Only these get arrows:
   * the live Respiration deck drew "cell A > oxygen > carbon dioxide > water
   * > cell B" across a comparison slide and "glucose > oxygen > CO2" across
   * an equation - sequences that do not exist. */
  _SEQUENCE_TYPES: { process: true, timeline: true },

  /* A label as a card shows it. When the card already carries its number in
   * a badge, the planner's own numbering ("1. Inhalation") is dropped, or the
   * card reads "01  1. Inhalation". */
  displayLabel(label, numbered) {
    const text = String(label || '').trim();
    if (!numbered) return text;
    return text.replace(/^(?:step\s*)?\d{1,2}\s*[.):\-]\s*(?=\S)/i, '').trim() || text;
  },

  /* An icon key as words: "arrow_down" -> "arrow down". Words that name the
   * drawing rather than the thing ("energy symbol", "pathway diagram") are
   * dropped from the end - the disc already is the symbol. */
  _humanise(raw) {
    const words = String(raw || '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
    return words.replace(/\s+(?:symbol|icon|diagram|image|illustration|picture)$/i, '') || words;
  },

  /* What the icon row shows, decided once for both renderers.
   *
   * Returns { mode, items: [{ glyph, caption }] } where mode is
   *   'sequence' - the slide's own steps, numbered when no symbol fits,
   *                captioned with the step's name (never the icon key: the
   *                live deck captioned its steps "arrow_down", "arrow_up",
   *                "muscle"), joined by arrows;
   *   'versus'   - the two sides of a comparison, set against each other;
   *   'set'      - things involved, no order: only those with a real symbol,
   *                because a bare initial ("A", "A", "L") says nothing;
   *   'none'     - nothing worth drawing; the region is left clean.
   */
  iconRow(v2) {
    const type = v2.slideType;
    const blocks = v2.contentBlocks || [];

    if (type === 'comparison') {
      const sides = blocks.map(b => this.displayLabel(b.label, true))
        .filter(Boolean).slice(0, 2);
      return sides.length === 2
        ? { mode: 'versus', items: sides.map(c => ({ glyph: this.glyphFor(c), caption: c })) }
        : { mode: 'none', items: [] };
    }

    if (this._SEQUENCE_TYPES[type]) {
      const steps = blocks.filter(b => b.label || b.icon).slice(0, 5);
      if (steps.length >= 2) {
        return {
          mode: 'sequence',
          items: steps.map((b, i) => {
            const caption = this.displayLabel(b.label, true) || this._humanise(b.icon);
            return { glyph: this.glyphFor(b.icon) || this.glyphFor(caption) || String(i + 1),
                     caption };
          }),
        };
      }
    }

    const items = [];
    const seen = new Set();
    for (const raw of this.iconNames(v2)) {
      const glyph = this.glyphFor(raw);
      if (!glyph || seen.has(glyph)) continue;
      seen.add(glyph);
      items.push({ glyph, caption: this._humanise(raw) });
    }
    if (items.length) return { mode: 'set', items: items.slice(0, 5) };

    // Nothing has an honest symbol. The slide's own key terms are never
    // wrong, and a row of them reads as intended where a blank half-slide
    // (a live cause-and-effect slide) reads as a fault.
    const terms = [];
    for (const t of (v2.highlightedTerms || [])) {
      const term = String(t || '').trim();
      if (term && !terms.some(x => x.toLowerCase() === term.toLowerCase())) terms.push(term);
    }
    return terms.length >= 2
      ? { mode: 'terms', items: terms.slice(0, 4).map(t => ({ glyph: '', caption: t })) }
      : { mode: 'none', items: [] };
  },

  /* What the formula layout's band states: the equation, or - on a worked
   * example with none - the problem, which is the learning objective. Never
   * the first card: a live ATP-yield slide printed card 1 in the band and
   * again as card 1 below it. '' means draw no band. */
  equationText(v2) {
    const eq = (v2.contentBlocks || []).find(b => b.kind === 'equation');
    return String((eq && eq.text) || v2.learningObjective || '').trim();
  },

  /* WCAG relative luminance of a 6-digit hex colour. */
  _luminance(hex) {
    const h = String(hex || '').replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(h)) return 1;
    const ch = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255)
      .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  },

  contrast(a, b) {
    const la = this._luminance(a), lb = this._luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  },

  /* The colours a slide's background is painted in: one, or both ends of a
   * gradient. */
  _backgroundColors(theme) {
    const bg = (theme && theme.background) || 'surface';
    if (typeof bg === 'string' && bg.indexOf('gradient:') === 0) {
      return bg.slice(9).split('->').map(p => this._color(theme, (p || 'primary').trim()));
    }
    return [this._color(theme, bg, 'surface')];
  },

  /* Colour for an emphasised word in a title. The accent, unless it does not
   * read against the background: on the title slide's dark gradient the
   * accent blue put "Respiration" out of sight. Then the theme colour that
   * reads best, so the emphasis survives without inventing a colour. 3:1 is
   * the WCAG floor for large text. */
  titleMarkColor(theme) {
    const bgs = this._backgroundColors(theme);
    const worst = c => Math.min(...bgs.map(bg => this.contrast(c, bg)));
    const accent = this._color(theme, 'accent');
    if (worst(accent) >= 3) return accent;
    const options = ['accent_soft', 'primary_soft', 'on_primary', 'heading']
      .map(t => this._color(theme, t));
    return options.reduce((best, c) => (worst(c) > worst(best) ? c : best), options[0]);
  },

  /* Icon names, deduplicated. The planner repeats itself ("arrow", "arrow"),
   * and two identical discs in a row read as a rendering fault. */
  iconNames(v2) {
    const blocks = (v2.contentBlocks || []);
    const visual = v2.visual || {};
    const stepIcons = blocks.map(b => b.icon).filter(Boolean);
    const objectIcons = (visual.icons || []).filter(Boolean);
    const ordered = v2.slideType === 'process'
      ? [stepIcons, objectIcons] : [objectIcons, stepIcons];
    let names = ordered[0].length ? ordered[0] : ordered[1];
    if (!names.length) names = blocks.map(b => b.label).filter(Boolean);
    const seen = new Set();
    const out = [];
    for (const n of names) {
      const key = this._iconKey(n);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(n);
    }
    return out.slice(0, 5);
  },

  _iconComposition(slide, pptx, theme, box, v2) {
    const row = this.iconRow(v2);
    if (row.mode === 'none') return false;
    if (row.mode === 'versus') return this._versus(slide, pptx, theme, box, row.items);
    if (row.mode === 'terms') return this._termChips(slide, pptx, theme, box, row.items);
    const items = row.items;
    const arrows = row.mode === 'sequence';

    const gap = arrows ? 0.18 : 0.3;
    const captionPt = this._pt(theme, 'caption', 13);
    const captionH = 0.46;                     // two lines: captions wrap, never "glucos..."
    // A sequence stays on one row - its arrows read left to right. An
    // unordered set wraps instead of shrinking: five discs in the formula
    // slide's narrow column came out a quarter-inch wide, with "glucose"
    // broken across two lines under each.
    const MIN_CELL = 1.0;
    const perRow = arrows ? items.length
      : Math.max(1, Math.min(items.length, Math.floor((box.w + gap) / (MIN_CELL + gap))));
    const rows = Math.ceil(items.length / perRow);
    const rowH = box.h / rows;
    const cellW = (box.w - gap * (perRow - 1)) / perRow;
    const d = Math.max(0.3, Math.min(cellW * 0.52, rowH - captionH - 0.1, 0.95));

    items.forEach((item, i) => {
      const glyph = item.glyph;
      const r = Math.floor(i / perRow);
      const inRow = Math.min(perRow, items.length - r * perRow);
      // Centre a short last row rather than leaving it hanging left.
      const rowX = box.x + (box.w - (inRow * cellW + (inRow - 1) * gap)) / 2;
      const cx = rowX + (i % perRow) * (cellW + gap) + cellW / 2;
      const top = box.y + r * rowH + Math.max((rowH - d - captionH - 0.06) / 2, 0);
      const accent = this._cardAccent(theme, i);

      slide.addShape(pptx.shapes.OVAL, {
        x: cx - d / 2, y: top, w: d, h: d,
        fill: { color: this._cardTint(theme, i) },
        line: { color: accent, width: 1.5 },
      });
      // Long formulae need to come down in size or they spill the disc.
      const glyphPt = Math.max(this.MIN_PT,
                               Math.round(d * 26 * Math.min(1, 3 / Math.max(glyph.length, 1))));
      slide.addText(glyph, {
        x: cx - d / 2, y: top, w: d, h: d, align: 'center', valign: 'middle',
        margin: 0, fontSize: glyphPt, bold: true,
        color: accent, fontFace: this._GLYPH_FONT,
      });
      slide.addText(this._truncate(item.caption, { w: cellW, h: captionH }, captionPt), {
        x: cx - cellW / 2, y: top + d + 0.06, w: cellW, h: captionH,
        align: 'center', valign: 'top', margin: 0,
        fontSize: captionPt, bold: true,
        color: this._color(theme, 'ink'), fontFace: this._font(theme, 'body'),
      });

      if (arrows && i < items.length - 1) {
        const room = cellW + gap - d;
        const w = Math.min(Math.max(room * 0.45, 0.12), 0.42);
        this._arrow(slide, pptx, theme,
                    { x: cx + d / 2 + (room - w) / 2, y: top + d / 2 - 0.09, w: w, h: 0.18 },
                    'right');
      }
    });
    return true;
  },

  /* Key terms as a row of chips, two to a line when the region is narrow. */
  _termChips(slide, pptx, theme, box, items) {
    const gap = 0.25;
    const perRow = box.w >= 6 ? items.length : Math.min(2, items.length);
    const rows = Math.ceil(items.length / perRow);
    const chipH = Math.min(0.6, (box.h - gap * (rows - 1)) / rows);
    const chipW = (box.w - gap * (perRow - 1)) / perRow;
    const top = box.y + (box.h - (rows * chipH + (rows - 1) * gap)) / 2;
    const pt = this._pt(theme, 'caption', 13) + 3;
    items.forEach((item, i) => {
      const r = Math.floor(i / perRow), c = i % perRow;
      const x = box.x + c * (chipW + gap), y = top + r * (chipH + gap);
      const accent = this._cardAccent(theme, i);
      this._roundRect(slide, pptx, { x: x, y: y, w: chipW, h: chipH }, this._cardTint(theme, i), {
        radius: chipH / 2, line: { color: accent, width: 1.5 },
      });
      const inner = { w: chipW - 0.24, h: chipH };
      const fit = this._fitPt(item.caption, inner, pt);
      slide.addText(this._truncate(item.caption, inner, fit), {
        x: x + 0.12, y: y, w: inner.w, h: inner.h, align: 'center', valign: 'middle',
        margin: 0, fontSize: fit, bold: true, color: accent,
        fontFace: this._font(theme, 'heading'),
      });
    });
    return true;
  },

  /* A comparison's two sides set against each other: "Aerobic  VS  Anaerobic". */
  _versus(slide, pptx, theme, box, items) {
    const vs = Math.min(0.62, box.h * 0.7);
    const pillH = Math.min(0.62, box.h * 0.8);
    const pillW = (box.w - vs - 0.5) / 2;
    const y = box.y + (box.h - pillH) / 2;
    const pt = this._pt(theme, 'heading', 22);
    items.forEach((item, i) => {
      const x = i === 0 ? box.x : box.x + pillW + vs + 0.5;
      const accent = this._cardAccent(theme, i);
      this._roundRect(slide, pptx, { x: x, y: y, w: pillW, h: pillH }, this._cardTint(theme, i), {
        radius: pillH / 2, line: { color: accent, width: 1.5 },
      });
      const inner = { w: pillW - 0.3, h: pillH };
      const fit = this._fitPt(item.caption, inner, pt);
      slide.addText(this._truncate(item.caption, inner, fit), {
        x: x + 0.15, y: y, w: inner.w, h: inner.h, align: 'center', valign: 'middle',
        margin: 0, fontSize: fit, bold: true, color: accent,
        fontFace: this._font(theme, 'heading'),
      });
    });
    const cx = box.x + pillW + 0.25;
    const top = box.y + (box.h - vs) / 2;
    slide.addShape(pptx.shapes.OVAL, {
      x: cx, y: top, w: vs, h: vs,
      fill: { color: this._color(theme, 'heading') },
      line: { color: this._color(theme, 'heading') },
    });
    slide.addText('VS', {
      x: cx, y: top, w: vs, h: vs, align: 'center', valign: 'middle',
      margin: 0, fontSize: Math.max(this.MIN_PT, Math.round(vs * 22)), bold: true,
      color: this._color(theme, 'on_primary'), fontFace: this._font(theme, 'heading'),
    });
    return true;
  },

  _arrow(slide, pptx, theme, box, direction) {
    const shape = direction === 'down' ? pptx.shapes.DOWN_ARROW : pptx.shapes.RIGHT_ARROW;
    const c = this._color(theme, 'accent');
    const b = this._clamp(box);
    slide.addShape(shape, {
      x: b.x, y: b.y, w: b.w, h: b.h,
      fill: { color: c, transparency: 25 }, line: { color: c, transparency: 25 },
    });
  },

  _callout(slide, pptx, theme, box, text, terms) {
    if (!text) return;
    const b = this._clamp(box);
    const tint = this._color(theme, 'accent_soft');
    this._roundRect(slide, pptx, b, tint, {
      radius: 0.08, line: { color: this._color(theme, 'accent'), width: 1 },
    });
    const inner = this._inset(b, 0.12);
    const pt = this._fitPt(text, inner, this._pt(theme, 'body', 17) - 1);
    slide.addText(
      this._runs(this._truncate(text, inner, pt), terms,
                 { fontSize: pt, color: this._color(theme, 'ink'),
                   fontFace: this._font(theme, 'body') },
                 { fontSize: pt, bold: true, color: this._color(theme, 'accent'),
                   fontFace: this._font(theme, 'body') }),
      { x: inner.x, y: inner.y, w: inner.w, h: inner.h, valign: 'middle' });
  },

  /* Hero image: rounded frame behind, then the picture.
   * `contain` for anything diagram-like (cropping a labelled figure cuts off
   * the labels); `cover` for photographs, where filling the frame looks
   * deliberate and losing the edges does not cost information. */
  _heroImage(slide, pptx, theme, box, v2, helpers, data, opts) {
    const b = this._clamp(box);
    const visual = v2.visual || {};
    const bleed = !!(opts && opts.bleed);
    const diagramish = visual.resolvedStrategy === 'programmatic_diagram'
      || visual.resolvedStrategy === 'ai_generated_image'
      || (v2.slideType === 'anatomy')
      || (visual.annotations || []).length > 0;

    // A full-bleed cover image runs to the slide edge, so the framing panel
    // would show as bands above and below it.
    if (!bleed) {
      // White on dark themes (see `image_mat` in design.py); surface_alt
      // for decks saved before the token existed.
      this._roundRect(slide, pptx, b, this._color(theme, 'image_mat', 'surface_alt'), {
        radius: 0.08, line: { color: this._color(theme, 'border'), width: 1 },
      });
    }

    const inner = bleed ? b : this._inset(b, 0.07);
    const src = visual.base64 || data.imageBase64 || null;
    const url = visual.url || data.imageUrl || null;
    if (!src && !url) return false;

    try {
      const opts = { x: inner.x, y: inner.y, w: inner.w, h: inner.h,
                     sizing: { type: diagramish ? 'contain' : 'cover',
                               w: inner.w, h: inner.h } };
      if (src) opts.data = src; else opts.path = url;
      slide.addImage(opts);
      return true;
    } catch (e) {
      console.warn('V2 image error:', e);
      return false;
    }
  },

  /* Title with the idea-carrying words in the accent colour. */
  _title(slide, pptx, theme, box, titleSpec, role) {
    const spec = titleSpec || {};
    const text = spec.text || '';
    if (!text) return;
    const b = this._clamp(box);
    const pt = this._fitPt(text, b, this._pt(theme, role || 'title', 32));
    const base = { fontSize: pt, bold: true, color: this._color(theme, 'heading'),
                   fontFace: this._font(theme, 'heading') };
    const mark = Object.assign({}, base, { color: this.titleMarkColor(theme) });
    slide.addText(
      spec.emphasisText ? this._runs(text, [spec.emphasisText], base, mark)
                        : [{ text: text, options: base }],
      { x: b.x, y: b.y, w: b.w, h: b.h, valign: 'middle' });
  },

  _subtitle(slide, pptx, theme, box, text) {
    if (!text) return;
    const b = this._clamp(box);
    const pt = this._fitPt(text, b, this._pt(theme, 'subtitle', 20));
    slide.addText(this._truncate(text, b, pt), {
      x: b.x, y: b.y, w: b.w, h: b.h, fontSize: pt,
      color: this._color(theme, 'ink_muted'), fontFace: this._font(theme, 'body'),
      valign: 'middle',
    });
  },

  // ══════════════════════════════════════════════════════════
  //  BACKGROUND + DECORATION
  // ══════════════════════════════════════════════════════════

  /* The schema carries no decorative-element field, so decoration here is
   * derived from the theme rather than invented per slide: one soft corner
   * disc and one accent rule under the title. Enough to stop the slide
   * reading as a white page; not enough to compete with the content. */
  _background(slide, pptx, theme, v2) {
    const bg = (theme && theme.background) || 'surface';
    if (typeof bg === 'string' && bg.indexOf('gradient:') === 0) {
      const parts = bg.slice(9).split('->');
      const c1 = this._color(theme, (parts[0] || 'primary').trim());
      const c2 = this._color(theme, (parts[1] || 'accent').trim());
      slide.background = { color: c1 };
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: this.SLIDE_W, h: this.SLIDE_H,
        fill: { type: 'gradient', color: c1, color2: c2, angle: 135 },
        line: { color: c1 },
      });
      return;
    }
    slide.background = { color: this._color(theme, bg, 'surface') };

    slide.addShape(pptx.shapes.OVAL, {
      x: this.SLIDE_W - 1.15, y: -0.85, w: 2.0, h: 2.0,
      fill: { color: this._color(theme, 'primary'), transparency: 92 },
      line: { color: this._color(theme, 'primary'), transparency: 100 },
    });
  },

  _titleRule(slide, pptx, theme, titleBox) {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: titleBox.x, y: titleBox.y + titleBox.h - 0.02, w: 0.62, h: 0.045,
      fill: { color: this._color(theme, 'accent') },
      line: { color: this._color(theme, 'accent') },
    });
  },

  // ══════════════════════════════════════════════════════════
  //  LAYOUTS  — each one only arranges the primitives above
  // ══════════════════════════════════════════════════════════

  _blockBoxes(v2, prefix) {
    const regions = (v2.layout && v2.layout.regions) || {};
    const out = [];
    for (let i = 0; ; i++) {
      const r = regions[(prefix || 'block') + '_' + i];
      if (!r) break;
      out.push(this._box(r));
    }
    return out;
  },

  _cardTint(theme, index) {
    // Alternate the two theme tints so a column of cards has rhythm without
    // introducing colours the theme never declared.
    return index % 2 === 0 ? this._color(theme, 'primary_soft')
                           : this._color(theme, 'accent_soft');
  },

  _cardAccent(theme, index) {
    return index % 2 === 0 ? this._color(theme, 'primary') : this._color(theme, 'accent');
  },

  _renderBlocksAsCards(slide, pptx, theme, v2, boxes, opts) {
    const o = opts || {};
    const blocks = v2.contentBlocks || [];
    boxes.forEach((box, i) => {
      const b = blocks[i];
      if (!b) return;
      this._card(slide, pptx, theme, box, {
        number: o.numbered ? String(i + 1).padStart(2, '0') : (b.kind === 'step' ? String(i + 1) : ''),
        label: b.label || '',
        text: b.text || '',
        terms: v2.highlightedTerms || [],
        tint: this._cardTint(theme, i),
        accent: this._cardAccent(theme, i),
      });
    });
  },

  _renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data, regionName) {
    const box = this._region(v2, regionName || 'visual');
    if (!box) return;
    const visual = v2.visual || {};
    const hasImage = !!(visual.base64 || visual.url || data.imageBase64 || data.imageUrl);

    if (!hasImage) {
      // No picture: draw the shape composition instead of an empty frame.
      if (this._iconComposition(slide, pptx, theme, box, v2)) return;
      return;   // nothing to draw at all — leave the space clean, not boxed
    }

    this._heroImage(slide, pptx, theme, box, v2, helpers, data);
    // Annotations point at parts of a picture, so they need one — and one we
    // know is unlabelled. See annotationsAllowed.
    if (!this.annotationsAllowed(visual)) return;
    (visual.annotations || []).forEach(a => this._annotation(slide, pptx, theme, box, a));
  },

  _chrome(slide, pptx, theme, v2) {
    const titleBox = this._region(v2, 'title');
    if (titleBox) {
      // Category label sits above the title, inside the title band.
      if (v2.footer) {
        this._badge(slide, pptx, theme,
                    { x: titleBox.x, y: Math.max(titleBox.y - 0.30, 0.06), w: 3.4, h: 0.26 },
                    v2.footer);
      }
      this._title(slide, pptx, theme, titleBox, v2.title);
      this._titleRule(slide, pptx, theme, titleBox);
    }
    const subBox = this._region(v2, 'subtitle');
    if (subBox) this._subtitle(slide, pptx, theme, subBox, v2.subtitle);
  },

  _layouts: {

    concept_hero_split(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      const boxes = R._blockBoxes(v2);
      if (boxes.length) R._renderBlocksAsCards(slide, pptx, theme, v2, boxes, { numbered: true });
      else {
        const c = R._region(v2, 'content');
        if (c) R._callout(slide, pptx, theme, c,
                          (v2.contentBlocks || []).map(b => b.text).join('  '),
                          v2.highlightedTerms);
      }
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
    },

    process_steps(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      const boxes = R._blockBoxes(v2);
      R._renderBlocksAsCards(slide, pptx, theme, v2, boxes, { numbered: true });
      // Arrows live in the gaps the backend already reserved between steps.
      const regions = (v2.layout && v2.layout.regions) || {};
      for (let i = 0; regions['connector_' + i]; i++) {
        const box = R._box(regions['connector_' + i]);
        R._arrow(slide, pptx, theme, box, box.w >= box.h ? 'right' : 'down');
      }
    },

    comparison(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      R._renderBlocksAsCards(slide, pptx, theme, v2, R._blockBoxes(v2));
      const d = (v2.layout && v2.layout.regions || {}).divider;
      if (d) {
        const b = R._box(d);
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: b.x, y: b.y, w: Math.max(b.w, 0.02), h: b.h,
          fill: { color: R._color(theme, 'border') },
          line: { color: R._color(theme, 'border') },
        });
      }
    },

    cause_effect(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      R._renderBlocksAsCards(slide, pptx, theme, v2, R._blockBoxes(v2));
      const c = (v2.layout && v2.layout.regions || {}).connector_0;
      if (c) R._arrow(slide, pptx, theme, R._box(c), 'right');
    },

    anatomy_labeled(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      // Gutter labels either side of the figure.
      const regions = (v2.layout && v2.layout.regions) || {};
      const blocks = v2.contentBlocks || [];
      let i = 0;
      ['l', 'r'].forEach(side => {
        for (let k = 0; regions['label_' + side + '_' + k]; k++) {
          const b = blocks[i++];
          if (!b) return;
          R._card(slide, pptx, theme, R._box(regions['label_' + side + '_' + k]), {
            label: b.label || '', text: b.text || '',
            terms: v2.highlightedTerms || [],
            tint: R._cardTint(theme, i), accent: R._cardAccent(theme, i),
          });
        }
      });
    },

    magnification(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      const detail = R._region(v2, 'visual_detail');
      if (detail) {
        R._roundRect(slide, pptx, detail, R._color(theme, 'surface_alt'),
                     { radius: 0.08, line: { color: R._color(theme, 'accent'), width: 1.5 } });
      }
      const c = (v2.layout && v2.layout.regions || {}).connector_0;
      if (c) R._arrow(slide, pptx, theme, R._box(c), 'right');
      const content = R._region(v2, 'content');
      if (content) {
        R._callout(slide, pptx, theme, content,
                   (v2.contentBlocks || []).map(b => b.text).join('  '),
                   v2.highlightedTerms);
      }
    },

    timeline(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      const regions = (v2.layout && v2.layout.regions) || {};
      if (regions.axis) {
        const a = R._box(regions.axis);
        slide.addShape(pptx.shapes.RECTANGLE, {
          x: a.x, y: a.y, w: a.w, h: Math.max(a.h, 0.025),
          fill: { color: R._color(theme, 'primary') },
          line: { color: R._color(theme, 'primary') },
        });
      }
      R._renderBlocksAsCards(slide, pptx, theme, v2, R._blockBoxes(v2));
      const blocks = v2.contentBlocks || [];
      for (let i = 0; regions['label_' + i]; i++) {
        const b = blocks[i];
        if (!b) break;
        const lb = R._box(regions['label_' + i]);
        // Node on the axis, directly under each card.
        if (regions.axis) {
          const a = R._box(regions.axis);
          slide.addShape(pptx.shapes.OVAL, {
            x: lb.x + lb.w / 2 - 0.07, y: a.y - 0.05, w: 0.14, h: 0.14,
            fill: { color: R._color(theme, 'accent') },
            line: { color: R._color(theme, 'surface'), width: 1.5 },
          });
        }
        slide.addText(R._truncate(b.label || '', lb, R._pt(theme, 'caption', 13)), {
          x: lb.x, y: lb.y, w: lb.w, h: lb.h, align: 'center',
          fontSize: R._pt(theme, 'caption', 13), bold: true,
          color: R._color(theme, 'ink_muted'), fontFace: R._font(theme, 'body'),
        });
      }
    },

    formula_equation(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      const eq = R._region(v2, 'equation');
      const blocks = v2.contentBlocks || [];
      const equation = R.equationText(v2);
      if (eq && equation) {
        R._roundRect(slide, pptx, eq, R._color(theme, 'primary_soft'),
                     { radius: 0.1, line: { color: R._color(theme, 'primary'), width: 1 } });
        const inner = R._inset(eq, 0.1);
        const pt = R._fitPt(equation, inner, R._pt(theme, 'heading', 22));
        slide.addText(R._truncate(equation, inner, pt), {
          x: inner.x, y: inner.y, w: inner.w, h: inner.h,
          align: 'center', valign: 'middle', fontSize: pt, bold: true,
          color: R._color(theme, 'primary'), fontFace: R._font(theme, 'heading'),
        });
      }
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      const boxes = R._blockBoxes(v2);
      // The block shown in the equation band must not be repeated as a card.
      const rest = Object.assign({}, v2, {
        contentBlocks: blocks.filter(b => b.kind !== 'equation'),
      });
      if (boxes.length) R._renderBlocksAsCards(slide, pptx, theme, rest, boxes);
    },

    summary_grid(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      R._renderBlocksAsCards(slide, pptx, theme, v2, R._blockBoxes(v2), { numbered: true });
    },

    quiz(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._chrome(slide, pptx, theme, v2);
      const q = R._region(v2, 'question');
      const blocks = v2.contentBlocks || [];
      if (q) {
        const question = (blocks.find(b => b.kind === 'question') || {}).text
          || v2.subtitle || '';
        R._callout(slide, pptx, theme, q, question, v2.highlightedTerms);
      }
      R._renderVisualWithAnnotations(slide, pptx, theme, v2, helpers, data);
      const answers = blocks.filter(b => b.kind !== 'question');
      R._blockBoxes(v2).forEach((box, i) => {
        const b = answers[i];
        if (!b) return;
        R._card(slide, pptx, theme, box, {
          // The letter is the marker; passing it as the label too printed
          // "A  A" and squeezed the answer until its descenders clipped.
          number: String.fromCharCode(65 + i), label: '',
          text: b.text || b.label || '', terms: v2.highlightedTerms || [],
          // One style for every option. Alternating tints made option A green
          // and B blue, which on a quiz reads as "A is the right answer".
          tint: R._color(theme, 'surface_alt'), accent: R._color(theme, 'accent'),
        });
      });
    },

    title_hero(slide, pptx, theme, v2, helpers, data) {
      const R = window.PPTV2;
      R._background(slide, pptx, theme, v2);
      const t = R._region(v2, 'title');
      if (t) R._title(slide, pptx, theme, t, v2.title, 'display');
      const s = R._region(v2, 'subtitle');
      if (s) R._subtitle(slide, pptx, theme, s, v2.subtitle);
      const f = R._region(v2, 'footer');
      if (f && v2.footer) {
        slide.addText(String(v2.footer).toUpperCase(), {
          x: f.x, y: f.y, w: f.w, h: f.h, charSpacing: 1.2,
          fontSize: R._pt(theme, 'footer', 10), bold: true,
          color: R._color(theme, 'ink_muted'), fontFace: R._font(theme, 'heading'),
        });
      }
      const v = R._region(v2, 'visual');
      if (v) R._heroImage(slide, pptx, theme, v, v2, helpers, data, { bleed: true });
    },
  },

  // ══════════════════════════════════════════════════════════
  //  ENTRY POINT
  // ══════════════════════════════════════════════════════════

  /* Whether our own annotation chips should be drawn over this picture.
   *
   * Only over a GENERATED image. That is the one case where the picture is
   * known to be bare: the prompt explicitly forbids text, so our labels are
   * the only labels it will ever have.
   *
   * Everything else already labels itself:
   *   - a searched image is somebody else's figure and usually arrives with
   *     its labels baked into the pixels (chips over one of those hid the
   *     real labels behind worse duplicates);
   *   - a programmatic diagram is drawn by render_diagram from a spec that
   *     includes its own labels. This was originally allowed on the
   *     reasoning that "we authored it, so it is bare" — rasterising a
   *     process slide showed that is simply untrue, with our "Glucose" chip
   *     landing across the diagram's own "Glucose".
   */
  annotationsAllowed(visual) {
    const v = visual || {};
    // The producer that supplied the asset now says how the slide's labels
    // reach it - 'anchored' and 'legend' are ours to draw, 'native' means the
    // asset already carries them. Keying on the provider name alone is how a
    // rejected AI image fell back to a diagram that had been told "the
    // renderer will label you" and was then labelled by nobody.
    if (v.labelPolicy) {
      return v.labelPolicy === 'anchored' || v.labelPolicy === 'legend';
    }
    // Payloads from before labelPolicy existed: the original rule.
    const resolved = v.resolvedStrategy || v.strategy || '';
    return resolved === 'ai_generated_image';
  },

  isV2(data) {
    return !!(data && data.v2 && data.v2.layout && data.v2.layout.regions
              && data.v2.title);
  },

  layoutFor(v2) {
    const name = (v2.layout && v2.layout.name) || '';
    // An unknown layout still has regions, and concept_hero_split only uses
    // slots every layout defines, so it renders rather than failing.
    return this._layouts[name] ? name : 'concept_hero_split';
  },

  renderSlide(slide, pptx, data, helpers) {
    const v2 = data.v2;
    const theme = v2.theme || {};
    const name = this.layoutFor(v2);

    if (name !== 'title_hero') this._background(slide, pptx, theme, v2);
    this._layouts[name](slide, pptx, theme, v2, helpers, data);

    const f = this._region(v2, 'footer');
    if (f && name !== 'title_hero') {
      slide.addText(String(v2.slideNumber || data.slideNumber || ''), {
        x: f.x + f.w - 0.5, y: f.y, w: 0.5, h: f.h, align: 'right',
        fontSize: this._pt(theme, 'footer', 10),
        color: this._color(theme, 'ink_muted'), fontFace: this._font(theme, 'body'),
      });
    }
    return name;
  },
};
