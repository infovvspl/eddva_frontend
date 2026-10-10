/* ============================================================
 * pptV2Preview.js — V2 infographic renderer for the browser preview
 *
 * The same V2 slide specification that pptV2.js turns into a .pptx, drawn
 * here as DOM so the teacher sees on screen what they will get in the file.
 *
 * ONE SOURCE OF TRUTH. Every token — colour, type scale, icon glyph, card
 * tint, layout choice, text fitting — is read from window.PPTV2. Nothing is
 * copied. If a colour or a size is wrong, it is wrong in one place and both
 * renderers change together. The only thing this file owns is how a box is
 * expressed:
 *
 *      pptV2.js        normalised 0..1  ->  inches      (PptxGenJS)
 *      pptV2Preview.js normalised 0..1  ->  percent     (CSS)
 *
 * Percent is what makes the preview responsive for free: the canvas carries
 * `aspect-ratio: 16/9`, so a percentage box holds its proportions at any
 * container width, and type scales with the canvas base font-size that
 * preview.js already sets.
 *
 * V1 preview is untouched; preview.js calls in here only when slide.v2 is
 * present, and falls back to V1 if anything in here throws.
 * ============================================================ */

window.PPTV2Preview = {

  /* Points -> em against the canvas base font-size.
   *
   * preview.js sets canvas font-size to (width/800)*16 px. The slide is 10in
   * wide, so one point is width/720 px. Dividing gives a constant:
   *     em = pt * (width/720) / (width/800 * 16) = pt / 14.4
   * Width cancels, which is exactly why the preview stays proportional at
   * every container size. */
  PT_TO_EM: 14.4,

  _em(pt) { return (pt / this.PT_TO_EM).toFixed(3) + 'em'; },

  /** The shared token source. Never duplicate anything it already answers. */
  _v2() { return window.PPTV2; },

  // ══════════════════════════════════════════════════════════
  //  GEOMETRY — normalised 0..1 -> percent, in one place only
  // ══════════════════════════════════════════════════════════

  _pct(region) {
    if (!region) return null;
    const clamp01 = v => Math.min(Math.max(+v || 0, 0), 1);
    const x = clamp01(region.x), y = clamp01(region.y);
    // Keep the box on the canvas, the same guarantee _clamp gives the export.
    const w = Math.min(Math.max(+region.w || 0, 0), 1 - x);
    const h = Math.min(Math.max(+region.h || 0, 0), 1 - y);
    return {
      left: (x * 100) + '%', top: (y * 100) + '%',
      width: (w * 100) + '%', height: (h * 100) + '%',
      _x: x, _y: y, _w: w, _h: h,
    };
  },

  _region(v2, name) {
    const regions = (v2.layout && v2.layout.regions) || {};
    return this._pct(regions[name]);
  },

  // ══════════════════════════════════════════════════════════
  //  DOM helper
  // ══════════════════════════════════════════════════════════

  _el(tag, styles, text) {
    const node = document.createElement(tag);
    if (styles) Object.assign(node.style, styles);
    if (text != null) node.textContent = String(text);
    return node;
  },

  _place(node, box) {
    Object.assign(node.style, {
      position: 'absolute', left: box.left, top: box.top,
      width: box.width, height: box.height, boxSizing: 'border-box',
    });
    return node;
  },

  _hex(theme, token, fallback) { return '#' + this._v2()._color(theme, token, fallback); },

  // ══════════════════════════════════════════════════════════
  //  PRIMITIVES — mirror pptV2.js one for one
  // ══════════════════════════════════════════════════════════

  /** Styled runs for highlighted terms, using the shared splitter. */
  _runsInto(node, text, terms, markColor) {
    const runs = this._v2()._runs(text, terms, { mark: false }, { mark: true });
    for (const run of runs) {
      if (!run.text) continue;
      if (run.options && run.options.mark) {
        node.appendChild(this._el('strong', { color: markColor, fontWeight: '700' }, run.text));
      } else {
        node.appendChild(document.createTextNode(run.text));
      }
    }
    return node;
  },

  _card(theme, box, spec) {
    const V = this._v2();
    const s = spec || {};
    const accent = s.accent || this._hex(theme, 'primary');
    const card = this._place(this._el('div'), box);
    Object.assign(card.style, {
      background: s.tint || this._hex(theme, 'primary_soft'),
      border: '1px solid ' + this._hex(theme, 'border'),
      borderRadius: '0.5em', overflow: 'hidden',
      padding: '0.55em 0.7em 0.55em 0.9em',
      // Centred, not top-aligned: the backend sizes a card to its region, so
      // a two-word comparison card is as tall as a five-line process card.
      // Top-aligning left one line of text stranded above a large void.
      display: 'flex', flexDirection: 'column', gap: '0.18em',
      justifyContent: 'center',
    });

    // Accent spine, same device as the exported card.
    const spine = this._el('div', {
      position: 'absolute', left: '0', top: '6%', width: '0.28em', height: '88%',
      background: accent, borderRadius: '0 0.2em 0.2em 0',
    });
    card.appendChild(spine);

    // nowrap: when the label was allowed to wrap below the number, long
    // labels ("3. Carbon Dioxide Fixation") dropped onto their own line and
    // that card's body started lower than its neighbours'. The number stays
    // put and the label wraps beside it.
    const headRow = this._el('div', {
      display: 'flex', alignItems: 'flex-start', gap: '0.45em',
      flexWrap: 'nowrap', flex: '0 0 auto',
    });
    if (s.number) {
      headRow.appendChild(this._el('span', {
        flex: '0 0 auto', width: '1.55em', height: '1.55em', borderRadius: '50%',
        background: accent, color: this._hex(theme, 'on_primary'),
        fontSize: this._em(V._pt(theme, 'caption', 13)), fontWeight: '700',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: V._font(theme, 'heading'),
      }, s.number));
    }
    const label = V.displayLabel(s.label, !!s.number);
    if (label) {
      headRow.appendChild(this._el('span', {
        color: accent, fontWeight: '700', flex: '1 1 auto', minWidth: '0',
        fontSize: this._em(V._pt(theme, 'caption', 13) + 1),
        fontFamily: V._font(theme, 'heading'), lineHeight: '1.2',
      }, label));
    }
    if (headRow.childNodes.length) card.appendChild(headRow);

    if (s.text) {
      // Size against the region, through the shared estimator, so the
      // preview and the export reach for the same size rather than each
      // guessing. `_fitText` then measures and shrinks further if the
      // estimate was optimistic — silent clipping is the one outcome a
      // preview must never produce.
      const pt = V._fitPt(s.text, this._inches(box), V._pt(theme, 'body', 17) - 1);
      const body = this._el('div', {
        color: this._hex(theme, 'ink'), fontSize: this._em(pt),
        fontFamily: V._font(theme, 'body'),
        // 0 0 auto: the body must neither grow (which cancelled the card's
        // vertical centring) nor shrink. Allowing shrink squeezed it to 21px
        // against a 27px line box, and overflow:hidden then cut exactly the
        // descender band - "Oxygen" rendered as "Oxyqen".
        lineHeight: '1.28', flex: '0 0 auto',
      });
      this._runsInto(body, s.text, s.terms, accent);
      card.appendChild(body);
      // Measured against the CARD, which is the box with the real height.
      // The body is auto-sized now, so it can never report an overflow of
      // its own.
      this._fitLater(body, card, pt);
    }
    return card;
  },

  /** The region as inches, for the shared point-size estimator. */
  _inches(box) {
    const V = this._v2();
    return { x: box._x * V.SLIDE_W, y: box._y * V.SLIDE_H,
             w: box._w * V.SLIDE_W, h: box._h * V.SLIDE_H };
  },

  /* Shrink a text node until it stops overflowing its box.
   *
   * The DOM can measure what the export can only estimate, so this is the
   * one place the preview is allowed to be smarter: it converges on the
   * estimate when the estimate was right, and rescues the slide when it was
   * not. Queued to the next frame because nothing can be measured until the
   * node is in the document and laid out.
   */
  _fitLater(node, box, startPt) {
    // Line-height rounding routinely leaves scrollHeight a pixel or two over
    // clientHeight on text that fits perfectly well. Acting on that margin
    // faded the descenders off single-line cards — "Oxygen" read "Oxyqen".
    // Only a real extra line is worth reacting to.
    const SLACK = 6;
    const run = () => {
      let pt = startPt;
      let guard = 0;
      while (box.scrollHeight > box.clientHeight + SLACK && pt > 7 && guard++ < 14) {
        pt = Math.max(7, pt - 0.5);
        node.style.fontSize = this._em(pt);
      }
      if (box.scrollHeight > box.clientHeight + SLACK) {
        // Floor reached: fade the last line rather than cutting a word in
        // half with no indication that anything is missing.
        node.style.maskImage = 'linear-gradient(to bottom, #000 72%, transparent 100%)';
        node.style.webkitMaskImage = node.style.maskImage;
      }
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  },

  _badge(theme, box, text) {
    const V = this._v2();
    const badge = this._place(this._el('div'), box);
    Object.assign(badge.style, {
      background: this._hex(theme, 'accent'), color: this._hex(theme, 'on_accent'),
      borderRadius: '999px', display: 'inline-flex', alignItems: 'center',
      padding: '0 0.8em', width: 'auto', maxWidth: '60%',
      fontSize: this._em(V._pt(theme, 'footer', 10)), fontWeight: '700',
      letterSpacing: '0.08em', fontFamily: V._font(theme, 'heading'),
      whiteSpace: 'nowrap',
    });
    badge.textContent = String(text).toUpperCase();
    return badge;
  },

  _title(theme, box, titleSpec, role) {
    const V = this._v2();
    const spec = titleSpec || {};
    const node = this._place(this._el('div'), box);
    Object.assign(node.style, {
      color: this._hex(theme, 'heading'), fontWeight: '700',
      fontSize: this._em(V._pt(theme, role || 'title', 32)),
      fontFamily: V._font(theme, 'heading'),
      display: 'flex', alignItems: 'center', lineHeight: '1.15',
    });
    const inner = this._el('div');
    if (spec.emphasisText) {
      this._runsInto(inner, spec.text || '', [spec.emphasisText], '#' + V.titleMarkColor(theme));
    } else {
      inner.textContent = spec.text || '';
    }
    node.appendChild(inner);
    return node;
  },

  _subtitle(theme, box, text) {
    const V = this._v2();
    const node = this._place(this._el('div'), box);
    Object.assign(node.style, {
      color: this._hex(theme, 'ink_muted'),
      fontSize: this._em(V._pt(theme, 'subtitle', 20)),
      fontFamily: V._font(theme, 'body'),
      display: 'flex', alignItems: 'center', lineHeight: '1.25',
    });
    node.textContent = text || '';
    return node;
  },

  _callout(theme, box, text, terms) {
    const V = this._v2();
    const node = this._place(this._el('div'), box);
    Object.assign(node.style, {
      background: this._hex(theme, 'accent_soft'),
      border: '1px solid ' + this._hex(theme, 'accent'),
      borderRadius: '0.5em', padding: '0.6em 0.8em',
      color: this._hex(theme, 'ink'),
      fontSize: this._em(V._pt(theme, 'body', 17) - 1),
      fontFamily: V._font(theme, 'body'), lineHeight: '1.35',
      display: 'flex', alignItems: 'center', overflow: 'hidden',
    });
    const inner = this._el('div');
    this._runsInto(inner, text || '', terms, this._hex(theme, 'accent'));
    node.appendChild(inner);
    return node;
  },

  /* Arrow drawn as a CSS chevron so it scales with the canvas. */
  _arrow(theme, box, direction) {
    const node = this._place(this._el('div'), box);
    const colour = this._hex(theme, 'accent');
    Object.assign(node.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: colour, opacity: '0.75', fontWeight: '700',
      fontSize: '1.1em', lineHeight: '1',
    });
    node.textContent = direction === 'down' ? '▼' : '▶';
    return node;
  },

  /* Hero image inside a framed, overflow-hidden wrapper.
   *
   * The wrapper is position:relative, so annotations anchored in 0..1 of the
   * picture are placed against it — the same guarantee _confine gives the
   * export, expressed in CSS. */
  _heroImage(theme, box, v2, data, opts) {
    const visual = v2.visual || {};
    const bleed = !!(opts && opts.bleed);
    const wrap = this._place(this._el('div'), box);
    Object.assign(wrap.style, {
      // A full-bleed cover image runs to the slide edge, so the framing
      // panel would show as bands above and below it.
      // `image_mat` is white on dark themes, so a figure drawn for a white
      // page keeps its labels; decks saved before it existed use surface_alt.
      background: bleed ? 'transparent' : this._hex(theme, 'image_mat', 'surface_alt'),
      border: bleed ? 'none' : '1px solid ' + this._hex(theme, 'border'),
      borderRadius: bleed ? '0' : '0.5em',
      overflow: 'hidden', position: 'absolute',
    });

    const src = visual.base64 || data.imageBase64 || visual.url || data.imageUrl;
    if (!src) return { wrap, drawn: false };

    // Same rule as the export: contain for anything diagram-like, because
    // cropping a labelled figure cuts off the labels.
    const diagramish = visual.resolvedStrategy === 'programmatic_diagram'
      || visual.resolvedStrategy === 'ai_generated_image'
      || v2.slideType === 'anatomy'
      || (visual.annotations || []).length > 0;

    const img = this._el('img');
    img.src = src;
    img.alt = visual.altText || '';
    Object.assign(img.style, {
      width: '100%', height: '100%',
      objectFit: diagramish ? 'contain' : 'cover',
      objectPosition: 'center center', display: 'block',
    });
    // A broken URL must cost the image, never the slide.
    img.onerror = () => {
      img.remove();
      wrap.appendChild(this._el('div', {
        width: '100%', height: '100%', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: this._hex(theme, 'ink_muted'), fontSize: '0.75em',
      }, visual.altText || 'image unavailable'));
    };
    wrap.appendChild(img);
    return { wrap, drawn: true };
  },

  /* Annotation chip + leader, positioned inside the picture wrapper.
   * `placed` collects the chips already on this picture so a later one can
   * be nudged clear instead of landing on top of an earlier one. */
  _annotation(theme, wrap, ann, placed) {
    const V = this._v2();
    const nx = +(ann.anchor && ann.anchor[0]);
    const ny = +(ann.anchor && ann.anchor[1]);
    const ax = isNaN(nx) ? 0.5 : Math.min(Math.max(nx, 0), 1);
    const ay = isNaN(ny) ? 0.5 : Math.min(Math.max(ny, 0), 1);

    // A box placed by the backend wins: one arrangement, both renderers.
    if (ann.box && ann.box.length === 4) {
      this._annotationAt(theme, wrap, ann, ax, ay,
                         ann.box[0], ann.box[1], ann.box[2], ann.box[3]);
      return;
    }

    let side = ann.side && ann.side !== 'auto' ? ann.side : (ax < 0.5 ? 'left' : 'right');
    const lw = 0.30, lh = 0.11, gap = 0.05;   // fractions of the picture
    let lx, ly = ay - lh / 2;
    if (side === 'left')       { lx = ax - gap - lw; }
    else if (side === 'right') { lx = ax + gap; }
    else if (side === 'top')   { lx = ax - lw / 2; ly = ay - gap - lh; }
    else                       { lx = ax - lw / 2; ly = ay + gap; }
    lx = Math.min(Math.max(lx, 0), 1 - lw);
    ly = Math.min(Math.max(ly, 0), 1 - lh);

    // Two anchors at a similar height put their chips on top of each other
    // ("O₂" landed across "Stomata" in the first render). Step the later one
    // down, then up, until it is clear.
    const hits = r => (placed || []).some(p => Math.abs(p.y - r.y) < lh * 0.92
                                            && Math.abs(p.x - r.x) < lw * 0.92);
    for (let n = 1; n <= 4 && hits({ x: lx, y: ly }); n++) {
      const step = lh * 1.05 * n * (n % 2 ? 1 : -1);
      ly = Math.min(Math.max(ay - lh / 2 + step, 0), 1 - lh);
    }
    if (placed) placed.push({ x: lx, y: ly });

    this._annotationAt(theme, wrap, ann, ax, ay, lx, ly, lw, lh);
  },

  /** Draw one annotation chip and its leader at a known box. */
  _annotationAt(theme, wrap, ann, ax, ay, lx, ly, lw, lh) {
    const V = this._v2();
    const accent = this._hex(theme, 'accent');

    if (ann.leader !== false) {
      const cx = lx + lw / 2, cy = ly + lh / 2;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      Object.assign(svg.style, {
        position: 'absolute', left: '0', top: '0', width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      });
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', (cx * 100).toFixed(2));
      line.setAttribute('y1', (cy * 100).toFixed(2));
      line.setAttribute('x2', (ax * 100).toFixed(2));
      line.setAttribute('y2', (ay * 100).toFixed(2));
      line.setAttribute('stroke', accent);
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(line);
      wrap.appendChild(svg);

      const dot = this._el('div', {
        position: 'absolute', left: (ax * 100) + '%', top: (ay * 100) + '%',
        width: '0.45em', height: '0.45em', marginLeft: '-0.225em',
        marginTop: '-0.225em', borderRadius: '50%', background: accent,
        border: '1px solid ' + this._hex(theme, 'surface'),
      });
      wrap.appendChild(dot);
    }

    // Width hugs the text up to a ceiling, rather than being fixed: a fixed
    // 30% box clipped "Stomata" down to "nata".
    const chip = this._el('div', {
      position: 'absolute', left: (lx * 100) + '%', top: (ly * 100) + '%',
      width: 'auto', maxWidth: (lw * 1.35 * 100) + '%',
      minHeight: (lh * 100) + '%',
      background: this._hex(theme, 'surface'), border: '1px solid ' + accent,
      borderRadius: '0.45em', color: this._hex(theme, 'ink'),
      fontSize: this._em(V._pt(theme, 'annotation', 12)), fontWeight: '700',
      fontFamily: V._font(theme, 'body'), textAlign: 'center',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0.1em 0.45em', boxSizing: 'border-box', lineHeight: '1.15',
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }, ann.text);
    wrap.appendChild(chip);
  },

  /* The deck is on screen before its pictures: hold the space honestly. */
  _pendingBox(theme, box) {
    const hold = this._place(this._el('div'), box);
    Object.assign(hold.style, {
      border: '2px dashed ' + this._hex(theme, 'border'), borderRadius: '0.6em',
      background: this._hex(theme, 'surface_alt'), color: this._hex(theme, 'ink_muted'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '700', fontSize: '0.9em',
      animation: 'pptPulse 1.4s ease-in-out infinite',
    });
    hold.textContent = 'Adding picture…';
    return hold;
  },

  /* Shapes, when no picture was obtained or none was wanted. What goes in
   * the row - and whether it is a chain at all - is decided once, in
   * PPTV2.iconRow, so the preview and the export cannot disagree. */
  _iconComposition(theme, box, v2) {
    const V = this._v2();
    const row = V.iconRow(v2);
    if (row.mode === 'none') return null;
    if (row.mode === 'versus') return this._versus(theme, box, row.items);
    if (row.mode === 'terms') return this._termChips(theme, box, row.items);
    const arrows = row.mode === 'sequence';

    const wrap = this._place(this._el('div'), box);
    Object.assign(wrap.style, {
      // flex-start, not center: the cells are taller than the arrows (disc
      // plus label), so centring them pushed the discs down while the arrows
      // stayed up. Aligning everything to the top lets the disc and the
      // arrow share one 3.2em band and actually line up.
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      gap: arrows ? '0.3em' : '0.9em', paddingTop: '0.6em',
    });

    row.items.forEach((item, i) => {
      const accent = V._cardAccent(theme, i);
      const cell = this._el('div', {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '0.3em', flex: '1 1 0', minWidth: '0',
      });

      // The disc is sized at a FIXED font-size and the glyph gets its own.
      // Sizing both on one element made the disc shrink with the glyph, so
      // "C₆H₁₂O₆" came out as a visibly smaller circle sitting out of line
      // with its neighbours.
      const disc = this._el('div', {
        width: '3.2em', height: '3.2em', flex: '0 0 auto', fontSize: '1em',
        borderRadius: '50%', background: '#' + V._cardTint(theme, i),
        border: '2px solid #' + accent, color: '#' + accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxSizing: 'border-box', padding: '0.15em', overflow: 'hidden',
      });
      const glyph = item.glyph;
      disc.appendChild(this._el('span', {
        fontWeight: '700', fontFamily: V._GLYPH_FONT, lineHeight: '1',
        textAlign: 'center', whiteSpace: 'nowrap',
        // Long formulae have to come down in size or they spill the disc.
        fontSize: glyph.length > 4 ? '0.55em' : glyph.length > 2 ? '0.8em' : '1.3em',
      }, glyph));
      cell.appendChild(disc);
      // Two lines, then an ellipsis: "glucose" must not become "gluc...".
      cell.appendChild(this._el('div', {
        color: this._hex(theme, 'ink'), fontWeight: '700',
        fontSize: this._em(V._pt(theme, 'caption', 13)),
        fontFamily: V._font(theme, 'body'), textAlign: 'center', lineHeight: '1.2',
        overflow: 'hidden', display: '-webkit-box', webkitLineClamp: '2',
        webkitBoxOrient: 'vertical', maxWidth: '100%', overflowWrap: 'anywhere',
      }, item.caption));
      wrap.appendChild(cell);

      if (arrows && i < row.items.length - 1) {
        // Given the same fixed height as the disc and centred inside it, so
        // the arrow lines up with the circles rather than floating above
        // them, whatever the labels underneath do.
        const arrow = this._el('div', {
          flex: '0 0 auto', alignSelf: 'flex-start', fontSize: '1em',
          height: '3.2em', display: 'flex', alignItems: 'center',
        });
        arrow.appendChild(this._el('span', {
          color: '#' + V._color(theme, 'accent'), opacity: '0.7',
          fontSize: '1.1em', fontWeight: '700', lineHeight: '1',
        }, '▶'));
        wrap.appendChild(arrow);
      }
    });
    return wrap;
  },

  /* Key terms as a row of chips; see pptV2.js _termChips. */
  _termChips(theme, box, items) {
    const V = this._v2();
    const wrap = this._place(this._el('div'), box);
    Object.assign(wrap.style, {
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', alignContent: 'center',
      justifyContent: 'center', gap: '0.6em',
    });
    items.forEach((item, i) => {
      const accent = '#' + V._cardAccent(theme, i);
      wrap.appendChild(this._el('div', {
        flex: '0 1 auto', maxWidth: '46%', padding: '0.4em 1em', borderRadius: '999px',
        background: '#' + V._cardTint(theme, i), border: '2px solid ' + accent,
        color: accent, fontWeight: '700', fontFamily: V._font(theme, 'heading'),
        fontSize: this._em(V._pt(theme, 'caption', 13) + 3), textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }, item.caption));
    });
    return wrap;
  },

  /* A comparison's two sides set against each other: "Aerobic  VS  Anaerobic". */
  _versus(theme, box, items) {
    const V = this._v2();
    const wrap = this._place(this._el('div'), box);
    Object.assign(wrap.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8em',
    });
    const pill = (item, i) => {
      const accent = '#' + V._cardAccent(theme, i);
      return this._el('div', {
        flex: '1 1 0', minWidth: '0', maxWidth: '42%', padding: '0.45em 1em',
        borderRadius: '999px', background: '#' + V._cardTint(theme, i),
        border: '2px solid ' + accent, color: accent, textAlign: 'center',
        fontWeight: '700', fontFamily: V._font(theme, 'heading'),
        fontSize: this._em(V._pt(theme, 'heading', 22)), lineHeight: '1.15',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }, item.caption);
    };
    wrap.appendChild(pill(items[0], 0));
    wrap.appendChild(this._el('div', {
      flex: '0 0 auto', width: '2.6em', height: '2.6em', borderRadius: '50%',
      background: this._hex(theme, 'heading'), color: this._hex(theme, 'on_primary'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontFamily: V._font(theme, 'heading'), fontSize: '1em',
    }, 'VS'));
    wrap.appendChild(pill(items[1], 1));
    return wrap;
  },

  // ══════════════════════════════════════════════════════════
  //  BACKGROUND + CHROME
  // ══════════════════════════════════════════════════════════

  _background(canvas, theme) {
    const bg = (theme && theme.background) || 'surface';
    if (typeof bg === 'string' && bg.indexOf('gradient:') === 0) {
      const parts = bg.slice(9).split('->');
      const c1 = this._hex(theme, (parts[0] || 'primary').trim());
      const c2 = this._hex(theme, (parts[1] || 'accent').trim());
      // backgroundImage, not the `background` shorthand: a gradient is an
      // image, and setting it through the shorthand also wipes the colour
      // underneath it that acts as the fallback.
      canvas.style.backgroundColor = c1;
      canvas.style.backgroundImage = 'linear-gradient(135deg, ' + c1 + ', ' + c2 + ')';
      return;
    }
    canvas.style.backgroundImage = 'none';
    canvas.style.backgroundColor = this._hex(theme, bg, 'surface');

    // The same single soft corner disc the export draws; it bleeds off the
    // top-right and the canvas clips it.
    canvas.appendChild(this._el('div', {
      position: 'absolute', right: '-5%', top: '-14%',
      width: '20%', aspectRatio: '1 / 1', borderRadius: '50%',
      background: this._hex(theme, 'primary'), opacity: '0.08',
      pointerEvents: 'none',
    }));
  },

  _chrome(canvas, theme, v2) {
    const titleBox = this._region(v2, 'title');
    if (titleBox) {
      if (v2.footer) {
        const badgeBox = Object.assign({}, titleBox, {
          top: (Math.max(titleBox._y - 0.055, 0.012) * 100) + '%',
          height: '5%',
        });
        canvas.appendChild(this._badge(theme, badgeBox, v2.footer));
      }
      canvas.appendChild(this._title(theme, titleBox, v2.title));
      // Accent rule under the title.
      canvas.appendChild(this._el('div', {
        position: 'absolute', left: titleBox.left,
        top: ((titleBox._y + titleBox._h - 0.008) * 100) + '%',
        width: '6.2%', height: '0.8%',
        background: this._hex(theme, 'accent'), borderRadius: '0.2em',
      }));
    }
    const subBox = this._region(v2, 'subtitle');
    if (subBox && v2.subtitle) canvas.appendChild(this._subtitle(theme, subBox, v2.subtitle));

    const footBox = this._region(v2, 'footer');
    if (footBox) {
      const V = this._v2();
      canvas.appendChild(this._el('div', {
        position: 'absolute', right: '5.5%', top: footBox.top,
        height: footBox.height, color: this._hex(theme, 'ink_muted'),
        fontSize: this._em(V._pt(theme, 'footer', 10)),
        fontFamily: V._font(theme, 'body'),
        display: 'flex', alignItems: 'center',
      }, String(v2.slideNumber || '')));
    }
  },

  // ══════════════════════════════════════════════════════════
  //  SHARED PIECES
  // ══════════════════════════════════════════════════════════

  _blockBoxes(v2, prefix) {
    const regions = (v2.layout && v2.layout.regions) || {};
    const out = [];
    for (let i = 0; ; i++) {
      const r = regions[(prefix || 'block') + '_' + i];
      if (!r) break;
      out.push(this._pct(r));
    }
    return out;
  },

  _cardsInto(canvas, theme, v2, boxes, opts) {
    const V = this._v2();
    const o = opts || {};
    const blocks = v2.contentBlocks || [];
    boxes.forEach((box, i) => {
      const b = blocks[i];
      if (!b) return;
      canvas.appendChild(this._card(theme, box, {
        number: o.numbered ? String(i + 1).padStart(2, '0')
          : (b.kind === 'step' ? String(i + 1) : ''),
        label: b.label || '', text: b.text || '',
        terms: v2.highlightedTerms || [],
        tint: '#' + V._cardTint(theme, i),
        accent: '#' + V._cardAccent(theme, i),
      }));
    });
  },

  _visualInto(canvas, theme, v2, data, regionName) {
    const box = this._region(v2, regionName || 'visual');
    if (!box) return;
    const visual = v2.visual || {};
    const hasImage = !!(visual.base64 || visual.url || data.imageBase64 || data.imageUrl);

    if (!hasImage && visual.pending) {
      canvas.appendChild(this._pendingBox(theme, box));
      return;
    }

    if (!hasImage) {
      const icons = this._iconComposition(theme, box, v2);
      if (icons) canvas.appendChild(icons);
      return;                     // no empty frame when there is nothing to show
    }

    const { wrap } = this._heroImage(theme, box, v2, data);
    canvas.appendChild(wrap);
    // Only on pictures we authored — a searched figure carries its own
    // labels and our chips would hide them. See PPTV2.annotationsAllowed.
    if (!this._v2().annotationsAllowed(visual)) return;
    const placed = [];
    (visual.annotations || []).forEach(a => this._annotation(theme, wrap, a, placed));
  },

  // ══════════════════════════════════════════════════════════
  //  LAYOUTS — same eleven names as the export
  // ══════════════════════════════════════════════════════════

  _layouts: {
    concept_hero_split(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      const boxes = R._blockBoxes(v2);
      if (boxes.length) R._cardsInto(canvas, theme, v2, boxes, { numbered: true });
      else {
        const c = R._region(v2, 'content');
        if (c) canvas.appendChild(R._callout(theme, c,
          (v2.contentBlocks || []).map(b => b.text).join('  '), v2.highlightedTerms));
      }
      R._visualInto(canvas, theme, v2, data);
    },

    process_steps(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      R._cardsInto(canvas, theme, v2, R._blockBoxes(v2), { numbered: true });
      const regions = (v2.layout && v2.layout.regions) || {};
      for (let i = 0; regions['connector_' + i]; i++) {
        const box = R._pct(regions['connector_' + i]);
        canvas.appendChild(R._arrow(theme, box, box._w >= box._h ? 'right' : 'down'));
      }
    },

    comparison(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      R._cardsInto(canvas, theme, v2, R._blockBoxes(v2));
      const d = ((v2.layout && v2.layout.regions) || {}).divider;
      if (d) {
        const box = R._pct(d);
        const rule = R._place(R._el('div'), box);
        rule.style.background = R._hex(theme, 'border');
        canvas.appendChild(rule);
      }
    },

    cause_effect(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      R._cardsInto(canvas, theme, v2, R._blockBoxes(v2));
      const c = ((v2.layout && v2.layout.regions) || {}).connector_0;
      if (c) canvas.appendChild(R._arrow(theme, R._pct(c), 'right'));
    },

    anatomy_labeled(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      const V = window.PPTV2;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      const regions = (v2.layout && v2.layout.regions) || {};
      const blocks = v2.contentBlocks || [];
      let i = 0;
      ['l', 'r'].forEach(side => {
        for (let k = 0; regions['label_' + side + '_' + k]; k++) {
          const b = blocks[i++];
          if (!b) return;
          canvas.appendChild(R._card(theme, R._pct(regions['label_' + side + '_' + k]), {
            label: b.label || '', text: b.text || '',
            terms: v2.highlightedTerms || [],
            tint: '#' + V._cardTint(theme, i), accent: '#' + V._cardAccent(theme, i),
          }));
        }
      });
    },

    magnification(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      const detail = R._region(v2, 'visual_detail');
      if (detail) {
        const node = R._place(R._el('div'), detail);
        Object.assign(node.style, {
          background: R._hex(theme, 'surface_alt'),
          border: '2px solid ' + R._hex(theme, 'accent'), borderRadius: '0.5em',
        });
        canvas.appendChild(node);
      }
      const c = ((v2.layout && v2.layout.regions) || {}).connector_0;
      if (c) canvas.appendChild(R._arrow(theme, R._pct(c), 'right'));
      const content = R._region(v2, 'content');
      if (content) canvas.appendChild(R._callout(theme, content,
        (v2.contentBlocks || []).map(b => b.text).join('  '), v2.highlightedTerms));
    },

    timeline(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      const V = window.PPTV2;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      const regions = (v2.layout && v2.layout.regions) || {};
      if (regions.axis) {
        const a = R._pct(regions.axis);
        const axis = R._place(R._el('div'), a);
        axis.style.background = R._hex(theme, 'primary');
        axis.style.borderRadius = '0.2em';
        canvas.appendChild(axis);
      }
      R._cardsInto(canvas, theme, v2, R._blockBoxes(v2));
      const blocks = v2.contentBlocks || [];
      for (let i = 0; regions['label_' + i]; i++) {
        const b = blocks[i];
        if (!b) break;
        const lb = R._pct(regions['label_' + i]);
        if (regions.axis) {
          const a = R._pct(regions.axis);
          canvas.appendChild(R._el('div', {
            position: 'absolute',
            left: ((lb._x + lb._w / 2) * 100) + '%', top: (a._y * 100) + '%',
            width: '0.5em', height: '0.5em', marginLeft: '-0.25em',
            marginTop: '-0.2em', borderRadius: '50%',
            background: R._hex(theme, 'accent'),
            border: '2px solid ' + R._hex(theme, 'surface'),
          }));
        }
        const label = R._place(R._el('div'), lb);
        Object.assign(label.style, {
          color: R._hex(theme, 'ink_muted'), fontWeight: '700',
          fontSize: R._em(V._pt(theme, 'caption', 13)),
          fontFamily: V._font(theme, 'body'), textAlign: 'center',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        });
        label.textContent = b.label || '';
        canvas.appendChild(label);
      }
    },

    formula_equation(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      const V = window.PPTV2;
      R._chrome(canvas, theme, v2);
      const blocks = v2.contentBlocks || [];
      const eq = R._region(v2, 'equation');
      const text = V.equationText(v2);
      if (eq && text) {
        const node = R._place(R._el('div'), eq);
        Object.assign(node.style, {
          background: R._hex(theme, 'primary_soft'),
          border: '1px solid ' + R._hex(theme, 'primary'),
          borderRadius: '0.5em', color: R._hex(theme, 'primary'),
          fontWeight: '700', fontSize: R._em(V._pt(theme, 'heading', 22)),
          fontFamily: V._font(theme, 'heading'), textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0.3em 0.6em', overflow: 'hidden',
        });
        node.textContent = text;
        canvas.appendChild(node);
      }
      R._visualInto(canvas, theme, v2, data);
      const boxes = R._blockBoxes(v2);
      // The block shown in the equation band must not be repeated as a card.
      const rest = Object.assign({}, v2, {
        contentBlocks: blocks.filter(b => b.kind !== 'equation'),
      });
      if (boxes.length) R._cardsInto(canvas, theme, rest, boxes);
    },

    summary_grid(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      R._chrome(canvas, theme, v2);
      R._visualInto(canvas, theme, v2, data);
      R._cardsInto(canvas, theme, v2, R._blockBoxes(v2), { numbered: true });
    },

    quiz(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      const V = window.PPTV2;
      R._chrome(canvas, theme, v2);
      const blocks = v2.contentBlocks || [];
      const q = R._region(v2, 'question');
      if (q) {
        const text = (blocks.find(b => b.kind === 'question') || {}).text || v2.subtitle || '';
        canvas.appendChild(R._callout(theme, q, text, v2.highlightedTerms));
      }
      R._visualInto(canvas, theme, v2, data);
      const answers = blocks.filter(b => b.kind !== 'question');
      R._blockBoxes(v2).forEach((box, i) => {
        const b = answers[i];
        if (!b) return;
        canvas.appendChild(R._card(theme, box, {
          // The letter is the marker; passing it as the label too printed
          // "A  A" and squeezed the answer until its descenders clipped.
          number: String.fromCharCode(65 + i), label: '',
          text: b.text || b.label || '', terms: v2.highlightedTerms || [],
          // One style for every option; see pptV2.js quiz.
          tint: '#' + V._color(theme, 'surface_alt'), accent: '#' + V._color(theme, 'accent'),
        }));
      });
    },

    title_hero(canvas, theme, v2, data) {
      const R = window.PPTV2Preview;
      const V = window.PPTV2;
      const t = R._region(v2, 'title');
      if (t) canvas.appendChild(R._title(theme, t, v2.title, 'display'));
      const s = R._region(v2, 'subtitle');
      if (s && v2.subtitle) canvas.appendChild(R._subtitle(theme, s, v2.subtitle));
      const f = R._region(v2, 'footer');
      if (f && v2.footer) {
        const node = R._place(R._el('div'), f);
        Object.assign(node.style, {
          color: R._hex(theme, 'ink_muted'), fontWeight: '700',
          letterSpacing: '0.08em', fontSize: R._em(V._pt(theme, 'footer', 10)),
          fontFamily: V._font(theme, 'heading'),
          display: 'flex', alignItems: 'center',
        });
        node.textContent = String(v2.footer).toUpperCase();
        canvas.appendChild(node);
      }
      const v = R._region(v2, 'visual');
      const visual = v2.visual || {};
      const hasImage = !!(visual.base64 || visual.url || data.imageBase64 || data.imageUrl);
      if (v && visual.pending && !hasImage) canvas.appendChild(R._pendingBox(theme, v));
      else if (v) canvas.appendChild(R._heroImage(theme, v, v2, data, { bleed: true }).wrap);
    },
  },

  // ══════════════════════════════════════════════════════════
  //  ENTRY POINT
  // ══════════════════════════════════════════════════════════

  isV2(data) { return !!(window.PPTV2 && window.PPTV2.isV2(data)); },

  /** Render one V2 slide into `canvas`. Returns the layout name used. */
  renderSlide(canvas, data) {
    const v2 = data.v2;
    const theme = v2.theme || {};
    const name = window.PPTV2.layoutFor(v2);

    canvas.style.position = 'relative';
    canvas.style.overflow = 'hidden';
    canvas.style.fontFamily = window.PPTV2._font(theme, 'body');

    this._background(canvas, theme);
    this._layouts[name](canvas, theme, v2, data);
    return name;
  },
};
