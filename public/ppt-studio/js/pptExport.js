/* ============================================================
 * pptExport.js — PowerPoint File Generator
 * Three professional design styles: Executive, Boardroom, Immersive
 * Slide canvas: 10" × 5.625" (LAYOUT_16x9)
 * ============================================================ */

window.PPTExport = {

  _IMG_PRESETS: {
    small:  { x: 7.3, y: 1.6, w: 2.3, h: 1.73 },
    medium: { x: 6.5, y: 1.2, w: 3.1, h: 2.33 },
    large:  { x: 5.6, y: 0.9, w: 4.0, h: 3.0  },
  },

  // ── Entry point ──────────────────────────────────────────────
  async exportPresentation(presentationData) {
    const { pptx, fileName } = this._buildPptx(presentationData);
    await pptx.writeFile({ fileName });
  },

  // Build the same deck but return base64 (used to save into EDVA Course Content).
  async exportToBase64(presentationData) {
    const { pptx, fileName } = this._buildPptx(presentationData);
    const base64 = await pptx.write({ outputType: 'base64' });
    return { base64, fileName };
  },

  _buildPptx(presentationData) {
    if (!presentationData?.slides?.length) throw new Error('No slides to export.');
    if (typeof PptxGenJS === 'undefined')  throw new Error('PptxGenJS library is not loaded.');

    const themeKey = presentationData.theme  || 'dark-professional';
    const design   = presentationData.design || 'executive';
    const theme    = window.THEMES[themeKey] || window.THEMES['dark-professional'];

    const pptx = new PptxGenJS();
    pptx.layout  = 'LAYOUT_16x9';
    pptx.author  = 'EDVA';
    pptx.subject = presentationData.title || 'Presentation';
    pptx.title   = presentationData.title || 'Presentation';

    for (const slideData of presentationData.slides) {
      try {
        const slide = pptx.addSlide();
        this._buildSlide(slide, pptx, slideData, theme, design);
        if (slideData.speakerNotes) slide.addNotes(slideData.speakerNotes);
      } catch (err) {
        console.warn(`Slide ${slideData.slideNumber || '?'} error:`, err);
      }
    }

    const safe = (presentationData.title || 'Presentation')
      .replace(/[<>:"/\\|?*]/g, '').trim().slice(0, 100) || 'Presentation';
    return { pptx, fileName: `${safe}.pptx` };
  },

  // ── Dispatch ─────────────────────────────────────────────────
  _buildSlide(slide, pptx, data, theme, design) {
    const type = (data.type || 'content').toLowerCase();
    const map  = {
      executive: { title: '_exec_title', content: '_exec_content', summary: '_exec_summary' },
      boardroom: { title: '_board_title', content: '_board_content', summary: '_board_summary' },
      immersive: { title: '_imm_title',  content: '_imm_content',  summary: '_imm_summary'  },
    };
    const fn = (map[design] || map.executive)[type] || '_exec_content';
    this[fn](slide, pptx, data, theme);
  },

  // ════════════════════════════════════════════════════════════
  //  SHARED DRAWING HELPERS
  // ════════════════════════════════════════════════════════════

  // Full-slide gradient background.
  // PptxGenJS slide.background only accepts solid colour; we overlay a full-slide
  // gradient-filled rectangle so the gradient actually appears in the exported file.
  _gradBg(slide, pptx, theme, angle, flip) {
    angle = angle || 135;
    var c1 = flip ? theme.bgGradient[1] : theme.bgGradient[0];
    var c2 = flip ? theme.bgGradient[0] : theme.bgGradient[1];
    slide.background = { color: c1 };
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { type: 'gradient', color: c1, color2: c2, angle: angle },
      line: { color: c1 },
    });
  },

  // Solid filled rectangle (border colour matches fill so it is invisible)
  _rect(slide, pptx, x, y, w, h, color, transparency) {
    transparency = transparency || 0;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x, y: y, w: w, h: h,
      fill: { color: color, transparency: transparency },
      line: { color: color },
    });
  },

  // Oval / circle accent
  _oval(slide, pptx, x, y, w, h, color, transparency) {
    transparency = transparency || 0;
    slide.addShape(pptx.shapes.OVAL, {
      x: x, y: y, w: w, h: h,
      fill: { color: color, transparency: transparency },
      line: { color: color, transparency: transparency },
    });
  },

  // Right-angle triangle graphic element
  // rotate 0  → right angle at bottom-left  (diagonal: TL→BR)
  // rotate 90 → right angle at top-left     (diagonal: TR→BL)
  // rotate 180→ right angle at top-right    (diagonal: BL→TR)
  // rotate 270→ right angle at bottom-right (diagonal: TL→BR mirrored)
  _tri(slide, pptx, x, y, w, h, color, transparency, rotate) {
    transparency = transparency || 0;
    rotate = rotate || 0;
    slide.addShape(pptx.shapes.RIGHT_TRIANGLE, {
      x: x, y: y, w: w, h: h,
      fill: { color: color, transparency: transparency },
      line: { color: color, transparency: transparency },
      rotate: rotate,
    });
  },

  // Diagonal stripe: an extra-wide rectangle rotated a few degrees so it
  // slices diagonally across the slide — used as a graphic section divider
  _diagStripe(slide, pptx, y, color, transparency, deg) {
    transparency = transparency || 30;
    deg = deg || -3;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: -2, y: y, w: 14, h: 0.14,
      fill: { color: color, transparency: transparency },
      line: { color: color, transparency: transparency },
      rotate: deg,
    });
  },

  // Thin horizontal rule
  _rule(slide, pptx, x, y, w, color, transparency) {
    transparency = transparency || 0;
    this._rect(slide, pptx, x, y, w, 0.05, color, transparency);
  },

  // Image placement helper
  _hasImg(data) { return !!(data && (data.imageBase64 || data.imageUrl)); },
  _placeImg(slide, data, opts) {
    // "Fit whole image" → contain (no cropping). Whole image is shown, letterboxed.
    if ((data.imageFit || 'cover') === 'contain') {
      try {
        var c = Object.assign({}, opts, { sizing: { type: 'contain', w: opts.w, h: opts.h } });
        if (data.imageBase64) c.data = data.imageBase64;
        else if (data.imageUrl) c.path = data.imageUrl;
        else return;
        slide.addImage(c);
      } catch (e) { console.warn('Image error (contain):', e); }
      return;
    }
    try {
      // Map CSS object-position to PptxGenJS crop offsets
      var pos     = (data.imagePosition || 'center center').split(' ');
      var posH    = pos[0] || 'center'; // top / center / bottom
      var posV    = pos[1] || 'center'; // left / center / right
      var tCrop   = posH === 'top'    ? 0  : posH === 'bottom' ? 25 : 12;
      var bCrop   = posH === 'bottom' ? 0  : posH === 'top'    ? 25 : 12;
      var lCrop   = posV === 'left'   ? 0  : posV === 'right'  ? 25 : 12;
      var rCrop   = posV === 'right'  ? 0  : posV === 'left'   ? 25 : 12;
      var o = Object.assign({}, opts, {
        sizing: { type: 'crop', x: lCrop/100 * opts.w, y: tCrop/100 * opts.h,
                  w: opts.w * (1 - (lCrop+rCrop)/100),
                  h: opts.h * (1 - (tCrop+bCrop)/100) }
      });
      if (data.imageBase64) o.data = data.imageBase64;
      else if (data.imageUrl) o.path = data.imageUrl;
      else return;
      slide.addImage(o);
    } catch (e) {
      // Fallback: no crop
      try {
        var fb = Object.assign({}, opts, { sizing: { type: 'contain', w: opts.w, h: opts.h } });
        if (data.imageBase64) fb.data = data.imageBase64;
        else if (data.imageUrl) fb.path = data.imageUrl;
        slide.addImage(fb);
      } catch(e2) { console.warn('Image error:', e2); }
    }
  },

  // Build bullet items array for slide.addText
  // 5 bullets × ~15 words × ~5 chars = ~375 chars → comfortable at 15pt
  _bullets(data, theme, numbered) {
    var list       = data.bullets || [];
    var totalChars = list.reduce(function(s, b) { return s + (b ? b.length : 0); }, 0);
    var fs = totalChars > 700 ? 12 : totalChars > 450 ? 13 : 15;
    var ls = fs === 12 ? 18 : fs === 13 ? 20 : 22;
    return {
      items: list.map(function(b) {
        return {
          text: b || '',
          options: {
            bullet: numbered
              ? { type: 'number', color: theme.accent }
              : { color: theme.accent },
            color: theme.textColor,
            fontSize: fs,
            lineSpacing: ls,
          }
        };
      }),
    };
  },

  // Maximum text column width respecting image column
  _textW(sk, hasImg, preset) {
    if (!hasImg || sk === 'none' || sk === 'full') return 9.2;
    return (preset && preset.x ? preset.x : 6.5) - 0.5;
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 1 — EXECUTIVE
  //  ● Diagonal gradient background
  //  ● Corner RIGHT_TRIANGLE graphic dividers (TL + BR on every slide)
  //  ● Solid accent header bar on content slides
  //  ● Diagonal stripe rule separating header from body
  //  ● Right tinted panel on title slide
  // ════════════════════════════════════════════════════════════

  // ── Clean, minimal title slide ───────────────────────────────
  _exec_title(slide, pptx, data, theme) {
    slide.background = { color: theme.bgGradient[0] };
    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.7 : 8.8;

    // Left accent bar
    this._rect(slide, pptx, 0, 0, 0.18, 5.625, theme.accent);

    // Small eyebrow accent line
    this._rect(slide, pptx, 0.7, 1.95, 0.9, 0.06, theme.accent);

    slide.addText(data.title || '', {
      x: 0.7, y: 2.1, w: textW, h: 1.7,
      fontSize: 40, bold: true, lineSpacingMultiple: 1.02,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 3.85, w: textW, h: 0.9,
        fontSize: 18, color: theme.subtextColor,
        fontFace: theme.fontBody, align: 'left',
      });
    }

    // Clean image block on the right
    if (hasImg) {
      this._placeImg(slide, data, { x: 6.7, y: 0.9, w: 2.9, h: 3.85 });
    }
  },

  // ── Clean content slide: title + accent underline, bullets, image ──
  _exec_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var preset = this._IMG_PRESETS[sk] || this._IMG_PRESETS.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      this._rect(slide, pptx, 0, 0, 10, 5.625, '000000', 45);
      slide.addText(data.title || '', {
        x: 0.5, y: 0.4, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: 'FFFFFF', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    slide.background = { color: theme.bgGradient[0] };

    // Title + thin accent underline (no busy header bar / triangles)
    slide.addText(data.title || '', {
      x: 0.55, y: 0.42, w: 8.9, h: 0.75,
      fontSize: 26, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });
    this._rect(slide, pptx, 0.57, 1.2, 1.5, 0.05, theme.accent);

    // Bullets
    var tw = this._textW(sk, hasImg, preset);
    var bl = this._bullets(data, theme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.57, y: 1.5, w: tw, h: 3.85,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  // ── Clean summary slide ──────────────────────────────────────
  _exec_summary(slide, pptx, data, theme) {
    slide.background = { color: theme.bgGradient[0] };
    var hasImg = this._hasImg(data);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.5, w: hasImg ? 6.6 : 8.8, h: 0.9,
      fontSize: 32, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left',
    });
    this._rect(slide, pptx, 0.62, 1.35, 1.6, 0.05, theme.accent);

    var bl = this._bullets(data, theme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.62, y: 1.65, w: hasImg ? 6.0 : 8.6, h: 3.0,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.9, y: 1.55, w: 2.7, h: 2.0 });

    // Footer accent line + closing line
    this._rect(slide, pptx, 0.6, 5.0, 8.8, 0.04, theme.accent);
    slide.addText('Thank You', {
      x: 0.6, y: 5.08, w: 8.8, h: 0.45,
      fontSize: 16, bold: true,
      color: theme.accent, fontFace: theme.fontHead, align: 'left',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 2 — BOARDROOM
  //  ● Angled left panel: a solid rectangle + RIGHT_TRIANGLE creates a
  //    diagonal edge graphic divider splitting every slide vertically
  //  ● Accent gradient splits left/right on the title slide
  //  ● Diagonal stripe rule below title band
  // ════════════════════════════════════════════════════════════

  _board_title(slide, pptx, data, theme) {
    // Left gradient panel
    slide.background = { color: theme.bgGradient[0] };
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 5.6, h: 5.625,
      fill: { type: 'gradient', color: theme.bgGradient[0], color2: theme.bgGradient[1], angle: 160 },
      line: { color: theme.bgGradient[0] },
    });

    // Right solid-accent panel
    this._rect(slide, pptx, 5.6, 0, 4.4, 5.625, theme.accent);

    // ── Diagonal graphic divider at the panel join ────────────
    // Triangle overlaps the join: rotate 90 → TL right angle, hypotenuse TR→BL
    // Placed at the seam (x=5.3) in the LEFT panel's colour so it "bites" diagonally
    // into the accent panel, creating an angled edge
    this._tri(slide, pptx, 5.3, 0, 1.0, 5.625, theme.bgGradient[1], 0, 90);

    // Image / letter in right panel
    if (this._hasImg(data)) {
      this._placeImg(slide, data, { x: 6.0, y: 0.2, w: 3.75, h: 5.23 });
      this._rect(slide, pptx, 6.0, 0.2, 3.75, 5.23, '000000', 60);
    } else {
      slide.addText((data.title || '?')[0].toUpperCase(), {
        x: 6.0, y: 0.3, w: 3.75, h: 5.0,
        fontSize: 128, bold: true, color: 'FFFFFF',
        fontFace: theme.fontHead, align: 'center', valign: 'middle',
        transparency: 22,
      });
    }

    // Left panel depth circle
    this._oval(slide, pptx, -1.2, 3.3, 3.8, 3.8, theme.accent, 91);

    // Pre-title rule
    this._rect(slide, pptx, 0.55, 1.65, 2.8, 0.065, theme.accent);

    slide.addText(data.title || '', {
      x: 0.55, y: 1.78, w: 4.55, h: 2.1,
      fontSize: 32, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.55, y: 4.0, w: 4.55, h: 0.82,
        fontSize: 17, color: theme.subtextColor,
        fontFace: theme.fontBody, align: 'left',
      });
    }

    // Bottom strip on left panel
    this._rect(slide, pptx, 0, 5.33, 5.3, 0.295, theme.accent, 72);
  },

  _board_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var preset = this._IMG_PRESETS[sk] || this._IMG_PRESETS.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      this._rect(slide, pptx, 0, 0, 10, 5.625, '000000', 42);
    } else {
      this._gradBg(slide, pptx, theme, 160);
      this._oval(slide, pptx, 7.3, -1.2, 4.5, 4.5, theme.accent, 92);
    }

    // ── Angled left panel — the Boardroom signature divider ───
    // Solid base panel (left edge of slide)
    this._rect(slide, pptx, 0, 0, 0.6, 5.625, theme.bgGradient[1]);
    // RIGHT_TRIANGLE with rotate=90 creates the diagonal right edge of the panel:
    // right angle at TL, hypotenuse goes TR→BL, triangle fills upper-left of its bbox
    this._tri(slide, pptx, 0.6, 0, 0.5, 5.625, theme.bgGradient[1], 0, 90);
    // Accent strip on top of the panel (leftmost edge)
    this._rect(slide, pptx, 0, 0, 0.18, 5.625, theme.accent);

    // ── Title gradient band ───────────────────────────────────
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 1.2, y: 0, w: 8.8, h: 0.97,
      fill: { type: 'gradient', color: theme.bgGradient[1], color2: theme.bgGradient[0], angle: 0 },
      line: { color: theme.bgGradient[1] },
    });

    slide.addText(data.title || '', {
      x: 1.35, y: 0.1, w: 8.4, h: 0.76,
      fontSize: 23, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, valign: 'middle',
    });

    // ── Diagonal stripe graphic divider ───────────────────────
    this._diagStripe(slide, pptx, 0.97, theme.accent, 32, -2);

    // Bullets
    var tw = Math.max(this._textW(sk, hasImg, preset) - 1.2, 3.0);
    var bl = this._bullets(data, theme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 1.35, y: 1.18, w: tw, h: 4.2,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _board_summary(slide, pptx, data, theme) {
    this._gradBg(slide, pptx, theme, 160);
    this._oval(slide, pptx,  7.6,  2.3, 4.5, 4.5, theme.accent, 91);
    this._oval(slide, pptx, -0.7, -0.7, 3.0, 3.0, theme.accent, 93);

    this._rect(slide, pptx, 0, 0, 0.6, 5.625, theme.bgGradient[1]);
    this._tri(slide, pptx, 0.6, 0, 0.5, 5.625, theme.bgGradient[1], 0, 90);
    this._rect(slide, pptx, 0, 0, 0.18, 5.625, theme.accent);

    var hasImg = this._hasImg(data);
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 1.2, y: 0, w: 8.8, h: 1.32,
      fill: { type: 'gradient', color: theme.bgGradient[1], color2: theme.bgGradient[0], angle: 0 },
      line: { color: theme.bgGradient[1] },
    });

    slide.addText(data.title || 'Key Takeaways', {
      x: 1.35, y: 0.12, w: 8.4, h: 1.08,
      fontSize: 32, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, align: 'center', valign: 'middle',
    });

    this._diagStripe(slide, pptx, 1.32, theme.accent, 32, -2);

    var bl = this._bullets(data, theme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 1.35, y: 1.55, w: hasImg ? 5.5 : 8.2, h: 3.2,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 7.1, y: 1.55, w: 2.6, h: 1.95 });

    this._rect(slide, pptx, 3.5, 5.07, 3.2, 0.46, theme.accent, 15);
    slide.addText('Thank You!', {
      x: 3.5, y: 5.07, w: 3.2, h: 0.46,
      fontSize: 21, bold: true, color: 'FFFFFF',
      fontFace: theme.fontHead, align: 'center', valign: 'middle',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 3 — IMMERSIVE
  //  ● Full-bleed image on title slide (dramatic)
  //  ● Large bold RIGHT_TRIANGLE in corners as dominant graphic element
  //  ● Thick diagonal stripe as bold section divider
  //  ● Numbered bullets · bottom accent band on title
  // ════════════════════════════════════════════════════════════

  _imm_title(slide, pptx, data, theme) {
    if (this._hasImg(data)) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
    } else {
      slide.background = { color: theme.bgGradient[0] };
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: 10, h: 5.625,
        fill: { type: 'gradient', color: theme.bgGradient[0], color2: theme.bgGradient[1], angle: 125 },
        line: { color: theme.bgGradient[0] },
      });
      this._oval(slide, pptx, 5.2, 0.3, 5.8, 5.8, theme.accent, 86);
    }

    // Dark overlay for readability
    this._rect(slide, pptx, 0, 0, 10, 5.625, '000000', 38);

    // ── Large corner triangle — dominant graphic divider ──────
    // Top-right: rotate 180 → right angle at TR, diagonal BL→TR
    this._tri(slide, pptx, 5.2, 0, 4.8, 3.8, theme.accent, 40, 180);

    // ── Bottom accent band ────────────────────────────────────
    this._rect(slide, pptx, 0, 4.82, 10, 0.805, theme.accent);

    // Diagonal stripe at the top of the band (graphic divider)
    this._diagStripe(slide, pptx, 4.76, theme.accent, 10, -3);

    // Left vertical stripe
    this._rect(slide, pptx, 0, 0, 0.35, 5.625, theme.accent);

    // Title
    slide.addText(data.title || '', {
      x: 0.55, y: 1.7, w: 9.1, h: 2.95,
      fontSize: 42, bold: true, color: 'FFFFFF',
      fontFace: theme.fontHead, align: 'left', valign: 'bottom',
      shadow: { type: 'outer', color: '000000', blur: 10, offset: 3, angle: 45 },
    });

    // Subtitle in band
    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.55, y: 4.82, w: 9.1, h: 0.805,
        fontSize: 17, color: 'FFFFFF',
        fontFace: theme.fontBody, align: 'left', valign: 'middle',
      });
    }
  },

  _imm_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var preset = this._IMG_PRESETS[sk] || this._IMG_PRESETS.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      this._rect(slide, pptx, 0, 0, 10, 5.625, '000000', 40);
    } else {
      this._gradBg(slide, pptx, theme, 125);
      // ── Large corner triangles — dominant graphic dividers ──
      // Top-right large triangle
      this._tri(slide, pptx, 6.2, 0, 3.8, 3.2, theme.accent, 50, 180);
      // Bottom-left accent triangle
      this._tri(slide, pptx, 0, 4.0, 2.8, 1.625, theme.accent, 58, 0);
    }

    // ── Header gradient band ───────────────────────────────────
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 0.95,
      fill: { type: 'gradient', color: theme.bgGradient[1], color2: theme.bgGradient[0], angle: 0 },
      line: { color: theme.bgGradient[1] },
    });

    // Left accent strip on header
    this._rect(slide, pptx, 0, 0, 0.16, 0.95, theme.accent);

    slide.addText(data.title || '', {
      x: 0.3, y: 0.11, w: 9.4, h: 0.74,
      fontSize: 24, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, valign: 'middle',
    });

    // ── Diagonal stripe graphic divider below header ───────────
    this._diagStripe(slide, pptx, 0.95, theme.accent, 22, -3);

    // Right accent rule
    this._rect(slide, pptx, 9.84, 0, 0.16, 5.625, theme.accent, 55);

    // Numbered bullets (Immersive signature)
    var tw = this._textW(sk, hasImg, preset);
    var bl = this._bullets(data, theme, true);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.4, y: 1.12, w: tw, h: 4.28,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _imm_summary(slide, pptx, data, theme) {
    this._gradBg(slide, pptx, theme, 125);

    // Depth orbs
    this._oval(slide, pptx,  7.3,  1.8, 5.5, 5.5, theme.accent, 90);
    this._oval(slide, pptx, -0.5, -0.5, 3.5, 3.5, theme.accent, 93);

    // ── Large corner triangle graphic dividers ─────────────────
    this._tri(slide, pptx, 6.8, 0, 3.2, 3.2, theme.accent, 45, 180);   // top-right
    this._tri(slide, pptx, 0, 3.625, 3.2, 2.0, theme.accent, 50, 0);   // bottom-left

    // ── Full-width accent header ───────────────────────────────
    this._rect(slide, pptx, 0, 0, 10, 1.55, theme.accent);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.5, y: 0.15, w: 9, h: 1.25,
      fontSize: 36, bold: true, color: 'FFFFFF',
      fontFace: theme.fontHead, align: 'center', valign: 'middle',
    });

    // ── Diagonal stripe graphic divider below header ───────────
    this._diagStripe(slide, pptx, 1.55, theme.accent, 18, -3);

    // Small corner rules
    this._rule(slide, pptx, 0.5, 1.72, 1.4, theme.accent, 45);
    this._rule(slide, pptx, 8.1, 1.72, 1.4, theme.accent, 45);

    var hasImg = this._hasImg(data);
    var bl = this._bullets(data, theme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 1.0, y: 1.9, w: hasImg ? 5.8 : 8, h: 3.0,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 7.1, y: 1.9, w: 2.6, h: 1.95 });

    // ── Rounded pill "Thank You" ───────────────────────────────
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 3.5, y: 5.05, w: 3.0, h: 0.48,
      fill: { color: theme.accent },
      line: { color: theme.accent },
      rectRadius: 0.1,
    });
    slide.addText('Thank You!', {
      x: 3.5, y: 5.05, w: 3.0, h: 0.48,
      fontSize: 21, bold: true, color: 'FFFFFF',
      fontFace: theme.fontHead, align: 'center', valign: 'middle',
    });
  },
};
