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
    await this._prefillBase64Images(presentationData);
    const { pptx, fileName } = this._buildPptx(presentationData);
    await pptx.writeFile({ fileName });
  },

  // Build the same deck but return base64 (used to save into EDVA Course Content).
  async exportToBase64(presentationData) {
    await this._prefillBase64Images(presentationData);
    const { pptx, fileName } = this._buildPptx(presentationData);
    const base64 = await pptx.write({ outputType: 'base64' });
    return { base64, fileName };
  },

  async _prefillBase64Images(presentationData) {
    if (!presentationData?.slides) return;
    for (const slide of presentationData.slides) {
      if (slide.imageUrl && !slide.imageBase64) {
        const b64 = await this._urlToBase64(slide.imageUrl);
        if (b64) {
          slide.imageBase64 = b64;
        }
      }
    }
  },

  async _urlToBase64(url) {
    if (!url) return null;
    if (url.startsWith('data:image')) return url;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn('Failed to convert image to base64:', e);
      return null;
    }
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

    let slideIdx = 0;
    for (const slideData of presentationData.slides) {
      slideIdx++;
      if (!slideData.slideNumber) slideData.slideNumber = slideIdx;
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
    // Convert any $$LaTeX$$ to Unicode once, here, rather than at each of the
    // ~14 addText call sites across the four designs. The browser preview
    // renders math with KaTeX; PptxGenJS cannot, so without this the exported
    // .pptx shows raw "$$...$$" markup.
    data = this._deLatexSlide(data);
    const type = (data.type || 'content').toLowerCase();
    const map  = {
      executive: { title: '_exec_title', content: '_exec_content', summary: '_exec_summary' },
      boardroom: { title: '_board_title', content: '_board_content', summary: '_board_summary' },
      immersive: { title: '_imm_title',  content: '_imm_content',  summary: '_imm_summary'  },
      simple:    { title: '_simple_title', content: '_simple_content', summary: '_simple_summary' },
      modern:    { title: '_modern_title', content: '_modern_content', summary: '_modern_summary' },
      primary:   { title: '_primary_title', content: '_primary_content', summary: '_primary_summary' },
      explorer:  { title: '_explorer_title', content: '_explorer_content', summary: '_explorer_summary' },
      scholar:   { title: '_scholar_title', content: '_scholar_content', summary: '_scholar_summary' },
      achiever:  { title: '_achiever_title', content: '_achiever_content', summary: '_achiever_summary' },
      universal: { title: '_universal_title', content: '_universal_content', summary: '_universal_summary' },
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
    if ((data.imageFit || 'contain') === 'contain') {
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

  // Copy of a slide with every rendered text field de-LaTeX'd.
  _deLatexSlide(data) {
    if (!data) return data;
    var self = this;
    return Object.assign({}, data, {
      title: self._deLatex(data.title),
      subtitle: self._deLatex(data.subtitle),
      bullets: (data.bullets || []).map(function (b) { return self._deLatex(b); }),
    });
  },

  // Render $$...$$ LaTeX as plain Unicode for the .pptx.
  //
  // The browser preview renders formulas with KaTeX, but PptxGenJS has no math
  // support — without this, a chemistry or maths deck exports with literal
  // "$$Zn + 2HCl \rightarrow ZnCl_2 + H_2$$" on the slide. Unicode subscripts and
  // arrows are not as pretty as real math typesetting, but they are readable and
  // correct, which is what matters in a file a teacher projects to a class.
  _deLatex(str) {
    if (!str || str.indexOf('$') === -1) return str || '';

    var SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
                '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎','n':'ₙ','x':'ₓ','a':'ₐ','e':'ₑ','o':'ₒ' };
    var SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
                '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ' };
    var MACROS = [
      [/\\{1,2}(rightarrow|to|longrightarrow)\b/g, '→'],
      [/\\{1,2}(leftrightarrow|rightleftharpoons)\b/g, '⇌'],
      // Greek letters consume a trailing space: in LaTeX that space only
      // terminates the macro, so "\Delta H" is one symbol pair, "ΔH".
      // Operators above keep their spacing so equations stay readable.
      [/\\{1,2}Delta\b ?/g, 'Δ'], [/\\{1,2}delta\b ?/g, 'δ'],
      [/\\{1,2}alpha\b ?/g, 'α'], [/\\{1,2}beta\b ?/g, 'β'],
      [/\\{1,2}gamma\b ?/g, 'γ'], [/\\{1,2}theta\b ?/g, 'θ'],
      [/\\{1,2}lambda\b ?/g, 'λ'], [/\\{1,2}mu\b ?/g, 'μ'],
      [/\\{1,2}pi\b ?/g, 'π'], [/\\{1,2}rho\b ?/g, 'ρ'],
      [/\\{1,2}sigma\b ?/g, 'σ'], [/\\{1,2}omega\b ?/g, 'ω'],
      [/\\{1,2}times\b/g, '×'], [/\\{1,2}cdot\b/g, '·'],
      [/\\{1,2}div\b/g, '÷'], [/\\{1,2}pm\b/g, '±'],
      [/\\{1,2}leq\b/g, '≤'], [/\\{1,2}geq\b/g, '≥'],
      [/\\{1,2}neq\b/g, '≠'], [/\\{1,2}approx\b/g, '≈'],
      [/\\{1,2}infty\b/g, '∞'], [/\\{1,2}degree\b/g, '°'],
      [/\\{1,2}vec\s*\{([^{}]*)\}/g, '$1⃗'],
      [/\\{1,2}text\s*\{([^{}]*)\}/g, '$1'],
      [/\\{1,2}mathrm\s*\{([^{}]*)\}/g, '$1'],
      [/\\{1,2}left\b/g, ''], [/\\{1,2}right\b/g, ''],
    ];

    function mapChars(body, table) {
      var out = '';
      for (var i = 0; i < body.length; i++) {
        out += table[body[i]] !== undefined ? table[body[i]] : body[i];
      }
      return out;
    }

    function convert(math) {
      var m = math;
      // \frac{a}{b} → (a)/(b) — parentheses keep precedence unambiguous.
      m = m.replace(/\\{1,2}frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
      m = m.replace(/\\{1,2}sqrt\s*\{([^{}]*)\}/g, '√($1)');
      for (var i = 0; i < MACROS.length; i++) m = m.replace(MACROS[i][0], MACROS[i][1]);
      // Subscripts / superscripts, braced or single-character.
      m = m.replace(/_\{([^{}]*)\}/g, function (_, g) { return mapChars(g, SUB); });
      m = m.replace(/_(\w)/g, function (_, g) { return mapChars(g, SUB); });
      m = m.replace(/\^\{([^{}]*)\}/g, function (_, g) { return mapChars(g, SUP); });
      m = m.replace(/\^(\w)/g, function (_, g) { return mapChars(g, SUP); });
      // Whatever markup is left is noise on a slide — strip it.
      m = m.replace(/[{}]/g, '').replace(/\\{1,2}[a-zA-Z]+/g, '').replace(/\\{1,2}/g, '');
      return m.replace(/\s+/g, ' ').trim();
    }

    var out = str.replace(/\$\$([\s\S]+?)\$\$/g, function (_, math) { return convert(math); });
    out = out.replace(/\$([^$\n]+?)\$/g, function (_, math) { return convert(math); });
    // A stray unmatched delimiter must never reach the slide.
    return out.replace(/\$\$?/g, '');
  },

  // Maximum text column width respecting image column.
  //
  // The 0.75 gutter covers the widest left inset any design uses for its text box
  // (0.57 in Executive, 0.4 in Immersive) plus a visible gap. It was 0.5, which
  // let the Executive text box end 0.07" past the start of a medium image — only
  // rarely visible before, but now that every content slide is side-by-side it
  // would show on any slide with a long unbroken word.
  _textW(sk, hasImg, preset, composition) {
    if (!hasImg || sk === 'none' || sk === 'full') return 9.2;
    return (preset && preset.x ? preset.x : 6.5) - 0.75;
  },

  // Content slides always read text-left / image-right.
  //
  // This used to vary by image size and bullet count, which put the image on top
  // (pushing bullets into the lower half) for medium images with 5 bullets, and
  // flipped the image to the left for large ones. A classroom deck should be
  // visually consistent slide to slide, so the layout is now fixed.
  // Returns: 'text-left-image-right' | 'image-left-text-right' | 'image-top-text-bottom'
  _chooseComposition(sk, hasImg, bulletCount, totalChars) {
    return 'text-left-image-right';
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

    // Composition-aware layout
    var bulletCount = (data.bullets || []).length;
    var totalChars = (data.bullets || []).reduce(function(s, b) { return s + (b ? b.length : 0); }, 0);
    var composition = this._chooseComposition(sk, hasImg, bulletCount, totalChars);
    var tw = this._textW(sk, hasImg, preset, composition);
    var bl = this._bullets(data, theme);

    if (composition === 'image-left-text-right') {
      // Image on the left (mirrored), text on the right
      var presetL = { x: 0.57, y: preset.y, w: preset.w, h: preset.h };
      var textX = 0.57 + preset.w + 0.5;
      var twR = 9.6 - textX;
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: textX, y: 1.5, w: twR, h: 3.85,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
      this._placeImg(slide, data, presetL);
    } else if (composition === 'image-top-text-bottom') {
      // Image spanning full text width at top, bullets below
      var imgH = 1.6;
      this._placeImg(slide, data, { x: 0.57, y: 1.3, w: tw, h: imgH });
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: 0.57, y: 3.1, w: tw, h: 2.25,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
    } else {
      // Default: text-left-image-right (unchanged)
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: 0.57, y: 1.5, w: tw, h: 3.85,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
      if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
    }
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
    var presets = {
      small:  { x: 7.3, y: 2.43, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.13, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.80, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

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

    // Default: text-left-image-right layout
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
    // Gradient cover — no full-bleed background image on the title slide (a busy
    // content image behind the title text is unreadable). Matches preview.js.
    slide.background = { color: theme.bgGradient[0] };
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { type: 'gradient', color: theme.bgGradient[0], color2: theme.bgGradient[1], angle: 125 },
      line: { color: theme.bgGradient[0] },
    });
    this._oval(slide, pptx, 5.2, 0.3, 5.8, 5.8, theme.accent, 86);

    // Subtle overlay for depth (no image behind, so keep it light).
    this._rect(slide, pptx, 0, 0, 10, 5.625, '000000', 15);

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
    // "full" would put the image full-bleed behind the bullets — treat it as a
    // large CONTAINED image instead so text is never over a busy picture.
    var sk     = data.imageSize || 'medium';
    if (sk === 'full') sk = 'large';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var preset = this._IMG_PRESETS[sk] || this._IMG_PRESETS.medium;

    // Gradient background + decorative corner triangles (never full-bleed).
    this._gradBg(slide, pptx, theme, 125);
    // Top-right large triangle
    this._tri(slide, pptx, 6.2, 0, 3.8, 3.2, theme.accent, 50, 180);
    // Bottom-left accent triangle
    this._tri(slide, pptx, 0, 4.0, 2.8, 1.625, theme.accent, 58, 0);

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

    // Composition-aware layout (Immersive uses numbered bullets)
    var bulletCount = (data.bullets || []).length;
    var totalChars = (data.bullets || []).reduce(function(s, b) { return s + (b ? b.length : 0); }, 0);
    var composition = this._chooseComposition(sk, hasImg, bulletCount, totalChars);
    var tw = this._textW(sk, hasImg, preset, composition);
    var bl = this._bullets(data, theme, true);

    if (composition === 'image-left-text-right') {
      // Image on the left, text on the right
      var presetL = { x: 0.4, y: preset.y, w: preset.w, h: preset.h };
      var textX = 0.4 + preset.w + 0.5;
      var twR = 9.6 - textX;
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: textX, y: 1.12, w: twR, h: 4.28,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
      this._placeImg(slide, data, presetL);
    } else if (composition === 'image-top-text-bottom') {
      // Image spanning full text width at top, bullets below
      var imgH = 1.7;
      this._placeImg(slide, data, { x: 0.4, y: 1.12, w: tw, h: imgH });
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: 0.4, y: 3.02, w: tw, h: 2.38,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
    } else {
      // Default: text-left-image-right (unchanged)
      if (bl.items.length) {
        slide.addText(bl.items, {
          x: 0.4, y: 1.12, w: tw, h: 4.28,
          fontFace: theme.fontBody, valign: 'top',
        });
      }
      if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
    }
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

  // ════════════════════════════════════════════════════════════
  //  DESIGN 4 — SIMPLE
  //  ● Light background (no gradients, triangles, or dark overlays)
  //  ● Single thin accent rule under title
  //  ● Clean & elegant composition-aware body text and images
  // ════════════════════════════════════════════════════════════

  _simple_title(slide, pptx, data, theme) {
    slide.background = { color: theme.bgGradient[0] };
    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.7 : 8.8;

    slide.addText(data.title || '', {
      x: 0.7, y: 1.8, w: textW, h: 1.7,
      fontSize: 40, bold: true, lineSpacingMultiple: 1.02,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    // Single thin accent rule (0.05in tall) placed under the title
    this._rect(slide, pptx, 0.7, 3.65, 1.2, 0.05, theme.accent);

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 3.85, w: textW, h: 0.9,
        fontSize: 18, color: theme.subtextColor,
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.7, y: 0.9, w: 2.9, h: 3.85 });
    }
  },

  _simple_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: 'FFFFFF', transparency: 15 },
        line: { color: 'FFFFFF', transparency: 15 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: theme.textColor, fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    slide.background = { color: theme.bgGradient[0] };

    // Title + thin accent rule beneath title (no background bars or overlays)
    slide.addText(data.title || '', {
      x: 0.55, y: 0.42, w: 8.9, h: 0.75,
      fontSize: 26, bold: true,
      color: theme.textColor, fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });
    this._rect(slide, pptx, 0.57, 1.2, 1.5, 0.05, theme.accent);

    // Default: text-left-image-right layout
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

  _simple_summary(slide, pptx, data, theme) {
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

    this._rect(slide, pptx, 0.6, 5.0, 8.8, 0.04, theme.accent);
    slide.addText('Thank You', {
      x: 0.6, y: 5.08, w: 8.8, h: 0.45,
      fontSize: 16, bold: true,
      color: theme.accent, fontFace: theme.fontHead, align: 'left',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 5 — MODERN EDUCATIONAL
  //  ● Warm gradient background (tan-to-cream)
  //  ● Horizontal ribbon band divider
  //  ● Book badge icon (oval + geometric pages) in bottom-left
  //  ● Dark brown text for high contrast
  // ════════════════════════════════════════════════════════════

  _modern_bg(slide, pptx) {
    slide.background = { color: 'F0E0C0' };
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { type: 'gradient', color: 'F0E0C0', color2: 'E8D4A8', angle: 135 },
      line: { color: 'F0E0C0' },
    });
  },

  _modern_badge(slide, pptx) {
    this._oval(slide, pptx, 0.35, 4.4, 0.85, 0.85, '5C3A21');
    this._rect(slide, pptx, 0.55, 4.73, 0.2, 0.18, 'FFFFFF');
    this._rect(slide, pptx, 0.77, 4.73, 0.2, 0.18, 'FFFFFF');
  },

  _modern_title(slide, pptx, data, theme) {
    this._modern_bg(slide, pptx);
    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.6;

    // Horizontal ribbon band in lower third
    this._rect(slide, pptx, 0, 3.8, 10, 0.5, '7C4D25');

    // Book badge in bottom-left corner
    this._modern_badge(slide, pptx);

    slide.addText(data.title || '', {
      x: 0.7, y: 1.0, w: textW, h: 1.8,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: '4A2E1B', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 2.8, w: textW, h: 0.9,
        fontSize: 18, color: '6B4226',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 0.8, w: 2.9, h: 2.8 });
    }
  },

  _modern_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.60, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.30, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.96, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: 'FFFFFF', transparency: 15 },
        line: { color: 'FFFFFF', transparency: 15 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: '4A2E1B', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._modern_bg(slide, pptx);

    // Title
    slide.addText(data.title || '', {
      x: 0.6, y: 0.35, w: 8.8, h: 0.75,
      fontSize: 26, bold: true,
      color: '4A2E1B', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    // Horizontal ribbon band divider under title
    this._rect(slide, pptx, 0, 1.15, 10, 0.15, '7C4D25');

    // Book badge in bottom-left corner
    this._modern_badge(slide, pptx);

    var tw = this._textW(sk, hasImg, preset);
    var modernTheme = Object.assign({}, theme, { textColor: '4A2E1B', accent: '7C4D25' });
    var bl = this._bullets(data, modernTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: tw, h: 2.75,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _modern_summary(slide, pptx, data, theme) {
    this._modern_bg(slide, pptx);
    var hasImg = this._hasImg(data);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.4, w: hasImg ? 6.5 : 8.8, h: 0.8,
      fontSize: 30, bold: true,
      color: '4A2E1B', fontFace: theme.fontHead, align: 'left',
    });

    // Horizontal ribbon band divider
    this._rect(slide, pptx, 0, 1.25, 10, 0.15, '7C4D25');

    // Book badge in bottom-left corner
    this._modern_badge(slide, pptx);

    var modernTheme = Object.assign({}, theme, { textColor: '4A2E1B', accent: '7C4D25' });
    var bl = this._bullets(data, modernTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.5, w: hasImg ? 5.8 : 8.6, h: 2.70,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.5, w: 2.8, h: 2.2 });

    this._rect(slide, pptx, 1.35, 4.65, 8.0, 0.04, '7C4D25');
    slide.addText('Thank You', {
      x: 1.35, y: 4.73, w: 8.0, h: 0.45,
      fontSize: 16, bold: true,
      color: '7C4D25', fontFace: theme.fontHead, align: 'left',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 6 — PRIMARY (Class 3-5, Bright & Playful)
  //  ● Soft yellow-to-peach pastel gradient background ('FFF6D9' → 'FFE8A3')
  //  ● Small colorful decorative corner circles (Coral 'FF7A59' & Teal '2EC4B6')
  //  ● Dark navy text ('2B2D42') for high contrast readability
  // ════════════════════════════════════════════════════════════

  _primary_bg(slide, pptx) {
    slide.background = { color: 'FFF6D9' };
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 5.625,
      fill: { type: 'gradient', color: 'FFF6D9', color2: 'FFE8A3', angle: 135 },
      line: { color: 'FFF6D9' },
    });
  },

  _primary_shapes(slide, pptx) {
    // Coral circle top-right
    this._oval(slide, pptx, 9.1, 0.3, 0.6, 0.6, 'FF7A59');
    // Teal circle bottom-left
    this._oval(slide, pptx, 0.3, 4.7, 0.6, 0.6, '2EC4B6');
  },

  _primary_title(slide, pptx, data, theme) {
    this._primary_bg(slide, pptx);
    this._primary_shapes(slide, pptx);
    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.6;

    slide.addText(data.title || '', {
      x: 0.7, y: 1.2, w: textW, h: 1.8,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: '2B2D42', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 3.0, w: textW, h: 0.9,
        fontSize: 18, color: '4A5568',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 1.2, w: 2.9, h: 3.0 });
    }
  },

  _primary_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: 'FFFFFF', transparency: 15 },
        line: { color: 'FFFFFF', transparency: 15 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: '2B2D42', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._primary_bg(slide, pptx);
    this._primary_shapes(slide, pptx);

    // Title
    slide.addText(data.title || '', {
      x: 0.6, y: 0.4, w: 8.3, h: 0.75,
      fontSize: 26, bold: true,
      color: '2B2D42', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });
    this._rect(slide, pptx, 0.6, 1.2, 1.5, 0.05, 'FF7A59');

    var tw = this._textW(sk, hasImg, preset);
    var primaryTheme = Object.assign({}, theme, { textColor: '2B2D42', accent: 'FF7A59' });
    var bl = this._bullets(data, primaryTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.5, w: tw, h: 3.0,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _primary_summary(slide, pptx, data, theme) {
    this._primary_bg(slide, pptx);
    this._primary_shapes(slide, pptx);
    var hasImg = this._hasImg(data);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.4, w: hasImg ? 6.5 : 8.3, h: 0.8,
      fontSize: 30, bold: true,
      color: '2B2D42', fontFace: theme.fontHead, align: 'left',
    });
    this._rect(slide, pptx, 0.6, 1.25, 1.5, 0.05, 'FF7A59');

    var primaryTheme = Object.assign({}, theme, { textColor: '2B2D42', accent: 'FF7A59' });
    var bl = this._bullets(data, primaryTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.5, w: hasImg ? 5.8 : 8.6, h: 2.70,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.8, w: 2.8, h: 2.2 });

    this._rect(slide, pptx, 1.0, 4.65, 8.0, 0.04, '2EC4B6');
    slide.addText('Thank You!', {
      x: 1.0, y: 4.73, w: 8.0, h: 0.45,
      fontSize: 18, bold: true,
      color: '2B2D42', fontFace: theme.fontHead, align: 'center',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 7 — EXPLORER (Class 6-8, Structured & Energetic)
  //  ● Solid Deep Teal header band ('1B6B93') + Energetic Amber accent ('FFA630')
  //  ● Clean light gray slide body background ('F4F7F6')
  //  ● Geometric accent shapes (Triangles)
  // ════════════════════════════════════════════════════════════

  _explorer_bg(slide, pptx) {
    slide.background = { color: 'F4F7F6' };
  },

  _explorer_shapes(slide, pptx) {
    this._rect(slide, pptx, 0, 0, 10, 0.08, '1B6B93');
    this._rect(slide, pptx, 9.2, 0.2, 0.4, 0.4, 'FFA630');
  },

  _explorer_title(slide, pptx, data, theme) {
    this._explorer_bg(slide, pptx);

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 2.9,
      fill: { color: '1B6B93' },
      line: { color: '1B6B93' }
    });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 2.9, w: 10, h: 0.1,
      fill: { color: 'FFA630' },
      line: { color: 'FFA630' }
    });

    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.6;

    slide.addText(data.title || '', {
      x: 0.7, y: 0.8, w: textW, h: 1.8,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 3.4, w: textW, h: 0.9,
        fontSize: 18, bold: true, color: '1B6B93',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 1.2, w: 2.9, h: 3.0 });
    }
  },

  _explorer_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: '1B6B93', transparency: 10 },
        line: { color: 'FFA630', width: 2 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: 'FFFFFF', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._explorer_bg(slide, pptx);

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '1B6B93' },
      line: { color: '1B6B93' }
    });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 1.0, w: 10, h: 0.06,
      fill: { color: 'FFA630' },
      line: { color: 'FFA630' }
    });

    slide.addText(data.title || '', {
      x: 0.6, y: 0.15, w: 8.3, h: 0.75,
      fontSize: 26, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var tw = this._textW(sk, hasImg, preset);
    var explorerTheme = Object.assign({}, theme, { textColor: '1A2530', accent: 'FFA630' });
    var bl = this._bullets(data, explorerTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: tw, h: 3.5,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _explorer_summary(slide, pptx, data, theme) {
    this._explorer_bg(slide, pptx);
    var hasImg = this._hasImg(data);

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '1B6B93' },
      line: { color: '1B6B93' }
    });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 1.0, w: 10, h: 0.06,
      fill: { color: 'FFA630' },
      line: { color: 'FFA630' }
    });

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.15, w: hasImg ? 6.5 : 8.3, h: 0.75,
      fontSize: 28, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var explorerTheme = Object.assign({}, theme, { textColor: '1A2530', accent: 'FFA630' });
    var bl = this._bullets(data, explorerTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: hasImg ? 5.8 : 8.6, h: 2.80,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.6, w: 2.8, h: 2.2 });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 4.85, w: 10, h: 0.775,
      fill: { color: '1B6B93' },
      line: { color: '1B6B93' }
    });
    slide.addText('Thank You!', {
      x: 1.0, y: 4.95, w: 8.0, h: 0.55,
      fontSize: 20, bold: true,
      color: 'FFA630', fontFace: theme.fontHead, align: 'center',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 8 — SCHOLAR (Class 9-10, Clean & Studious)
  //  ● Clean light canvas ('FAFBFC') with Steel Blue academic accent ('2B5D8B')
  //  ● Subtle ruled horizontal line accent
  //  ● Section number markers ("01", "02")
  // ════════════════════════════════════════════════════════════

  _scholar_bg(slide, pptx) {
    slide.background = { color: 'FAFBFC' };
  },

  _scholar_shapes(slide, pptx) {
    // Thin ruled horizontal accent line near top margin
    this._rect(slide, pptx, 0.5, 1.05, 9.0, 0.02, '2B5D8B');
    // Subtle bottom ruler line
    this._rect(slide, pptx, 0.5, 5.2, 9.0, 0.01, 'CBD5E1');
  },

  _scholar_title(slide, pptx, data, theme) {
    this._scholar_bg(slide, pptx);

    // Left Steel Blue accent bar
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 0.15, h: 5.625,
      fill: { color: '2B5D8B' },
      line: { color: '2B5D8B' }
    });

    this._scholar_shapes(slide, pptx);

    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.4;

    // Academic Module badge header
    slide.addText('ACADEMIC MODULE', {
      x: 0.6, y: 0.5, w: textW, h: 0.4,
      fontSize: 12, bold: true,
      color: '2B5D8B', fontFace: theme.fontHead, align: 'left',
    });

    slide.addText(data.title || '', {
      x: 0.6, y: 1.3, w: textW, h: 1.8,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: '1E293B', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.62, y: 3.2, w: textW, h: 0.9,
        fontSize: 18, color: '475569',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 1.3, w: 2.9, h: 3.0 });
    }
  },

  _scholar_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: 'FFFFFF', transparency: 10 },
        line: { color: '2B5D8B', width: 2 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: '1E293B', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._scholar_bg(slide, pptx);
    this._scholar_shapes(slide, pptx);

    // Section Number Marker (e.g. "02", "03")
    var numStr = String(data.slideNumber || data.slideIndex || 1).padStart(2, '0');
    slide.addText(numStr, {
      x: 0.5, y: 0.2, w: 0.8, h: 0.7,
      fontSize: 28, bold: true,
      color: '2B5D8B', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    slide.addText(data.title || '', {
      x: 1.4, y: 0.2, w: 8.0, h: 0.75,
      fontSize: 26, bold: true,
      color: '1E293B', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var tw = this._textW(sk, hasImg, preset);
    var scholarTheme = Object.assign({}, theme, { textColor: '1E293B', accent: '2B5D8B' });
    var bl = this._bullets(data, scholarTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: tw, h: 3.5,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _scholar_summary(slide, pptx, data, theme) {
    this._scholar_bg(slide, pptx);
    this._scholar_shapes(slide, pptx);
    var hasImg = this._hasImg(data);

    // Section Number Marker
    var numStr = String(data.slideNumber || data.slideIndex || 1).padStart(2, '0');
    slide.addText(numStr, {
      x: 0.5, y: 0.2, w: 0.8, h: 0.7,
      fontSize: 28, bold: true,
      color: '2B5D8B', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    slide.addText(data.title || 'Key Takeaways', {
      x: 1.4, y: 0.2, w: hasImg ? 5.8 : 7.8, h: 0.75,
      fontSize: 28, bold: true,
      color: '1E293B', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var scholarTheme = Object.assign({}, theme, { textColor: '1E293B', accent: '2B5D8B' });
    var bl = this._bullets(data, scholarTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: hasImg ? 5.8 : 8.6, h: 2.80,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.6, w: 2.8, h: 2.2 });

    slide.addText('Summary & Conclusion', {
      x: 1.0, y: 4.85, w: 8.0, h: 0.45,
      fontSize: 16, bold: true,
      color: '2B5D8B', fontFace: theme.fontHead, align: 'center',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 9 — ACHIEVER (Class 11-12, Formal & Honors)
  //  ● Deep Burgundy header band ('3D1F2B') + Muted Gold accent ('C9A15C')
  //  ● Clean light paper background ('FCFBFA')
  //  ● Honors dossier report styling
  // ════════════════════════════════════════════════════════════

  _achiever_bg(slide, pptx) {
    slide.background = { color: 'FCFBFA' };
  },

  _achiever_shapes(slide, pptx) {
    // Subtle top gold accent line
    this._rect(slide, pptx, 0, 0, 10, 0.05, 'C9A15C');
  },

  _achiever_title(slide, pptx, data, theme) {
    this._achiever_bg(slide, pptx);

    // Deep Burgundy header block
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 3.0,
      fill: { color: '3D1F2B' },
      line: { color: '3D1F2B' }
    });

    // Muted Gold accent line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 3.0, w: 10, h: 0.05,
      fill: { color: 'C9A15C' },
      line: { color: 'C9A15C' }
    });

    this._achiever_shapes(slide, pptx);

    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.4;

    // Honors Dossier badge header
    slide.addText('HONORS DOSSIER', {
      x: 0.7, y: 0.6, w: textW, h: 0.4,
      fontSize: 12, bold: true,
      color: 'C9A15C', fontFace: theme.fontHead, align: 'left',
    });

    slide.addText(data.title || '', {
      x: 0.7, y: 1.1, w: textW, h: 1.7,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.72, y: 3.4, w: textW, h: 0.9,
        fontSize: 18, bold: true, color: '3D1F2B',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 1.2, w: 2.9, h: 3.0 });
    }
  },

  _achiever_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: '3D1F2B', transparency: 10 },
        line: { color: 'C9A15C', width: 2 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: 'FFFFFF', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._achiever_bg(slide, pptx);

    // Header Bar (Deep Burgundy)
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '3D1F2B' },
      line: { color: '3D1F2B' }
    });

    // Gold Accent Line
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 1.0, w: 10, h: 0.05,
      fill: { color: 'C9A15C' },
      line: { color: 'C9A15C' }
    });

    this._achiever_shapes(slide, pptx);

    slide.addText(data.title || '', {
      x: 0.6, y: 0.15, w: 8.3, h: 0.75,
      fontSize: 26, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var tw = this._textW(sk, hasImg, preset);
    var achieverTheme = Object.assign({}, theme, { textColor: '1F2421', accent: 'C9A15C' });
    var bl = this._bullets(data, achieverTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: tw, h: 3.5,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _achiever_summary(slide, pptx, data, theme) {
    this._achiever_bg(slide, pptx);

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '3D1F2B' },
      line: { color: '3D1F2B' }
    });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 1.0, w: 10, h: 0.05,
      fill: { color: 'C9A15C' },
      line: { color: 'C9A15C' }
    });

    this._achiever_shapes(slide, pptx);

    var hasImg = this._hasImg(data);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.15, w: hasImg ? 6.5 : 8.3, h: 0.75,
      fontSize: 28, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var achieverTheme = Object.assign({}, theme, { textColor: '1F2421', accent: 'C9A15C' });
    var bl = this._bullets(data, achieverTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: hasImg ? 5.8 : 8.6, h: 2.80,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.6, w: 2.8, h: 2.2 });

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 4.85, w: 10, h: 0.775,
      fill: { color: '3D1F2B' },
      line: { color: '3D1F2B' }
    });
    slide.addText('Summary & Conclusion', {
      x: 1.0, y: 4.95, w: 8.0, h: 0.55,
      fontSize: 18, bold: true,
      color: 'C9A15C', fontFace: theme.fontHead, align: 'center',
    });
  },

  // ════════════════════════════════════════════════════════════
  //  DESIGN 10 — UNIVERSAL (All Classes, Clean & Versatile)
  //  ● Light neutral background ('F5F7FA') + Muted Slate Blue accent ('5B7B9A')
  //  ● Unobtrusive, clean generic template for all age groups
  // ════════════════════════════════════════════════════════════

  _universal_bg(slide, pptx) {
    slide.background = { color: 'F5F7FA' };
  },

  _universal_shapes(slide, pptx) {
    // Subtle top slate blue accent line
    this._rect(slide, pptx, 0, 0, 10, 0.06, '5B7B9A');
  },

  _universal_title(slide, pptx, data, theme) {
    this._universal_bg(slide, pptx);

    // Left slate blue accent line beside title
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.6, y: 1.4, w: 0.06, h: 2.2,
      fill: { color: '5B7B9A' },
      line: { color: '5B7B9A' }
    });

    this._universal_shapes(slide, pptx);

    const hasImg = this._hasImg(data);
    const textW = hasImg ? 5.6 : 8.4;

    slide.addText(data.title || '', {
      x: 0.8, y: 1.3, w: textW, h: 1.8,
      fontSize: 38, bold: true, lineSpacingMultiple: 1.02,
      color: '2D3748', fontFace: theme.fontHead, align: 'left', valign: 'top',
    });

    if (data.subtitle) {
      slide.addText(data.subtitle, {
        x: 0.82, y: 3.2, w: textW, h: 0.9,
        fontSize: 18, color: '4A5568',
        fontFace: theme.fontBody, align: 'left',
      });
    }

    if (hasImg) {
      this._placeImg(slide, data, { x: 6.6, y: 1.2, w: 2.9, h: 3.0 });
    }
  },

  _universal_content(slide, pptx, data, theme) {
    var sk     = data.imageSize || 'medium';
    var hasImg = this._hasImg(data) && sk !== 'none';
    var presets = {
      small:  { x: 7.3, y: 2.57, w: 2.3, h: 1.73 },
      medium: { x: 6.5, y: 2.27, w: 3.1, h: 2.33 },
      large:  { x: 5.6, y: 1.94, w: 4.0, h: 3.0  },
    };
    var preset = presets[sk] || presets.medium;

    if (sk === 'full' && hasImg) {
      this._placeImg(slide, data, { x: 0, y: 0, w: 10, h: 5.625 });
      slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
        x: 0.3, y: 0.25, w: 9.4, h: 1.0,
        fill: { color: 'F5F7FA', transparency: 10 },
        line: { color: '5B7B9A', width: 2 },
        rectRadius: 0.05,
      });
      slide.addText(data.title || '', {
        x: 0.5, y: 0.35, w: 9, h: 0.8, fontSize: 28, bold: true,
        color: '2D3748', fontFace: theme.fontHead, valign: 'middle',
      });
      return;
    }

    this._universal_bg(slide, pptx);

    // Slate Blue Header Bar
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '5B7B9A' },
      line: { color: '5B7B9A' }
    });

    this._universal_shapes(slide, pptx);

    slide.addText(data.title || '', {
      x: 0.6, y: 0.15, w: 8.3, h: 0.75,
      fontSize: 26, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var tw = this._textW(sk, hasImg, preset);
    var universalTheme = Object.assign({}, theme, { textColor: '2D3748', accent: '5B7B9A' });
    var bl = this._bullets(data, universalTheme);

    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: tw, h: 3.5,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg && sk !== 'full') this._placeImg(slide, data, preset);
  },

  _universal_summary(slide, pptx, data, theme) {
    this._universal_bg(slide, pptx);

    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: 10, h: 1.0,
      fill: { color: '5B7B9A' },
      line: { color: '5B7B9A' }
    });

    this._universal_shapes(slide, pptx);

    var hasImg = this._hasImg(data);

    slide.addText(data.title || 'Key Takeaways', {
      x: 0.6, y: 0.15, w: hasImg ? 6.5 : 8.3, h: 0.75,
      fontSize: 28, bold: true,
      color: 'FFFFFF', fontFace: theme.fontHead, align: 'left', valign: 'middle',
    });

    var universalTheme = Object.assign({}, theme, { textColor: '2D3748', accent: '5B7B9A' });
    var bl = this._bullets(data, universalTheme);
    if (bl.items.length) {
      slide.addText(bl.items, {
        x: 0.6, y: 1.45, w: hasImg ? 5.8 : 8.6, h: 2.80,
        fontFace: theme.fontBody, valign: 'top',
      });
    }

    if (hasImg) this._placeImg(slide, data, { x: 6.8, y: 1.6, w: 2.8, h: 2.2 });

    slide.addText('Thank You', {
      x: 1.0, y: 4.85, w: 8.0, h: 0.45,
      fontSize: 18, bold: true,
      color: '5B7B9A', fontFace: theme.fontHead, align: 'center',
    });
  },
};
